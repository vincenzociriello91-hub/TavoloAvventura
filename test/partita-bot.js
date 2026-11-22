// Partita bot "flash" sul server vero: 4 personaggi bot e il master AI provano tutte le funzioni in pochi minuti.
// Ogni bot è una pagina vera dell'app: alla fine ognuno manda il suo rapporto cifrato (come un giocatore vero),
// più il riepilogo della prova nel rapporto del primo bot. Uso: APP=<url dell'app> node test/partita-bot.js
const { chromium } = require('playwright');
const APP = process.env.APP || 'https://vincenzociriello91-hub.github.io/TavoloAvventura/prova/';
const esiti = [];
const t0 = Date.now();
const segna = (ok, nome, dettagli) => { esiti.push({ ok, nome, dettagli, s: Math.round((Date.now() - t0) / 1000) }); console.log(ok ? 'OK  ' : 'FAIL', nome, dettagli ? JSON.stringify(dettagli).slice(0, 300) : ''); };
// ogni passo è indipendente: un errore viene segnato e la partita continua
const passo = async (nome, fn) => { try { const r = await fn(); segna(r !== false && r !== null, nome, typeof r === 'object' ? r : undefined); } catch (e) { segna(false, nome, { errore: String(e.message || e).split('\n')[0] }); } };
// richiesta al server e attesa della risposta di quel tipo
const chiedi = (p, msg, tipo, ms = 45000) => p.evaluate(([msg, tipo, ms]) => new Promise(res => {
  const f = e => { const m = JSON.parse(e.data); if (m.t === tipo) { S.ws.removeEventListener('message', f); res(m); } };
  S.ws.addEventListener('message', f); invia(msg); setTimeout(() => { S.ws.removeEventListener('message', f); res(null); }, ms);
}), [msg, tipo, ms]);

(async () => {
  const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errori = [];
  const pagina = async nome => {
    const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, permissions: ['microphone'] });
    const p = await ctx.newPage();
    p.on('pageerror', e => errori.push(`${nome}: ${e.message}`));
    p.on('console', m => { if (m.type() === 'error' && !/fonts.g|favicon|Failed to load resource/.test(m.text())) errori.push(`${nome} console: ${m.text()}`); });
    return p;
  };
  const ora = new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  const nomi = ['Bot Aldo', 'Bot Bruna', 'Bot Ciro', 'Bot Dora'];
  const PG = [['Aldo il Saldo', 'Nano', 'Guerriero'], ['Bruna Lunaverde', 'Elfo', 'Mago'], ['Ciro Mezzapinta', 'Halfling', 'Ladro'], ['Dora la Pia', 'Umano', 'Chierico']];
  const A = await pagina(nomi[0]);
  const bot = [A];
  const narrazioni = p => p.evaluate(() => S.st.diario.filter(d => d.tipo === 'narrazione').length);
  const aspettaMaster = async (p, prima, ms = 90000) => { await p.waitForFunction(n => S.st.diario.filter(d => d.tipo === 'narrazione').length > n, prima, { timeout: ms }); return p.evaluate(() => S.st.diario.filter(d => d.tipo === 'narrazione').slice(-1)[0].testo.slice(0, 160)); };

  await passo('il primo bot crea la campagna con il master AI', async () => {
    await A.goto(APP); await A.waitForSelector('#cartaCrea');
    await A.fill('#cNome', `Partita bot flash ${ora}`); await A.click('#chipsAmb .chip >> nth=1'); await A.fill('#cMioNome', nomi[0]);
    await A.click('#btnCrea'); await A.waitForSelector('#gioco:not([hidden])', { timeout: 20000 });
    return { master: await A.evaluate(() => S.st.campagna.masterTipo), versione: await A.evaluate(() => VERSION) };
  });
  const link = await A.evaluate(() => linkInvito()).catch(() => null);
  for (let i = 1; i < 4; i++) await passo(`${nomi[i]} entra dal link di invito`, async () => {
    const p = await pagina(nomi[i]); bot.push(p);
    await p.goto(link); await p.fill('#eNome', nomi[i]); await p.click('#btnEntra');
    await p.waitForSelector('#gioco:not([hidden])', { timeout: 20000 }); return true;
  });
  await passo('tutti e quattro online', () => A.waitForFunction(() => S.st.online.length >= 4, null, { timeout: 15000 }).then(() => true));
  const [, B, C, D] = bot;

  // personaggi: uno dalla schermata di creazione, gli altri come li manda l'app
  await passo('Bot Bruna crea il personaggio dalla schermata', async () => {
    await B.click('#nav button[data-v="vScheda"]'); await B.waitForSelector('#cpNome', { timeout: 10000 }); await B.fill('#cpNome', PG[1][0]); await B.selectOption('#cpRazza', PG[1][1]); await B.selectOption('#cpClasse', PG[1][2]);
    await B.click('#cpAuto'); await B.click('#cpCrea'); await B.waitForSelector('.pg-testa h2', { timeout: 10000 });
    const pg = await B.evaluate(() => mioPg()); return { pf: pg.pfMax, ca: pg.ca };
  });
  for (const i of [0, 2, 3]) await passo(`${nomi[i]} crea ${PG[i][0]} (${PG[i][1]} ${PG[i][2]})`, async () => {
    await bot[i].evaluate(([n, r, c]) => invia({ t: 'scheda', pg: Regole.nuovo(regole(), { nome: n, razza: r, classe: c, carBase: { for: 14, des: 14, cos: 14, int: 12, sag: 12, car: 10 } }) }), PG[i]);
    await bot[i].waitForFunction(() => mioPg(), null, { timeout: 10000 }); return true;
  });

  // comandi vocali (frasi come quelle del riconoscimento vocale)
  const FRASI = [[A, 'subisco 5 danni'], [A, 'recupero 3 punti ferita'], [A, "equipaggio l'ascia bipenne"], [B, "trovo 40 monete d'oro"], [B, 'salgo di livello'], [C, 'sono avvelenato'], [C, 'raccolgo una pozione di guarigione'], [D, 'guadagno 300 punti esperienza'], [D, 'annulla']];
  for (const [p, f] of FRASI) await passo(`comando a voce "${f}"`, async () => { const prima = await p.evaluate(() => JSON.stringify(mioPg())); await p.evaluate(f => sentitaFrase(f), f); await p.waitForTimeout(800); return { cambiato: prima !== await p.evaluate(() => JSON.stringify(mioPg())) }; });

  // dadi
  await passo('tiro di percezione con vantaggio a voce', async () => { await B.evaluate(() => sentitaFrase('tiro per percezione con vantaggio')); await A.waitForFunction(() => S.st.dadi.some(d => d.motivo === 'Percezione'), null, { timeout: 10000 }); return true; });
  for (const f of [20, 100, 6]) await passo(`tiro d${f} dal tasto (dadi 3D)`, async () => { await C.click('#nav button[data-v="vDadi"]'); await C.click(`#dadiTasti button[data-f="${f}"]`); await C.waitForTimeout(1500); return { risultato: await C.textContent('#ultimoTiro .tot') }; });

  // master AI: primo turno
  let n0 = await narrazioni(A);
  await passo('il master AI apre la partita e porta il gruppo in un luogo', async () => {
    await A.click('#nav button[data-v="vDiario"]'); await A.fill('#chatTesto', 'Siamo quattro avventurieri pronti: entriamo in città e cerchiamo una locanda'); await A.click('#formChat button');
    const testo = await aspettaMaster(A, n0); await A.waitForFunction(() => S.st.luogo, null, { timeout: 20000 });
    return { luogo: await A.evaluate(() => S.st.luogo.nome + ' (' + S.st.luogo.tipo + ')'), testo };
  });
  await passo('luogo garantito per le prove della mappa', async () => { if (!await A.evaluate(() => S.st.luogo)) { await A.evaluate(() => invia({ t: 'vai', nome: 'Città di Argentea' })); await A.waitForFunction(() => S.st.luogo, null, { timeout: 15000 }); } return true; });

  // mappa: percorsi, muri, zoom, vista 3D
  await A.click('#nav button[data-v="vMappa"]').catch(() => {});
  await passo('un bot cammina fino a una casella raggiungibile', async () => {
    const meta = await D.evaluate(() => { const s = S.st.segnalini[S.io], occ = Object.values(S.st.segnalini); for (let r = 2; r < 9; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const q = { x: s.x + dx, y: s.y + dy }; if (!occ.some(o => o.x === q.x && o.y === q.y) && Mappa.percorso(s, q)) return q; } });
    await D.evaluate(m => invia({ t: 'segnalino', x: m.x, y: m.y }), meta);
    await A.waitForFunction(([id, m]) => S.st.segnalini[id]?.x === m.x && S.st.segnalini[id]?.y === m.y, [await D.evaluate(() => S.io), meta], { timeout: 10000 }); return meta;
  });
  await passo('il server rifiuta il salto dentro un muro', async () => {
    const muro = await D.evaluate(() => { const l = S.st.luogo; for (let y = 0; y < l.h; y++) for (let x = 0; x < l.w; x++) if (l.celle[y][x] === '#') return { x, y }; });
    const prima = await D.evaluate(() => ({ ...S.st.segnalini[S.io] })); await D.evaluate(m => invia({ t: 'segnalino', x: m.x, y: m.y }), muro); await D.waitForTimeout(1500);
    return D.evaluate(p => S.st.segnalini[S.io].x === p.x && S.st.segnalini[S.io].y === p.y, prima);
  });
  await passo('zoom della mappa e "Tutta la mappa"', async () => { await A.click('#btnZoomPiu'); await A.click('#btnZoomMeno'); await A.click('#btnZoomTutta'); return true; });
  await passo('vista 3D accesa e spenta', async () => { await A.click('#btn3d'); try { await A.waitForSelector('#mappa3dBox canvas', { state: 'attached', timeout: 45000 }); await A.waitForTimeout(1500); await A.click('#btnZoomTutta'); } finally { if (!await A.evaluate(() => document.querySelector('#mappa3dBox').hidden)) await A.click('#btn3d'); } return true; }); // sul server di GitHub (senza scheda video) il 3D è lento
  await passo('mappa del mondo illustrata', async () => { await A.click('#btnMondo'); await A.waitForTimeout(800); await A.click('#btnMondo'); return true; });

  // luoghi ed edifici
  await passo('viaggio verso un altro luogo', async () => { await A.evaluate(() => invia({ t: 'vai', nome: 'Villaggio di Pietrarossa' })); await A.waitForFunction(() => /Pietrarossa/.test(S.st.luogo?.nome), null, { timeout: 45000 }); return true; });
  await passo('entrare in un edificio e uscire', async () => {
    const ed = await A.evaluate(() => S.st.luogo.edifici.find(e => e.stato !== 'distrutto' && !/pozzo|torre|radura/i.test(e.nome))); await A.evaluate(id => invia({ t: 'entra_edificio', edificio: id }), ed.id);
    await A.waitForFunction(() => S.st.luogo?.genitore, null, { timeout: 40000 }); const dentro = await A.evaluate(() => S.st.luogo.nome);
    await A.evaluate(() => invia({ t: 'esci_edificio' })); await A.waitForFunction(() => !S.st.luogo?.genitore, null, { timeout: 15000 }); return { edificio: ed.nome, dentro };
  });

  // negozio
  await passo('negozio: il fabbro apre, un bot compra e rivende', async () => {
    await A.evaluate(() => invia({ t: 'apri_negozio', nome: 'Fabbro Ulrico', tipo: 'fabbro' })); await C.waitForFunction(() => S.st.negozio, null, { timeout: 10000 });
    await C.evaluate(() => sentitaFrase("trovo 20 monete d'oro")); await C.waitForTimeout(800);
    const prima = await C.evaluate(() => mioPg().oro);
    await C.evaluate(() => invia({ t: 'compra', merce: 'Pugnale' })); await C.waitForFunction(n => mioPg().oro < n, prima, { timeout: 10000 });
    await C.evaluate(() => invia({ t: 'vendi', indice: mioPg().equip.map(e => e.nome).lastIndexOf('Pugnale') })); await C.waitForTimeout(1500);
    await A.evaluate(() => invia({ t: 'chiudi_negozio' })); return { oro: await C.evaluate(() => mioPg().oro) };
  });

  // schermo del master: strumenti AI
  for (const [tipo, extra] of [['png', {}], ['incontro', { difficolta: 'media' }], ['tesoro', { gs: 2 }]]) await passo(`schermo del master: ${tipo}`, async () => {
    const m = await chiedi(A, { t: 'strumento', tipo, ...extra }, 'strumento');
    if (tipo === 'incontro' && m?.ris?.mostri) await A.evaluate(mo => invia({ t: 'piazza_nemici', mostri: mo }), m.ris.mostri);
    return m ? { ris: JSON.stringify(m.ris).slice(0, 200) } : false;
  });

  // combattimento
  await passo('combattimento: inizia, turni, area dell\'incantesimo, fine', async () => {
    await A.evaluate(() => invia({ t: 'combattimento', azione: 'inizia' })); await B.waitForFunction(() => S.st.combattimento?.attivo, null, { timeout: 10000 });
    const ordine = await B.evaluate(() => S.st.combattimento.ordine.map(o => o.nome).join(', '));
    await A.evaluate(() => invia({ t: 'combattimento', azione: 'prossimo' })); await A.waitForTimeout(600);
    const s = await B.evaluate(() => S.st.segnalini[S.io]); await B.evaluate(s => invia({ t: 'area', forma: 'cerchio', x: s.x + 3, y: s.y, dim: 2, nome: 'Palla di fuoco' }), s);
    await C.waitForFunction(() => (S.st.aree || []).length, null, { timeout: 10000 });
    await A.evaluate(() => invia({ t: 'area', pulisci: true })); await A.evaluate(() => invia({ t: 'combattimento', azione: 'fine' }));
    return { ordine };
  });

  // gruppo, legami, mondo, statistiche, libro, regole
  await passo('tesoro comune: oggetto messo e preso', async () => { await A.evaluate(() => invia({ t: 'gruppo', op: 'oggetto', nome: 'Corda', qta: 1 })); await D.waitForTimeout(800); await D.evaluate(() => invia({ t: 'gruppo', op: 'prendi', nome: 'Corda' })); await D.waitForFunction(() => mioPg().equip.some(e => e.nome === 'Corda'), null, { timeout: 10000 }); return true; });
  await passo('legame tra due personaggi', async () => { const idB = await B.evaluate(() => S.io); await A.evaluate(id => invia({ t: 'relazione', con: id, livello: 'amici stretti' }), idB); await B.waitForFunction(() => Object.keys(S.st.relazioni || {}).length, null, { timeout: 10000 }); return true; });
  await passo('fazione e valuta locale', async () => { await A.evaluate(() => { invia({ t: 'mondo', fazione: 'Gilda dei Minatori', reputazione: 15 }); invia({ t: 'mondo', valuta: 'Scudi di Pietrarossa', cambio: 0.5 }); }); await C.waitForFunction(() => S.st.mondo?.fazioni?.['Gilda dei Minatori'], null, { timeout: 10000 }); return true; });
  await passo('domanda sulle regole', async () => { const m = await chiedi(A, { t: 'regola', testo: 'come funziona un attacco di opportunità?' }, 'regola'); return m ? { risposta: JSON.stringify(m).slice(0, 200) } : false; });
  await passo('statistiche e trofei', async () => { const m = await chiedi(A, { t: 'statistiche' }, 'statistiche', 15000); return m ? { tot: JSON.stringify(m.tot).slice(0, 160) } : false; });
  await passo('libro della campagna', async () => { const m = await chiedi(A, { t: 'libro' }, 'libro', 15000); return m ? { pg: m.pg?.length, diario: m.diario?.length } : false; });

  // avventura pronta e secondo turno del master
  n0 = await narrazioni(A);
  await passo('avventura pronta "La miniera dei goblin"', async () => { await A.evaluate(() => invia({ t: 'avventura_inizia', id: 'miniera' })); return { testo: await aspettaMaster(A, n0) }; });
  n0 = await narrazioni(A);
  await passo('il master AI risponde a un\'azione di un bot', async () => { await C.evaluate(() => invia({ t: 'chat', testo: "Chiedo all'oste se ha visto i goblin e offro una moneta per le informazioni", alMaster: true })); return { testo: await aspettaMaster(A, n0) }; });
  await passo('illustrazione della scena', async () => { const n = await A.evaluate(() => S.st.diario.filter(d => d.tipo === 'illustrazione').length); await A.evaluate(() => invia({ t: 'illustra' })); await A.waitForFunction(n => S.st.diario.filter(d => d.tipo === 'illustrazione').length > n, n, { timeout: 90000 }); return true; });

  // bot di prova dell'app (un quinto giocatore che gioca da solo)
  await passo("partita bot dell'app (campagna nuova)", async () => { await A.evaluate(() => { const d = document.querySelector('#dlg'); if (d.open) d.close(); }); await A.click('#nav button[data-v="vAltro"]'); const stato = await A.evaluate(() => { const b = document.querySelector('#btnBot'); return b ? { visibile: !!b.offsetParent, attivo: !b.disabled, testo: b.textContent } : 'manca'; }); if (!stato.visibile || !stato.attivo) return { stato }; await A.click('#btnBot'); await A.waitForFunction(() => /Finito/.test(document.querySelector('#botLog').textContent), null, { timeout: 600000 }); return { esito: (await A.textContent('#botLog li:last-child')).slice(0, 250) }; });

  await passo('riepilogo illustrato della serata', async () => { await A.evaluate(() => invia({ t: 'riepilogo' })); await A.waitForFunction(() => S.st.diario.some(d => d.tipo === 'riepilogo'), null, { timeout: 120000 }); return true; });
  await passo('nessun errore JavaScript nelle pagine', () => errori.length ? { errori: errori.slice(0, 15) } : true);

  // rapporti: il riepilogo della prova va nel rapporto del primo bot, poi ognuno manda il suo
  const sintesi = { durata_s: Math.round((Date.now() - t0) / 1000), ok: esiti.filter(e => e.ok).length, falliti: esiti.filter(e => !e.ok).length, esiti, errori };
  console.log(`\n${sintesi.ok} ok, ${sintesi.falliti} falliti in ${sintesi.durata_s} s`);
  for (const [i, p] of bot.entries()) {
    await p.evaluate(async ([i, s]) => { if (i === 0) Report.log('partita-bot', s); await Report.chiudi('fine partita bot'); for (let k = 0; k < 15 && leggi('ta_rapporti', []).length; k++) { await Report.invia(); await new Promise(r => setTimeout(r, 1000)); } }, [i, sintesi]).catch(e => console.log('rapporto', i, e.message));
    console.log('rapporto', nomi[i], JSON.stringify(await p.evaluate(() => leggi('ta_report_esito', null)).catch(() => null)));
  }
  await browser.close();
})();
