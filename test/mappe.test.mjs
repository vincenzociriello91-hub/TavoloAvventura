// Prova delle mappe generate dal server (senza avviarlo): oggetti dentro le stanze e non nei muri,
// ogni casella libera raggiungibile a piedi dall'ingresso, percorsi che non attraversano muri né tagliano gli angoli,
// vista bloccata dai muri. Uso: node test/mappe.test.mjs (con il repository rapporti-vincenzo accanto a questo).
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const qui = dirname(fileURLToPath(import.meta.url));
const sorgente = readFileSync(join(qui, '../../rapporti-vincenzo/src/tavolo.js'), 'utf8')
  .replace("import { DurableObject } from 'cloudflare:workers';", 'class DurableObject {}');
const file = join(mkdtempSync(join(tmpdir(), 'mappe-')), 'tavolo.mjs');
writeFileSync(file, sorgente);
const { generaLuogo, griglia, percorso, vede, celleOggetto } = await import(pathToFileURL(file));

const TIPI = ['taverna', 'dungeon', 'grotta', 'foresta', 'villaggio', 'citta', 'castello', 'porto', 'interno', 'strada'];
let prove = 0;
const errori = [];
const ok = (cond, msg) => { prove++; if (!cond) errori.push(msg); };

for (const tipo of TIPI) for (let seme = 1; seme <= 8; seme++) {
  const l = generaLuogo('Prova ' + tipo, tipo, seme * 7919);
  const nome = `${tipo}#${seme}`, { blocco } = griglia(l), W = l.w, H = l.h;
  // oggetti: mai su muri, porte o acqua (la barca sì), mai due nella stessa casella
  const prese = new Set();
  for (const o of l.oggetti || []) for (const [x, y] of celleOggetto(o)) {
    const c = l.celle[y]?.[x];
    ok(c !== undefined, `${nome}: ${o.tipo} fuori mappa (${x},${y})`);
    ok(!'#wR+'.includes(c), `${nome}: ${o.tipo} su '${c}' (${x},${y})`);
    ok(o.tipo === 'barca' ? c === '~' : c !== '~', `${nome}: ${o.tipo} su acqua sbagliata (${x},${y})`);
    ok(!prese.has(x + ',' + y), `${nome}: due oggetti in (${x},${y})`); prese.add(x + ',' + y);
  }
  // tutte le caselle libere si raggiungono a piedi dall'ingresso
  const da = l.ingresso, raggiunte = new Set([da.y * W + da.x]), coda = [da.y * W + da.x];
  for (let q = 0; q < coda.length; q++) {
    const i = coda[q], x = i % W, y = (i / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, j = ny * W + nx; if (nx >= 0 && ny >= 0 && nx < W && ny < H && !blocco[j] && !raggiunte.has(j)) { raggiunte.add(j); coda.push(j); } }
  }
  let isolate = 0; for (let i = 0; i < W * H; i++) if (!blocco[i] && !raggiunte.has(i)) isolate++;
  ok(isolate === 0, `${nome}: ${isolate} caselle libere irraggiungibili`);
  // il percorso più lungo: ogni passo su casella libera, adiacente, e senza tagliare gli angoli dei muri
  const lontana = coda[coda.length - 1], meta = { x: lontana % W, y: (lontana / W) | 0 };
  const via = percorso(l, da, meta);
  ok((via && via.length > 0) || (meta.x === da.x && meta.y === da.y), `${nome}: nessun percorso verso (${meta.x},${meta.y})`);
  let p = da;
  for (const s of via || []) {
    const dx = s.x - p.x, dy = s.y - p.y;
    ok(Math.abs(dx) <= 1 && Math.abs(dy) <= 1 && !blocco[s.y * W + s.x], `${nome}: passo non valido verso (${s.x},${s.y})`);
    if (dx && dy) ok(!blocco[p.y * W + s.x] && !blocco[s.y * W + p.x], `${nome}: angolo tagliato in (${s.x},${s.y})`);
    p = s;
  }
  // dentro un muro non si arriva
  const muro = l.celle.flatMap((r, y) => [...r].map((c, x) => c === '#' || c === 'R' ? { x, y } : null)).find(Boolean);
  if (muro) ok(percorso(l, da, muro) === null, `${nome}: percorso dentro un muro`);
}

// vista e giro intorno al muro su una stanza minima
const prova = { w: 7, h: 3, celle: ['.......', '...#...', '.......'], oggetti: [], edifici: [], tipo: 'dungeon' };
const { vista } = griglia(prova);
ok(!vede(prova, vista, 1, 1, 5, 1), 'la vista passa attraverso un muro');
ok(vede(prova, vista, 1, 0, 5, 0), 'la vista è bloccata senza muri');
ok(percorso(prova, { x: 1, y: 1 }, { x: 5, y: 1 })?.length === 4, 'il percorso non gira intorno al muro');

console.log(`${prove} controlli, ${errori.length} errori`);
if (errori.length) { console.log(errori.slice(0, 30).join('\n')); process.exit(1); }
