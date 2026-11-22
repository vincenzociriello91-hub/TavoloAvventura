/* Ritratto pixel art a strati, generato dal codice (nessuna grafica esterna da licenziare).
   Cambia da solo con razza, aspetto, equipaggiamento indossato, ferite, punti ferita e condizioni. */
const Ritratto = (() => {
  const PELLE = { chiara: ['#f2c9a0', '#d9a77c'], olivastra: ['#d6a571', '#b7864f'], scura: ['#a26b45', '#7f5133'], 'molto scura': ['#6e452c', '#52321f'] };
  const CAPELLI = { nero: '#1f1a17', castano: '#5b3a21', biondo: '#e0b85a', rosso: '#b5452a', bianco: '#ece8de', grigio: '#9a978f', blu: '#3b5ea8', verde: '#3f7a3a' };
  const OCCHI = { marroni: '#5a3b1e', azzurri: '#4a90d9', verdi: '#4c9a4c', grigi: '#8a9099', ambra: '#d39a2a', rossi: '#c0392b', viola: '#8e5bc5' };
  const VESTITI = { Mago: ['#2f4c8f', '#223a70'], Stregone: ['#9b2f3a', '#76222b'], Warlock: ['#4b2d6b', '#371f50'], Chierico: ['#e8e2d0', '#c2bba4'], Paladino: ['#e3d9b8', '#bfb38a'], Druido: ['#4f7a3a', '#3b5e2b'], Ranger: ['#3f6b3a', '#2f522c'], Ladro: ['#3a3d45', '#2a2c33'], Bardo: ['#8b4fa8', '#6c3a85'], Barbaro: ['#7a5230', '#5e3e22'], Monaco: ['#d07a2a', '#a85f1d'], Guerriero: ['#8b3a2f', '#6d2c23'] };
  const DRAGO = { rosso: '#b8433a', blu: '#3d6db5', verde: '#3f8f4f', oro: '#d6a53a', argento: '#b9c0c8', nero: '#3a3a40', bianco: '#e2e4e8' };
  const ARM = { stoffa: ['#b9a98a', '#9a8a6c', null], cuoio: ['#7b4f2c', '#5f3c20', '#9a6a3c'], borchie: ['#6e4627', '#55351c', '#c9c9c9'], pelle: ['#8a6a48', '#6b5036', '#d8cfc0'], maglia: ['#9aa3ad', '#7a838d', '#c3cbd3'], scaglie: ['#8f9aa5', '#6e7884', '#b6c0ca'], piastre: ['#aeb7c0', '#858f99', '#e6edf3'], completa: ['#c3ccd5', '#8d97a1', '#f2f6fa'] };

  function ritratto(pg, opz = {}) {
    const px = [];
    const r = (x, y, w, h, c, extra = '') => { if (c) px.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"${extra}/>`); };
    const a = pg?.aspetto || {};
    const razza = pg?.razza || 'Umano', classe = pg?.classe || 'Guerriero';
    const ind = (pg?.equip || []).filter(e => e.indossato);
    const trova = test => ind.find(e => test(e.nome));
    const armatura = trova(n => ARMATURE[n]) ; const arm = armatura ? ARM[ARMATURE[armatura.nome].look] : null;
    const arma = trova(n => ARMI[n] || /spada|ascia|martello|mazza|lancia|arco|balestra|pugnale|bastone|stocco|falcione|scimitarra/i.test(n));
    const scudo = trova(n => SCUDI[n] !== undefined || /scudo/i.test(n));
    const elmo = trova(n => ELMI.includes(n) || /elmo|cappello|cappuccio|corona/i.test(n));
    const mantello = trova(n => /mantello/i.test(n));
    const amuleto = trova(n => /amuleto|collana|ciondolo|simbolo sacro/i.test(n));
    const pfRatio = pg?.pfMax ? Math.max(-1, pg.pf / pg.pfMax) : 1;
    const ko = pfRatio <= 0;
    const cond = new Set(pg?.condizioni || []);

    let [pelle, pelleOmbra] = PELLE[a.pelle] || PELLE.chiara;
    if (razza === 'Mezzorco') [pelle, pelleOmbra] = ['#7fa56b', '#628652'];
    if (razza === 'Tiefling') [pelle, pelleOmbra] = ['#c4574d', '#9c4038'];
    if (razza === 'Dragonide') { pelle = DRAGO[a.drago] || DRAGO.rosso; pelleOmbra = shade(pelle, -30); }
    if (pfRatio < 0.25 && !ko) { pelle = mix(pelle, '#d8d8d8', 0.35); }
    const capelli = CAPELLI[a.coloreCapelli] || (razza === 'Nano' ? CAPELLI.rosso : razza === 'Elfo' ? CAPELLI.biondo : CAPELLI.castano);
    const occhi = OCCHI[a.occhi] || (razza === 'Tiefling' ? OCCHI.ambra : OCCHI.marroni);
    const [vest, vestOmbra] = VESTITI[classe] || VESTITI.Guerriero;
    const piccolo = ['Halfling', 'Gnomo'].includes(razza);
    const tozzo = razza === 'Nano' || a.corporatura === 'robusta';
    const snello = razza === 'Elfo' || a.corporatura === 'snella';
    const veste = ['Mago', 'Stregone', 'Warlock', 'Chierico', 'Druido'].includes(classe) && !arm;

    // geometria
    const tx = tozzo ? 8 : snello ? 10 : 9, tw = tozzo ? 16 : snello ? 12 : 14; // busto
    const gy = tozzo ? 30 : 29; // inizio gambe

    // mantello dietro
    if (mantello) { const mc = a.coloreMantello || '#6b2737'; r(tx - 1, 18, tw + 2, 18, mc); r(tx - 2, 24, 1, 12, shade(mc, -25)); r(tx + tw + 1, 24, 1, 12, shade(mc, -25)); }
    // ombra a terra
    r(8, 39, 16, 1, 'rgba(0,0,0,.35)');
    // gambe e stivali
    const pant = arm && ['piastre', 'completa'].includes(ARMATURE[armatura.nome].look) ? arm[0] : '#4a3b2f';
    if (veste) { r(tx, gy - 2, tw, 8, vest); r(tx, gy + 5, tw, 1, vestOmbra); }
    else { r(11, gy, 4, 7, pant); r(17, gy, 4, 7, pant); r(15, gy, 2, 2, shade(pant, -15)); }
    r(10, 36, 5, 3, '#3b2a1e'); r(17, 36, 5, 3, '#3b2a1e'); r(10, 38, 5, 1, '#241910'); r(17, 38, 5, 1, '#241910');
    // busto
    r(tx, 18, tw, gy - 18, vest); r(tx, 18, 2, gy - 18, vestOmbra); r(tx, gy - 2, tw, 1, '#3b2a1e'); r(15, gy - 2, 2, 1, '#c9a227');
    if (classe === 'Barbaro' && !arm) { r(tx + 2, 19, tw - 4, 6, pelle); r(tx, 18, tw, 2, '#8a6a48'); }
    // braccia
    const bx1 = tx - 3, bx2 = tx + tw;
    const manica = veste ? vest : classe === 'Barbaro' && !arm ? pelle : shade(vest, -10);
    r(bx1, 18, 3, 9, manica); r(bx2, 18, 3, 9, manica);
    r(bx1, 27, 3, 2, pelle); r(bx2, 27, 3, 2, pelle);
    // armatura
    if (arm) {
      r(tx, 18, tw, gy - 19, arm[0]); r(tx, 18, 2, gy - 19, arm[1]); r(tx + tw - 1, 18, 1, gy - 19, arm[1]);
      if (ARMATURE[armatura.nome].look === 'maglia' || ARMATURE[armatura.nome].look === 'scaglie') for (let y = 19; y < gy - 1; y += 2) for (let x = tx + (y % 4 ? 1 : 2); x < tx + tw - 1; x += 2) r(x, y, 1, 1, arm[2]);
      if (ARMATURE[armatura.nome].look === 'borchie') for (let y = 20; y < gy - 2; y += 3) for (let x = tx + 2; x < tx + tw - 1; x += 3) r(x, y, 1, 1, arm[2]);
      if (['piastre', 'completa'].includes(ARMATURE[armatura.nome].look)) { r(tx + 3, 19, tw - 6, 4, arm[2]); r(tx + 2, 23, tw - 4, 1, arm[1]); r(bx1, 18, 3, 3, arm[0]); r(bx2, 18, 3, 3, arm[0]); r(bx1, 18, 3, 1, arm[2]); r(bx2, 18, 3, 1, arm[2]); }
      if (ARMATURE[armatura.nome].look === 'completa') { r(bx1, 21, 3, 6, arm[1]); r(bx2, 21, 3, 6, arm[1]); r(11, gy, 4, 6, arm[0]); r(17, gy, 4, 6, arm[0]); r(12, gy + 2, 2, 1, arm[2]); r(18, gy + 2, 2, 1, arm[2]); }
      if (ARMATURE[armatura.nome].look === 'pelle') { r(tx, 18, tw, 2, arm[2]); r(bx1, 18, 3, 2, arm[2]); r(bx2, 18, 3, 2, arm[2]); }
    }
    if (amuleto) { r(15, 19, 2, 1, '#c9a227'); r(15, 20, 2, 2, /simbolo/i.test(amuleto.nome) ? '#f1e3a0' : '#3fb6c8'); }
    // collo e testa
    r(14, 16, 4, 2, pelleOmbra);
    r(11, 6, 10, 10, pelle); r(11, 14, 10, 2, pelleOmbra); r(10, 9, 1, 4, pelle); r(21, 9, 1, 4, pelle);
    if (razza === 'Elfo' || razza === 'Mezzelfo') { r(9, 8, 1, 3, pelle); r(22, 8, 1, 3, pelle); if (razza === 'Elfo') { r(8, 7, 1, 2, pelle); r(23, 7, 1, 2, pelle); } }
    if (razza === 'Dragonide') { r(12, 12, 8, 4, pelleOmbra); r(13, 13, 1, 1, '#2a1a1a'); r(18, 13, 1, 1, '#2a1a1a'); for (let i = 0; i < 4; i++) r(12 + i * 2, 7, 1, 1, shade(pelle, 20)); }
    // occhi
    if (ko) { r(13, 10, 1, 1, '#222'); r(14, 11, 1, 1, '#222'); r(13, 12, 1, 1, '#222'); r(18, 10, 1, 1, '#222'); r(17, 11, 1, 1, '#222'); r(18, 12, 1, 1, '#222'); }
    else { r(13, 10, 2, 2, '#fff'); r(17, 10, 2, 2, '#fff'); r(14, 11, 1, 1, occhi); r(18, 11, 1, 1, occhi); r(13, 9, 2, 1, shade(capelli, -10)); r(17, 9, 2, 1, shade(capelli, -10)); }
    // bocca (cambia con i PF)
    if (razza !== 'Dragonide') {
      if (pfRatio >= 0.5) r(14, 13, 4, 1, '#8a4a3a');
      else if (pfRatio > 0) { r(14, 14, 4, 1, '#6a2a22'); r(14, 13, 1, 1, '#6a2a22'); r(17, 13, 1, 1, '#6a2a22'); }
      else r(14, 13, 4, 2, '#3a1a14');
    }
    if (razza === 'Mezzorco') { r(13, 13, 1, 1, '#f3efe2'); r(18, 13, 1, 1, '#f3efe2'); }
    // capelli
    const stile = a.capelli || (razza === 'Nano' ? 'corti' : razza === 'Elfo' ? 'lunghi' : 'corti');
    if (stile !== 'calvo' && !(elmo && /elmo/i.test(elmo.nome))) {
      r(10, 4, 12, 3, capelli); r(11, 3, 10, 1, capelli); r(10, 7, 1, 3, capelli); r(21, 7, 1, 3, capelli);
      if (stile === 'lunghi') { r(9, 7, 2, 11, capelli); r(21, 7, 2, 11, capelli); }
      if (stile === 'coda') { r(21, 6, 2, 2, capelli); r(22, 8, 2, 8, capelli); }
      if (stile === 'cresta') { px.length -= 4; r(14, 1, 4, 5, capelli); }
      if (stile === 'ricci') { for (let x = 9; x < 23; x += 2) r(x, 3 + (x % 4 ? 0 : 1), 2, 2, capelli); }
    }
    // barba
    const barba = a.barba || (razza === 'Nano' ? 'lunga' : 'nessuna');
    if (barba === 'corta') { r(11, 13, 10, 3, capelli); r(14, 13, 4, 1, '#8a4a3a'); }
    if (barba === 'lunga') { r(11, 13, 10, 4, capelli); r(12, 17, 8, 3, capelli); r(13, 20, 6, 2, capelli); r(14, 13, 4, 1, pfRatio >= 0.5 ? '#8a4a3a' : '#6a2a22'); }
    if (razza === 'Tiefling') { r(10, 2, 2, 3, '#3a2a2a'); r(20, 2, 2, 3, '#3a2a2a'); r(9, 1, 1, 2, '#3a2a2a'); r(22, 1, 1, 2, '#3a2a2a'); }
    // elmo / copricapo
    if (elmo) {
      if (/mago/i.test(elmo.nome)) { r(9, 4, 14, 2, vest); r(12, 1, 8, 3, vest); r(14, -2, 4, 3, vest); r(12, 4, 8, 1, '#c9a227'); }
      else if (/cappuccio/i.test(elmo.nome)) { r(10, 3, 12, 4, vestOmbra); r(9, 6, 2, 10, vestOmbra); r(21, 6, 2, 10, vestOmbra); }
      else if (/corona/i.test(elmo.nome)) { r(11, 3, 10, 2, '#d6a53a'); r(11, 1, 2, 2, '#d6a53a'); r(15, 1, 2, 2, '#d6a53a'); r(19, 1, 2, 2, '#d6a53a'); r(15, 3, 2, 1, '#c0392b'); }
      else { r(10, 3, 12, 5, '#9aa3ad'); r(10, 3, 12, 1, '#d4dbe1'); r(15, 7, 2, 5, '#9aa3ad'); r(10, 8, 1, 4, '#7a838d'); r(21, 8, 1, 4, '#7a838d'); }
    }
    // scudo (braccio sinistro di chi guarda)
    if (scudo) { const sc = /legno/i.test(scudo.nome) ? ['#8a5a2b', '#6b4420', '#b07a3c'] : ['#7d1f1f', '#5b1616', '#c9a227']; r(bx1 - 4, 19, 6, 10, sc[0]); r(bx1 - 4, 19, 6, 1, sc[2]); r(bx1 - 4, 28, 6, 1, sc[1]); r(bx1 - 2, 22, 2, 4, sc[2]); r(bx1 - 4, 19, 1, 10, sc[1]); }
    // arma (mano destra)
    if (arma) disegnaArma(r, (ARMI[arma.nome]?.look) || indovinaLook(arma.nome), bx2 + 1, 28);
    // ferite e bende
    for (const fe of (pg?.ferite || []).slice(-4)) {
      if (fe.zona === 'testa') { r(10, 7, 12, 2, '#efe9dc'); r(18, 7, 2, 2, '#b3261e'); }
      else if (fe.zona === 'braccio') { r(bx2, 22, 3, 2, '#efe9dc'); r(bx2 + 1, 22, 1, 1, '#b3261e'); }
      else if (fe.zona === 'gamba') { r(11, gy + 3, 4, 2, '#efe9dc'); r(12, gy + 3, 1, 1, '#b3261e'); }
      else { for (let i = 0; i < 7; i++) r(tx + 2 + i, 19 + i, 2, 1, '#efe9dc'); r(tx + 5, 22, 1, 1, '#b3261e'); }
    }
    if (pfRatio < 0.5 && !ko) { r(12, 15, 1, 1, '#b3261e'); r(tx + tw - 3, 25, 1, 2, '#b3261e'); r(19, 37, 2, 1, '#8e1c16'); }
    // condizioni
    if (cond.has('avvelenato')) { px.push('<rect x="0" y="0" width="32" height="40" fill="#5fbf3a" opacity=".22"/>'); r(23, 4, 2, 2, '#7bd34f'); r(25, 1, 1, 1, '#7bd34f'); r(6, 5, 1, 1, '#7bd34f'); }
    if (cond.has('spaventato')) { r(22, 7, 1, 2, '#9fd3f5'); r(9, 9, 1, 2, '#9fd3f5'); }
    if (cond.has('stordito')) { r(9, 0, 1, 1, '#ffd84a'); r(16, -1, 1, 1, '#ffd84a'); r(23, 0, 1, 1, '#ffd84a'); }
    if (cond.has('esausto')) { r(13, 12, 2, 1, '#7a5a5a'); r(17, 12, 2, 1, '#7a5a5a'); }

    const filtro = ko || cond.has('pietrificato') ? 'filter:grayscale(1) brightness(.8);' : '';
    const opac = cond.has('invisibile') ? 'opacity:.35;' : '';
    const ruota = cond.has('prono') || ko ? ' transform="rotate(90 16 20) translate(0 4)"' : '';
    const scala = piccolo ? ' transform="translate(2.4 7) scale(.85)"' : tozzo ? ' transform="translate(0 3) scale(1 .93)"' : '';
    const titolo = `${pg?.nome || 'Personaggio'}: ${razza} ${classe}${armatura ? ', ' + armatura.nome : ''}${arma ? ', ' + arma.nome : ''}${(pg?.ferite || []).length ? ', ferito' : ''}${ko ? ', privo di sensi' : ''}`;
    const dim = opz.dim || 160;
    return `<svg viewBox="-2 -3 36 44" width="${dim}" height="${dim * 44 / 36}" role="img" aria-label="${esc(titolo)}" style="shape-rendering:crispEdges;${filtro}${opac}"><title>${esc(titolo)}</title><g${ruota}><g${scala}>${px.join('')}</g></g>${ko ? '<text x="16" y="6" text-anchor="middle" font-size="5" font-family="monospace" fill="#ff6b5b">K.O.</text>' : ''}</svg>`;
  }

  function indovinaLook(n) {
    n = n.toLowerCase();
    if (/bipenne/.test(n)) return 'bipenne'; if (/ascia/.test(n)) return 'ascia'; if (/martello/.test(n)) return 'martello'; if (/mazza/.test(n)) return 'mazza';
    if (/arco/.test(n)) return 'arco'; if (/balestra/.test(n)) return 'balestra'; if (/pugnale/.test(n)) return 'pugnale'; if (/bastone/.test(n)) return 'bastone';
    if (/lancia|falcione|giavell/.test(n)) return 'lancia'; if (/spadone/.test(n)) return 'spadone'; return 'spada';
  }
  function disegnaArma(r, look, x, y) {
    const acc = '#d4dbe1', accO = '#8d97a1', legno = '#7a4f2a', oro = '#c9a227';
    switch (look) {
      case 'spada': r(x, y - 1, 1, 3, legno); r(x - 1, y - 2, 3, 1, oro); r(x, y - 12, 1, 10, acc); r(x + 1, y - 11, 1, 9, accO); break;
      case 'spadone': r(x, y - 1, 1, 4, legno); r(x - 2, y - 2, 5, 1, oro); r(x, y - 16, 2, 14, acc); r(x + 1, y - 15, 1, 13, accO); break;
      case 'spadacorta': r(x, y - 1, 1, 3, legno); r(x - 1, y - 2, 3, 1, oro); r(x, y - 9, 1, 7, acc); break;
      case 'stocco': r(x, y - 1, 1, 3, legno); r(x - 1, y - 2, 3, 1, oro); r(x - 1, y - 1, 1, 2, oro); r(x, y - 13, 1, 11, acc); break;
      case 'pugnale': r(x, y, 1, 2, legno); r(x - 1, y - 1, 3, 1, oro); r(x, y - 5, 1, 4, acc); break;
      case 'ascia': r(x, y - 10, 1, 13, legno); r(x + 1, y - 10, 3, 4, acc); r(x + 3, y - 11, 1, 6, accO); break;
      case 'bipenne': r(x, y - 14, 1, 17, legno); r(x - 4, y - 14, 4, 5, acc); r(x + 1, y - 14, 4, 5, acc); r(x - 4, y - 15, 1, 7, accO); r(x + 4, y - 15, 1, 7, accO); break;
      case 'martello': r(x, y - 11, 1, 14, legno); r(x - 2, y - 13, 5, 3, accO); r(x - 2, y - 13, 5, 1, acc); break;
      case 'mazza': r(x, y - 8, 1, 11, legno); r(x - 1, y - 11, 3, 3, accO); r(x - 2, y - 10, 1, 1, acc); r(x + 2, y - 10, 1, 1, acc); break;
      case 'bastone': r(x, y - 16, 1, 22, legno); r(x - 1, y - 18, 3, 2, '#5aa0d8'); break;
      case 'lancia': r(x, y - 16, 1, 22, legno); r(x - 1, y - 19, 3, 3, acc); r(x, y - 20, 1, 1, acc); break;
      case 'arco': r(x + 1, y - 12, 1, 2, legno); r(x + 2, y - 10, 1, 14, legno); r(x + 1, y + 4, 1, 2, legno); r(x, y - 10, 1, 14, '#e8e2d0'); break;
      case 'balestra': r(x - 1, y - 3, 5, 1, legno); r(x + 1, y - 6, 1, 8, legno); r(x - 1, y - 4, 1, 3, accO); r(x + 3, y - 4, 1, 3, accO); break;
    }
  }
  function shade(hex, amt) { const n = parseInt(hex.slice(1), 16); const c = v => Math.max(0, Math.min(255, v + amt)); return '#' + [c(n >> 16), c(n >> 8 & 255), c(n & 255)].map(v => v.toString(16).padStart(2, '0')).join(''); }
  function mix(a, b, t) { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); }
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  // Volto di un PNG ricavato dal nome: sempre lo stesso volto per lo stesso nome
  function volto(nome, dim = 56) {
    const n = String(nome || 'PNG'), l = n.toLowerCase();
    let h = 7; for (const c of n) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const scegli = arr => arr[h % arr.length], h2 = h >>> 5;
    const razza = /goblin|orco|orchetto|coboldo|mezzorco/.test(l) ? 'Mezzorco' : /nano/.test(l) ? 'Nano' : /elf/.test(l) ? 'Elfo' : /diavol|demon|tiefling/.test(l) ? 'Tiefling' : /drag/.test(l) ? 'Dragonide' : 'Umano';
    const equip = [];
    if (/guardia|soldat|capitan|cavalier|sentinella/.test(l)) equip.push({ nome: 'Elmo', indossato: true });
    if (/mago|maga|strega|stregone|incantat/.test(l)) equip.push({ nome: 'Cappello da mago', indossato: true });
    if (/\bre\b|regina|principe|principessa|duca|conte|signore di/.test(l)) equip.push({ nome: 'Corona', indossato: true });
    if (/ladr|assassin|incappucc|monaco|sacerdot/.test(l)) equip.push({ nome: 'Cappuccio', indossato: true });
    const classe = /mago|maga|strega/.test(l) ? 'Mago' : /sacerdot|priore|chieric/.test(l) ? 'Chierico' : /guardia|soldat|capitan/.test(l) ? 'Guerriero' : scegli(['Bardo', 'Ladro', 'Druido', 'Guerriero', 'Ranger']);
    const pg = { nome: n, razza, classe, equip, pf: 1, pfMax: 1, aspetto: { pelle: Object.keys(PELLE)[h % 4], capelli: scegli(['corti', 'lunghi', 'coda', 'ricci', 'calvo']), coloreCapelli: Object.keys(CAPELLI)[h2 % 6], barba: /a$|essa$|ina$|regina|strega/.test(l) ? 'nessuna' : ['nessuna', 'corta', 'lunga'][h2 % 3], occhi: Object.keys(OCCHI)[h2 % 5] } };
    // ritaglio sulla testa
    return ritratto(pg, { dim }).replace('viewBox="-2 -3 36 44"', 'viewBox="7 -2 18 22"').replace(/height="[^"]+"/, `height="${dim}"`);
  }
  return { svg: ritratto, volto, PELLE, CAPELLI, OCCHI, DRAGO };
})();
if (typeof module !== 'undefined') module.exports = { Ritratto };
