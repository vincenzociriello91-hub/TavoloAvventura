/* Vista 3D stile HD-2D (come la direzione grafica delle Cronache dei Varchi): terreno della mappa 2D steso a terra,
   muri, case e tetti in rilievo, oggetti di scena in 3D, personaggi LPC in piedi rivolti alla telecamera,
   sole e luci vere con le ombre, pioggia e neve, bagliore delle luci e sfocatura di profondità (tilt-shift).
   Stessi dati e stesse regole della mappa 2D (Mappa.dati3D): qui cambia solo come si vede. */
import * as THREE from 'three';
import { EffectComposer } from './vendor/postprocessing/EffectComposer.js';
import { RenderPass } from './vendor/postprocessing/RenderPass.js';
import { ShaderPass } from './vendor/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from './vendor/postprocessing/UnrealBloomPass.js';
import { OutputPass } from './vendor/postprocessing/OutputPass.js';

const TILT = {
  uniforms: { tDiffuse: { value: null }, risoluzione: { value: new THREE.Vector2(1, 1) }, forza: { value: 2.6 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 risoluzione; uniform float forza; varying vec2 vUv;
    void main(){ float d = smoothstep(0.18, 0.5, abs(vUv.y - 0.55)); vec4 c = vec4(0.0); float tot = 0.0;
      for (int i = -2; i <= 2; i++) for (int j = -2; j <= 2; j++) { float w = 1.0 / (1.0 + float(i*i + j*j)); c += texture2D(tDiffuse, vUv + vec2(float(i), float(j)) * d * forza / risoluzione) * w; tot += w; }
      gl_FragColor = c / tot; }`
};

export function crea(contenitore, opz) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.domElement.className = 'mappa3d';
  contenitore.appendChild(renderer.domElement);
  const scena = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scena, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.6, 0.45, 0.82); composer.addPass(bloom);
  const tilt = new ShaderPass(TILT); composer.addPass(tilt);
  composer.addPass(new OutputPass());

  const emisfero = new THREE.HemisphereLight(0xffffff, 0x404040, 1); scena.add(emisfero);
  const sole = new THREE.DirectionalLight(0xffffff, 2.2); sole.castShadow = true; sole.shadow.mapSize.set(2048, 2048); sole.shadow.bias = -0.0006; sole.shadow.normalBias = 0.02; scena.add(sole); scena.add(sole.target);
  let mondo = new THREE.Group(); scena.add(mondo);
  let figure = new Map(), luci = [], meteoObj = null, chiaveCostruita = '', dati = null, nebbia = null, velo = null;
  // telecamera: guarda da sud, inclinata, si sposta col dito e si avvicina con due dita o la rotellina
  const cam = { x: 16, z: 10, dist: 16, alto: 0.95 }, DMIN = 5, DMAX = 70;
  function posizionaCamera() {
    if (dati) { const W = dati.luogo.w, H = dati.luogo.h, mezzo = Math.min(W / 2, cam.dist * camera.aspect * 0.32); cam.x = Math.max(mezzo, Math.min(W - mezzo, cam.x)); cam.z = Math.max(Math.min(H / 2, cam.dist * 0.22), Math.min(H - 1, cam.z)); }
    camera.position.set(cam.x, Math.sin(cam.alto) * cam.dist, cam.z + Math.cos(cam.alto) * cam.dist);
    camera.lookAt(cam.x, 0, cam.z);
  }
  function adatta() {
    const w = contenitore.clientWidth || 360, h = Math.max(240, Math.min(window.innerHeight * 0.62, w * 0.8));
    renderer.setSize(w, h); composer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
    tilt.uniforms.risoluzione.value.set(w, h);
  }
  new ResizeObserver(adatta).observe(contenitore); adatta();

  /* ---------- materiali e texture generate ---------- */
  const tela = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  const pietra = (chiaro) => tela(128, 128, (k, w, h) => { k.fillStyle = chiaro ? '#4a4540' : '#2c2824'; k.fillRect(0, 0, w, h); for (let y = 0; y < 4; y++) for (let x = -1; x < 3; x++) { const v = Math.random(); k.fillStyle = `hsl(30,7%,${(chiaro ? 34 : 22) + v * 14}%)`; k.fillRect(x * 64 + (y % 2) * 32 + 2, y * 32 + 2, 60, 28); } });
  const intonaco = tela(128, 128, (k, w, h) => { k.fillStyle = '#d9cbb0'; k.fillRect(0, 0, w, h); k.fillStyle = '#5a3a20'; for (const x of [0, 60, 124]) k.fillRect(x, 0, 6, h); k.fillRect(0, 0, w, 6); k.fillRect(0, 60, w, 5); k.fillStyle = '#3a2a1a'; k.fillRect(26, 22, 20, 24); k.fillRect(84, 22, 20, 24); k.fillStyle = '#e8c870'; k.fillRect(29, 25, 14, 18); k.fillRect(87, 25, 14, 18); });
  const tegole = (col) => tela(128, 128, (k, w, h) => { k.fillStyle = col; k.fillRect(0, 0, w, h); k.strokeStyle = 'rgba(0,0,0,.28)'; k.lineWidth = 3; for (let y = 0; y < h; y += 14) { k.beginPath(); k.moveTo(0, y); k.lineTo(w, y); k.stroke(); for (let x = (y / 14 % 2) * 10; x < w; x += 20) { k.beginPath(); k.moveTo(x, y); k.lineTo(x, y + 14); k.stroke(); } } });
  const MAT = {};
  const mat = (nome, fn) => MAT[nome] || (MAT[nome] = fn());
  const std = (col, extra = {}) => new THREE.MeshStandardMaterial({ color: col, roughness: 0.85, metalness: 0, ...extra });
  const legno = () => mat('legno', () => std(0x7a5232));
  const legnoScuro = () => mat('legnoScuro', () => std(0x4a2e18));
  const ferro = () => mat('ferro', () => std(0x5a5a5e, { metalness: 0.6, roughness: 0.4 }));
  const sasso = () => mat('sasso', () => std(0x7a756e));
  const fuoco = () => mat('fuoco', () => new THREE.MeshBasicMaterial({ color: 0xffb040 }));
  const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; return o; };
  const cil = (r1, r2, h, m, x = 0, y = 0, z = 0, seg = 14) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; return o; };
  const sfera = (r, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; return o; };

  /* ---------- oggetti di scena in 3D ---------- */
  // 1 casella = 1,5 m (5 piedi, come in D&D) e le figure sono alte circa 1,8 m: ogni oggetto ha le sue misure vere
  const LUNGHI = ['letto', 'carretto', 'tronco', 'bancarella', 'barca'];
  function oggetto3D(o, L) {
    const g = new THREE.Group(), r = ((o.x * 73856093) ^ (o.y * 19349663)) >>> 0;
    const add = (...m) => m.forEach(x => g.add(x));
    const lungo = LUNGHI.includes(o.tipo) && o.dir; // due caselle: si costruisce lungo X da -1 a +1, con la testa a ovest
    const aMuro = () => { g.rotation.y = -(o.rot || 0) * Math.PI / 2; }; // il retro contro il muro (rot = lato del muro: 0 N, 1 E, 2 S, 3 O)
    switch (o.tipo) {
      case 'tavolo': add(box(0.86, 0.05, 0.78, legno(), 0, 0.5, 0)); for (const [a, b] of [[-0.36, -0.31], [0.36, -0.31], [-0.36, 0.31], [0.36, 0.31]]) add(box(0.06, 0.48, 0.06, legnoScuro(), a, 0.24, b)); if (r % 3) add(cil(0.045, 0.04, 0.1, mat('boccale', () => std(0xc8b090)), -0.15, 0.57, -0.1)); break;
      case 'sedia': { add(box(0.3, 0.04, 0.3, legno(), 0, 0.3, 0)); for (const [a, b] of [[-0.12, -0.12], [0.12, -0.12], [-0.12, 0.12], [0.12, 0.12]]) add(box(0.035, 0.3, 0.035, legnoScuro(), a, 0.15, b)); add(box(0.3, 0.32, 0.04, legno(), 0, 0.46, 0.13)); g.rotation.y = -(o.rot || 0) * Math.PI / 2; break; }
      case 'sgabello': add(cil(0.15, 0.15, 0.04, legno(), 0, 0.3, 0), cil(0.03, 0.03, 0.3, legnoScuro(), 0, 0.15, 0, 6)); break;
      case 'botte': add(cil(0.26, 0.26, 0.6, legno(), 0, 0.3, 0), cil(0.29, 0.29, 0.05, ferro(), 0, 0.1, 0), cil(0.29, 0.29, 0.05, ferro(), 0, 0.5, 0)); break;
      case 'cassa': add(box(0.5, 0.45, 0.5, mat('cassa', () => std(0x8a6038)), 0, 0.225, 0)); g.rotation.y = (r % 7) * 0.1; break;
      case 'baule': case 'forziere': { const oro = o.tipo === 'forziere'; add(box(0.62, 0.3, 0.4, legno(), 0, 0.15, -0.25), box(0.64, 0.05, 0.42, oro ? mat('oro', () => std(0xd4a838, { metalness: 0.8, roughness: 0.3 })) : ferro(), 0, 0.31, -0.25)); aMuro(); break; }
      case 'letto': { const col = [0x8a2a2a, 0x2a4a7a, 0x4a6a2a, 0x6a4a7a][r % 4];
        if (lungo) add(box(1.9, 0.22, 0.9, legnoScuro(), 0, 0.11, 0), box(0.08, 0.55, 0.9, legnoScuro(), -0.94, 0.27, 0), box(1.3, 0.08, 0.8, std(col), 0.27, 0.26, 0), box(0.3, 0.08, 0.6, mat('cuscino', () => std(0xe8e2d4)), -0.68, 0.27, 0));
        else add(box(0.86, 0.22, 0.96, legnoScuro(), 0, 0.11, 0), box(0.78, 0.08, 0.62, std(col), 0, 0.26, 0.14), box(0.6, 0.08, 0.22, mat('cuscino', () => std(0xe8e2d4)), 0, 0.27, -0.3));
        break; }
      case 'scaffale': add(box(0.9, 1.25, 0.3, legnoScuro(), 0, 0.625, -0.33)); for (let k = 0; k < 3; k++) add(box(0.8, 0.22, 0.22, std([0x7a2a24, 0x2a4a6a, 0x3a6a3a, 0x8a7a4a][(r + k) % 4]), 0, 0.22 + k * 0.38, -0.3)); aMuro(); break;
      case 'rastrelliera': add(box(0.85, 0.1, 0.18, legnoScuro(), 0, 0.4, -0.35)); for (let k = 0; k < 4; k++) add(box(0.03, 0.95, 0.03, ferro(), -0.3 + k * 0.2, 0.5, -0.35)); aMuro(); break;
      case 'candelabro': add(cil(0.03, 0.1, 0.7, ferro(), 0, 0.35, 0, 8), sfera(0.06, fuoco(), 0, 0.74, 0)); break;
      case 'torcia': { const m = [[0, -1], [0, 1], [-1, 0], [1, 0]].find(([dx, dy]) => '#wR'.includes(L.celle[o.y + dy]?.[o.x + dx])) || [0, -1]; const t = cil(0.025, 0.025, 0.35, legnoScuro(), m[0] * 0.4, 1.0, m[1] * 0.4, 6); t.rotation.set(m[1] * 0.4, 0, -m[0] * 0.4); add(t, sfera(0.07, fuoco(), m[0] * 0.33, 1.2, m[1] * 0.33)); break; }
      case 'colonna': add(cil(0.34, 0.38, 1.5, sasso(), 0, 0.75, 0, 16), box(0.9, 0.12, 0.9, sasso(), 0, 0.06, 0), box(0.9, 0.12, 0.9, sasso(), 0, 1.46, 0)); break;
      case 'statua': add(box(0.7, 0.35, 0.7, sasso(), 0, 0.175, 0), cil(0.15, 0.2, 0.75, mat('marmo', () => std(0xc8c4bc)), 0, 0.72, 0), sfera(0.13, mat('marmo', () => std(0xc8c4bc)), 0, 1.2, 0)); break;
      case 'masso': { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42, 0), sasso()); m.position.y = 0.25; m.scale.set(1, 0.7, 0.9); m.rotation.y = r; m.castShadow = m.receiveShadow = true; add(m); break; }
      case 'stalagmite': { const m = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.3, 7), mat('stalag', () => std(0x8a7a62))); m.position.y = 0.65; m.castShadow = true; add(m); break; }
      case 'carretto': {
        if (lungo) { add(box(1.5, 0.08, 0.76, legno(), -0.13, 0.45, 0), box(1.5, 0.25, 0.04, legno(), -0.13, 0.6, 0.38), box(1.5, 0.25, 0.04, legno(), -0.13, 0.6, -0.38), box(0.04, 0.25, 0.76, legno(), -0.86, 0.6, 0)); for (const z of [-0.43, 0.43]) { const w = cil(0.3, 0.3, 0.05, legnoScuro(), -0.15, 0.3, z, 12); w.rotation.x = Math.PI / 2; add(w); } for (const z of [-0.14, 0.14]) add(box(0.6, 0.04, 0.04, legnoScuro(), 0.85, 0.42, z)); }
        else { add(box(0.8, 0.08, 0.56, legno(), 0, 0.4, 0), box(0.8, 0.22, 0.04, legno(), 0, 0.52, 0.27), box(0.8, 0.22, 0.04, legno(), 0, 0.52, -0.27)); for (const z of [-0.32, 0.32]) { const w = cil(0.24, 0.24, 0.05, legnoScuro(), 0, 0.24, z, 12); w.rotation.x = Math.PI / 2; add(w); } }
        break; }
      case 'lampione': add(cil(0.05, 0.07, 2.1, ferro(), 0, 1.05, 0, 8), sfera(0.13, mat('lanterna', () => new THREE.MeshBasicMaterial({ color: 0xffe4a0 })), 0, 2.1, 0)); break;
      case 'panca': add(box(0.95, 0.05, 0.28, legno(), 0, 0.3, 0), box(0.05, 0.3, 0.24, legnoScuro(), -0.4, 0.15, 0), box(0.05, 0.3, 0.24, legnoScuro(), 0.4, 0.15, 0)); break;
      case 'fieno': { const f = cil(0.3, 0.3, 0.6, mat('fieno', () => std(0xc8a848)), 0, 0.3, 0); f.rotation.z = Math.PI / 2; add(f); break; }
      case 'bancarella': { const col = [0xa82a24, 0x2a5a9a, 0x3a7a3a][r % 3], lw = lungo ? 1.85 : 0.9;
        add(box(lw, 0.6, 0.45, legno(), 0, 0.3, 0.2)); for (const [a, b] of [[-lw / 2, -0.4], [lw / 2, -0.4], [-lw / 2, 0.4], [lw / 2, 0.4]]) add(box(0.04, 1.4, 0.04, legnoScuro(), a, 0.7, b));
        const t = new THREE.Mesh(new THREE.PlaneGeometry(lw + 0.1, 0.95), new THREE.MeshStandardMaterial({ map: tela(64, 64, (k) => { for (let i = 0; i < 8; i++) { k.fillStyle = i % 2 ? '#e8e0cc' : '#' + col.toString(16).padStart(6, '0'); k.fillRect(i * 8, 0, 8, 64); } }), side: THREE.DoubleSide })); t.rotation.x = -Math.PI / 2 + 0.25; t.position.y = 1.42; t.castShadow = true; add(t); break; }
      case 'cespuglio': { const c = std(0x3a6a2a); add(sfera(0.3, c, 0, 0.26, 0), sfera(0.22, c, 0.2, 0.2, 0.12), sfera(0.2, c, -0.18, 0.18, -0.1)); break; }
      case 'tronco': { const t = cil(0.2, 0.24, lungo ? 1.85 : 0.9, mat('tronco', () => std(0x6a4a2a)), 0, 0.22, 0); t.rotation.z = Math.PI / 2; if (!lungo) g.rotation.y = (o.rot || 0) * 0.6; add(t); break; }
      case 'ceppo': add(cil(0.25, 0.28, 0.3, mat('tronco', () => std(0x6a4a2a)), 0, 0.15, 0)); break;
      case 'falo': { for (let k = 0; k < 9; k++) add(sfera(0.08, sasso(), Math.cos(k * 0.7) * 0.36, 0.05, Math.sin(k * 0.7) * 0.36)); const f = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.55, 8), fuoco()); f.position.y = 0.3; add(f); break; }
      case 'barca': { const lb = lungo ? 1.85 : 0.95; add(box(lb, 0.3, 0.6, legno(), 0, 0.05, 0), box(lb * 0.85, 0.05, 0.5, legnoScuro(), 0, 0.21, 0), box(0.1, 0.05, 0.55, legno(), 0, 0.24, 0)); if (!lungo) g.rotation.y = (o.rot || 0) * 0.4; break; }
      case 'altare': add(box(0.95, 0.6, 0.6, sasso(), 0, 0.3, 0), box(0.4, 0.02, 0.62, mat('drappo', () => std(0x6a1e24)), 0, 0.61, 0), cil(0.035, 0.035, 0.16, mat('cera', () => std(0xe8e0c8)), -0.38, 0.7, 0, 6), cil(0.035, 0.035, 0.16, mat('cera', () => std(0xe8e0c8)), 0.38, 0.7, 0, 6), sfera(0.045, fuoco(), -0.38, 0.81, 0), sfera(0.045, fuoco(), 0.38, 0.81, 0)); break;
      case 'stendardo': { add(cil(0.035, 0.035, 2.2, legnoScuro(), 0, 1.1, 0, 6)); const b = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.85), std([0x8a1e24, 0x1e3a7a, 0x2a5a2a][r % 3], { side: THREE.DoubleSide })); b.position.set(0.3, 1.7, 0); b.castShadow = true; add(b); break; }
      case 'sacco': { const s = sfera(0.22, mat('sacco', () => std(0xa8936a)), 0, 0.19, 0); s.scale.set(1, 0.85, 0.9); add(s); break; }
      case 'secchio': add(cil(0.14, 0.11, 0.25, ferro(), 0, 0.125, 0)); break;
      default: { // decalcomania vista dall'alto (tappeti, ossa, macerie...) o oggetto aggiunto dal master
        if (['tappeto', 'ragnatela', 'ossa', 'funghi', 'macerie'].includes(o.tipo)) return null; // già nel terreno
        add(box(0.45, 0.45, 0.45, mat('generico', () => std(0x6a5a48)), 0, 0.225, 0));
      }
    }
    if (o.stato === 'bruciato') g.traverse(m => { if (m.isMesh) m.material = mat('bruciato', () => std(0x1a1512)); });
    if (o.stato === 'rotto') { g.rotation.z = 0.35; g.position.y = -0.1; }
    if (lungo) { const v = o.dir === 'v'; g.position.set(o.x + (v ? 0.5 : 1), 0, o.y + (v ? 1 : 0.5)); g.rotation.y = v ? (o.rot === 2 ? Math.PI / 2 : -Math.PI / 2) : (o.rot === 1 ? Math.PI : 0); }
    else g.position.set(o.x + 0.5, 0, o.y + 0.5);
    return g;
  }

  /* ---------- costruzione del luogo ---------- */
  function costruisci(d) {
    scena.remove(mondo); mondo.traverse(o => { o.geometry?.dispose?.(); if (o.material?.map) o.material.map.dispose(); });
    mondo = new THREE.Group(); scena.add(mondo); figure.forEach(f => scena.remove(f.gruppo)); figure = new Map(); luci.forEach(l => scena.remove(l)); luci = [];
    const L = d.luogo, W = L.w, H = L.h, cella = (x, y) => L.celle[y]?.[x] ?? '#', muro = c => c === '#' || c === 'w' || c === 'R';
    // terreno: lo stesso disegno della mappa 2D
    const tex = new THREE.CanvasTexture(Mappa.terreno3D(48)); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const suolo = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }));
    suolo.rotation.x = -Math.PI / 2; suolo.position.set(W / 2, 0, H / 2); suolo.receiveShadow = true; suolo.name = 'suolo'; mondo.add(suolo);
    // acqua lucida sopra le caselle d'acqua
    const acqua = []; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (cella(x, y) === '~') acqua.push([x, y]);
    if (acqua.length) { const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshStandardMaterial({ color: 0x2a6a90, transparent: true, opacity: 0.55, roughness: 0.15, metalness: 0.3 }), acqua.length); const m4 = new THREE.Matrix4(); acqua.forEach(([x, y], i) => { m4.makeRotationX(-Math.PI / 2).setPosition(x + 0.5, 0.03, y + 0.5); im.setMatrixAt(i, m4); }); im.receiveShadow = true; mondo.add(im); }
    // muri in rilievo (le case all'aperto diventano edifici con il tetto)
    const tipi = { '#': [], w: [], R: [] };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const c = cella(x, y); if (muro(c) && !Mappa.casa3D(x, y)) tipi[c].push([x, y]); }
    const alt = { '#': d.esterno ? 1.6 : 1.5, w: 1.9, R: 1.3 };
    for (const [c, celle] of Object.entries(tipi)) {
      if (!celle.length) continue;
      const m = c === 'R' ? std(0x3a332c, { map: pietra(false) }) : std(0xffffff, { map: pietra(c === 'w') });
      const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, alt[c], 1), m, celle.length); const m4 = new THREE.Matrix4();
      celle.forEach(([x, y], i) => { m4.makeTranslation(x + 0.5, alt[c] / 2, y + 0.5); im.setMatrixAt(i, m4); });
      im.castShadow = im.receiveShadow = true; mondo.add(im);
    }
    // porte: legno nell'apertura
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (cella(x, y) === '+' && !Mappa.casa3D(x, y)) { const v = muro(cella(x, y - 1)) && muro(cella(x, y + 1)); mondo.add(box(v ? 0.12 : 0.9, 1.35, v ? 0.9 : 0.12, legno(), x + 0.5, 0.675, y + 0.5)); }
    // camino, bancone, scale
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const c = cella(x, y);
      if (c === 'f') { mondo.add(box(1, 1.1, 0.9, sasso(), x + 0.5, 0.55, y + 0.45)); mondo.add(box(0.6, 0.45, 0.2, mat('buio', () => new THREE.MeshBasicMaterial({ color: 0x150c08 })), x + 0.5, 0.3, y + 0.92)); const f = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.4, 8), fuoco()); f.position.set(x + 0.5, 0.25, y + 0.85); mondo.add(f); }
      if (c === 'b') mondo.add(box(1.01, 0.75, 0.75, mat('bancone', () => std(0x5a361b)), x + 0.5, 0.375, y + 0.5));
    }
    // edifici all'aperto: corpo intonacato e tetto a due falde con le tegole
    for (const e of L.edifici) {
      if (e.id === 'pozzo') { const cx = e.x + e.w / 2, cz = e.y + e.h / 2; mondo.add(cil(0.8, 0.85, 0.7, sasso(), cx, 0.35, cz, 18)); mondo.add(cil(0.62, 0.62, 0.02, mat('acquaPozzo', () => std(0x1a3a4a, { roughness: 0.1 })), cx, 0.6, cz, 18)); mondo.add(box(0.08, 1.4, 0.08, legnoScuro(), cx - 0.75, 0.7, cz), box(0.08, 1.4, 0.08, legnoScuro(), cx + 0.75, 0.7, cz), box(1.7, 0.08, 0.1, legnoScuro(), cx, 1.4, cz)); continue; }
      if (!(d.esterno && L.celle[e.y]?.[e.x] === '#')) continue;
      const cx = e.x + e.w / 2, cz = e.y + e.h / 2, alto = /^Torre|Mastio/.test(e.nome) ? 3.2 : 1.6;
      if (e.stato === 'distrutto') { for (let k = 0; k < e.w * e.h; k++) { const b = box(0.3 + Math.random() * 0.5, 0.15 + Math.random() * 0.4, 0.3 + Math.random() * 0.5, sasso(), e.x + Math.random() * e.w, 0.15, e.y + Math.random() * e.h); b.rotation.y = Math.random() * 3; mondo.add(b); } continue; }
      const bruciato = e.stato === 'bruciato';
      const corpo = box(e.w - 0.1, alto, e.h - 0.1, bruciato ? mat('carbone', () => std(0x231c18)) : new THREE.MeshStandardMaterial({ map: intonaco, roughness: 0.9 }), cx, alto / 2, cz); mondo.add(corpo);
      if (bruciato) continue;
      const tempio = /^(Tempio|Cappella)/.test(e.nome), col = tempio ? '#6d6aa0' : /^Locanda/.test(e.nome) ? '#9c4a2c' : /^Torre|Mastio/.test(e.nome) ? '#6a6660' : ['#a0603c', '#8a4a30', '#b0704a'][(e.x + e.y) % 3];
      const lungo = Math.max(e.w, e.h), corto = Math.min(e.w, e.h), hT = corto * 0.45;
      const geo = new THREE.BufferGeometry(); const a = lungo / 2 + 0.15, b = corto / 2 + 0.2;
      const v = new Float32Array([-a, 0, -b, a, 0, -b, a, hT, 0, -a, hT, 0, -a, 0, b, a, 0, b, a, hT, 0, -a, hT, 0, -a, 0, -b, -a, hT, 0, -a, 0, b, a, 0, -b, a, hT, 0, a, 0, b]);
      geo.setAttribute('position', new THREE.BufferAttribute(v, 3));
      geo.setIndex([0, 3, 2, 0, 2, 1, 4, 5, 6, 4, 6, 7, 8, 10, 9, 11, 12, 13]);
      geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 2, 0, 2, 1, 0, 1, 0, 0, 2, 0, 2, 1, 0, 1, 0, 0, 0.5, 1, 1, 0, 0, 0, 0.5, 1, 1, 0]), 2));
      geo.computeVertexNormals();
      const tetto = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tegole(d.innevato ? '#e8eef6' : col), roughness: 0.8, side: THREE.DoubleSide }));
      tetto.position.set(cx, alto, cz); if (e.h > e.w) tetto.rotation.y = Math.PI / 2; tetto.castShadow = tetto.receiveShadow = true; mondo.add(tetto);
      if (e.stato === 'danneggiato') mondo.add(box(0.8, 0.3, 0.8, mat('carbone', () => std(0x231c18)), cx, alto + hT * 0.6, cz));
    }
    // alberi di stagione
    const alberi = []; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (cella(x, y) === 'T') alberi.push([x, y]);
    if (alberi.length) {
      const tronchi = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.1, 0.14, 1.2, 6), std(0x4a3624), alberi.length);
      const chiome = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.7, 1), std(0xffffff), alberi.length * 2);
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), pos = new THREE.Vector3(), col = new THREE.Color();
      const spoglio = d.stagione === 'inverno';
      alberi.forEach(([x, y], i) => {
        const r = ((x * 73856093) ^ (y * 19349663)) >>> 0, ox = x + 0.5 + ((r % 7) - 3) * 0.05, oz = y + 0.5 + (((r >> 3) % 7) - 3) * 0.05, s = 0.85 + (r % 5) * 0.08;
        m4.compose(pos.set(ox, 0.6 * s, oz), q, sc.set(s, s, s)); tronchi.setMatrixAt(i, m4);
        for (let k = 0; k < 2; k++) {
          const sk = spoglio ? 0.0001 : s * (k ? 0.75 : 1);
          m4.compose(pos.set(ox + (k ? 0.18 : 0), (1.45 + k * 0.45) * s, oz + (k ? -0.1 : 0)), q, sc.set(sk, sk * 0.9, sk)); chiome.setMatrixAt(i * 2 + k, m4);
          const tono = d.stagione === 'autunno' ? [0.05, 0.08, 0.11, 0.25][(r + k) % 4] : 0.27 + (r % 5) * 0.015;
          chiome.setColorAt(i * 2 + k, col.setHSL(tono, d.stagione === 'autunno' ? 0.7 : 0.45, d.innevato ? 0.85 : 0.22 + ((r >> 2) % 4) * 0.03));
        }
      });
      tronchi.castShadow = chiome.castShadow = true; tronchi.receiveShadow = chiome.receiveShadow = true;
      mondo.add(tronchi, chiome);
    }
    // oggetti di scena
    for (const o of L.oggetti || []) { const g = oggetto3D(o, L); if (g) mondo.add(g); }
    // luci vere: le più vicine al centro della vista proiettano ombre
    const sorg = d.sorgenti.slice(0, 10);
    sorg.forEach((s, i) => { const l = new THREE.PointLight(new THREE.Color(s.rgb[0], s.rgb[1], s.rgb[2]), s.i * 6, s.r * 1.6, 1.6); l.position.set(s.x, 1.1, s.y); l.castShadow = i < 2; if (l.castShadow) { l.shadow.mapSize.set(512, 512); l.shadow.bias = -0.002; } l.userData = { base: s.i * 6, fiamma: s.fiamma }; scena.add(l); luci.push(l); });
    // nebbia di guerra: blocchi neri sopra le caselle mai viste
    nebbia = null;
    if (L.visto) { const celle = []; for (let i = 0; i < L.visto.length; i++) if (L.visto[i] === '0') celle.push(i); if (celle.length) { nebbia = new THREE.InstancedMesh(new THREE.BoxGeometry(1.02, 4, 1.02), new THREE.MeshBasicMaterial({ color: 0x0b0908, transparent: d.extra.vedeTutto, opacity: d.extra.vedeTutto ? 0.5 : 1 }), celle.length); const m4 = new THREE.Matrix4(); celle.forEach((i, k) => { m4.makeTranslation(i % W + 0.5, 2, Math.floor(i / W) + 0.5); nebbia.setMatrixAt(k, m4); }); mondo.add(nebbia); } }
    // vista del personaggio: velo scuro dove ora non vede
    velo = null;
    if (d.vista) { const celle = []; d.vista.forEach((v, i) => { if (v < 2) celle.push([i, v]); }); if (celle.length) { velo = new THREE.InstancedMesh(new THREE.BoxGeometry(1.01, 3.6, 1.01), new THREE.MeshBasicMaterial({ color: 0x05050c, transparent: true, opacity: 0.55, depthWrite: false }), celle.length); const m4 = new THREE.Matrix4(); celle.forEach(([i], k) => { m4.makeTranslation(i % W + 0.5, 1.8, Math.floor(i / W) + 0.5); velo.setMatrixAt(k, m4); }); mondo.add(velo); } }
    luceDelMomento(d);
    meteo(d);
    if (!chiaveCostruita.startsWith(L.id + '|')) { const io = d.segnalini[opz.io()]; cam.x = io ? io.x + 0.5 : W / 2; cam.z = io ? io.y - 1.5 : H / 2; }
    chiaveCostruita = L.id + '|' + d.chiave + '|' + (d.luogo.visto || '') + '|' + (d.vista ? d.vista.join('') : '');
  }
  function luceDelMomento(d) {
    const { liv, col } = d.amb, c = new THREE.Color(col[0], col[1], col[2]);
    emisfero.color.copy(c); emisfero.groundColor.set(0x2a2420); emisfero.intensity = 0.25 + liv * 1.1;
    scena.background = new THREE.Color(0x0b0908);
    if (d.sole) {
      const L = d.luogo, cx = L.w / 2, cz = L.h / 2, v = d.sole;
      sole.visible = true; sole.color.copy(c); sole.intensity = 1.2 + liv * 1.8;
      sole.position.set(cx - v.x * 12, 14, cz - v.y * 12); sole.target.position.set(cx, 0, cz);
      const s = sole.shadow.camera; s.left = -L.w * 0.75; s.right = L.w * 0.75; s.top = L.h * 0.9; s.bottom = -L.h * 0.9; s.near = 1; s.far = 60; s.updateProjectionMatrix();
    } else sole.visible = false;
    scena.fog = d.meteo === 'nebbia' && d.esterno ? new THREE.FogExp2(0xc8ccd4, 0.06) : null;
    bloom.strength = d.notte || !d.esterno ? 0.75 : 0.35;
  }
  function meteo(d) {
    if (meteoObj) { scena.remove(meteoObj); meteoObj.geometry.dispose(); meteoObj = null; }
    if (!d.esterno || !['pioggia', 'temporale', 'neve'].includes(d.meteo)) return;
    const L = d.luogo, neve = d.meteo === 'neve', n = neve ? 1500 : d.meteo === 'temporale' ? 2600 : 1700;
    const pos = new Float32Array(n * (neve ? 3 : 6));
    for (let i = 0; i < n; i++) { const x = Math.random() * L.w, y = Math.random() * 10, z = Math.random() * L.h; if (neve) pos.set([x, y, z], i * 3); else pos.set([x, y, z, x - 0.05, y + 0.45, z], i * 6); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    meteoObj = neve ? new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.08, transparent: true, opacity: 0.9 })) : new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xaac4e0, transparent: true, opacity: 0.45 }));
    meteoObj.userData = { neve, temporale: d.meteo === 'temporale' };
    scena.add(meteoObj);
  }

  /* ---------- personaggi: figure LPC in piedi (sprite rivolti alla telecamera) ---------- */
  function testoSprite(t, colore = 'rgba(20,17,15,.8)') {
    const c = document.createElement('canvas'), k = c.getContext('2d'); k.font = '600 26px Inter, system-ui, sans-serif';
    const w = Math.ceil(k.measureText(t).width) + 20; c.width = w; c.height = 38; k.font = '600 26px Inter, system-ui, sans-serif';
    k.fillStyle = colore; k.beginPath(); k.roundRect ? k.roundRect(0, 0, w, 38, 10) : k.rect(0, 0, w, 38); k.fill(); k.fillStyle = '#f3ead9'; k.fillText(t, 10, 28);
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, depthTest: false })); s.scale.set(w / 38 * 0.32, 0.32, 1); s.renderOrder = 10; return s;
  }
  function aggiornaFigure(d, dt) {
    const visti = new Set();
    for (const [id, sg] of Object.entries(d.segnalini)) {
      const nascosto = !d.extra.vedeTutto && (sg.tipo === 'nemico' || sg.tipo === 'png') && ((d.luogo.visto && d.luogo.visto[sg.y * d.luogo.w + sg.x] === '0') || (d.vista && !d.vista[sg.y * d.luogo.w + sg.x]));
      let f = figure.get(id);
      if (!f) {
        const tela2 = document.createElement('canvas'); tela2.width = tela2.height = 64;
        const tx = new THREE.CanvasTexture(tela2); tx.colorSpace = THREE.SRGBColorSpace; tx.magFilter = THREE.NearestFilter; tx.minFilter = THREE.NearestFilter;
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, alphaTest: 0.4 })); sprite.center.set(0.5, 7 / 64); sprite.scale.set(1.6, 1.6, 1); sprite.castShadow = true;
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.4, 0.06, 24), new THREE.MeshStandardMaterial({ color: sg.tipo === 'nemico' ? 0xd84b3c : sg.tipo === 'png' ? 0xbfae86 : new THREE.Color(sg.colore || '#e8b04b') }));
        base.position.y = 0.03; base.receiveShadow = true;
        const nome = testoSprite(sg.nome || '?', sg.tipo === 'nemico' ? 'rgba(70,14,12,.85)' : 'rgba(20,17,15,.8)'); nome.position.y = -0.05; nome.center.set(0.5, 1.2);
        const gruppo = new THREE.Group(); gruppo.add(base, sprite, nome); scena.add(gruppo);
        f = { gruppo, sprite, tela: tela2, tx, x: sg.x + 0.5, z: sg.y + 0.5, dir: 2, fase: 0, nome: sg.nome };
        figure.set(id, f);
      }
      visti.add(id);
      f.gruppo.visible = !nascosto;
      // cammina sul percorso vero intorno ai muri (stesso calcolo della mappa 2D); se non c'è o è lunghissimo, salta lì
      const meta = sg.x + ',' + sg.y;
      if (f.meta !== meta) { f.meta = meta; const via = Math.hypot(sg.x + 0.5 - f.x, sg.y + 0.5 - f.z) > 0.01 ? Mappa.percorso({ x: Math.floor(f.x), y: Math.floor(f.z) }, sg) : null; f.via = via && via.length <= 30 ? via : null; if (!f.via) { f.x = sg.x + 0.5; f.z = sg.y + 0.5; } }
      const tappa = f.via?.[0] || sg, tx = tappa.x + 0.5, tz = tappa.y + 0.5, dx = tx - f.x, dz = tz - f.z, dist = Math.hypot(dx, dz);
      if (dist > 0.01) { const v = Math.min(dist, dt * 4.5); f.x += dx / dist * v; f.z += dz / dist * v; f.dir = Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 3 : 1) : (dz > 0 ? 2 : 0); f.fase += dt * 9; f.cammina = true; }
      else if (f.via?.length) { f.x = tx; f.z = tz; f.via.shift(); }
      else { f.x = tx; f.z = tz; f.cammina = false; f.fase = 0; }
      f.gruppo.position.set(f.x, 0, f.z);
      // fotogramma: figura LPC se c'è, altrimenti segnalino tondo con l'iniziale
      const sh = Mappa.figura(id, sg), k = f.tela.getContext('2d'), col = f.cammina ? 1 + Math.floor(f.fase) % 8 : 0, chiave = sh ? `${col}|${f.dir}|${sh.width}` : Mappa.mostro(sg) ? 'mostro' : 'tondo';
      if (chiave !== f.chiave || sh !== f.sh) {
        k.clearRect(0, 0, 64, 64);
        if (sh) { k.imageSmoothingEnabled = false; k.drawImage(sh, col * 64, f.dir * 64, 64, 64, 0, 0, 64, 64); }
        else if (Mappa.mostro(sg)) { const im = Mappa.mostro(sg), sc = Math.min(64 / im.width, 60 / im.height); k.imageSmoothingEnabled = false; k.drawImage(im, 32 - im.width * sc / 2, 57 - im.height * sc, im.width * sc, im.height * sc); if (Mappa.grande(sg)) f.sprite.scale.set(2.8, 2.8, 1); }
        else { k.fillStyle = sg.tipo === 'nemico' ? '#7a1a16' : sg.colore || '#e8b04b'; k.beginPath(); k.arc(32, 44, 13, 0, 7); k.fill(); k.strokeStyle = '#1a1210'; k.lineWidth = 3; k.stroke(); k.fillStyle = '#fff'; k.font = '800 15px Inter, sans-serif'; k.textAlign = 'center'; k.fillText((sg.nome || '?').charAt(0).toUpperCase(), 32, 49); }
        f.tx.needsUpdate = true; f.chiave = chiave; f.sh = sh;
      }
    }
    for (const [id, f] of figure) if (!visti.has(id)) { scena.remove(f.gruppo); figure.delete(id); }
  }

  /* ---------- tocchi: trascina per spostare la vista, tocca per muoverti, tieni premuto per l'edificio ---------- */
  const ray = new THREE.Raycaster(), piano = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), punti = new Map();
  let gesto = null;
  const casellaDa = (ev) => { const b = renderer.domElement.getBoundingClientRect(); ray.setFromCamera(new THREE.Vector2((ev.clientX - b.left) / b.width * 2 - 1, -((ev.clientY - b.top) / b.height) * 2 + 1), camera); const p = new THREE.Vector3(); return ray.ray.intersectPlane(piano, p) ? { x: Math.floor(p.x), y: Math.floor(p.z), p } : null; };
  const el = renderer.domElement;
  el.style.touchAction = 'none';
  el.addEventListener('pointerdown', ev => {
    el.setPointerCapture(ev.pointerId); punti.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (punti.size === 2) { const [a, b] = [...punti.values()]; gesto = { tipo: 'pizzico', d0: Math.hypot(a.x - b.x, a.y - b.y), dist0: cam.dist }; return; }
    const q = casellaDa(ev), io = opz.io(), mio = dati?.segnalini[io];
    if (q && mio && q.x === mio.x && q.y === mio.y && Mappa.puoMuovere(io)) { gesto = { tipo: 'trascina', id: io, x: q.x, y: q.y }; return; }
    gesto = { tipo: 'tocco', sx: ev.clientX, sy: ev.clientY, cx: cam.x, cz: cam.z, t: Date.now(), q, timer: setTimeout(() => { if (gesto?.tipo === 'tocco' && gesto.q) { const g = gesto; gesto = { tipo: 'fatto' }; Mappa.azioneCasella(g.q.x, g.q.y, true); } }, 450) };
  });
  el.addEventListener('pointermove', ev => {
    if (!punti.has(ev.pointerId)) return; punti.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (gesto?.tipo === 'pizzico' && punti.size === 2) { const [a, b] = [...punti.values()]; cam.dist = Math.max(DMIN, Math.min(DMAX, gesto.dist0 * gesto.d0 / Math.max(20, Math.hypot(a.x - b.x, a.y - b.y)))); return; }
    if (gesto?.tipo === 'trascina') { const q = casellaDa(ev); if (q) { gesto.x = q.x; gesto.y = q.y; } return; }
    if (gesto?.tipo === 'tocco' || gesto?.tipo === 'sposta') {
      const dx = ev.clientX - gesto.sx, dy = ev.clientY - gesto.sy;
      if (Math.hypot(dx, dy) > 8) { clearTimeout(gesto.timer); gesto.tipo = 'sposta'; }
      if (gesto.tipo === 'sposta') { const k = cam.dist / el.clientHeight * 1.3; cam.x = gesto.cx - dx * k; cam.z = gesto.cz - dy * k * 1.4; if (dati) { cam.x = Math.max(0, Math.min(dati.luogo.w, cam.x)); cam.z = Math.max(0, Math.min(dati.luogo.h + 4, cam.z)); } }
    }
  });
  const fine = ev => {
    punti.delete(ev.pointerId);
    const g = gesto; if (!g || punti.size) return; gesto = null; clearTimeout(g.timer);
    if (g.tipo === 'trascina') Mappa.azioneCasella(g.x, g.y, false);
    else if (g.tipo === 'tocco' && g.q && Date.now() - g.t < 450) Mappa.azioneCasella(g.q.x, g.q.y, false);
  };
  el.addEventListener('pointerup', fine); el.addEventListener('pointercancel', ev => { punti.delete(ev.pointerId); gesto = null; });
  el.addEventListener('wheel', ev => { ev.preventDefault(); cam.dist = Math.max(DMIN, Math.min(DMAX, cam.dist * (ev.deltaY > 0 ? 1.1 : 0.9))); }, { passive: false });

  // zoom dai pulsanti: f > 1 allontana; 'tutta' inquadra tutto ciò che è già stato scoperto
  function zoom(f) {
    if (f !== 'tutta') { cam.dist = Math.max(DMIN, Math.min(DMAX, cam.dist * f)); return; }
    if (!dati) return;
    const L = dati.luogo; let x0 = L.w, y0 = L.h, x1 = -1, y1 = -1;
    for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) if (dati.extra.vedeTutto || !L.visto || L.visto[y * L.w + x] === '1') { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    if (x1 < 0) { x0 = 0; y0 = 0; x1 = L.w - 1; y1 = L.h - 1; }
    cam.x = (x0 + x1 + 1) / 2; cam.z = (y0 + y1 + 1) / 2;
    cam.dist = Math.max(DMIN, Math.min(DMAX, Math.max((x1 - x0 + 2) / (camera.aspect * 0.64), (y1 - y0 + 2) / 0.6)));
  }

  /* ---------- ciclo ---------- */
  let ultimo = performance.now(), attivo = true, lampo = 0, idFrame = 0;
  function ciclo() {
    if (!attivo) return;
    idFrame = requestAnimationFrame(ciclo);
    if (!contenitore.offsetParent || document.visibilityState !== 'visible') return;
    const adesso = performance.now(), dt = Math.min(0.1, (adesso - ultimo) / 1000); if (dt < 1 / 40) return; ultimo = adesso;
    if (!dati) return;
    aggiornaFigure(dati, dt);
    for (const l of luci) if (l.userData.fiamma) l.intensity = l.userData.base * (0.85 + Math.random() * 0.25);
    if (meteoObj) {
      const p = meteoObj.geometry.attributes.position, a = p.array, neve = meteoObj.userData.neve, passo = neve ? 3 : 6, v = neve ? dt * 1.2 : dt * 14;
      for (let i = 0; i < a.length; i += passo) { a[i + 1] -= v; if (neve) a[i] += Math.sin(adesso / 700 + i) * dt * 0.3; else a[i + 4] -= v; if (a[i + 1] < 0) { a[i + 1] += 10; if (!neve) a[i + 4] += 10; } }
      p.needsUpdate = true;
      if (meteoObj.userData.temporale) { if (lampo <= 0 && Math.random() < 0.004) { lampo = 1; opz.onLampo?.(); } if (lampo > 0) { emisfero.intensity += lampo * 2.5; lampo -= dt * 3; if (lampo <= 0) luceDelMomento(dati); } }
    }
    posizionaCamera();
    composer.render(dt);
  }
  ciclo();

  return {
    aggiorna(d) {
      if (!d) return; dati = d;
      const chiave = d.luogo.id + '|' + d.chiave + '|' + (d.luogo.visto || '') + '|' + (d.vista ? d.vista.join('') : '');
      if (chiave !== chiaveCostruita) costruisci(d);
    },
    zoom,
    centra() { const io = dati?.segnalini[opz.io()]; if (io) { cam.x = io.x + 0.5; cam.z = io.y - 1.5; } },
    chiudi() { attivo = false; cancelAnimationFrame(idFrame); renderer.dispose(); el.remove(); }
  };
}
