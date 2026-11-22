/* Dadi 3D (three.js): rotolano sullo schermo e si fermano sulla faccia uscita. Il risultato lo decide sempre il server:
   qui si sceglie solo l'orientamento finale che mostra quel numero in alto. */
import * as THREE from 'three';

let renderer, scena, camera, attivi = [], fine = 0, idFrame = 0, tela;
function prepara() {
  if (renderer) return;
  tela = document.createElement('canvas'); tela.className = 'dadi3d';
  document.body.appendChild(tela);
  renderer = new THREE.WebGLRenderer({ canvas: tela, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true; renderer.toneMapping = THREE.ACESFilmicToneMapping;
  scena = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 14, 7); camera.lookAt(0, 0, 0.6);
  scena.add(new THREE.HemisphereLight(0xfff4e0, 0x302820, 1.6));
  const sole = new THREE.DirectionalLight(0xffffff, 2.4); sole.position.set(3, 10, 4); sole.castShadow = true; sole.shadow.mapSize.set(1024, 1024);
  Object.assign(sole.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 }); scena.add(sole);
  const tavolo = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.35 }));
  tavolo.rotation.x = -Math.PI / 2; tavolo.receiveShadow = true; scena.add(tavolo);
  const adatta = () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); };
  addEventListener('resize', adatta); adatta();
}
// forma del dado; le facce si ricavano raggruppando i triangoli con la stessa normale
function geometria(facce) {
  if (facce === 6) return new THREE.BoxGeometry(1.1, 1.1, 1.1).toNonIndexed();
  if (facce === 4) return new THREE.TetrahedronGeometry(0.95).toNonIndexed();
  if (facce === 8) return new THREE.OctahedronGeometry(0.85).toNonIndexed();
  if (facce === 12) return new THREE.DodecahedronGeometry(0.85).toNonIndexed();
  if (facce === 20) return new THREE.IcosahedronGeometry(0.9).toNonIndexed();
  // d10 (e d100): trapezoedro pentagonale, 10 aquiloni
  const h = 0.85, a = 0.11, v = [], top = [0, h, 0], bot = [0, -h, 0];
  const anello = i => { const ang = i * Math.PI / 5; return [Math.cos(ang) * 0.8, (i % 2 ? a : -a), Math.sin(ang) * 0.8]; };
  for (let k = 0; k < 5; k++) { const i = 2 * k + 1; v.push(top, anello(i), anello(i + 1), top, anello(i + 1), anello(i + 2)); }
  for (let k = 0; k < 5; k++) { const i = 2 * k; v.push(bot, anello(i + 2), anello(i + 1), bot, anello(i + 1), anello(i)); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v.flat(), 3)); g.computeVertexNormals();
  return g;
}
export function facceDi(g) {
  const p = g.attributes.position, gruppi = [];
  for (let i = 0; i < p.count; i += 3) {
    const a = new THREE.Vector3().fromBufferAttribute(p, i), b = new THREE.Vector3().fromBufferAttribute(p, i + 1), c = new THREE.Vector3().fromBufferAttribute(p, i + 2);
    const n = new THREE.Vector3().crossVectors(b.clone().sub(a), c.clone().sub(a)).normalize();
    if (n.dot(a.clone().add(b).add(c)) < 0) n.negate();
    let gr = gruppi.find(x => x.n.dot(n) > 0.95);
    if (!gr) { gr = { n, punti: [] }; gruppi.push(gr); }
    gr.punti.push(a, b, c);
  }
  return gruppi.map(gr => ({ n: gr.n, c: gr.punti.reduce((s, x) => s.add(x), new THREE.Vector3()).multiplyScalar(1 / gr.punti.length) }));
}
const cacheNumeri = {};
function numero(n) {
  if (cacheNumeri[n]) return cacheNumeri[n];
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  x.fillStyle = '#f6efe0'; x.font = '800 40px Inter, system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(n), 32, 34);
  if (n === 6 || n === 9) x.fillRect(20, 54, 24, 4);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return (cacheNumeri[n] = t);
}
function dado(facce, valore, i, n, critico, fallimento, zero) {
  const g = geometria(facce), elenco = facceDi(g);
  const colore = critico ? 0xd4a838 : fallimento ? 0x6a1e1e : { 4: 0x3f7a4a, 6: 0xb8433a, 8: 0x2f5d9e, 10: 0x7a4fa0, 12: 0xa0602a, 20: 0x2a2a30, 100: 0x7a4fa0 }[facce] || 0x2a2a30;
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: colore, roughness: 0.35, metalness: 0.15, flatShading: true }));
  m.castShadow = true;
  const dim = facce === 20 ? 0.34 : facce === 4 || facce === 12 ? 0.42 : 0.5;
  // d100: le facce valgono 10, 20 ... 90, 00
  const D6 = [3, 4, 1, 6, 2, 5]; // facce opposte che sommano 7, come un dado vero
  const valoreFaccia = k => facce === 100 ? ((k + 1) * 10) % 100 : facce === 6 ? D6[k] : zero ? (k + 1) % 10 : k + 1; // zero: d10 delle unità del d100 (0-9)
  elenco.forEach((f, k) => {
    const v = valoreFaccia(k), etichetta = new THREE.Mesh(new THREE.PlaneGeometry(dim, dim), new THREE.MeshBasicMaterial({ map: numero(facce === 100 && v === 0 ? '00' : v), transparent: true, depthWrite: false }));
    etichetta.position.copy(f.c).addScaledVector(f.n, 0.012); etichetta.lookAt(f.c.clone().addScaledVector(f.n, 2)); m.add(etichetta);
  });
  // orientamento finale: la faccia con [valore] guarda in alto, girata a caso sul piano
  const idx = facce === 100 ? (Math.floor(valore / 10) + 9) % 10 : facce === 6 ? D6.indexOf(valore) : zero ? (valore + 9) % 10 : Math.min(elenco.length - 1, Math.max(0, valore - 1));
  const qFinale = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * 6.28).multiply(new THREE.Quaternion().setFromUnitVectors(elenco[idx].n, new THREE.Vector3(0, 1, 0)));
  const asse = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
  const arrivo = new THREE.Vector3((i - (n - 1) / 2) * 1.6, 0.85, (Math.random() - 0.5) * 0.8);
  const partenza = new THREE.Vector3(arrivo.x + 5 + Math.random() * 2, 3.5, arrivo.z + 4);
  scena.add(m);
  return { m, qFinale, asse, giri: 3 + Math.random() * 2, partenza, arrivo, durata: 1200 + Math.random() * 300, idx, elenco };
}
function ciclo() {
  const adesso = performance.now();
  for (const d of attivi) {
    const f = Math.max(0, Math.min(1, (adesso - d.t0) / d.durata)), e = 1 - Math.pow(1 - f, 3);
    d.m.position.lerpVectors(d.partenza, d.arrivo, e);
    d.m.position.y = d.arrivo.y + Math.abs(Math.sin(f * Math.PI * 3)) * (1 - f) * 2.2 + (1 - e) * 1.5;
    d.m.quaternion.copy(d.qFinale).multiply(new THREE.Quaternion().setFromAxisAngle(d.asse, (1 - e) * d.giri * 6.283));
  }
  const resto = fine - adesso;
  tela.style.opacity = resto < 400 ? Math.max(0, resto / 400) : 1;
  renderer.render(scena, camera);
  if (resto > 0) idFrame = requestAnimationFrame(ciclo);
  else { attivi.forEach(d => scena.remove(d.m)); attivi = []; tela.style.display = 'none'; }
}
// tiro del server: { formula: '2d6+3', dadi: [...], scartati: [...], critico, fallimento }
export function lancia(tiro) {
  const facce = Number(String(tiro.formula).match(/d(\d+)/)?.[1]) || 20;
  prepara();
  cancelAnimationFrame(idFrame); attivi.forEach(d => scena.remove(d.m)); attivi = [];
  // d100 come al tavolo vero: due d10, decine (00-90) e unità (0-9); 100 = 00 + 0
  const valori = [...tiro.dadi, ...(tiro.scartati || [])].slice(0, 8).flatMap(v => facce === 100 ? [{ f: 100, v: Math.floor((v % 100) / 10) * 10 }, { f: 10, v: v % 10, zero: true }] : [{ f: facce, v }]).slice(0, 8), t0 = performance.now();
  valori.forEach(({ f, v, zero }, i) => { const d = dado(f, v, i, valori.length, tiro.critico && i === 0, tiro.fallimento && i === 0, zero); d.t0 = t0 + i * 80; attivi.push(d); });
  fine = t0 + 1500 + valori.length * 80 + 1300;
  tela.style.display = 'block'; tela.style.opacity = 1;
  ciclo();
  return attivi.map(d => ({ facce: d.elenco.length, idx: d.idx, su: d.elenco[d.idx].n.clone().applyQuaternion(d.qFinale).y }));
}
