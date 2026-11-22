/* Mappa da battaglia in stile D&D, disegnata dal codice in modo realistico (vista dall'alto):
   terreno con texture, ombre dei muri, tetti, luci di fuochi e torce, oggetti di scena (fissi e movibili),
   personaggi con il loro ritratto. Il luogo è persistente: stessa mappa quando si torna, edifici e oggetti
   bruciati o rotti restano così. Tocco breve = muovi il tuo segnalino, pressione lunga = edificio. */
const Mappa = (() => {
  let cv, ctx, luogo = null, segnalini = {}, membri = {}, opz = {}, tile = 24, trascina = null, premi = null, dpr = 1, evidenzia = null;
  let extra = { aree: [], note: [], vedeTutto: false, movimento: null }, attesaArea = null;
  let cache = null, cacheChiave = '', bagliore = null, fiamme = [];
  // ambiente del gioco (dai Varchi): ora del giorno, meteo e stagione cambiano luce, ombre del sole, terreno e alberi
  let amb = { ora: null, meteo: '', stagione: '' };
  let particelle = [], lampo = 0, ultimoFotogramma = 0;
  let luceCelle = null, vista = null, vistaChiave = '';
  // posizione mostrata di ogni figura: scivola verso la casella vera camminando (figure LPC animate)
  const passi = new Map(); let inMovimento = false, ultimoPasso = 0;
  // effetti di battaglia: numeri dei danni, mosse d'attacco, esplosioni degli incantesimi, nemici sconfitti
  let effetti = [];
  let tileManuale = 0, gCache = null, pizzico = null, pan = null, dopoPizzico = false; const tocchi = new Map();
  const ritratti = new Map();
  const PIATTI = ['tappeto', 'ragnatela', 'ossa', 'funghi', 'macerie'];
  const PASSABILI = ['tappeto', 'ragnatela', 'ossa', 'funghi', 'macerie', 'torcia', 'candelabro']; // come il server (tavolo.js)
  const LUCI = { camino: [5, '255,140,50'], candelabro: [3.5, '255,200,110'], torcia: [4.5, '255,150,60'], funghi: [1.6, '90,220,200'], falo: [5, '255,140,50'], lampione: [3, '255,215,140'] };

  const cambiato = () => opz.onCambio?.();
  function setExtra(e) { extra = { ...extra, ...e }; disegna(); cambiato(); }
  function setAmbiente(a) {
    const n = { ora: a?.ora ?? null, meteo: a?.meteo || '', stagione: a?.stagione || '' };
    if (JSON.stringify(n) === JSON.stringify(amb)) return;
    amb = n; particelle = []; cacheChiave = ''; disegna(); cambiato();
  }
  const MESI_STAGIONE = ['inverno', 'inverno', 'primavera', 'primavera', 'primavera', 'estate', 'estate', 'estate', 'autunno', 'autunno', 'autunno', 'inverno'];
  const stagione = () => amb.stagione || MESI_STAGIONE[new Date().getMonth()];
  const ora = () => amb.ora ?? new Date().getHours() + new Date().getMinutes() / 60;
  const meteo = () => amb.meteo || 'sereno';
  const innevato = () => stagione() === 'inverno' && meteo() === 'neve' && esterno();
  // luce ambiente: livello 0..1 e colore. Fuori segue l'ora e il meteo; dentro è più bassa; sotto terra quasi buio.
  function luceAmbiente() {
    const tipo = luogo.tipo;
    if (tipo === 'dungeon') return { liv: 0.27, col: [0.6, 0.65, 0.95] };
    if (tipo === 'grotta') return { liv: 0.3, col: [0.6, 0.68, 0.9] };
    const o = ora(), notteOra = o < 5 || o >= 20.5;
    if (tipo === 'taverna' || tipo === 'interno') return notteOra ? { liv: 0.56, col: [0.95, 0.85, 0.75] } : { liv: 0.62, col: [1, 0.95, 0.88] };
    let liv, col;
    if (o >= 8 && o < 17) { liv = 1; col = [1, 1, 1]; }
    else if (o >= 5 && o < 8) { const k = (o - 5) / 3; liv = 0.3 + 0.7 * k; col = [1, 0.75 + 0.25 * k, 0.6 + 0.4 * k]; }
    else if (o >= 17 && o < 20.5) { const k = (o - 17) / 3.5; liv = 1 - 0.75 * k; col = [1, 0.82 - 0.2 * k, 0.7 - 0.15 * k]; }
    else { liv = 0.32; col = [0.55, 0.65, 1]; }
    liv *= { nuvoloso: 0.85, pioggia: 0.7, temporale: 0.55, neve: 0.92, nebbia: 0.85 }[meteo()] || 1;
    return { liv, col };
  }
  const notte = () => luceAmbiente().liv < 0.5;
  function chiediCasella(cb) { attesaArea = cb; cv.style.cursor = 'crosshair'; }
  function celleArea(a) {
    const out = [];
    for (let y = 0; y < luogo.h; y++) for (let x = 0; x < luogo.w; x++) {
      const dx = x - a.x, dy = y - a.y; let dentro = false;
      if (a.forma === 'cerchio') dentro = dx * dx + dy * dy <= a.dim * a.dim;
      else if (a.forma === 'quadrato') dentro = dx >= 0 && dy >= 0 && dx < a.dim && dy < a.dim;
      else {
        const [ax, ay] = { n: [0, -1], s: [0, 1], e: [1, 0], o: [-1, 0] }[a.dir || 'e'];
        const lungo = dx * ax + dy * ay, lato = Math.abs(dx * ay - dy * ax);
        dentro = a.forma === 'linea' ? lungo >= 1 && lungo <= a.dim && lato === 0 : lungo >= 1 && lungo <= a.dim && lato <= Math.floor(lungo / 2);
      }
      if (dentro) out.push([x, y]);
    }
    return out;
  }
  const h = (x, y, k = 0) => (((x * 73856093) ^ (y * 19349663) ^ (k * 83492791)) >>> 0);
  // generatore pseudo-casuale per casella: la stessa casella ha sempre lo stesso aspetto
  const rnd = (x, y, k = 0) => { let s = h(x, y, k) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 10000) / 10000; }; };

  function init(canvas, o) {
    cv = canvas; ctx = cv.getContext('2d'); opz = o;
    cv.addEventListener('pointerdown', giu); cv.addEventListener('pointermove', muovi); cv.addEventListener('pointerup', su); cv.addEventListener('pointercancel', ev => { tocchi.delete(ev.pointerId); trascina = null; pizzico = pan = null; cv.style.transform = ''; annullaPremi(); disegna(); });
    cv.addEventListener('wheel', ev => { if (!luogo) return; ev.preventDefault(); zoom(ev.deltaY > 0 ? 0.88 : 1.14, ev.clientX, ev.clientY); }, { passive: false });
    cv.addEventListener('contextmenu', e => e.preventDefault());
    new ResizeObserver(() => adatta()).observe(cv.parentElement);
    anima();
  }
  // animazione leggera (~15 fotogrammi al secondo) solo se la mappa si vede e c'è qualcosa che si muove
  function anima() {
    effetti = effetti.filter(e => performance.now() - e.t0 < e.durata);
    const vivo = luogo && cv.offsetParent !== null && document.visibilityState === 'visible' && (inMovimento || effetti.length || fiamme.length || (esterno() && ['pioggia', 'temporale', 'neve', 'nebbia'].includes(meteo())));
    if (vivo && !trascina) disegna(true);
    setTimeout(() => requestAnimationFrame(anima), inMovimento || effetti.length ? 40 : vivo ? 66 : 500);
  }
  // pioggia, neve, nebbia e lampi sopra la mappa (solo all'aperto)
  function meteoAnimato(t) {
    const m = meteo(); if (!esterno() || !['pioggia', 'temporale', 'neve', 'nebbia'].includes(m)) return;
    const W = luogo.w * t, H = luogo.h * t, adesso = performance.now(), dt = Math.min(0.1, (adesso - (ultimoFotogramma || adesso)) / 1000); ultimoFotogramma = adesso;
    const quante = m === 'temporale' ? 260 : m === 'pioggia' ? 170 : m === 'neve' ? 140 : 7;
    while (particelle.length < quante) particelle.push({ x: Math.random() * W, y: Math.random() * H, v: 0.6 + Math.random() * 0.6, f: Math.random() * 6.28 });
    if (m === 'nebbia') {
      for (const p of particelle) { p.x += dt * 8 * p.v; if (p.x > W + 200) p.x = -200; const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, t * 6); g.addColorStop(0, 'rgba(225,228,235,.22)'); g.addColorStop(1, 'rgba(225,228,235,0)'); ctx.fillStyle = g; ctx.fillRect(p.x - t * 6, p.y - t * 6, t * 12, t * 12); }
      return;
    }
    if (m === 'neve') {
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      for (const p of particelle) { p.y += dt * t * 1.6 * p.v; p.f += dt * 2; p.x += Math.sin(p.f) * 0.4; if (p.y > H) { p.y = -4; p.x = Math.random() * W; } ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(1, t / 18) * p.v * 1.4, 0, 7); ctx.fill(); }
      return;
    }
    ctx.strokeStyle = 'rgba(190,210,235,.45)'; ctx.lineWidth = Math.max(1, t / 28); ctx.beginPath();
    for (const p of particelle) { p.y += dt * t * 22 * p.v; p.x -= dt * t * 4 * p.v; if (p.y > H || p.x < 0) { p.y = -t; p.x = Math.random() * W * 1.1; } ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + t * 0.12, p.y - t * 0.55 * p.v); }
    ctx.stroke();
    ctx.fillStyle = 'rgba(20,30,50,.12)'; ctx.fillRect(0, 0, W, H);
    if (m === 'temporale') { if (lampo <= 0 && Math.random() < 0.004) { lampo = 1; opz.onLampo?.(); } if (lampo > 0) { ctx.fillStyle = `rgba(235,240,255,${lampo * 0.55})`; ctx.fillRect(0, 0, W, H); lampo -= dt * 3; } }
  }
  function adatta() {
    if (!cv || !luogo) return;
    const box = cv.parentElement.getBoundingClientRect();
    const maxH = opz.altezzaMax ? opz.altezzaMax() : 9999;
    // sul telefono la mappa non scende sotto i 22 px a casella: si scorre col dito invece di diventare illeggibile
    tile = tileManuale || Math.max(22, Math.floor(Math.min(box.width / luogo.w, maxH / luogo.h)));
    dpr = window.devicePixelRatio || 1;
    cv.width = luogo.w * tile * dpr; cv.height = luogo.h * tile * dpr;
    cv.style.width = luogo.w * tile + 'px'; cv.style.height = luogo.h * tile + 'px';
    cacheChiave = ''; disegna();
  }
  function imposta(l, s, m) { const nuovo = !luogo || !l || luogo.id !== l.id; if (l !== luogo) { cacheChiave = ''; gCache = null; } if (nuovo) tileManuale = 0; luogo = l; segnalini = s || {}; membri = m || membri; if (nuovo) adatta(); else disegna(); if (opz.vediTutto?.()) zoom('tutta'); cambiato(); }
  function aggiornaSegnalini(s) { segnalini = s || {}; disegna(); cambiato(); }
  function cella(x, y) { return luogo.celle[y]?.[x] ?? '#'; }
  const muro = c => c === '#' || c === 'w' || c === 'R';
  const esterno = () => ['citta', 'villaggio', 'porto', 'foresta', 'aperto', 'castello'].includes(luogo.tipo);
  const pavimento = () => ['taverna', 'interno'].includes(luogo.tipo) ? '=' : esterno() ? ',' : '_';
  const dentroEd = (e, x, y) => x >= e.x && x < e.x + e.w && y >= e.y && y < e.y + e.h;
  const casaDi = (x, y) => esterno() && luogo.edifici.find(e => dentroEd(e, x, y) && luogo.celle[e.y]?.[e.x] === '#');
  function ovale(c, x, y, rx, ry, col) { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fill(); }
  function rr(c, x, y, w, hh, r) { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, hh, r) : c.rect(x, y, w, hh); }
  function hsl(hh, s, l, a = 1) { return `hsla(${hh},${s}%,${l}%,${a})`; }

  /* ---------------- terreno ---------------- */
  function base(c, ch, x, y, t) {
    const r = rnd(x, y), X = x * t, Y = y * t, v = r();
    const tipo = luogo.tipo;
    let col;
    if (ch === '.' || ch === 'T' || (ch === 'R' && esterno())) { // all'aperto la roccia è un masso sul prato
      const st = stagione();
      col = innevato() ? hsl(210, 18, 86 + v * 6) : st === 'autunno' ? hsl(62 + v * 12, 32 + v * 8, tipo === 'foresta' ? 22 + v * 5 : 28 + v * 5) : st === 'inverno' ? hsl(85 + v * 12, 14 + v * 6, 30 + v * 5) : hsl(92 + v * 14, 30 + v * 8, tipo === 'foresta' ? 22 + v * 5 : 28 + v * 5);
    }
    else if (ch === ',') col = ['citta', 'castello'].includes(tipo) ? '#3d3833' : hsl(30, 28 + v * 6, 34 + v * 5);
    else if (ch === '_') col = tipo === 'grotta' ? hsl(30, 14, 36 + v * 6) : '#35312d';
    else if (ch === '=' || ch === '+' || ch === 'b') col = '#3b2a1c';
    else if (ch === '~') col = hsl(200, 45, 26 + v * 3);
    else if (ch === 'w') col = '#5e5952';
    else if (ch === 'R') col = '#171412';
    else if (ch === '#') col = '#211d1a';
    else if (ch === '^') col = '#2c2824';
    else if (ch === 'f') col = '#35312d';
    else col = '#35312d';
    c.fillStyle = col; c.fillRect(X, Y, t + 0.5, t + 0.5);
  }
  function texture(c, ch, x, y, t) {
    const r = rnd(x, y, 1), X = x * t, Y = y * t, tipo = luogo.tipo;
    if ((ch === '.' || ch === 'T') && innevato()) {
      for (let k = 0; k < 3; k++) ovale(c, X + r() * t, Y + r() * t, t * (0.3 + r() * 0.5), t * (0.2 + r() * 0.4), r() < 0.6 ? 'rgba(120,140,180,.14)' : 'rgba(255,255,255,.35)');
      for (let k = 0; k < 2; k++) if (r() < 0.35) { c.strokeStyle = 'rgba(60,80,40,.6)'; c.lineWidth = 1; const bx = X + r() * t, by = Y + r() * t; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + 1, by - t * 0.12); c.stroke(); }
    } else if (ch === '.' || ch === 'T') {
      for (let k = 0; k < 3; k++) ovale(c, X + r() * t, Y + r() * t, t * (0.3 + r() * 0.5), t * (0.2 + r() * 0.4), r() < 0.5 ? 'rgba(20,40,10,.18)' : 'rgba(150,180,90,.10)');
      if (stagione() === 'autunno') for (let k = 0; k < 4; k++) ovale(c, X + r() * t, Y + r() * t, t * 0.045, t * 0.03, ['#c8641e', '#d8a02a', '#a83a1e'][Math.floor(r() * 3)]);
      c.lineWidth = Math.max(1, t / 30); c.lineCap = 'round';
      for (let k = 0; k < 9; k++) { const bx = X + r() * t, by = Y + r() * t, l = t * (0.08 + r() * 0.1); c.strokeStyle = r() < 0.5 ? 'rgba(25,50,15,.55)' : 'rgba(140,175,80,.45)'; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + (r() - 0.5) * l, by - l); c.stroke(); }
      if (r() < (stagione() === 'primavera' ? 0.22 : stagione() === 'estate' ? 0.08 : 0.02)) for (let k = 0; k < 3; k++) ovale(c, X + r() * t, Y + r() * t, t * 0.04, t * 0.04, ['#f3e7a0', '#e8e8f0', '#e890b0', '#a0b8f0'][Math.floor(r() * 4)]);
    } else if (ch === ',') {
      if (['citta', 'castello'].includes(tipo)) {
        // ciottoli
        const n = 3, s = t / n;
        for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const o = (j % 2) * s / 2, v = r(); rr(c, X + i * s + o - s / 2 + 1, Y + j * s + 1, s - 2, s - 2, s * 0.35); c.fillStyle = hsl(30, 6 + v * 6, 40 + v * 14); c.fill(); }
        c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(X, Y, t, t * 0.1);
      } else {
        if (innevato()) for (let k = 0; k < 3; k++) ovale(c, X + r() * t, Y + r() * t, t * 0.35, t * 0.25, 'rgba(235,240,250,.45)');
        for (let k = 0; k < 3; k++) ovale(c, X + r() * t, Y + r() * t, t * (0.3 + r() * 0.4), t * (0.2 + r() * 0.3), r() < 0.5 ? 'rgba(60,40,20,.20)' : 'rgba(200,170,120,.12)');
        for (let k = 0; k < 6; k++) ovale(c, X + r() * t, Y + r() * t, t * 0.035, t * 0.03, r() < 0.5 ? '#9a8d78' : '#5c5040');
      }
    } else if (ch === '_' || ch === 'f' || ch === '^') {
      if (tipo === 'grotta') {
        for (let k = 0; k < 4; k++) ovale(c, X + r() * t, Y + r() * t, t * (0.2 + r() * 0.4), t * (0.15 + r() * 0.3), r() < 0.5 ? 'rgba(0,0,0,.18)' : 'rgba(170,150,120,.10)');
        for (let k = 0; k < 5; k++) ovale(c, X + r() * t, Y + r() * t, t * 0.03, t * 0.025, '#6e6458');
      } else {
        // lastre di pietra irregolari
        const split = r() < 0.5, a = 0.35 + r() * 0.3;
        const lastre = split ? [[0, 0, 1, a], [0, a, 0.5, 1 - a], [0.5, a, 0.5, 1 - a]] : [[0, 0, a, 1], [a, 0, 1 - a, 0.5], [a, 0.5, 1 - a, 0.5]];
        for (const [lx, ly, lw, lh] of lastre) {
          const v = r(), px = X + lx * t + 1, py = Y + ly * t + 1, pw = lw * t - 2, ph = lh * t - 2;
          c.fillStyle = hsl(35, 6 + v * 5, 40 + v * 12); c.fillRect(px, py, pw, ph);
          c.fillStyle = 'rgba(255,255,255,.07)'; c.fillRect(px, py, pw, Math.max(1, t / 24));
          c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(px, py + ph - Math.max(1, t / 24), pw, Math.max(1, t / 24));
          if (r() < 0.25) { c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1; c.beginPath(); c.moveTo(px + r() * pw, py); c.lineTo(px + r() * pw, py + ph); c.stroke(); }
        }
      }
    } else if (ch === '=' || ch === '+' || ch === 'b') {
      // assi di legno
      const n = 3, s = t / n;
      for (let j = 0; j < n; j++) {
        const v = r(), py = Y + j * s;
        c.fillStyle = hsl(27 + v * 6, 38 + v * 10, 26 + v * 10); c.fillRect(X, py + 0.5, t, s - 1);
        c.strokeStyle = 'rgba(255,220,170,.08)'; c.lineWidth = 1; for (let k = 0; k < 2; k++) { const gy = py + s * (0.3 + r() * 0.4); c.beginPath(); c.moveTo(X, gy); c.bezierCurveTo(X + t * 0.3, gy + (r() - 0.5) * 2, X + t * 0.6, gy + (r() - 0.5) * 2, X + t, gy); c.stroke(); }
        if ((h(x, y + j) % 3) === 0) { const sx = X + (0.2 + r() * 0.6) * t; c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(sx, py, 1, s); }
        if (r() < 0.12) ovale(c, X + r() * t, py + s / 2, t * 0.03, t * 0.03, 'rgba(40,25,10,.6)');
      }
    } else if (ch === '~') {
      c.strokeStyle = 'rgba(200,230,255,.16)'; c.lineWidth = Math.max(1, t / 22);
      for (let k = 0; k < 2; k++) { const wx = X + r() * t, wy = Y + r() * t, l = t * (0.2 + r() * 0.25); c.beginPath(); c.arc(wx, wy, l, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); }
      ovale(c, X + r() * t, Y + r() * t, t * 0.3, t * 0.15, 'rgba(10,30,50,.18)');
    } else if (ch === 'w') {
      const s = t / 2;
      for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const v = r(); c.fillStyle = hsl(40, 6, 46 + v * 12); c.fillRect(X + i * s + 1 - (j % 2) * s / 2, Y + j * s + 1, s - 2, s - 2); }
      c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(X, Y, t, t * 0.08); c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(X, Y + t * 0.92, t, t * 0.08);
      if ((x + y) % 2 === 0) { c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(X + t * 0.3, Y + t * 0.3, t * 0.4, t * 0.4); }
      if (y + 1 < luogo.h && !muro(cella(x, y + 1))) faccia(c, x, y, t, 40, 6, 44);
    } else if (ch === 'R' && !esterno() && y + 1 < luogo.h && !muro(cella(x, y + 1)) && cella(x, y + 1) !== '~') {
      // parete di roccia vista di fronte
      const g = c.createLinearGradient(X, Y + t * 0.35, X, Y + t); g.addColorStop(0, '#5a4e42'); g.addColorStop(1, '#2a241e');
      c.fillStyle = g; c.beginPath(); c.moveTo(X, Y + t * 0.45); for (let k = 0; k <= 4; k++) c.lineTo(X + k * t / 4, Y + t * (0.3 + r() * 0.25)); c.lineTo(X + t, Y + t); c.lineTo(X, Y + t); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1; for (let k = 0; k < 3; k++) { const px = X + r() * t; c.beginPath(); c.moveTo(px, Y + t * 0.5); c.lineTo(px + (r() - 0.5) * t * 0.2, Y + t); c.stroke(); }
    } else if (ch === 'R' && !esterno()) {
      for (let k = 0; k < 4; k++) { const v = r(); c.fillStyle = hsl(28, 8, 9 + v * 9); c.beginPath(); const cx = X + r() * t, cy = Y + r() * t, s = t * (0.25 + r() * 0.3); c.moveTo(cx - s, cy); c.lineTo(cx - s * 0.3, cy - s * 0.8); c.lineTo(cx + s * 0.7, cy - s * 0.5); c.lineTo(cx + s, cy + s * 0.3); c.lineTo(cx, cy + s * 0.8); c.closePath(); c.fill(); }
    } else if (ch === '#') {
      // muro: blocchi di pietra dove si affaccia su un pavimento, roccia piena altrove
      const affaccia = [[0, -1], [0, 1], [-1, 0], [1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]].some(([dx, dy]) => !muro(cella(x + dx, y + dy)) && cella(x + dx, y + dy) !== undefined && y + dy >= 0 && x + dx >= 0 && y + dy < luogo.h && x + dx < luogo.w);
      if (affaccia) {
        const s = t / 2;
        for (let j = 0; j < 2; j++) for (let i = -1; i < 2; i++) { const v = r(), bx = X + i * s + (j % 2 ? s / 2 : 0); c.fillStyle = hsl(25, 8, 16 + v * 9); c.fillRect(Math.max(X, bx + 1), Y + j * s + 1, Math.min(s - 2, X + t - bx - 1), s - 2); }
        c.fillStyle = 'rgba(255,255,255,.10)'; c.fillRect(X, Y, t, Math.max(1, t / 14));
        if (y + 1 < luogo.h && !muro(cella(x, y + 1)) && !casaDi(x, y)) faccia(c, x, y, t, 30, 8, 30);
      } else for (let k = 0; k < 3; k++) ovale(c, X + r() * t, Y + r() * t, t * 0.3, t * 0.2, 'rgba(255,255,255,.025)');
    }
  }
  // faccia frontale di un muro (rilievo): mattoni illuminati dall'alto, base in ombra
  function faccia(c, x, y, t, hh, s, l) {
    const X = x * t, Y = y * t, r = rnd(x, y, 5), top = Y + t * 0.48, alto = t * 0.52;
    const g = c.createLinearGradient(X, top, X, Y + t); g.addColorStop(0, hsl(hh, s, l + 8)); g.addColorStop(1, hsl(hh, s, l - 10));
    c.fillStyle = g; c.fillRect(X, top, t + 0.5, alto);
    c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1;
    for (let j = 1; j < 3; j++) { const ry = top + j * alto / 3; c.beginPath(); c.moveTo(X, ry); c.lineTo(X + t, ry); c.stroke(); }
    for (let j = 0; j < 3; j++) { const o = (j % 2) * t / 4 + r() * 2; for (let px = X + o; px < X + t; px += t / 2) { c.beginPath(); c.moveTo(px, top + j * alto / 3); c.lineTo(px, top + (j + 1) * alto / 3); c.stroke(); } }
    c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(X, top, t, Math.max(1, t / 18));
    c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(X, Y + t - Math.max(1, t / 14), t, Math.max(1, t / 14));
  }
  // ombre portate dai muri sul pavimento e schiuma sulle rive
  function ombre(c, ch, x, y, t) {
    const X = x * t, Y = y * t;
    if (!muro(ch) && ch !== '~' && !casaDi(x, y)) {
      const g = (x0, y0, x1, y1, a) => { const gr = c.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); return gr; };
      const mu = (dx, dy) => muro(cella(x + dx, y + dy)) && !casaDi(x + dx, y + dy);
      if (mu(0, -1)) { c.fillStyle = g(X, Y, X, Y + t * 0.55, 0.5); c.fillRect(X, Y, t, t * 0.55); }
      if (mu(-1, 0)) { c.fillStyle = g(X, Y, X + t * 0.45, Y, 0.4); c.fillRect(X, Y, t * 0.45, t); }
      if (mu(1, 0)) { c.fillStyle = g(X + t, Y, X + t * 0.7, Y, 0.25); c.fillRect(X + t * 0.7, Y, t * 0.3, t); }
      if (mu(0, 1)) { c.fillStyle = g(X, Y + t, X, Y + t * 0.75, 0.2); c.fillRect(X, Y + t * 0.75, t, t * 0.25); }
    }
    if (ch === '~') {
      c.strokeStyle = 'rgba(220,240,255,.35)'; c.lineWidth = Math.max(1, t / 14);
      [[0, -1, X, Y, X + t, Y], [0, 1, X, Y + t, X + t, Y + t], [-1, 0, X, Y, X, Y + t], [1, 0, X + t, Y, X + t, Y + t]].forEach(([dx, dy, a, b, cc, d]) => {
        const v = cella(x + dx, y + dy); if (v !== '~' && y + dy >= 0 && y + dy < luogo.h && x + dx >= 0 && x + dx < luogo.w) { c.beginPath(); c.moveTo(a, b); c.lineTo(cc, d); c.stroke(); }
      });
    }
  }
  // elementi strutturali delle caselle: porte, bancone, camino, scale, alberi
  function struttura(c, ch, x, y, t) {
    const X = x * t, Y = y * t, r = rnd(x, y, 2);
    if (ch === '+') {
      const vert = muro(cella(x, y - 1)) && muro(cella(x, y + 1));
      c.fillStyle = '#2a1f16'; c.fillRect(X, Y, t, t);
      c.fillStyle = '#7a5532';
      if (vert) c.fillRect(X + t * 0.3, Y + t * 0.05, t * 0.4, t * 0.9); else c.fillRect(X + t * 0.05, Y + t * 0.3, t * 0.9, t * 0.4);
      c.fillStyle = 'rgba(0,0,0,.35)'; for (let k = 1; k < 3; k++) vert ? c.fillRect(X + t * 0.3, Y + t * 0.05 + k * t * 0.3, t * 0.4, 1) : c.fillRect(X + t * 0.05 + k * t * 0.3, Y + t * 0.3, 1, t * 0.4);
      c.fillStyle = '#c9a24a'; vert ? ovale(c, X + t * 0.62, Y + t * 0.5, t * 0.04, t * 0.04, '#c9a24a') : ovale(c, X + t * 0.5, Y + t * 0.62, t * 0.04, t * 0.04, '#c9a24a');
    } else if (ch === 'b') {
      const gr = c.createLinearGradient(X, Y, X, Y + t); gr.addColorStop(0, '#6e4423'); gr.addColorStop(0.7, '#5a361b'); gr.addColorStop(1, '#3a2210');
      c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(X, Y + t * 0.85, t, t * 0.2);
      c.fillStyle = gr; c.fillRect(X - 0.5, Y + t * 0.1, t + 1, t * 0.75);
      c.fillStyle = 'rgba(255,220,160,.18)'; c.fillRect(X, Y + t * 0.1, t, t * 0.06);
      for (let k = 0; k < 2; k++) if (r() < 0.6) { const bx = X + r() * t * 0.8 + t * 0.1, by = Y + t * (0.3 + r() * 0.35); ovale(c, bx, by, t * 0.07, t * 0.07, ['#2f6b3a', '#7a2a24', '#d8c8a0', '#3a4a7a'][Math.floor(r() * 4)]); ovale(c, bx - t * 0.02, by - t * 0.02, t * 0.025, t * 0.025, 'rgba(255,255,255,.5)'); }
    } else if (ch === 'f') {
      c.fillStyle = '#4a4440'; rr(c, X - t * 0.05, Y, t * 1.1, t, t * 0.15); c.fill();
      c.fillStyle = '#1a1512'; rr(c, X + t * 0.12, Y + t * 0.18, t * 0.76, t * 0.65, t * 0.2); c.fill();
      c.strokeStyle = '#5a3a20'; c.lineWidth = t * 0.09; c.beginPath(); c.moveTo(X + t * 0.25, Y + t * 0.65); c.lineTo(X + t * 0.75, Y + t * 0.45); c.moveTo(X + t * 0.25, Y + t * 0.45); c.lineTo(X + t * 0.75, Y + t * 0.65); c.stroke();
      fiamma(c, X + t / 2, Y + t * 0.5, t * 0.32);
    } else if (ch === '^') {
      for (let k = 0; k < 5; k++) { c.fillStyle = hsl(30, 6, 42 - k * 6); c.fillRect(X + 1, Y + k * t / 5, t - 2, t / 5 - 1); }
      c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(X, Y, t * 0.08, t); c.fillRect(X + t * 0.92, Y, t * 0.08, t);
    }
  }
  function albero(c, x, y, t) {
    const r = rnd(x, y, 3), cx = x * t + t / 2 + (r() - 0.5) * t * 0.3, cy = y * t + t / 2 + (r() - 0.5) * t * 0.3, R = t * (0.62 + r() * 0.25);
    if (!sole()) ovale(c, cx + R * 0.2, cy + R * 0.25, R * 0.9, R * 0.75, 'rgba(0,0,0,.28)');
    const st = stagione(), pino = r() < (luogo.tipo === 'foresta' ? 0.35 : 0.2);
    if (st === 'inverno' && !pino) {
      // albero spoglio
      c.strokeStyle = '#4a3624'; c.lineCap = 'round';
      for (let k = 0; k < 7; k++) { const a = k / 7 * 6.28 + r(), l = R * (0.6 + r() * 0.4); c.lineWidth = Math.max(1, t / 14); c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * l, cy + Math.sin(a) * l); c.stroke(); c.lineWidth = 1; c.beginPath(); c.moveTo(cx + Math.cos(a) * l * 0.6, cy + Math.sin(a) * l * 0.6); c.lineTo(cx + Math.cos(a + 0.5) * l * 0.9, cy + Math.sin(a + 0.5) * l * 0.9); c.stroke(); }
      ovale(c, cx, cy, R * 0.16, R * 0.16, '#3a2a1a');
      if (innevato()) for (let k = 0; k < 6; k++) ovale(c, cx + (r() - 0.5) * R, cy + (r() - 0.5) * R, R * 0.08, R * 0.05, '#f0f4fa');
      return;
    }
    const tono = pino ? 140 + r() * 15 : st === 'autunno' ? 18 + r() * 30 : st === 'estate' ? 100 + r() * 20 : 90 + r() * 30;
    const sat = pino ? 30 : st === 'autunno' ? 65 : 40;
    for (let k = 0; k < 6; k++) { const a = r() * 6.28, d = R * 0.45 * r(); ovale(c, cx + Math.cos(a) * d, cy + Math.sin(a) * d, R * 0.55, R * 0.55, hsl(tono, sat, 18 + r() * 6)); }
    for (let k = 0; k < 5; k++) { const a = r() * 6.28, d = R * 0.35 * r(); ovale(c, cx + Math.cos(a) * d - R * 0.12, cy + Math.sin(a) * d - R * 0.15, R * 0.32, R * 0.3, hsl(tono, sat + 2, 27 + r() * 8)); }
    for (let k = 0; k < 4; k++) ovale(c, cx - R * 0.25 + r() * R * 0.3, cy - R * 0.3 + r() * R * 0.3, R * 0.12, R * 0.1, hsl(tono - 10, sat + 5, 40));
    if (innevato()) for (let k = 0; k < 5; k++) ovale(c, cx - R * 0.3 + r() * R * 0.5, cy - R * 0.35 + r() * R * 0.4, R * 0.18, R * 0.1, 'rgba(245,248,255,.9)');
  }
  function fiamma(c, x, y, s) {
    const g = c.createRadialGradient(x, y, 0, x, y, s); g.addColorStop(0, '#fff6c0'); g.addColorStop(0.35, '#ffb02e'); g.addColorStop(0.75, 'rgba(230,80,20,.85)'); g.addColorStop(1, 'rgba(200,40,10,0)');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, s, 0, 7); c.fill();
  }

  /* ---------------- edifici visti dall'esterno ---------------- */
  function tetto(c, e, t) {
    const X = e.x * t, Y = e.y * t, W = e.w * t, H = e.h * t, r = rnd(e.x, e.y, 4);
    if (e.id === 'pozzo') {
      const cx = X + W / 2, cy = Y + H / 2, R = Math.min(W, H) * 0.42;
      ovale(c, cx + R * 0.2, cy + R * 0.25, R * 1.05, R, 'rgba(0,0,0,.3)');
      ovale(c, cx, cy, R, R, '#7a746c'); ovale(c, cx, cy, R * 0.68, R * 0.68, '#14303f');
      c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1; for (let k = 0; k < 10; k++) { const a = k * 0.628; c.beginPath(); c.moveTo(cx + Math.cos(a) * R * 0.7, cy + Math.sin(a) * R * 0.7); c.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); c.stroke(); }
      c.strokeStyle = '#5a3a20'; c.lineWidth = t * 0.12; c.beginPath(); c.moveTo(cx - R * 1.05, cy); c.lineTo(cx + R * 1.05, cy); c.stroke();
      return;
    }
    if (!(esterno() && luogo.celle[e.y]?.[e.x] === '#')) return;
    // ombra dell'edificio
    if (!sole()) { c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(X + t * 0.2, Y + t * 0.25, W, H); }
    if (e.stato === 'distrutto') {
      c.fillStyle = '#3a342e'; c.fillRect(X, Y, W, H);
      for (let k = 0; k < e.w * e.h * 5; k++) { const v = r(); c.fillStyle = hsl(30, 6, 25 + v * 25); c.beginPath(); const px = X + r() * W, py = Y + r() * H, s = t * (0.08 + r() * 0.18); c.moveTo(px - s, py); c.lineTo(px, py - s * 0.8); c.lineTo(px + s, py + s * 0.2); c.lineTo(px - s * 0.2, py + s); c.closePath(); c.fill(); }
      c.strokeStyle = '#2a1a10'; c.lineWidth = t * 0.1; for (let k = 0; k < e.w; k++) { c.beginPath(); const px = X + r() * W, py = Y + r() * H; c.moveTo(px, py); c.lineTo(px + (r() - 0.5) * t * 2, py + (r() - 0.5) * t * 2); c.stroke(); }
      return;
    }
    const tempio = /^(Tempio|Cappella)/.test(e.nome), locanda = /^Locanda/.test(e.nome);
    const colore = tempio ? [225, 18, 42] : locanda ? [12, 48, 36] : e.nome === 'Mastio' || /^Torre/.test(e.nome) ? [30, 6, 40] : [18 + r() * 10, 40, 34 + r() * 6];
    const orizz = W >= H;
    const meta = (lato) => { const [hh, s, l] = colore; return hsl(hh, s, l + (lato ? 6 : -6)); };
    if (e.stato === 'bruciato') {
      c.fillStyle = '#1e1814'; c.fillRect(X, Y, W, H);
      c.strokeStyle = '#3a2516'; c.lineWidth = t * 0.14;
      for (let k = 0; k <= (orizz ? e.w : e.h); k++) { c.beginPath(); if (orizz) { c.moveTo(X + k * t, Y); c.lineTo(X + k * t + (r() - 0.5) * t * 0.4, Y + H); } else { c.moveTo(X, Y + k * t); c.lineTo(X + W, Y + k * t + (r() - 0.5) * t * 0.4); } c.stroke(); }
      for (let k = 0; k < e.w * e.h * 3; k++) ovale(c, X + r() * W, Y + r() * H, t * 0.05, t * 0.05, r() < 0.4 ? '#ff7a2a' : '#4a4038');
      for (let k = 0; k < 3; k++) ovale(c, X + r() * W, Y + r() * H, t * 0.8, t * 0.6, 'rgba(120,115,110,.18)');
      return;
    }
    // tetto a due falde con tegole
    const gr = orizz ? c.createLinearGradient(X, Y, X, Y + H) : c.createLinearGradient(X, Y, X + W, Y);
    gr.addColorStop(0, meta(1)); gr.addColorStop(0.49, meta(1)); gr.addColorStop(0.51, meta(0)); gr.addColorStop(1, meta(0));
    c.fillStyle = gr; c.fillRect(X, Y, W, H);
    c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = Math.max(1, t / 18);
    const passo = t * 0.28;
    if (orizz) { for (let py = Y + passo; py < Y + H; py += passo) { c.beginPath(); c.moveTo(X, py); c.lineTo(X + W, py); c.stroke(); for (let px = X + ((py / passo) % 2) * passo * 0.6; px < X + W; px += passo * 1.2) { c.beginPath(); c.moveTo(px, py - passo); c.lineTo(px, py); c.stroke(); } } }
    else { for (let px = X + passo; px < X + W; px += passo) { c.beginPath(); c.moveTo(px, Y); c.lineTo(px, Y + H); c.stroke(); for (let py = Y + ((px / passo) % 2) * passo * 0.6; py < Y + H; py += passo * 1.2) { c.beginPath(); c.moveTo(px - passo, py); c.lineTo(px, py); c.stroke(); } } }
    c.fillStyle = 'rgba(255,255,255,.18)'; orizz ? c.fillRect(X, Y + H / 2 - t * 0.06, W, t * 0.12) : c.fillRect(X + W / 2 - t * 0.06, Y, t * 0.12, H);
    if (innevato()) { c.fillStyle = 'rgba(240,245,252,.82)'; c.fillRect(X, Y, W, H); c.fillStyle = 'rgba(150,170,200,.35)'; orizz ? c.fillRect(X, Y + H / 2, W, H / 2) : c.fillRect(X + W / 2, Y, W / 2, H); }
    c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = Math.max(1.5, t / 10); c.strokeRect(X + 0.5, Y + 0.5, W - 1, H - 1);
    if (!tempio && r() < 0.7) { const cx = X + W * (0.2 + r() * 0.6), cy = orizz ? Y + H * 0.25 : Y + H * (0.2 + r() * 0.6); c.fillStyle = '#5a524a'; c.fillRect(cx, cy, t * 0.4, t * 0.4); c.fillStyle = '#1a1512'; c.fillRect(cx + t * 0.08, cy + t * 0.08, t * 0.24, t * 0.24); }
    if (tempio) { c.fillStyle = '#e8d890'; const cx = X + W / 2, cy = Y + H / 2; c.fillRect(cx - t * 0.06, cy - t * 0.35, t * 0.12, t * 0.7); c.fillRect(cx - t * 0.25, cy - t * 0.15, t * 0.5, t * 0.12); }
    if (e.stato === 'danneggiato') for (let k = 0; k < 2; k++) { const px = X + r() * (W - t), py = Y + r() * (H - t); c.fillStyle = '#1a120c'; c.beginPath(); c.ellipse(px + t / 2, py + t / 2, t * 0.45, t * 0.35, r(), 0, 7); c.fill(); c.strokeStyle = '#5a3a20'; c.lineWidth = t * 0.08; c.beginPath(); c.moveTo(px + t * 0.1, py + t / 2); c.lineTo(px + t * 0.9, py + t / 2); c.stroke(); }
    // porta visibile sul bordo
    for (let j = e.y; j < e.y + e.h; j++) for (let i = e.x; i < e.x + e.w; i++) if (luogo.celle[j]?.[i] === '+') { const dx = i * t, dy = j * t, giuB = j === e.y + e.h - 1; c.fillStyle = '#5a3a1e'; giuB ? c.fillRect(dx + t * 0.25, dy + t * 0.8, t * 0.5, t * 0.3) : c.fillRect(dx - t * 0.1, dy + t * 0.25, t * 0.3, t * 0.5); }
  }

  /* ---------------- oggetti di scena ---------------- */
  function legno(c, x, y, w, hh, v = 0) { const g = c.createLinearGradient(x, y, x, y + hh); g.addColorStop(0, hsl(28, 45, 36 + v)); g.addColorStop(1, hsl(26, 45, 24 + v)); return g; }
  // oggetti lunghi due caselle (letto, carretto, tronco, bancarella, barca): disegnati in orizzontale 2x1 e girati
  function oggettoLungo(c, o, t, X, Y) {
    const s = t, r = rnd(o.x, o.y, 9);
    c.save();
    if (o.dir === 'v') { c.translate(X + s, Y); c.rotate(Math.PI / 2); } else c.translate(X, Y);
    if ((o.dir !== 'v' && o.rot === 1) || (o.dir === 'v' && o.rot === 2)) { c.translate(2 * s, 0); c.scale(-1, 1); } // testiera verso il muro
    const om = (x, y, w, h) => { c.fillStyle = 'rgba(0,0,0,.35)'; rr(c, x + s * 0.08, y + s * 0.1, w, h, s * 0.12); c.fill(); };
    switch (o.tipo) {
      case 'letto': { om(s * 0.04, s * 0.08, s * 1.92, s * 0.84); c.fillStyle = hsl(26, 40, 22); c.fillRect(s * 0.04, s * 0.08, s * 1.92, s * 0.84); c.fillStyle = hsl(26, 40, 14); c.fillRect(s * 0.04, s * 0.08, s * 0.12, s * 0.84);
        const col = ['#8a2a2a', '#2a4a7a', '#4a6a2a', '#6a4a7a'][Math.floor(r() * 4)]; c.fillStyle = col; c.fillRect(s * 0.6, s * 0.12, s * 1.32, s * 0.76); c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(s * 0.6, s * 0.12, s * 0.1, s * 0.76);
        rr(c, s * 0.2, s * 0.2, s * 0.34, s * 0.6, s * 0.08); c.fillStyle = '#e8e2d4'; c.fill(); break; }
      case 'carretto': { om(s * 0.12, s * 0.15, s * 1.5, s * 0.7); c.fillStyle = legno(c, 0, 0, s, s, 2); c.fillRect(s * 0.12, s * 0.15, s * 1.5, s * 0.7); c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 1; for (let k = 1; k < 5; k++) { c.beginPath(); c.moveTo(s * 0.12 + k * s * 0.3, s * 0.15); c.lineTo(s * 0.12 + k * s * 0.3, s * 0.85); c.stroke(); }
        c.fillStyle = '#2a2018'; for (const wx of [0.45, 1.25]) { c.fillRect(s * wx - s * 0.16, s * 0.04, s * 0.32, s * 0.1); c.fillRect(s * wx - s * 0.16, s * 0.86, s * 0.32, s * 0.1); }
        c.strokeStyle = hsl(26, 40, 24); c.lineWidth = s * 0.06; c.beginPath(); c.moveTo(s * 1.62, s * 0.38); c.lineTo(s * 1.98, s * 0.38); c.moveTo(s * 1.62, s * 0.62); c.lineTo(s * 1.98, s * 0.62); c.stroke(); break; }
      case 'tronco': { om(s * 0.08, s * 0.32, s * 1.84, s * 0.38); const g = c.createLinearGradient(0, s * 0.3, 0, s * 0.7); g.addColorStop(0, '#7a5530'); g.addColorStop(1, '#3a2614'); c.fillStyle = g; c.fillRect(s * 0.1, s * 0.3, s * 1.75, s * 0.4); ovale(c, s * 1.85, s * 0.5, s * 0.08, s * 0.2, '#b08a5a'); c.strokeStyle = 'rgba(90,60,30,.8)'; c.lineWidth = 1; c.beginPath(); c.ellipse(s * 1.85, s * 0.5, s * 0.04, s * 0.1, 0, 0, 7); c.stroke(); break; }
      case 'bancarella': { om(s * 0.05, s * 0.05, s * 1.9, s * 0.9); const col = ['#a82a24', '#2a5a9a', '#3a7a3a'][Math.floor(r() * 3)]; for (let k = 0; k < 8; k++) { c.fillStyle = k % 2 ? '#e8e0cc' : col; c.fillRect(s * 0.05 + k * s * 0.2375, s * 0.05, s * 0.2375, s * 0.9); } c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(s * 0.05, s * 0.55, s * 1.9, s * 0.4); c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 1; c.strokeRect(s * 0.05, s * 0.05, s * 1.9, s * 0.9); break; }
      case 'barca': { ovale(c, s * 1.06, s * 0.6, s * 0.95, s * 0.36, 'rgba(0,0,0,.3)'); c.fillStyle = '#5a3a1e'; c.beginPath(); c.moveTo(s * 0.06, s * 0.5); c.quadraticCurveTo(s * 0.5, s * 0.08, s * 1.5, s * 0.14); c.lineTo(s * 1.94, s * 0.5); c.lineTo(s * 1.5, s * 0.86); c.quadraticCurveTo(s * 0.5, s * 0.92, s * 0.06, s * 0.5); c.fill(); c.fillStyle = '#8a6440'; c.beginPath(); c.ellipse(s, s * 0.5, s * 0.7, s * 0.24, 0, 0, 7); c.fill(); c.fillStyle = '#5a3a1e'; c.fillRect(s * 0.92, s * 0.26, s * 0.16, s * 0.48); break; }
    }
    c.restore();
    if (o.stato === 'bruciato' || o.stato === 'rotto') { const w = o.dir === 'v' ? s : 2 * s, h = o.dir === 'v' ? 2 * s : s; c.fillStyle = o.stato === 'bruciato' ? 'rgba(20,14,10,.7)' : 'rgba(20,12,6,.35)'; c.fillRect(X + s * 0.1, Y + s * 0.1, w - s * 0.2, h - s * 0.2); }
  }
  const LUNGHI = ['letto', 'carretto', 'tronco', 'bancarella', 'barca'];
  function oggetto(c, o, t, X = o.x * t, Y = o.y * t) {
    if (LUNGHI.includes(o.tipo) && o.dir) return oggettoLungo(c, o, t, X, Y);
    const cx = X + t / 2, cy = Y + t / 2, r = rnd(o.x, o.y, 9), s = t;
    const ombra = (rx, ry) => ovale(c, cx + s * 0.08, cy + s * 0.1, rx, ry, 'rgba(0,0,0,.35)');
    c.save();
    switch (o.tipo) {
      case 'tavolo': ombra(s * 0.48, s * 0.42); rr(c, X + s * 0.06, Y + s * 0.08, s * 0.88, s * 0.8, s * 0.12); c.fillStyle = legno(c, X, Y, s, s, 4); c.fill(); c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = s * 0.04; c.stroke(); c.strokeStyle = 'rgba(255,220,170,.12)'; c.lineWidth = 1; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(X + s * 0.1, Y + s * 0.08 + k * s * 0.2); c.lineTo(X + s * 0.9, Y + s * 0.08 + k * s * 0.2); c.stroke(); } if (r() < 0.7) { ovale(c, cx - s * 0.18, cy - s * 0.1, s * 0.08, s * 0.08, '#c8b090'); ovale(c, cx - s * 0.18, cy - s * 0.1, s * 0.05, s * 0.05, '#6a3a18'); } if (r() < 0.5) ovale(c, cx + s * 0.18, cy + s * 0.12, s * 0.1, s * 0.07, '#d8d0c0'); break;
      case 'sedia': case 'sgabello': {
        ombra(s * 0.26, s * 0.22);
        if (o.tipo === 'sgabello') { ovale(c, cx, cy, s * 0.2, s * 0.2, legno(c, X, Y, s, s)); c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = s * 0.03; c.stroke(); break; }
        c.translate(cx, cy); c.rotate((o.rot || 0) * Math.PI / 2);
        rr(c, -s * 0.2, -s * 0.18, s * 0.4, s * 0.38, s * 0.05); c.fillStyle = legno(c, -s * 0.2, -s * 0.2, s * 0.4, s * 0.4, 2); c.fill();
        c.fillStyle = hsl(26, 45, 20); c.fillRect(-s * 0.22, s * 0.16, s * 0.44, s * 0.08); break;
      }
      case 'botte': ombra(s * 0.38, s * 0.36); { const g = c.createRadialGradient(cx - s * 0.08, cy - s * 0.08, s * 0.05, cx, cy, s * 0.38); g.addColorStop(0, '#9a6a3a'); g.addColorStop(1, '#4a2e14'); ovale(c, cx, cy, s * 0.38, s * 0.38, g); } c.strokeStyle = '#2a2a2a'; c.lineWidth = s * 0.05; c.beginPath(); c.arc(cx, cy, s * 0.36, 0, 7); c.stroke(); c.strokeStyle = 'rgba(30,30,30,.7)'; c.lineWidth = s * 0.03; c.beginPath(); c.arc(cx, cy, s * 0.22, 0, 7); c.stroke(); ovale(c, cx, cy, s * 0.04, s * 0.04, '#2a1a0c'); break;
      case 'cassa': ombra(s * 0.4, s * 0.38); c.translate(cx, cy); c.rotate(((o.rot || 0) % 2) * 0.12); c.fillStyle = legno(c, -s * 0.35, -s * 0.35, s * 0.7, s * 0.7, 6); c.fillRect(-s * 0.35, -s * 0.35, s * 0.7, s * 0.7); c.strokeStyle = 'rgba(40,25,10,.8)'; c.lineWidth = s * 0.06; c.strokeRect(-s * 0.35, -s * 0.35, s * 0.7, s * 0.7); c.lineWidth = s * 0.05; c.beginPath(); c.moveTo(-s * 0.32, -s * 0.32); c.lineTo(s * 0.32, s * 0.32); c.moveTo(s * 0.32, -s * 0.32); c.lineTo(-s * 0.32, s * 0.32); c.stroke(); break;
      case 'baule': case 'forziere': { const oro = o.tipo === 'forziere'; c.translate(cx, cy); c.rotate((o.rot || 0) * Math.PI / 2); c.translate(-cx, -cy); ombra(s * 0.42, s * 0.3); rr(c, X + s * 0.1, Y + s * 0.22, s * 0.8, s * 0.5, s * 0.08); c.fillStyle = legno(c, X, Y + s * 0.22, s, s * 0.5, oro ? 0 : 4); c.fill(); c.fillStyle = oro ? '#d4a838' : '#555'; c.fillRect(X + s * 0.1, Y + s * 0.42, s * 0.8, s * 0.07); c.fillRect(X + s * 0.25, Y + s * 0.22, s * 0.06, s * 0.5); c.fillRect(X + s * 0.69, Y + s * 0.22, s * 0.06, s * 0.5); ovale(c, cx, cy + s * 0.01, s * 0.06, s * 0.06, oro ? '#ffe070' : '#888'); break; }
      case 'letto': { ombra(s * 0.45, s * 0.48); c.fillStyle = hsl(26, 40, 22); c.fillRect(X + s * 0.08, Y + s * 0.02, s * 0.84, s * 0.96); const col = ['#8a2a2a', '#2a4a7a', '#4a6a2a', '#6a4a7a'][Math.floor(r() * 4)]; c.fillStyle = col; c.fillRect(X + s * 0.12, Y + s * 0.32, s * 0.76, s * 0.62); c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(X + s * 0.12, Y + s * 0.32, s * 0.76, s * 0.08); rr(c, X + s * 0.2, Y + s * 0.07, s * 0.6, s * 0.2, s * 0.06); c.fillStyle = '#e8e2d4'; c.fill(); break; }
      case 'tappeto': { const col = ['#7a2420', '#24406a', '#5a3a6a'][Math.floor(r() * 3)]; c.globalAlpha = 0.9; c.fillStyle = col; c.fillRect(X - s * 0.4, Y - s * 0.2, s * 1.8, s * 1.4); c.strokeStyle = '#d8b860'; c.lineWidth = s * 0.06; c.strokeRect(X - s * 0.3, Y - s * 0.1, s * 1.6, s * 1.2); c.strokeStyle = 'rgba(216,184,96,.5)'; c.lineWidth = s * 0.03; c.beginPath(); c.ellipse(X + s * 0.5, Y + s * 0.5, s * 0.5, s * 0.35, 0, 0, 7); c.stroke(); break; }
      case 'candelabro': ombra(s * 0.18, s * 0.16); ovale(c, cx, cy, s * 0.16, s * 0.16, '#3a3028'); for (let k = 0; k < 3; k++) { const a = k * 2.09; ovale(c, cx + Math.cos(a) * s * 0.1, cy + Math.sin(a) * s * 0.1, s * 0.04, s * 0.04, '#e8e0c8'); fiamma(c, cx + Math.cos(a) * s * 0.1, cy + Math.sin(a) * s * 0.1, s * 0.07); } break;
      case 'torcia': { const m = [[0, -1], [0, 1], [-1, 0], [1, 0]].find(([dx, dy]) => muro(cella(o.x + dx, o.y + dy))) || [0, -1]; const tx = cx + m[0] * s * 0.4, ty = cy + m[1] * s * 0.4; c.strokeStyle = '#3a2a1a'; c.lineWidth = s * 0.08; c.beginPath(); c.moveTo(tx + m[0] * s * 0.1, ty + m[1] * s * 0.1); c.lineTo(tx - m[0] * s * 0.12, ty - m[1] * s * 0.12); c.stroke(); fiamma(c, tx - m[0] * s * 0.14, ty - m[1] * s * 0.14, s * 0.16); break; }
      case 'scaffale': { c.translate(cx, cy); c.rotate((o.rot || 0) * Math.PI / 2); c.translate(-cx, -cy); c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(X + s * 0.06, Y + s * 0.1, s * 0.92, s * 0.4); c.fillStyle = hsl(25, 40, 18); c.fillRect(X + s * 0.02, Y + s * 0.02, s * 0.96, s * 0.38); for (let k = 0; k < 7; k++) { c.fillStyle = ['#7a2a24', '#2a4a6a', '#3a6a3a', '#8a7a4a', '#5a3a6a'][Math.floor(r() * 5)]; c.fillRect(X + s * 0.06 + k * s * 0.13, Y + s * 0.06, s * 0.1, s * 0.3); } break; }
      case 'rastrelliera': { c.translate(cx, cy); c.rotate((o.rot || 0) * Math.PI / 2); c.translate(-cx, -cy); c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(X + s * 0.08, Y + s * 0.12, s * 0.9, s * 0.2); c.fillStyle = hsl(26, 40, 22); c.fillRect(X + s * 0.05, Y + s * 0.05, s * 0.9, s * 0.18); c.strokeStyle = '#b8b8c0'; c.lineWidth = s * 0.05; for (let k = 0; k < 4; k++) { const px = X + s * (0.15 + k * 0.23); c.beginPath(); c.moveTo(px, Y + s * 0.04); c.lineTo(px + s * 0.03, Y + s * 0.45); c.stroke(); } break; }
      case 'sacco': ombra(s * 0.3, s * 0.26); ovale(c, cx, cy + s * 0.05, s * 0.3, s * 0.26, '#a8936a'); ovale(c, cx - s * 0.08, cy - s * 0.02, s * 0.12, s * 0.08, 'rgba(255,255,255,.15)'); ovale(c, cx, cy - s * 0.2, s * 0.08, s * 0.06, '#7a6a48'); break;
      case 'secchio': ombra(s * 0.2, s * 0.2); ovale(c, cx, cy, s * 0.2, s * 0.2, '#6a6a6a'); ovale(c, cx, cy, s * 0.15, s * 0.15, '#2a4a5a'); break;
      case 'ossa': c.strokeStyle = '#e0d8c4'; c.lineWidth = s * 0.06; c.lineCap = 'round'; for (let k = 0; k < 3; k++) { c.beginPath(); const a = r() * 3, px = X + s * (0.2 + r() * 0.6), py = Y + s * (0.2 + r() * 0.6); c.moveTo(px - Math.cos(a) * s * 0.18, py - Math.sin(a) * s * 0.18); c.lineTo(px + Math.cos(a) * s * 0.18, py + Math.sin(a) * s * 0.18); c.stroke(); } ovale(c, cx + s * 0.1, cy - s * 0.1, s * 0.12, s * 0.11, '#e8e0cc'); ovale(c, cx + s * 0.06, cy - s * 0.12, s * 0.03, s * 0.03, '#2a2420'); ovale(c, cx + s * 0.14, cy - s * 0.12, s * 0.03, s * 0.03, '#2a2420'); break;
      case 'macerie': for (let k = 0; k < 7; k++) { const v = r(); c.fillStyle = hsl(30, 6, 30 + v * 25); c.beginPath(); const px = X + r() * s, py = Y + r() * s, q = s * (0.07 + r() * 0.12); c.moveTo(px - q, py); c.lineTo(px, py - q); c.lineTo(px + q, py + q * 0.3); c.lineTo(px, py + q); c.closePath(); c.fill(); } break;
      case 'ragnatela': c.strokeStyle = 'rgba(230,230,230,.45)'; c.lineWidth = 1; for (let k = 0; k < 8; k++) { const a = k * 0.785; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * s * 0.6, cy + Math.sin(a) * s * 0.6); c.stroke(); } for (let k = 1; k < 4; k++) { c.beginPath(); c.arc(cx, cy, k * s * 0.15, 0, 7); c.stroke(); } break;
      case 'altare': ombra(s * 0.5, s * 0.4); c.fillStyle = '#8a847a'; c.fillRect(X + s * 0.02, Y + s * 0.15, s * 0.96, s * 0.7); c.fillStyle = '#6a1e24'; c.fillRect(X + s * 0.3, Y + s * 0.15, s * 0.4, s * 0.7); ['#e8e0c8', '#e8e0c8'].forEach((cc, k) => { ovale(c, X + s * (0.14 + k * 0.72), cy, s * 0.06, s * 0.06, cc); fiamma(c, X + s * (0.14 + k * 0.72), cy, s * 0.09); }); break;
      case 'colonna': { ombra(s * 0.48, s * 0.45); const g = c.createRadialGradient(cx - s * 0.15, cy - s * 0.15, s * 0.05, cx, cy, s * 0.46); g.addColorStop(0, '#9a948a'); g.addColorStop(1, '#4a4640'); ovale(c, cx, cy, s * 0.46, s * 0.46, g); c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 1; c.beginPath(); c.arc(cx, cy, s * 0.34, 0, 7); c.stroke(); break; }
      case 'masso': case 'stalagmite': { ombra(s * 0.4, s * 0.34); const g = c.createRadialGradient(cx - s * 0.12, cy - s * 0.14, s * 0.03, cx, cy, s * 0.42); const st = o.tipo === 'stalagmite'; g.addColorStop(0, st ? '#9a8a70' : '#8e8a84'); g.addColorStop(1, st ? '#4a3e30' : '#3e3a36'); c.fillStyle = g; c.beginPath(); const n = 7; for (let k = 0; k < n; k++) { const a = k / n * 6.28, d = s * (st ? 0.3 : 0.32 + r() * 0.1); k ? c.lineTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d) : c.moveTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d); } c.closePath(); c.fill(); if (st) ovale(c, cx - s * 0.04, cy - s * 0.05, s * 0.07, s * 0.07, '#c8b898'); break; }
      case 'funghi': for (let k = 0; k < 4; k++) { const px = X + s * (0.2 + r() * 0.6), py = Y + s * (0.2 + r() * 0.6), q = s * (0.06 + r() * 0.07), col = r() < 0.5 ? '#b83a2a' : '#c8a878'; ovale(c, px + q * 0.3, py + q * 0.3, q, q * 0.8, 'rgba(0,0,0,.3)'); ovale(c, px, py, q, q, col); if (col === '#b83a2a') ovale(c, px - q * 0.3, py - q * 0.3, q * 0.25, q * 0.25, '#f0e8d8'); } break;
      case 'carretto': { ombra(s * 0.5, s * 0.36); c.fillStyle = legno(c, X, Y, s, s, 2); c.fillRect(X + s * 0.1, Y + s * 0.2, s * 0.8, s * 0.6); c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 1; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(X + s * 0.1, Y + s * 0.2 + k * s * 0.15); c.lineTo(X + s * 0.9, Y + s * 0.2 + k * s * 0.15); c.stroke(); } c.fillStyle = '#2a2018'; c.fillRect(X + s * 0.25, Y + s * 0.1, s * 0.1, s * 0.8); c.fillRect(X + s * 0.65, Y + s * 0.1, s * 0.1, s * 0.8); c.strokeStyle = hsl(26, 40, 24); c.lineWidth = s * 0.05; c.beginPath(); c.moveTo(X + s * 0.9, Y + s * 0.4); c.lineTo(X + s * 1.15, Y + s * 0.4); c.moveTo(X + s * 0.9, Y + s * 0.6); c.lineTo(X + s * 1.15, Y + s * 0.6); c.stroke(); break; }
      case 'lampione': ombra(s * 0.12, s * 0.12); ovale(c, cx, cy, s * 0.12, s * 0.12, '#2a2a2a'); ovale(c, cx, cy, s * 0.08, s * 0.08, '#ffe4a0'); break;
      case 'panca': ombra(s * 0.48, s * 0.18); c.fillStyle = legno(c, X, Y + s * 0.38, s, s * 0.24, 4); c.fillRect(X + s * 0.04, Y + s * 0.38, s * 0.92, s * 0.24); c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(X + s * 0.04, Y + s * 0.49, s * 0.92, 1); break;
      case 'fieno': ombra(s * 0.38, s * 0.36); ovale(c, cx, cy, s * 0.38, s * 0.38, '#c8a848'); c.strokeStyle = 'rgba(120,90,30,.6)'; c.lineWidth = 1; for (let k = 1; k < 4; k++) { c.beginPath(); c.arc(cx, cy, k * s * 0.09, 0, 7); c.stroke(); } break;
      case 'bancarella': { ombra(s * 0.5, s * 0.45); const col = ['#a82a24', '#2a5a9a', '#3a7a3a'][Math.floor(r() * 3)]; for (let k = 0; k < 5; k++) { c.fillStyle = k % 2 ? '#e8e0cc' : col; c.fillRect(X + s * 0.02 + k * s * 0.192, Y + s * 0.05, s * 0.192, s * 0.9); } c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(X + s * 0.02, Y + s * 0.5, s * 0.96, s * 0.45); c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 1; c.strokeRect(X + s * 0.02, Y + s * 0.05, s * 0.96, s * 0.9); break; }
      case 'cespuglio': ombra(s * 0.42, s * 0.36); for (let k = 0; k < 5; k++) { const a = r() * 6.28, d = s * 0.14 * r(); ovale(c, cx + Math.cos(a) * d, cy + Math.sin(a) * d, s * 0.26, s * 0.24, hsl(100 + r() * 20, 35, 20 + r() * 10)); } ovale(c, cx - s * 0.1, cy - s * 0.1, s * 0.1, s * 0.08, hsl(95, 40, 36)); break;
      case 'tronco': { ombra(s * 0.7, s * 0.2); c.translate(cx, cy); c.rotate((o.rot || 0) * 0.6); const g = c.createLinearGradient(0, -s * 0.18, 0, s * 0.18); g.addColorStop(0, '#7a5530'); g.addColorStop(1, '#3a2614'); c.fillStyle = g; c.fillRect(-s * 0.75, -s * 0.18, s * 1.5, s * 0.36); ovale(c, s * 0.75, 0, s * 0.08, s * 0.18, '#b08a5a'); c.strokeStyle = 'rgba(90,60,30,.8)'; c.lineWidth = 1; c.beginPath(); c.ellipse(s * 0.75, 0, s * 0.04, s * 0.1, 0, 0, 7); c.stroke(); break; }
      case 'ceppo': ombra(s * 0.3, s * 0.28); ovale(c, cx, cy, s * 0.28, s * 0.28, '#5a3a1e'); ovale(c, cx, cy, s * 0.22, s * 0.22, '#b08a5a'); c.strokeStyle = 'rgba(90,60,30,.7)'; c.lineWidth = 1; for (let k = 1; k < 3; k++) { c.beginPath(); c.arc(cx, cy, k * s * 0.07, 0, 7); c.stroke(); } break;
      case 'falo': for (let k = 0; k < 9; k++) { const a = k * 0.7; ovale(c, cx + Math.cos(a) * s * 0.36, cy + Math.sin(a) * s * 0.36, s * 0.08, s * 0.07, '#6e6a64'); } c.strokeStyle = '#3a2410'; c.lineWidth = s * 0.08; c.beginPath(); c.moveTo(cx - s * 0.25, cy - s * 0.1); c.lineTo(cx + s * 0.25, cy + s * 0.1); c.moveTo(cx - s * 0.2, cy + s * 0.15); c.lineTo(cx + s * 0.2, cy - s * 0.15); c.stroke(); fiamma(c, cx, cy, s * 0.3); break;
      case 'barca': { c.translate(cx, cy); c.rotate((o.rot || 0) * 0.4); ovale(c, s * 0.06, s * 0.1, s * 0.62, s * 0.26, 'rgba(0,0,0,.3)'); c.fillStyle = '#5a3a1e'; c.beginPath(); c.moveTo(-s * 0.65, 0); c.quadraticCurveTo(-s * 0.3, -s * 0.28, s * 0.4, -s * 0.24); c.lineTo(s * 0.62, 0); c.lineTo(s * 0.4, s * 0.24); c.quadraticCurveTo(-s * 0.3, s * 0.28, -s * 0.65, 0); c.fill(); c.fillStyle = '#8a6440'; c.beginPath(); c.ellipse(0, 0, s * 0.45, s * 0.15, 0, 0, 7); c.fill(); c.fillStyle = '#5a3a1e'; c.fillRect(-s * 0.05, -s * 0.16, s * 0.1, s * 0.32); break; }
      case 'statua': { ombra(s * 0.45, s * 0.42); c.fillStyle = '#6a665e'; c.fillRect(X + s * 0.08, Y + s * 0.08, s * 0.84, s * 0.84); const g = c.createRadialGradient(cx - s * 0.1, cy - s * 0.1, s * 0.03, cx, cy, s * 0.3); g.addColorStop(0, '#c8c4bc'); g.addColorStop(1, '#7a766e'); ovale(c, cx, cy, s * 0.3, s * 0.22, g); ovale(c, cx, cy - s * 0.04, s * 0.12, s * 0.12, '#b8b4ac'); break; }
      case 'stendardo': { ombra(s * 0.2, s * 0.15); c.fillStyle = '#3a2a1a'; ovale(c, cx, cy, s * 0.07, s * 0.07, '#3a2a1a'); const col = ['#8a1e24', '#1e3a7a', '#2a5a2a'][Math.floor(r() * 3)]; c.fillStyle = col; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + s * 0.45, cy - s * 0.05); c.lineTo(cx + s * 0.38, cy + s * 0.2); c.lineTo(cx + s * 0.45, cy + s * 0.42); c.lineTo(cx, cy + s * 0.38); c.closePath(); c.fill(); c.fillStyle = '#d8b850'; ovale(c, cx + s * 0.2, cy + s * 0.18, s * 0.06, s * 0.06, '#d8b850'); break; }
      default: { ombra(s * 0.34, s * 0.3); rr(c, X + s * 0.18, Y + s * 0.18, s * 0.64, s * 0.64, s * 0.12); c.fillStyle = '#6a5a48'; c.fill(); c.strokeStyle = '#d8c8a0'; c.lineWidth = s * 0.04; c.stroke(); c.fillStyle = '#f3ead9'; c.font = `700 ${s * 0.36}px Inter, system-ui, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText((o.nome || o.tipo || '?').charAt(0).toUpperCase(), cx, cy + 1); }
    }
    c.restore();
    if (o.stato === 'bruciato') { c.fillStyle = 'rgba(20,14,10,.7)'; ovale(c, cx, cy, s * 0.45, s * 0.42, 'rgba(20,14,10,.72)'); for (let k = 0; k < 4; k++) ovale(c, X + s * (0.2 + r() * 0.6), Y + s * (0.2 + r() * 0.6), s * 0.04, s * 0.04, '#ff6a2a'); }
    if (o.stato === 'rotto') { c.strokeStyle = 'rgba(20,12,6,.9)'; c.lineWidth = Math.max(1.5, s * 0.05); c.beginPath(); c.moveTo(X + s * 0.25, Y + s * 0.2); c.lineTo(cx, cy); c.lineTo(X + s * 0.4, Y + s * 0.85); c.moveTo(cx, cy); c.lineTo(X + s * 0.85, Y + s * 0.6); c.stroke(); }
    if (o.nome && t >= 22) { c.font = `600 ${Math.max(9, t * 0.32)}px Inter, system-ui, sans-serif`; const tw = c.measureText(o.nome).width; c.fillStyle = 'rgba(20,17,15,.7)'; c.fillRect(cx - tw / 2 - 3, Y - t * 0.3, tw + 6, t * 0.36); c.fillStyle = '#f3ead9'; c.textAlign = 'start'; c.textBaseline = 'alphabetic'; c.fillText(o.nome, cx - tw / 2, Y - t * 0.03); }
  }

  /* ---------------- sole e luci (dai Varchi: ombre del sole secondo l'ora, luci vere che proiettano ombre) ---------------- */
  // c'è il sole diretto? Solo fuori, di giorno, col cielo sereno o poco nuvoloso
  function sole() { if (!luogo || !esterno()) return false; const o = ora(); return o >= 6.5 && o <= 19 && ['sereno', 'nuvoloso'].includes(meteo()); }
  // vettore dell'ombra in caselle per unità di altezza: mattino verso ovest, mezzogiorno corta verso nord, sera verso est
  function vettoreSole() { const f = Math.max(0, Math.min(1, (ora() - 6.5) / 12.5)), lungo = 0.35 + 1.6 * Math.abs(1 - 2 * f); return { x: -(1 - 2 * f) * lungo, y: -0.35 - 0.25 * Math.abs(1 - 2 * f) }; }
  const ALTI = { colonna: 2, statua: 1.6, scaffale: 1.2, masso: 0.6, stalagmite: 1.2, botte: 0.6, cassa: 0.5, carretto: 0.6, bancarella: 1.1, lampione: 2, stendardo: 1.8, rastrelliera: 1, cespuglio: 0.5, falo: 0 };
  function ombreSole(c, t) {
    if (!sole()) return;
    const v = vettoreSole(), forza = meteo() === 'nuvoloso' ? 0.16 : 0.32;
    const m = document.createElement('canvas'); m.width = c.canvas.width; m.height = c.canvas.height;
    const k = m.getContext('2d'); k.setTransform(dpr, 0, 0, dpr, 0, 0); k.fillStyle = '#000';
    const proietta = (fn, alto) => { const n = Math.max(2, Math.ceil(alto * Math.hypot(v.x, v.y) * 4)); for (let i = 0; i <= n; i++) { const f = i / n * alto; fn(v.x * f * t, v.y * f * t); } };
    for (const e of luogo.edifici) if (luogo.celle[e.y]?.[e.x] === '#' && e.stato !== 'distrutto') proietta((dx, dy) => k.fillRect(e.x * t + dx, e.y * t + dy, e.w * t, e.h * t), e.nome === 'Mastio' || /^Torre/.test(e.nome) ? 4 : 2);
    for (let y = 0; y < luogo.h; y++) for (let x = 0; x < luogo.w; x++) {
      const ch = cella(x, y);
      if (ch === 'T') proietta((dx, dy) => { k.beginPath(); k.ellipse(x * t + t / 2 + dx, y * t + t / 2 + dy, t * 0.6, t * 0.55, 0, 0, 7); k.fill(); }, 1.6);
      else if (ch === 'w') proietta((dx, dy) => k.fillRect(x * t + dx, y * t + dy, t, t), 1.2);
    }
    for (const o of luogo.oggetti || []) { const a = ALTI[o.tipo]; if (a) proietta((dx, dy) => { k.beginPath(); k.ellipse(o.x * t + t / 2 + dx, o.y * t + t / 2 + dy, t * 0.32, t * 0.3, 0, 0, 7); k.fill(); }, a); }
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = forza; c.drawImage(m, 0, 0); c.restore();
  }
  // sorgenti di luce: camini, oggetti accesi, di notte le porte delle case con la lanterna
  function sorgenti() {
    const out = [];
    for (let y = 0; y < luogo.h; y++) for (let x = 0; x < luogo.w; x++) {
      const ch = cella(x, y);
      if (ch === 'f') out.push({ x: x + 0.5, y: y + 0.5, r: 5.5, rgb: [1, 0.55, 0.2], i: 1.1, fiamma: true });
      else if (ch === '+' && notte() && esterno() && casaDi(x, y)?.stato === 'integro') { const f = [[0, 1], [0, -1], [1, 0], [-1, 0]].find(([dx, dy]) => !casaDi(x + dx, y + dy) && !muro(cella(x + dx, y + dy))); if (f) out.push({ x: x + 0.5 + f[0] * 0.7, y: y + 0.5 + f[1] * 0.7, r: 3.2, rgb: [1, 0.75, 0.4], i: 0.85 }); }
    }
    for (const o of luogo.oggetti || []) {
      if (o.stato !== 'integro' || !LUCI[o.tipo] || (o.tipo === 'funghi' && luogo.tipo !== 'grotta')) continue;
      if (o.tipo === 'lampione' && !notte()) continue;
      const [raggio, rgb] = LUCI[o.tipo], col = rgb.split(',').map(n => n / 255);
      out.push({ x: o.x + 0.5, y: o.y + 0.5, r: raggio + 0.5, rgb: col, i: o.tipo === 'falo' ? 1.1 : 0.85, fiamma: !['lampione', 'funghi'].includes(o.tipo) });
    }
    for (const [id, sg] of Object.entries(segnalini)) { if (sg.tipo === 'pg' && torcia(id)) out.push({ x: sg.x + 0.5, y: sg.y + 0.5, r: torcia(id), rgb: [1, 0.7, 0.35], i: 0.95, fiamma: true }); }
    for (const e of luogo.edifici) if (e.stato === 'bruciato' && esterno()) out.push({ x: e.x + e.w / 2, y: e.y + e.h / 2, r: 2.5, rgb: [1, 0.35, 0.1], i: 0.35 });
    return out;
  }
  const BLOCCA_LUCE = ['colonna', 'statua', 'scaffale', 'masso', 'stalagmite'];
  // mappa della luce a 4 campioni per casella: ogni luce illumina solo dove la vede (ombre vere dei muri), poi si sfuma
  function mappaLuce() {
    const A = luceAmbiente(), L = sorgenti();
    luceCelle = null;
    if (A.liv >= 0.98 && !L.length) return null;
    const S = 4, LW = luogo.w * S, LH = luogo.h * S, n = LW * LH;
    const blocco = new Uint8Array(luogo.w * luogo.h);
    for (let y = 0; y < luogo.h; y++) for (let x = 0; x < luogo.w; x++) blocco[y * luogo.w + x] = muro(cella(x, y)) || casaDi(x, y) ? 1 : 0;
    for (const o of luogo.oggetti || []) if (BLOCCA_LUCE.includes(o.tipo)) blocco[o.y * luogo.w + o.x] = 1;
    const tetto_ = new Uint8Array(luogo.w * luogo.h); for (let y = 0; y < luogo.h; y++) for (let x = 0; x < luogo.w; x++) tetto_[y * luogo.w + x] = casaDi(x, y) ? 1 : 0;
    const R = new Float32Array(n).fill(A.liv * A.col[0]), G = new Float32Array(n).fill(A.liv * A.col[1]), B = new Float32Array(n).fill(A.liv * A.col[2]);
    const gR = new Float32Array(n), gG = new Float32Array(n), gB = new Float32Array(n);
    const vede = (lx, ly, px, py) => {
      const dx = px - lx, dy = py - ly, d = Math.hypot(dx, dy), passi = Math.ceil(d / 0.25), cx0 = Math.floor(lx), cy0 = Math.floor(ly), cx1 = Math.floor(px), cy1 = Math.floor(py);
      for (let i = 1; i < passi; i++) { const qx = Math.floor(lx + dx * i / passi), qy = Math.floor(ly + dy * i / passi); if ((qx === cx0 && qy === cy0) || (qx === cx1 && qy === cy1)) continue; if (blocco[qy * luogo.w + qx]) return false; }
      return true;
    };
    for (const l of L) {
      const x0 = Math.max(0, Math.floor((l.x - l.r) * S)), x1 = Math.min(LW - 1, Math.ceil((l.x + l.r) * S)), y0 = Math.max(0, Math.floor((l.y - l.r) * S)), y1 = Math.min(LH - 1, Math.ceil((l.y + l.r) * S));
      for (let sy = y0; sy <= y1; sy++) for (let sx = x0; sx <= x1; sx++) {
        const px = (sx + 0.5) / S, py = (sy + 0.5) / S, d = Math.hypot(px - l.x, py - l.y);
        if (d >= l.r || tetto_[Math.floor(py) * luogo.w + Math.floor(px)] || !vede(l.x, l.y, px, py)) continue;
        const f = l.i * (1 - d / l.r) ** 2, k = sy * LW + sx;
        R[k] += l.rgb[0] * f; G[k] += l.rgb[1] * f; B[k] += l.rgb[2] * f;
        gR[k] += l.rgb[0] * f; gG[k] += l.rgb[1] * f; gB[k] += l.rgb[2] * f;
      }
    }
    luceCelle = new Float32Array(luogo.w * luogo.h);
    for (let y = 0; y < luogo.h; y++) for (let x = 0; x < luogo.w; x++) { let somma = 0; for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) { const k = (y * S + j) * LW + x * S + i; somma += (R[k] + G[k] + B[k]) / 3; } luceCelle[y * luogo.w + x] = somma / (S * S); }
    const scuro = new ImageData(LW, LH), luce = new ImageData(LW, LH);
    for (let k = 0; k < n; k++) {
      scuro.data[k * 4] = Math.min(255, R[k] * 255); scuro.data[k * 4 + 1] = Math.min(255, G[k] * 255); scuro.data[k * 4 + 2] = Math.min(255, B[k] * 255); scuro.data[k * 4 + 3] = 255;
      luce.data[k * 4] = Math.min(255, gR[k] * 90); luce.data[k * 4 + 1] = Math.min(255, gG[k] * 90); luce.data[k * 4 + 2] = Math.min(255, gB[k] * 90); luce.data[k * 4 + 3] = 255;
    }
    const tela = (img) => { const c = document.createElement('canvas'); c.width = LW; c.height = LH; c.getContext('2d').putImageData(img, 0, 0); return c; };
    return { scuro: tela(scuro), luce: tela(luce), sorgenti: L };
  }

  /* ---------------- pacchetti grafici comprati (privati: il server li dà solo ai membri della campagna) ---------------- */
  // The Fan-tasy Tileset, Time Fantasy, pixelbean: terreni a 47 mattonelle, alberi, case, oggetti a 16 px per casella.
  let P = null; const famiglie = {};
  async function pacchetti(base, m, k) {
    if (P || !base || !m || !k) return;
    try {
      const q = `?m=${encodeURIComponent(m)}&k=${encodeURIComponent(k)}`;
      const [r, b] = await Promise.all([fetch(base + '.json' + q).then(x => x.ok ? x.json() : null), fetch(base + '.png' + q).then(x => x.ok ? x.blob() : null)]);
      if (!r || !b) return;
      P = { img: await createImageBitmap(b), r }; cacheChiave = ''; disegna(); cambiato();
    } catch {}
  }
  // tutte le varianti di un oggetto (albero_verde_0, albero_verde_1...)
  const varianti = radice => famiglie[radice] || (famiglie[radice] = Object.keys(P.r).filter(n => n === radice || (n.startsWith(radice + '_') && /^\d+$/.test(n.slice(radice.length + 1)))));
  function sprite(c, radice, cx, basso, scala, x, y, filtro, altMax) {
    const v = varianti(radice); if (!v.length) return false;
    const [sx, sy, w, h] = P.r[v[Math.floor(rnd(x, y, 7)() * v.length)]];
    if (altMax && h * scala > altMax) scala = altMax / h; // gli alberi non devono coprire i sentieri e le case vicine
    if (filtro) c.filter = filtro;
    c.drawImage(P.img, sx, sy, w, h, cx - w * scala / 2, basso - h * scala, w * scala, h * scala);
    if (filtro) c.filter = 'none';
    return true;
  }
  // autotile a 47 mattonelle: stesso ordine dei pacchetti (Tileset_Layout dell'autore, come in terreno.gd delle Cronache)
  const DISPOSIZIONE = ['000010010 000011011 000111111 000110110 000111011 010110110', '010010010 011011011 111111111 110110110 011011010 110111000', '010010000 011011000 111111000 110110000 010011011 000111110', '000010000 000011000 000111000 000110000 011111000 110110010', '111111110 111111011 000011010 000110010 010111111 110111110', '110111111 011111111 010011000 010110000 011111011 111111010', '010111011 010111110 010111000 010011010 011111110 110111011', '011111010 110111010 010110010 000111010 010111010 000000000'];
  const INDICE = {}; DISPOSIZIONE.join(' ').split(' ').forEach((m, i) => { INDICE[m] = i; });
  function blob(c, nome, x, y, t, uguale) {
    const r = P.r['blob_' + nome]; if (!r) return false;
    const u = (dx, dy) => uguale(x + dx, y + dy) ? 1 : 0, n = u(0, -1), s2 = u(0, 1), w = u(-1, 0), e = u(1, 0);
    const m = `${n && w ? u(-1, -1) : 0}${n}${n && e ? u(1, -1) : 0}${w}1${e}${s2 && w ? u(-1, 1) : 0}${s2}${s2 && e ? u(1, 1) : 0}`;
    let i = INDICE[m] ?? 8;
    const extra = Math.max(0, Math.floor(r[3] / 16) - 8) * 6; // varianti del centro sotto le 8 righe
    if (i === 8 && extra) { const k = Math.floor(rnd(x, y, 8)() * (extra + 3)); if (k < extra) i = 48 + k; }
    c.drawImage(P.img, r[0] + (i % 6) * 16, r[1] + Math.floor(i / 6) * 16, 16, 16, x * t, y * t, t + 0.5, t + 0.5);
    return true;
  }
  // terreno all'aperto con le mattonelle disegnate: prato (o neve), strade, acqua
  function terrenoPacchetti(c, t) {
    const st = stagione(), prato = innevato() ? 'neve' : luogo.tipo === 'foresta' ? 'erba_scuro' : 'erba_chiaro';
    const strada = ['citta', 'castello'].includes(luogo.tipo) ? 'mattoni' : 'strada';
    const eStrada = (x, y) => ',_'.includes(cella(x, y)), eAcqua = (x, y) => cella(x, y) === '~';
    for (let y = 0; y < luogo.h; y++) for (let x = 0; x < luogo.w; x++) {
      const ch = cella(x, y); if (ch === 'w') continue;
      blob(c, prato, x, y, t, () => true);
      if (eStrada(x, y)) blob(c, strada, x, y, t, eStrada);
      else if (eAcqua(x, y)) blob(c, 'acqua', x, y, t, eAcqua);
      else if (st === 'autunno' && !innevato() && rnd(x, y, 9)() < 0.05) sprite(c, 'v_ciuffo', x * t + t / 2, (y + 1) * t, t / 16, x, y);
    }
  }
  const rocciaPacchetto = () => !!(P && esterno() && varianti('roccia').length);
  function alberoPacchetti(c, x, y, t) {
    const st = stagione(), r = rnd(x, y, 3)(), pino = luogo.tipo === 'foresta' ? r < 0.4 : r < 0.15;
    const fam = innevato() ? (pino ? 'pino_neve' : 'albero_neve') : st === 'inverno' ? (pino ? 'pino' : 'albero_spoglio') : st === 'autunno' && !pino ? 'albero_autunno' : pino ? 'pino' : r < 0.6 ? 'albero_verde' : 'albero_chiaro';
    return sprite(c, fam, x * t + t / 2, (y + 1) * t, t / 16 * 0.85, x, y, null, t * (luogo.tipo === 'foresta' ? 1.9 : 2.3));
  }
  const OGG_PACCHETTI = { botte: 'barile', cassa: 'cassa', falo: 'falo', carretto: 'carro', bancarella: 'bancarella', fieno: 'covone', masso: 'roccia', ceppo: 'v_tronco', tronco: 'v_tronco', lampione: 'lampione', sacco: 'sacco', funghi: 'v_funghi', panca: 'panchina' };
  function oggettoPacchetti(c, o, t) {
    let fam = OGG_PACCHETTI[o.tipo];
    if (o.tipo === 'cespuglio') fam = innevato() ? 'cespuglio_neve' : stagione() === 'autunno' ? 'cespuglio_autunno' : 'cespuglio';
    if (!fam || o.stato === 'rotto') return false;
    const lungo = LUNGHI.includes(o.tipo) && o.dir, cx = (o.x + (lungo && o.dir !== 'v' ? 1 : 0.5)) * t, basso = (o.y + (lungo && o.dir === 'v' ? 2 : 1)) * t;
    return sprite(c, fam, cx, basso, t / 16, o.x, o.y, o.stato === 'bruciato' ? 'brightness(.35) sepia(.5)' : null);
  }
  const ED_PACCHETTI = [[/locanda|taverna|osteria/i, 'ed_taverna'], [/fabbr|armaiol|fucina/i, 'ed_fabbro'], [/gran mercato|mercato/i, 'ed_gran_mercato'], [/emporio|bottega|negozio|sarto/i, 'ed_emporio'], [/alchimist|erborist|guarit/i, 'ed_alchimista'], [/stalla|scuderia/i, 'ed_stalla'], [/bibliotec|archivio|scuola|municipio|palazzo/i, 'ed_biblioteca'], [/porto|molo|pescator/i, 'ed_porto'], [/teatro/i, 'ed_teatro'], [/tempio|cappella|chiesa|santuario/i, 'castello_cappella'], [/torre|mastio/i, 'castello_torretta'], [/caserma|guardia|gilda|officina/i, 'ed_officina'], [/panett|magazzin|granaio|dispensa/i, 'ed_dispensa'], [/barbier/i, 'ed_barbiere'], [/banca|tesor/i, 'ed_banca']];
  function edificioPacchetti(c, e, t) {
    if (!esterno() || e.id === 'pozzo' || luogo.celle[e.y]?.[e.x] !== '#' || e.stato === 'distrutto') return false;
    const fam = ED_PACCHETTI.find(([re]) => re.test(e.nome || ''))?.[1] || 'casa_' + (1 + (e.x * 7 + e.y * 3) % 5);
    const v = varianti(fam); if (!v.length) return false;
    const [, , w, h] = P.r[v[0]], scala = Math.min(e.w * t * 1.08 / w, (e.h + 1.6) * t / h);
    ovale(c, (e.x + e.w / 2) * t + t * 0.2, (e.y + e.h) * t - t * 0.1, e.w * t * 0.5, t * 0.35, 'rgba(0,0,0,.3)');
    return sprite(c, fam, (e.x + e.w / 2) * t, (e.y + e.h) * t, scala, e.x, e.y, e.stato === 'bruciato' ? 'brightness(.35) sepia(.6)' : e.stato === 'danneggiato' ? 'brightness(.8) saturate(.7)' : null);
  }

  /* ---------------- passaggi e percorsi (stesse regole del server: tavolo.js griglia/percorso) ---------------- */
  const celleOggetto = o => LUNGHI.includes(o.tipo) && o.dir ? [[o.x, o.y], o.dir === 'v' ? [o.x, o.y + 1] : [o.x + 1, o.y]] : [[o.x, o.y]];
  function bloccoPasso() {
    if (gCache && gCache.luogo === luogo && gCache.oggetti === luogo.oggetti) return gCache.blocco;
    const b = new Uint8Array(luogo.w * luogo.h);
    for (let y = 0; y < luogo.h; y++) for (let x = 0; x < luogo.w; x++) if ('#wR~Tfb'.includes(cella(x, y))) b[y * luogo.w + x] = 1;
    if (esterno()) for (const e of luogo.edifici) if (luogo.celle[e.y]?.[e.x] === '#' && e.stato !== 'distrutto') for (let y = e.y; y < e.y + e.h; y++) for (let x = e.x; x < e.x + e.w; x++) b[y * luogo.w + x] = 1;
    for (const o of luogo.oggetti || []) if (!PASSABILI.includes(o.tipo) && o.tipo !== 'barca') for (const [x, y] of celleOggetto(o)) if (x < luogo.w && y < luogo.h) b[y * luogo.w + x] = 1;
    gCache = { luogo, oggetti: luogo.oggetti, blocco: b };
    return b;
  }
  // percorso più breve a 8 direzioni senza tagliare gli angoli dei muri; null se non si arriva
  function percorso(da, a) {
    if (!luogo) return null;
    const W2 = luogo.w, H2 = luogo.h, b = bloccoPasso(), ok = (x, y) => x >= 0 && y >= 0 && x < W2 && y < H2 && !b[y * W2 + x];
    if (!ok(a.x, a.y)) return null;
    const prima = new Int32Array(W2 * H2).fill(-1), coda = [Math.round(da.y) * W2 + Math.round(da.x)]; prima[coda[0]] = coda[0];
    for (let q = 0; q < coda.length; q++) {
      const i = coda[q], x = i % W2, y = (i / W2) | 0;
      if (x === a.x && y === a.y) { const via = []; for (let k = i; k !== prima[k]; k = prima[k]) via.push({ x: k % W2, y: (k / W2) | 0 }); return via.reverse(); }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const nx = x + dx, ny = y + dy, j = ny * W2 + nx;
        if (!ok(nx, ny) || prima[j] >= 0 || (dx && dy && (!ok(x + dx, y) || !ok(x, y + dy)))) continue;
        prima[j] = i; coda.push(j);
      }
    }
    return null;
  }
  // caselle raggiungibili entro [passi] (movimento del turno)
  function raggiungibili(da, passi) {
    const W2 = luogo.w, H2 = luogo.h, b = bloccoPasso(), dist = new Int16Array(W2 * H2).fill(-1), q = [da.y * W2 + da.x]; dist[q[0]] = 0;
    for (let k = 0; k < q.length; k++) { const i = q[k], x = i % W2, y = (i / W2) | 0; if (dist[i] >= passi) continue; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) { const nx = x + dx, ny = y + dy, j = ny * W2 + nx; if (nx < 0 || ny < 0 || nx >= W2 || ny >= H2 || b[j] || dist[j] >= 0 || (dx && dy && (b[y * W2 + nx] || b[ny * W2 + x]))) continue; dist[j] = dist[i] + 1; q.push(j); } }
    return dist;
  }

  /* ---------------- zoom: due dita, rotellina, pulsanti; "tutta" mostra tutto ciò che è già stato scoperto ---------------- */
  function zoom(f, fx, fy) {
    if (!luogo || !cv) return;
    const box = cv.parentElement, vecchio = tile, b = box.getBoundingClientRect();
    fx = fx == null ? box.clientWidth / 2 : fx - b.left; fy = fy == null ? box.clientHeight / 2 : fy - b.top;
    const ox = cv.offsetLeft, cxC = (box.scrollLeft + fx - ox) / vecchio, cyC = (box.scrollTop + fy) / vecchio;
    if (f === 'tutta') {
      let x0 = luogo.w, y0 = luogo.h, x1 = -1, y1 = -1;
      for (let y = 0; y < luogo.h; y++) for (let x = 0; x < luogo.w; x++) if (extra.vedeTutto || !luogo.visto || luogo.visto[y * luogo.w + x] === '1') { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
      if (x1 < 0) { x0 = 0; y0 = 0; x1 = luogo.w - 1; y1 = luogo.h - 1; }
      const altezza = Math.min(opz.altezzaMax ? opz.altezzaMax() : 9999, window.innerHeight * 0.7);
      tileManuale = Math.max(6, Math.floor(Math.min(box.clientWidth / (x1 - x0 + 1), altezza / (y1 - y0 + 1))));
      adatta(); box.scrollLeft = x0 * tile; box.scrollTop = y0 * tile; return;
    }
    tileManuale = Math.max(6, Math.min(72, Math.round(vecchio * f)));
    if (tileManuale === vecchio) return;
    adatta(); box.scrollLeft = cxC * tile + cv.offsetLeft - fx; box.scrollTop = cyC * tile - fy;
  }

  /* ---------------- vista del personaggio (linea di vista, buio, scurovisione, torce) ---------------- */
  const SCUROVISIONE = { nano: 12, elfo: 12, mezzelfo: 12, mezzorco: 12, gnomo: 12, tiefling: 12, drow: 24, 'elfo oscuro': 24 };
  function scurovisione(id) { const r = String(opz.pg?.(id)?.razza || '').toLowerCase(); return Object.entries(SCUROVISIONE).find(([k]) => r.includes(k))?.[1] || 0; }
  function torcia(id) { const e = opz.pg?.(id)?.equip || []; return e.some(o => /lanterna/i.test(o.nome) && (o.qta ?? 1) > 0) ? 6 : e.some(o => /torcia|torce/i.test(o.nome) && (o.qta ?? 1) > 0) ? 4 : 0; }
  // 0 = non visibile, 1 = visto solo con la scurovisione (in bianco e nero), 2 = visibile
  function calcolaVista() {
    const io = opz.io?.(), s0 = segnalini[io];
    if (extra.vedeTutto || !s0 || s0.tipo !== 'pg') return null;
    const sv = scurovisione(io), chiave = `${cacheChiave}|${s0.x},${s0.y}|${sv}`;
    if (vista && vistaChiave === chiave) return vista;
    const w = luogo.w, hh = luogo.h, v = new Uint8Array(w * hh);
    const bl = new Uint8Array(w * hh);
    for (let y = 0; y < hh; y++) for (let x = 0; x < w; x++) bl[y * w + x] = muro(cella(x, y)) || casaDi(x, y) ? 1 : 0;
    for (const o of luogo.oggetti || []) if (BLOCCA_LUCE.includes(o.tipo)) bl[o.y * w + o.x] = 1;
    const blocca = (x, y) => bl[y * w + x];
    const ox = s0.x + 0.5, oy = s0.y + 0.5;
    for (let y = 0; y < hh; y++) for (let x = 0; x < w; x++) {
      const d = Math.hypot(x + 0.5 - ox, y + 0.5 - oy), passi = Math.ceil(d / 0.3); let libero = true;
      for (let i = 1; i < passi && libero; i++) { const qx = Math.floor(ox + (x + 0.5 - ox) * i / passi), qy = Math.floor(oy + (y + 0.5 - oy) * i / passi); if ((qx !== s0.x || qy !== s0.y) && (qx !== x || qy !== y) && blocca(qx, qy)) libero = false; }
      if (!libero) continue;
      const luce = luceCelle ? luceCelle[y * w + x] : 1;
      v[y * w + x] = luce >= 0.22 ? 2 : d <= sv ? 1 : d <= 1.5 ? 2 : 0;
    }
    vista = v; vistaChiave = chiave;
    return v;
  }
  function disegnaVista(t) {
    const v = calcolaVista(); if (!v) return;
    const c = document.createElement('canvas'); c.width = luogo.w; c.height = luogo.h;
    const k = c.getContext('2d'), img = k.createImageData(luogo.w, luogo.h);
    for (let i = 0; i < v.length; i++) { const a = v[i] === 2 ? 0 : v[i] === 1 ? 60 : 140; img.data[i * 4] = 6; img.data[i * 4 + 1] = 6; img.data[i * 4 + 2] = v[i] === 1 ? 22 : 10; img.data[i * 4 + 3] = a; }
    k.putImageData(img, 0, 0);
    ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(c, 0, 0, luogo.w * t, luogo.h * t); ctx.restore();
    if (v.some(x => x === 1)) { ctx.save(); ctx.globalCompositeOperation = 'saturation'; for (let i = 0; i < v.length; i++) if (v[i] === 1) { ctx.fillStyle = '#000'; ctx.fillRect((i % luogo.w) * t, Math.floor(i / luogo.w) * t, t + 0.5, t + 0.5); } ctx.restore(); }
  }
  const vedo = (x, y) => { const v = calcolaVista(); return !v || v[y * luogo.w + x] > 0; };

  /* ---------------- composizione dello strato fisso (in cache) ---------------- */
  // terreno, oggetti, edifici e alberi senza luci (serve anche al controllo automatico)
  function fondo(c, t) {
    const tutte = (fn) => { for (let y = 0; y < luogo.h; y++) for (let x = 0; x < luogo.w; x++) fn(c, cella(x, y), x, y, t); };
    tutte(base); if (P && esterno()) terrenoPacchetti(c, t); else tutte(texture); tutte(ombre); tutte(struttura); ombreSole(c, t);
    const ogg = (luogo.oggetti || []).filter(o => !(trascina?.ogg === o.id));
    ogg.filter(o => PIATTI.includes(o.tipo)).forEach(o => oggetto(c, o, t));
    for (const e of luogo.edifici) if (!(P && edificioPacchetti(c, e, t))) tetto(c, e, t);
    ogg.filter(o => !PIATTI.includes(o.tipo)).forEach(o => { if (!(P && oggettoPacchetti(c, o, t))) oggetto(c, o, t); });
    tutte((cc, ch, x, y) => { if (ch === 'T' && !(P && esterno() && alberoPacchetti(cc, x, y, t))) albero(cc, x, y, t); if (ch === 'R' && esterno() && !(rocciaPacchetto() && sprite(cc, 'roccia', x * t + t / 2, (y + 1) * t, t / 16, x, y))) oggetto(cc, { id: 'r' + x + '_' + y, tipo: 'masso', x, y }, t); });
  }
  function strato() {
    const t = tile, chiave = luogo.id + ':' + t + ':' + dpr + ':' + JSON.stringify(amb) + ':' + Math.floor(ora() * 2) + ':' + Object.entries(segnalini).filter(([id]) => torcia(id)).map(([id, sg]) => `${sg.x},${sg.y}`).join(';');
    if (cache && cacheChiave === chiave) return cache;
    const c0 = document.createElement('canvas'); c0.width = cv.width; c0.height = cv.height;
    const c = c0.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.imageSmoothingEnabled = true;
    fondo(c, t);
    // luce vera: buio secondo l'ora e il luogo, luci che proiettano le ombre dei muri; il bagliore si somma (e tremola) a parte
    const W = luogo.w * t, H = luogo.h * t;
    const ml = mappaLuce();
    bagliore = null; fiamme = [];
    if (ml) {
      c.save(); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
      c.globalCompositeOperation = 'multiply'; c.filter = `blur(${Math.round(t * 0.3)}px)`; c.drawImage(ml.scuro, 0, 0, W, H); c.filter = 'none';
      c.restore();
      const b = document.createElement('canvas'); b.width = c0.width; b.height = c0.height;
      const bc = b.getContext('2d'); bc.imageSmoothingEnabled = true; bc.imageSmoothingQuality = 'high'; bc.filter = `blur(${Math.round(t * 0.4 * dpr)}px)`; bc.drawImage(ml.luce, 0, 0, b.width, b.height); bc.filter = 'none';
      bagliore = b; fiamme = ml.sorgenti.filter(l => l.fiamma);
    }
    if (meteo() === 'nebbia' && esterno()) { c.fillStyle = 'rgba(200,205,215,.22)'; c.fillRect(0, 0, W, H); }
    // vignettatura
    const vg = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.35)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
    // griglia leggera da battle map
    c.strokeStyle = 'rgba(0,0,0,.16)'; c.lineWidth = 1; c.beginPath();
    for (let x = 0; x <= luogo.w; x++) { c.moveTo(x * t + .5, 0); c.lineTo(x * t + .5, H); }
    for (let y = 0; y <= luogo.h; y++) { c.moveTo(0, y * t + .5); c.lineTo(W, y * t + .5); }
    c.stroke();
    // nomi degli edifici e delle stanze
    for (const e of luogo.edifici) {
      if (!e.nome) continue;
      const X = e.x * t, Y = e.y * t, Wd = e.w * t, Hd = e.h * t, est = esterno();
      c.font = `600 ${Math.max(10, Math.min(13, t * 0.42))}px Inter, system-ui, sans-serif`;
      const label = e.nome + (e.stato !== 'integro' ? ` (${e.stato})` : ''), tw = c.measureText(label).width;
      const lx = Math.max(2, Math.min(W - tw - 8, X + Wd / 2 - tw / 2 - 4)), ly = est ? Y + Hd / 2 - 9 : Y + 3;
      c.fillStyle = 'rgba(20,17,15,.72)'; rr(c, lx, ly, tw + 8, 17, 5); c.fill();
      c.fillStyle = e.stato === 'integro' ? '#f3ead9' : '#ffb199'; c.fillText(label, lx + 4, ly + 12.5);
    }
    cache = c0; cacheChiave = chiave;
    return cache;
  }

  /* ---------------- segnalini: personaggi con ritratto, nemici ---------------- */
  function ritratto(id, s) {
    const pg = opz.pg?.(id) || (s && ['pg', 'alleato'].includes(s.tipo) ? { nome: s.nome || '?', razza: 'Umano', classe: 'Guerriero', livello: 1, equip: [] } : null); if (!pg || typeof Ritratto === 'undefined') return null;
    const svg = Ritratto.svg(pg, { dim: 64 }); let im = ritratti.get(id);
    if (!im || im.svg !== svg) { im = new Image(); im.svg = svg; im.onload = () => disegna(); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.includes('xmlns=') ? svg : svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')); ritratti.set(id, im); }
    return im.complete && im.naturalWidth ? im : null;
  }
  // mostri disegnati dall'AI (pixel art su fondo bianco): il bianco attaccato ai bordi diventa trasparente
  const mostriPronti = new Map();
  const nomeMostro = n => String(n || '').toLowerCase().replace(/[^a-zà-ù ]+/g, ' ').replace(/\s+/g, ' ').trim();
  function mostro(s) {
    const url = opz.urlMostro?.(nomeMostro(s.nome)); if (!url) return null;
    let m = mostriPronti.get(url);
    if (!m) {
      m = { pronto: null }; mostriPronti.set(url, m);
      const im = new Image(); im.crossOrigin = 'anonymous';
      im.onload = () => {
        const c = document.createElement('canvas'), w = c.width = im.naturalWidth, h = c.height = im.naturalHeight, k = c.getContext('2d'); k.drawImage(im, 0, 0);
        const d = k.getImageData(0, 0, w, h), p = d.data, visto = new Uint8Array(w * h), coda = [];
        const chiaro = i => p[i * 4] > 225 && p[i * 4 + 1] > 225 && p[i * 4 + 2] > 225;
        for (let x = 0; x < w; x++) coda.push(x, (h - 1) * w + x); for (let y = 0; y < h; y++) coda.push(y * w, y * w + w - 1);
        while (coda.length) { const i = coda.pop(); if (visto[i] || !chiaro(i)) continue; visto[i] = 1; p[i * 4 + 3] = 0; const x = i % w, y = (i / w) | 0; if (x > 0) coda.push(i - 1); if (x < w - 1) coda.push(i + 1); if (y > 0) coda.push(i - w); if (y < h - 1) coda.push(i + w); }
        k.putImageData(d, 0, 0);
        // ritaglio sulla figura
        let x0 = w, y0 = h, x1 = 0, y1 = 0; for (let i = 0; i < w * h; i++) if (p[i * 4 + 3]) { const x = i % w, y = (i / w) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        const r = document.createElement('canvas'); r.width = Math.max(1, x1 - x0 + 1); r.height = Math.max(1, y1 - y0 + 1); r.getContext('2d').drawImage(c, -x0, -y0);
        m.pronto = r; disegna(); cambiato();
      };
      im.src = url;
    }
    return m.pronto;
  }
  const GRANDI = /drag|gigant|troll|ogre|orco gigante|beholder|idra|hydra|elemental|golem|manticora|grifone|viverna|chimera/;
  // foglio LPC della figura (personaggio, PNG o nemico con forma umana) se pronto
  function figura(id, s) { if (typeof Lpc === 'undefined') return null; return Lpc.foglio(s.tipo === 'pg' ? Lpc.daPg(opz.pg?.(id)) : Lpc.daNome(s.nome, s.tipo)); }
  function segnalino(id, s, pos, t) {
    const cx = pos.x * t + t / 2, cy = pos.y * t + t / 2, R = t * 0.44;
    ovale(ctx, cx + t * 0.06, cy + t * 0.1, R, R * 0.9, 'rgba(0,0,0,.45)');
    if (s.tipo === 'nemico' && !figura(id, s) && mostro(s)) {
      // mostro disegnato in piedi sulla basetta rossa, girato verso il personaggio più vicino
      const im = mostro(s), bx = cx, by = cy + t * 0.22, rx = R * 0.95, ry = R * 0.42, grande = GRANDI.test(nomeMostro(s.nome));
      const H = t * (grande ? 2.6 : 1.5), W = H * im.width / im.height, vicino = Object.values(segnalini).filter(o => o.tipo === 'pg').sort((a, b) => Math.hypot(a.x - s.x, a.y - s.y) - Math.hypot(b.x - s.x, b.y - s.y))[0];
      ovale(ctx, bx + t * 0.05, by + t * 0.05, rx * (grande ? 1.6 : 1.05), ry * 1.1, 'rgba(0,0,0,.5)');
      ctx.fillStyle = '#d84b3c'; ctx.beginPath(); ctx.ellipse(bx, by, rx, ry, 0, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(20,17,15,.9)'; ctx.lineWidth = Math.max(1.5, t / 16); ctx.stroke();
      ctx.save(); ctx.translate(bx, 0); if (vicino && vicino.x < s.x) ctx.scale(-1, 1); ctx.drawImage(im, -W / 2, by - H + ry * 0.4, W, H); ctx.restore();
      if (s.pf !== undefined && extra.vedeTutto) { ctx.font = `700 ${Math.max(9, t * 0.3)}px Inter, sans-serif`; ctx.fillStyle = '#ffd6cc'; ctx.textAlign = 'center'; ctx.fillText(`PF ${s.pf}`, bx, by - H - 2); ctx.textAlign = 'start'; }
      if (t >= 12 && s.nome) { ctx.font = `600 ${Math.max(9, t * 0.34)}px Inter, system-ui, sans-serif`; let nome = s.nome.split(/\s+/)[0]; while (nome.length > 3 && ctx.measureText(nome).width > Math.max(t * 2.2, 54)) nome = nome.slice(0, -2) + '…'; const nw = ctx.measureText(nome).width; ctx.fillStyle = 'rgba(70,14,12,.85)'; rr(ctx, bx - nw / 2 - 4, by + ry + 2, nw + 8, t * 0.42, 4); ctx.fill(); ctx.fillStyle = '#f3ead9'; ctx.fillText(nome, bx - nw / 2, by + ry + t * 0.33); }
      return;
    }
    if (s.tipo === 'nemico' && !figura(id, s)) {
      ctx.fillStyle = '#3a0e0c'; ctx.beginPath();
      for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283, d = k % 2 ? R : R * 0.82; k ? ctx.lineTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d) : ctx.moveTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d); }
      ctx.closePath(); ctx.fill(); ctx.strokeStyle = s.colore || '#d84b3c'; ctx.lineWidth = Math.max(2, t / 12); ctx.stroke();
      const g = ctx.createRadialGradient(cx - R * 0.2, cy - R * 0.2, 1, cx, cy, R * 0.75); g.addColorStop(0, '#b0302a'); g.addColorStop(1, '#5a1210'); ovale(ctx, cx, cy, R * 0.72, R * 0.72, g);
      ctx.fillStyle = '#ffe8e0'; ctx.font = `800 ${Math.max(10, t * 0.42)}px Inter, system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText((s.nome || '?').charAt(0).toUpperCase(), cx, cy + 1);
      if (s.pf !== undefined && extra.vedeTutto) { ctx.font = `700 ${Math.max(9, t * 0.3)}px Inter, sans-serif`; ctx.fillStyle = '#ffd6cc'; ctx.fillText(`PF ${s.pf}`, cx, cy - R - t * 0.15); }
    } else if (figura(id, s)) {
      const sh = figura(id, s), p = passi.get(id), bx = cx, by = cy + t * 0.22, rx = R * 0.95, ry = R * 0.42;
      const colBase = s.tipo === 'nemico' ? '#d84b3c' : s.tipo === 'png' ? '#bfae86' : s.colore || '#e8b04b';
      ovale(ctx, bx + t * 0.05, by + t * 0.05, rx * 1.05, ry * 1.1, 'rgba(0,0,0,.5)');
      ctx.fillStyle = colBase; ctx.beginPath(); ctx.ellipse(bx, by, rx, ry, 0, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(bx, by, rx * 0.72, ry * 0.62, 0, 0, 7); ctx.fill();
      const pg = s.tipo === 'pg' ? opz.pg?.(id) : null;
      if (pg?.pfMax) { const f = Math.max(0, Math.min(1, pg.pf / pg.pfMax)); ctx.strokeStyle = f > 0.5 ? '#5cc85c' : f > 0.25 ? '#e8b04b' : '#e04a3a'; ctx.lineWidth = Math.max(2, t / 11); ctx.beginPath(); ctx.ellipse(bx, by, rx * 0.86, ry * 0.8, 0, -Math.PI / 2, -Math.PI / 2 + f * 6.283); ctx.stroke(); }
      ctx.strokeStyle = id === opz.io() ? '#ffffff' : 'rgba(20,17,15,.9)'; ctx.lineWidth = Math.max(1.5, t / 16); ctx.beginPath(); ctx.ellipse(bx, by, rx, ry, 0, 0, 7); ctx.stroke();
      const F = t * 1.6, col = p?.cammina ? 1 + Math.floor(p.fase) % 8 : 0, riga = p?.dir ?? 2;
      const cond = new Set((pg?.condizioni || []).map(c => String(c).toLowerCase())), ko = pg && pg.pf <= 0;
      const att = effetti.find(e => e.tipo === 'attacco' && e.id === id), mossa = att ? Lpc.foglio(s.tipo === 'pg' ? Lpc.daPg(pg) : Lpc.daNome(s.nome, s.tipo), att.anim) : null;
      ctx.save(); ctx.imageSmoothingEnabled = false;
      ctx.filter = cond.has('avvelenato') ? 'sepia(1) hue-rotate(50deg) saturate(2.5)' : cond.has('paralizzato') || cond.has('pietrificato') ? 'grayscale(.6) hue-rotate(170deg)' : ko ? 'grayscale(.8) brightness(.8)' : 'none';
      if (cond.has('invisibile')) ctx.globalAlpha = 0.35;
      if (mossa) { // mossa di battaglia: riga verso destra, specchiata se il bersaglio è a sinistra
        const n = Math.max(1, Math.floor(mossa.width / 192)), k = Math.min(n - 1, Math.floor((performance.now() - att.t0) / att.durata * n)), G = F * 3;
        ctx.translate(bx, 0); ctx.scale(att.verso, 1); ctx.drawImage(mossa, k * 192, 0, 192, 192, -G / 2, by - G * 121 / 192, G, G);
      } else if (ko || cond.has('prono') || cond.has('incosciente')) { ctx.translate(bx, by - t * 0.15); ctx.rotate(Math.PI / 2); ctx.drawImage(sh, 0, 2 * 64, 64, 64, -F * 0.75, -F / 2, F, F); }
      else ctx.drawImage(sh, col * 64, riga * 64, 64, 64, bx - F / 2, by - F * 57 / 64, F, F);
      ctx.restore(); ctx.imageSmoothingEnabled = true;
      if (cond.has('spaventato')) { ctx.font = `800 ${t * 0.5}px Inter, sans-serif`; ctx.fillStyle = '#c99bff'; ctx.textAlign = 'center'; ctx.fillText('!', bx + t * 0.4, by - F * 0.75); ctx.textAlign = 'start'; }
      if (cond.has('stordito') || cond.has('confuso')) for (let k = 0; k < 3; k++) { const a = performance.now() / 300 + k * 2.1; ctx.fillStyle = '#ffe070'; ctx.font = `700 ${t * 0.3}px Inter, sans-serif`; ctx.fillText('★', bx + Math.cos(a) * t * 0.35 - t * 0.1, by - F * 0.82 + Math.sin(a) * t * 0.1); }
      if (cond.has('avvelenato')) for (let k = 0; k < 3; k++) { const f = ((performance.now() / 900) + k / 3) % 1; ovale(ctx, bx + (k - 1) * t * 0.2, by - F * 0.5 - f * t * 0.6, t * 0.05, t * 0.05, `rgba(120,220,80,${1 - f})`); }
      if (s.tipo === 'nemico' && s.pf !== undefined && extra.vedeTutto) { ctx.font = `700 ${Math.max(9, t * 0.3)}px Inter, sans-serif`; ctx.fillStyle = '#ffd6cc'; ctx.textAlign = 'center'; ctx.fillText(`PF ${s.pf}`, bx, by - F * 0.8); }
      ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
      if (t >= 12 && s.nome) { ctx.font = `600 ${Math.max(9, t * 0.34)}px Inter, system-ui, sans-serif`; let nome = s.nome.split(/\s+/)[0]; while (nome.length > 3 && ctx.measureText(nome).width > Math.max(t * 2.2, 54)) nome = nome.slice(0, -2) + '…'; const nw = ctx.measureText(nome).width; ctx.fillStyle = s.tipo === 'nemico' ? 'rgba(70,14,12,.85)' : 'rgba(20,17,15,.78)'; rr(ctx, bx - nw / 2 - 4, by + ry + 2, nw + 8, t * 0.42, 4); ctx.fill(); ctx.fillStyle = '#f3ead9'; ctx.fillText(nome, bx - nw / 2, by + ry + t * 0.33); }
      return;
    } else if (['pg', 'alleato'].includes(s.tipo) && ritratto(id, s)) {
      // figura in piedi (HD-2D): basetta colorata a terra con i punti ferita, personaggio intero sopra
      const im = ritratto(id, s), bx = cx, by = cy + t * 0.22, rx = R * 0.95, ry = R * 0.42;
      ovale(ctx, bx + t * 0.05, by + t * 0.05, rx * 1.05, ry * 1.1, 'rgba(0,0,0,.5)');
      ctx.fillStyle = s.colore || '#e8b04b'; ctx.beginPath(); ctx.ellipse(bx, by, rx, ry, 0, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(bx, by, rx * 0.72, ry * 0.62, 0, 0, 7); ctx.fill();
      const pg = opz.pg?.(id);
      if (pg?.pfMax) { const f = Math.max(0, Math.min(1, pg.pf / pg.pfMax)); ctx.strokeStyle = f > 0.5 ? '#5cc85c' : f > 0.25 ? '#e8b04b' : '#e04a3a'; ctx.lineWidth = Math.max(2, t / 11); ctx.beginPath(); ctx.ellipse(bx, by, rx * 0.86, ry * 0.8, 0, -Math.PI / 2, -Math.PI / 2 + f * 6.283); ctx.stroke(); }
      ctx.strokeStyle = id === opz.io() ? '#ffffff' : 'rgba(20,17,15,.9)'; ctx.lineWidth = Math.max(1.5, t / 16); ctx.beginPath(); ctx.ellipse(bx, by, rx, ry, 0, 0, 7); ctx.stroke();
      const iw = t * 1.05, ih = iw * 44 / 36;
      ctx.imageSmoothingEnabled = false; ctx.drawImage(im, bx - iw / 2, by - ih + ry * 0.6, iw, ih); ctx.imageSmoothingEnabled = true;
      ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
      if (t >= 12 && s.nome) { ctx.font = `600 ${Math.max(9, t * 0.34)}px Inter, system-ui, sans-serif`; let nome = s.nome.split(/\s+/)[0]; while (nome.length > 3 && ctx.measureText(nome).width > Math.max(t * 2.2, 54)) nome = nome.slice(0, -2) + '…'; const nw = ctx.measureText(nome).width; ctx.fillStyle = 'rgba(20,17,15,.78)'; rr(ctx, bx - nw / 2 - 4, by + ry + 2, nw + 8, t * 0.42, 4); ctx.fill(); ctx.fillStyle = '#f3ead9'; ctx.fillText(nome, bx - nw / 2, by + ry + t * 0.33); }
      return;
    } else {
      ctx.fillStyle = s.colore || '#e8b04b'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
      const im = ritratto(id);
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R * 0.84, 0, 7); ctx.clip();
      ctx.fillStyle = '#1a1512'; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      if (im) { ctx.imageSmoothingEnabled = false; const iw = R * 2.4, ih = iw * 44 / 36; ctx.drawImage(im, cx - iw / 2, cy - R * 1.05, iw, ih); ctx.imageSmoothingEnabled = true; }
      else { ctx.fillStyle = '#f3ead9'; ctx.font = `700 ${Math.max(10, t * 0.45)}px Inter, system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText((s.nome || '?').charAt(0).toUpperCase(), cx, cy + 1); }
      ctx.restore();
      // punti ferita come arco attorno al ritratto
      const pg = opz.pg?.(id);
      if (pg?.pfMax) { const f = Math.max(0, Math.min(1, pg.pf / pg.pfMax)); ctx.strokeStyle = f > 0.5 ? '#5cc85c' : f > 0.25 ? '#e8b04b' : '#e04a3a'; ctx.lineWidth = Math.max(2, t / 12); ctx.beginPath(); ctx.arc(cx, cy, R * 0.92, -Math.PI / 2, -Math.PI / 2 + f * 6.283); ctx.stroke(); }
      ctx.strokeStyle = id === opz.io() ? '#ffffff' : 'rgba(20,17,15,.9)'; ctx.lineWidth = Math.max(1.5, t / 16); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
    }
    ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
    if (t >= 12 && s.nome) { ctx.font = `600 ${Math.max(9, t * 0.34)}px Inter, system-ui, sans-serif`; let nome = s.nome.split(/\s+/)[0]; while (nome.length > 3 && ctx.measureText(nome).width > Math.max(t * 2.2, 54)) nome = nome.slice(0, -2) + '…'; s = { ...s, nome }; const nw = ctx.measureText(s.nome).width; ctx.fillStyle = 'rgba(20,17,15,.78)'; rr(ctx, cx - nw / 2 - 4, cy + R + 2, nw + 8, t * 0.42, 4); ctx.fill(); ctx.fillStyle = '#f3ead9'; ctx.fillText(s.nome, cx - nw / 2, cy + R + t * 0.33); }
  }

  function disegna(animando) {
    if (!ctx || !luogo) return;
    const t = tile;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(strato(), 0, 0);
    if (bagliore) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.82 + Math.random() * 0.18; ctx.drawImage(bagliore, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.imageSmoothingEnabled = true;
    for (const f of fiamme) if (!luogo.visto || extra.vedeTutto || luogo.visto[Math.floor(f.y) * luogo.w + Math.floor(f.x)] !== '0') fiamma(ctx, f.x * t + (Math.random() - 0.5) * t * 0.04, f.y * t + (Math.random() - 0.5) * t * 0.04, t * (0.12 + Math.random() * 0.06));
    if (trascina?.ogg) { const o = luogo.oggetti.find(o => o.id === trascina.ogg); if (o) { ctx.globalAlpha = 0.85; oggetto(ctx, o, t, trascina.x * t, trascina.y * t); ctx.globalAlpha = 1; } }
    // caselle raggiungibili nel turno
    if (extra.movimento && segnalini[extra.movimento.id]) {
      const s0 = segnalini[extra.movimento.id], r = extra.movimento.celle;
      ctx.fillStyle = 'rgba(91,143,217,.18)';
      const dist = raggiungibili(s0, r);
      for (let i = 0; i < dist.length; i++) if (dist[i] > 0) ctx.fillRect((i % luogo.w) * t, Math.floor(i / luogo.w) * t, t, t);
    }
    // aree degli incantesimi
    for (const a of extra.aree || []) {
      ctx.fillStyle = (a.colore || '#e0602a') + '55';
      for (const [x, y] of celleArea(a)) ctx.fillRect(x * t, y * t, t, t);
      ctx.strokeStyle = a.colore || '#e0602a'; ctx.lineWidth = 2; ctx.strokeRect(a.x * t + 1, a.y * t + 1, t - 2, t - 2);
      if (a.nome && t >= 12) { ctx.font = `600 ${Math.max(9, t * 0.42)}px Inter, system-ui, sans-serif`; ctx.fillStyle = '#fff'; ctx.fillText(a.nome, a.x * t + 2, a.y * t - 3); }
    }
    // nebbia di guerra: il master vede attraverso
    if (luogo.visto) {
      ctx.fillStyle = extra.vedeTutto ? 'rgba(8,6,5,.45)' : '#0b0908';
      for (let y = 0; y < luogo.h; y++) for (let x = 0; x < luogo.w; x++) if (luogo.visto[y * luogo.w + x] === '0') ctx.fillRect(x * t, y * t, t + 0.5, t + 0.5);
    }
    disegnaVista(t);
    // note dei giocatori: spilla gialla con il testo (solo sulle caselle già scoperte)
    for (const n of extra.note || []) {
      if (luogo.visto && !extra.vedeTutto && luogo.visto[n.y * luogo.w + n.x] === '0') continue;
      const cx = (n.x + 0.5) * t, cy = (n.y + 0.35) * t, r = Math.max(3.5, t * 0.2);
      ctx.strokeStyle = '#3a2a10'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + t * 0.45); ctx.stroke();
      ctx.fillStyle = '#e8c86a'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill(); ctx.stroke();
      if (t >= 14) { ctx.font = `600 ${Math.max(9, t * 0.36)}px Inter, system-ui, sans-serif`; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.75)'; ctx.strokeText(n.testo, cx + r + 2, cy + 3); ctx.fillStyle = '#fff3d0'; ctx.fillText(n.testo, cx + r + 2, cy + 3); }
    }
    if (evidenzia) { const e = luogo.edifici.find(e => e.id === evidenzia); if (e) { ctx.strokeStyle = '#ffd25a'; ctx.lineWidth = 2; ctx.strokeRect(e.x * t + 1, e.y * t + 1, e.w * t - 2, e.h * t - 2); } }
    // segnalini dal fondo verso chi sta davanti, così le figure in piedi si sovrappongono come in HD-2D
    const adesso = performance.now(), dt = Math.min(0.1, (adesso - (ultimoPasso || adesso)) / 1000); ultimoPasso = adesso; inMovimento = false;
    for (const [id, sg] of Object.entries(segnalini)) {
      let p = passi.get(id);
      if (!p || p.luogo !== luogo.id || trascina?.id === id) { p = { x: sg.x, y: sg.y, dir: p?.dir ?? 2, fase: 0, luogo: luogo.id }; passi.set(id, p); }
      // la figura cammina lungo il percorso vero (gira intorno ai muri), non in linea d'aria
      const meta = sg.x + ',' + sg.y;
      if (p.meta !== meta) { p.meta = meta; p.via = (Math.hypot(sg.x - p.x, sg.y - p.y) > 0.01 && percorso({ x: p.x, y: p.y }, sg)) || null; if (p.via?.length > 30) p.via = null; if (!p.via) { p.x = sg.x; p.y = sg.y; } }
      const tappa = p.via?.[0] || sg, dx = tappa.x - p.x, dy = tappa.y - p.y, d = Math.hypot(dx, dy);
      if (d > 0.01) { const v = Math.min(d, dt * 4.5); p.x += dx / d * v; p.y += dy / d * v; p.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 3 : 1) : (dy > 0 ? 2 : 0); p.fase += dt * 9; p.cammina = true; inMovimento = true; }
      else if (p.via?.length) { p.via.shift(); inMovimento = true; }
      else { p.x = sg.x; p.y = sg.y; p.cammina = false; p.fase = 0; }
    }
    Object.entries(segnalini).map(([id, s]) => [id, s, trascina?.id === id ? trascina : passi.get(id) || s]).sort((a, b) => a[2].y - b[2].y).forEach(([id, s, pos]) => {
      if (!extra.vedeTutto && (s.tipo === 'nemico' || s.tipo === 'png') && ((luogo.visto && luogo.visto[s.y * luogo.w + s.x] === '0') || !vedo(s.x, s.y))) return;
      segnalino(id, s, pos, t);
    });
    disegnaEffetti(t);
    meteoAnimato(t);
  }
  const COLORI_AREA = [[/fuoco|fiamm|infern|brucia/i, [255, 120, 30]], [/gelo|ghiacc|fredd|neve/i, [120, 210, 255]], [/fulmin|tuono|elettr|lampo/i, [250, 240, 140]], [/acid|veleno|nube/i, [130, 220, 70]], [/necro|ombra|morte|oscur/i, [160, 90, 220]], [/luce|sacr|radios|guarig/i, [255, 240, 190]]];
  function disegnaEffetti(t) {
    const adesso = performance.now();
    for (const e of effetti) {
      const f = (adesso - e.t0) / e.durata; if (f < 0 || f > 1) continue;
      if (e.tipo === 'area') {
        const rgb = (COLORI_AREA.find(([re]) => re.test(e.area.nome || '')) || [0, (e.area.colore || '#e0602a').match(/\w\w/g).map(h => parseInt(h, 16))])[1];
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (const [x, y] of celleArea(e.area)) { const fl = Math.random() * 0.4 + 0.6, cx = x * t + t / 2, cy = y * t + t / 2, g = ctx.createRadialGradient(cx, cy, 0, cx, cy, t * (0.6 + f)); g.addColorStop(0, `rgba(${rgb},${(1 - f) * 0.85 * fl})`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; ctx.fillRect(cx - t * 1.6, cy - t * 1.6, t * 3.2, t * 3.2); }
        const cx = e.area.x * t + t / 2, cy = e.area.y * t + t / 2; ctx.strokeStyle = `rgba(${rgb},${1 - f})`; ctx.lineWidth = t * 0.15 * (1 - f); ctx.beginPath(); ctx.arc(cx, cy, t * (0.3 + f * (e.area.dim || 3) * 1.1), 0, 7); ctx.stroke();
        ctx.restore();
      } else if (e.tipo === 'testo') {
        const sg = segnalini[e.id] || e.pos; if (!sg) continue;
        const p = passi.get(e.id) || sg, x = p.x * t + t / 2, y = p.y * t - t * 0.6 - f * t * 1.1;
        ctx.save(); ctx.globalAlpha = Math.min(1, (1 - f) * 2); ctx.font = `900 ${Math.max(14, t * 0.62)}px Inter, system-ui, sans-serif`; ctx.textAlign = 'center';
        ctx.lineWidth = Math.max(3, t / 8); ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.strokeText(e.testo, x, y); ctx.fillStyle = e.colore; ctx.fillText(e.testo, x, y); ctx.restore();
      } else if (e.tipo === 'sconfitto') {
        const x = e.pos.x * t + t / 2, y = e.pos.y * t + t / 2;
        ctx.save(); ctx.globalAlpha = 1 - f; for (let k = 0; k < 10; k++) { const a = k * 0.628, d = t * (0.2 + f * 0.9); ovale(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d - f * t * 0.3, t * 0.12 * (1 - f), t * 0.12 * (1 - f), 'rgba(200,190,180,.9)'); } ctx.restore();
      }
    }
  }
  // chiamati dall'app quando succede qualcosa
  function effettoTesto(id, testo, colore, pos) { effetti.push({ tipo: 'testo', id, testo, colore, pos, t0: performance.now(), durata: 1400 }); disegna(); }
  function effettoArea(area) { effetti.push({ tipo: 'area', area, t0: performance.now(), durata: 1500 }); disegna(); }
  function sconfitto(pos) { effetti.push({ tipo: 'sconfitto', pos, t0: performance.now(), durata: 900 }); disegna(); }
  function attacco(id) {
    const s = segnalini[id]; if (!s || typeof Lpc === 'undefined') return;
    const desc = s.tipo === 'pg' ? Lpc.daPg(opz.pg?.(id)) : Lpc.daNome(s.nome, s.tipo); if (!desc) return;
    const avversari = Object.values(segnalini).filter(o => s.tipo === 'nemico' ? o.tipo === 'pg' : o.tipo === 'nemico');
    const vicino = avversari.sort((a, b) => Math.hypot(a.x - s.x, a.y - s.y) - Math.hypot(b.x - s.x, b.y - s.y))[0];
    const anim = Lpc.mossa(desc);
    Lpc.foglio(desc, anim); // inizia a scaricarla
    effetti = effetti.filter(e => !(e.tipo === 'attacco' && e.id === id));
    effetti.push({ tipo: 'attacco', id, anim, verso: vicino && vicino.x < s.x ? -1 : 1, t0: performance.now(), durata: anim === 'shoot' ? 1100 : 750 });
    disegna();
  }

  /* ---------------- tocchi ---------------- */
  function posDa(ev) { const b = cv.getBoundingClientRect(); return { x: Math.floor((ev.clientX - b.left) / tile), y: Math.floor((ev.clientY - b.top) / tile) }; }
  const oggettoIn = (x, y) => (luogo.oggetti || []).find(o => o.x === x && o.y === y);
  function giu(ev) {
    if (!luogo) return;
    tocchi.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (tocchi.size === 2) { // due dita: zoom (annulla il tocco o il trascinamento appena iniziato)
      const [a, b] = [...tocchi.values()]; annullaPremi(); trascina = null; pan = null; dopoPizzico = true;
      const r = cv.getBoundingClientRect(), ox = (a.x + b.x) / 2, oy = (a.y + b.y) / 2;
      pizzico = { d0: Math.max(20, Math.hypot(a.x - b.x, a.y - b.y)), t0: tile, ox, oy, f: 1 }; cv.style.transformOrigin = `${ox - r.left}px ${oy - r.top}px`; disegna(); return;
    }
    if (tocchi.size > 2 || dopoPizzico) return;
    const q = posDa(ev);
    if (attesaArea) { const cb = attesaArea; attesaArea = null; cv.style.cursor = ''; cb(q.x, q.y); return; }
    const id = Object.keys(segnalini).find(k => segnalini[k].x === q.x && segnalini[k].y === q.y && opz.puoMuovere(k));
    if (id) { trascina = { id, x: q.x, y: q.y }; cv.setPointerCapture(ev.pointerId); ev.preventDefault(); return; }
    // il master umano sposta gli oggetti movibili trascinandoli
    const o = oggettoIn(q.x, q.y);
    if (o && o.movibile && opz.puoMuovereOggetti?.()) { trascina = { ogg: o.id, x: q.x, y: q.y }; cacheChiave = ''; cv.setPointerCapture(ev.pointerId); ev.preventDefault(); disegna(); return; }
    // tocco breve = muovi qui il tuo segnalino; pressione lunga = scheda dell'edificio
    annullaPremi();
    try { cv.setPointerCapture(ev.pointerId); } catch {}
    premi = { x: q.x, y: q.y, sx: ev.clientX, sy: ev.clientY, sl: cv.parentElement.scrollLeft, st: cv.parentElement.scrollTop, timer: setTimeout(() => {
      const p = premi; premi = null;
      const ed = scoperta(p.x, p.y) && luogo.edifici.find(e => dentroEd(e, p.x, p.y));
      if (ed) { evidenzia = ed.id; disegna(); opz.onEdificio?.(ed); setTimeout(() => { evidenzia = null; disegna(); }, 1500); }
    }, 450) };
  }
  // ciò che il gruppo non ha ancora visto resta nascosto anche alla pressione lunga (il master vede tutto)
  const scoperta = (x, y) => extra.vedeTutto || !luogo.visto || luogo.visto[y * luogo.w + x] !== '0';
  // un personaggio arriva solo dove si può camminare: niente muri attraversati (il master può piazzare mostri e PNG ovunque)
  function vaiA(id, x, y) {
    const s0 = segnalini[id]; if (!s0) return false;
    if (Object.entries(segnalini).some(([k, s]) => k !== id && s.x === x && s.y === y)) return false;
    const aPiedi = (s0.tipo || 'pg') === 'pg' && (id === opz.io() || !opz.capo?.());
    if (aPiedi && (s0.x !== x || s0.y !== y) && !percorso(s0, { x, y })) { opz.onBloccato?.(); return false; }
    if (!aPiedi && bloccoPasso()[y * luogo.w + x]) return false;
    segnalini[id] = { ...s0, x, y }; disegna(); opz.onMuovi?.(id, x, y); cambiato(); return true;
  }
  function annullaPremi() { if (premi) clearTimeout(premi.timer); premi = null; }
  function muovi(ev) {
    if (tocchi.has(ev.pointerId)) tocchi.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (pizzico) { if (tocchi.size === 2) { const [a, b] = [...tocchi.values()], voluto = Math.max(6, Math.min(72, pizzico.t0 * Math.hypot(a.x - b.x, a.y - b.y) / pizzico.d0)); pizzico.f = voluto / tile; cv.style.transform = `scale(${pizzico.f})`; } return; }
    if (pan) { const box = cv.parentElement; box.scrollLeft = pan.sl - (ev.clientX - pan.sx); box.scrollTop = pan.st - (ev.clientY - pan.sy); return; }
    // un dito che scivola sul vuoto scorre la mappa (non è più un tocco)
    if (premi && Math.hypot(ev.clientX - premi.sx, ev.clientY - premi.sy) > 8) { pan = { sx: premi.sx, sy: premi.sy, sl: premi.sl, st: premi.st }; annullaPremi(); return; }
    if (!trascina) return; const q = posDa(ev); if (q.x !== trascina.x || q.y !== trascina.y) { trascina.x = Math.max(0, Math.min(luogo.w - 1, q.x)); trascina.y = Math.max(0, Math.min(luogo.h - 1, q.y)); disegna(); } }
  function su(ev) {
    tocchi.delete(ev?.pointerId);
    if (pizzico) { const p = pizzico; pizzico = null; cv.style.transform = ''; if (Math.abs(p.f - 1) > 0.02) zoom(p.f, p.ox, p.oy); }
    if (dopoPizzico || pan) { if (!tocchi.size) { pan = null; dopoPizzico = false; } annullaPremi(); trascina = null; disegna(); return; }
    if (premi) {
      const p = premi; annullaPremi();
      vaiA(opz.io(), p.x, p.y);
      return;
    }
    if (!trascina) return;
    const t = trascina; trascina = null;
    if (t.ogg) { const o = luogo.oggetti.find(o => o.id === t.ogg); if (o) { o.x = t.x; o.y = t.y; } cacheChiave = ''; disegna(); opz.onMuoviOggetto?.(t.ogg, t.x, t.y); return; }
    if (!vaiA(t.id, t.x, t.y)) disegna();
  }
  // per i suoni della scena: meteo, se si è all'aperto e quanto è vicino un fuoco al mio personaggio (0..1)
  function ambienteSonoro() {
    if (!luogo) return { meteo: '', esterno: false, fuoco: 0 };
    const io = segnalini[opz.io?.()]; let fuoco = 0;
    if (io) for (const f of fiamme) fuoco = Math.max(fuoco, 1 - Math.hypot(f.x - io.x - 0.5, f.y - io.y - 0.5) / 6);
    return { meteo: meteo(), esterno: esterno(), fuoco: Math.max(0, fuoco), notte: notte() };
  }
  function setVisto(id, visto) { if (luogo && luogo.id === id) { luogo.visto = visto; if (opz.vediTutto?.()) zoom('tutta'); disegna(); cambiato(); } }
  /* ---------------- per la vista 3D (mappa3d.js): stessi dati, stesse regole ---------------- */
  // terreno piatto (pavimenti, strade, erba, acqua, porte, bancone, camino, scale, tappeti) a [px] pixel per casella
  function terreno3D(px) {
    const c0 = document.createElement('canvas'); c0.width = luogo.w * px; c0.height = luogo.h * px;
    const c = c0.getContext('2d'), salva = dpr; dpr = 1;
    const tutte = (fn) => { for (let y = 0; y < luogo.h; y++) for (let x = 0; x < luogo.w; x++) fn(c, cella(x, y), x, y, px); };
    tutte(base); tutte(texture); tutte((cc, ch, x, y, t) => { if (!muro(ch)) ombre(cc, ch, x, y, t); }); tutte((cc, ch, x, y, t) => { if (ch !== 'f') struttura(cc, ch, x, y, t); });
    for (const o of luogo.oggetti || []) if (PIATTI.includes(o.tipo)) oggetto(c, o, px);
    dpr = salva;
    return c0;
  }
  // disegno dall'alto di un oggetto, per quelli che in 3D restano decalcomanie
  function spriteOggetto(o, px) { const c = document.createElement('canvas'); c.width = c.height = px * 2; oggetto(c.getContext('2d'), { ...o, x: 0, y: 0 }, px, px / 2, px / 2); return c; }
  function dati3D() {
    if (!luogo) return null;
    if (cv && cv.width) strato(); // calcola luce per casella e fiamme
    return { luogo, segnalini, extra, amb: luceAmbiente(), sole: sole() ? vettoreSole() : null, sorgenti: sorgenti(), stagione: stagione(), meteo: meteo(), innevato: innevato(), esterno: esterno(), notte: notte(), vista: calcolaVista(), chiave: cacheChiave };
  }
  // stesso comportamento dei tocchi in 2D: breve = vai lì, lungo = scheda dell'edificio
  function azioneCasella(x, y, lunga) {
    if (!luogo || x < 0 || y < 0 || x >= luogo.w || y >= luogo.h) return;
    if (attesaArea) { const cb = attesaArea; attesaArea = null; cb(x, y); return; }
    if (lunga) { const ed = scoperta(x, y) && luogo.edifici.find(e => dentroEd(e, x, y)); if (ed) opz.onEdificio?.(ed); return; }
    vaiA(opz.io(), x, y);
  }
  const casa3D = (x, y) => casaDi(x, y);
  // controllo automatico della mappa disegnata: caselle nere sul prato, figure mancanti, nome che non c'entra col disegno
  async function controllo() {
    const prob = []; if (!luogo) return prob;
    await new Promise(r => setTimeout(r, 400));
    if (esterno()) {
      const px = 24, c0 = document.createElement('canvas'); c0.width = luogo.w * px; c0.height = luogo.h * px;
      const k = c0.getContext('2d'), salva = dpr; dpr = 1; try { fondo(k, px); } finally { dpr = salva; }
      const scure = [];
      const inEdificio = (x, y) => luogo.edifici.some(e => x >= e.x && x < e.x + e.w && y >= e.y && y < e.y + e.h);
      for (let y = 0; y < luogo.h; y++) for (let x = 0; x < luogo.w; x++) {
        const ch = cella(x, y); if ('#w~'.includes(ch) || inEdificio(x, y)) continue;
        const d = k.getImageData(Math.floor((x + 0.25) * px), Math.floor((y + 0.25) * px), Math.max(1, Math.floor(px / 2)), Math.max(1, Math.floor(px / 2))).data;
        let l = 0; for (let i = 0; i < d.length; i += 4) l += (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255; l /= d.length / 4;
        if (l < 0.1) scure.push(`${x},${y} '${ch}'`);
      }
      if (scure.length) prob.push(`${scure.length} caselle nere sul terreno all'aperto (${scure.slice(0, 6).join('; ')})`);
    }
    for (const [id, s] of Object.entries(segnalini)) if (['pg', 'alleato'].includes(s.tipo) && !ritratto(id, s)) { await new Promise(r => setTimeout(r, 300)); if (!ritratto(id, s)) prob.push(`segnalino senza figura: ${s.nome || id}`); }
    const n = (luogo.nome || '').toLowerCase();
    if (/ponte|viadott|guado|fiume|torrente/.test(n) && !luogo.celle.some(r => r.includes('~'))) prob.push(`il nome "${luogo.nome}" parla d'acqua o di un ponte ma sulla mappa non ce n'è`);
    if (/foresta|bosco|selva/.test(n) && luogo.tipo !== 'foresta') prob.push(`"${luogo.nome}" disegnato come ${luogo.tipo}`);
    return prob;
  }
  return { controllo, effettoTesto, effettoArea, sconfitto, attacco, init, imposta, aggiornaSegnalini, adatta, disegna, setExtra, setAmbiente, ambienteSonoro, terreno3D, spriteOggetto, dati3D, azioneCasella, casa3D, figura: (id, s) => figura(id, s), mostro: s => mostro(s), grande: s => GRANDI.test(nomeMostro(s.nome)), puoMuovere: id => opz.puoMuovere?.(id), chiediCasella, setVisto, celleArea, percorso, zoom, pacchetti };
})();
