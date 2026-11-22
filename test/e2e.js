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
  v(await A.isVisible('#btnBot'), 'tasto partita bot visibile all\'amministratore');
  await A.click('#btnBot');
  await A.waitForFunction(() => /Finito/.test(document.querySelector('#botLog').textContent), null, { timeout: 300000 });
  const esitoBot = await A.textContent('#botLog li:last-child');
  console.log('     ', esitoBot);
  if (!/ 0 non riuscite/.test(esitoBot)) console.log('      passi:', await A.evaluate(() => [...document.querySelectorAll('#botLog li')].filter(l => /❌/.test(l.textContent)).map(l => l.textContent).join(' | ')));
  v(/ 0 non riuscite/.test(esitoBot), 'partita bot (campagna nuova, 4 bot e master AI) completata senza problemi');
  await A.waitForTimeout(800);
  v(!Object.values(await A.evaluate(() => S.st.membri)).some(m => /^Bot /.test(m.nome)), 'la partita bot non tocca la campagna di chi la avvia');
  v(await A.evaluate(() => S.st.costi?.totale?.chiamate > 0) && /chiamate/.test(await A.textContent('#costi')), 'pannello uso AI aggiornato');
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
  await A.evaluate(() => invia({ t: 'combattimento', azione: 'fine' }));
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
  v(errori.length === 0, 'nessun errore JavaScript' + (errori.length ? ': ' + errori.slice(0, 5).join(' | ') : ''));
  await browser.close();
  console.log(`\n${ok} ok, ${ko} falliti`);
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
