// Gemini finto per le prove: risponde come generateContent, in base al tipo di richiesta.
import http from 'node:http';
const ultimo = { contesto: null };
http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/ultima-voce') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify(ultimo.voci || [])); } // per le prove: che cosa è stato mandato ai modelli di voce
  let b = ''; req.on('data', d => b += d); req.on('end', () => {
    const j = JSON.parse(b || '{}');
    const testoUtente = j.contents?.[0]?.parts?.[0]?.text || '';
    let out;
    if (j.generationConfig?.responseModalities?.includes('AUDIO')) { // voce: mezzo secondo di tono a 24 kHz
      ultimo.voci = [...(ultimo.voci || []), { modello: (req.url.match(/models\/([^:]+)/) || [])[1], testo: testoUtente.slice(0, 80) }].slice(-10);
      const pcm = new Int16Array(12000).map((_, i) => Math.sin(i / 8) * 6000);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ candidates: [{ content: { parts: [{ inlineData: { mimeType: 'audio/L16;codec=pcm;rate=24000', data: Buffer.from(pcm.buffer).toString('base64') } }] } }] }));
    }
    if (j.systemInstruction) { // turno del master
      const ctx = JSON.parse(testoUtente);
      if ((ctx.ultimi_eventi || []).some(e => e.includes('prova quota finita'))) { res.writeHead(429, { 'Content-Type': 'application/json' }); return res.end('{}'); }
      ultimo.contesto = ctx;
      const pg = ctx.personaggi.find(p => p.nome && !p.nome.startsWith('('));
      const eventi = [];
      if (!ctx.luogo_attuale) eventi.push({ tipo: 'luogo', nome: 'Locanda del Cinghiale Nero', tipoLuogo: 'taverna' });
      if (pg) eventi.push({ tipo: 'danno', pg: pg.id, quantita: 4, zona: 'testa', motivo: 'boccale volante' }, { tipo: 'tiro', pg: pg.id, prova: 'Percezione', cd: 12 }, { tipo: 'oggetto', pg: pg.id, nome: 'Chiave arrugginita' });
      if (ctx.luogo_attuale?.edifici?.length) eventi.push({ tipo: 'edificio', edificio: ctx.luogo_attuale.edifici[0].id, stato: 'bruciato' });
      if (ctx.luogo_attuale?.oggetti_di_scena?.length) eventi.push({ tipo: 'scena', azione: 'rompi', oggetto: ctx.luogo_attuale.oggetti_di_scena[0].id });
      eventi.push({ tipo: 'nemico', nome: 'Goblin', x: 10, y: 8 }, { tipo: 'nemico', nome: 'Lupo crudele', x: 12, y: 8 });
      if ((ctx.ultimi_eventi || []).some(e => e.includes('mondo vivo di prova')) && pg) eventi.push({ tipo: 'enigma', domanda: 'Più ne togli, più diventa grande. Cos\'è?', risposta: 'buca', indizio: 'si scava' }, { tipo: 'missione', titolo: 'Lupi al mulino', descrizione: 'Cacciate i lupi dal mulino', ricompensa: '50 mo' }, { tipo: 'nemesi', nome: 'Vaskar il Grigio', descrizione: 'mago rinnegato' }, { tipo: 'minaccia', nome: 'Il culto della luna', descrizione: 'rapisce i viandanti' }, { tipo: 'scelta', descrizione: 'Hanno risparmiato il goblin', peso: 'buona' }, { tipo: 'sogno', pg: pg.id, testo: 'Una torre nera sotto la luna' }, { tipo: 'reputazione_luogo', luogo: ctx.luogo_attuale?.nome, delta: 100, motivo: 'eroi' }, { tipo: 'compagno', pg: pg.id, nome: 'Zanna', specie: 'lupo' });
      if (JSON.stringify(j.systemInstruction).includes('SFIDA DELLA SETTIMANA')) eventi.push({ tipo: 'sfida_vinta' });
      const ue = ctx.ultimi_eventi || [], sys = JSON.stringify(j.systemInstruction);
      if (ue.some(e => e.includes('prova dei fatti'))) eventi.push({ tipo: 'fatto', testo: 'Nel forziere della cripta ci sono 30 monete e una chiave d\'argento' });
      // per le prove della regia (4.1): cosa ha ricevuto il master
      const regia = ue.some(e => e.includes('prova del master onesto')) ? ` [fatti:${(ctx.fatti_decisi || []).length}|appunti:${ctx.appunti_del_mondo ? 'si' : 'no'}|dura:${/MODALITÀ DURA/.test(sys)}|onesto:${/arbitro onesto/.test(sys) && /Decidi i fatti prima/.test(sys)}|giro:${ctx.giro ? 'si' : 'no'}]` : '';
      const segr = ctx.azioni_segrete || [];
      if (segr.length) { const id = segr[0].match(/\(pg ([^)]+)\)/)?.[1]; eventi.push({ tipo: 'privato', pg: id, testo: `Segreto ricevuto: ${segr.length}` }); }
      if (ue.some(e => e.includes('ci accampiamo per la notte'))) eventi.push({ tipo: 'riposo', lungo: true });
      if (ue.some(e => e.includes('missione a tempo'))) eventi.push({ tipo: 'missione', titolo: 'Il ponte crollato', descrizione: 'Riparare il ponte', ricompensa: '20 mo', entro: 3 });
      if (ue.some(e => e.includes('passano cinque giorni'))) eventi.push({ tipo: 'tempo', giorni: 5 });
      if (ue.some(e => e.includes('passa un mese intero'))) eventi.push({ tipo: 'tempo', giorni: 30 });
      if (ue.some(e => e.includes('musica di festa'))) eventi.push({ tipo: 'musica', umore: 'festa' });
      const distanza = ue.some(e => e.includes('prova della prima partita')) ? ` [prima:${/PRIMA PARTITA/.test(sys)}|distanza:${/gioco a distanza/.test(String(ctx.giro))}]` : '';
      const vg = (ctx.viaggio ? ` [viaggio:${ctx.viaggio.verso}|${ctx.viaggio.giorno}/${ctx.viaggio.giorni}|in_corso:${ctx.viaggio.in_corso}]` : '') + (ctx.creature_e_oggetti_inventati?.mostri?.length ? ` [inventati:${ctx.creature_e_oggetti_inventati.mostri.map(x => x.nome).join(',')}]` : '');
      const gia = (ctx.png_incontrati || []).map(p => p.nome).join(', ');
      out = JSON.stringify({ narrazione: 'Una rissa scoppia nella locanda. Un boccale vola verso di voi.' + (gia ? ` Di nuovo: ${gia}.` : '') + regia + distanza + vg, png: 'Oste Bruno', eventi });
    } else if (/comando per modificare/.test(testoUtente)) out = JSON.stringify({ ops: [{ op: 'car', car: 'sag', delta: 1 }] });
    else if (/^Traduci in inglese/.test(testoUtente)) out = 'The tavern falls silent.';
    else if (/Domanda di regole/.test(testoUtente)) out = 'In 5e un attacco di opportunità si fa con la reazione.';
    else if (/Racconta la serata/.test(testoUtente)) out = JSON.stringify({ titolo: 'La rissa del Cinghiale', racconto: 'Una serata di boccali volanti e goblin sconfitti.', prompt: 'heroes celebrating in a tavern' });
    else if (/PROMPT:/.test(testoUtente)) out = 'PROMPT: a tavern brawl, flying mugs\nDIDASCALIA: Rissa nella locanda';
    else if (/===CRONACA===/.test(testoUtente)) out = 'Memoria finta aggiornata.\n===CRONACA===\n• Il gruppo ha fatto a botte nella locanda.';
    else if (/pagina del tuo diario personale/.test(testoUtente)) out = 'Oggi ho visto il drago da vicino e mi tremavano le mani.';
    else if (/cantastorie di piazza/.test(testoUtente)) out = 'Riassunto in rima finto.';
    else if (/riassunto completo/.test(testoUtente)) out = 'Riassunto completo finto.';
    else out = 'Riassunto finto.';
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: out }] } }] }));
  });
}).listen(8799, () => console.log('gemini finto su 8799'));
