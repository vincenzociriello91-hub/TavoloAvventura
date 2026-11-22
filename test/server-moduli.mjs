// Carica i moduli del server delle stanze (rapporti-vincenzo/src/tavolo*.js) fuori da Cloudflare, per le prove.
import { readFileSync, writeFileSync, mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const src = join(dirname(fileURLToPath(import.meta.url)), '../../rapporti-vincenzo/src'), tmp = mkdtempSync(join(tmpdir(), 'tavolo-'));
for (const f of readdirSync(src).filter(f => /^tavolo.*\.js$/.test(f))) writeFileSync(join(tmp, f), readFileSync(join(src, f), 'utf8').replace("import { DurableObject } from 'cloudflare:workers';", 'class DurableObject {}'));
export default await import(pathToFileURL(join(tmp, 'tavolo.js')));
