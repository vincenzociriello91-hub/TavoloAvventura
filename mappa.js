/* Mappa da battaglia in stile D&D, disegnata dal codice in modo realistico (vista dall'alto):
   terreno con texture, ombre dei muri, tetti, luci di fuochi e torce, oggetti di scena (fissi e movibili),
   personaggi con il loro ritratto. Il luogo è persistente: stessa mappa quando si torna, edifici e oggetti
   bruciati o rotti restano così. Tocco breve = muovi il tuo segnalino, pressione lunga = edificio. */
const Mappa = (() => {
  let cv, ctx, luogo = null, segnalini = {}, membri = {}, opz = {}, tile = 24, trascina = null, premi = null, dpr = 1, evidenzia = null;
  let extra = { aree: [], vedeTutto: false, movimento: null }, attesaArea = null;
  let cache = null, cacheChiave = '';
  const ritratti = new Map();
  const PIATTI = ['tappeto', 'ragnatela', 'ossa', 'funghi', 'macerie'];
  const PASSABILI = [...PIATTI, 'sedia', 'sgabello', 'torcia', 'candelabro'];
  const LUCI = { camino: [5, '255,140,50'], candelabro: [3, '255,200,110'], torcia: [3.5, '255,150,60'], falo: [5, '255,140,50'], lampione: [3, '255,215,140'] };

  function setExtra(e) { extra = { ...extra, ...e }; disegna(); }
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
    cv.addEventListener('pointerdown', giu); cv.addEventListener('pointermove', muovi); cv.addEventListener('pointerup', su); cv.addEventListener('pointercancel', () => { trascina = null; annullaPremi(); disegna(); });
    cv.addEventListener('contextmenu', e => e.preventDefault());
    new ResizeObserver(() => adatta()).observe(cv.parentElement);
  }
  function adatta() {
    if (!cv || !luogo) return;
    const box = cv.parentElement.getBoundingClientRect();
    const maxH = opz.altezzaMax ? opz.altezzaMax() : 9999;
    // sul telefono la mappa non scende sotto i 22 px a casella: si scorre col dito invece di diventare illeggibile
    tile = Math.max(22, Math.floor(Math.min(box.width / luogo.w, maxH / luogo.h)));
    dpr = window.devicePixelRatio || 1;
    cv.width = luogo.w * tile * dpr; cv.height = luogo.h * tile * dpr;
    cv.style.width = luogo.w * tile + 'px'; cv.style.height = luogo.h * tile + 'px';
    cacheChiave = ''; disegna();
  }
  function imposta(l, s, m) { const nuovo = !luogo || !l || luogo.id !== l.id; if (l !== luogo) cacheChiave = ''; luogo = l; segnalini = s || {}; membri = m || membri; if (nuovo) adatta(); else disegna(); }
  function aggiornaSegnalini(s) { segnalini = s || {}; disegna(); }
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
    if (ch === '.' || ch === 'T') col = hsl(92 + v * 14, 30 + v * 8, tipo === 'foresta' ? 22 + v * 5 : 28 + v * 5);
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
    if (ch === '.' || ch === 'T') {
      for (let k = 0; k < 3; k++) ovale(c, X + r() * t, Y + r() * t, t * (0.3 + r() * 0.5), t * (0.2 + r() * 0.4), r() < 0.5 ? 'rgba(20,40,10,.18)' : 'rgba(150,180,90,.10)');
      c.lineWidth = Math.max(1, t / 30); c.lineCap = 'round';
      for (let k = 0; k < 9; k++) { const bx = X + r() * t, by = Y + r() * t, l = t * (0.08 + r() * 0.1); c.strokeStyle = r() < 0.5 ? 'rgba(25,50,15,.55)' : 'rgba(140,175,80,.45)'; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + (r() - 0.5) * l, by - l); c.stroke(); }
      if (r() < 0.06) for (let k = 0; k < 3; k++) ovale(c, X + r() * t, Y + r() * t, t * 0.04, t * 0.04, r() < 0.5 ? '#f3e7a0' : '#e8e8f0');
    } else if (ch === ',') {
      if (['citta', 'castello'].includes(tipo)) {
        // ciottoli
        const n = 3, s = t / n;
        for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const o = (j % 2) * s / 2, v = r(); rr(c, X + i * s + o - s / 2 + 1, Y + j * s + 1, s - 2, s - 2, s * 0.35); c.fillStyle = hsl(30, 6 + v * 6, 40 + v * 14); c.fill(); }
        c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(X, Y, t, t * 0.1);
      } else {
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
    } else if (ch === 'R') {
      for (let k = 0; k < 4; k++) { const v = r(); c.fillStyle = hsl(28, 8, 9 + v * 9); c.beginPath(); const cx = X + r() * t, cy = Y + r() * t, s = t * (0.25 + r() * 0.3); c.moveTo(cx - s, cy); c.lineTo(cx - s * 0.3, cy - s * 0.8); c.lineTo(cx + s * 0.7, cy - s * 0.5); c.lineTo(cx + s, cy + s * 0.3); c.lineTo(cx, cy + s * 0.8); c.closePath(); c.fill(); }
    } else if (ch === '#') {
      // muro: blocchi di pietra dove si affaccia su un pavimento, roccia piena altrove
      const affaccia = [[0, -1], [0, 1], [-1, 0], [1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]].some(([dx, dy]) => !muro(cella(x + dx, y + dy)) && cella(x + dx, y + dy) !== undefined && y + dy >= 0 && x + dx >= 0 && y + dy < luogo.h && x + dx < luogo.w);
      if (affaccia) {
        const s = t / 2;
        for (let j = 0; j < 2; j++) for (let i = -1; i < 2; i++) { const v = r(), bx = X + i * s + (j % 2 ? s / 2 : 0); c.fillStyle = hsl(25, 8, 16 + v * 9); c.fillRect(Math.max(X, bx + 1), Y + j * s + 1, Math.min(s - 2, X + t - bx - 1), s - 2); }
        c.fillStyle = 'rgba(255,255,255,.10)'; c.fillRect(X, Y, t, Math.max(1, t / 14));
      } else for (let k = 0; k < 3; k++) ovale(c, X + r() * t, Y + r() * t, t * 0.3, t * 0.2, 'rgba(255,255,255,.025)');
    }
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
    ovale(c, cx + R * 0.35, cy + R * 0.4, R * 0.95, R * 0.8, 'rgba(0,0,0,.32)');
    const tono = 95 + r() * 30;
    for (let k = 0; k < 6; k++) { const a = r() * 6.28, d = R * 0.45 * r(); ovale(c, cx + Math.cos(a) * d, cy + Math.sin(a) * d, R * 0.55, R * 0.55, hsl(tono, 38, 18 + r() * 6)); }
    for (let k = 0; k < 5; k++) { const a = r() * 6.28, d = R * 0.35 * r(); ovale(c, cx + Math.cos(a) * d - R * 0.12, cy + Math.sin(a) * d - R * 0.15, R * 0.32, R * 0.3, hsl(tono, 40, 27 + r() * 8)); }
    for (let k = 0; k < 4; k++) ovale(c, cx - R * 0.25 + r() * R * 0.3, cy - R * 0.3 + r() * R * 0.3, R * 0.12, R * 0.1, hsl(tono - 10, 45, 40));
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
    c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(X + t * 0.3, Y + t * 0.35, W, H);
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
    c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = Math.max(1.5, t / 10); c.strokeRect(X + 0.5, Y + 0.5, W - 1, H - 1);
    if (!tempio && r() < 0.7) { const cx = X + W * (0.2 + r() * 0.6), cy = orizz ? Y + H * 0.25 : Y + H * (0.2 + r() * 0.6); c.fillStyle = '#5a524a'; c.fillRect(cx, cy, t * 0.4, t * 0.4); c.fillStyle = '#1a1512'; c.fillRect(cx + t * 0.08, cy + t * 0.08, t * 0.24, t * 0.24); }
    if (tempio) { c.fillStyle = '#e8d890'; const cx = X + W / 2, cy = Y + H / 2; c.fillRect(cx - t * 0.06, cy - t * 0.35, t * 0.12, t * 0.7); c.fillRect(cx - t * 0.25, cy - t * 0.15, t * 0.5, t * 0.12); }
    if (e.stato === 'danneggiato') for (let k = 0; k < 2; k++) { const px = X + r() * (W - t), py = Y + r() * (H - t); c.fillStyle = '#1a120c'; c.beginPath(); c.ellipse(px + t / 2, py + t / 2, t * 0.45, t * 0.35, r(), 0, 7); c.fill(); c.strokeStyle = '#5a3a20'; c.lineWidth = t * 0.08; c.beginPath(); c.moveTo(px + t * 0.1, py + t / 2); c.lineTo(px + t * 0.9, py + t / 2); c.stroke(); }
    // porta visibile sul bordo
    for (let j = e.y; j < e.y + e.h; j++) for (let i = e.x; i < e.x + e.w; i++) if (luogo.celle[j]?.[i] === '+') { const dx = i * t, dy = j * t, giuB = j === e.y + e.h - 1; c.fillStyle = '#5a3a1e'; giuB ? c.fillRect(dx + t * 0.25, dy + t * 0.8, t * 0.5, t * 0.3) : c.fillRect(dx - t * 0.1, dy + t * 0.25, t * 0.3, t * 0.5); }
  }

  /* ---------------- oggetti di scena ---------------- */
  function legno(c, x, y, w, hh, v = 0) { const g = c.createLinearGradient(x, y, x, y + hh); g.addColorStop(0, hsl(28, 45, 36 + v)); g.addColorStop(1, hsl(26, 45, 24 + v)); return g; }
  function oggetto(c, o, t, X = o.x * t, Y = o.y * t) {
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
      case 'baule': case 'forziere': { ombra(s * 0.42, s * 0.3); const oro = o.tipo === 'forziere'; rr(c, X + s * 0.1, Y + s * 0.25, s * 0.8, s * 0.5, s * 0.08); c.fillStyle = legno(c, X, Y + s * 0.25, s, s * 0.5, oro ? 0 : 4); c.fill(); c.fillStyle = oro ? '#d4a838' : '#555'; c.fillRect(X + s * 0.1, Y + s * 0.45, s * 0.8, s * 0.07); c.fillRect(X + s * 0.25, Y + s * 0.25, s * 0.06, s * 0.5); c.fillRect(X + s * 0.69, Y + s * 0.25, s * 0.06, s * 0.5); ovale(c, cx, cy + s * 0.04, s * 0.06, s * 0.06, oro ? '#ffe070' : '#888'); break; }
      case 'letto': { ombra(s * 0.45, s * 0.48); c.fillStyle = hsl(26, 40, 22); c.fillRect(X + s * 0.08, Y + s * 0.02, s * 0.84, s * 0.96); const col = ['#8a2a2a', '#2a4a7a', '#4a6a2a', '#6a4a7a'][Math.floor(r() * 4)]; c.fillStyle = col; c.fillRect(X + s * 0.12, Y + s * 0.32, s * 0.76, s * 0.62); c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(X + s * 0.12, Y + s * 0.32, s * 0.76, s * 0.08); rr(c, X + s * 0.2, Y + s * 0.07, s * 0.6, s * 0.2, s * 0.06); c.fillStyle = '#e8e2d4'; c.fill(); break; }
      case 'tappeto': { const col = ['#7a2420', '#24406a', '#5a3a6a'][Math.floor(r() * 3)]; c.globalAlpha = 0.9; c.fillStyle = col; c.fillRect(X - s * 0.4, Y - s * 0.2, s * 1.8, s * 1.4); c.strokeStyle = '#d8b860'; c.lineWidth = s * 0.06; c.strokeRect(X - s * 0.3, Y - s * 0.1, s * 1.6, s * 1.2); c.strokeStyle = 'rgba(216,184,96,.5)'; c.lineWidth = s * 0.03; c.beginPath(); c.ellipse(X + s * 0.5, Y + s * 0.5, s * 0.5, s * 0.35, 0, 0, 7); c.stroke(); break; }
      case 'candelabro': ombra(s * 0.18, s * 0.16); ovale(c, cx, cy, s * 0.16, s * 0.16, '#3a3028'); for (let k = 0; k < 3; k++) { const a = k * 2.09; ovale(c, cx + Math.cos(a) * s * 0.1, cy + Math.sin(a) * s * 0.1, s * 0.04, s * 0.04, '#e8e0c8'); fiamma(c, cx + Math.cos(a) * s * 0.1, cy + Math.sin(a) * s * 0.1, s * 0.07); } break;
      case 'torcia': { const m = [[0, -1], [0, 1], [-1, 0], [1, 0]].find(([dx, dy]) => muro(cella(o.x + dx, o.y + dy))) || [0, -1]; const tx = cx + m[0] * s * 0.4, ty = cy + m[1] * s * 0.4; c.strokeStyle = '#3a2a1a'; c.lineWidth = s * 0.08; c.beginPath(); c.moveTo(tx + m[0] * s * 0.1, ty + m[1] * s * 0.1); c.lineTo(tx - m[0] * s * 0.12, ty - m[1] * s * 0.12); c.stroke(); fiamma(c, tx - m[0] * s * 0.14, ty - m[1] * s * 0.14, s * 0.16); break; }
      case 'scaffale': { ombra(s * 0.48, s * 0.3); c.fillStyle = hsl(25, 40, 18); c.fillRect(X + s * 0.02, Y + s * 0.22, s * 0.96, s * 0.56); for (let k = 0; k < 7; k++) { c.fillStyle = ['#7a2a24', '#2a4a6a', '#3a6a3a', '#8a7a4a', '#5a3a6a'][Math.floor(r() * 5)]; c.fillRect(X + s * 0.06 + k * s * 0.13, Y + s * 0.27, s * 0.1, s * 0.46); } break; }
      case 'rastrelliera': { ombra(s * 0.45, s * 0.25); c.fillStyle = hsl(26, 40, 22); c.fillRect(X + s * 0.05, Y + s * 0.4, s * 0.9, s * 0.2); c.strokeStyle = '#b8b8c0'; c.lineWidth = s * 0.05; for (let k = 0; k < 4; k++) { const px = X + s * (0.15 + k * 0.23); c.beginPath(); c.moveTo(px, Y + s * 0.1); c.lineTo(px + s * 0.05, Y + s * 0.85); c.stroke(); } break; }
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

  /* ---------------- composizione dello strato fisso (in cache) ---------------- */
  function strato() {
    const t = tile, chiave = luogo.id + ':' + t + ':' + dpr;
    if (cache && cacheChiave === chiave) return cache;
    const c0 = document.createElement('canvas'); c0.width = cv.width; c0.height = cv.height;
    const c = c0.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.imageSmoothingEnabled = true;
    const tutte = (fn) => { for (let y = 0; y < luogo.h; y++) for (let x = 0; x < luogo.w; x++) fn(c, cella(x, y), x, y, t); };
    tutte(base); tutte(texture); tutte(ombre); tutte(struttura);
    const ogg = (luogo.oggetti || []).filter(o => !(trascina?.ogg === o.id));
    ogg.filter(o => PIATTI.includes(o.tipo)).forEach(o => oggetto(c, o, t));
    for (const e of luogo.edifici) tetto(c, e, t);
    ogg.filter(o => !PIATTI.includes(o.tipo)).forEach(o => oggetto(c, o, t));
    tutte((cc, ch, x, y) => { if (ch === 'T') albero(cc, x, y, t); });
    // luce: ambienti chiusi più scuri, fuochi e torce illuminano attorno
    const chiuso = ['taverna', 'interno', 'dungeon', 'grotta'].includes(luogo.tipo);
    const W = luogo.w * t, H = luogo.h * t;
    if (chiuso) { c.fillStyle = luogo.tipo === 'taverna' || luogo.tipo === 'interno' ? 'rgba(12,8,20,.14)' : 'rgba(5,5,15,.45)'; c.fillRect(0, 0, W, H); }
    c.globalCompositeOperation = 'lighter';
    const luce = (x, y, [raggio, rgb]) => { const R = raggio * t, g = c.createRadialGradient(x, y, 0, x, y, R); g.addColorStop(0, `rgba(${rgb},${chiuso ? 0.32 : 0.16})`); g.addColorStop(1, `rgba(${rgb},0)`); c.fillStyle = g; c.fillRect(x - R, y - R, R * 2, R * 2); };
    tutte((cc, ch, x, y) => { if (ch === 'f') luce(x * t + t / 2, y * t + t / 2, LUCI.camino); });
    ogg.forEach(o => { if (LUCI[o.tipo] && o.stato === 'integro') luce(o.x * t + t / 2, o.y * t + t / 2, LUCI[o.tipo]); });
    c.globalCompositeOperation = 'source-over';
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
  function ritratto(id) {
    const pg = opz.pg?.(id); if (!pg || typeof Ritratto === 'undefined') return null;
    const svg = Ritratto.svg(pg, { dim: 64 }); let im = ritratti.get(id);
    if (!im || im.svg !== svg) { im = new Image(); im.svg = svg; im.onload = () => disegna(); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.includes('xmlns=') ? svg : svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')); ritratti.set(id, im); }
    return im.complete && im.naturalWidth ? im : null;
  }
  function segnalino(id, s, pos, t) {
    const cx = pos.x * t + t / 2, cy = pos.y * t + t / 2, R = t * 0.44;
    ovale(ctx, cx + t * 0.06, cy + t * 0.1, R, R * 0.9, 'rgba(0,0,0,.45)');
    if (s.tipo === 'nemico') {
      ctx.fillStyle = '#3a0e0c'; ctx.beginPath();
      for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283, d = k % 2 ? R : R * 0.82; k ? ctx.lineTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d) : ctx.moveTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d); }
      ctx.closePath(); ctx.fill(); ctx.strokeStyle = s.colore || '#d84b3c'; ctx.lineWidth = Math.max(2, t / 12); ctx.stroke();
      const g = ctx.createRadialGradient(cx - R * 0.2, cy - R * 0.2, 1, cx, cy, R * 0.75); g.addColorStop(0, '#b0302a'); g.addColorStop(1, '#5a1210'); ovale(ctx, cx, cy, R * 0.72, R * 0.72, g);
      ctx.fillStyle = '#ffe8e0'; ctx.font = `800 ${Math.max(10, t * 0.42)}px Inter, system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText((s.nome || '?').charAt(0).toUpperCase(), cx, cy + 1);
      if (s.pf !== undefined && extra.vedeTutto) { ctx.font = `700 ${Math.max(9, t * 0.3)}px Inter, sans-serif`; ctx.fillStyle = '#ffd6cc'; ctx.fillText(`PF ${s.pf}`, cx, cy - R - t * 0.15); }
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
    if (t >= 20 && s.nome) { ctx.font = `600 ${Math.max(9, t * 0.34)}px Inter, system-ui, sans-serif`; let nome = s.nome; while (nome.length > 3 && ctx.measureText(nome).width > t * 1.25) nome = nome.slice(0, -2) + '…'; s = { ...s, nome }; const nw = ctx.measureText(s.nome).width; ctx.fillStyle = 'rgba(20,17,15,.78)'; rr(ctx, cx - nw / 2 - 4, cy + R + 2, nw + 8, t * 0.42, 4); ctx.fill(); ctx.fillStyle = '#f3ead9'; ctx.fillText(s.nome, cx - nw / 2, cy + R + t * 0.33); }
  }

  function disegna() {
    if (!ctx || !luogo) return;
    const t = tile;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(strato(), 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.imageSmoothingEnabled = true;
    if (trascina?.ogg) { const o = luogo.oggetti.find(o => o.id === trascina.ogg); if (o) { ctx.globalAlpha = 0.85; oggetto(ctx, o, t, trascina.x * t, trascina.y * t); ctx.globalAlpha = 1; } }
    // caselle raggiungibili nel turno
    if (extra.movimento && segnalini[extra.movimento.id]) {
      const s0 = segnalini[extra.movimento.id], r = extra.movimento.celle;
      ctx.fillStyle = 'rgba(91,143,217,.18)';
      for (let y = Math.max(0, s0.y - r); y <= Math.min(luogo.h - 1, s0.y + r); y++) for (let x = Math.max(0, s0.x - r); x <= Math.min(luogo.w - 1, s0.x + r); x++) if (!'#wRT~'.includes(cella(x, y))) ctx.fillRect(x * t, y * t, t, t);
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
    if (evidenzia) { const e = luogo.edifici.find(e => e.id === evidenzia); if (e) { ctx.strokeStyle = '#ffd25a'; ctx.lineWidth = 2; ctx.strokeRect(e.x * t + 1, e.y * t + 1, e.w * t - 2, e.h * t - 2); } }
    for (const [id, s] of Object.entries(segnalini)) {
      if (luogo.visto && !extra.vedeTutto && s.tipo === 'nemico' && luogo.visto[s.y * luogo.w + s.x] === '0') continue;
      segnalino(id, s, trascina?.id === id ? trascina : s, t);
    }
  }

  /* ---------------- tocchi ---------------- */
  function posDa(ev) { const b = cv.getBoundingClientRect(); return { x: Math.floor((ev.clientX - b.left) / tile), y: Math.floor((ev.clientY - b.top) / tile) }; }
  const oggettoIn = (x, y) => (luogo.oggetti || []).find(o => o.x === x && o.y === y);
  function giu(ev) {
    if (!luogo) return;
    const q = posDa(ev);
    if (attesaArea) { const cb = attesaArea; attesaArea = null; cv.style.cursor = ''; cb(q.x, q.y); return; }
    const id = Object.keys(segnalini).find(k => segnalini[k].x === q.x && segnalini[k].y === q.y && opz.puoMuovere(k));
    if (id) { trascina = { id, x: q.x, y: q.y }; cv.setPointerCapture(ev.pointerId); ev.preventDefault(); return; }
    // il master umano sposta gli oggetti movibili trascinandoli
    const o = oggettoIn(q.x, q.y);
    if (o && o.movibile && opz.puoMuovereOggetti?.()) { trascina = { ogg: o.id, x: q.x, y: q.y }; cacheChiave = ''; cv.setPointerCapture(ev.pointerId); ev.preventDefault(); disegna(); return; }
    // tocco breve = muovi qui il tuo segnalino; pressione lunga = scheda dell'edificio
    annullaPremi();
    premi = { x: q.x, y: q.y, timer: setTimeout(() => {
      const p = premi; premi = null;
      const ed = luogo.edifici.find(e => dentroEd(e, p.x, p.y));
      if (ed) { evidenzia = ed.id; disegna(); opz.onEdificio?.(ed); setTimeout(() => { evidenzia = null; disegna(); }, 1500); }
    }, 450) };
  }
  function annullaPremi() { if (premi) clearTimeout(premi.timer); premi = null; }
  function muovi(ev) { if (premi) { const q = posDa(ev); if (q.x !== premi.x || q.y !== premi.y) annullaPremi(); } if (!trascina) return; const q = posDa(ev); if (q.x !== trascina.x || q.y !== trascina.y) { trascina.x = Math.max(0, Math.min(luogo.w - 1, q.x)); trascina.y = Math.max(0, Math.min(luogo.h - 1, q.y)); disegna(); } }
  function su() {
    if (premi) {
      const p = premi, io = opz.io(); annullaPremi();
      const ob = oggettoIn(p.x, p.y);
      const libera = !'#wRT~'.includes(cella(p.x, p.y)) && !(ob && !PASSABILI.includes(ob.tipo)) && !Object.values(segnalini).some(s => s.x === p.x && s.y === p.y);
      if (segnalini[io] && libera) { segnalini[io] = { ...segnalini[io], x: p.x, y: p.y }; disegna(); opz.onMuovi?.(io, p.x, p.y); }
      return;
    }
    if (!trascina) return;
    const t = trascina; trascina = null;
    if (t.ogg) { const o = luogo.oggetti.find(o => o.id === t.ogg); if (o) { o.x = t.x; o.y = t.y; } cacheChiave = ''; disegna(); opz.onMuoviOggetto?.(t.ogg, t.x, t.y); return; }
    segnalini[t.id] = { ...segnalini[t.id], x: t.x, y: t.y }; disegna(); opz.onMuovi?.(t.id, t.x, t.y);
  }
  function setVisto(id, visto) { if (luogo && luogo.id === id) { luogo.visto = visto; disegna(); } }
  return { init, imposta, aggiornaSegnalini, adatta, disegna, setExtra, chiediCasella, setVisto, celleArea };
})();
