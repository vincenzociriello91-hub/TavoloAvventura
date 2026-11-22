// Prova dei promemoria sul telefono: la firma VAPID (ES256) degli avvisi Web Push deve essere valida. Uso: node test/push.test.mjs
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const qui = dirname(fileURLToPath(import.meta.url));
const file = join(mkdtempSync(join(tmpdir(), 'push-')), 'tavolo.mjs');
writeFileSync(file, readFileSync(join(qui, '../../rapporti-vincenzo/src/tavolo.js'), 'utf8').replace("import { DurableObject } from 'cloudflare:workers';", 'class DurableObject {}'));
const { Tavolo, b64url } = await import(pathToFileURL(file));
const c = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const k = { jwk: await crypto.subtle.exportKey('jwk', c.privateKey), pub: b64url(new Uint8Array(await crypto.subtle.exportKey('raw', c.publicKey))) };
let visto = null; globalThis.fetch = async (url, o) => { visto = { url, o }; return { ok: true, status: 201 }; };
const esito = await Tavolo.prototype.webPush.call({ manuale: async () => k }, 'https://fcm.googleapis.com/fcm/send/abc');
const [, jwt, chiave] = visto.o.headers.Authorization.match(/^vapid t=([^,]+), k=(.+)$/);
const [h, p, f] = jwt.split('.'), dati = JSON.parse(Buffer.from(p, 'base64url'));
const ok = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, c.publicKey, Buffer.from(f, 'base64url'), new TextEncoder().encode(`${h}.${p}`));
const prove = [[esito === true, 'avviso inviato'], [ok, 'firma ES256 valida'], [chiave === k.pub, 'chiave pubblica nell\'intestazione'], [dati.aud === 'https://fcm.googleapis.com' && dati.exp > Date.now() / 1000, 'destinatario e scadenza giusti'], [visto.o.headers['Content-Length'] === '0', 'nessun contenuto (niente dati personali)']];
for (const [c2, n] of prove) console.log(c2 ? 'OK  ' : 'FAIL', n);
const ko = prove.filter(x => !x[0]).length; console.log(`\n${prove.length - ko} ok, ${ko} falliti`); process.exit(ko ? 1 : 0);
