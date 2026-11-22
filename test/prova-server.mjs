// Prova del server delle stanze: due giocatori, invito, schede, dadi, luoghi, voce, riconnessione.
import WebSocket from 'ws';
const BASE = process.env.BASE || 'ws://localhost:8787';
const codice = 'PROVA' + Math.random().toString(36).slice(2, 7).toUpperCase();
const ORIGIN = 'http://localhost:8765';
let ok = 0, ko = 0;
const verifica = (cond, nome) => { if (cond) { ok++; console.log('OK  ', nome); } else { ko++; console.log('FAIL', nome); } };

function client(origin = ORIGIN) {
  const ws = new WebSocket(`${BASE}/tavolo/${codice}/ws`, { origin });
  const coda = [];
  const attese = [];
  ws.on('message', d => { const m = JSON.parse(d); const i = attese.findIndex(a => a.f(m)); if (i >= 0) { attese[i].r(m); attese.splice(i, 1); } else coda.push(m); });
  const aspetta = (f, ms = 4000) => new Promise((r, j) => { const i = coda.findIndex(f); if (i >= 0) return r(coda.splice(i, 1)[0]); const a = { f, r }; attese.push(a); setTimeout(() => { const k = attese.indexOf(a); if (k >= 0) { attese.splice(k, 1); j(new Error('timeout ' + f.toString().slice(0, 90))); } }, ms); });
  const pronto = new Promise((r, j) => { ws.on('open', r); ws.on('error', j); ws.on('unexpected-response', (q, res) => j(new Error('http ' + res.statusCode))); });
  return { ws, aspetta, pronto, invia: o => ws.send(JSON.stringify(o)), coda };
}

const A = client(); await A.pronto;
A.invia({ t: 'crea', nome: 'Prova', regole: '5e', ambientazione: 'Fantasy classico', masterTipo: 'ai', mioNome: 'Vincenzo' });
const bA = await A.aspetta(m => m.t === 'benvenuto');
verifica(bA.io && bA.chiave && bA.stato.campagna.invito, 'creazione campagna con chiave e invito');
verifica(bA.stato.membri[bA.io].admin === true, 'il creatore è amministratore');

const X = client(); await X.pronto;
X.invia({ t: 'entra', invito: 'SBAGLIATO', nome: 'Intruso' });
const eX = await X.aspetta(m => m.t === 'errore');
verifica(eX.codice === 'invito', 'invito sbagliato rifiutato');

const B = client(); await B.pronto;
B.invia({ t: 'entra', invito: bA.stato.campagna.invito, nome: 'Marco' });
const bB = await B.aspetta(m => m.t === 'benvenuto');
verifica(bB.io && bB.stato.membri[bB.io].ruolo === 'giocatore', 'secondo giocatore entra con invito');
const pres = await A.aspetta(m => m.t === 'presenza' && m.entrato === bB.io);
verifica(pres.online.length === 2, 'presenza aggiornata (2 online)');

B.invia({ t: 'scheda', pg: { nome: 'Brann', razza: 'Nano', classe: 'Guerriero', livello: 1, pf: 12, pfMax: 12, ca: 16, car: { for: 16, des: 12, cos: 15, int: 10, sag: 10, car: 8 } }, nota: 'scheda creata' });
const sA = await A.aspetta(m => m.t === 'scheda' && m.per === bB.io);
verifica(sA.pg.nome === 'Brann', 'scheda condivisa con gli altri');
B.invia({ t: 'scheda', per: bA.io, pg: { nome: 'hack' } });
await new Promise(r => setTimeout(r, 300));
A.invia({ t: 'stato' }); const st = await A.aspetta(m => m.t === 'stato');
verifica(!st.stato.pg[bA.io], 'un giocatore non può modificare la scheda di un altro');

B.invia({ t: 'dado', formula: '1d20+5', motivo: 'Attacco', alMaster: false });
const dA = await A.aspetta(m => m.t === 'dado');
verifica(dA.tiro.totale >= 6 && dA.tiro.totale <= 25 && dA.tiro.nome === 'Marco', 'tiro di dado dal server visibile a tutti');
B.invia({ t: 'dado', formula: 'd20', modo: 'vantaggio', alMaster: false });
const dv = await B.aspetta(m => m.t === 'dado' && m.tiro.modo === 'vantaggio');
verifica(dv.tiro.scartati.length === 1 && dv.tiro.dadi[0] >= dv.tiro.scartati[0], 'vantaggio tiene il più alto');
B.invia({ t: 'dado', formula: 'd20', segreto: true, alMaster: false });
const dsB = await B.aspetta(m => m.t === 'dado' && m.tiro.segreto === false && m.tiro.formula === 'd20' && !m.tiro.modo);
verifica(dsB, 'un giocatore non può fare tiri segreti (diventa pubblico)');
A.invia({ t: 'dado', formula: '2d6', segreto: true });
const dsA = await A.aspetta(m => m.t === 'dado' && m.tiro.segreto);
verifica(dsA && dsA.tiro.dadi.length === 2, 'tiro segreto del capo');
await new Promise(r => setTimeout(r, 300));
verifica(!B.coda.some(m => m.t === 'dado' && m.tiro.segreto), 'il tiro segreto non arriva ai giocatori');

A.invia({ t: 'vai', nome: 'Città di Argentea' });
const lA = await A.aspetta(m => m.t === 'luogo');
verifica(lA.luogo.tipo === 'citta' && lA.luogo.celle.length === 20 && lA.luogo.edifici.length >= 6, `mappa città generata (${lA.luogo.edifici.length} edifici)`);
verifica(lA.segnalini[bB.io], 'segnalino del giocatore piazzato');
console.log(lA.luogo.celle.join('\n'));
const locanda = lA.luogo.edifici.find(e => e.nome === 'Locanda');
A.invia({ t: 'modifica_luogo', edificio: locanda.id, stato: 'bruciato' });
B.invia({ t: 'modifica_luogo', edificio: locanda.id, stato: 'bruciato' });
verifica(await B.aspetta(m => m.t === 'luogo_mod', 1500).then(() => false, () => true), 'con il master AI nessun giocatore (nemmeno il creatore) cambia a mano lo stato degli edifici');
A.invia({ t: 'vai', nome: 'Taverna del Drago Ubriaco' });
B.coda.length = 0; const t1 = await B.aspetta(m => m.t === 'luogo' && m.luogo.nome.startsWith('Taverna'));
verifica(t1.luogo.tipo === 'taverna', 'taverna generata');
verifica(t1.luogo.oggetti?.filter(o => o.tipo === 'tavolo').length >= 3 && t1.luogo.oggetti.some(o => o.tipo === 'botte') && !t1.luogo.celle.join('').includes('t'), `oggetti di scena nella taverna (${t1.luogo.oggetti?.length})`);
A.invia({ t: 'scena', azione: 'sposta', oggetto: t1.luogo.oggetti.find(o => o.movibile).id, x: 5, y: 5 });
verifica(await A.aspetta(m => m.t === 'luogo_mod', 1500).then(() => false, () => true), 'con il master AI i giocatori non spostano a mano gli oggetti di scena');
console.log(t1.luogo.celle.join('\n'));
A.invia({ t: 'vai', nome: 'città di argentea' });
const lA2 = await B.aspetta(m => m.t === 'luogo' && m.luogo.nome === 'Città di Argentea');
verifica(JSON.stringify(lA2.luogo.celle) === JSON.stringify(lA.luogo.celle), 'tornando nella città la mappa è identica');
verifica(lA2.luogo.edifici.find(e => e.id === locanda.id).stato === 'integro', 'tornati in città la locanda è rimasta integra');
for (const n of ['Cripta del Re Lich', 'Foresta di Mirkwood', 'Grotta dei Cristalli', 'Castello Nero', 'Porto di Salmastro', 'Villaggio di Brina', 'Passo del Lupo']) {
  A.coda.length = 0; A.invia({ t: 'vai', nome: n }); const l = await A.aspetta(m => m.t === 'luogo' && m.luogo.nome === n);
  verifica(l.luogo.celle.every(r => r.length === 32), `${n}: ${l.luogo.tipo}, ${l.luogo.edifici.length} elementi`);
  if (n.startsWith('Cripta') || n.startsWith('Foresta')) console.log(l.luogo.celle.join('\n'));
}
B.invia({ t: 'segnalino', x: 5, y: 6 });
const sg = await A.aspetta(m => m.t === 'segnalini');
verifica(sg.segnalini[bB.io].x === 5, 'segnalino spostato');

B.invia({ t: 'rtc', a: bA.io, dati: { tipo: 'offerta', sdp: 'x' } });
const r = await A.aspetta(m => m.t === 'rtc');
verifica(r.da === bB.io && r.dati.tipo === 'offerta', 'segnale voce inoltrato solo al destinatario');

B.ws.close();
await A.aspetta(m => m.t === 'presenza' && m.uscito === bB.io);
const B2 = client(); await B2.pronto;
B2.invia({ t: 'ciao', membro: bB.io, chiave: bB.chiave });
const bB2 = await B2.aspetta(m => m.t === 'benvenuto');
verifica(bB2.stato.pg[bB.io]?.nome === 'Brann', 'riconnessione con chiave: la scheda è ancora lì');
const B3 = client(); await B3.pronto;
B3.invia({ t: 'ciao', membro: bB.io, chiave: 'falsa' });
verifica((await B3.aspetta(m => m.t === 'errore')).codice === 'accesso', 'chiave falsa rifiutata');

A.invia({ t: 'nuovo_invito' });
const ni = await A.aspetta(m => m.t === 'invito');
verifica(ni.invito && ni.invito !== bA.stato.campagna.invito, 'nuovo invito generato');
const C = client(); await C.pronto;
C.invia({ t: 'entra', invito: bA.stato.campagna.invito, nome: 'Vecchio QR' });
verifica((await C.aspetta(m => m.t === 'errore')).codice === 'invito', 'il vecchio QR non funziona più');

B2.invia({ t: 'suggerimento', testo: 'Aggiungere i famigli' });
verifica((await B2.aspetta(m => m.t === 'ok')).cosa === 'suggerimento', 'suggerimento salvato');
B2.invia({ t: 'parlato', testo: 'apro la porta della cripta' });
const dp = await A.aspetta(m => m.t === 'diario' && m.ev.tipo === 'parlato');
verifica(dp.ev.testo.includes('apro la porta'), 'parlato registrato nel diario');

// memoriale: un personaggio caduto va nel memoriale e la sua scheda si libera per un erede
B2.invia({ t: 'caduto', motivo: 'travolto da una frana' });
const mem = await A.aspetta(m => m.t === 'memoriale', 6000);
verifica(mem.memoriale.some(c => c.chi === bB.io && c.motivo.includes('frana')) && mem.caduto === bB.io, 'personaggio caduto nel memoriale');
// galleria dei PNG e memoriale arrivano nello stato a chi entra
A.invia({ t: 'stato' });
const st2 = await A.aspetta(m => m.t === 'stato');
verifica(Array.isArray(st2.stato.memoriale) && st2.stato.png && typeof st2.stato.png === 'object', 'stato con memoriale e galleria dei PNG');

// mondo vivo: obiettivi segreti, bacheca, voto, enigma, sogni, casa del gruppo, mestieri, prezzi secondo la reputazione
const D = client(); await D.pronto;
D.invia({ t: 'entra', invito: ni.invito, nome: 'Sara' });
const bD = await D.aspetta(m => m.t === 'benvenuto');
D.invia({ t: 'scheda', pg: { nome: 'Lira', razza: 'Elfo', classe: 'Ranger', livello: 1, pf: 10, pfMax: 10, ca: 14, oro: 60, car: { for: 10, des: 16, cos: 12, int: 10, sag: 14, car: 10 }, equip: [{ nome: 'Erbe medicinali', qta: 2 }, { nome: 'Fiala', qta: 1 }], segreto: { testo: 'barato' } } });
const sD = await D.aspetta(m => m.t === 'scheda' && m.per === bD.io);
const sDb = await B2.aspetta(m => m.t === 'scheda' && m.per === bD.io);
const sDa = await A.aspetta(m => m.t === 'scheda' && m.per === bD.io);
verifica(sD.pg.segreto?.testo && sD.pg.segreto.testo !== 'barato', 'obiettivo segreto assegnato dal server (non scelto dal giocatore)');
verifica(!sDb.pg.segreto && sDa.pg.segreto?.testo === sD.pg.segreto.testo, 'il segreto lo vedono solo il giocatore e il master');
A.invia({ t: 'missione_nuova', titolo: 'Il pozzo stregato', descrizione: 'Scoprite cosa urla nel pozzo', ricompensa: '30 mo' });
const mv1 = await D.aspetta(m => m.t === 'mondo_vivo' && m.missioni.some(q => q.titolo === 'Il pozzo stregato'));
D.invia({ t: 'missione_accetta', id: mv1.missioni.find(q => q.titolo === 'Il pozzo stregato').id });
verifica(!!(await D.aspetta(m => m.t === 'mondo_vivo' && m.missioni.some(q => q.titolo === 'Il pozzo stregato' && q.stato === 'accettata'))), 'missione dalla bacheca accettata');
A.invia({ t: 'voto_apri', domanda: 'Ponte o guado?', opzioni: ['ponte', 'guado'] });
await D.aspetta(m => m.t === 'mondo_vivo' && m.voto?.domanda === 'Ponte o guado?');
D.invia({ t: 'voto', scelta: 1 }); B2.invia({ t: 'voto', scelta: 1 }); A.invia({ t: 'voto', scelta: 0 });
const vt = await A.aspetta(m => m.t === 'diario' && m.ev.testo.startsWith('Il gruppo ha votato'), 6000);
verifica(vt.ev.testo.includes('guado'), 'voto del gruppo chiuso quando tutti hanno votato');
D.invia({ t: 'chat', testo: 'mondo vivo di prova', alMaster: true });
const sogno = await D.aspetta(m => m.t === 'sogno', 20000);
verifica(sogno.testo.includes('torre'), 'sogno privato arrivato solo al suo giocatore');
const mvE = await D.aspetta(m => m.t === 'mondo_vivo' && m.enigma && m.nemesi && m.minacce.length && m.scelte.length, 8000);
verifica(!mvE.enigma.risposta && mvE.catalogo.ricette.length, 'enigma visibile senza la soluzione ai giocatori');
await new Promise(r => setTimeout(r, 800));
D.invia({ t: 'enigma_risposta', risposta: 'il vento' });
verifica(!!(await A.aspetta(m => m.t === 'diario' && m.ev.testo.includes('non è la risposta'), 5000)), 'risposta sbagliata all\'enigma');
D.invia({ t: 'enigma_risposta', risposta: 'una buca!' });
verifica(!!(await A.aspetta(m => m.t === 'diario' && m.ev.testo.includes("risolve l'enigma"), 5000)), 'enigma risolto');
D.invia({ t: 'stato' }); const stD = await D.aspetta(m => m.t === 'stato');
verifica(stD.stato.pg[bD.io].compagni?.[0]?.nome === 'Zanna' && stD.stato.nemesi?.nome === 'Vaskar il Grigio', 'compagno animale e nemesi nello stato');
verifica(!Object.entries(stD.stato.pg).some(([id, p]) => id !== bD.io && p.segreto), 'nello stato i segreti degli altri sono nascosti');
D.invia({ t: 'base', cosa: '' });
verifica(/Servono 500 mo/.test((await D.aspetta(m => m.t === 'errore', 4000)).msg), 'casa del gruppo: servono monete nel tesoro comune');
A.invia({ t: 'gruppo', op: 'oro', delta: 800 }); await A.aspetta(m => m.t === 'gruppo');
D.invia({ t: 'base', cosa: '' }); await D.aspetta(m => m.t === 'mondo_vivo' && m.base);
D.invia({ t: 'base', cosa: 'laboratorio' });
verifica(!!(await D.aspetta(m => m.t === 'mondo_vivo' && m.base?.stanze.includes('laboratorio'))), 'casa del gruppo comprata e arredata col tesoro comune');
D.invia({ t: 'mestiere', mestiere: 'alchimista' }); await D.aspetta(m => m.t === 'scheda' && m.per === bD.io && m.pg.mestiere === 'alchimista');
D.invia({ t: 'crea_oggetto', ricetta: 'Pozione di guarigione' });
const cr = await A.aspetta(m => m.t === 'diario' && m.ev.testo.includes('prova a creare'), 4000);
verifica(/CD 12/.test(cr.ev.testo), 'mestieri: creazione di un oggetto con la prova d20');
const sCr = await D.aspetta(m => m.t === 'scheda' && m.per === bD.io && !m.pg.equip.some(e => e.nome === 'Fiala'));
A.invia({ t: 'apri_negozio', nome: 'Emporio di prova', tipo: 'emporio' });
const ng = await D.aspetta(m => m.t === 'negozio' && m.negozio);
const merce = ng.negozio.merci.find(x => x.prezzo >= 4 && x.prezzo <= sCr.pg.oro);
D.invia({ t: 'compra', merce: merce.nome });
const dopo = await D.aspetta(m => m.t === 'scheda' && m.per === bD.io && m.pg.oro < sCr.pg.oro);
verifica(sCr.pg.oro - dopo.pg.oro === Math.max(1, Math.round(merce.prezzo * 0.75)), 'prezzi più bassi dove il gruppo è stimato');

const Z = client('https://sito-cattivo.example');
verifica(await Z.pronto.then(() => false, e => /403/.test(e.message)), 'origine sconosciuta rifiutata');

console.log(`\n${ok} ok, ${ko} falliti`);
process.exit(ko ? 1 : 0);
