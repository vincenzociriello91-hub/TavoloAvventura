/* Partita bot: ogni volta una campagna NUOVA sul server vero, con 4 personaggi bot e il master AI.
   In pochi minuti provano tutte le funzioni (personaggi, comandi vocali, dadi, master, mappe, edifici, negozio,
   schermo del master, combattimento, tesoro, legami, fazioni, regole, avventura, illustrazioni, riepilogo),
   poi escono. Ogni passo e ogni errore finiscono nel rapporto di chi l'ha avviata. */
const BotProva = (() => {
  const NOMI = ['Aldo', 'Bruna', 'Ciro', 'Dora', 'Elio', 'Fiora', 'Gino', 'Ilde', 'Lapo', 'Mira', 'Nando', 'Olga', 'Pino', 'Rita', 'Saro', 'Tea'];
  const SOPRANNOMI = ['il Saldo', 'Lunaverde', 'Mezzapinta', 'la Pia', 'Testadura', 'Pietrafina', 'Occhiofino', 'Mantonero', 'Passolesto', 'Ramofolto'];
  const AMBIENTI = ['Fantasy classico', 'Montagne innevate del nord', 'Città portuale piena di intrighi', 'Foresta antica e misteriosa', 'Deserto di rovine dimenticate'];
  const FRASI = ['subisco 5 danni', 'recupero 3 punti ferita', "equipaggio l'ascia bipenne", 'indosso un elmo', 'raccolgo una pozione di guarigione', "trovo 25 monete d'oro", 'guadagno 300 punti esperienza', 'sono avvelenato', 'non sono più avvelenato', 'tiro per percezione con vantaggio', 'tiro per furtività', 'lancio un dardo incantato', 'bevo la pozione di guarigione'];
  const LUOGHI = ['Cripta del Re Senza Nome', 'Bosco delle Lucciole', 'Porto di Salmastro', 'Villaggio di Pietrarossa', 'Castello di Rocca Grigia', 'Taverna del Drago Ubriaco', 'Grotta dei Sussurri'];
  const caso = a => a[Math.floor(Math.random() * a.length)];
  const mescola = a => [...a].sort(() => Math.random() - 0.5);
  const dorme = ms => new Promise(r => setTimeout(r, ms));
  let attivo = false;

  // un giocatore bot: la sua connessione, lo stato che riceve e le attese sui messaggi del server
  function cliente(url, nome, log) {
    const c = { nome, io: null, stato: null, attese: [], ws: null };
    c.manda = o => { if (c.ws?.readyState === 1) c.ws.send(JSON.stringify(o)); };
    c.aspetta = (f, ms = 30000) => new Promise(res => { const a = { f, res }; c.attese.push(a); setTimeout(() => { const i = c.attese.indexOf(a); if (i >= 0) { c.attese.splice(i, 1); res(null); } }, ms); });
    c.chiedi = (o, tipo, ms) => { const p = c.aspetta(m => m.t === tipo, ms); c.manda(o); return p; };
    c.pg = () => c.stato?.pg?.[c.io];
    c.salva = nota => c.manda({ t: 'scheda', pg: c.pg(), nota });
    c.apri = primo => new Promise(res => {
      c.ws = new WebSocket(url);
      c.ws.onopen = () => c.manda(primo);
      c.ws.onmessage = e => {
        let m; try { m = JSON.parse(e.data); } catch { return; }
        if (m.t === 'benvenuto') { c.io = m.io; c.stato = m.stato; res(true); }
        if (!c.stato) { if (m.t === 'errore') { log('partita-errore-server', { bot: nome, msg: m.msg }); res(false); } return; }
        if (m.t === 'errore') log('partita-errore-server', { bot: nome, msg: m.msg });
        if (m.t === 'luogo') { c.stato.luogo = m.luogo; c.stato.segnalini = m.segnalini; }
        if (m.t === 'segnalini') c.stato.segnalini = m.segnalini;
        if (m.t === 'scheda') c.stato.pg[m.per] = m.pg;
        if (m.t === 'diario') (c.stato.diario ||= []).push(m.ev);
        if (m.t === 'narra' && nome === 'A') log('partita-narrazione', { png: m.png || null, testo: m.testo });
        if (m.t === 'richiesta_tiro' && m.pg === c.io) setTimeout(() => c.manda({ t: 'dado', formula: 'd20', motivo: m.prova }), 600);
        for (const a of [...c.attese]) if (a.f(m)) { c.attese.splice(c.attese.indexOf(a), 1); a.res(m); }
      };
      c.ws.onerror = () => res(false);
    });
    return c;
  }

  async function avvia(opz) {
    if (attivo) return;
    attivo = true;
    const { log, onPasso = () => {}, onErr = () => {} } = opz;
    const t0 = Date.now(), esiti = [], bot = [];
    const prova = async (nome, fn) => {
      onPasso(nome);
      try { const r = await fn(); const ok = r !== false && r != null; esiti.push({ ok, nome }); log('partita-passo', { passo: nome, ok, dettagli: typeof r === 'object' ? r : undefined }); if (!ok) onErr(nome); }
      catch (e) { esiti.push({ ok: false, nome }); log('partita-passo', { passo: nome, ok: false, errore: e.message }); onErr(`${nome}: ${e.message}`); }
    };
    const narra = (c, ms = 90000) => c.aspetta(m => m.t === 'narra' || (m.t === 'errore' && /master/i.test(m.msg)), ms).then(m => m?.t === 'narra' ? { testo: m.testo.slice(0, 200) } : false);
    const codice = Array.from(crypto.getRandomValues(new Uint32Array(8)), x => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[x % 32]).join('');
    const url = `${opz.server}/tavolo/${codice}/ws`;
    const nomi = mescola(NOMI).slice(0, 4), regole = Math.random() < 0.7 ? '5e' : '3.5';
    const [A, B, C, D] = ['A', 'B', 'C', 'D'].map(n => cliente(url, n, log));
    bot.push(A, B, C, D);
    try {
      await prova('Campagna nuova con il master AI', async () => {
        if (!await A.apri({ t: 'crea', nome: `Partita bot ${new Date().toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`, regole, ambientazione: caso(AMBIENTI), masterTipo: 'ai', ruolo: 'giocatore', mioNome: 'Bot ' + nomi[0], prova: true })) throw new Error('il server non crea la campagna');
        return { codice, regole, ambientazione: A.stato.campagna.ambientazione };
      });
      if (!A.io) throw new Error('campagna non creata');
      for (const [i, c] of [B, C, D].entries()) await prova(`Bot ${nomi[i + 1]} entra con l'invito`, () => c.apri({ t: 'entra', invito: A.stato.campagna.invito, nome: 'Bot ' + nomi[i + 1], ruolo: 'giocatore' }));

      // personaggi tirati a caso, ogni volta diversi
      const set = Regole.set(regole);
      for (const [i, c] of bot.entries()) await prova(`Personaggio di Bot ${nomi[i]}`, async () => {
        const razza = caso(Object.keys(set.razze)), classe = caso(Object.keys(set.classi)), carBase = {};
        for (const k of ['for', 'des', 'cos', 'int', 'sag', 'car']) carBase[k] = Regole.tira4d6();
        const pg = Regole.nuovo(regole, { nome: `${nomi[i]} ${caso(SOPRANNOMI)}`, razza, classe, carBase, competenze: regole === '5e' ? Object.keys(set.abilita).slice(0, set.classi[classe].abilita || 2) : [] });
        c.stato.pg[c.io] = pg; c.salva(`${pg.nome}, ${razza} ${classe}, entra in gioco (partita bot)`);
        await A.aspetta(m => m.t === 'scheda' && m.per === c.io, 8000);
        return { nome: pg.nome, razza, classe, pf: pg.pfMax, ca: pg.ca };
      });

      // comandi vocali: tre frasi a caso per bot, come dal riconoscimento vocale
      for (const c of bot) for (const frase of mescola(FRASI).slice(0, 3)) await prova(`A voce: "${frase}"`, async () => {
        const r = Comandi.interpreta(frase, c.pg(), regole);
        if (r?.ops) { Comandi.applica(c.pg(), r.ops); Regole.ricalcola(c.pg()); c.salva(`a voce: "${frase}"`); return { ops: r.ops.length }; }
        if (r?.dado) { const d = await c.chiedi({ t: 'dado', formula: r.dado.formula, modo: r.dado.modo, motivo: r.dado.motivo }, 'dado', 8000); return d ? { totale: d.tiro.totale } : false; }
        const id = 'b' + Math.random().toString(36).slice(2, 7);
        const attesa = c.aspetta(m => m.t === 'interpretato' && m.id === id, 30000); c.manda({ t: 'interpreta', id, testo: frase, regole }); const ri = await attesa;
        if (ri?.ops?.length) { Comandi.applica(c.pg(), ri.ops); Regole.ricalcola(c.pg()); c.salva(`a voce (AI): "${frase}"`); return { ai: true }; }
        return false;
      });

      // dadi
      for (const [formula, modo] of [['d20', null], ['d100', null], ['2d6+3', null], ['d20', 'vantaggio'], ['d20', 'svantaggio']]) await prova(`Dadi: ${formula}${modo ? ' con ' + modo : ''}`, async () => { const d = await C.chiedi({ t: 'dado', formula, modo, motivo: 'partita bot' }, 'dado', 8000); return d ? { totale: d.tiro.totale, dadi: d.tiro.dadi } : false; });

      // il master AI apre la partita
      await prova('Il master AI apre la partita', () => { const p = narra(A); A.manda({ t: 'parlato', testo: 'Siamo pronti, master: entriamo in città e cerchiamo una locanda', alMaster: true }); return p; });
      if (!A.stato.luogo) { A.manda({ t: 'vai', nome: caso(LUOGHI) }); await A.aspetta(m => m.t === 'luogo', 10000); }
      const primo = A.stato.luogo;

      // mappa: si cammina solo dove si arriva, nei muri no
      await prova('Un bot cammina sulla mappa', async () => {
        const l = A.stato.luogo, s = A.stato.segnalini[D.io], occ = Object.values(A.stato.segnalini);
        const libere = []; for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const x = s.x + dx, y = s.y + dy; if ((dx || dy) && '._,=:"'.includes(l.celle[y]?.[x] || '#') && !occ.some(o => o.x === x && o.y === y) && !(l.oggetti || []).some(o => o.x === x && o.y === y)) libere.push({ x, y }); }
        for (const q of libere.slice(0, 6)) { D.manda({ t: 'segnalino', x: q.x, y: q.y }); const m = await D.aspetta(m => m.t === 'segnalini' && m.segnalini[D.io]?.x === q.x && m.segnalini[D.io]?.y === q.y, 3000); if (m) return q; }
        return false;
      });
      await prova('Il server rifiuta il salto dentro un muro', async () => {
        const l = A.stato.luogo; let muro = null; l.celle.some((r, y) => [...r].some((ch, x) => '#wRT'.includes(ch) && (muro = { x, y })));
        if (!muro) return { nota: 'nessun muro in questo luogo' };
        const prima = { ...A.stato.segnalini[D.io] }; D.manda({ t: 'segnalino', x: muro.x, y: muro.y }); await dorme(1500);
        const ora = A.stato.segnalini[D.io]; return ora.x === muro.x && ora.y === muro.y ? false : { prima, ora }; // altri eventi possono spostarlo, ma mai dentro il muro
      });

      // luoghi ed edifici
      const meta = caso(LUOGHI.filter(n => n !== primo?.nome));
      await prova(`Viaggio a ${meta}`, async () => { A.manda({ t: 'vai', nome: meta }); const m = await A.aspetta(m => m.t === 'luogo' && m.luogo.nome === meta, 15000); return m ? { tipo: m.luogo.tipo, edifici: m.luogo.edifici.length } : false; });
      await prova('Entrare in un edificio e uscire', async () => {
        const ed = A.stato.luogo.edifici.find(e => e.stato !== 'distrutto' && !/pozzo|torre|radura/i.test(e.nome));
        if (!ed) return { nota: 'nessun edificio in questo luogo' };
        A.manda({ t: 'entra_edificio', edificio: ed.id }); const dentro = await A.aspetta(m => m.t === 'luogo' && m.luogo.genitore, 45000);
        if (!dentro) return false;
        A.manda({ t: 'esci_edificio' }); const fuori = await A.aspetta(m => m.t === 'luogo' && !m.luogo.genitore, 15000);
        return fuori ? { edificio: ed.nome, stanze: dentro.luogo.edifici.length } : false;
      });

      // negozio
      await prova('Negozio: compra e rivendi', async () => {
        A.manda({ t: 'apri_negozio', nome: 'Fabbro Ulrico', tipo: 'fabbro' }); await C.aspetta(m => m.t === 'negozio' && m.negozio, 8000);
        const oro = C.pg().oro || 0; if (oro < 5) { C.pg().oro = oro + 20; C.salva('trova 20 monete (partita bot)'); await dorme(500); }
        const comprato = await C.chiedi({ t: 'compra', merce: 'Pugnale' }, 'scheda', 8000);
        if (comprato?.pg) C.stato.pg[C.io] = comprato.pg;
        const venduto = await C.chiedi({ t: 'vendi', indice: C.pg().equip.map(e => e.nome).lastIndexOf('Pugnale') }, 'scheda', 8000);
        A.manda({ t: 'chiudi_negozio' });
        return comprato && venduto ? { oro: C.pg().oro } : false;
      });

      // schermo del master
      let mostri = null;
      for (const [tipo, extra] of [['png', {}], ['incontro', { difficolta: caso(['facile', 'media', 'difficile']) }], ['tesoro', { gs: 1 + Math.floor(Math.random() * 4) }]]) await prova(`Schermo del master: ${tipo}`, async () => { const m = await A.chiedi({ t: 'strumento', tipo, ...extra }, 'strumento', 45000); if (tipo === 'incontro') mostri = m?.ris?.mostri; return m?.ris ? { ris: JSON.stringify(m.ris).slice(0, 200) } : false; });
      if (mostri) { A.manda({ t: 'piazza_nemici', mostri }); await A.aspetta(m => m.t === 'segnalini', 8000); }

      // combattimento
      await prova('Combattimento: ordine, turni, area, fine', async () => {
        const c = await A.chiedi({ t: 'combattimento', azione: 'inizia' }, 'combattimento', 10000); if (!c?.combattimento?.attivo) return false;
        for (let k = 0; k < 3; k++) { A.manda({ t: 'combattimento', azione: 'prossimo' }); await dorme(400); }
        const s = A.stato.segnalini[B.io]; const ar = await C.chiedi({ t: 'area', forma: caso(['cerchio', 'cono', 'linea', 'quadrato']), x: s.x + 2, y: s.y, dim: 2, dir: 'e', nome: 'Palla di fuoco' }, 'aree', 8000);
        A.manda({ t: 'area', pulisci: true }); A.manda({ t: 'combattimento', azione: 'fine' });
        return ar ? { ordine: c.combattimento.ordine.map(o => o.nome).join(', ') } : false;
      });

      // gruppo, legami, mondo, regole, statistiche, libro
      await prova('Tesoro comune', async () => { A.manda({ t: 'gruppo', op: 'oggetto', nome: 'Corda', qta: 1 }); await dorme(600); D.manda({ t: 'gruppo', op: 'prendi', nome: 'Corda' }); return !!await D.aspetta(m => m.t === 'scheda' && m.per === D.io && m.pg.equip.some(e => e.nome === 'Corda'), 8000); });
      await prova('Legame tra personaggi', async () => !!await B.chiedi({ t: 'relazione', con: C.io, livello: 'amici stretti' }, 'relazioni', 8000));
      await prova('Fazione e valuta locale', async () => { const attesa = C.aspetta(m => m.t === 'mondo', 8000); A.manda({ t: 'mondo', fazione: 'Gilda dei Bot', reputazione: 10 }); const m = await attesa; A.manda({ t: 'mondo', valuta: 'Scudi di prova', cambio: 0.5 }); return !!m; });
      await prova('Domanda sulle regole', async () => { const m = await A.chiedi({ t: 'regola', testo: caso(['come funziona il vantaggio?', 'come funziona un attacco di opportunità?', 'quanto dura un round?']) }, 'regola', 45000); return m ? { risposta: (m.testo || '').slice(0, 200) } : false; });
      await prova('Statistiche e trofei', async () => !!await A.chiedi({ t: 'statistiche' }, 'statistiche', 10000));
      await prova('Libro della campagna', async () => { const m = await A.chiedi({ t: 'libro' }, 'libro', 10000); return m ? { pg: m.pg?.length } : false; });

      // livelli
      await prova('Salire di livello', async () => { for (const c of bot) { Regole.saliLivello(c.pg()); c.salva(`sale al livello ${c.pg().livello} (partita bot)`); } return { livello: A.pg().livello }; });

      // avventura pronta, azione di un bot, illustrazione
      await prova('Avventura pronta "La miniera dei goblin"', () => { const p = narra(A); A.manda({ t: 'avventura_inizia', id: 'miniera' }); return p; });
      await prova("Il master risponde all'azione di un bot", () => { const p = narra(A); C.manda({ t: 'chat', testo: caso(["Chiedo all'oste se ha visto i goblin", 'Cerco tracce intorno al villaggio', 'Offro una moneta al primo che mi indica la miniera']), alMaster: true }); return p; });
      await prova('Illustrazione della scena', async () => { A.manda({ t: 'illustra' }); return !!await A.aspetta(m => m.t === 'diario' && m.ev?.tipo === 'illustrazione', 90000); });

      // la mappa di un luogo già visto resta identica
      if (primo) await prova('Mappe persistenti', async () => { A.manda({ t: 'vai', nome: primo.nome }); const m = await A.aspetta(m => m.t === 'luogo' && m.luogo.nome === primo.nome, 15000); return !!m && JSON.stringify(m.luogo.celle) === JSON.stringify(primo.celle); });

      await prova('Riepilogo illustrato della serata', async () => { A.manda({ t: 'riepilogo' }); return !!await A.aspetta(m => m.t === 'riepilogo' || (m.t === 'diario' && m.ev?.tipo === 'riepilogo'), 150000); });
    } catch (e) { onErr(e.message); log('partita-errore', { msg: e.message }); }

    // i bot escono; la campagna di prova resta solo sul server, mai tra le campagne di chi l'ha avviata
    for (const c of [D, C, B, A]) { c.manda({ t: 'esci' }); await dorme(300); try { c.ws?.close(); } catch {} }
    attivo = false;
    const r = { codice, durataS: Math.round((Date.now() - t0) / 1000), ok: esiti.filter(e => e.ok).length, falliti: esiti.filter(e => !e.ok).map(e => e.nome) };
    log('partita-fine', r);
    return r;
  }
  return { avvia, get attivo() { return attivo; } };
})();
