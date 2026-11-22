/* Figure animate Universal LPC (le stesse delle Cronache dei Varchi): camminata 9x4 da 64x64, righe su, sinistra,
   giù, destra. La figura si compone a strati dalla scheda: corpo, pelle, testa, capelli, barba, vestiti, armatura,
   elmo, mantello e arma indossati. Grafica LPC con licenze libere (crediti in lpc/crediti.json). */
const Lpc = (() => {
  let catalogo = null, tavolozze = null, caricando = null;
  const immagini = new Map(), fogli = new Map();
  let suPronto = () => {};
  function carica() {
    if (!caricando) caricando = Promise.all([fetch((window.LPC_BASE || '') + 'lpc/catalogo.json').then(r => r.json()), fetch((window.LPC_BASE || '') + 'lpc/tavolozze.json').then(r => r.json())])
      .then(([c, t]) => { catalogo = c; tavolozze = t; suPronto(); }).catch(() => { caricando = null; });
    return caricando;
  }
  function immagine(f) {
    let im = immagini.get(f);
    if (!im) { im = new Image(); im.onload = () => suPronto(); im.src = (window.LPC_BASE || '') + 'lpc/' + f; immagini.set(f, im); }
    return im.complete && im.naturalWidth ? im : null;
  }
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  // ricolora uno strato: i colori della tavolozza di partenza diventano quelli scelti, uno per uno
  function ricolora(im, mat, colori) {
    const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
    const k = c.getContext('2d'); k.drawImage(im, 0, 0);
    const mappa = new Map();
    for (const [m, base] of mat) {
      const tav = tavolozze[m]; if (!tav) continue;
      const da = tav.colori[base || tav.base], a = tav.colori[colori[m]];
      if (!da || !a || da === a) continue;
      da.forEach((col, i) => { const [r, g, b] = rgb(col); mappa.set((r << 16) | (g << 8) | b, rgb(a[Math.min(i, a.length - 1)])); });
    }
    if (!mappa.size) return c;
    const d = k.getImageData(0, 0, c.width, c.height), p = d.data;
    for (let i = 0; i < p.length; i += 4) { if (!p[i + 3]) continue; const n = mappa.get((p[i] << 16) | (p[i + 1] << 8) | p[i + 2]); if (n) { p[i] = n[0]; p[i + 1] = n[1]; p[i + 2] = n[2]; } }
    k.putImageData(d, 0, 0);
    return c;
  }
  // foglio della camminata già composto (canvas 576x256) oppure null finché i pezzi non sono scaricati
  function foglio(desc) {
    if (!desc) return null;
    const chiave = JSON.stringify(desc);
    if (fogli.has(chiave)) return fogli.get(chiave);
    if (!catalogo) { carica(); return null; }
    const strati = [];
    for (const s of desc.strati) for (const v of catalogo[s.pezzo] || []) { const f = v.file[desc.corpo] || v.file.male; if (f) strati.push({ z: v.z, f, mat: v.mat }); }
    const pronte = strati.map(s => immagine(s.f));
    if (pronte.some(x => !x)) return null;
    strati.forEach((s, i) => { s.im = pronte[i]; });
    const c = document.createElement('canvas'); c.width = 576; c.height = 256;
    const k = c.getContext('2d');
    strati.sort((a, b) => a.z - b.z).forEach(s => k.drawImage(s.mat.length ? ricolora(s.im, s.mat, desc.colori) : s.im, 0, 0));
    fogli.set(chiave, c);
    if (fogli.size > 40) fogli.delete(fogli.keys().next().value);
    return c;
  }
  const PELLE = { chiara: 'light', olivastra: 'olive', scura: 'brown', 'molto scura': 'black' };
  const CAPELLI = { nero: 'black', castano: 'dark_brown', biondo: 'blonde', rosso: 'redhead', bianco: 'white', grigio: 'gray', blu: 'blue', verde: 'green' };
  const TAGLIO = { corti: 'capelli_1', lunghi: 'capelli_2', coda: 'capelli_3', ricci: 'capelli_6', cresta: 'capelli_4', calvo: null };
  const ABITO = { Mago: 'navy', Stregone: 'maroon', Warlock: 'purple', Chierico: 'white', Paladino: 'tan', Druido: 'forest', Ranger: 'green', Ladro: 'charcoal', Bardo: 'rose', Monaco: 'orange', Barbaro: 'brown', Guerriero: 'bluegray' };
  const ARMATURA = { cuoio: ['cuoio'], borchie: ['cuoio'], pelle: ['cuoio'], maglia: ['cotta'], scaglie: ['cotta'], piastre: ['piastre', 'braccia_piastre'], completa: ['piastre', 'braccia_piastre', 'piedi_piastre'] };
  const ARMA = { spada: 'spada_lunga', spadone: 'spada_lunga', spadacorta: 'spada_corta', stocco: 'stocco', pugnale: 'pugnale', ascia: 'ascia', bipenne: 'ascia', martello: 'martello', mazza: 'mazza', bastone: 'bastone', lancia: 'bastone', arco: 'arco_corto', arcolungo: 'arco_lungo', balestra: 'balestra' };
  const DRAGO = { rosso: 'amber', blu: 'blue', verde: 'green', oro: 'amber', argento: 'light', nero: 'black', bianco: 'light' };
  // dalla scheda del personaggio
  function daPg(pg) {
    if (!pg || typeof ARMATURE === 'undefined') return null;
    const a = pg.aspetto || {}, razza = pg.razza || 'Umano', classe = pg.classe || 'Guerriero';
    const donna = a.figura === 'femminile';
    const corpo = ['Nano', 'Halfling', 'Gnomo'].includes(razza) ? 'teen' : donna ? 'female' : 'male';
    const pelle = razza === 'Mezzorco' ? 'green' : razza === 'Tiefling' ? 'lavender' : razza === 'Dragonide' ? DRAGO[a.drago] || 'amber' : PELLE[a.pelle] || 'light';
    const capelli = CAPELLI[a.coloreCapelli] || (razza === 'Nano' ? 'redhead' : razza === 'Elfo' ? 'blonde' : 'dark_brown');
    const ind = (pg.equip || []).filter(e => e.indossato), trova = re => ind.find(e => re.test(e.nome));
    const arm = ind.map(e => ARMATURE[e.nome]?.look).find(Boolean);
    const armaLook = ind.map(e => ARMI[e.nome]?.look || (/arco lungo/i.test(e.nome) ? 'arcolungo' : /arco/i.test(e.nome) ? 'arco' : /balestra/i.test(e.nome) ? 'balestra' : null)).find(Boolean);
    const taglio = TAGLIO[a.capelli || (razza === 'Elfo' ? 'lunghi' : 'corti')];
    const s = ['corpo'];
    s.push(razza === 'Mezzorco' ? (donna ? 'testa_orca' : 'testa_orco') : donna ? 'testa_donna' : 'testa_uomo');
    if (['Elfo', 'Mezzelfo', 'Drow'].includes(razza)) s.push('orecchie_elfo');
    if (razza === 'Tiefling') s.push('corna_1');
    if (razza === 'Dragonide') s.push('coda_1');
    s.push('pantaloni', 'stivali', ['Mago', 'Stregone', 'Warlock', 'Chierico', 'Druido'].includes(classe) && !arm ? 'tunica' : 'maglia');
    for (const p of ARMATURA[arm] || []) s.push(p);
    if (trova(/mantello/i)) s.push('mantello');
    if (trova(/elmo/i)) s.push('elmo'); else if (trova(/cappuccio/i)) s.push('cappuccio'); else if (trova(/corona|tiara/i)) s.push('corona');
    else { if (taglio) s.push(taglio); if (classe === 'Mago' && !donna) s.push('cappello_mago'); }
    if (!donna && (a.barba === 'lunga' || (razza === 'Nano' && !a.barba))) s.push('barba_3'); else if (!donna && a.barba === 'corta') s.push('barba_2');
    if (trova(/amuleto|simbolo sacro/i)) s.push('amuleto');
    if (ARMA[armaLook]) s.push(ARMA[armaLook]);
    return { corpo, colori: { body: pelle, hair: capelli, cloth: ABITO[classe] || 'bluegray', metal: 'steel', eye: 'brown' }, strati: s.map(pezzo => ({ pezzo })) };
  }
  const hash = s => [...String(s || '')].reduce((x, c) => (x * 31 + c.charCodeAt(0)) >>> 0, 7);
  // personaggi del master (PNG) e nemici con forma umana o di orco: aspetto stabile dal nome
  function daNome(nome, tipo) {
    const n = String(nome || '').toLowerCase(), h = hash(nome), pick = (arr, k = 0) => arr[(h >> k) % arr.length];
    const orco = /goblin|orco|orchi|hobgoblin|bugbear/.test(n);
    const umano = tipo === 'png' || /bandit|brigant|guardi|soldat|cultist|mago|strega|ladro|assassin|cavalier|mercenar|predon|pirat|negromant|sacerdot|capitan|elfo oscuro|drow|stregon/.test(n);
    if (tipo === 'nemico' && !orco && !umano) return null; // mostri: segnalino classico
    const donna = !orco && /(a|essa|ina)$/.test(n.split(' ')[0]) && !/guardia|spia/.test(n.split(' ')[0]);
    const s = ['corpo', orco ? (donna ? 'testa_orca' : 'testa_orco') : donna ? 'testa_donna' : /vecchi|anzian/.test(n) ? 'testa_anziano' : 'testa_uomo', 'pantaloni', 'stivali', pick(['maglia', 'tunica'], 3)];
    if (/nano/.test(n)) s.push('barba_3');
    if (/elf/.test(n)) s.push('orecchie_elfo');
    if (tipo === 'nemico') {
      s.push(orco ? 'cuoio' : pick(['cuoio', 'cotta', 'cuoio'], 2));
      if (/guardi|soldat|cavalier/.test(n)) s.push('elmo'); else if (/ladro|assassin|cultist|bandit/.test(n)) s.push('cappuccio'); else s.push(pick(['capelli_1', 'capelli_6', 'capelli_0'], 4));
      s.push(orco ? pick(['ascia', 'mazza', 'pugnale'], 5) : /mago|negromant|cultist|stregon/.test(n) ? 'verga' : pick(['spada_corta', 'pugnale', 'ascia', 'arco_corto'], 5));
    } else {
      if (/guardi|soldat/.test(n)) s.push('cotta', 'elmo', 'spada_corta'); else s.push(pick(['capelli_1', 'capelli_2', 'capelli_3', 'capelli_6', 'capelli_8', 'capelli_0'], 4));
      if (!donna && h % 3 === 0) s.push(pick(['barba_1', 'barba_2', 'baffi_1'], 6));
      if (/mago|stregon/.test(n)) s.push('cappello_mago', 'bastone');
    }
    return { corpo: /nano|halfling|gnomo|bambin/.test(n) ? 'teen' : donna ? 'female' : 'male', colori: { body: orco ? pick(['green', 'dark_green', 'pale_green'], 7) : pick(['light', 'amber', 'olive', 'taupe', 'bronze', 'brown'], 7), hair: pick(['black', 'dark_brown', 'chestnut', 'blonde', 'redhead', 'gray', 'white'], 8), cloth: tipo === 'nemico' ? pick(['maroon', 'black', 'charcoal', 'red'], 9) : pick(['brown', 'tan', 'forest', 'navy', 'maroon', 'slate', 'leather', 'walnut'], 9), metal: pick(['iron', 'steel', 'bronze'], 10), eye: 'brown' }, strati: s.map(pezzo => ({ pezzo })) };
  }
  return { carica, foglio, daPg, daNome, set suPronto(f) { suPronto = f; }, get pronto() { return !!catalogo; } };
})();
