// Prova della regia (4.1): appunti del mondo, master onesto, fatti decisi prima, difficoltà, turni a giro, sussurri, aiuto, mazzo, cronaca, riassunti.
// E del gioco a distanza, dei mondi condivisi e dell'avventura dei primi passi (4.2).
import WebSocket from 'ws';
const codice = 'REGIA' + Math.random().toString(36).slice(2, 6).toUpperCase();
let ok = 0, ko = 0; const v = (c, n) => { c ? ok++ : ko++; console.log(c ? 'OK  ' : 'FAIL', n); };
function client(cod = codice) {
  const ws = new WebSocket(`ws://localhost:8787/tavolo/${cod}/ws`, { origin: 'http://localhost:8765' });
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
await A.aspetta(m => m.t === 'giro' && !m.giro.detti.length, 6000).catch(() => null); await pausa(300); A.coda.length = 0;
A.invia({ t: 'parlato', testo: 'ancora una cosa', alMaster: true }); await A.aspetta(m => m.t === 'giro' && m.giro.detti.length === 1);
A.invia({ t: 'impostazioni', giro: false });
v(!!(await A.aspetta(m => m.t === 'narra', 12000).catch(() => null)), 'spento il giro con una mossa in attesa, il master risponde subito: nessuna mossa resta senza risposta');
await A.aspetta(m => m.t === 'stato' && m.stato.campagna.giro === false); await pausa(600);

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
for (let i = 0; i < 14; i++) A.invia({ t: 'ricorda', testo: `Fatto di riempimento numero ${i} `.repeat(9) });
A.invia({ t: 'ricorda', testo: 'La spada spezzata è nascosta nel pozzo' }); await pausa(800);
const piena = await stato(A);
v(/spada spezzata/.test(piena.cronaca) && /spada spezzata/.test(piena.memoria) && piena.cronaca.length <= 3000, 'memoria piena: il fatto appena aggiunto resta, si perde il più vecchio');
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

// ---------- 4.3: messaggio segreto al master AI, riposo deciso dal master, slot e munizioni nel contesto ----------
A.coda.length = 0; B.coda.length = 0; C.coda.length = 0;
B.invia({ t: 'al_master', testo: 'Di nascosto infilo la chiave d\'argento nella mia tasca' });
const eco = await B.aspetta(m => m.t === 'sussurro' && m.a === 'master');
const risp = await B.aspetta(m => m.t === 'sussurro' && m.da === 'master', 12000).catch(() => null);
await A.aspetta(m => m.t === 'narra', 12000).catch(() => null); await pausa(300);
v(/chiave d'argento/.test(eco.testo) && risp && /Segreto ricevuto: 1/.test(risp.testo), 'messaggio segreto al master: il master lo riceve e risponde solo a chi l\'ha scritto');
v(!A.coda.some(m => m.t === 'sussurro') && !C.coda.some(m => m.t === 'sussurro') && !(await stato(A)).diario.some(d => /chiave d'argento/.test(d.testo)), 'gli altri non vedono il segreto, neanche nel diario');
C.invia({ t: 'al_master', testo: 'spettatore' }); await pausa(300);
v(!C.coda.some(m => m.t === 'sussurro'), 'gli spettatori non mandano segreti al master');
A.coda.length = 0; A.invia({ t: 'parlato', testo: 'ora parlo io', alMaster: true }); await A.aspetta(m => m.t === 'narra', 12000).catch(() => null); await pausa(300);
v(!B.coda.some(m => m.t === 'sussurro' && m.da === 'master' && m.quando > risp.quando), 'il segreto il master lo legge una volta sola');
const pB = (await stato(B)).pg[bB.io]; B.invia({ t: 'scheda', pg: { ...pB, pf: 5, slotUsati: [0, 2], slotLiberi: [0, 0] } }); await B.aspetta(m => m.t === 'scheda' && m.per === bB.io);
A.coda.length = 0; A.invia({ t: 'parlato', testo: 'ci accampiamo per la notte', alMaster: true });
const dopo = await A.aspetta(m => m.t === 'scheda' && m.per === bB.io && m.da === 'master', 12000).catch(() => null);
v(dopo && dopo.pg.pf === dopo.pg.pfMax && dopo.pg.slotLiberi[1] === 2 && !dopo.pg.slotUsati.length && /riposo lungo/.test(dopo.nota), 'riposo lungo deciso dal master: tornano punti ferita e slot degli incantesimi');
await A.aspetta(m => m.t === 'narra', 12000).catch(() => null); await pausa(500);

// ---------- 4.3: calendario, missioni a tempo, musica, carte da collezione, ritratto, copia della campagna ----------
const dice = async frase => { A.coda.length = 0; A.invia({ t: 'parlato', testo: frase, alMaster: true }); await A.aspetta(m => m.t === 'narra', 12000).catch(() => null); await pausa(400); };
await dice('missione a tempo');
let st43 = await stato(A); const q43 = st43.missioni.find(x => x.titolo === 'Il ponte crollato'), g0 = st43.mondo.calendario?.giorno || 1;
v(q43 && q43.scadenza === g0 + 3, `missione con scadenza: entro il giorno ${q43?.scadenza}`);
await dice('passano cinque giorni');
st43 = await stato(A);
v(st43.missioni.find(x => x.titolo === 'Il ponte crollato')?.stato === 'scaduta' && st43.diario.some(d => /Missione scaduta: Il ponte crollato/.test(d.testo)), 'passato il termine, la missione scade e il diario lo dice');
const prima43 = st43.mondo.calendario.stagione; await dice('passa un mese intero'); st43 = await stato(A);
v(st43.mondo.calendario.stagione !== prima43 && st43.mondo.calendario.inizioStagione > 1, `dopo 30 giorni la stagione cambia da sola (${prima43} → ${st43.mondo.calendario.stagione})`);
B.coda.length = 0; await dice('musica di festa');
v(B.coda.some(m => m.t === 'musica' && m.umore === 'festa'), 'il master cambia la musica secondo il momento (festa)');
A.coda.length = 0; A.invia({ t: 'piazza_nemici', mostri: [{ nome: 'Coboldo', numero: 2, pf: 5 }] });
const b1 = await A.aspetta(m => m.t === 'bestiario');
const segK = (await stato(A)).segnalini, kob = Object.keys(segK).find(k => /Coboldo/.test(segK[k].nome));
A.invia({ t: 'segnalino', id: kob, rimuovi: true }); const b2 = await A.aspetta(m => m.t === 'bestiario' && m.bestiario.Coboldo?.sconfitti === 1);
v(b1.bestiario.Coboldo?.visti === 2 && b2.bestiario.Coboldo.sconfitti === 1 && (await stato(C)).bestiario.Coboldo, 'carte da collezione: i mostri incontrati e sconfitti finiscono nella collezione di tutti');
B.coda.length = 0; B.invia({ t: 'ritratto' });
const rit = await B.aspetta(m => m.t === 'scheda' && m.per === bB.io && m.pg.ritratto, 20000).catch(() => null);
const imgR = rit ? await fetch(`http://localhost:8787/tavolo/${codice}/media/img/${rit.pg.ritratto}`) : null;
v(rit && imgR?.ok && /image/.test(imgR.headers.get('content-type')), 'ritratto illustrato del personaggio, creato dalla sua scheda');
const pB2 = (await stato(B)).pg[bB.io]; B.invia({ t: 'scheda', pg: { ...pB2, ritratto: undefined, pf: pB2.pf } }); await B.aspetta(m => m.t === 'scheda' && m.per === bB.io && !m.da?.startsWith?.('master'));
v((await stato(B)).pg[bB.io].ritratto === rit?.pg.ritratto, 'il ritratto resta anche quando il telefono rimanda la scheda');
A.coda.length = 0; A.invia({ t: 'esporta' }); const esp = await A.aspetta(m => m.t === 'esportazione', 6000);
v(['cronaca', 'appunti', 'fatti', 'bestiario'].every(k => k in esp.dati), 'la copia della campagna salva anche cronaca, appunti del mondo, fatti e carte');

// ---------- 4.4: mostri e oggetti inventati, diario del personaggio, viaggi a tappe, il vostro mese ----------
A.coda.length = 0; C.coda.length = 0; B.coda.length = 0;
A.invia({ t: 'homebrew', mostro: { nome: 'Lupo di cenere', pf: 22, ca: 13, attacco: 'morso +4, 2d6 da fuoco', descrizione: 'un lupo fatto di brace e fumo' } });
const hb1 = await A.aspetta(m => m.t === 'homebrew');
A.invia({ t: 'homebrew', oggetto: { nome: 'Lanterna dei sussurri', rarita: 'raro', effetto: 'fa parlare i fantasmi' } }); const hb2 = await A.aspetta(m => m.t === 'homebrew' && m.homebrew.oggetti.length);
B.invia({ t: 'homebrew', mostro: { nome: 'Barare', pf: 1 } }); await pausa(400);
v(hb1.homebrew.mostri[0].pf === 22 && hb2.homebrew.oggetti[0].rarita === 'raro' && !C.coda.some(m => m.t === 'homebrew') && !B.coda.some(m => m.t === 'homebrew') && (await stato(B)).homebrew === undefined, 'mostri e oggetti inventati: li crea e li vede solo chi guida');
await dice('cosa ci aspetta?'); const nHb = (await stato(A)).diario.filter(d => d.tipo === 'narrazione').slice(-1)[0];
v(/inventati:Lupo di cenere/.test(nHb?.testo || ''), 'il master AI conosce i mostri inventati e può usarli');
B.coda.length = 0; B.invia({ t: 'diario_pg' });
const dp = await B.aspetta(m => m.t === 'scheda' && m.per === bB.io && m.pg.pagine?.length, 12000).catch(() => null);
v(dp && /visto il drago/.test(dp.pg.pagine.slice(-1)[0].testo), 'diario del personaggio: il master scrive una pagina in prima persona');
const pB3 = (await stato(B)).pg[bB.io]; B.invia({ t: 'scheda', pg: { ...pB3, pagine: undefined } }); await pausa(500);
v((await stato(B)).pg[bB.io].pagine?.length === dp?.pg.pagine.length, 'le pagine del diario restano anche quando il telefono rimanda la scheda');
const g0v = (await stato(A)).mondo.calendario?.giorno || 1;
A.coda.length = 0; const attesaArrivo = A.aspetta(m => m.t === 'narra' && /viaggio:Castello Lontano.*in_?corso:false/.test(m.testo), 60000).catch(() => null); // registrata prima: stato() svuota la coda
A.invia({ t: 'viaggio', nome: 'Castello Lontano' });
let arrivato = null, agguati = 0;
for (let k = 0; k < 8 && !arrivato; k++) {
  const l = await A.aspetta(m => m.t === 'luogo' && /Castello Lontano/.test(m.luogo.nome), 15000).catch(() => null); if (!l) break;
  if (l.luogo.nome === 'Castello Lontano') { arrivato = l; break; }
  agguati++; const sv = await stato(A); if (!sv.viaggio || !Object.values(sv.segnalini).some(x => x.tipo === 'nemico')) break; // agguato lungo la strada: nemici sulla mappa
  await pausa(600); A.coda.length = 0; A.invia({ t: 'viaggio', riprendi: true });
}
const nArr = await attesaArrivo, sArr = await stato(A);
v(arrivato && !sArr.viaggio && sArr.mondo.calendario.giorno > g0v && sArr.diario.some(d => /Giorno 1 di viaggio/.test(d.testo)), `viaggio a tappe: i giorni passano (${sArr.mondo.calendario.giorno - g0v}), ${agguati} agguati lungo la strada, poi si arriva`);
v(nArr && /in_?corso:false/.test(nArr.testo), 'all\'arrivo il master racconta il viaggio');
A.invia({ t: 'dado', formula: 'd20' }); await A.aspetta(m => m.t === 'dado'); A.coda.length = 0; A.invia({ t: 'mese' });
const ms = await A.aspetta(m => m.t === 'mese');
v(/^\d{4}-\d{2}$/.test(ms.mese) && Object.values(ms.numeri).some(o => o.tiri >= 1) && Array.isArray(ms.trofei) && ms.luoghi.includes('Castello Lontano'), `il vostro mese (${ms.mese}): dadi, trofei e luoghi scoperti`);

// ---------- 4.2: gioco a distanza ----------
// il giro conta anche chi non è collegato, l'attesa è in ore e allo scadere il master risponde a chi ha scritto
A.coda.length = 0; A.invia({ t: 'impostazioni', differito: 24 });
v((await A.aspetta(m => m.t === 'stato' && m.stato.campagna.differito === 24)).stato.giro?.differito === 24, 'gioco a distanza acceso: attesa di 24 ore');
B.ws.close(); await pausa(800); A.coda.length = 0;
A.invia({ t: 'parlato', testo: 'scrivo la mia mossa di oggi', alMaster: true });
const d1 = await A.aspetta(m => m.t === 'giro' && m.giro.scade > 0);
const presto = await A.aspetta(m => m.t === 'narra', 2500).catch(() => null);
v(d1.giro.mancano.includes('Marco') && d1.giro.scade - Date.now() > 23 * 3600000 && !presto, 'a distanza si aspetta anche chi non è collegato (Marco), fino a 24 ore');
const B2 = client(); await B2.pronto; B2.invia({ t: 'ciao', membro: bB.io, chiave: bB.chiave }); const rB = await B2.aspetta(m => m.t === 'benvenuto');
v(rB.stato.giro?.mancano[0] === 'Marco' && rB.stato.giro.scade === d1.giro.scade, 'chi rientra trova scritto chi manca e fino a quando si aspetta');
A.coda.length = 0; B2.invia({ t: 'parlato', testo: 'prova della prima partita', alMaster: true });
const nd = await A.aspetta(m => m.t === 'narra', 12000).catch(() => null);
v(nd && /distanza:true/.test(nd.testo), 'quando hanno scritto tutti il master risponde subito, sapendo che si gioca a distanza');
v((await A.aspetta(m => m.t === 'giro' && !m.giro.detti.length, 6000).catch(() => null))?.giro.scade === 0, 'dopo la risposta comincia un giro nuovo, senza scadenza finché nessuno scrive');
A.invia({ t: 'impostazioni', differito: 0.0007 }); await A.aspetta(m => m.t === 'stato' && m.stato.campagna.differito > 0 && m.stato.campagna.differito < 1); // nelle prove: due secondi e mezzo
await pausa(1500); A.coda.length = 0; A.invia({ t: 'parlato', testo: 'scrivo solo io', alMaster: true });
const subito2 = await A.aspetta(m => m.t === 'narra', 1200).catch(() => null), tardi = await A.aspetta(m => m.t === 'narra', 15000).catch(() => null);
v(!subito2 && !!tardi, 'scaduta l\'attesa il master risponde anche se qualcuno non ha scritto');
const avviso = await (await fetch(`http://localhost:8787/tavolo/${codice}/avviso`)).json();
v('tipo' in avviso && avviso.tipo === null, 'il telefono può chiedere di che cosa parla l\'ultima notifica (qui nessuna)');
A.invia({ t: 'impostazioni', differito: 0 }); await A.aspetta(m => m.t === 'stato' && !m.stato.campagna.differito);

// ---------- 4.2: mondi condivisi con codice ----------
A.coda.length = 0; A.invia({ t: 'vai', nome: 'Torre di Argentea' }); const torre = (await A.aspetta(m => m.t === 'luogo' && m.luogo.nome === 'Torre di Argentea')).luogo;
B2.coda.length = 0; B2.invia({ t: 'mondo_condividi' }); await pausa(400);
A.invia({ t: 'mondo_condividi' }); const chiaveMondo = (await A.aspetta(m => m.t === 'mondo_chiave')).chiave;
v(/^[A-Z0-9]{8}$/.test(chiaveMondo) && !B2.coda.some(m => m.t === 'mondo_chiave'), 'il codice del mondo lo crea solo chi ha creato la campagna');
const codice2 = 'MONDO' + Math.random().toString(36).slice(2, 6).toUpperCase();
const D = client(codice2); await D.pronto; D.invia({ t: 'crea', nome: 'Altro gruppo', regole: '5e', masterTipo: 'ai', mioNome: 'Giulia' }); await D.aspetta(m => m.t === 'benvenuto');
D.invia({ t: 'mondo_importa', codice: `${codice}-SBAGLIAT` });
v(/non trovato/.test((await D.aspetta(m => m.t === 'avviso')).msg), 'codice del mondo sbagliato: rifiutato con un messaggio chiaro');
D.coda.length = 0; D.invia({ t: 'mondo_importa', codice: `${codice.toLowerCase()} - ${chiaveMondo}`.replace(/ /g, '') });
const sd = (await D.aspetta(m => m.t === 'stato' && Object.keys(m.stato.luoghi || {}).length > 0, 10000)).stato;
v(/mutaforma/.test(sd.appunti) && sd.fatti.length >= 1 && Object.values(sd.luoghi).some(l => l.nome === 'Torre di Argentea') && sd.campagna.mondoDa === 'Regia' && sd.diario.some(d => /porta la campagna nel mondo «Regia»/.test(d.testo)), `mondo importato: appunti, fatti nascosti e ${Object.keys(sd.luoghi).length} luoghi arrivano nella nuova campagna`);
v(sd.pg && !Object.keys(sd.pg).length && !/fabbro Ulrico/.test(sd.cronaca || '') && !sd.diario.some(d => /apro la porta/.test(d.testo)), 'personaggi, diario e memoria del primo gruppo non vengono copiati');
D.coda.length = 0; D.invia({ t: 'vai', nome: 'Torre di Argentea' }); const torre2 = (await D.aspetta(m => m.t === 'luogo' && m.luogo.nome === 'Torre di Argentea')).luogo;
v(torre2.celle.join('') === torre.celle.join(''), 'i luoghi importati hanno la stessa identica mappa');
A.invia({ t: 'mondo_condividi', ritira: true }); await A.aspetta(m => m.t === 'mondo_chiave' && m.chiave === '');
D.coda.length = 0; D.invia({ t: 'mondo_importa', codice: `${codice}-${chiaveMondo}` });
v(/non trovato/.test((await D.aspetta(m => m.t === 'avviso')).msg), 'codice ritirato: il mondo non si può più copiare');

// ---------- 4.2: avventura dei primi passi ----------
const codice3 = 'PRIMI' + Math.random().toString(36).slice(2, 6).toUpperCase();
const E = client(codice3); await E.pronto; E.invia({ t: 'crea', nome: 'Primi passi', regole: '5e', masterTipo: 'ai', mioNome: 'Nuovo', avventura: 'primi', solitaria: true });
const bE = await E.aspetta(m => m.t === 'benvenuto');
v(bE.stato.avventure.some(a => a.id === 'primi' && a.tipo === 'primi passi'), 'tra le avventure pronte c\'è quella dei primi passi');
E.invia({ t: 'scheda', pg: pg('Tessa') }); await E.aspetta(m => m.t === 'scheda');
const ap = await E.aspetta(m => m.t === 'narra', 12000).catch(() => null); // nessuno ha ancora parlato: comincia da sola
v(ap && /Locanda del Gallo Nero profuma/.test(ap.testo) && (await stato(E)).luogo?.nome === 'Locanda del Gallo Nero', 'creato il personaggio, i primi passi cominciano da soli alla locanda con la scena d\'apertura');
await pausa(1500); E.coda.length = 0; E.invia({ t: 'parlato', testo: 'prova della prima partita', alMaster: true });
v(/prima:true/.test((await E.aspetta(m => m.t === 'narra', 12000)).testo), 'il master sa che è una prima partita e spiega una cosa alla volta');

for (const c of [A, B2, C, D, E]) c.ws.close();
console.log(`\n${ok} ok, ${ko} falliti`); process.exit(ko ? 1 : 0);
