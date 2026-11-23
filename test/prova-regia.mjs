// Prova della regia (4.1): appunti del mondo, master onesto, fatti decisi prima, difficoltà, turni a giro, sussurri, aiuto, mazzo, cronaca, riassunti.
import WebSocket from 'ws';
const codice = 'REGIA' + Math.random().toString(36).slice(2, 6).toUpperCase();
let ok = 0, ko = 0; const v = (c, n) => { c ? ok++ : ko++; console.log(c ? 'OK  ' : 'FAIL', n); };
function client() {
  const ws = new WebSocket(`ws://localhost:8787/tavolo/${codice}/ws`, { origin: 'http://localhost:8765' });
  const coda = [], attese = [];
  ws.on('message', d => { const m = JSON.parse(d); const i = attese.findIndex(a => a.f(m)); if (i >= 0) { attese[i].r(m); attese.splice(i, 1); } else coda.push(m); });
  const aspetta = (f, ms = 8000) => new Promise((r, j) => { const i = coda.findIndex(f); if (i >= 0) return r(coda.splice(i, 1)[0]); const a = { f, r }; attese.push(a); setTimeout(() => { const k = attese.indexOf(a); if (k >= 0) { attese.splice(k, 1); j(new Error('timeout ' + f.toString().slice(0, 80))); } }, ms); });
  return { ws, aspetta, pronto: new Promise(r => ws.on('open', r)), invia: o => ws.send(JSON.stringify(o)), coda };
}
const pausa = ms => new Promise(r => setTimeout(r, ms));
const stato = async cl => { cl.coda.length = 0; cl.invia({ t: 'stato' }); return (await cl.aspetta(m => m.t === 'stato')).stato; };
const pg = nome => ({ nome, classe: 'Guerriero', razza: 'Umano', livello: 1, pf: 30, pfMax: 30, ca: 15, car: { for: 14, des: 12, cos: 14, int: 10, sag: 10, car: 10 }, equip: [] });

const A = client(); await A.pronto;
A.invia({ t: 'crea', nome: 'Regia', regole: '5e', masterTipo: 'ai', mioNome: 'Vincenzo' });
const bA = await A.aspetta(m => m.t === 'benvenuto');
A.invia({ t: 'scheda', pg: pg('Brann') }); await A.aspetta(m => m.t === 'scheda');
const B = client(); await B.pronto; B.invia({ t: 'entra', invito: bA.stato.campagna.invito, nome: 'Marco' });
const bB = await B.aspetta(m => m.t === 'benvenuto');
B.invia({ t: 'scheda', pg: pg('Lira') }); await B.aspetta(m => m.t === 'scheda' && m.per === bB.io);
const C = client(); await C.pronto; C.invia({ t: 'entra', invito: bA.stato.campagna.invito, nome: 'Sara', ruolo: 'spettatore' });
await C.aspetta(m => m.t === 'benvenuto');

// appunti del mondo: li scrive e li legge solo chi guida la campagna
A.invia({ t: 'appunti', testo: 'Il re di Argentea è un mutaforma. La cripta sotto il tempio nasconde la sua vera corona.' });
v(/mutaforma/.test((await A.aspetta(m => m.t === 'appunti')).testo), 'appunti del mondo salvati da chi ha creato la campagna');
B.invia({ t: 'appunti', testo: 'io non posso' }); await pausa(300);
v(/mutaforma/.test((await stato(A)).appunti) && (await stato(B)).appunti === undefined, 'un giocatore non può cambiare né leggere gli appunti del mondo');

// difficoltà e stile delle illustrazioni
A.coda.length = 0; A.invia({ t: 'impostazioni', difficolta: 'dura', stileImg: 'acquerello' });
const cmp = (await A.aspetta(m => m.t === 'stato' && m.stato.campagna.difficolta === 'dura')).stato.campagna;
v(cmp.stileImg === 'acquerello', 'difficoltà e stile delle illustrazioni salvati nella campagna');

// master onesto: riceve appunti, regole dell'arbitro e la modalità dura
A.coda.length = 0; A.invia({ t: 'parlato', testo: 'prova del master onesto', alMaster: true });
const n1 = await A.aspetta(m => m.t === 'narra', 12000);
v(/\[fatti:0\|appunti:si\|dura:true\|onesto:true\|giro:no\]/.test(n1.testo), `il master riceve appunti, regole dell'arbitro onesto e modalità dura (${n1.testo.match(/\[.*\]/)?.[0]})`);

// fatti decisi prima: il master li fissa e li ritrova al turno dopo; i giocatori non li vedono
A.coda.length = 0; A.invia({ t: 'parlato', testo: 'prova dei fatti', alMaster: true }); await A.aspetta(m => m.t === 'narra', 12000);
await pausa(300); A.coda.length = 0; A.invia({ t: 'parlato', testo: 'e adesso?', alMaster: true });
const n2 = await A.aspetta(m => m.t === 'narra', 12000);
v(/\[fatti:1\|/.test(n2.testo), 'un fatto deciso dal master resta fissato per i turni successivi');
v((await stato(A)).fatti?.length === 1 && (await stato(B)).fatti === undefined && (await stato(C)).fatti === undefined, 'i fatti nascosti li vede solo chi guida, non i giocatori né gli spettatori');

// turni a giro: il master aspetta che tutti i giocatori collegati abbiano parlato
A.coda.length = 0; A.invia({ t: 'impostazioni', giro: true }); await A.aspetta(m => m.t === 'stato' && m.stato.campagna.giro === true);
await pausa(1500); A.coda.length = 0; B.coda.length = 0;
A.invia({ t: 'parlato', testo: 'apro la porta', alMaster: true });
const g1 = await A.aspetta(m => m.t === 'giro');
const subito = await A.aspetta(m => m.t === 'narra', 2500).catch(() => null);
v(g1.giro.mancano.length === 1 && g1.giro.mancano[0] === 'Marco' && !subito, 'turni a giro: dopo il primo giocatore il master aspetta gli altri (manca Marco)');
B.invia({ t: 'parlato', testo: 'io controllo il corridoio', alMaster: true });
const n3 = await A.aspetta(m => m.t === 'narra', 12000).catch(() => null);
v(n3 && /giro:si\]/.test(n3.testo), 'quando tutti hanno parlato il master risolve il giro');
const g2 = await A.aspetta(m => m.t === 'giro' && m.giro.detti.length === 0, 6000).catch(() => null);
v(!!g2, 'dopo la risposta del master il giro ricomincia');
A.coda.length = 0; A.invia({ t: 'parlato', testo: 'vado avanti da solo', alMaster: true }); await A.aspetta(m => m.t === 'giro'); A.invia({ t: 'master_ora' });
v(!!(await A.aspetta(m => m.t === 'narra', 12000).catch(() => null)), '«Risolvi adesso» fa rispondere il master senza aspettare');
A.invia({ t: 'impostazioni', giro: false }); await A.aspetta(m => m.t === 'stato' && m.stato.campagna.giro === false);

// sussurri: messaggi privati che vedono solo i due
B.coda.length = 0; C.coda.length = 0; A.invia({ t: 'sussurro', a: bB.io, testo: 'Non fidarti dell\'oste' });
const su = await B.aspetta(m => m.t === 'sussurro');
await pausa(300);
v(su.testo === 'Non fidarti dell\'oste' && su.nome === 'Vincenzo' && !C.coda.some(m => m.t === 'sussurro') && !(await stato(C)).diario.some(d => /Non fidarti/.test(d.testo)), 'sussurro: arriva solo al destinatario e non finisce nel diario');
C.invia({ t: 'sussurro', a: bB.io, testo: 'spettatore' }); await pausa(300);
v(!B.coda.some(m => m.t === 'sussurro' && m.testo === 'spettatore'), 'gli spettatori non possono sussurrare ai giocatori');

// aiuto: il compagno aiutato tira con vantaggio
A.coda.length = 0; B.invia({ t: 'aiuto', per: bA.io });
const ai = await A.aspetta(m => m.t === 'aiuto');
v(ai.nome === 'Lira' && /Lira aiuta Brann/.test((await A.aspetta(m => m.t === 'diario' && /aiuta/.test(m.ev.testo))).ev.testo), 'azione Aiuto: avvisa il compagno e lo scrive nel diario');

// mazzo di carte del tavolo
A.coda.length = 0; B.invia({ t: 'carta' });
const ca = await A.aspetta(m => m.t === 'carta');
v(/ di (Cuori|Quadri|Fiori|Picche)|Jolly/.test(ca.carta) && ca.restano === 53 && ca.nome === 'Lira', `pesca dal mazzo: ${ca.carta}, ne restano ${ca.restano}`);
B.invia({ t: 'carta', mischia: true }); B.invia({ t: 'carta' }); const ca2 = await A.aspetta(m => m.t === 'carta');
v(ca2.restano === 52 && ca2.carta !== ca.carta, 'un giocatore non può rimescolare; la stessa carta non esce due volte');
A.invia({ t: 'carta', mischia: true }); await A.aspetta(m => m.t === 'diario' && /rimescolato/.test(m.ev.testo)); A.invia({ t: 'carta' });
v((await A.aspetta(m => m.t === 'carta')).restano === 53, 'il master rimescola il mazzo');

// cronaca: la memoria che vedono tutti; chi guida può aggiungere un fatto da ricordare
B.coda.length = 0; A.invia({ t: 'ricorda', testo: 'Il fabbro Ulrico ci deve un favore' });
const cr = await B.aspetta(m => m.t === 'cronaca');
v(/fabbro Ulrico/.test(cr.cronaca) && /fabbro Ulrico/.test((await stato(C)).cronaca) && /Da ricordare/.test((await stato(A)).memoria), 'un fatto da ricordare entra nella cronaca di tutti e nella memoria del master');
B.invia({ t: 'ricorda', testo: 'barare' }); await pausa(300);
v(!/barare/.test((await stato(A)).cronaca), 'solo chi guida aggiunge fatti alla memoria');

// riassunti in tre formati
A.coda.length = 0; A.invia({ t: 'riassunto', formato: 'cantastorie' });
v((await A.aspetta(m => m.t === 'narra' && m.riassunto, 10000)).testo === 'Riassunto in rima finto.', 'riassunto in stile cantastorie');
A.invia({ t: 'riassunto', formato: 'completo' });
v((await A.aspetta(m => m.t === 'narra' && m.riassunto, 10000)).testo === 'Riassunto completo finto.', 'riassunto completo');

// alzo la mano
A.coda.length = 0; B.invia({ t: 'reazione', emoji: '✋' });
v((await A.aspetta(m => m.t === 'reazione')).emoji === '✋', 'un giocatore alza la mano e lo vedono tutti');

for (const c of [A, B, C]) c.ws.close();
console.log(`\n${ok} ok, ${ko} falliti`); process.exit(ko ? 1 : 0);
