/* Bot di prova: entra nella stanza come un giocatore in più, crea un personaggio e gioca da solo
   (master, comandi vocali, dadi, mappe, regole, livelli), poi esce e lascia tutto nel rapporto. */
const BotProva = (() => {
  const FRASI = ['subisco 5 danni', 'recupero 3 punti ferita', "equipaggio l'ascia bipenne", 'indosso un elmo', 'raccolgo una pozione di guarigione', 'trovo 25 monete d\'oro', 'guadagno 300 punti esperienza', 'sono avvelenato', 'non sono più avvelenato', 'metti un punto in saggezza', 'la mia spada brilla nella notte', 'tiro per percezione con vantaggio', 'tiro salvezza su destrezza', 'tiro per colpire', 'tiro i danni', "tiro per l'iniziativa", 'lancio due d6 più 3', 'togli la pozione di guarigione', 'ripongo l\'elmo', 'aumenta la forza di uno perché sono più muscoloso'];
  const AZIONI = ['Salve master, siamo pronti: da dove comincia la nostra avventura?', 'Mi guardo intorno e cerco qualcuno che sappia darci informazioni', 'Attacco il nemico più vicino con la mia arma', 'Cerco trappole e passaggi segreti', 'Chiedo all\'oste se ha sentito voci su un tesoro nascosto'];
  let ws = null, stato = null, io = null, attivo = false, log = () => {}, onPasso = () => {}, onErr = () => {};
  const attese = [];
  const dorme = ms => new Promise(r => setTimeout(r, ms));
  const aspetta = (f, ms = 30000) => new Promise(res => { const a = { f, res }; attese.push(a); setTimeout(() => { const i = attese.indexOf(a); if (i >= 0) { attese.splice(i, 1); res(null); } }, ms); });
  const manda = o => { if (ws?.readyState === 1) ws.send(JSON.stringify(o)); };
  const passo = (t, dati) => { log('bot-passo', { passo: t, ...dati }); onPasso(t); };

  function connetti(url, primo) {
    return new Promise(res => {
      ws = new WebSocket(url);
      ws.onopen = () => manda(primo);
      ws.onmessage = e => {
        let m; try { m = JSON.parse(e.data); } catch { return; }
        if (m.t === 'benvenuto') { io = m.io; stato = m.stato; res(true); }
        if (m.t === 'errore') { log('bot-errore-server', { msg: m.msg }); if (!io) res(false); }
        if (m.t === 'narra') log('bot-narrazione', { png: m.png || null, testo: m.testo, modello: m.modello });
        if (m.t === 'luogo') { stato.luogo = m.luogo; stato.segnalini = m.segnalini; }
        if (m.t === 'scheda' && m.per === io) stato.pg[io] = m.pg;
        if (m.t === 'richiesta_tiro' && m.pg === io) rispondiTiro(m);
        for (const a of [...attese]) if (a.f(m)) { attese.splice(attese.indexOf(a), 1); a.res(m); }
      };
      ws.onclose = () => { if (attivo) log('bot-connessione', { chiusa: true }); };
      ws.onerror = () => res(false);
    });
  }
  function pg() { return stato?.pg?.[io]; }
  function salva(nota) { manda({ t: 'scheda', pg: pg(), nota }); }
  function rispondiTiro(m) {
    const p = pg(); if (!p) return;
    const ab = Object.keys(Regole.set(p.regole).abilita).find(a => pulisci(a) === pulisci(m.prova));
    const formula = ab ? 'd20' + fm(Regole.abilita(p, ab)) : 'd20';
    log('bot-richiesta-tiro', { prova: m.prova, cd: m.cd, formula });
    setTimeout(() => manda({ t: 'dado', formula, motivo: m.prova }), 800);
  }

  async function avvia(opz) {
    if (attivo) return;
    attivo = true; log = opz.log; onPasso = opz.onPasso || onPasso; onErr = opz.onErr || onErr;
    const t0 = Date.now(), esito = { comandi: { capiti: 0, nonCapiti: [], aiCapiti: 0 }, master: [], persistenza: null, errori: [] };
    try {
      passo('Entro nella stanza');
      if (!await connetti(opz.url, { t: 'entra', invito: opz.invito, nome: 'Bot di prova', ruolo: 'giocatore' })) throw new Error('il bot non riesce a entrare (invito?)');
      const regole = stato.campagna.regole;
      const set = Regole.set(regole);
      const razze = Object.keys(set.razze), classi = Object.keys(set.classi);
      const razza = razze[Math.floor(Math.random() * razze.length)], classe = classi[Math.floor(Math.random() * classi.length)];
      const carBase = {}; CAR.forEach(k => carBase[k] = Regole.tira4d6());
      const nuovo = Regole.nuovo(regole, { nome: 'Bottino il Collaudatore', razza, classe, carBase, competenze: regole === '5e' ? Object.keys(set.abilita).slice(0, set.classi[classe].abilita || 2) : [] });
      stato.pg[io] = nuovo; salva(`${nuovo.nome}, ${razza} ${classe}, entra in gioco (bot di prova)`);
      passo('Personaggio creato', { razza, classe, regole, pf: nuovo.pfMax, ca: nuovo.ca });
      await dorme(800);

      // il master
      for (const [i, frase] of AZIONI.slice(0, 3).entries()) {
        passo(`Parlo al master (${i + 1}/3)`);
        const ts = Date.now();
        manda({ t: 'parlato', testo: frase, alMaster: true });
        const n = await aspetta(m => m.t === 'narra' || m.t === 'master_zitto' || (m.t === 'errore' && /master/.test(m.msg)), 45000);
        esito.master.push({ frase, ms: Date.now() - ts, risposta: n?.t === 'narra' ? n.testo.slice(0, 300) : n?.t || 'nessuna risposta', png: n?.png || null });
        await dorme(1500);
      }
      if (!stato.luogo) { passo('Il master non ha scelto un luogo: vado io in taverna'); manda({ t: 'vai', nome: 'Taverna del Drago Ubriaco' }); await aspetta(m => m.t === 'luogo', 8000); }

      // comandi vocali, come se li dicesse a voce
      passo('Provo i comandi vocali');
      for (const frase of FRASI) {
        const r = Comandi.interpreta(frase, pg(), regole);
        if (r?.ops) { Comandi.applica(pg(), r.ops); Regole.ricalcola(pg()); salva(`a voce: "${frase}"`); esito.comandi.capiti++; log('bot-comando', { frase, ops: r.ops, pf: pg().pf, ca: pg().ca }); }
        else if (r?.dado) { manda({ t: 'dado', formula: r.dado.formula, modo: r.dado.modo, motivo: r.dado.motivo, alMaster: false }); const d = await aspetta(m => m.t === 'dado' && m.tiro.chi === io, 5000); esito.comandi.capiti++; log('bot-dado', { frase, formula: r.dado.formula, totale: d?.tiro.totale }); }
        else {
          const id = 'b' + Math.random().toString(36).slice(2, 6);
          manda({ t: 'interpreta', id, testo: frase, regole });
          const ri = await aspetta(m => m.t === 'interpretato' && m.id === id, 15000);
          if (ri?.ops?.length) { Comandi.applica(pg(), ri.ops); Regole.ricalcola(pg()); salva(`a voce (AI): "${frase}"`); esito.comandi.aiCapiti++; }
          else esito.comandi.nonCapiti.push(frase);
          log('bot-comando-ai', { frase, ops: ri?.ops || null });
        }
        await dorme(400);
      }

      // livelli e punti caratteristica
      passo('Salgo al 4° livello');
      for (let i = 0; i < 3; i++) Regole.saliLivello(pg());
      const punti = pg().puntiCar || 0;
      if (punti) Regole.aumentaCar(pg(), regole === '3.5' ? 'cos' : 'int', punti);
      salva(`sale al livello ${pg().livello} (bot)`);
      log('bot-livello', { livello: pg().livello, pfMax: pg().pfMax, puntiUsati: punti, car: pg().car });

      // mappe: luoghi nuovi e ritorno (la mappa deve restare identica)
      passo('Visito i luoghi');
      const primo = stato.luogo;
      for (const n of ['Cripta del Re Senza Nome', 'Bosco delle Lucciole', 'Porto di Salmastro']) {
        manda({ t: 'vai', nome: n }); const l = await aspetta(m => m.t === 'luogo' && m.luogo.nome === n, 8000);
        log('bot-luogo', { nome: n, tipo: l?.luogo.tipo, edifici: l?.luogo.edifici.length });
        const s = l?.segnalini?.[io];
        for (let k = 0; s && k < 4; k++) { manda({ t: 'segnalino', x: s.x + k + 1, y: s.y }); await dorme(250); }
      }
      if (primo) {
        manda({ t: 'vai', nome: primo.nome }); const l = await aspetta(m => m.t === 'luogo' && m.luogo.nome === primo.nome, 8000);
        esito.persistenza = !!l && JSON.stringify(l.luogo.celle) === JSON.stringify(primo.celle);
        log('bot-persistenza', { luogo: primo.nome, identica: esito.persistenza });
      }

      // regole e ultime azioni
      passo('Faccio una domanda sulle regole');
      manda({ t: 'regola', testo: regole === '3.5' ? 'come funziona l\'attacco di opportunità?' : 'come funziona il vantaggio?' });
      const rg = await aspetta(m => m.t === 'regola', 30000);
      log('bot-regola', { risposta: rg?.testo?.slice(0, 400) || 'nessuna' });
      passo('Ultime azioni col master');
      for (const frase of AZIONI.slice(3)) { manda({ t: 'parlato', testo: frase, alMaster: true }); const n = await aspetta(m => m.t === 'narra' || m.t === 'master_zitto', 45000); esito.master.push({ frase, risposta: n?.testo?.slice(0, 300) || n?.t || 'nessuna risposta', png: n?.png || null }); await dorme(1500); }
    } catch (e) { esito.errori.push(e.message); onErr(e.message); }
    // uscita: il bot si cancella dalla campagna
    passo('Esco dalla campagna');
    manda({ t: 'esci' }); await dorme(800);
    try { ws?.close(); } catch {}
    attivo = false;
    const riepilogo = { durataS: Math.round((Date.now() - t0) / 1000), ...esito, rispostaMedianaMasterMs: mediana(esito.master.map(x => x.ms).filter(Boolean)) };
    log('bot-fine', riepilogo);
    return riepilogo;
  }
  const mediana = a => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
  return { avvia, get attivo() { return attivo; } };
})();
