// Tavolo d'Avventura — Aspetto da videogioco. Si carica per ultimo, nell'ordine scritto in index.html.
/* ============ OPZIONI DI ASPETTO E COMODITÀ ============ */
const menoMoto = () => OPZ.menoMoto ?? matchMedia('(prefers-reduced-motion: reduce)').matches;
const velocita = () => Math.max(0.5, Math.min(2, Number(OPZ.velocita) || 1));
const stileGioco = () => OPZ.stileGioco !== false;
function vibra(p) { if (OPZ.vibrazione !== false && !menoMoto() && navigator.vibrate) { try { navigator.vibrate(p); } catch {} } }
// numeri che volano sulla mappa: con i colori per daltonici le cure sono azzurre e i danni arancio
const coloreBene = () => OPZ.daltonici ? '#7fd4ff' : '#7dff8a', coloreMale = () => OPZ.daltonici ? '#ffab4a' : '#ff6a5a';
function applicaStile() {
  document.body.classList.toggle('gs', stileGioco());
  document.body.classList.toggle('meno-moto', menoMoto());
  document.body.classList.toggle('contrasto', !!OPZ.contrasto);
  document.body.classList.toggle('daltonici', !!OPZ.daltonici);
  Mappa.opzioni?.({ menoMoto: menoMoto(), velocita: velocita(), pixel: stileGioco(), simboli: true });
  Suoni.volMusica = OPZ.volMusica ?? 1; Suoni.volEffetti = OPZ.volEffetti ?? 1; Narratore.volume = OPZ.volVoce ?? 1;
  FondoVivo.aggiorna();
}

/* ============ VOLTI: un disegno per ogni personaggio, messo una volta sola nella pagina ============ */
const Volti = (() => {
  const uri = new Map(), classi = new Map(); let foglio = null, n = 0;
  const dati = svg => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.includes('xmlns=') ? svg : svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '));
  const pixel = (righe, tinte) => { const px = []; righe.forEach((r, y) => [...r].forEach((c, x) => { if (tinte[c]) px.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${tinte[c]}"/>`); })); return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${righe[0].length} ${righe.length}" shape-rendering="crispEdges">${px.join('')}</svg>`; };
  // il master: un cappuccio con due occhi che brillano
  const MASTER = pixel(['................', '.....mmmmmm.....', '....mMMMMMMm....', '...mMMMMMMMMm...', '..mMMkkkkkkMMm..', '..mMkkkkkkkkMm..', '..mMkykkkkykMm..', '..mMkkkkkkkkMm..', '..mMMkkkkkkMMm..', '..mMMMkkkkMMMm..', '.mMMMMMMMMMMMMm.', '.mMMMMmMMmMMMMm.', 'mMMMMMmMMmMMMMMm', 'mMMMMMMggMMMMMMm', 'mMMMMMMggMMMMMMm', 'mmmmmmmmmmmmmmmm'], { m: '#2a1a4a', M: '#6a45b0', k: '#140c20', y: '#ffe060', g: '#f6cf74' });
  const DADO = pixel(['.....kk.....', '...kkyykk...', '..kyyyyyyk..', '.kyyGyyGyyk.', '.kyGyyyyGyk.', 'kyyGyyyyGyyk', 'kyyyGyyGyyyk', '.kyyyGGyyyk.', '.kyyyyyyyyk.', '..kyyyyyyk..', '...kkyykk...', '.....kk.....'], { k: '#3a2408', y: '#f6cf74', G: '#9a6c1e' });
  const OGGETTO = { sistema: 'libro', scheda: 'armatura', comando: 'pergamena', luogo: 'mappa', combattimento: 'spada', gruppo: 'moneta', mondo: 'gemma', illustrazione: 'gemma', riepilogo: 'libro' };
  const testa = svg => svg.replace('viewBox="-2 -3 36 44"', 'viewBox="7 -2 18 22"').replace(/height="[^"]+"/, 'height="40"').replace(/width="[^"]+"/, 'width="40"');
  function tieni(chiave, fa) { let u = uri.get(chiave); if (!u) { try { u = dati(fa()); } catch { u = dati(MASTER); } uri.set(chiave, u); } return u; }
  const master = () => tieni('#master', () => MASTER);
  const nome = n0 => tieni('n:' + n0, () => Ritratto.volto(n0, 40));
  function pg(id) {
    const p = S.st?.pg?.[id]; if (!p) return nome(S.st?.membri?.[id]?.nome || '?');
    return tieni('p:' + JSON.stringify([p.nome, p.razza, p.classe, p.aspetto, (p.equip || []).filter(e => e.indossato).map(e => e.nome)]), () => testa(Ritratto.svg(p, { dim: 40 })));
  }
  const tipo = t => tieni('t:' + t, () => t === 'dado' ? DADO : Ritratto.icona(OGGETTO[t] || 'sacca', 24));
  // per le liste lunghe (il diario): la stessa figura sta in una regola sola del foglio di stile, non ripetuta in ogni riga
  function classe(u) {
    let c = classi.get(u);
    if (!c) { c = 'fc' + (n++); classi.set(u, c); if (!foglio) { foglio = document.createElement('style'); document.head.appendChild(foglio); } foglio.sheet.insertRule(`.${c} { background-image: url("${u}"); }`, foglio.sheet.cssRules.length); }
    return c;
  }
  // chi parla in una voce del diario
  function diEvento(d) {
    if (d.tipo === 'narrazione') return d.png ? nome(d.png) : master();
    if (['chat', 'parlato', 'comando'].includes(d.tipo) && d.chi && S.st?.membri?.[d.chi]) return pg(d.chi);
    return tipo(d.tipo);
  }
  const faccia = d => { const u = diEvento(d), piccola = u === tipo(d.tipo); return `<span class="faccia ${piccola ? 'piccola ' : ''}${classe(u)}" aria-hidden="true"></span>`; };
  // nell'ordine di iniziativa: personaggio, mostro disegnato o volto ricavato dal nome
  function diTurno(o) {
    if (o.tipo !== 'nemico' && S.st?.pg?.[o.id]) return pg(o.id);
    const m = S.st?.mostri?.[Mappa.nomeMostro?.(o.nome)];
    return m ? urlMedia('img', m) : nome(o.nome || '?');
  }
  return { master, nome, pg, tipo, faccia, diTurno };
})();

/* ============ SCRITTE CHE COMPAIONO LETTERA PER LETTERA ============ */
const Scrittura = (() => {
  let timer = null, el = null, pieno = '';
  const ferma = () => { clearInterval(timer); timer = null; };
  function finita() { el?.closest('.narrazione')?.classList.add('finita'); }
  function scrivi(dove, testo) {
    ferma(); el = dove; pieno = testo || '';
    dove.closest('.narrazione')?.classList.remove('finita');
    if (!stileGioco() || menoMoto() || !pieno) { dove.textContent = pieno; if (pieno) finita(); return; }
    dove.innerHTML = '<span class="scritto"></span><span class="da-scrivere"></span>';
    const a = dove.firstChild, b = dove.lastChild; b.textContent = pieno; dove.scrollTop = 0; let i = 0;
    timer = setInterval(() => {
      i = Math.min(pieno.length, i + Math.max(1, Math.round(2 * velocita())));
      a.textContent = pieno.slice(0, i); b.textContent = pieno.slice(i);
      const sotto = a.getBoundingClientRect().bottom - dove.getBoundingClientRect().bottom; if (sotto > 0) dove.scrollTop += sotto + 2;
      if (i >= pieno.length) { ferma(); dove.textContent = pieno; dove.scrollTop = dove.scrollHeight; finita(); }
    }, 33);
  }
  function tutto() { if (!timer || !el) return false; ferma(); el.textContent = pieno; finita(); return true; }
  return { scrivi, tutto };
})();
$('#narrazione').addEventListener('click', e => { if (!e.target.closest('button')) Scrittura.tutto(); });

/* ============ IL GRUPPO SEMPRE A VISTA ============ */
function renderHud() {
  const box = $('#hudGruppo'); if (!box) return;
  if (!S.st || !stileGioco() || document.body.classList.contains('tv')) { box.innerHTML = ''; return; }
  const c = S.st.combattimento, turno = c?.attivo ? c.ordine[c.turno]?.id : null;
  const ids = Object.keys(S.st.pg || {}).filter(id => S.st.pg[id]).sort((a, b) => (b === S.io) - (a === S.io));
  box.innerHTML = ids.map(id => {
    const pg = S.st.pg[id], f = pg.pfMax ? Math.max(0, Math.min(1, pg.pf / pg.pfMax)) : 1;
    return `<button type="button" class="hud-pg${id === S.io ? ' io' : ''}${turno === id ? ' turno' : ''}${pg.pf <= 0 ? ' ko' : ''}" data-hud="${esc(id)}" aria-label="${esc(pg.nome)}: ${pg.pf} punti ferita su ${pg.pfMax}${turno === id ? ', è il suo turno' : ''}"><img src="${Volti.pg(id)}" alt=""><b>${esc(String(pg.nome || '?').split(' ')[0])}</b><span class="vita"><i class="${f > 0.5 ? '' : f > 0.25 ? 'meta' : 'basso'}" style="width:${Math.round(f * 100)}%"></i></span></button>`;
  }).join('');
}
$('#hudGruppo').addEventListener('click', e => {
  const b = e.target.closest('[data-hud]'); if (!b) return;
  S.viewPg = b.dataset.hud; const sel = $('#selPg'); if (sel && [...sel.options].some(o => o.value === S.viewPg)) sel.value = S.viewPg;
  mostraVista('vScheda'); renderScheda(); Report.log('hud', { scheda: true });
});

/* ============ STRISCIONI SULLA MAPPA: turno, combattimento, nome del luogo ============ */
function striscione(titolo, sotto, faccia, cls, sempre) {
  const box = $('#mappaBox'); if (!box || !stileGioco()) return;
  // al centro della parte di mappa che si vede; se la mappa non è a schermo compare solo quando riguarda te
  const r = box.getBoundingClientRect(), su = Math.max(r.top, 64), giu = Math.min(r.bottom, innerHeight - (largo() ? 0 : 70)), visibile = box.offsetParent !== null && giu - su > 90;
  if (!visibile && !sempre) return;
  document.querySelectorAll('.striscione').forEach(e => e.remove());
  const el = document.createElement('div'); el.className = 'striscione ' + (cls || '');
  if (visibile) { el.style.top = Math.round((su + giu) / 2 - 40) + 'px'; el.style.left = Math.max(0, r.left) + 'px'; el.style.right = 'auto'; el.style.width = Math.min(r.width, innerWidth) + 'px'; }
  el.innerHTML = `${faccia ? `<img src="${faccia}" alt="">` : ''}<div><b>${esc(titolo)}</b>${sotto ? `<span>${esc(sotto)}</span>` : ''}</div>`;
  document.body.appendChild(el); setTimeout(() => el.remove(), 1800);
}
const TIPI_LUOGO = { citta: 'Città', villaggio: 'Villaggio', taverna: 'Taverna', dungeon: 'Sotterraneo', foresta: 'Foresta', grotta: 'Grotta', castello: 'Castello', porto: 'Porto', aperto: 'All\'aperto', interno: 'Interno' };
// si entra in un luogo nuovo: la mappa esce dal buio e compare il nome, come in un gioco di ruolo
function entraLuogo(l) {
  const box = $('#mappaBox'); if (!box || !l || !stileGioco() || box.offsetParent === null) return;
  box.querySelectorAll('.velo-luogo').forEach(e => e.remove());
  if (!menoMoto()) {
    const v = document.createElement('div'); v.className = 'velo-luogo';
    Object.assign(v.style, { inset: 'auto', top: box.scrollTop + 'px', left: box.scrollLeft + 'px', width: box.clientWidth + 'px', height: box.clientHeight + 'px' });
    box.appendChild(v); setTimeout(() => v.remove(), 950);
  }
  setTimeout(() => striscione(l.nome, TIPI_LUOGO[l.tipo] || '', null), 150);
  Suoni.effetto('fruscio');
}
function striscioneCombattimento(prima, c) {
  if (!c?.attivo) { if (prima?.attivo) striscione('Fine dello scontro', `dopo ${prima.round} round`, null); return; }
  const ora = c.ordine[c.turno]; if (!ora) return;
  if (!prima?.attivo) { striscione('Combattimento!', `Comincia ${ora.nome}`, Volti.diTurno(ora), 'rosso', true); Suoni.effetto('striscione'); vibra(60); return; }
  if (prima.ordine[prima.turno]?.id === ora.id && prima.round === c.round) return;
  striscione(ora.id === S.io ? 'Tocca a te!' : `Tocca a ${String(ora.nome).split(' ')[0]}`, `Round ${c.round}`, Volti.diTurno(ora), ora.tipo === 'nemico' ? 'rosso' : '', ora.id === S.io);
  if (ora.id === S.io) vibra([40, 40, 40]);
}

/* ============ COLPI CHE SI SENTONO ============ */
// un colpo va a segno: la figura lampeggia e arretra, la mappa trema, la musica si abbassa un attimo, il telefono vibra se è toccato a te
function colpoASegno(id, da, quanto, aMe) {
  const forte = quanto >= 0.34;
  Mappa.colpo(id, da, forte ? 1.8 : 1);
  Suoni.effetto('impatto'); if (forte) Suoni.effetto('colpo'); Suoni.abbassa(forte ? 600 : 450);
  if (aMe) vibra(forte ? [50, 30, 80] : 40);
}
// 1 naturale: il contrario del 20
function momentoFiasco(tiro) {
  if (!stileGioco()) return;
  const el = document.createElement('div'); el.className = 'epico fiasco';
  el.innerHTML = `<div><b>1</b><span>fallimento critico</span><small>${esc(tiro.nome || '')}${tiro.motivo ? ' · ' + esc(tiro.motivo) : ''}</small></div>`;
  document.body.appendChild(el); setTimeout(() => el.remove(), 2200); vibra([120, 60, 40]);
}

/* ============ TIRO DI PROVA DA VIDEOGIOCO ============ */
// difficoltà in alto, dado, bonus che vola sul dado, totale e verdetto. Vale per i miei tiri di d20 con un bonus o una difficoltà.
function provaInVista(tiro) {
  if (!stileGioco() || tiro.segreto || !/^1?d20/.test(tiro.formula || '')) return false;
  const a = S.provaAttesa, norm = x => String(x || '').toLowerCase().normalize('NFD').replace(/[^a-z ]/g, '').trim();
  const mia = a && Date.now() - a.t < 180000 && norm(tiro.motivo) && (norm(tiro.motivo).includes(norm(a.prova)) || norm(a.prova).includes(norm(tiro.motivo)));
  const cd = mia ? a.cd : null; if (mia) S.provaAttesa = null;
  if (cd == null && !tiro.mod) return false;
  mostraProva(tiro, cd); return true;
}
function mostraProva(tiro, cd) {
  document.querySelectorAll('.prova').forEach(e => e.remove());
  const el = document.createElement('div'); el.className = 'prova'; el.setAttribute('role', 'status');
  const dado = tiro.dadi?.[0] ?? tiro.totale - (tiro.mod || 0), scartato = tiro.scartati?.[0], riuscita = cd == null ? null : tiro.totale >= cd;
  el.innerHTML = `<div class="prova-testa"><span>${esc(tiro.motivo || 'Tiro')}${tiro.modo ? ` <small>${esc(tiro.modo)}</small>` : ''}</span>${cd != null ? `<span class="prova-cd">CD ${cd}</span>` : ''}</div>
    <div class="prova-conti"><span class="prova-dado${tiro.critico ? ' crit' : tiro.fallimento ? ' fail' : ''}">${dado}</span>${scartato !== undefined ? `<span class="prova-dado scartato">${scartato}</span>` : ''}${tiro.mod ? `<span class="prova-mod">${tiro.mod > 0 ? '+' : '−'}${Math.abs(tiro.mod)}</span>` : ''}<span class="prova-uguale">=</span><b class="prova-tot">${tiro.totale}</b></div>
    ${riuscita == null ? '' : `<div class="prova-esito ${riuscita ? 'ok' : 'ko'}">${riuscita ? 'Riuscita!' : 'Fallita'}</div>`}`;
  document.body.appendChild(el);
  const chiudi = () => el.remove(); el.addEventListener('click', chiudi);
  const passi = [...el.querySelectorAll('.prova-dado, .prova-mod, .prova-uguale, .prova-tot, .prova-esito')];
  if (menoMoto()) { passi.forEach(p => p.classList.add('su')); setTimeout(chiudi, 3600); return; }
  // se i dadi 3D stanno rotolando si aspetta che si fermino, poi i pezzi arrivano uno alla volta
  const attesa = OPZ.dadi3d !== false ? 1250 : 0, v = velocita(); let t = attesa;
  const nd = el.querySelector('.prova-dado');
  if (!attesa) { const giro = setInterval(() => { nd.textContent = 1 + Math.floor(Math.random() * 20); }, 50); setTimeout(() => { clearInterval(giro); nd.textContent = dado; }, 600 / v); t += 600 / v; }
  for (const p of passi) { setTimeout(() => { p.classList.add('su'); if (p.classList.contains('prova-esito')) { Suoni.effetto(riuscita ? 'successo' : 'fallimento'); vibra(riuscita ? 40 : [60, 40, 60]); } }, t); t += (p.classList.contains('prova-dado') ? 260 : 330) / v; }
  setTimeout(chiudi, t + 2400);
  Report.log('prova-vista', { cd, totale: tiro.totale, riuscita });
}

/* ============ PAESAGGIO VIVO IN PIXEL: schermata iniziale e mappa ancora vuota ============ */
const FondoVivo = (() => {
  const tele = [...document.querySelectorAll('.fondo-vivo')]; let timer = null; const t0 = performance.now();
  const rnd = k => { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const alt = (x, a, b, c) => Math.sin(x / a) * b + Math.sin(x / (a * 0.37) + 1.7) * b * 0.45 + Math.sin(x / (a * 0.13) + 4.1) * c;
  const mix = (A, B, k) => A.map((v, i) => Math.round(v + (B[i] - v) * k));
  const rgb = c => `rgb(${c[0]},${c[1]},${c[2]})`;
  function cielo(ora) {
    const N = [[10, 9, 30], [28, 24, 66], [52, 44, 98]], A = [[58, 74, 138], [201, 122, 132], [246, 201, 138]], G = [[52, 112, 200], [106, 165, 232], [191, 224, 246]], T = [[46, 42, 94], [176, 80, 106], [240, 154, 90]];
    const tra = (X, Y, k) => X.map((c, i) => mix(c, Y[i], k));
    if (ora < 5) return N; if (ora < 6.5) return tra(N, A, (ora - 5) / 1.5); if (ora < 8.5) return tra(A, G, (ora - 6.5) / 2);
    if (ora < 17) return G; if (ora < 19) return tra(G, T, (ora - 17) / 2); if (ora < 21) return tra(T, N, (ora - 19) / 2); return N;
  }
  function disegna(cv, t) {
    const c = cv.getContext('2d'), W = cv.width, H = cv.height, d = new Date(), ora = FondoVivo.ora ?? d.getHours() + d.getMinutes() / 60;
    const buio = ora < 6 || ora >= 20 ? 1 : ora < 7.5 ? 1 - (ora - 6) / 1.5 : ora >= 18.5 ? (ora - 18.5) / 1.5 : 0, col = cielo(ora), fuoco = cv.id === 'fondoVuoto';
    // cielo a fasce (niente sfumature lisce)
    const fasce = 14, hc = Math.round(H * 0.78);
    for (let i = 0; i < fasce; i++) { const k = i / (fasce - 1), cc = k < 0.5 ? mix(col[0], col[1], k * 2) : mix(col[1], col[2], (k - 0.5) * 2); c.fillStyle = rgb(cc); c.fillRect(0, Math.floor(i * hc / fasce), W, Math.ceil(hc / fasce) + 1); }
    // stelle, sole o luna
    if (buio > 0.3) for (let i = 0; i < 46; i++) { const lum = (Math.sin(t * 1.3 + i * 2.1) + 1) / 2; if (lum < 0.25) continue; c.fillStyle = `rgba(255,250,220,${(0.35 + lum * 0.6) * buio})`; c.fillRect(Math.floor(rnd(i) * W), Math.floor(rnd(i + 99) * hc * 0.8), 1, 1); }
    const arco = Math.max(0, Math.min(1, buio > 0.5 ? ((ora + 4) % 24) / 12 : (ora - 6) / 13)), ax = Math.round(W * (0.12 + 0.76 * arco)), ay = Math.round(hc * (0.62 - Math.sin(arco * Math.PI) * 0.46));
    c.fillStyle = buio > 0.5 ? '#f3f0d8' : '#ffe9a0'; for (let y = -5; y <= 5; y++) { const w = Math.round(Math.sqrt(30 - y * y)); c.fillRect(ax - w, ay + y, w * 2, 1); }
    if (buio > 0.5) { c.fillStyle = rgb(col[0]); for (let y = -4; y <= 4; y++) { const w = Math.round(Math.sqrt(20 - y * y)); c.fillRect(ax - w + 3, ay + y - 1, w * 2 - 2, 1); } }
    // nuvole lontane e vicine: scorrono a velocità diverse
    const nuv = mix([250, 250, 255], col[1], 0.35 + buio * 0.45);
    for (const [vel, yb, n, sc, a] of [[1.2, 0.2, 5, 1, 0.55], [3.2, 0.36, 4, 1.5, 0.8]]) for (let i = 0; i < n; i++) {
      const larg = (16 + rnd(i * 7 + vel) * 18) * sc, x = ((rnd(i * 3 + vel * 9) * (W + 80) + t * vel) % (W + 80)) - 40, y = Math.round(hc * (yb + rnd(i + vel) * 0.14));
      c.fillStyle = `rgba(${nuv},${a})`; c.fillRect(Math.round(x), y, Math.round(larg), 3); c.fillRect(Math.round(x + larg * 0.18), y - 2, Math.round(larg * 0.55), 2); c.fillRect(Math.round(x + larg * 0.1), y + 3, Math.round(larg * 0.7), 1);
    }
    // montagne lontane, colline vicine, primo piano: tre piani che scorrono a velocità diverse
    const viola = [44, 36, 78], mont = mix(mix([96, 108, 150], col[2], 0.35), viola, buio * 0.7), coll = mix(mix([58, 104, 70], col[2], 0.12), [20, 26, 44], buio * 0.72), terra = mix([40, 78, 52], [12, 16, 30], buio * 0.75);
    const sx1 = t * 0.8, sx2 = t * 2.2, sx3 = t * 5;
    for (let x = 0; x < W; x++) {
      const a = alt(x + sx1, 34, 13, 3), m = Math.round(hc * 0.62 + a); c.fillStyle = rgb(mont); c.fillRect(x, m, 1, H - m);
      if (a < -9) { c.fillStyle = rgb(mix(mont, [240, 240, 250], 0.6 - buio * 0.3)); c.fillRect(x, m, 1, 2); }
    }
    for (let x = 0; x < W; x++) { const y = Math.round(hc * 0.9 + alt(x + sx2, 52, 7, 1.5)); c.fillStyle = rgb(coll); c.fillRect(x, y, 1, H - y); }
    // castello sulle colline: ogni tanto ne passa uno, di notte ha le finestre accese
    for (let k = Math.floor(sx2 / 330) - 1; k <= Math.floor((sx2 + W) / 330) + 1; k++) {
      const wx = k * 330 + 120, x = Math.round(wx - sx2); if (x < -30 || x > W + 30) continue;
      const y = Math.round(hc * 0.9 + alt(wx, 52, 7, 1.5)), sass = rgb(mix(mix([120, 118, 132], col[2], 0.15), [30, 26, 48], buio * 0.75));
      c.fillStyle = sass; c.fillRect(x - 10, y - 12, 20, 13); c.fillRect(x - 14, y - 20, 7, 21); c.fillRect(x + 7, y - 20, 7, 21); c.fillRect(x - 3, y - 26, 6, 15);
      for (const tx of [-14, -11, 7, 10]) c.fillRect(x + tx, y - 22, 2, 2);
      c.fillRect(x - 3, y - 28, 2, 2); c.fillRect(x + 1, y - 28, 2, 2);
      c.fillStyle = buio > 0.3 ? `rgba(255,214,110,${0.75 + Math.sin(t * 3 + k) * 0.2})` : 'rgba(20,18,30,.7)'; c.fillRect(x - 12, y - 14, 2, 3); c.fillRect(x + 10, y - 14, 2, 3); c.fillRect(x - 1, y - 20, 2, 3); c.fillRect(x - 5, y - 7, 2, 2); c.fillRect(x + 3, y - 7, 2, 2);
      c.fillStyle = '#c0392b'; c.fillRect(x, y - 33, 1, 6); c.fillRect(x + 1, y - 33, 3 + (Math.floor(t * 4) % 2), 2);
    }
    // alberi in primo piano e striscia di terra
    const yt = H - 14; c.fillStyle = rgb(terra); c.fillRect(0, yt, W, 14);
    for (let k = Math.floor(sx3 / 23) - 1; k <= Math.floor((sx3 + W) / 23) + 1; k++) {
      if (rnd(k * 5.3) < 0.35) continue;
      const x = Math.round(k * 23 + rnd(k) * 12 - sx3), alto = 12 + Math.round(rnd(k * 2.7) * 12), y = yt + 2 + Math.round(rnd(k * 9.1) * 4), verde = rgb(mix(mix([34, 92, 58], [70, 130, 70], rnd(k * 1.9)), [10, 18, 30], buio * 0.78));
      c.fillStyle = rgb(mix([70, 46, 30], [14, 12, 22], buio * 0.7)); c.fillRect(x, y - 4, 2, 5);
      c.fillStyle = verde; for (let i = 0; i < alto; i++) { const w = 1 + Math.floor(i * 0.42) - (i % 4 === 3 ? 1 : 0), dond = i < alto / 2 ? Math.round(Math.sin(t * 1.6 + k) * 0.6) : 0; c.fillRect(x + 1 - w + dond, y - 4 - alto + i, w * 2, 1); }
    }
    // di notte le lucciole, di giorno qualche uccello
    if (buio > 0.4) for (let i = 0; i < 9; i++) { const x = (rnd(i * 4.4) * W + Math.sin(t * 0.7 + i) * 9 + W) % W, y = hc * 0.92 + rnd(i * 8.8) * (H - hc * 0.92 - 4) + Math.sin(t * 1.1 + i * 2) * 3; if (Math.sin(t * 2.2 + i * 1.7) > -0.2) { c.fillStyle = 'rgba(200,255,140,.9)'; c.fillRect(Math.round(x), Math.round(y), 1, 1); } }
    else for (let i = 0; i < 3; i++) { const x = Math.round(((rnd(i * 6.1) * (W + 60) + t * (7 + i * 2)) % (W + 60)) - 30), y = Math.round(hc * (0.22 + rnd(i * 2.2) * 0.3) + Math.sin(t * 2 + i) * 2), ala = Math.floor(t * 5 + i) % 2; c.fillStyle = 'rgba(30,26,40,.8)'; c.fillRect(x, y, 1, 1); c.fillRect(x - 1, y - ala, 1, 1); c.fillRect(x + 1, y - ala, 1, 1); }
    // falò del gruppo quando non c'è ancora un luogo
    if (fuoco) {
      const fx = Math.round(W / 2), fy = H - 9;
      const g = c.createRadialGradient(fx, fy - 3, 2, fx, fy - 3, 38); g.addColorStop(0, `rgba(255,170,70,${0.34 + Math.sin(t * 9) * 0.05})`); g.addColorStop(1, 'rgba(255,170,70,0)'); c.fillStyle = g; c.fillRect(fx - 40, fy - 40, 80, 50);
      c.fillStyle = '#3a2416'; c.fillRect(fx - 5, fy, 10, 2); c.fillRect(fx - 3, fy - 1, 7, 1);
      for (let i = 0; i < 7; i++) { const a = Math.floor(rnd(i + Math.floor(t * 8)) * 3); c.fillStyle = ['#ffe070', '#f09a3a', '#e2604a'][i % 3]; c.fillRect(fx - 3 + i, fy - 2 - a - (i === 3 ? 3 : i % 2), 1, 2 + a); }
      for (let i = 0; i < 4; i++) { const k = (t * 0.9 + i * 0.25) % 1; c.fillStyle = `rgba(255,200,110,${1 - k})`; c.fillRect(Math.round(fx + Math.sin(i * 3 + t) * 4), Math.round(fy - 6 - k * 22), 1, 1); }
      c.fillStyle = '#0d0a14'; for (const [dx, hh] of [[-15, 9], [-9, 8], [10, 9], [16, 8]]) { c.fillRect(fx + dx, fy - hh + 4, 4, hh - 3); c.fillRect(fx + dx, fy - hh, 4, 4); }
    }
  }
  function giro() { const t = (performance.now() - t0) / 1000 * velocita(); let visti = 0; for (const cv of tele) if (cv.offsetParent !== null) { visti++; try { disegna(cv, t); } catch (e) { console.error(e); } } return visti; }
  function aggiorna() {
    clearInterval(timer); timer = null;
    if (!stileGioco()) return;
    giro(); if (menoMoto()) return;
    timer = setInterval(() => { if (document.visibilityState === 'visible') giro(); }, 125);
  }
  return { aggiorna, giro, ora: null };
})();

/* ============ MENU VIVI: ogni tasto risponde ============ */
let ultimoTocco = 0;
document.addEventListener('click', e => {
  if (!Suoni.attivo || !stileGioco()) return;
  if (!e.target.closest('button, .bottone, summary, .segmentato span, .testa-piega')) return;
  const ora = performance.now(); if (ora - ultimoTocco < 90) return; ultimoTocco = ora;
  Suoni.effetto('tocco');
}, true);

/* ============ COMANDI DELLE OPZIONI ============ */
(() => {
  const spunte = { optStileGioco: ['stileGioco', true], optContrasto: ['contrasto', false], optMenoMoto: ['menoMoto', menoMoto()], optVibra: ['vibrazione', true], optDaltonici: ['daltonici', false], optLeggiTasti: ['leggiTasti', false] };
  for (const [id, [chiave, base]] of Object.entries(spunte)) {
    const el = $('#' + id); if (!el) continue;
    el.checked = OPZ[chiave] ?? base;
    el.addEventListener('change', e => { OPZ[chiave] = e.target.checked; scrivi('ta_opzioni', OPZ); applicaStile(); if (S.st) { renderTutto(); Mappa.adatta(); } Report.log('aspetto', { [chiave]: OPZ[chiave] }); });
  }
  const cursori = { optVolMusica: 'volMusica', optVolEffetti: 'volEffetti', optVolVoce: 'volVoce', optVelocita: 'velocita' };
  for (const [id, chiave] of Object.entries(cursori)) {
    const el = $('#' + id); if (!el) continue;
    el.value = OPZ[chiave] ?? 1;
    el.addEventListener('input', e => { OPZ[chiave] = Number(e.target.value); scrivi('ta_opzioni', OPZ); applicaStile(); });
  }
})();
applicaStile();

/* ============ LETTURA A VOCE DEI PULSANTI ============ */
// per chi vede poco: ogni pulsante, scheda o campo toccato si sente a voce (il nome del pulsante, o la sua descrizione)
(() => {
  const nomeDi = el => (el.getAttribute('aria-label') || el.title || (el.labels?.[0]?.textContent) || el.placeholder || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  const dici = t => { if (!t || !('speechSynthesis' in window)) return; try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = 'it-IT'; u.rate = 1.1; speechSynthesis.speak(u); } catch { /* niente voce su questo telefono */ } };
  document.addEventListener('click', e => { if (!OPZ.leggiTasti) return; const el = e.target.closest('button, summary, [role="button"], a, label.spunta, select'); if (el) dici(nomeDi(el)); }, true);
  document.addEventListener('focusin', e => { if (OPZ.leggiTasti && e.target.matches('input:not([type=checkbox]), textarea')) dici(nomeDi(e.target)); });
})();
