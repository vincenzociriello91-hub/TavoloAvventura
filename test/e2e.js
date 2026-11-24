// Prova completa nel browser: Vincenzo crea la campagna, Marco entra dal link, schede, comandi vocali, dadi, mappa, master AI, voce.
const { chromium } = require('playwright');
const OUT = process.env.OUT || require('path').join(require('os').tmpdir(), 'tavolo-shot');
require('fs').mkdirSync(OUT, { recursive: true });
let ok = 0, ko = 0; const v = (c, n) => { c ? ok++ : ko++; console.log(c ? 'OK  ' : 'FAIL', n); };
(async () => {
  const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errori = [];
  const nuovo = async (vp) => {
    const ctx = await browser.newContext({ viewport: vp, permissions: ['microphone'], deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    p.on('pageerror', e => errori.push('pageerror: ' + e.message));
    p.on('console', m => { if (m.type() === 'error' && !/fonts.g|favicon|ERR_TUNNEL|ERR_CONNECTION|net::|rapporti-vincenzo|Failed to load resource/.test(m.text())) errori.push('console: ' + m.text()); });
    return p;
  };
  const A = await nuovo({ width: 412, height: 915 });
  await A.goto('http://localhost:8765/');
  v(await A.isVisible('#cartaCrea'), 'schermata di ingresso visibile');
  await A.fill('#cNome', 'La Torre di Smeraldo');
  await A.click('#chipsAmb .chip >> nth=1');
  await A.fill('#cMioNome', 'Vincenzo');
  await A.screenshot({ path: OUT + '/1-ingresso.png', fullPage: true });
  await A.click('#btnCrea');
  await A.waitForSelector('#gioco:not([hidden])', { timeout: 8000 });
  v(await A.textContent('#tCampagna') === 'La Torre di Smeraldo', 'campagna creata, siamo nella stanza');
  await A.click('#nav button[data-v="vAltro"]');
  await A.waitForSelector('#qr svg');
  v(true, 'QR di invito generato');
  const link = await A.evaluate(() => linkInvito());
  v(/\?c=[A-Z0-9]{8}&i=[A-Z0-9]{8}/.test(link), 'link di invito: ' + link);
  await A.screenshot({ path: OUT + '/2-invito.png', fullPage: true });

  // Marco entra dal link (desktop)
  const B = await nuovo({ width: 1440, height: 900 });
  await B.goto(link);
  v(await B.inputValue('#eCodice') !== '' && await B.isHidden('#cartaCrea'), 'dal link: codici già compilati, solo "entra"');
  await B.fill('#eNome', 'Marco');
  await B.click('#btnEntra');
  await B.waitForSelector('#gioco:not([hidden])', { timeout: 8000 });
  await A.waitForFunction(() => S.st.online.length === 2, null, { timeout: 5000 });
  v(true, 'Vincenzo vede Marco online');

  // Marco crea il personaggio
  await B.waitForSelector('#cpNome');
  await B.fill('#cpNome', 'Brann Barbaferro');
  await B.selectOption('#cpRazza', 'Nano');
  await B.selectOption('#cpClasse', 'Guerriero');
  await B.click('#cpAuto');
  await B.click('[data-cpab="Atletica"]'); await B.click('[data-cpab="Percezione"]');
  await B.screenshot({ path: OUT + '/3-creazione-desktop.png', fullPage: true });
  await B.click('#cpCrea');
  await B.waitForSelector('.pg-testa h2');
  const pgB = await B.evaluate(() => mioPg());
  v(pgB.nome === 'Brann Barbaferro' && pgB.car.for === 15 && pgB.car.cos === 16 && pgB.pfMax === 13 && pgB.ca === 18, `scheda calcolata: FOR ${pgB.car.for} COS ${pgB.car.cos} PF ${pgB.pfMax} CA ${pgB.ca}`);
  await A.waitForFunction(() => Object.values(S.st.pg).some(p => p.nome === 'Brann Barbaferro'), null, { timeout: 5000 });
  v(true, 'Vincenzo riceve la scheda di Marco');

  // Comandi vocali (frasi come le darebbe il riconoscimento vocale)
  await B.evaluate(() => sentitaFrase('subisco 6 danni'));
  await B.waitForTimeout(300);
  let p = await B.evaluate(() => mioPg());
  v(p.pf === 7 && p.ferite.length === 1, 'a voce "subisco 6 danni": PF 7/13 e benda sul ritratto');
  await B.evaluate(() => sentitaFrase("equipaggio l'ascia bipenne"));
  await B.waitForTimeout(300);
  p = await B.evaluate(() => mioPg());
  v(p.equip.find(e => e.nome === 'Ascia bipenne')?.indossato && p.ca === 16, 'a voce "equipaggio l\'ascia bipenne": impugnata, scudo riposto, CA 16');
  await B.evaluate(() => sentitaFrase('annulla'));
  await B.waitForTimeout(300);
  p = await B.evaluate(() => mioPg());
  v(!p.equip.find(e => e.nome === 'Ascia bipenne') && p.ca === 18, 'a voce "annulla": torna come prima');
  await B.evaluate(() => sentitaFrase('salgo di livello'));
  await B.waitForTimeout(200);
  await B.evaluate(() => { sentitaFrase('salgo di livello'); sentitaFrase('salgo di livello'); });
  await B.waitForTimeout(300);
  p = await B.evaluate(() => mioPg());
  v(p.livello === 4 && p.puntiCar === 2, 'a voce "salgo di livello" ×3: livello 4 con 2 punti caratteristica');
  await B.evaluate(() => sentitaFrase('aumenta di due punti intelligenza'));
  await B.waitForTimeout(300);
  p = await B.evaluate(() => mioPg());
  v(p.car.int === 10 && p.puntiCar === 0, `a voce "aumenta di due punti intelligenza": INT ${p.car.int}, punti usati`);
  await B.waitForSelector('#annullaBar:not([hidden])');
  v(true, 'barra "Annulla" mostrata dopo il comando');
  await B.screenshot({ path: OUT + '/4-scheda-desktop.png' });

  // Dadi
  await B.evaluate(() => sentitaFrase('tiro per percezione con vantaggio'));
  await A.waitForFunction(() => S.st.dadi.some(d => d.motivo === 'Percezione'), null, { timeout: 5000 });
  const tiro = await A.evaluate(() => S.st.dadi.find(d => d.motivo === 'Percezione'));
  v(tiro.modo === 'vantaggio' && tiro.scartati.length === 1, `tiro con vantaggio visto da tutti: ${tiro.totale}`);
  await A.click('#nav button[data-v="vDadi"]');
  await A.click('#dadiTasti button[data-f="20"]');
  await A.waitForSelector('#ultimoTiro .tot');
  v(true, 'Vincenzo tira un d20 dal tasto');

  // Master AI (finto) e mappa
  await A.click('#nav button[data-v="vDiario"]');
  await A.fill('#chatTesto', 'Entriamo nella città e cerchiamo una locanda');
  await A.click('#formChat button');
  await A.waitForFunction(() => S.st.luogo && S.st.diario.some(d => d.tipo === 'narrazione'), null, { timeout: 10000 });
  v(true, 'il master AI risponde e porta il gruppo in un luogo');
  await A.click('#nav button[data-v="vMappa"]');
  await A.waitForTimeout(400);
  const dim = await A.evaluate(() => { const c = document.querySelector('#mappa'); return [c.width, c.height, getComputedStyle(c).display]; });
  v(dim[0] > 300 && dim[2] !== 'none', 'mappa disegnata sul telefono: ' + dim.join('x'));
  await A.screenshot({ path: OUT + '/5-mappa-telefono.png', fullPage: true });
  p = await B.evaluate(() => mioPg());
  v(p.equip.some(e => e.nome === 'Chiave arrugginita'), 'l\'oggetto dato dal master compare nella scheda');
  // Vincenzo (amministratore) brucia un edificio
  await A.evaluate(() => invia({ t: 'vai', nome: 'Città di Argentea' }));
  await A.waitForFunction(() => S.st.luogo?.nome === 'Città di Argentea', null, { timeout: 5000 });
  const ed = await A.evaluate(() => S.st.luogo.edifici.find(e => e.nome === 'Locanda').id);
  await A.evaluate(id => invia({ t: 'modifica_luogo', edificio: id, stato: 'bruciato' }), ed);
  await B.waitForTimeout(1000);
  v(await B.evaluate(id => S.st.luogo.edifici.find(e => e.id === id).stato === 'integro', ed), 'con il master AI il creatore non può bruciare a mano un edificio');
  await B.waitForTimeout(400);
  await B.screenshot({ path: OUT + '/6-mappa-desktop.png' });
  // 2.4.0: ci si sposta solo dove si arriva a piedi (il server rifiuta i salti attraverso i muri)
  const meta = await B.evaluate(() => { const s = S.st.segnalini[S.io], occ = Object.values(S.st.segnalini); for (let r = 3; r < 10; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const q = { x: s.x + dx, y: s.y + dy }; if (Math.max(Math.abs(dx), Math.abs(dy)) === r && !occ.some(o => o.x === q.x && o.y === q.y) && Mappa.percorso(s, q)) return q; } });
  await B.evaluate(m => invia({ t: 'segnalino', x: m.x, y: m.y }), meta);
  await A.waitForFunction(([id, m]) => S.st.segnalini[id]?.x === m.x && S.st.segnalini[id]?.y === m.y, [await B.evaluate(() => S.io), meta], { timeout: 5000 });
  v(true, 'segnalino spostato e visto dagli altri');
  // 1.6.2: tocco breve = muovi il segnalino (niente finestra dell'edificio); pressione lunga = finestra
  const tocca = (x, y, ms) => A.evaluate(async ([x, y, ms]) => {
    const c = document.querySelector('#mappa'), b = c.getBoundingClientRect(), t = b.width / S.st.luogo.w;
    const o = { clientX: b.left + (x + 0.5) * t, clientY: b.top + (y + 0.5) * t, pointerId: 1, bubbles: true };
    c.dispatchEvent(new PointerEvent('pointerdown', o)); await new Promise(r => setTimeout(r, ms)); c.dispatchEvent(new PointerEvent('pointerup', o));
  }, [x, y, ms]);
  const cellaLibera = await A.evaluate(() => {
    const l = S.st.luogo, s0 = S.st.segnalini[S.io], occ = Object.values(S.st.segnalini);
    for (let r = 1; r < 8; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const x = s0.x + dx, y = s0.y + dy, ch = l.celle[y]?.[x];
      if (ch && !'#wRT~'.includes(ch) && !occ.some(s => s.x === x && s.y === y) && !(l.oggetti || []).some(o => o.x === x && o.y === y) && Mappa.percorso(s0, { x, y })) return { x, y };
    }
  });
  await tocca(cellaLibera.x, cellaLibera.y, 60);
  await A.waitForFunction(c => S.st.segnalini[S.io]?.x === c.x && S.st.segnalini[S.io]?.y === c.y, cellaLibera, { timeout: 5000 });
  v(true, 'tocco breve su una casella libera: il segnalino si sposta');
  // dentro un muro non si va: né toccando la mappa né mandando la mossa al server
  const muro = await A.evaluate(() => { const l = S.st.luogo, s0 = S.st.segnalini[S.io]; let m = null, dm = 1e9; l.celle.forEach((r, y) => [...r].forEach((c, x) => { const d = Math.abs(x - s0.x) + Math.abs(y - s0.y); if ((c === '#' || c === 'w') && d < dm) { dm = d; m = { x, y }; } })); return m; });
  const prima = await A.evaluate(() => ({ ...S.st.segnalini[S.io] }));
  await tocca(muro.x, muro.y, 60); await A.waitForTimeout(300);
  v(await A.evaluate(([p]) => S.st.segnalini[S.io].x === p.x && S.st.segnalini[S.io].y === p.y && /Non ci si arriva/.test(document.querySelector('#toast').textContent), [prima]), 'tocco su un muro: il segnalino resta fermo e l\'app lo dice');
  await A.evaluate(m => invia({ t: 'segnalino', x: m.x, y: m.y }), muro); await A.waitForTimeout(900);
  v(await A.evaluate(p => S.st.segnalini[S.io].x === p.x && S.st.segnalini[S.io].y === p.y, prima), 'il server rifiuta il salto dentro un muro');
  // zoom della mappa 2D: + avvicina, Tutta la mappa inquadra ciò che è stato scoperto
  const larg0 = await A.evaluate(() => document.querySelector('#mappa').getBoundingClientRect().width);
  await A.click('#btnZoomPiu'); await A.waitForTimeout(150);
  const larg1 = await A.evaluate(() => document.querySelector('#mappa').getBoundingClientRect().width);
  await A.click('#btnZoomTutta'); await A.waitForTimeout(150);
  const tutta = await A.evaluate(() => { const b = document.querySelector('#mappaBox'), l = S.st.luogo, t = document.querySelector('#mappa').getBoundingClientRect().width / l.w; let x0 = l.w, x1 = -1; for (let i = 0; i < l.w * l.h; i++) if (!l.visto || l.visto[i] === '1') { x0 = Math.min(x0, i % l.w); x1 = Math.max(x1, i % l.w); } return (x1 - x0 + 1) * t <= b.clientWidth + 1; });
  v(larg1 > larg0 && tutta, 'zoom 2D: avvicina e poi mostra tutta la parte scoperta');
  const pinch = await A.evaluate(async () => {
    const c = document.querySelector('#mappa'), b = c.getBoundingClientRect(), w0 = b.width, cx = b.left + Math.min(120, b.width / 2), cy = b.top + Math.min(120, b.height / 2);
    const p = (id, x, tipo) => c.dispatchEvent(new PointerEvent(tipo, { pointerId: id, clientX: x, clientY: cy, bubbles: true }));
    p(11, cx - 20, 'pointerdown'); p(12, cx + 20, 'pointerdown'); p(11, cx - 50, 'pointermove'); p(12, cx + 50, 'pointermove'); p(11, cx - 50, 'pointerup'); p(12, cx + 50, 'pointerup');
    await new Promise(r => setTimeout(r, 100)); return c.getBoundingClientRect().width > w0 * 1.5 && !c.style.transform;
  });
  v(pinch, 'zoom 2D con due dita');
  await A.screenshot({ path: OUT + '/16-mappa-tutta.png' });
  // 2.2.0: negozio nella scheda di Marco, schermo del master in Altro, libro della campagna
  await A.evaluate(() => invia({ t: 'apri_negozio', nome: 'Fabbro Ulrico', tipo: 'fabbro' }));
  await B.waitForFunction(() => S.st.negozio, null, { timeout: 5000 });
  await B.click('#nav button[data-v="vScheda"]'); await B.waitForTimeout(300);
  v(await B.locator('.negozio [data-compra="Pugnale"]').count() === 1, 'il banco del fabbro compare nella scheda del giocatore');
  await B.screenshot({ path: OUT + '/14-negozio.png' });
  await B.click('.negozio [data-compra="Pugnale"]');
  await B.waitForFunction(() => mioPg().equip.some(e => e.nome === 'Pugnale'), null, { timeout: 5000 });
  v(await B.locator('.equip .icona-ogg svg').count() > 0, 'pugnale comprato, con le icone nell\'inventario');
  await A.evaluate(() => invia({ t: 'chiudi_negozio' }));
  await A.click('#nav button[data-v="vAltro"]'); await A.waitForTimeout(300);
  v(await A.locator('#schermoMaster').isVisible(), 'schermo del master visibile al master');
  const spunte = await A.evaluate(() => { if (typeof apriSezione === 'function') apriSezione('#optMeteoVero'); return [...document.querySelectorAll('.spunta input')].filter(i => i.offsetParent).map(i => [i.id, Math.round(i.getBoundingClientRect().width)]).filter(([, w]) => w < 20); });
  v(!spunte.length, 'caselle da spuntare tutte della stessa misura, anche con testo lungo ' + JSON.stringify(spunte));
  await A.click('[data-strumento="png"]');
  await A.waitForFunction(() => document.querySelector('#smRisultato strong'), null, { timeout: 8000 });
  v(true, 'lo schermo del master genera un PNG');
  const [libro] = await Promise.all([A.waitForEvent('popup', { timeout: 8000 }).catch(() => null), A.click('#btnLibro')]);
  if (libro) { await libro.waitForLoadState(); v(await libro.locator('h1').count() === 1 && await libro.locator('.pg').count() >= 1, 'libro della campagna aperto, pronto da stampare'); await libro.close(); } else v(false, 'libro della campagna aperto');
  await A.click('#nav button[data-v="vMappa"]');
  // vista 3D (three.js): si accende, disegna, si spegne senza errori
  await A.click('#btn3d');
  await A.waitForSelector('#mappa3dBox canvas', { timeout: 15000 }).catch(() => null);
  await A.waitForTimeout(1500);
  const v3 = await A.evaluate(() => ({ c: !!document.querySelector('#mappa3dBox canvas'), vis: !document.querySelector('#mappa3dBox').hidden }));
  v(v3.c && v3.vis, 'vista 3D accesa con la mappa in rilievo');
  await A.screenshot({ path: OUT + '/13-vista-3d.png' });
  await A.click('#btnZoomTutta'); await A.waitForTimeout(800);
  await A.screenshot({ path: OUT + '/17-vista-3d-tutta.png' });
  v(await A.evaluate(() => !!S.m3?.zoom), 'zoom 3D: Tutta la mappa');
  await A.click('#btn3d'); await A.waitForTimeout(300);
  v(await A.evaluate(() => document.querySelector('#mappa3dBox').hidden && !document.querySelector('#mappaBox').hidden), 'si torna alla vista 2D');
  const loc = await A.evaluate(() => S.st.luogo.edifici.find(e => e.nome === 'Locanda'));
  await tocca(loc.x, loc.y, 60); await A.waitForTimeout(600);
  v(!(await A.evaluate(() => document.querySelector('#dlg').open)), 'tocco breve su un edificio: nessuna finestra');
  await tocca(loc.x, loc.y, 600);
  v(await A.evaluate(() => document.querySelector('#dlg').open), 'pressione lunga su un edificio: si apre la sua finestra');
  await A.evaluate(() => document.querySelector('#dlg').close());

  // Voce WebRTC tra i due browser
  await A.waitForTimeout(2500);
  const voceA = await A.evaluate(() => Voce.stato());
  v(Object.values(voceA).includes('connected'), 'chat vocale collegata: ' + JSON.stringify(voceA));

  // Riconnessione
  await B.reload();
  await B.waitForSelector('#gioco:not([hidden])', { timeout: 8000 });
  p = await B.evaluate(() => mioPg());
  v(p && p.livello === 4, 'ricaricando la pagina Marco rientra da solo con la sua scheda');

  // TV
  const T = await nuovo({ width: 1920, height: 1080 });
  await T.goto(link + '&tv=1');
  await T.waitForSelector('#gioco:not([hidden])', { timeout: 8000 });
  await T.waitForTimeout(600);
  v(await T.evaluate(() => document.body.classList.contains('tv') && me().ruolo === 'spettatore'), 'modalità TV: entra come spettatore');
  await T.screenshot({ path: OUT + '/7-tv.png' });
  v(await T.evaluate(() => { renderScheda(); return S.st.membri[S.viewPg]?.ruolo === 'giocatore' && !/non ha ancora creato/.test(document.querySelector('#scheda').textContent); }), 'chi non gioca (spettatore, master) vede la scheda di un giocatore, non "X non ha ancora creato il personaggio"');

  const pacc = await A.evaluate(async () => Report.cifra({ prova: 1 }));
  v(pacc.key && pacc.iv && pacc.data && pacc.app === 'TavoloAvventura', 'rapporto cifrato pronto');
  require('fs').writeFileSync(OUT + '/pacchetto.json', JSON.stringify(pacc));

  await A.click('#nav button[data-v="vScheda"]');
  await A.screenshot({ path: OUT + '/8-scheda-telefono-vincenzo.png', fullPage: true });

  // 1.1.0: microfono liberato e ripreso, voce ancora collegata
  await A.evaluate(async () => { Voce.pausaMicrofono(); await new Promise(r => setTimeout(r, 300)); await Voce.riprendiMicrofono(); });
  await A.waitForTimeout(800);
  v(await A.evaluate(() => Voce.stream?.getAudioTracks()[0]?.readyState === 'live' && Object.values(Voce.stato()).includes('connected')), 'microfono liberato e ripreso: chat vocale ancora collegata');
  v(await A.isVisible('#btnParla'), 'tasto "tieni premuto e parla" visibile');
  await A.click('#nav button[data-v="vDadi"]');
  v(await A.locator('#rapidi button').count() > 0, 'tiri rapidi mostrati');
  await A.click('#btnPreferito'); 
  v((await A.evaluate(() => leggi(chiavePref(), []))).length === 1, 'tiro salvato nei preferiti');
  // bot di prova
  await A.click('#nav button[data-v="vAltro"]');
  await A.evaluate(() => apriSezione('#btnBot'));
  v(await A.isVisible('#btnBot'), 'tasto partita bot visibile all\'amministratore (sezione aperta col titolo)');
  await A.click('#btnBot');
  await A.waitForFunction(() => /Finito/.test(document.querySelector('#botLog').textContent), null, { timeout: 300000 });
  const esitoBot = await A.textContent('#botLog li:last-child');
  console.log('     ', esitoBot);
  if (!/ 0 non riuscite/.test(esitoBot)) console.log('      passi:', await A.evaluate(() => [...document.querySelectorAll('#botLog li')].filter(l => /❌/.test(l.textContent)).map(l => l.textContent).join(' | ')));
  v(/ 0 non riuscite/.test(esitoBot), 'partita bot (campagna nuova, 4 bot e master AI) completata senza problemi');
  await A.waitForTimeout(800);
  v(!Object.values(await A.evaluate(() => S.st.membri)).some(m => /^Bot /.test(m.nome)), 'la partita bot non tocca la campagna di chi la avvia');
  v(await A.evaluate(() => S.st.costi?.totale?.chiamate > 0) && /chiamate/.test(await A.evaluate(() => document.querySelector('#costi').textContent)), 'pannello uso AI aggiornato');
  // 1.2.0: combattimento, aree, nebbia, tesoro, volti
  await A.click('#nav button[data-v="vMappa"]');
  await A.click('#btnCombat');
  await B.waitForFunction(() => S.st.combattimento?.attivo, null, { timeout: 5000 });
  v(await B.isVisible('#combat') && /Round 1/.test(await B.textContent('#combat')), 'combattimento iniziato, ordine visibile a Marco');
  const primoTurno = await B.evaluate(() => S.st.combattimento.ordine[S.st.combattimento.turno].nome);
  await A.evaluate(() => invia({ t: 'combattimento', azione: 'prossimo' }));
  await B.waitForFunction(p => S.st.combattimento.ordine[S.st.combattimento.turno].nome !== p || S.st.combattimento.round > 1, primoTurno, { timeout: 5000 });
  v(true, 'turno successivo');
  await A.evaluate(() => invia({ t: 'area', forma: 'cerchio', x: 10, y: 8, dim: 3, nome: 'Palla di fuoco' }));
  await B.waitForFunction(() => S.st.aree?.length === 1, null, { timeout: 5000 });
  v(true, 'area dell\'incantesimo visibile a tutti');
  v(await B.evaluate(() => /1/.test(S.st.luogo.visto || '') && /0/.test(S.st.luogo.visto || '')), 'nebbia di guerra: parte della mappa esplorata, parte no');
  await B.evaluate(() => sentitaFrase('metti 3 monete nel tesoro comune'));
  await A.waitForFunction(() => S.st.gruppo?.oro === 3, null, { timeout: 5000 });
  await A.evaluate(() => invia({ t: 'gruppo', op: 'oggetto', nome: 'Corda', qta: 1 }));
  await B.waitForFunction(() => S.st.gruppo?.oggetti?.some(o => o.nome === 'Corda'), null, { timeout: 5000 });
  await B.evaluate(() => invia({ t: 'gruppo', op: 'prendi', nome: 'Corda' }));
  await B.waitForFunction(() => mioPg().equip.some(e => e.nome === 'Corda'), null, { timeout: 5000 });
  v(true, 'tesoro comune: monete a voce, oggetto messo e preso');
  for (const p of [A, B]) await p.evaluate(() => toast('È il tuo turno!'));
  await A.evaluate(() => invia({ t: 'combattimento', azione: 'fine' }));
  for (const p of [A, B]) await p.waitForFunction(() => !S.st.combattimento?.attivo, null, { timeout: 5000 });
  v(await A.evaluate(() => $('#toast').hidden) && await B.evaluate(() => $('#toast').hidden), 'scontro finito: l\'avviso "È il tuo turno!" sparisce subito');
  v(await A.evaluate(() => { toast('Il master prepara il riassunto…'); const vista = S.vista; S.vista = 'vMappa'; riassuntoArrivato({ riassunto: true, testo: 'Nella puntata precedente…' }); S.vista = vista; return $('#toast').hidden; }), 'riassunto arrivato: l\'avviso "il master prepara il riassunto" sparisce');
  v(await A.evaluate(() => { const box = $('#mappaBox'), l = S.st.luogo, s = S.st.segnalini[S.io], w = box.style.width; box.style.width = '90px'; Mappa.imposta({ ...l, id: l.id + '-prova' }, S.st.segnalini, S.st.membri); const t = $('#mappa').offsetWidth / l.w, cx = s.x * t + t / 2, dentro = cx >= box.scrollLeft && cx <= box.scrollLeft + box.clientWidth; box.style.width = w; Mappa.imposta(l, S.st.segnalini, S.st.membri); return dentro; }), 'luogo più largo dello schermo: la vista parte dalla propria figura');
  v(await A.evaluate(() => /▸/.test(getComputedStyle(document.querySelector('#altriStrumenti > summary'), '::after').content)), 'le parti che si aprono (es. "Altri strumenti") hanno la freccina');
  await A.evaluate(() => mostraNarrazione('Benvenuti nella mia locanda, forestieri.', 'Oste Bruno'));
  v(await A.locator('#narrVolto svg, #narrVolto img.volto-png').count() === 1, 'volto del PNG nella vignetta (illustrato o in pixel art)');
  await B.click('#nav button[data-v="vMappa"]').catch(() => {});
  await B.screenshot({ path: OUT + '/9-combat-desktop.png' });
  // 1.3.0: incantesimi, talenti, multiclasse, oggetti magici
  await B.click('#nav button[data-v="vScheda"]').catch(() => {});
  for (const f of ['imparo l\'incantesimo palla di fuoco', 'raccolgo una spada lunga +2 rara', 'aggiungi il talento lottatore']) { await B.evaluate(x => sentitaFrase(x), f); await B.waitForTimeout(250); }
  let q = await B.evaluate(() => mioPg());
  v(q.incantesimi?.some(i => i.nome === 'Palla di fuoco') && q.equip.some(e => e.bonus === 2 && e.rarita === 'raro') && q.talenti?.includes('Lottatore'), 'incantesimo, oggetto +2 raro e talento aggiunti a voce');
  await B.evaluate(() => sentitaFrase('salgo di livello come mago'));
  await B.waitForTimeout(300);
  q = await B.evaluate(() => mioPg());
  v(q.classi?.some(c => c.classe === 'Mago' && c.livello === 1) && q.livello === 5, 'multiclasse: Guerriero 4 / Mago 1');
  v(await B.locator('.slot').count() > 0, 'slot degli incantesimi mostrati nella scheda');
  await B.evaluate(() => sentitaFrase('lancio dardo incantato'));
  await B.waitForTimeout(300);
  v((await B.evaluate(() => mioPg().slotUsati?.[1])) === 1, 'lanciare un incantesimo consuma uno slot');
  await B.screenshot({ path: OUT + '/10-scheda-magia.png', fullPage: true });
  // 1.4.0: relazioni, fazioni, valute, mappa del mondo
  await A.evaluate(() => invia({ t: 'scheda', pg: Regole.nuovo('5e', { nome: 'Elara', razza: 'Elfo', classe: 'Mago', carBase: { for: 8, des: 14, cos: 13, int: 15, sag: 12, car: 10 } }) }));
  const idA = await A.evaluate(() => S.io);
  await B.waitForFunction(id => !!S.st.pg[id], idA, { timeout: 5000 });
  await B.evaluate(id => { S.viewPg = id; renderScheda(); }, idA);
  v(/vedi solo l'aspetto/.test(await B.textContent('#scheda')), 'scheda di uno sconosciuto: si vede solo l\'aspetto');
  const idB = await B.evaluate(() => S.io);
  await A.evaluate(id => invia({ t: 'relazione', con: id, livello: 'amici stretti' }), idB);
  await B.waitForFunction(id => S.st.relazioni?.[id], idA, { timeout: 5000 });
  await B.evaluate(id => { S.viewPg = id; renderScheda(); }, idA);
  v(/Caratteristiche/.test(await B.textContent('#scheda')) && !/vedi solo/.test(await B.textContent('#scheda')), 'amici stretti: si vede tutta la scheda');
  await B.evaluate(() => { S.viewPg = S.io; renderScheda(); });
  await A.evaluate(() => { invia({ t: 'mondo', fazione: 'Gilda dei Ladri', reputazione: -20 }); invia({ t: 'mondo', valuta: 'Corone di Argentea', cambio: 0.5 }); });
  await B.waitForFunction(() => S.st.mondo?.valute?.['Corone di Argentea'], null, { timeout: 5000 });
  await B.evaluate(() => sentitaFrase('trovo 30 corone di argentea'));
  await B.waitForTimeout(300);
  v((await B.evaluate(() => mioPg().valute?.['Corone di Argentea'])) === 30, 'valuta locale a voce: 30 corone');
  await B.click('#nav button[data-v="vDiario"]').catch(() => {});
  v(/Gilda dei Ladri/.test(await B.textContent('#mondo')), 'fazione e reputazione visibili nel diario');
  await A.click('#nav button[data-v="vMappa"]');
  await A.click('#btnMondo');
  v(await A.evaluate(() => { const c = document.querySelector('#mondoCanvas'); return c.width > 600 && c.getContext('2d').getImageData(c.width / 2, c.height / 2, 1, 1).data[3] > 0; }), 'mappa del mondo illustrata disegnata');
  await A.screenshot({ path: OUT + '/15-mondo.png' });
  await A.screenshot({ path: OUT + '/11-mondo.png' });
  await A.click('#btnMondo');
  // 1.5.0: suoni, edifici in cui entrare
  await A.click('#nav button[data-v="vAltro"]');
  await A.check('#optSuoni');
  await A.evaluate(() => invia({ t: 'vai', nome: 'Città di Argentea' }));
  await A.waitForFunction(() => S.st.luogo?.nome === 'Città di Argentea', null, { timeout: 5000 });
  await A.waitForTimeout(300);
  v(await A.evaluate(() => Suoni.attivo && Suoni.scenaAttuale === 'citta'), 'musica d\'ambiente della città attiva');
  const edCasa = await A.evaluate(() => S.st.luogo.edifici.find(e => /Fabbro|Tempio|Mercato|Casa|Biblioteca/.test(e.nome) && e.stato === 'integro'));
  await A.evaluate(id => invia({ t: 'entra_edificio', edificio: id }), edCasa.id);
  await A.waitForFunction(n => S.st.luogo?.nome?.startsWith(n), edCasa.nome, { timeout: 15000 });
  const interno = await A.evaluate(() => S.st.luogo);
  v(interno.genitore && interno.edifici.length >= 3 && (interno.tipo === 'interno' || interno.tipo === 'taverna'), `entrati in "${interno.nome}" (${interno.tipo}, ${interno.edifici.length} stanze)`);
  await A.click('#nav button[data-v="vMappa"]');
  await A.waitForTimeout(300);
  v(await A.isVisible('#btnEsciEd'), 'tasto "Esci all\'aperto" visibile');
  await A.screenshot({ path: OUT + '/12-interno.png' });
  await A.click('#btnEsciEd');
  await A.waitForFunction(() => S.st.luogo?.nome === 'Città di Argentea', null, { timeout: 5000 });
  v(true, 'usciti di nuovo in città');
  // controllo grafico automatico: le mappe all'aperto non devono avere caselle nere, figure mancanti o nomi che non c'entrano
  await A.click('#nav button[data-v="vMappa"]').catch(() => {});
  for (const nome of ['Viadotto Spezzato', 'Passo del Lupo', 'Bosco dei Corvi', 'Villaggio di Brina']) {
    await A.evaluate(n => invia({ t: 'vai', nome: n }), nome); await A.waitForFunction(n => S.st.luogo?.nome === n, nome, { timeout: 10000 });
    const p = await A.evaluate(() => Mappa.controllo()); v(!p.length, `mappa "${nome}" senza problemi grafici${p.length ? ': ' + p.join(' | ') : ''}`);
  }
  await A.screenshot({ path: OUT + '/viadotto.png' }).catch(() => {});
  // la vignetta degli avvisi non deve coprire il contenuto (nome del luogo, mappa) né essere enorme, e un fallimento è rosso
  await A.click('#nav button[data-v="vMappa"]').catch(() => {});
  const vign = await A.evaluate(() => { toast("Immagini gratuite finite per oggi: tornano dopo l'una di notte.", true, 5000); const t = $('#toast').getBoundingClientRect(), barra = document.querySelector('.barra').getBoundingClientRect(), titolo = document.querySelector('#vMappa h2, #vMappa .luogo-titolo, #luogoNome')?.getBoundingClientRect(); return { alto: t.height, fondo: t.bottom, barra: barra.bottom, titolo: titolo?.top ?? 999, rosso: $('#toast').classList.contains('errore') }; });
  v(vign.alto <= 60 && vign.fondo <= vign.barra + 6 && vign.rosso, `vignetta avvisi compatta, sopra la barra, rossa se è un errore (${JSON.stringify(vign)})`);
  // aspetto da videogioco (3.8): cornici in pixel, volti, scritte a macchina, striscioni, opzioni di comodità
  const stile = await A.evaluate(async () => {
    const r = { gs: document.body.classList.contains('gs'), carattere: await document.fonts.load('20px "Jersey 15"').then(f => f.length > 0).catch(() => false) };
    r.cornice = getComputedStyle(document.querySelector('.carta')).borderImageSource.includes('svg');
    r.hud = document.querySelectorAll('#hudGruppo .hud-pg img').length; r.hudVita = !!document.querySelector('#hudGruppo .vita i');
    mostraNarrazione('Una porta cigola in fondo al corridoio, e qualcosa respira nel buio.', null);
    r.scriveAPezzi = !!document.querySelector('#narrTesto .da-scrivere') && document.querySelector('#narrTesto .scritto').textContent.length < 20;
    r.testoIntero = document.querySelector('#narrTesto').textContent.length;
    r.voltoMaster = !!document.querySelector('#narrVolto img') && !document.querySelector('#narrVolto').hidden;
    await new Promise(q => setTimeout(q, 1800));
    r.finita = document.querySelector('#narrazione').classList.contains('finita') && !document.querySelector('#narrTesto .da-scrivere');
    mostraNarrazione('Seconda frase lunga abbastanza da non finire subito, per provare il tocco che la completa.', 'Oste Bruno'); document.querySelector('#narrTesto').click();
    r.toccoCompleta = document.querySelector('#narrazione').classList.contains('finita');
    renderDiario(); const f = document.querySelector('#diario li .faccia'); r.facceDiario = document.querySelectorAll('#diario li .faccia').length; r.facciaDisegnata = !!f && getComputedStyle(f).backgroundImage.startsWith('url(');
    striscione('Prova', 'striscione', Volti.master(), '', true); r.striscione = !!document.querySelector('.striscione b');
    const cv = document.querySelector('#fondoIngresso').getContext('2d'); document.querySelector('#ingresso').hidden = false; FondoVivo.giro(); document.querySelector('#ingresso').hidden = true;
    const d = cv.getImageData(0, 0, 200, 120).data; const colori = new Set(); for (let i = 0; i < d.length; i += 400) colori.add(d[i] + ',' + d[i + 1] + ',' + d[i + 2]); r.paesaggio = colori.size;
    document.querySelector('#optMenoMoto').click(); mostraNarrazione('Con meno movimento il testo compare tutto insieme.', null);
    r.menoMoto = document.body.classList.contains('meno-moto') && !document.querySelector('#narrTesto .da-scrivere'); document.querySelector('#optMenoMoto').click();
    document.querySelector('#optContrasto').click(); r.contrasto = document.body.classList.contains('contrasto'); document.querySelector('#optContrasto').click();
    document.querySelector('#optStileGioco').click(); r.classico = !document.body.classList.contains('gs') && getComputedStyle(document.querySelector('#hudGruppo')).display === 'none' && getComputedStyle(document.querySelector('.carta')).borderImageSource === 'none';
    document.querySelector('#optStileGioco').click(); r.tornato = document.body.classList.contains('gs');
    return r;
  });
  v(stile.gs && stile.cornice && stile.carattere, `aspetto da videogioco attivo: cornici in pixel e carattere caricato (${JSON.stringify({ gs: stile.gs, cornice: stile.cornice, carattere: stile.carattere })})`);
  v(stile.hud >= 1 && stile.hudVita, `gruppo a vista sopra la mappa: ${stile.hud} volti con barra della vita`);
  v(stile.scriveAPezzi && stile.testoIntero > 40 && stile.voltoMaster && stile.finita && stile.toccoCompleta, `narrazione da gioco di ruolo: volto, testo lettera per lettera, il tocco la completa (${JSON.stringify({ pezzi: stile.scriveAPezzi, volto: stile.voltoMaster, finita: stile.finita, tocco: stile.toccoCompleta })})`);
  v(stile.facceDiario > 3 && stile.facciaDisegnata, `diario con un volto per ogni voce (${stile.facceDiario})`);
  v(stile.striscione && stile.paesaggio > 8, `striscione sulla mappa e paesaggio animato all'ingresso (${stile.paesaggio} colori)`);
  v(stile.menoMoto && stile.contrasto && stile.classico && stile.tornato, `opzioni di comodità: meno movimento, alto contrasto, aspetto classico e ritorno (${JSON.stringify({ moto: stile.menoMoto, contrasto: stile.contrasto, classico: stile.classico, tornato: stile.tornato })})`);
  // mappa viva e colpi che si sentono (3.9)
  await A.click('#nav button[data-v="vMappa"]').catch(() => {});
  await A.evaluate(() => invia({ t: 'vai', nome: 'Villaggio di Pietrarossa' })); await A.waitForFunction(() => S.st.luogo?.nome === 'Villaggio di Pietrarossa', null, { timeout: 8000 });
  await A.evaluate(() => Mappa.setAmbiente({ ora: 22, meteo: 'sereno', stagione: 'estate' })); await A.waitForTimeout(3500);
  const notte = await A.evaluate(() => Mappa.vivo());
  await A.evaluate(() => Mappa.setAmbiente({ ora: 11, meteo: 'sereno', stagione: 'autunno' })); await A.waitForTimeout(3500);
  const giorno = await A.evaluate(() => Mappa.vivo());
  v(notte.particelle > 0 && notte.tipi.includes('lucciola') && giorno.alberi > 0 && giorno.chiome && giorno.tipi.some(t => t === 'foglia' || t === 'fumo'), `mappa viva: di notte le lucciole, di giorno foglie e fumo, chiome che ondeggiano (${JSON.stringify({ notte: notte.tipi, giorno: giorno.tipi, alberi: giorno.alberi })})`);
  const colpi = await A.evaluate(async () => {
    invia({ t: 'piazza_nemici', mostri: [{ nome: 'Goblin', numero: 2, pf: 7 }] });
    for (let i = 0; i < 40 && !Object.values(S.st.segnalini).some(s => s.tipo === 'nemico'); i++) await new Promise(q => setTimeout(q, 100));
    const nem = Object.keys(S.st.segnalini).find(k => S.st.segnalini[k].tipo === 'nemico'), r = { nemico: S.st.segnalini[nem]?.nome };
    Mappa.attacco(S.io); Mappa.proiettile(S.io, 'dardo di fuoco', nem); colpoASegno(nem, S.io, 0.5, false); Mappa.cura(S.io);
    r.effetti = [...new Set(Mappa.vivo().effetti)]; r.trema = getComputedStyle(document.querySelector('#mappa')).translate;
    Mappa.sconfitto(S.st.segnalini[nem], 'Goblin'); await new Promise(q => setTimeout(q, 700)); Mappa.disegna();
    S.provaAttesa = { prova: 'Percezione', cd: 12, t: Date.now() };
    gestisci({ t: 'dado', tiro: { chi: S.io, nome: 'Prova', formula: 'd20+3', dadi: [14], scartati: [6], modo: 'vantaggio', mod: 3, totale: 17, motivo: 'Percezione' } });
    r.prova = document.querySelector('.prova')?.textContent.replace(/\s+/g, ' ').trim(); document.querySelectorAll('.prova').forEach(e => e.remove());
    gestisci({ t: 'dado', tiro: { chi: S.io, nome: 'Prova', formula: 'd20', dadi: [1], totale: 1, motivo: 'Atletica', fallimento: true } });
    r.fiasco = !!document.querySelector('.epico.fiasco'); r.senzaPannello = !document.querySelector('.prova'); document.querySelectorAll('.epico').forEach(e => e.remove());
    return r;
  });
  v(/Goblin \d/.test(colpi.nemico || '') && ['attacco', 'proiettile', 'scoppio', 'colpo', 'polvere', 'cura'].every(t => colpi.effetti.includes(t)), `colpi che si sentono: mossa, dardo, scoppio, rinculo, polvere, cura su ${colpi.nemico} (${colpi.effetti.join(', ')})`);
  v(/Percezione vantaggio.*CD 12.*14.*6.*\+3.*=.*17.*Riuscita/.test(colpi.prova || '') && colpi.fiasco && colpi.senzaPannello, `tiro di prova da videogioco con difficoltà e verdetto; 1 naturale annunciato (${colpi.prova})`);
  // strumenti della mappa (4.0): righello, lavagna, aura, porte, clessidra, movimento, area con tiro salvezza, immagine
  await A.evaluate(() => { document.querySelectorAll('.prova, .epico, .striscione').forEach(e => e.remove()); $('#narrazione').hidden = true; window.scrollTo(0, 0); });
  // la pagina scorre quando si tocca un tasto: il riquadro della mappa si rilegge prima di ogni gesto
  let riq; const inquadra = async () => { riq = await A.evaluate(() => { const box = document.querySelector('#mappaBox'); box.scrollTop = 0; box.scrollLeft = 0; box.scrollIntoView({ block: 'center' }); const r2 = document.querySelector('#mappa').getBoundingClientRect(); return { x: r2.left, y: r2.top, t: Mappa.vivo().casella }; }); };
  const cella = (cx, cy) => [riq.x + (cx + 0.5) * riq.t, riq.y + (cy + 0.5) * riq.t];
  await A.click('#btnRighello'); await inquadra();
  await A.mouse.move(...cella(2, 3)); await A.mouse.down(); await A.mouse.move(...cella(4, 4), { steps: 3 }); await A.mouse.move(...cella(7, 5), { steps: 3 }); await A.mouse.up();
  const righello = await A.evaluate(() => ({ ...Mappa.vivo(), premuto: document.querySelector('#btnRighello').getAttribute('aria-pressed') }));
  const prima4 = await A.evaluate(() => ({ ...S.st.segnalini[S.io] }));
  await A.mouse.click(...cella(prima4.x + (prima4.x > 3 ? -2 : 2), prima4.y)); await A.waitForTimeout(200);
  const passi = await A.evaluate(() => ({ r: Mappa.vivo().riga, io: { ...S.st.segnalini[S.io] } }));
  await A.click('#btnRighello');
  v(righello.modo === 'misura' && righello.premuto === 'true' && righello.riga?.n === 5 && !righello.riga.via && passi.r?.via && passi.r.n >= 2 && passi.io.x === prima4.x && passi.io.y === prima4.y && await A.evaluate(() => Mappa.vivo().modo === null), `righello: ${righello.riga?.n} caselle in linea d'aria (attese 5), ${passi.r?.n} passi a piedi, e la figura non si muove mentre misuro (${JSON.stringify({ modo: righello.modo, via: passi.r?.via, io: passi.io, prima: prima4 })})`);
  await A.evaluate(() => { document.querySelector('#altriStrumenti').open = true; }); await A.click('#btnLavagna'); await inquadra();
  await A.mouse.move(...cella(3, 6)); await A.mouse.down(); for (const [x, y] of [[4, 6], [5, 7], [6, 7], [7, 6]]) await A.mouse.move(...cella(x, y), { steps: 4 }); await A.mouse.up();
  await A.waitForFunction(() => S.st.disegni?.disegni.length === 1, null, { timeout: 5000 });
  const tratto = await A.evaluate(() => ({ n: S.st.disegni.disegni[0].punti.length, mappa: Mappa.vivo().disegni }));
  await A.click('#btnLavagna'); await A.click('#btnLavagnaIndietro'); await A.waitForFunction(() => S.st.disegni?.disegni.length === 0, null, { timeout: 5000 });
  v(tratto.n >= 4 && tratto.mappa === 1, `lavagna: il tratto a mano (${tratto.n} punti) arriva a tutti e si può togliere`);
  await A.evaluate(() => invia({ t: 'segnalino', id: S.io, x: S.st.segnalini[S.io].x, y: S.st.segnalini[S.io].y, aura: 2 })); await A.waitForFunction(() => S.st.segnalini[S.io]?.aura === 2, null, { timeout: 5000 });
  const attrezzi = await A.evaluate(async () => {
    const r = { aure: Mappa.vivo().aure };
    const l = S.st.luogo, ed = l.edifici.find(e => { for (let y = e.y; y < e.y + e.h; y++) for (let x = e.x; x < e.x + e.w; x++) if (l.celle[y][x] === '+') { e._porta = [x, y]; return true; } return false; });
    if (ed) { const [px, py] = ed._porta, vicino = [[0, 1], [0, -1], [1, 0], [-1, 0]].map(([dx, dy]) => [px + dx, py + dy]).find(([x, y]) => !(x >= ed.x && x < ed.x + ed.w && y >= ed.y && y < ed.y + ed.h)); r.porta = Mappa.portaVicina(vicino[0], vicino[1])?.edificio?.id === ed.id; r.lontano = Mappa.portaVicina(0, 0) === null; mostraPassaggio({ edificio: ed }); r.barra = !document.querySelector('#passaggio').hidden && document.querySelector('#passTesto').textContent.includes(ed.nome); document.querySelector('#passNo').click(); r.chiusa = document.querySelector('#passaggio').hidden; }
    const blob = await new Promise(q => Mappa.immagine().toBlob(q, 'image/png')); r.immagine = blob.size;
    S.st.campagna.timerTurno = 30; invia({ t: 'combattimento', azione: 'inizia' });
    for (let i = 0; i < 40 && !S.st.combattimento?.attivo; i++) await new Promise(q => setTimeout(q, 100));
    for (let i = 0; i < 12 && S.st.combattimento.ordine[S.st.combattimento.turno].id !== S.io; i++) { invia({ t: 'combattimento', azione: 'prossimo' }); await new Promise(q => setTimeout(q, 250)); }
    r.mioTurno = S.st.combattimento.ordine[S.st.combattimento.turno].id === S.io; r.clessidra = !!document.querySelector('#clessidra i'); r.movimento = document.querySelector('.combat .movimento')?.textContent;
    const io = S.st.segnalini[S.io], meta = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => ({ x: io.x + dx * 2, y: io.y + dy * 2 })).find(q => Mappa.percorso(io, q));
    if (meta) { Mappa.azioneCasella(meta.x, meta.y, false); await new Promise(q => setTimeout(q, 300)); r.dopo = document.querySelector('.combat .movimento')?.textContent; }
    invia({ t: 'combattimento', azione: 'fine' });
    return r;
  });
  v(attrezzi.aure === 1 && attrezzi.porta && attrezzi.lontano && attrezzi.barra && attrezzi.chiusa, `aura attorno alla mia figura; arrivando a una porta l'app propone di entrare (${JSON.stringify({ aure: attrezzi.aure, porta: attrezzi.porta, barra: attrezzi.barra })})`);
  v(attrezzi.immagine > 5000 && attrezzi.clessidra && attrezzi.mioTurno && /Movimento: \d+ di \d+/.test(attrezzi.movimento || '') && attrezzi.dopo && attrezzi.dopo !== attrezzi.movimento, `mappa salvabile come immagine (${Math.round(attrezzi.immagine / 1024)} KB), clessidra del turno, movimento che si scala: «${attrezzi.movimento}» → «${attrezzi.dopo}»`);
  // regia (4.1): messaggi privati, ricerca nel diario, mazzo, cronaca, aiuto, azioni del turno, appunti del mondo, mano alzata, difficoltà
  await A.evaluate(id => { renderDestinatari(); $('#chatA').value = id; $('#chatTesto').value = 'Occhio alla botola segreta'; $('#formChat').requestSubmit(); }, idB);
  await B.waitForFunction(() => document.querySelector('#diario .sussurro-ev'), null, { timeout: 5000 });
  const privato = await A.evaluate(() => ({ mio: document.querySelector('#diario .sussurro-ev')?.textContent || '', server: S.st.diario.some(d => /botola segreta/.test(d.testo)), scelta: $('#chatA').options.length }));
  v(/In privato a .*botola segreta/.test(privato.mio) && !privato.server && privato.scelta >= 2 && /in privato: Occhio alla botola/.test(await B.textContent('#diario .sussurro-ev')), 'messaggio privato: lo vedono solo i due, con il lucchetto, e non entra nel diario di tutti');
  const cerca = await A.evaluate(() => { const c = $('#cercaDiario'); c.value = 'botola'; c.dispatchEvent(new Event('input')); const trovati = document.querySelectorAll('#diario li').length; c.value = 'parolachenonce'; c.dispatchEvent(new Event('input')); const niente = $('#diario').textContent; c.value = ''; c.dispatchEvent(new Event('input')); return { trovati, niente, tutti: document.querySelectorAll('#diario li').length }; });
  v(cerca.trovati === 1 && /Nessuna riga/.test(cerca.niente) && cerca.tutti > 3, `ricerca nel diario: ${cerca.trovati} riga con «botola» su ${cerca.tutti}`);
  await A.evaluate(() => $('#btnCarta').click()); await A.waitForSelector('.carta-pescata', { timeout: 5000 });
  await B.waitForFunction(() => /ne restano 53/.test(document.querySelector('#cartaUltima').textContent), null, { timeout: 5000 });
  v(/ di |Jolly/.test(await A.textContent('.carta-pescata span')) && await B.evaluate(() => !document.querySelector('.carta-pescata') && $('#btnMischia').hidden) && await A.evaluate(() => !$('#btnMischia').hidden), 'mazzo del tavolo: chi pesca vede la carta grande, gli altri la leggono; rimescola solo chi guida');
  await A.evaluate(() => { $('#ricordaTesto').value = 'La chiave d\'argento apre la torre'; $('#formRicorda').requestSubmit(); });
  await B.waitForFunction(() => /chiave d'argento/.test(document.querySelector('#cronaca').textContent), null, { timeout: 5000 });
  v(await B.evaluate(() => $('#formRicorda').hidden) && await A.evaluate(() => !$('#formRicorda').hidden), 'cosa ricorda il master: il fatto aggiunto da chi guida lo leggono tutti');
  await B.evaluate(id => invia({ t: 'aiuto', per: id }), await A.evaluate(() => S.io)); await A.waitForFunction(() => S.aiuto, null, { timeout: 5000 });
  await A.evaluate(() => { S.attesoTiro = null; tiraProva('Percezione'); }); await A.waitForFunction(() => (S.st.tiri || []).some(t => t.chi === S.io && t.modo === 'vantaggio' && /Percezione/.test(t.motivo)) || /vantaggio/.test(document.querySelector('#ultimoTiro').textContent), null, { timeout: 6000 });
  v(await A.evaluate(() => !S.aiuto), 'aiuto di un compagno: il tiro dopo è con vantaggio, una volta sola');
  const turno = await A.evaluate(async () => {
    invia({ t: 'combattimento', azione: 'inizia' });
    for (let i = 0; i < 40 && !S.st.combattimento?.attivo; i++) await new Promise(q => setTimeout(q, 100));
    for (let i = 0; i < 12 && S.st.combattimento.ordine[S.st.combattimento.turno].id !== S.io; i++) { invia({ t: 'combattimento', azione: 'prossimo' }); await new Promise(q => setTimeout(q, 250)); }
    const r = { azioni: [...document.querySelectorAll('.azioni-turno [data-azione]')].map(b => b.textContent), prima: document.querySelector('.combat .movimento')?.textContent };
    document.querySelector('[data-azione="scatto"]')?.click(); await new Promise(q => setTimeout(q, 300));
    r.dopo = document.querySelector('.combat .movimento')?.textContent; invia({ t: 'combattimento', azione: 'fine' }); return r;
  });
  const numero = t => Number((t || '').match(/Movimento: (\d+)/)?.[1]);
  v(turno.azioni.length === 7 && turno.azioni.includes('Scatto') && numero(turno.dopo) > numero(turno.prima), `azioni del turno a vista (${turno.azioni.join(', ')}); lo Scatto raddoppia il movimento: ${numero(turno.prima)} → ${numero(turno.dopo)} caselle`);
  await A.evaluate(() => { const ta = $('#aAppunti'); ta.value = 'Il sindaco è un doppiogiochista.'; ta.dispatchEvent(new Event('input')); $('#btnSalvaAppunti').click(); $('#aDifficolta').value = 'dura'; $('#aStile').value = 'acquerello'; $('#btnSalvaCamp').click(); });
  await B.waitForFunction(() => S.st.campagna.difficolta === 'dura' && S.st.campagna.stileImg === 'acquerello', null, { timeout: 5000 });
  await A.waitForFunction(() => /doppiogiochista/.test(S.st.appunti || ''), null, { timeout: 5000 });
  v(await B.evaluate(() => S.st.appunti === undefined && $('#cartaCampagna').hidden) && await A.evaluate(() => $('#aDifficolta').value === 'dura' && /doppiogiochista/.test($('#aAppunti').value)), 'appunti del mondo, difficoltà e stile delle illustrazioni: li salva chi guida, gli appunti non arrivano ai giocatori');
  await B.evaluate(() => $('#btnMano').click()); await A.waitForSelector('.reazione-vola', { timeout: 5000 });
  v(/✋/.test(await A.textContent('.reazione-vola')) && await B.evaluate(() => !$('#btnMano').hidden), 'un giocatore alza la mano e chi guida lo vede');
  // 4.2: primi passi guidati, gioco a distanza, mondi condivisi
  const guidati = await A.evaluate(async () => {
    $('#invitoGuida').hidden = true; scrivi('ta_passi', { fatti: {} }); mostraVista('vMappa'); renderPassi();
    const r = { visibile: !$('#primiPassi').hidden, testo: $('#primiPassi .pp-ora b')?.textContent, conta: $('#primiPassi summary .piccolo')?.textContent };
    $('#primiPassi [data-pp="parla"]').click(); r.vista = S.vista; r.punta = $('#formChat').classList.contains('pp-punta');
    invia({ t: 'chat', testo: 'Saluto l\'oste' }); r.dopoParla = $('#primiPassi .pp-ora b')?.textContent;
    tira('d20', 'prova'); r.dopoDado = $('#primiPassi .pp-ora b')?.textContent; r.fatti = leggi('ta_passi', {}).fatti;
    $('#primiPassi [data-pp="chiudi"]').click(); r.nascosto = $('#primiPassi').hidden && leggi('ta_passi', {}).chiuso === true;
    return r;
  });
  v(guidati.visibile && guidati.testo === 'Di\' al master cosa fai' && guidati.conta === '1 di 5' && guidati.vista === 'vDiario' && guidati.punta && guidati.dopoParla === 'Tira un dado' && guidati.dopoDado === 'Muoviti sulla mappa' && guidati.nascosto, `primi passi: l'elenco si spunta da solo mentre giochi (${Object.keys(guidati.fatti).join(', ')}), «Mostrami» porta nel punto giusto, si può nascondere`);
  await A.evaluate(() => { mostraVista('vAltro'); $('#aDifferito').value = '24'; $('#btnSalvaCamp').click(); });
  await B.waitForFunction(() => S.st.campagna.differito === 24 && !$('#giroStato').hidden, null, { timeout: 5000 });
  const lontano1 = await B.textContent('#giroTesto');
  await A.evaluate(() => { $('#chatA').value = ''; $('#chatTesto').value = 'Oggi esploro la torre'; $('#formChat').requestSubmit(); });
  await B.waitForFunction(() => S.st.giro?.scade > 0, null, { timeout: 5000 });
  await A.waitForFunction(() => /manca Marco/.test($('#giroTesto').textContent), null, { timeout: 5000 }).catch(() => {});
  const lontano2 = await B.textContent('#giroTesto'), lontanoA = await A.textContent('#giroTesto');
  v(/Gioco a distanza: scrivi cosa fa il tuo personaggio quando vuoi/.test(lontano1) && /tocca a te dire cosa fai.*al più tardi domani alle \d/.test(lontano2) && /manca Marco/.test(lontanoA) && await A.evaluate(() => !$('#btnGiroOra').hidden), `gioco a distanza: «${lontano2}» (prima: «${lontano1}»; chi ha creato: «${lontanoA}»)`);
  const ripresa = await B.evaluate(() => { S.st.diario.push({ t: Date.now(), tipo: 'narrazione', chi: 'master', testo: 'La torre trema: dal buio scende una figura.' }); $('#narrazione').hidden = true; riprendiDistanza(); const r = { vista: !$('#narrazione').hidden, testo: $('#narrTesto').textContent }; S.st.diario.push({ t: Date.now(), tipo: 'chat', chi: S.io, testo: 'Mi nascondo' }); $('#narrazione').hidden = true; riprendiDistanza(); r.dopo = $('#narrazione').hidden; S.st.diario.splice(-2); return r; });
  v(ripresa.vista && /La torre trema/.test(ripresa.testo) && ripresa.dopo, 'gioco a distanza: chi rientra trova l\'ultima risposta del master, ma non se ha già scritto dopo');
  await A.evaluate(() => { $('#aDifferito').value = '0'; $('#btnSalvaCamp').click(); }); await B.waitForFunction(() => !S.st.campagna.differito, null, { timeout: 5000 });
  await A.evaluate(() => $('#btnMondoCrea').click()); await A.waitForFunction(() => /^[A-Z0-9]{6,12}-[A-Z0-9]{8}$/.test($('#mondoCodice').textContent), null, { timeout: 5000 });
  const codMondo = await A.textContent('#mondoCodice'), nomeMondo = await A.evaluate(() => S.st.campagna.nome), luoghiA = await A.evaluate(() => Object.keys(S.st.luoghi).length);
  const N = await nuovo({ width: 412, height: 915 });
  await N.goto('http://localhost:8765/'); await N.click('#btnPrimiPassi'); await N.fill('#ppNome', 'Giulia'); await N.click('#dlgAzioni button.pieno');
  await N.waitForSelector('#gioco:not([hidden])', { timeout: 8000 });
  const primi = await N.evaluate(() => ({ nome: S.st.campagna.nome, avv: S.st.avventura?.id, carta: !$('#primiPassi').hidden, passo: $('#primiPassi .pp-ora b')?.textContent, invito: $('#invitoGuida').hidden }));
  v(primi.nome === 'Primi passi' && primi.avv === 'primi' && primi.carta && primi.passo === 'Crea il tuo personaggio' && primi.invito, 'dall\'ingresso «Mai giocato?» apre l\'avventura dei primi passi con l\'elenco guidato');
  await N.evaluate(() => invia({ t: 'scheda', pg: Regole.nuovo(regole(), { nome: 'Tessa', razza: 'Halfling', classe: 'Ladro', carBase: { for: 8, des: 15, cos: 12, int: 12, sag: 12, car: 14 } }) }));
  await N.waitForFunction(() => S.st.luogo?.nome === 'Locanda del Gallo Nero', null, { timeout: 12000 });
  v(await N.evaluate(() => $('#primiPassi .pp-ora b')?.textContent === 'Di\' al master cosa fai' && $('#primiPassi summary .piccolo').textContent === '1 di 5'), 'creato il personaggio il primo passo si spunta e l\'avventura comincia da sola alla locanda');
  await N.evaluate(c => { mostraVista('vAltro'); $('#mondoEntra').value = c; $('#formMondo').requestSubmit(); }, codMondo);
  await N.click('#dlgAzioni button.pieno'); await N.waitForFunction(n => S.st.campagna.mondoDa === n, nomeMondo, { timeout: 8000 });
  const arrivato = await N.evaluate(() => ({ luoghi: Object.keys(S.st.luoghi).length, scritta: $('#mondoDa').textContent, appunti: (S.st.appunti || '').length })), nascostoB = await B.evaluate(() => $('#boxMondoCodice').hidden && $('#cartaCampagna').hidden && S.st.mondoChiave === undefined);
  v(arrivato.luoghi >= luoghiA && /nel mondo/.test(arrivato.scritta) && arrivato.appunti > 10 && nascostoB, `mondo condiviso: con il codice ${arrivato.luoghi} luoghi (su ${luoghiA}) e gli appunti arrivano in un'altra campagna; il codice lo vede solo chi ha creato la campagna (${JSON.stringify({ ...arrivato, nascostoB })})`);
  // 4.3: segreto al master, frecce, calendario, carte da collezione, appunti da PDF, ritratto illustrato
  await A.evaluate(() => mostraVista('vDiario'));
  v(await A.evaluate(() => { renderDestinatari(); return [...$('#chatA').options].some(o => o.value === 'master'); }), 'nei messaggi si può scrivere «solo il master (in segreto)»');
  await A.evaluate(() => { renderDestinatari(); $('#chatA').value = 'master'; $('#chatTesto').value = 'Di nascosto prendo la chiave'; $('#formChat').requestSubmit(); $('#chatA').value = ''; });
  await A.waitForFunction(() => S.sussurri.some(x => /In segreto al master: Di nascosto/.test(x.testo)), null, { timeout: 6000 });
  v(await B.evaluate(() => !S.sussurri.some(x => /Di nascosto/.test(x.testo)) && !S.st.diario.some(d => /Di nascosto/.test(d.testo))), 'il segreto al master non lo vede nessun altro');
  const frecce = await A.evaluate(async () => {
    const p = clona(mioPg()); p.equip = [...p.equip.filter(e => !/^Frecce|^Arco/.test(e.nome)), { nome: 'Arco corto', qta: 1, indossato: true }, { nome: 'Frecce', qta: 2, indossato: false }];
    invia({ t: 'scheda', pg: p }); for (let i = 0; i < 30 && !mioPg().equip.some(e => e.nome === 'Arco corto'); i++) await new Promise(q => setTimeout(q, 100));
    const r = [usaMunizione(mioPg(), 'Arco corto'), usaMunizione(mioPg(), 'Arco corto'), usaMunizione(mioPg(), 'Arco corto')];
    await new Promise(q => setTimeout(q, 600)); return { r, resta: Regole.munizioni(mioPg(), 'Arco corto').n, spese: mioPg().munSpese?.Frecce };
  });
  v(frecce.r.join() === 'true,true,false' && frecce.resta === 0 && frecce.spese === 2, `frecce: due tiri, al terzo l'arco non tira (${JSON.stringify(frecce)})`);
  await A.evaluate(async () => { invia({ t: 'combattimento', azione: 'inizia' }); for (let i = 0; i < 30 && !S.st.combattimento?.attivo; i++) await new Promise(q => setTimeout(q, 100)); invia({ t: 'combattimento', azione: 'fine' }); });
  await A.waitForFunction(() => Regole.munizioni(mioPg(), 'Arco corto').n === 1, null, { timeout: 6000 }).catch(() => {});
  v(await A.evaluate(() => Regole.munizioni(mioPg(), 'Arco corto').n === 1 && !Object.keys(mioPg().munSpese || {}).length), 'finito lo scontro si raccoglie metà delle frecce tirate');
  const cal = await A.evaluate(() => { const prima = S.st.mondo.calendario; S.st.mondo.calendario = { giorno: 14, stagione: 'primavera', inizioStagione: 1 }; S.st.missioni = [...(S.st.missioni || []), { id: 'qz', titolo: 'La lettera', stato: 'accettata', scadenza: 15 }]; renderMondo(); aggiornaTesta(); const r = { mondo: $('#mondo').textContent, testa: $('#tSotto').textContent }; S.st.mondo.calendario = prima; S.st.missioni = S.st.missioni.filter(x => x.id !== 'qz'); renderMondo(); return r; });
  v(/Giorno del Sole, 14 di primavera/.test(cal.mondo) && /14 di primavera/.test(cal.testa) && /Prossima festa: Festa dei Fiori, tra 1 giorno/.test(cal.mondo) && /La lettera: scade tra 1 giorno/.test(cal.mondo), `calendario: «${cal.testa.split('·').pop().trim()}», festa vicina e scadenze delle missioni`);
  await A.evaluate(() => invia({ t: 'piazza_nemici', mostri: [{ nome: 'Coboldo', numero: 1, pf: 5 }] }));
  await B.waitForFunction(() => S.st.bestiario?.Coboldo && !$('#boxCarte').hidden && /Coboldo/.test($('#carteLista').textContent), null, { timeout: 6000 });
  v(true, 'carte da collezione: il mostro incontrato compare nella collezione di tutti');
  const pdf = (() => { const testo = 'Il drago dorme sotto la torre di Argentea'; const og = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>', null, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>']; const flusso = `BT /F1 18 Tf 50 700 Td (${testo}) Tj ET`; og[3] = `<< /Length ${flusso.length} >>\nstream\n${flusso}\nendstream`; let out = '%PDF-1.4\n'; const pos = []; og.forEach((o, i) => { pos.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; }); const x = out.length; out += `xref\n0 ${og.length + 1}\n0000000000 65535 f \n${pos.map(p => String(p).padStart(10, '0') + ' 00000 n \n').join('')}trailer\n<< /Size ${og.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF`; return Buffer.from(out, 'latin1'); })();
  await A.evaluate(() => { mostraVista('vAltro'); $('#aAppunti').value = ''; });
  await A.setInputFiles('#fileAppunti', { name: 'mondo.pdf', mimeType: 'application/pdf', buffer: pdf });
  await A.waitForFunction(() => /drago dorme sotto la torre/.test($('#aAppunti').value), null, { timeout: 15000 }).catch(() => {});
  v(await A.evaluate(() => /drago dorme sotto la torre/.test($('#aAppunti').value)), 'appunti del mondo caricati da un PDF');
  await A.evaluate(() => { mostraVista('vScheda'); S.viewPg = S.io; renderScheda(); document.querySelector('[data-ritratto]').click(); });
  await A.waitForFunction(() => mioPg().ritratto, null, { timeout: 20000 }).catch(() => {});
  const rit = await A.evaluate(async () => { renderScheda(); await new Promise(q => setTimeout(q, 800)); const im = document.querySelector('.ritratto.illustrato img'); return { id: mioPg().ritratto, img: !!im && im.naturalWidth > 0 }; });
  v(rit.id && rit.img, 'ritratto illustrato creato dalla scheda e mostrato al posto della figura (tocco per tornare alla figura)');
  // 4.4: salita di livello guidata, diario del personaggio, viaggio, scheda stampabile, film, mostri inventati, accessibilità, il vostro mese
  const lvl = await A.evaluate(async () => {
    mostraVista('vScheda'); S.viewPg = S.io; const p0 = mioPg(), liv0 = p0.livello;
    const r = { passi: [] }; const pr = livelloGuidato(clona({ ...p0, livello: liv0 - 1, pfMax: p0.pfMax - 6 }));
    for (let i = 0; i < 6; i++) { await new Promise(q => setTimeout(q, 250)); if (!$('#dlg').open) break; r.passi.push($('#dlgCorpo h2')?.textContent); $('#dlgAzioni button').click(); }
    await pr.catch(() => {}); return r;
  });
  v(/Livello \d+!/.test(lvl.passi[0] || ''), `salita di livello guidata: ${lvl.passi.join(' → ')}`);
  await B.evaluate(() => { mostraVista('vScheda'); S.viewPg = S.io; renderScheda(); document.querySelector('[data-diario-pg]').click(); });
  await B.waitForFunction(() => (mioPg().pagine || []).length && document.querySelector('.pagina-pg'), null, { timeout: 15000 }).catch(() => {});
  v(await B.evaluate(() => !!document.querySelector('.pagina-pg') && /Diario di/.test(document.querySelector('.diario-pg summary').textContent)), 'diario del personaggio: la pagina scritta dal master compare nella scheda');
  const [stampa] = await Promise.all([A.waitForEvent('popup', { timeout: 8000 }).catch(() => null), A.evaluate(() => { window.print = () => {}; stampaScheda(mioPg()); })]);
  if (stampa) { await stampa.waitForLoadState().catch(() => {}); }
  const fog = stampa ? await stampa.evaluate(() => ({ car: document.querySelectorAll('.car').length, testo: document.body.innerText })).catch(e => ({ errore: String(e.message).slice(0, 160) })) : { nessunPopup: true };
  if (!(fog?.car === 6)) console.log('DEBUG stampa', JSON.stringify(fog).slice(0, 400));
  v(fog && fog.car === 6 && !/object Object|undefined|NaN/.test(fog.testo) && /Classe armatura/i.test(fog.testo) && /Tiri salvezza/i.test(fog.testo) && /Abilità/i.test(fog.testo), 'scheda stampabile impaginata come quella di carta (caratteristiche, CA, tiri salvezza, abilità)');
  if (stampa) await stampa.close();
  await A.evaluate(() => { mostraVista('vMappa'); });
  const viag = await A.evaluate(async () => {
    $('#vaiNome').value = 'Rocca del Vento'; $('#btnViaggio').click(); await new Promise(q => setTimeout(q, 300));
    const ok = $('#dlg').open && !!$('#viaggioMeta'); $('#dlgAzioni button').click();
    for (let i = 0; i < 80 && !/Rocca del Vento/.test(S.st.luogo?.nome || ''); i++) await new Promise(q => setTimeout(q, 150));
    return { ok, luogo: S.st.luogo?.nome, giorni: S.st.diario.filter(d => /di viaggio/.test(d.testo)).length, bar: !$('#viaggioBar').hidden };
  });
  v(viag.ok && /Rocca del Vento/.test(viag.luogo || '') && viag.giorni >= 1, `viaggio a tappe: ${viag.giorni} giorni nel diario, arrivo a «${viag.luogo}»${/Strada/.test(viag.luogo) ? ' (agguato lungo la strada, con il tasto Riprendi)' : ''}`);
  if (/Strada/.test(viag.luogo || '')) { await A.evaluate(() => $('#btnRiprendi').click()); await A.waitForFunction(() => S.st.luogo?.nome === 'Rocca del Vento' || /Strada/.test(S.st.luogo?.nome), null, { timeout: 15000 }).catch(() => {}); }
  await A.evaluate(() => { S.filmAtteso = Date.now(); riassuntoArrivato({ riassunto: true, testo: 'Il gruppo partì da Pietrarossa. Poi trovò la torre. Infine sconfisse i goblin.' }); });
  const filmOk = await A.evaluate(async () => { await new Promise(q => setTimeout(q, 700)); const f = document.querySelector('.film'); const r = { c: !!f, img: f?.querySelectorAll('img').length || 0, sotto: f?.querySelector('.film-sotto')?.textContent }; f?.querySelector('.film-chiudi')?.click(); return r; });
  v(filmOk.c && filmOk.img >= 1 && /Pietrarossa/.test(filmOk.sotto || ''), `nelle puntate precedenti con le immagini: ${filmOk.img} quadri e sottotitoli («${filmOk.sotto}»)`);
  await A.evaluate(() => { mostraVista('vAltro'); const f = $('#formMostroHb'); f.nome.value = 'Lupo di cenere'; f.pf.value = 20; f.ca.value = 13; f.descrizione.value = 'un lupo di brace'; f.requestSubmit(); });
  await A.waitForFunction(() => /Lupo di cenere/.test($('#listaHomebrew').textContent), null, { timeout: 6000 }).catch(() => {});
  await A.evaluate(() => { mostraVista('vMappa'); }); await A.evaluate(() => { const b = document.querySelector('[data-hb-scena="Lupo di cenere"]'); b?.click(); });
  await A.waitForFunction(() => Object.values(S.st.segnalini).some(x => /Lupo di cenere/.test(x.nome)), null, { timeout: 6000 }).catch(() => {});
  v(await A.evaluate(() => Object.values(S.st.segnalini).some(x => /Lupo di cenere/.test(x.nome))) && await B.evaluate(() => $('#cartaCampagna').hidden), 'mostro inventato da chi guida, messo in scena sulla mappa');
  const acc = await A.evaluate(() => { $('#optDaltonici').click(); const r = { cls: document.body.classList.contains('daltonici'), verde: getComputedStyle(document.body).getPropertyValue('--verde').trim(), bene: coloreBene() }; $('#optDaltonici').click(); return r; });
  v(acc.cls && acc.verde === '#3d8fe0' && acc.bene === '#7fd4ff', 'colori per daltonici: niente rosso contro verde');
  v(await A.evaluate(() => [...document.querySelectorAll('[data-reazione]')].every(b => b.getAttribute('aria-label'))), 'i pulsanti con le sole faccine hanno un nome da leggere a voce');
  await A.evaluate(() => $('#btnMese').click()); await A.waitForFunction(() => $('#dlg').open && /📅/.test($('#dlgCorpo h2')?.textContent || ''), null, { timeout: 6000 }).catch(() => {});
  const mese = await A.evaluate(() => ({ h: $('#dlgCorpo h2')?.textContent, numeri: document.querySelectorAll('.mese-numeri div').length }));
  await A.evaluate(() => $('#dlg').close());
  v(/📅/.test(mese.h || '') && mese.numeri >= 2, `il vostro mese: «${mese.h}» con ${mese.numeri} numeri`);
  // 4.5: caccia al tesoro, rompicapi da toccare, torneo, animali che crescono, casa che cresce, avventure scritte da voi
  await A.evaluate(() => { mostraVista('vDiario'); document.querySelector('#mondoVivo details:last-of-type')?.setAttribute('open', ''); document.querySelector('#mondoVivo [data-caccia="nuova"]').click(); });
  await B.waitForFunction(() => document.querySelector('#mondoVivo .caccia [data-caccia="scava"]'), null, { timeout: 15000 }).catch(() => {});
  const cacciaB = await B.evaluate(() => ({ indizi: document.querySelectorAll('#mondoVivo .caccia .indizi li').length, nascosti: document.querySelectorAll('#mondoVivo .caccia .indizi li.nascosto').length, luogo: S.st.caccia?.luogo }));
  const cacciaA = await A.evaluate(() => /lo vedi solo tu/.test(document.querySelector('#mondoVivo .caccia')?.textContent || ''));
  v(cacciaB.indizi === 3 && cacciaB.nascosti === 2 && !cacciaB.luogo && cacciaA, 'mappa del tesoro: Marco vede il primo indizio e due da decifrare, il posto lo vede solo chi guida');
  await B.evaluate(() => document.querySelector('#mondoVivo [data-caccia="scava"]').click());
  await B.waitForFunction(() => S.st.diario.some(d => /il tesoro non è qui/.test(d.testo)), null, { timeout: 8000 }).catch(() => {});
  v(await B.evaluate(() => S.st.diario.some(d => /il tesoro non è qui/.test(d.testo))), 'Marco scava dal tasto: nel posto sbagliato non c\'è niente');
  await A.evaluate(() => { const f = document.querySelector('[data-rompicapo-nuovo]'); f.forma.value = 'leve'; f.trappola.value = 'gas'; f.requestSubmit(); });
  await A.waitForFunction(() => S.st.rompicapo?.soluzione, null, { timeout: 8000 }).catch(() => {});
  const sol = await A.evaluate(() => S.st.rompicapo?.soluzione);
  await B.evaluate(() => mostraVista('vDiario')); await B.waitForFunction(() => document.querySelectorAll('#mondoVivo .leva').length === 4, null, { timeout: 8000 }).catch(() => {});
  for (const [i, su] of (sol || []).entries()) if (su) await B.click(`#mondoVivo [data-leva="${i}"]`);
  const leve = await B.evaluate(() => [...document.querySelectorAll('#mondoVivo .leva')].map(b => b.getAttribute('aria-pressed') === 'true'));
  v(sol && JSON.stringify(leve) === JSON.stringify(sol), `le leve si alzano e si abbassano toccandole (${leve.map(x => x ? 'su' : 'giù').join(', ')})`);
  await B.click('#mondoVivo [data-rompicapo="prova"]');
  await B.waitForFunction(() => !S.st.rompicapo && S.st.diario.some(d => /risolve il rompicapo/.test(d.testo)), null, { timeout: 8000 }).catch(() => {});
  v(await B.evaluate(() => !S.st.rompicapo && !document.querySelector('#mondoVivo .rompicapo')), 'Marco risolve il rompicapo delle leve: il riquadro sparisce');
  await A.evaluate(() => document.querySelector('#mondoVivo [data-torneo="apri"]').click());
  await B.waitForFunction(() => document.querySelector('#mondoVivo [data-torneo="tira"]'), null, { timeout: 8000 }).catch(() => {});
  await B.evaluate(() => document.querySelector('#mondoVivo [data-torneo="tira"]')?.click());
  await B.waitForFunction(() => S.st.torneo?.tiri?.[0]?.[S.io], null, { timeout: 8000 }).catch(() => {});
  v(await B.evaluate(() => !!S.st.torneo?.tiri?.[0]?.[S.io] && /Torneo/.test(document.querySelector('#mondoVivo .torneo')?.textContent || '')), 'torneo: Marco tira dal tasto e il suo punteggio compare nella prova');
  await A.evaluate(() => invia({ t: 'torneo_chiudi' }));
  await A.evaluate(() => invia({ t: 'compagno_nuovo', per: Object.keys(S.st.pg).find(id => id !== S.io), nome: 'Bricco', specie: 'mulo' }));
  await B.waitForFunction(() => mioPg()?.compagni?.some(a => a.nome === 'Bricco'), null, { timeout: 8000 }).catch(() => {});
  await B.evaluate(() => { mostraVista('vScheda'); S.viewPg = S.io; renderScheda(); });
  const ani = await B.evaluate(() => ({ barra: !!document.querySelector('.animale .barra-px'), tasto: !!document.querySelector('[data-addestra]') }));
  await B.evaluate(() => document.querySelector('[data-addestra]')?.click());
  await B.waitForFunction(() => S.st.diario.some(d => /addestra Bricco/.test(d.testo)), null, { timeout: 8000 }).catch(() => {});
  v(ani.barra && ani.tasto && await B.evaluate(() => S.st.diario.some(d => /addestra Bricco/.test(d.testo)) && (mioPg().compagni.find(a => a.nome === 'Bricco').px || 0) > 0), 'animale che cresce: barra dei punti, tasto Addestra e punti guadagnati');
  await A.evaluate(() => invia({ t: 'gruppo', op: 'oro', delta: 1600 })); await A.waitForTimeout(400);
  await A.evaluate(() => { mostraVista('vScheda'); if (!S.st.base) document.querySelector('[data-casa="casa"]')?.click(); });
  await A.waitForFunction(() => document.querySelector('[data-casa="livello"]'), null, { timeout: 8000 }).catch(() => {});
  await A.evaluate(() => document.querySelector('[data-casa="livello"]')?.click());
  await A.waitForFunction(() => S.st.base?.livello === 2, null, { timeout: 8000 }).catch(() => {});
  v(await A.evaluate(() => S.st.base?.livello === 2 && /Locanda/.test(document.querySelector('#tesoro').textContent)), 'la casa del gruppo diventa una locanda dal tasto');
  await A.evaluate(() => { mostraVista('vAltro'); $('#boxAvvMie').open = true; const f = $('#formAvvMia'); f.titolo.value = 'Il faro spento'; f.sinossi.value = 'Qualcuno ha spento il faro.'; const sc = $('#avvScene').lastElementChild; sc.querySelector('[name=luogo]').value = 'Faro di Capo Nero'; sc.querySelector('[name=leggi]').value = 'Il faro è buio da tre notti.'; sc.querySelector('[name=nemici]').value = '2 Goblin'; $('#btnAvvScena').click(); const s2 = $('#avvScene').lastElementChild; s2.querySelector('[name=luogo]').value = 'Grotta sotto il faro'; s2.querySelector('[name=obiettivo]').value = 'Riaccendere la lanterna'; });
  const scene = await A.evaluate(() => [...$('#avvScene').querySelectorAll('legend')].map(l => l.textContent));
  await A.evaluate(() => $('#formAvvMia').requestSubmit());
  await A.waitForFunction(() => /Il faro spento/.test($('#listaAvvMie').textContent), null, { timeout: 8000 }).catch(() => {});
  await A.evaluate(() => document.querySelector('[data-avv-condividi]')?.click());
  await A.waitForFunction(() => document.querySelector('#listaAvvMie .codice-mondo'), null, { timeout: 8000 }).catch(() => {});
  const avvUi = await A.evaluate(() => ({ lista: /Il faro spento.*2 scene/.test($('#listaAvvMie').textContent), codice: document.querySelector('#listaAvvMie .codice-mondo')?.textContent, scelta: [...document.querySelectorAll('#smAvvId option')].some(o => /Il faro spento/.test(o.textContent)) }));
  v(JSON.stringify(scene) === '["Scena 1","Scena 2"]' && avvUi.lista && /^[A-Z0-9]+-[A-Z0-9]{8}$/.test(avvUi.codice || '') && avvUi.scelta, `avventura scritta nell'editor a scene, salvata e condivisa (codice ${avvUi.codice})`);
  v(await B.evaluate(() => $('#boxAvvMie').hidden), 'l\'editor delle avventure non compare ai giocatori');
  await A.screenshot({ path: OUT + '/45-avventure.png', fullPage: false });
  // 4.6: mercato, duello, giornale, patti, scelte rapide, biblioteca, tema, album, allenamento, notte
  await B.evaluate(() => invia({ t: 'scheda', pg: { ...mioPg(), equip: [...(mioPg().equip || []), { nome: 'Lanterna cieca', qta: 1 }] } }));
  await B.waitForFunction(() => mioPg().equip.some(e => e.nome === 'Lanterna cieca'), null, { timeout: 6000 }).catch(() => {});
  await B.evaluate(() => { mostraVista('vScheda'); renderTesoro(); $('#bancOggetto').value = 'Lanterna cieca'; $('#bancPrezzo').value = 0; $('#formBancarella').requestSubmit(); });
  await A.waitForFunction(() => document.querySelector('#tesoro [data-banc-compra]'), null, { timeout: 8000 }).catch(() => {});
  await A.evaluate(() => { mostraVista('vScheda'); document.querySelector('#tesoro [data-banc-compra]')?.click(); });
  await A.waitForFunction(() => mioPg().equip.some(e => e.nome === 'Lanterna cieca'), null, { timeout: 8000 }).catch(() => {});
  v(await A.evaluate(() => mioPg().equip.some(e => e.nome === 'Lanterna cieca') && !(S.st.bancarella || []).length), 'mercato tra di voi: Marco regala la lanterna dalla bancarella e Vincenzo la prende');
  await A.evaluate(() => { mostraVista('vDiario'); const f = document.querySelector('[data-duello-sfida]'); f.con.value = 'campione'; f.requestSubmit(); });
  await A.waitForFunction(() => document.querySelector('#mondoVivo [data-duello="colpo"]'), null, { timeout: 8000 }).catch(() => {});
  for (let i = 0; i < 60; i++) { const fatto = await A.evaluate(() => { if (S.st.duello?.finito) return true; document.querySelector('#mondoVivo [data-duello="colpo"]')?.click(); return false; }); if (fatto) break; await A.waitForTimeout(250); }
  v(await A.evaluate(() => S.st.duello?.finito && /Vince/.test(document.querySelector('#mondoVivo .duello')?.textContent || '')), 'duello amichevole con il campione dell\'arena, colpo dopo colpo dal tasto');
  await A.evaluate(() => document.querySelector('#mondoVivo [data-duello="chiudi"]')?.click());
  await A.evaluate(() => document.querySelector('#mondoVivo [data-giornale]')?.click());
  await B.waitForFunction(() => document.querySelector('#giornale .giornale h3'), null, { timeout: 15000 }).catch(() => {});
  v(await B.evaluate(() => { mostraVista('vDiario'); return document.querySelectorAll('#giornale .giornale section').length >= 1 && !!document.querySelector('#giornale .giornale h3')?.textContent; }), 'giornale del regno: il numero nuovo arriva anche a Marco, con titoli e articoli');
  await A.evaluate(() => { const f = document.querySelector('[data-patto-nuovo]'); f.png.value = 'Oste Bruno'; f.cosa.value = 'pagare il conto della rissa'; f.requestSubmit(); });
  await B.waitForFunction(() => /Oste Bruno/.test(document.querySelector('#mondoVivo .patti')?.textContent || ''), null, { timeout: 8000 }).catch(() => {});
  v(await B.evaluate(() => /Il gruppo deve a\s*Oste Bruno/.test(document.querySelector('#mondoVivo .patti')?.textContent || '')), 'patti e debiti: il patto con l\'oste compare a tutti');
  await B.evaluate(() => { mostraVista('vMappa'); mostraScelte(['Parla con l\'oste', 'Cerca indizi', 'Esci in strada']); });
  const sc3 = await B.evaluate(() => ({ n: document.querySelectorAll('#scelteRapide [data-scelta]').length, vis: !$('#scelteRapide').hidden }));
  const narrPrima = await A.evaluate(() => S.st.diario.filter(d => d.tipo === 'narrazione').length);
  await B.evaluate(() => document.querySelector('#scelteRapide [data-scelta="1"]').click());
  await A.waitForFunction(n => S.st.diario.filter(d => d.tipo === 'narrazione').length > n, narrPrima, { timeout: 15000 }).catch(() => {});
  v(sc3.n === 3 && sc3.vis && await A.evaluate(n => S.st.diario.filter(d => d.tipo === 'narrazione').length > n && S.st.diario.some(d => d.tipo !== 'narrazione' && /Cerca indizi/.test(d.testo)), narrPrima), 'scelte rapide: Marco tocca un\'idea, parte come sua azione e il master risponde');
  await B.evaluate(() => { mostraVista('vDadi'); document.querySelector('.biblioteca').open = true; $('#cercaRegola').value = 'prono'; $('#cercaRegola').dispatchEvent(new Event('input')); document.querySelector('#bibliotecaVoci [data-voce]').click(); });
  const bib = await B.evaluate(() => ({ h: $('#dlgCorpo h2')?.textContent, ic: $('#dlgCorpo .voce-disegno')?.textContent }));
  await B.evaluate(() => $('#dlg').close());
  v(bib.h === 'Prono' && bib.ic === '🛌', 'biblioteca delle regole: cercando «prono» si apre la sua scheda con il disegno');
  await B.evaluate(() => { mostraVista('vScheda'); S.viewPg = S.io; renderScheda(); const sel = document.querySelector('[data-tema]'); sel.value = 'arpa'; sel.dispatchEvent(new Event('change', { bubbles: true })); });
  await B.waitForFunction(() => mioPg().tema === 'arpa', null, { timeout: 6000 }).catch(() => {});
  v(await A.evaluate(id => S.st.pg[id]?.tema === 'arpa', await B.evaluate(() => S.io)), 'tema personale: Marco sceglie l\'arpa elfica e anche gli altri la sentiranno sui suoi critici');
  await A.evaluate(() => invia({ t: 'illustra' })); await A.waitForFunction(() => S.st.diario.some(d => d.tipo === 'illustrazione'), null, { timeout: 20000 }).catch(() => {});
  await A.evaluate(() => $('#btnAlbum').click());
  await A.waitForFunction(() => $('#dlg').open && /Album/.test($('#dlgCorpo h2')?.textContent || ''), null, { timeout: 8000 }).catch(() => {});
  const alb = await A.evaluate(() => { const f = document.querySelector('[data-foto]'); f?.click(); const g = document.querySelector('.album-grande'); const r = { foto: document.querySelectorAll('[data-foto]').length, grande: !!g?.querySelector('img') }; g?.remove(); $('#dlg').close(); return r; });
  v(alb.foto >= 1 && alb.grande, `album della campagna: ${alb.foto} illustrazioni divise per serata, si aprono in grande`);
  const modoNotte = await A.evaluate(() => { $('#optNotte').value = 'si'; $('#optNotte').dispatchEvent(new Event('change')); const r = document.body.classList.contains('notte'); $('#optNotte').value = 'no'; $('#optNotte').dispatchEvent(new Event('change')); return r && !document.body.classList.contains('notte'); });
  v(modoNotte, 'modalità notte: luci basse accese e spente dalle opzioni');
  // 4.7: icona, scorciatoie, foto d'installazione, icone in pixel, tema chiaro
  const man = await A.evaluate(async () => { const m = await (await fetch('manifest.webmanifest')).json(); const prova = async u => (await fetch(u)).ok; const file = [...m.icons, ...m.screenshots, ...m.shortcuts.flatMap(x => x.icons)].map(x => x.src); return { maschera: m.icons.some(i => i.purpose === 'maskable'), mono: m.icons.some(i => i.purpose === 'monochrome'), scorciatoie: m.shortcuts.length, foto: m.screenshots.length, tutti: (await Promise.all(file.map(prova))).every(Boolean) }; });
  v(man.maschera && man.mono && man.scorciatoie === 3 && man.foto >= 4 && man.tutti, `icona per Android (ritagliabile e a un colore), ${man.scorciatoie} scorciatoie e ${man.foto} foto per l'installazione, tutti i file ci sono`);
  const pix = await A.evaluate(() => { OPZ.stileGioco = true; applicaStile(); mostraVista('vDiario'); return new Promise(r => requestAnimationFrame(() => setTimeout(() => r({ nav: document.querySelectorAll('.nav .pi-nav').length, pulsanti: document.querySelectorAll('img.pi').length, faccine: [...document.querySelectorAll('#gioco button, #gioco summary')].filter(b => b.offsetParent && /^\s*(⚔|🗺|📌|📏|🧭|🎬|📅|📷)/u.test(b.textContent)).length }), 100))); });
  const senza = await A.evaluate(() => { OPZ.stileGioco = false; applicaStile(); const r = document.querySelectorAll('img.pi').length; OPZ.stileGioco = true; applicaStile(); return r; });
  v(pix.nav === 5 && pix.pulsanti >= 5 && pix.faccine === 0 && senza === 0, `icone in pixel: ${pix.pulsanti} al posto delle faccine e 5 nella barra; senza aspetto da videogioco tornano le faccine`);
  const tema = await A.evaluate(() => { $('#optTema').value = 'pergamena'; $('#optTema').dispatchEvent(new Event('change')); const r = { cls: document.body.classList.contains('pergamena'), sfondo: getComputedStyle(document.body).getPropertyValue('--sfondo').trim(), meta: document.querySelector('meta[name="theme-color"]').content }; $('#optTema').value = 'scuro'; $('#optTema').dispatchEvent(new Event('change')); return { ...r, via: !document.body.classList.contains('pergamena') }; });
  v(tema.cls && tema.sfondo === '#efe3c4' && tema.meta === '#e6d6ae' && tema.via, 'tema chiaro «pergamena» acceso e spento dalle opzioni');
  // 4.7.1: pulsante sole/luna, grafica scelta dal dispositivo, nero vero
  const gn = await A.evaluate(() => { const b = $('#btnGiornoNotte'); const r0 = b.getBoundingClientRect(); b.click(); const giorno = { cls: document.body.classList.contains('pergamena'), tema: OPZ.tema, sel: $('#optTema').value };
    b.click(); return { giorno, notte: !document.body.classList.contains('pergamena') && OPZ.tema === 'scuro', basso: r0.bottom > innerHeight * 0.75, vede: r0.width >= 44 }; });
  v(gn.giorno.cls && gn.giorno.tema === 'pergamena' && gn.giorno.sel === 'pergamena' && gn.notte && gn.basso && gn.vede, 'pulsante sole/luna in basso: giorno (pergamena) e di nuovo notte, la scelta resta nelle opzioni');
  const disp = await A.evaluate(() => { const p = Dispositivo.profilo(); $('#optGrafica').value = 'bassa'; $('#optGrafica').dispatchEvent(new Event('change')); const r = { p, bassa: document.body.classList.contains('q-bassa') && Dispositivo.dpr(2) === 1, info: $('#infoDispositivo').textContent };
    $('#optGrafica').value = 'auto'; $('#optGrafica').dispatchEvent(new Event('change')); $('#optOled').checked = true; $('#optOled').dispatchEvent(new Event('change')); r.oled = getComputedStyle(document.body).backgroundColor; $('#optOled').checked = false; $('#optOled').dispatchEvent(new Event('change')); return r; });
  v(disp.p.tipo && disp.p.qualita && disp.bassa && /grafica bassa/.test(disp.info) && /schermo \d+×\d+/.test(disp.info) && disp.oled === 'rgb(0, 0, 0)', `il tavolo riconosce il dispositivo (${disp.p.tipo}, grafica ${disp.p.qualita}), la grafica bassa abbassa la nitidezza e il nero vero spegne lo sfondo`);
  const sc = await nuovo({ width: 412, height: 915 }); await sc.goto(link.split('?')[0] + '?azione=sfida'); await sc.waitForTimeout(800);
  v(await sc.evaluate(() => document.activeElement?.id === 'btnSfida' && !$('#ingresso').hidden), 'scorciatoia «Sfida della settimana»: si apre l\'ingresso con il tasto della sfida pronto');
  v(errori.length === 0, 'nessun errore JavaScript' + (errori.length ? ': ' + errori.slice(0, 5).join(' | ') : ''));
  await browser.close();
  console.log(`\n${ok} ok, ${ko} falliti`);
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
