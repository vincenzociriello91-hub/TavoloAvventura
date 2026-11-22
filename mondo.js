/* Mappa del mondo illustrata, disegnata dal codice come una pergamena: mare, coste, boschi, colline, monti e fiumi
   generati dal seme della campagna (sempre uguali), i luoghi scoperti con la loro icona, i viaggi tratteggiati.
   Le zone lontane da ogni luogo conosciuto restano pergamena vuota: la mappa si allarga man mano che esplorate. */
const MappaMondo = (() => {
  const LW = 1200, LH = 800, G = 6; // mondo in unità logiche, griglia del terreno ogni G unità
  let posizioni = {}, ultimo = null;
  const hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  function rumore(seme) {
    const p = new Uint8Array(512); for (let i = 0; i < 256; i++) p[i] = i;
    let s = seme || 1; const r = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };
    for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
    for (let i = 0; i < 256; i++) p[i + 256] = p[i];
    const f = t => t * t * (3 - 2 * t), v = (x, y) => p[p[x & 255] + (y & 255)] / 255;
    const base = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = f(x - xi), yf = f(y - yi); const a = v(xi, yi), b = v(xi + 1, yi), c = v(xi, yi + 1), d = v(xi + 1, yi + 1); return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf; };
    return (x, y) => { let t = 0, amp = 1, fr = 1, n = 0; for (let o = 0; o < 4; o++) { t += base(x * fr, y * fr) * amp; n += amp; amp *= 0.5; fr *= 2; } return t / n; };
  }
  // posizioni stabili: ogni luogo nasce vicino a quello da cui ci si è arrivati
  function calcolaPosizioni(idx, viaggi) {
    const ids = Object.keys(idx).sort((a, b) => (idx[a].prima || 0) - (idx[b].prima || 0)), pos = {};
    const da = {}; for (const v of viaggi || []) if (v.da && !da[v.a]) da[v.a] = v.da;
    for (const id of ids) {
      const h = hash(id), i = ids.indexOf(id), padre = pos[da[id]] || (i ? pos[ids[i - 1]] : null);
      if (!padre) { pos[id] = [LW / 2, LH / 2]; continue; }
      const interno = idx[id].interno;
      for (let k = 0; k < 24; k++) {
        const a = (h % 360) * Math.PI / 180 + k * 0.9, d = interno ? 45 : 160 + (h >> 9) % 60 + k * 6;
        const x = Math.max(70, Math.min(LW - 70, padre[0] + Math.cos(a) * d)), y = Math.max(60, Math.min(LH - 60, padre[1] + Math.sin(a) * d * 0.8));
        if (Object.values(pos).every(([px, py]) => Math.hypot(px - x, py - y) > (interno ? 30 : 120)) || k === 23) { pos[id] = [x, y]; break; }
      }
    }
    return pos;
  }
  function disegna(cv, dati) {
    const { idx, viaggi, attuale, seme, nome } = dati;
    posizioni = calcolaPosizioni(idx, viaggi);
    const ids = Object.keys(posizioni);
    const largh = Math.max(720, cv.parentElement.clientWidth), sc = largh / LW, dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = largh * dpr; cv.height = LH * sc * dpr; cv.style.width = largh + 'px'; cv.style.height = LH * sc + 'px';
    const c = cv.getContext('2d'); c.setTransform(dpr * sc, 0, 0, dpr * sc, 0, 0);
    const n = rumore(seme), m = rumore(seme ^ 0x9e3779b9);
    const GW = Math.ceil(LW / G), GH = Math.ceil(LH / G), alt = new Float32Array(GW * GH), umido = new Float32Array(GW * GH);
    const luoghi = ids.map(id => ({ id, x: posizioni[id][0], y: posizioni[id][1], tipo: idx[id].tipo, interno: idx[id].interno }));
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
      const x = i * G, y = j * G; let h = n(x / 260, y / 260) * 0.95 - 0.12, u = m(x / 200, y / 200);
      for (const l of luoghi) {
        const b = Math.exp(-((x - l.x) ** 2 + (y - l.y) ** 2) / (95 * 95));
        h += b * (l.tipo === 'porto' ? 0.12 : 0.32);
        if (l.tipo === 'porto') h -= Math.exp(-((x - l.x - 70) ** 2 + (y - l.y - 40) ** 2) / (70 * 70)) * 0.55;
        if (['grotta', 'dungeon', 'castello'].includes(l.tipo)) h += Math.exp(-((x - l.x + 60) ** 2 + (y - l.y - 50) ** 2) / (70 * 70)) * 0.2;
        if (l.tipo === 'foresta') u += b * 0.5;
      }
      alt[j * GW + i] = h; umido[j * GW + i] = u;
    }
    const A = (i, j) => alt[Math.max(0, Math.min(GH - 1, j)) * GW + Math.max(0, Math.min(GW - 1, i))];
    const MARE = 0.36;
    // pergamena
    const g = c.createRadialGradient(LW / 2, LH / 2, 100, LW / 2, LH / 2, LW * 0.7); g.addColorStop(0, '#efe0bd'); g.addColorStop(1, '#cfb487');
    c.fillStyle = g; c.fillRect(0, 0, LW, LH);
    // terreno
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
      const h = alt[j * GW + i], u = umido[j * GW + i];
      c.fillStyle = h < MARE ? `rgba(${70 + h * 120},${120 + h * 140},${150 + h * 110},.75)` : h < MARE + 0.025 ? 'rgba(225,205,150,.8)' : h > 0.78 ? 'rgba(150,140,125,.55)' : u > 0.56 ? `rgba(110,140,80,${0.35 + (u - 0.56)})` : 'rgba(170,175,110,.32)';
      c.fillRect(i * G, j * G, G + 0.5, G + 0.5);
    }
    // onde sul mare
    c.strokeStyle = 'rgba(40,70,90,.35)'; c.lineWidth = 1;
    for (let j = 2; j < GH; j += 5) for (let i = (j % 10) ? 1 : 3; i < GW; i += 6) if (A(i, j) < MARE - 0.06) { c.beginPath(); c.arc(i * G, j * G, 5, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
    // costa a inchiostro
    c.strokeStyle = '#4a3420'; c.lineWidth = 2.2; c.lineCap = 'round'; c.beginPath();
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
      const terra = A(i, j) >= MARE;
      if (terra !== (A(i + 1, j) >= MARE)) { c.moveTo((i + 1) * G, j * G); c.lineTo((i + 1) * G, (j + 1) * G); }
      if (terra !== (A(i, j + 1) >= MARE)) { c.moveTo(i * G, (j + 1) * G); c.lineTo((i + 1) * G, (j + 1) * G); }
    }
    c.stroke();
    // fiumi: dai monti verso il mare seguendo la discesa
    c.strokeStyle = 'rgba(60,110,150,.8)'; c.lineWidth = 2;
    const sorgenti = []; for (let j = 4; j < GH - 4; j += 9) for (let i = 4; i < GW - 4; i += 9) if (A(i, j) > 0.7) sorgenti.push([i, j]);
    sorgenti.sort((a, b) => hash(a.join()) - hash(b.join())).slice(0, 3).forEach(([i, j]) => {
      c.beginPath(); c.moveTo(i * G, j * G);
      for (let k = 0; k < 200 && A(i, j) >= MARE; k++) { let mi = i, mj = j, mh = A(i, j); for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) if (A(i + di, j + dj) < mh) { mh = A(i + di, j + dj); mi = i + di; mj = j + dj; } if (mi === i && mj === j) i += 1; else { i = mi; j = mj; } c.lineTo(i * G + Math.sin(k) * 1.5, j * G); }
      c.stroke();
    });
    // monti, colline e boschi a disegnino
    for (let j = 3; j < GH - 2; j += 4) for (let i = 3; i < GW - 2; i += 4) {
      const h = A(i, j), u = umido[j * GW + i], r = hash(i + ',' + j), x = i * G + (r % 9) - 4, y = j * G + ((r >> 4) % 9) - 4;
      if (luoghi.some(l => Math.hypot(l.x - x, l.y - y) < 48)) continue; // spazio libero attorno alle icone dei luoghi
      if (h > 0.79) { const s = 10 + (h - 0.79) * 40; c.fillStyle = '#e8dcc0'; c.strokeStyle = '#4a3420'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(x - s, y + s * 0.6); c.lineTo(x, y - s * 0.7); c.lineTo(x + s, y + s * 0.6); c.closePath(); c.fill(); c.stroke(); c.fillStyle = 'rgba(74,52,32,.35)'; c.beginPath(); c.moveTo(x, y - s * 0.7); c.lineTo(x + s, y + s * 0.6); c.lineTo(x + s * 0.2, y + s * 0.6); c.closePath(); c.fill(); }
      else if (h > 0.6 && r % 3 === 0) { c.strokeStyle = 'rgba(74,52,32,.7)'; c.lineWidth = 1.2; c.beginPath(); c.arc(x, y + 4, 8, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); }
      else if (h >= MARE + 0.03 && u > 0.56 && r % 2 === 0) for (let k = 0; k < 3; k++) { const tx = x + (k - 1) * 6, ty = y + (k % 2) * 3; c.fillStyle = '#5a7a3a'; c.strokeStyle = '#2f4020'; c.lineWidth = 0.8; c.beginPath(); c.arc(tx, ty, 4.2, 0, 7); c.fill(); c.stroke(); c.fillStyle = '#4a3420'; c.fillRect(tx - 0.6, ty + 3, 1.2, 3); }
    }
    // la mappa si allarga: lontano dai luoghi conosciuti resta pergamena
    const nebbia = document.createElement('canvas'); nebbia.width = LW / 4; nebbia.height = LH / 4; const nk = nebbia.getContext('2d'), img = nk.createImageData(nebbia.width, nebbia.height);
    for (let y = 0; y < nebbia.height; y++) for (let x = 0; x < nebbia.width; x++) {
      const d = luoghi.length ? Math.min(...luoghi.map(l => Math.hypot(l.x / 4 - x, l.y / 4 - y))) * 4 : 9999, a = Math.max(0, Math.min(1, (d - 150) / 90)), k = (y * nebbia.width + x) * 4;
      img.data[k] = 226; img.data[k + 1] = 206; img.data[k + 2] = 166; img.data[k + 3] = a * 245;
    }
    nk.putImageData(img, 0, 0); c.imageSmoothingEnabled = true; c.drawImage(nebbia, 0, 0, LW, LH);
    // viaggi tratteggiati
    const tratte = {}; for (const v of viaggi || []) if (v.da && posizioni[v.da] && posizioni[v.a] && v.da !== v.a) { const k = [v.da, v.a].sort().join('|'); tratte[k] = (tratte[k] || 0) + 1; }
    c.strokeStyle = '#8a2a1a'; c.setLineDash([7, 6]);
    for (const [k, nv] of Object.entries(tratte)) { const [a, b] = k.split('|').map(id => posizioni[id]); c.lineWidth = Math.min(4, 1.2 + nv * 0.6); const mx = (a[0] + b[0]) / 2 + (b[1] - a[1]) * 0.12, my = (a[1] + b[1]) / 2 - (b[0] - a[0]) * 0.12; c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo(mx, my, b[0], b[1]); c.stroke(); }
    c.setLineDash([]);
    // luoghi con la loro icona
    for (const l of luoghi) {
      const qui = l.id === attuale;
      if (qui) { c.strokeStyle = '#b8261a'; c.lineWidth = 3; c.beginPath(); c.arc(l.x, l.y, 22, 0, 7); c.stroke(); }
      icona(c, l.tipo, l.x, l.y, l.interno ? 0.6 : 1);
      if (!l.interno || qui) { c.font = `600 ${l.interno ? 12 : 15}px Georgia, 'Times New Roman', serif`; c.textAlign = 'center'; c.lineWidth = 4; c.strokeStyle = 'rgba(239,224,189,.9)'; c.strokeText(idx[l.id].nome, l.x, l.y + 30); c.fillStyle = '#2a1a0c'; c.fillText(idx[l.id].nome, l.x, l.y + 30); }
    }
    // rosa dei venti, cartiglio e cornice
    rosa(c, LW - 80, LH - 90);
    c.font = "700 26px Georgia, 'Times New Roman', serif"; const tw = c.measureText(nome).width;
    c.fillStyle = 'rgba(239,224,189,.92)'; c.strokeStyle = '#4a3420'; c.lineWidth = 2; c.beginPath(); if (c.roundRect) c.roundRect(24, 22, tw + 48, 46, 8); else c.rect(24, 22, tw + 48, 46); c.fill(); c.stroke();
    c.fillStyle = '#2a1a0c'; c.textAlign = 'left'; c.fillText(nome, 48, 54);
    c.strokeStyle = '#4a3420'; c.lineWidth = 6; c.strokeRect(5, 5, LW - 10, LH - 10); c.lineWidth = 1.5; c.strokeRect(14, 14, LW - 28, LH - 28);
    if (!luoghi.length) { c.font = 'italic 22px Georgia, serif'; c.textAlign = 'center'; c.fillStyle = '#6a5434'; c.fillText('Nessun luogo ancora scoperto', LW / 2, LH / 2); }
    ultimo = { sc, idx };
  }
  function icona(c, tipo, x, y, s) {
    c.save(); c.translate(x, y); c.scale(s, s); c.lineWidth = 1.6; c.strokeStyle = '#2a1a0c';
    const casa = (dx, dy, w, h, tetto) => { c.fillStyle = '#e8d8b0'; c.fillRect(dx - w / 2, dy - h, w, h); c.strokeRect(dx - w / 2, dy - h, w, h); c.fillStyle = tetto; c.beginPath(); c.moveTo(dx - w / 2 - 2, dy - h); c.lineTo(dx, dy - h - w * 0.6); c.lineTo(dx + w / 2 + 2, dy - h); c.closePath(); c.fill(); c.stroke(); };
    if (tipo === 'castello') { c.fillStyle = '#d8ccb0'; c.fillRect(-14, -14, 28, 20); c.strokeRect(-14, -14, 28, 20); for (const tx of [-16, 10]) { c.fillRect(tx, -24, 7, 30); c.strokeRect(tx, -24, 7, 30); } c.fillStyle = '#b8261a'; c.beginPath(); c.moveTo(-1, -26); c.lineTo(9, -22); c.lineTo(-1, -18); c.fill(); c.beginPath(); c.moveTo(-1, -26); c.lineTo(-1, -14); c.stroke(); c.fillStyle = '#2a1a0c'; c.fillRect(-4, -4, 8, 10); }
    else if (tipo === 'citta') { casa(-10, 8, 12, 12, '#a0482a'); casa(6, 8, 14, 16, '#8a3a24'); casa(-2, -2, 10, 10, '#b0583a'); }
    else if (tipo === 'villaggio') { casa(-7, 8, 12, 10, '#9a6a3a'); casa(8, 6, 10, 9, '#8a5a30'); }
    else if (tipo === 'taverna') { casa(0, 8, 18, 13, '#8a3a24'); c.fillStyle = '#e8b04b'; c.fillRect(10, -6, 9, 7); c.strokeRect(10, -6, 9, 7); }
    else if (tipo === 'porto') { c.lineWidth = 2.4; c.beginPath(); c.arc(0, -2, 4, 0, 7); c.moveTo(0, 2); c.lineTo(0, 14); c.moveTo(-8, 6); c.quadraticCurveTo(0, 18, 8, 6); c.moveTo(-6, 6); c.lineTo(6, 6); c.stroke(); }
    else if (tipo === 'dungeon') { c.fillStyle = '#e8dcc0'; c.beginPath(); c.arc(0, -2, 10, Math.PI, 0); c.lineTo(10, 10); c.lineTo(-10, 10); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#2a1a0c'; c.beginPath(); c.arc(-3.5, -3, 2.4, 0, 7); c.arc(3.5, -3, 2.4, 0, 7); c.fill(); c.fillRect(-4, 4, 8, 2); }
    else if (tipo === 'grotta') { c.fillStyle = '#b8ac94'; c.beginPath(); c.moveTo(-16, 10); c.lineTo(-6, -12); c.lineTo(6, -8); c.lineTo(16, 10); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#2a1a0c'; c.beginPath(); c.arc(0, 10, 6, Math.PI, 0); c.fill(); }
    else if (tipo === 'foresta') { for (const [tx, ty] of [[-8, 4], [8, 4], [0, -4]]) { c.fillStyle = '#4a6a2a'; c.beginPath(); c.moveTo(tx, ty - 12); c.lineTo(tx + 7, ty + 6); c.lineTo(tx - 7, ty + 6); c.closePath(); c.fill(); c.stroke(); } }
    else if (tipo === 'interno') casa(0, 6, 10, 9, '#7a5a3a');
    else { c.beginPath(); c.moveTo(0, 10); c.lineTo(0, -14); c.stroke(); c.fillStyle = '#b8261a'; c.beginPath(); c.moveTo(0, -14); c.lineTo(12, -9); c.lineTo(0, -4); c.fill(); }
    c.restore();
  }
  function rosa(c, x, y) {
    c.save(); c.translate(x, y); c.strokeStyle = '#4a3420'; c.lineWidth = 1.2;
    c.beginPath(); c.arc(0, 0, 34, 0, 7); c.stroke();
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 - Math.PI / 2, l = k % 2 ? 22 : 40; c.fillStyle = k % 2 ? '#cfb487' : (k === 0 ? '#b8261a' : '#4a3420'); c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a - 0.18) * 9, Math.sin(a - 0.18) * 9); c.lineTo(Math.cos(a) * l, Math.sin(a) * l); c.lineTo(Math.cos(a + 0.18) * 9, Math.sin(a + 0.18) * 9); c.closePath(); c.fill(); c.stroke(); }
    c.font = '700 14px Georgia, serif'; c.textAlign = 'center'; c.fillStyle = '#2a1a0c'; c.fillText('N', 0, -46);
    c.restore();
  }
  // tocco sulla mappa: il luogo più vicino al dito (entro 30 unità)
  function luogoIn(cv, ev) {
    if (!ultimo) return null; const b = cv.getBoundingClientRect(), x = (ev.clientX - b.left) / ultimo.sc, y = (ev.clientY - b.top) / ultimo.sc;
    const [id] = Object.entries(posizioni).map(([i, [px, py]]) => [i, Math.hypot(px - x, py - y)]).filter(([, d]) => d < 30).sort((a, b2) => a[1] - b2[1])[0] || [];
    return id ? ultimo.idx[id]?.nome : null;
  }
  return { disegna, luogoIn };
})();
