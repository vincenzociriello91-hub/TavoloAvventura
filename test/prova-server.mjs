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

// tappa 5: serate, spettatori con reazioni, traduzione, note sulla mappa, giochi di taverna, presenze, sfida settimanale
A.invia({ t: 'serata_nuova', quando: new Date(Date.now() + 3 * 86400000).toISOString(), nota: 'da Marco' });
const se = await D.aspetta(m => m.t === 'serate' && m.serate.length);
D.invia({ t: 'serata_risposta', id: se.serate[0].id, ci: true });
verifica(!!(await A.aspetta(m => m.t === 'serate' && m.serate[0].risposte[bD.io] === true)), 'calendario: serata proposta e risposta "ci sono"');
const S1 = client(); await S1.pronto; S1.invia({ t: 'entra', invito: ni.invito, nome: 'Amico curioso', ruolo: 'spettatore' });
const bS = await S1.aspetta(m => m.t === 'benvenuto');
verifica(bS.stato.membri[bS.io].ruolo === 'spettatore', 'amico entra come spettatore');
S1.invia({ t: 'reazione', emoji: '👏' }); S1.invia({ t: 'reazione', emoji: '😂' });
verifica((await A.aspetta(m => m.t === 'reazione')).emoji === '👏' && await A.aspetta(m => m.t === 'reazione', 1000).then(() => false, () => true), 'reazione degli spettatori arriva a tutti (e non si possono mandare a raffica)');
S1.invia({ t: 'gioco_apri', tipo: 'dadi', posta: 5 }); S1.invia({ t: 'nota_mappa', x: 3, y: 3, testo: 'spam' });
D.invia({ t: 'traduci', id: 'x1', testo: 'La taverna si fa silenziosa.', lingua: 'en' });
verifica((await D.aspetta(m => m.t === 'traduzione' && m.id === 'x1', 8000)).testo === 'The tavern falls silent.', 'traduzione automatica');
D.invia({ t: 'nota_mappa', x: 2, y: 2, testo: 'trappola qui' });
const nm = await A.aspetta(m => m.t === 'note_mappa' && m.note.length);
verifica(nm.note.length === 1 && nm.note[0].testo === 'trappola qui', 'nota sulla mappa (gli spettatori non ne mettono)');
D.invia({ t: 'nota_mappa', togli: nm.note[0].id });
verifica(!!(await A.aspetta(m => m.t === 'note_mappa' && !m.note.length)), 'nota tolta da chi l\'ha messa');
verifica(await A.aspetta(m => m.t === 'gioco_taverna', 800).then(() => false, () => true), 'gli spettatori non aprono tavoli da gioco');
A.invia({ t: 'scheda', pg: { nome: 'Vin', razza: 'Umano', classe: 'Guerriero', livello: 1, pf: 12, pfMax: 12, ca: 16, oro: 30, car: { for: 15, des: 12, cos: 14, int: 10, sag: 10, car: 10 } } });
await A.aspetta(m => m.t === 'scheda' && m.per === bA.io && m.pg.nome === 'Vin');
D.invia({ t: 'stato' }); const oroD = (await D.aspetta(m => m.t === 'stato')).stato.pg[bD.io].oro;
D.invia({ t: 'gioco_apri', tipo: 'carte', posta: 5 });
await A.aspetta(m => m.t === 'gioco_taverna' && m.gioco?.tipo === 'carte');
A.invia({ t: 'gioco_entra' }); await D.aspetta(m => m.t === 'gioco_taverna' && m.gioco?.giocatori.length === 2);
D.invia({ t: 'gioco_via' });
const gv = await A.aspetta(m => m.t === 'diario' && /Carte sul tavolo/.test(m.ev.testo), 5000);
const fine = await D.aspetta(m => m.t === 'gioco_taverna' && !m.gioco);
D.invia({ t: 'stato' }); const st5 = (await D.aspetta(m => m.t === 'stato')).stato;
verifica(!!gv && !!fine && st5.pg[bD.io].oro + st5.pg[bA.io].oro === oroD + 30, 'gioco di carte: il piatto va a chi vince, le monete tornano');
verifica(st5.membri[bD.io].presenze >= 1 && Array.isArray(st5.avventure) && st5.avventure.some(a => a.id === 'torre' && a.seguito === 'miniera'), 'presenze contate e catalogo delle avventure (con il seguito della miniera)');
A.invia({ t: 'avventura_inizia', id: 'lanterna' });
verifica(!!(await A.aspetta(m => m.t === 'luogo' && m.luogo.nome === 'Villa Ombrosa', 8000)), 'avventura di una serata: "La notte della lanterna" parte da Villa Ombrosa');
const codiceSf = codice; // sfida settimanale: campagna nuova in solitaria
const SF = new WebSocket(`${BASE}/tavolo/SFIDA${Math.random().toString(36).slice(2, 7).toUpperCase()}/ws`, { origin: ORIGIN });
const sfida = await new Promise((r, j) => { SF.on('open', () => SF.send(JSON.stringify({ t: 'crea', nome: 'Sfida', regole: '5e', masterTipo: 'ai', mioNome: 'Solo', solitaria: true, sfida: { titolo: 'Il ladro di campane', obiettivo: 'Ritrova la campana', settimana: '2026-47' } })));
  SF.on('message', d => { const m = JSON.parse(d); if (m.t === 'benvenuto') { SF.send(JSON.stringify({ t: 'scheda', pg: { nome: 'Sola', razza: 'Elfo', classe: 'Ladro', livello: 1, pf: 9, pfMax: 9, ca: 14, car: { for: 10, des: 16, cos: 12, int: 12, sag: 10, car: 12 } } })); SF.send(JSON.stringify({ t: 'chat', testo: 'cerco la campana', alMaster: true })); } if (m.t === 'sfida') r(m.sfida); });
  setTimeout(() => j(new Error('timeout sfida')), 25000); });
verifica(sfida.esito === 'vinta' && sfida.titolo === 'Il ladro di campane', 'sfida della settimana in solitaria vinta'); SF.close();

// dai Varchi: dungeon del giorno, meteo vero, battute di riserva quando il master AI non risponde
A.invia({ t: 'dungeon_giorno' });
const dg = await A.aspetta(m => m.t === 'luogo' && /livello 1$/.test(m.luogo.nome), 8000);
verifica(dg.luogo.tipo === 'dungeon', 'dungeon del giorno: discesa al livello 1');
const custode = await A.aspetta(m => m.t === 'segnalini' && Object.values(m.segnalini).some(x => x.tipo === 'nemico' && /Custode|Sentinella|Signore|Strega|Cavaliere/.test(x.nome)), 6000).catch(() => null);
verifica(!!custode, 'dungeon del giorno: il custode aspetta in fondo');
A.invia({ t: 'dungeon_giorno' });
verifica(/già scesi/.test((await A.aspetta(m => m.t === 'errore', 4000)).msg), 'una sola discesa al giorno');
A.invia({ t: 'meteo_vero', meteo: 'pioggia' });
verifica((await D.aspetta(m => m.t === 'mondo' && m.mondo.calendario?.meteoVero)).mondo.calendario.meteo === 'pioggia', 'meteo vero arrivato nella partita');
D.invia({ t: 'chat', testo: 'prova quota finita', alMaster: true });
const ris = await D.aspetta(m => m.t === 'narra' && m.riserva, 40000);
verifica(ris.testo.length > 20, 'master senza quota: battuta di riserva invece del silenzio');

// copia della campagna, compagno animale sulla mappa, notifiche
A.invia({ t: 'esporta' });
const cp = await A.aspetta(m => m.t === 'esportazione', 6000);
verifica(cp.dati.campagna && Object.keys(cp.dati).some(k => k.startsWith('luogo:')) && !cp.dati.membri, 'copia della campagna senza membri e chiavi');
D.invia({ t: 'esporta' });
verifica(await D.aspetta(m => m.t === 'esportazione', 1200).then(() => false, () => true), 'solo chi ha creato la campagna scarica la copia');
const diarioPrima = cp.dati.diario.length;
A.invia({ t: 'chat', testo: 'messaggio dopo la copia', alMaster: false }); await A.aspetta(m => m.t === 'diario' && m.ev.testo === 'messaggio dopo la copia');
A.invia({ t: 'importa', dati: cp.dati });
const rip = await A.aspetta(m => m.t === 'stato' && !m.stato.diario.some(d => d.testo === 'messaggio dopo la copia'), 8000);
verifica(rip.stato.diario.length <= diarioPrima + 1 && rip.stato.campagna.invito, 'campagna ripristinata dalla copia (invito attuale conservato)');
A.invia({ t: 'compagno_nuovo', per: bD.io, nome: 'Fulmine', specie: 'cavallo' });
const sgC = await D.aspetta(m => m.t === 'segnalini' && Object.values(m.segnalini).some(x => x.animale === 'cavallo'), 6000);
const idC = Object.keys(sgC.segnalini).find(k => sgC.segnalini[k].animale === 'cavallo');
verifica(sgC.segnalini[idC].padrone === bD.io, 'il compagno animale compare sulla mappa accanto al suo personaggio');
D.invia({ t: 'push_chiave' });
verifica(/^[A-Za-z0-9_-]{80,}$/.test((await D.aspetta(m => m.t === 'push_chiave', 6000)).pub || ''), 'chiave pubblica per le notifiche creata dal server');
D.invia({ t: 'push_iscrivi', endpoint: 'https://sito-cattivo.example/push' });
verifica(await D.aspetta(m => m.t === 'push_ok', 1200).then(() => false, () => true), 'iscrizione alle notifiche solo verso i servizi di notifica veri');

// sicurezza: link per spettatori, spettatori che non toccano la partita, freno ai messaggi a raffica
A.invia({ t: 'stato' }); const stSic = (await A.aspetta(m => m.t === 'stato')).stato;
const S2 = client(); await S2.pronto; S2.invia({ t: 'entra', invito: stSic.campagna.invitoSpettatori, nome: 'Furbo', ruolo: 'giocatore' });
const bS2 = await S2.aspetta(m => m.t === 'benvenuto');
verifica(bS2.stato.membri[bS2.io].ruolo === 'spettatore' && !bS2.stato.campagna.invito && !bS2.stato.campagna.invitoSpettatori, 'con il link per spettatori si entra solo a guardare, e l\'invito dei giocatori resta nascosto');
await new Promise(r => setTimeout(r, 500)); A.coda.length = 0;
S2.invia({ t: 'vai', nome: 'Posto del furbo' }); S2.invia({ t: 'gruppo', op: 'oro', delta: -100 }); S2.invia({ t: 'dungeon_giorno' }); S2.invia({ t: 'chat', testo: 'spam', alMaster: true });
verifica(await A.aspetta(m => (m.t === 'luogo' && m.luogo.nome === 'Posto del furbo') || m.t === 'gruppo' || (m.t === 'diario' && m.ev.testo === 'spam'), 1500).then(() => false, () => true), 'uno spettatore non sposta il gruppo, non tocca il tesoro e non chiama il master');
for (let i = 0; i < 60; i++) S2.invia({ t: 'stato' });
verifica(/Troppi messaggi/.test((await S2.aspetta(m => m.t === 'errore', 4000)).msg), 'freno ai messaggi a raffica');

D.invia({ t: 'scheda', pg: { nome: 'Lira', razza: 'Elfo', classe: 'Ranger', livello: '<img src=x onerror=alert(1)>', pf: 10, pfMax: 10, ca: 14, oro: 30, car: { for: 10, des: 16, cos: 12, int: 10, sag: 14, car: 10 }, equip: [] }, alMaster: false });
verifica(!JSON.stringify((await A.aspetta(m => m.t === 'scheda' && m.per === bD.io && typeof m.pg.livello === 'string', 5000)).pg).includes('<'), 'una scheda non può portare codice HTML agli altri giocatori');

// casi limite: chi non è collegato non blocca il voto; chi esce a metà di una partita a dadi non si porta via il piatto
const E = client(); await E.pronto; E.invia({ t: 'entra', invito: stSic.campagna.invito, nome: 'Elena' });
const bE = await E.aspetta(m => m.t === 'benvenuto');
E.invia({ t: 'scheda', pg: { nome: 'Kara', razza: 'Umano', classe: 'Ladro', livello: 1, pf: 8, pfMax: 8, ca: 13, oro: 20, car: { for: 10, des: 16, cos: 12, int: 12, sag: 10, car: 12 }, equip: [] }, alMaster: false });
await E.aspetta(m => m.t === 'scheda' && m.per === bE.io);
A.invia({ t: 'voto_apri', domanda: 'Si riposa?', opzioni: ['sì', 'no'] }); await E.aspetta(m => m.t === 'mondo_vivo' && m.voto?.domanda === 'Si riposa?');
A.coda.length = 0; A.invia({ t: 'stato' }); const collegati = (await A.aspetta(m => m.t === 'stato')).stato;
for (const [cl, id] of [[A, bA.io], [B2, bB.io], [D, bD.io]]) if (collegati.online.includes(id) && collegati.membri[id]?.ruolo === 'giocatore') cl.invia({ t: 'voto', scelta: 0 });
await new Promise(r => setTimeout(r, 700));
E.ws.close();
verifica(/Si riposa/.test((await A.aspetta(m => m.t === 'diario' && m.ev.testo.startsWith('Il gruppo ha votato'), 6000)).ev.testo), 'il voto si chiude anche se chi non ha votato si scollega');
const E2 = client(); await E2.pronto; E2.invia({ t: 'ciao', membro: bE.io, chiave: bE.chiave }); await E2.aspetta(m => m.t === 'benvenuto');
D.coda.length = 0; D.invia({ t: 'stato' }); const oroPrima = (await D.aspetta(m => m.t === 'stato')).stato.pg[bD.io].oro;
D.invia({ t: 'gioco_apri', tipo: 'dadi', posta: 2 }); await E2.aspetta(m => m.t === 'gioco_taverna' && m.gioco);
E2.invia({ t: 'gioco_entra' }); await D.aspetta(m => m.t === 'gioco_taverna' && m.gioco?.giocatori.length === 2);
E2.invia({ t: 'esci' }); await D.aspetta(m => m.t === 'gioco_taverna' && !m.gioco, 6000);
await new Promise(r => setTimeout(r, 500)); D.coda.length = 0; D.invia({ t: 'stato' });
verifica((await D.aspetta(m => m.t === 'stato')).stato.pg[bD.io].oro === oroPrima, 'chi esce a metà partita non blocca il tavolo: monete restituite');

// manuale del master: i problemi segnalati finiscono nel manuale condiviso, leggibile dal connettore
D.invia({ t: 'segnala_problema', testo: 'Prova: mappa con caselle nere' });
await new Promise(r => setTimeout(r, 800));
const man = await fetch(BASE.replace(/^ws/, 'http') + '/mcp?chiave=segreta', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'manuale_master', arguments: {} } }) }).then(r => r.json());
verifica(/Prova: mappa con caselle nere/.test(man.result?.content?.[0]?.text || ''), 'problema segnalato salvato nel manuale del master');

const Z = client('https://sito-cattivo.example');
verifica(await Z.pronto.then(() => false, e => /403/.test(e.message)), 'origine sconosciuta rifiutata');

console.log(`\n${ok} ok, ${ko} falliti`);
process.exit(ko ? 1 : 0);
