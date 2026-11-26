// Giro di tutte le schermate dell'app pubblicata (telefono, computer, spettatore, TV, master umano), con foto e controllo errori. Uso: node test/giro-schermate.js <cartella>
const { chromium } = require('playwright');
const OUT = process.argv[2], APP = 'https://vincenzociriello91-hub.github.io/TavoloAvventura/';
const errori = [], foto = [];
(async () => {
  const b = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY }, args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const nuovo = async (vp, nome) => { const ctx = await b.newContext({ viewport: vp, ignoreHTTPSErrors: true, permissions: ['microphone'] }); const p = await ctx.newPage();
    p.on('pageerror', e => errori.push(nome + ' pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts|favicon|net::|Failed to load/.test(m.text())) errori.push(nome + ' console: ' + m.text().slice(0, 200)); }); return p; };
  let n = 0; const scatta = async (p, nome, opz = {}) => { const f = `${String(++n).padStart(2, '0')}-${nome}.png`; await p.waitForTimeout(500); await p.screenshot({ path: `${OUT}/${f}`, fullPage: opz.full !== false }); foto.push(f); };
  const apri = (p, sel) => p.evaluate(s => apriSezione(s), sel); // apre sezioni e menu che contengono l'elemento
  const vista = async (p, v) => { await p.click(`#nav button[data-v="${v}"]`); await p.waitForTimeout(400); };
  const chiudiDialogo = async p => { for (let i = 0; i < 8; i++) { const b = p.locator('dialog[open] button, .dialogo:not([hidden]) button').last(); if (!await b.count()) break; await b.click().catch(() => {}); await p.waitForTimeout(250); } };
  // 1. ingresso
  const A = await nuovo({ width: 412, height: 915 }, 'A');
  await A.goto(APP + '?v=' + Date.now()); await A.waitForSelector('#cartaCrea'); await scatta(A, 'ingresso');
  // 2. campagna (master AI, prova) e personaggio
  await A.evaluate(() => connetti(codiceNuovo(), () => ({ t: 'crea', nome: 'Giro completo', regole: '5e', ambientazione: 'Fantasy classico', masterTipo: 'ai', mioNome: 'Vincenzo', prova: true, avventura: 'miniera' })));
  await A.waitForSelector('#gioco:not([hidden])'); await A.waitForTimeout(1500); await chiudiDialogo(A);
  await vista(A, 'vScheda'); await scatta(A, 'scheda-creazione');
  await A.evaluate(() => invia({ t: 'scheda', pg: Regole.nuovo(regole(), { nome: 'Valerio Lungonome', razza: 'Umano', classe: 'Guerriero', carBase: { for: 15, des: 14, cos: 14, int: 10, sag: 12, car: 8 } }) }));
  await A.waitForTimeout(1500); await scatta(A, 'scheda-piena');
  // 3. secondo giocatore e spettatore
  const link = await A.evaluate(() => linkInvito());
  const B = await nuovo({ width: 1440, height: 900 }, 'B'); await B.goto(link); await scatta(B, 'ingresso-da-link-desktop', { full: false });
  await B.fill('#eNome', 'Marco'); await B.click('#btnEntra'); await B.waitForSelector('#gioco:not([hidden])'); await B.waitForTimeout(1500); await chiudiDialogo(B);
  await B.evaluate(() => invia({ t: 'scheda', pg: Regole.nuovo(regole(), { nome: 'Lira', razza: 'Elfo', classe: 'Mago', carBase: { for: 8, des: 14, cos: 12, int: 15, sag: 12, car: 10 } }) }));
  // 4. luogo e mappa
  await A.evaluate(() => invia({ t: 'vai', nome: 'Villaggio di Pietrarossa' })); await A.waitForFunction(() => S.st.luogo?.nome?.includes('Pietrarossa'), null, { timeout: 30000 }); await A.waitForTimeout(2000);
  await vista(A, 'vMappa'); await scatta(A, 'mappa');
  await A.click('#btnZoomTutta'); await scatta(A, 'mappa-tutta', { full: false });
  await A.click('#btnMondo'); await A.waitForTimeout(1200); await scatta(A, 'mappa-mondo'); await A.click('#btnMondo');
  await A.click('#btn3d'); await A.waitForTimeout(6000); await scatta(A, 'vista-3d', { full: false }); await A.click('#btn3d');
  await apri(A, '#btnArea'); await A.click('#btnArea').catch(() => {}); await A.waitForTimeout(600); await scatta(A, 'area-incantesimo', { full: false }); await chiudiDialogo(A); await A.keyboard.press('Escape');
  await B.waitForTimeout(500); await scatta(B, 'desktop-mappa', { full: false });
  // 5. combattimento
  await A.evaluate(() => invia({ t: 'combattimento', azione: 'inizia' })); await A.waitForTimeout(1500); await scatta(A, 'combattimento', { full: false });
  await A.evaluate(() => invia({ t: 'combattimento', azione: 'fine' }));
  // 6. dadi
  await vista(A, 'vDadi'); await scatta(A, 'dadi');
  await A.locator('#vDadi button').first().click().catch(() => {}); await A.waitForTimeout(2500); await scatta(A, 'dadi-tiro', { full: false });
  // 7. negozio e tesoro
  await A.evaluate(() => invia({ t: 'apri_negozio', nome: 'Fabbro Ulrico', tipo: 'fabbro' })).catch(() => {});
  await A.evaluate(() => { invia({ t: 'missione_nuova', titolo: 'Il pozzo stregato', descrizione: 'Cosa urla nel pozzo?', ricompensa: '30 mo' }); invia({ t: 'voto_apri', domanda: 'Ponte o guado?', opzioni: ['ponte', 'guado'] }); invia({ t: 'gruppo', op: 'oro', delta: 900 }); invia({ t: 'serata_nuova', quando: new Date(Date.now() + 3 * 864e5).toISOString(), nota: 'da Marco' }); invia({ t: 'gioco_apri', tipo: 'dadi', posta: 5 }); invia({ t: 'nota_mappa', x: 4, y: 4, testo: 'trappola' }); });
  await A.waitForTimeout(1500); await vista(A, 'vScheda'); await scatta(A, 'scheda-con-negozio-tesoro');
  // 8. diario
  await A.evaluate(() => invia({ t: 'chat', testo: 'Entriamo nella taverna', alMaster: true })); await A.waitForTimeout(8000);
  await vista(A, 'vDiario'); await scatta(A, 'diario');
  // 9. altro + finestre
  await vista(A, 'vAltro'); await scatta(A, 'altro');
  await A.evaluate(() => document.querySelectorAll('.piegabile.chiusa > .testa-piega').forEach(h => h.click())); await scatta(A, 'altro-tutto-aperto');
  for (const [id, nome] of [['#btnGuida', 'guida'], ['#btnStatistiche', 'statistiche'], ['#btnRiassunto', 'riassunto']]) { await A.click(id).catch(() => {}); await A.waitForTimeout(2500); if (nome === 'riassunto') await A.waitForSelector('dialog[open]', { timeout: 25000 }).catch(() => {}); await scatta(A, nome, { full: false }); await chiudiDialogo(A); } // il riassunto arriva dal master dopo qualche secondo, in una finestra
  await apri(A, '#optGrandi'); await A.click('#optGrandi'); await vista(A, 'vScheda'); await scatta(A, 'caratteri-grandi', { full: false }); await vista(A, 'vAltro'); await A.click('#optGrandi');
  await A.selectOption('#optLingua', 'en'); await A.evaluate(() => invia({ t: 'chat', testo: 'Cerco tracce di goblin', alMaster: true })); await A.waitForTimeout(9000); await vista(A, 'vDiario'); await A.evaluate(() => scrollTo(0, 0)); await scatta(A, 'traduzione', { full: false }); await vista(A, 'vAltro'); await A.selectOption('#optLingua', '');
  // 10. spettatore e TV
  const S1 = await nuovo({ width: 412, height: 915 }, 'Spettatore'); await S1.goto(await A.evaluate(() => `${location.origin}${location.pathname}?c=${S.codice}&i=${S.st.campagna.invitoSpettatori}&s=1`)); await scatta(S1, 'ingresso-spettatore', { full: false }); await S1.fill('#eNome', 'Amico'); await S1.click('#btnEntra'); await S1.waitForSelector('#gioco:not([hidden])'); await S1.waitForTimeout(2000); await chiudiDialogo(S1); await scatta(S1, 'spettatore');
  const TV = await nuovo({ width: 1920, height: 1080 }, 'TV'); await TV.goto(link + '&tv=1'); await TV.waitForTimeout(6000); await scatta(TV, 'tv', { full: false });
  // 11. master umano: schermo del master
  const M = await nuovo({ width: 412, height: 915 }, 'Master'); await M.goto(APP + '?v=' + Date.now()); await M.waitForSelector('#cartaCrea');
  await M.evaluate(() => connetti(codiceNuovo(), () => ({ t: 'crea', nome: 'Master umano', regole: '3.5', masterTipo: 'umano', ruolo: 'master', mioNome: 'Master', prova: true })));
  await M.waitForSelector('#gioco:not([hidden])'); await M.waitForTimeout(1500); await chiudiDialogo(M); await vista(M, 'vAltro'); await scatta(M, 'altro-master-umano'); await vista(M, 'vDiario'); await scatta(M, 'diario-master-umano', { full: false });
  await vista(M, 'vScheda'); await scatta(M, 'scheda-master-umano', { full: false });
  // 12. giocatore nella campagna 3.5: il modulo di creazione del personaggio con le regole 3.5
  const G = await nuovo({ width: 412, height: 915 }, 'Giocatore 3.5'); await G.goto(await M.evaluate(() => linkInvito())); await G.fill('#eNome', 'Sara'); await G.click('#btnEntra'); await G.waitForSelector('#gioco:not([hidden])'); await G.waitForTimeout(1500); await chiudiDialogo(G);
  await vista(G, 'vScheda'); await scatta(G, 'scheda-3.5-creazione');
  console.log(JSON.stringify({ foto, errori }, null, 1)); await b.close();
})().catch(e => { console.log('ERRORE', e.message, JSON.stringify({ foto, errori })); process.exit(1); });
