/* Mappa a quadretti in pixel art: luogo persistente (stessa mappa quando si torna), edifici che cambiano
   (bruciati, distrutti, danneggiati), segnalini dei personaggi e dei nemici da trascinare. */
const Mappa = (() => {
  const COL = {
    '.': ['#5d7a3e', '#56723a', '#628040'], ',': ['#a08a64', '#988260', '#a68f68'], '#': ['#5b5048', '#544a42', '#625650'], '_': ['#6e6a62', '#67635c', '#726e66'],
    '~': ['#3b6f9c', '#376894', '#3f76a4'], 'T': ['#2f5a2c', '#2b5428', '#335f30'], 'R': ['#4a4440', '#433e3a', '#4f4945'], '=': ['#8a6640', '#83603c', '#906b44'],
    '+': ['#c48a3a'], 't': ['#6b4a2b'], 'b': ['#5a3a20'], 'f': ['#d0602a'], 'c': ['#b04848'], '^': ['#9a9a9a'], 'w': ['#76706a', '#6f6963', '#7b756f']
  };
  let cv, ctx, luogo = null, segnalini = {}, membri = {}, opz = {}, tile = 24, trascina = null, dpr = 1, evidenzia = null;
  let extra = { aree: [], vedeTutto: false, movimento: null }, attesaArea = null;
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
  const h = (x, y) => ((x * 73856093) ^ (y * 19349663)) >>> 0;

  function init(canvas, o) {
    cv = canvas; ctx = cv.getContext('2d'); opz = o;
    cv.addEventListener('pointerdown', giu); cv.addEventListener('pointermove', muovi); cv.addEventListener('pointerup', su); cv.addEventListener('pointercancel', () => { trascina = null; disegna(); });
    new ResizeObserver(() => adatta()).observe(cv.parentElement);
  }
  function adatta() {
    if (!cv || !luogo) return;
    const box = cv.parentElement.getBoundingClientRect();
    const maxH = opz.altezzaMax ? opz.altezzaMax() : 9999;
    // sul telefono la mappa non scende sotto i 16 px a casella: si scorre col dito invece di diventare illeggibile
    tile = Math.max(16, Math.floor(Math.min(box.width / luogo.w, maxH / luogo.h)));
    dpr = window.devicePixelRatio || 1;
    cv.width = luogo.w * tile * dpr; cv.height = luogo.h * tile * dpr;
    cv.style.width = luogo.w * tile + 'px'; cv.style.height = luogo.h * tile + 'px';
    disegna();
  }
  function imposta(l, s, m) { const nuovo = !luogo || !l || luogo.id !== l.id; luogo = l; segnalini = s || {}; membri = m || membri; if (nuovo) adatta(); else disegna(); }
  function aggiornaSegnalini(s) { segnalini = s || {}; disegna(); }
  function cella(x, y) { return luogo.celle[y]?.[x] || '.'; }

  function disegna() {
    if (!ctx || !luogo) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    const t = tile, p = Math.max(1, Math.floor(t / 8)); // "pixel" della pixel art
    for (let y = 0; y < luogo.h; y++) for (let x = 0; x < luogo.w; x++) {
      const c = cella(x, y), pal = COL[c] || COL['.'];
      const base = ['+', 't', 'b', 'f', 'c', '^'].includes(c) ? (['citta', 'villaggio', 'porto', 'foresta', 'aperto'].includes(luogo.tipo) ? COL['='][0] : luogo.tipo === 'taverna' ? COL['='][0] : COL['_'][0]) : pal[h(x, y) % pal.length];
      ctx.fillStyle = base; ctx.fillRect(x * t, y * t, t, t);
      const v = h(x, y);
      if (c === '.' && v % 5 === 0) { ctx.fillStyle = '#6f9150'; ctx.fillRect(x * t + (v % 6) * p, y * t + (v % 5) * p, p, p * 2); }
      if (c === 'T') { ctx.fillStyle = '#1f3f1d'; ctx.fillRect(x * t + 3 * p, y * t + 5 * p, 2 * p, 3 * p); ctx.fillStyle = '#3d7a37'; ctx.fillRect(x * t + p, y * t + p, 6 * p, 5 * p); ctx.fillStyle = '#4f9447'; ctx.fillRect(x * t + 2 * p, y * t + p, 3 * p, 2 * p); }
      if (c === '~') { ctx.fillStyle = '#5b93c2'; ctx.fillRect(x * t + (v % 4) * p, y * t + (2 + v % 3) * p, 3 * p, p); }
      if (c === 'R' && v % 3 === 0) { ctx.fillStyle = '#5c5550'; ctx.fillRect(x * t + 2 * p, y * t + 2 * p, 3 * p, 3 * p); }
      if (c === '#' || c === 'w') { ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(x * t, y * t + t - p, t, p); ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(x * t, y * t, t, p); if ((x + y) % 2) { ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(x * t + t / 2, y * t, p, t); } }
      if (c === '=') { ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(x * t, y * t + (y % 2 ? 0 : t / 2), t, p); }
      if (c === '+') { ctx.fillStyle = '#c48a3a'; ctx.fillRect(x * t + p, y * t + p, t - 2 * p, t - 2 * p); ctx.fillStyle = '#7a5020'; ctx.fillRect(x * t + t / 2, y * t + t / 2, p, p); }
      if (c === 't') { ctx.fillStyle = '#6b4a2b'; ctx.fillRect(x * t + p, y * t + 2 * p, t - 2 * p, t - 4 * p); ctx.fillStyle = '#8a643c'; ctx.fillRect(x * t + p, y * t + 2 * p, t - 2 * p, p); }
      if (c === 'b') { ctx.fillStyle = '#5a3a20'; ctx.fillRect(x * t, y * t + p, t, t - 2 * p); ctx.fillStyle = '#7a5232'; ctx.fillRect(x * t, y * t + p, t, p); }
      if (c === 'f') { ctx.fillStyle = '#3a3330'; ctx.fillRect(x * t, y * t, t, t); ctx.fillStyle = v % 2 ? '#f08a2a' : '#e0502a'; ctx.fillRect(x * t + 2 * p, y * t + 3 * p, t - 4 * p, t - 4 * p); ctx.fillStyle = '#ffd25a'; ctx.fillRect(x * t + 3 * p, y * t + 4 * p, 2 * p, 2 * p); }
      if (c === 'c') { ctx.fillStyle = '#e8e2d0'; ctx.fillRect(x * t + p, y * t + p, t - 2 * p, 2 * p); ctx.fillStyle = '#b04848'; ctx.fillRect(x * t + p, y * t + 3 * p, t - 2 * p, t - 4 * p); }
      if (c === '^') { for (let k = 0; k < 4; k++) { ctx.fillStyle = k % 2 ? '#8a8a8a' : '#b0b0b0'; ctx.fillRect(x * t, y * t + k * 2 * p, t, 2 * p); } }
    }
    // tetti e stato degli edifici (solo all'aperto: dentro taverne e dungeon si vede il pavimento)
    const esterno = ['citta', 'villaggio', 'porto', 'foresta', 'aperto', 'castello'].includes(luogo.tipo);
    for (const e of luogo.edifici) {
      const X = e.x * t, Y = e.y * t, W = e.w * t, H = e.h * t;
      const casa = esterno && luogo.celle[e.y]?.[e.x] === '#';
      if (e.stato === 'distrutto') {
        for (let j = 0; j < e.h; j++) for (let i = 0; i < e.w; i++) { const v = h(e.x + i, e.y + j); ctx.fillStyle = ['#5a5048', '#4a403a', '#6e6258', '#3a3430'][v % 4]; ctx.fillRect(X + i * t, Y + j * t, t, t); ctx.fillStyle = '#2a2420'; ctx.fillRect(X + i * t + (v % 5) * p, Y + j * t + (v % 4) * p, 2 * p, p); }
      } else if (casa) {
        const tetto = e.stato === 'bruciato' ? '#2b2420' : e.nome.startsWith('Tempio') || e.nome.startsWith('Cappella') ? '#6d6aa0' : e.nome.startsWith('Locanda') ? '#9c4a2c' : '#a0603c';
        ctx.fillStyle = tetto; ctx.fillRect(X, Y, W, H - t);
        ctx.fillStyle = e.stato === 'bruciato' ? '#1a1512' : shade(tetto, -25); ctx.fillRect(X, Y + H - t - p * 2, W, p * 2);
        for (let i = 0; i < e.w * 2; i++) { ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(X + i * t / 2, Y, p, H - t - 2 * p); }
        if (e.stato === 'danneggiato') { ctx.fillStyle = '#3a2a20'; ctx.fillRect(X + W / 3, Y + p * 2, t, t / 2); ctx.fillRect(X + W * 0.6, Y + t, t / 2, t / 2); }
      }
      if (e.stato === 'bruciato') {
        for (let k = 0; k < e.w * e.h; k++) { const v = h(e.x * 7 + k, e.y * 3 + k); ctx.fillStyle = v % 3 ? '#1c1714' : '#e0602a'; ctx.fillRect(X + (v % (e.w * 8)) * p, Y + ((v >> 4) % (e.h * 8)) * p, p, p); }
        ctx.fillStyle = 'rgba(30,25,22,.45)'; ctx.fillRect(X, Y, W, H);
      }
      if (evidenzia === e.id) { ctx.strokeStyle = '#ffd25a'; ctx.lineWidth = 2; ctx.strokeRect(X + 1, Y + 1, W - 2, H - 2); }
      // nome
      if (t >= 12 && e.nome) {
        ctx.font = `600 ${Math.max(9, Math.min(13, t * 0.5))}px Inter, system-ui, sans-serif`;
        const label = e.nome + (e.stato !== 'integro' ? ` (${e.stato})` : '');
        const tw = ctx.measureText(label).width;
        const lx = Math.max(2, Math.min(cv.width / dpr - tw - 6, X + W / 2 - tw / 2 - 3)), ly = esterno ? Y + H / 2 - t / 2 : Y + 2;
        ctx.fillStyle = 'rgba(20,17,15,.72)'; ctx.fillRect(lx, ly, tw + 6, Math.max(12, t * 0.62));
        ctx.fillStyle = e.stato === 'integro' ? '#f3ead9' : '#ffb199'; ctx.fillText(label, lx + 3, ly + Math.max(10, t * 0.48));
      }
    }
    // griglia
    ctx.strokeStyle = 'rgba(0,0,0,.14)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= luogo.w; x++) { ctx.moveTo(x * t + .5, 0); ctx.lineTo(x * t + .5, luogo.h * t); }
    for (let y = 0; y <= luogo.h; y++) { ctx.moveTo(0, y * t + .5); ctx.lineTo(luogo.w * t, y * t + .5); }
    ctx.stroke();
    // gittata di movimento nel proprio turno
    if (extra.movimento && segnalini[extra.movimento.id]) {
      const s0 = segnalini[extra.movimento.id], r = extra.movimento.celle;
      ctx.fillStyle = 'rgba(91,143,217,.18)'; ctx.strokeStyle = 'rgba(91,143,217,.55)';
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
      for (let y = 0; y < luogo.h; y++) for (let x = 0; x < luogo.w; x++) if (luogo.visto[y * luogo.w + x] === '0') ctx.fillRect(x * t, y * t, t, t);
    }
    // segnalini
    for (const [id, s] of Object.entries(segnalini)) {
      if (luogo.visto && !extra.vedeTutto && s.tipo === 'nemico' && luogo.visto[s.y * luogo.w + s.x] === '0') continue;
      const pos = trascina?.id === id ? trascina : s;
      const cx = pos.x * t + t / 2, cy = pos.y * t + t / 2, rr = t * 0.42;
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(cx, cy + rr * 0.8, rr, rr * 0.35, 0, 0, 7); ctx.fill();
      if (s.tipo === 'nemico') { ctx.fillStyle = s.colore || '#d84b3c'; ctx.fillRect(cx - rr, cy - rr, rr * 2, rr * 2); ctx.strokeStyle = '#1a1210'; ctx.lineWidth = Math.max(2, t / 10); ctx.strokeRect(cx - rr, cy - rr, rr * 2, rr * 2); }
      else { ctx.fillStyle = s.colore || '#e8b04b'; ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 7); ctx.fill(); ctx.strokeStyle = id === opz.io() ? '#ffffff' : '#1a1210'; ctx.lineWidth = Math.max(2, t / 10); ctx.stroke(); }
      ctx.fillStyle = '#14110f'; ctx.font = `700 ${Math.max(9, t * 0.5)}px Inter, system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText((s.nome || '?').charAt(0).toUpperCase(), cx, cy + 1);
      ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
      if (s.tipo === 'nemico' && s.pf !== undefined && extra.vedeTutto) { ctx.font = `700 ${Math.max(8, t * 0.32)}px Inter, sans-serif`; ctx.fillStyle = '#ffd6cc'; ctx.fillText(`PF ${s.pf}`, cx - rr, cy - rr - 2); }
      if (t >= 18) { ctx.font = `600 ${Math.max(9, t * 0.38)}px Inter, system-ui, sans-serif`; const nw = ctx.measureText(s.nome || '').width; ctx.fillStyle = 'rgba(20,17,15,.75)'; ctx.fillRect(cx - nw / 2 - 3, cy + rr + 2, nw + 6, t * 0.45); ctx.fillStyle = '#f3ead9'; ctx.fillText(s.nome || '', cx - nw / 2, cy + rr + t * 0.38); }
    }
  }
  function posDa(ev) { const b = cv.getBoundingClientRect(); return { x: Math.floor((ev.clientX - b.left) / tile), y: Math.floor((ev.clientY - b.top) / tile) }; }
  function giu(ev) {
    if (!luogo) return;
    const q = posDa(ev);
    if (attesaArea) { const cb = attesaArea; attesaArea = null; cv.style.cursor = ''; cb(q.x, q.y); return; }
    const id = Object.keys(segnalini).find(k => segnalini[k].x === q.x && segnalini[k].y === q.y && opz.puoMuovere(k));
    if (id) { trascina = { id, x: q.x, y: q.y }; cv.setPointerCapture(ev.pointerId); ev.preventDefault(); return; }
    const ed = luogo.edifici.find(e => q.x >= e.x && q.x < e.x + e.w && q.y >= e.y && q.y < e.y + e.h);
    if (ed) { evidenzia = ed.id; disegna(); opz.onEdificio?.(ed); setTimeout(() => { evidenzia = null; disegna(); }, 1500); }
  }
  function muovi(ev) { if (!trascina) return; const q = posDa(ev); if (q.x !== trascina.x || q.y !== trascina.y) { trascina.x = Math.max(0, Math.min(luogo.w - 1, q.x)); trascina.y = Math.max(0, Math.min(luogo.h - 1, q.y)); disegna(); } }
  function su() { if (!trascina) return; const t = trascina; trascina = null; segnalini[t.id] = { ...segnalini[t.id], x: t.x, y: t.y }; disegna(); opz.onMuovi?.(t.id, t.x, t.y); }
  function shade(hex, amt) { const n = parseInt(hex.slice(1), 16); const c = v => Math.max(0, Math.min(255, v + amt)); return '#' + [c(n >> 16), c(n >> 8 & 255), c(n & 255)].map(v => v.toString(16).padStart(2, '0')).join(''); }
  function setVisto(id, visto) { if (luogo && luogo.id === id) { luogo.visto = visto; disegna(); } }
  return { init, imposta, aggiornaSegnalini, adatta, disegna, setExtra, chiediCasella, setVisto, celleArea };
})();
