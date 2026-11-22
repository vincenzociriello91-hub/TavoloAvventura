// Gemini finto per le prove: risponde come generateContent, in base al tipo di richiesta.
import http from 'node:http';
const ultimo = { contesto: null };
http.createServer((req, res) => {
  let b = ''; req.on('data', d => b += d); req.on('end', () => {
    const j = JSON.parse(b || '{}');
    const testoUtente = j.contents?.[0]?.parts?.[0]?.text || '';
    let out;
    if (j.systemInstruction) { // turno del master
      const ctx = JSON.parse(testoUtente);
      ultimo.contesto = ctx;
      const pg = ctx.personaggi.find(p => p.nome && !p.nome.startsWith('('));
      const eventi = [];
      if (!ctx.luogo_attuale) eventi.push({ tipo: 'luogo', nome: 'Locanda del Cinghiale Nero', tipoLuogo: 'taverna' });
      if (pg) eventi.push({ tipo: 'danno', pg: pg.id, quantita: 4, zona: 'testa', motivo: 'boccale volante' }, { tipo: 'tiro', pg: pg.id, prova: 'Percezione', cd: 12 }, { tipo: 'oggetto', pg: pg.id, nome: 'Chiave arrugginita' });
      if (ctx.luogo_attuale?.edifici?.length) eventi.push({ tipo: 'edificio', edificio: ctx.luogo_attuale.edifici[0].id, stato: 'bruciato' });
      eventi.push({ tipo: 'nemico', nome: 'Goblin', x: 10, y: 8 });
      const gia = (ctx.png_incontrati || []).map(p => p.nome).join(', ');
      out = JSON.stringify({ narrazione: 'Una rissa scoppia nella locanda. Un boccale vola verso di voi.' + (gia ? ` Di nuovo: ${gia}.` : ''), png: 'Oste Bruno', eventi });
    } else if (/comando per modificare/.test(testoUtente)) out = JSON.stringify({ ops: [{ op: 'car', car: 'sag', delta: 1 }] });
    else if (/Domanda di regole/.test(testoUtente)) out = 'In 5e un attacco di opportunità si fa con la reazione.';
    else out = 'Riassunto finto.';
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: out }] } }] }));
  });
}).listen(8799, () => console.log('gemini finto su 8799'));
