// Tavolo d'Avventura — Mappa. Si carica dopo app.js, nell'ordine scritto in index.html.
/* ============ MAPPA ============ */
const largo = () => matchMedia('(min-width: 1100px)').matches;
Mappa.init($('#mappa'), {
  io: () => S.io,
  puoMuovere: id => id === S.io || capo() || S.st?.segnalini?.[id]?.padrone === S.io, // anche il proprio animale
  capo: () => capo(),
  vediTutto: () => document.body.classList.contains('tv'), // sulla TV la mappa inquadra sempre tutta la parte scoperta
  onBloccato: () => toast('Non ci si arriva da qui: c\'è un muro o un ostacolo in mezzo', true),
  onMuovi: (id, x, y) => invia({ t: 'segnalino', id, x, y }),
  pg: id => S.st?.pg?.[id],
  puoMuovereOggetti: () => me()?.ruolo === 'master',
  onMuoviOggetto: (id, x, y) => invia({ t: 'scena', azione: 'sposta', oggetto: id, x, y }),
  onLampo: () => Suoni.effetto('tuono'),
  urlMostro: n => S.st?.mostri?.[n] ? urlMedia('img', S.st.mostri[n]) : null,
  onCambio: () => { if (S.m3) S.m3.aggiorna(Mappa.dati3D()); },
  altezzaMax: () => largo() || document.body.classList.contains('tv') ? window.innerHeight - 200 : 9999,
  onEdificio: async ed => {
    const puoEntrare = (capo() || masterAI()) && !['dungeon', 'grotta', 'taverna', 'interno'].includes(S.st.luogo?.tipo) && ed.stato !== 'distrutto' && !/pozzo|torre|radura|ponte|viadotto|guado/i.test(ed.nome);
    if (me()?.ruolo !== 'master') { // lo stato degli edifici lo cambia solo il master (AI con gli eventi, umano da qui)
      if (!puoEntrare) { toast(`${ed.nome}${ed.stato !== 'integro' ? ' — ' + ed.stato : ''}`); return; }
      const i = await chiedi(`<h2>${esc(ed.nome)}</h2>${ed.stato !== 'integro' ? `<p>Stato: ${esc(ed.stato)}</p>` : ''}`, [{ testo: 'Entra', pieno: true }, { testo: 'Chiudi' }]);
      if (i === 0) invia({ t: 'entra_edificio', edificio: ed.id });
      return;
    }
    const stati = ['integro', 'danneggiato', 'bruciato', 'distrutto'];
    const i = await chiedi(`<h2>${esc(ed.nome)}</h2><p>Stato attuale: <strong>${esc(ed.stato)}</strong>. Il cambiamento resta sulla mappa per sempre.</p>`, [...(puoEntrare ? [{ testo: 'Entra', pieno: true }] : []), ...stati.map(s => ({ testo: s.charAt(0).toUpperCase() + s.slice(1) })), { testo: 'Chiudi' }]);
    const k = puoEntrare ? i - 1 : i;
    if (puoEntrare && i === 0) { invia({ t: 'entra_edificio', edificio: ed.id }); return; }
    if (k >= 0 && k < stati.length && stati[k] !== ed.stato) invia({ t: 'modifica_luogo', edificio: ed.id, stato: stati[k] });
  }
});
function renderMappa() {
  const l = S.st?.luogo;
  $('#mappaVuota').hidden = !!l;
  $('#mappa').hidden = !l;
  $('#luogoNome').textContent = l ? l.nome : 'Nessun luogo';
  const TIPI = { citta: 'città', villaggio: 'villaggio', taverna: 'taverna', dungeon: 'dungeon', foresta: 'foresta', grotta: 'grotta', castello: 'castello', porto: 'porto', aperto: 'all\'aperto' };
  $('#luogoTipo').textContent = l ? `${TIPI[l.tipo] || (l.tipo === 'interno' ? 'interno' : l.tipo)}${l.visite > 1 ? ' · visitato ' + l.visite + ' volte' : ''}` : '';
  $('#btnEsciEd').hidden = !(l?.genitore && (capo() || masterAI()));
  Mappa.setAmbiente(S.st?.mondo?.calendario);
  if (l) { Mappa.imposta(l, S.st.segnalini, S.st.membri); aggiornaExtraMappa(); }
  if (OPZ.vista3d && l && (!S.m3 || $('#mappa3dBox').hidden)) vista3D(true);
}
function aggiornaScenaSonora() { const c = S.st?.combattimento, boss = c?.attivo && c.ordine?.some(o => o.nemico !== false && /boss|capo|re |regina|drago|grumsh|lich|demone|gigante|ogre|troll/i.test(o.nome || '')); Suoni.scena(c?.attivo ? (boss ? 'boss' : 'combattimento') : S.st?.luogo?.tipo || 'aperto'); }
function aggiornaExtraMappa() {
  aggiornaScenaSonora();
  const c = S.st?.combattimento, ora = c?.attivo && c.ordine[c.turno];
  const pg = mioPg();
  Mappa.setExtra({ aree: S.st?.aree || [], vedeTutto: capo(), movimento: ora && ora.id === S.io && pg ? { id: S.io, celle: Math.max(1, Math.floor((pg.vel || 9) / 1.5)) } : null });
}
// ogni mappa nuova si controlla da sola: se qualcosa non va finisce nel rapporto (e lo vedo senza che nessuno lo dica)
function controllaMappa() {
  clearTimeout(S.timerControllo);
  S.timerControllo = setTimeout(async () => { if (!S.st?.luogo || document.hidden) return; try { const p = await Mappa.controllo(); S.problemiMappa = p; if (p.length) { Report.log('problema-grafica', { luogo: S.st.luogo.nome, tipo: S.st.luogo.tipo, problemi: p }); invia({ t: 'segnala_problema', testo: `Mappa ${S.st.luogo.tipo}: ${p.join(' | ')}` }); } } catch (e) { Report.log('problema-grafica', { errore: String(e).slice(0, 200) }); } }, 2500);
}
function renderCombat() {
  const c = S.st?.combattimento, box = $('#combat');
  $('#btnCombat').textContent = c?.attivo ? 'Fine combattimento' : 'Inizia combattimento';
  box.hidden = !c?.attivo;
  aggiornaExtraMappa();
  if (!c?.attivo) return;
  const ora = c.ordine[c.turno];
  if (!ora) { Report.log('problema', { cosa: 'combattimento senza nessuno in ordine', round: c.round, ordine: c.ordine.length }); invia({ t: 'segnala_problema', testo: 'Combattimento attivo senza nessuno in ordine di iniziativa' }); }
  const posso = ora && (ora.id === S.io || capo());
  box.innerHTML = `<div class="testa"><span>Round ${c.round} · ${ora ? `tocca a <strong>${esc(ora.nome)}</strong>` : 'nessuno in ordine: chiudi e riapri il combattimento quando ci sono personaggi o nemici'}</span>${posso ? '<button id="btnFineTurno" class="pieno" type="button">Fine turno</button>' : ''}</div>
    <ol>${c.ordine.map((o, i) => `<li class="${i === c.turno ? 'ora' : ''} ${o.tipo === 'nemico' ? 'nemico' : ''}" title="${esc(o.nome)} · iniziativa ${o.iniz}"><img src="${Volti.diTurno(o)}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'lettera',textContent:this.dataset.l}))" data-l="${esc(String(o.nome || '?').charAt(0).toUpperCase())}">${esc(stileGioco() ? String(o.nome || '?').split(' ')[0] : o.nome)} <span class="piccolo">${o.iniz}</span></li>`).join('')}</ol>`;
  box.querySelector('li.ora')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  $('#btnFineTurno')?.addEventListener('click', () => invia({ t: 'combattimento', azione: 'prossimo' }));
}
$('#btnCombat').addEventListener('click', () => invia({ t: 'combattimento', azione: S.st?.combattimento?.attivo ? 'fine' : 'inizia' }));
$('#btnPulisciAree').addEventListener('click', () => invia({ t: 'area', pulisci: true }));
$('#btnArea').addEventListener('click', async () => {
  if (!S.st?.luogo) { toast('Prima serve un luogo con la mappa'); return; }
  const forme = ['cerchio', 'quadrato', 'cono', 'linea'];
  const i = await chiedi(`<h2>Area incantesimo</h2><label>Nome (facoltativo)<input id="arNome" maxlength="40" placeholder="Es. Palla di fuoco"></label><label>Misura in quadretti (1 quadretto = 1,5 m)<input id="arDim" type="number" min="1" max="20" value="4"></label><label>Direzione (cono e linea)<select id="arDir"><option value="e">Destra</option><option value="o">Sinistra</option><option value="n">Su</option><option value="s">Giù</option></select></label><p class="piccolo">Scegli la forma, poi tocca il punto sulla mappa.</p>`, [...forme.map(f => ({ testo: f.charAt(0).toUpperCase() + f.slice(1) })), { testo: 'Annulla' }]);
  if (i < 0 || i >= forme.length) return;
  const cfg = { forma: forme[i], dim: Number($('#arDim').value) || 4, dir: $('#arDir').value, nome: $('#arNome').value.trim() };
  toast('Tocca il centro o l\'origine dell\'area sulla mappa');
  Mappa.chiediCasella((x, y) => invia({ t: 'area', ...cfg, x, y, colore: me()?.colore }));
});
function renderTesoro() {
  const g = S.st?.gruppo || { oro: 0, oggetti: [] }, box = $('#tesoro');
  if (!box) return;
  const gioca = me()?.ruolo === 'giocatore' || capo();
  box.innerHTML = `<h3 style="margin-top:0">Tesoro del gruppo</h3>
    <div class="riga"><span>Monete in comune: <strong>${g.oro}</strong></span>${gioca ? '<button type="button" data-tes="deposita">Metti monete</button><button type="button" data-tes="dividi">Dividi il bottino</button>' : ''}</div>
    <ul class="tesoro-ogg">${g.oggetti.map(o => `<li><span>${esc(o.nome)}${o.qta > 1 ? ' ×' + o.qta : ''}</span>${gioca ? `<button type="button" data-prendi="${esc(o.nome)}">Prendi</button>` : ''}</li>`).join('') || '<li class="piccolo">Nessun oggetto in comune</li>'}</ul>
    ${gioca ? '<form id="formTesoro" class="riga" autocomplete="off"><input id="tesOggetto" maxlength="60" placeholder="Metti un oggetto in comune"><button class="pieno">Metti</button></form>' : ''}
    <p class="piccolo">A voce: "metti 20 monete nel tesoro comune", "dividi il bottino".</p>${cartaCasa(gioca)}${cartaGioco(gioca)}`;
  applicaPieghe();
}
// giochi di taverna: dadi o carte con le monete della scheda, chi vince prende il piatto
function cartaGioco(gioca) {
  const g = S.st?.giocoTaverna, nomeDi = id => S.st.pg?.[id]?.nome || S.st.membri?.[id]?.nome || '?';
  if (!g) return gioca ? `<h3>Giochi di taverna</h3><form class="riga" id="formGioco" autocomplete="off"><select id="giocoTipo" aria-label="Gioco"><option value="dadi">Dadi: 2d6, vince il più alto</option><option value="carte">Carte: vince la più alta</option></select><input id="giocoPosta" type="number" min="1" max="100" value="5" inputmode="numeric" style="width:80px;flex:0 0 80px" aria-label="Posta in monete"><button>Apri il tavolo</button></form><p class="piccolo">Si gioca con le monete della scheda: chi vince prende tutto il piatto.</p>` : '';
  const dentro = g.giocatori.includes(S.io), mio = g.da === S.io || capo();
  return `<h3>Tavolo di ${g.tipo}: posta ${g.posta} mo</h3><p class="piccolo">Giocano: ${g.giocatori.map(id => esc(nomeDi(id))).join(', ')} · nel piatto ${g.posta * g.giocatori.length} mo</p>
    <div class="riga">${gioca && !dentro ? `<button type="button" data-gioco="entra">Gioco anch'io (${g.posta} mo)</button>` : ''}${mio ? `<button type="button" class="pieno" data-gioco="via" ${g.giocatori.length < 2 ? 'disabled' : ''}>${g.tipo === 'dadi' ? 'Tirate i dadi!' : 'Girate le carte!'}</button><button type="button" data-gioco="annulla">Chiudi il tavolo</button>` : ''}</div>`;
}
// casa del gruppo: si compra e si arreda col tesoro comune, ogni stanza dà un vantaggio
function cartaCasa(gioca) {
  const b = S.st?.base, st = S.st?.catalogo?.stanze || {};
  if (!b) return `<h3>Casa del gruppo</h3><p class="piccolo">Una base tutta vostra dove riposare, creare oggetti e tenere le cavalcature.</p>${gioca ? '<button type="button" data-casa="casa">Comprate una casa (500 mo dal tesoro comune)</button>' : ''}`;
  return `<h3>${esc(b.nome)}</h3><ul class="tesoro-ogg">${b.stanze.map(k => `<li><span><strong>${esc(st[k]?.nome || k)}</strong> <span class="piccolo">${esc(st[k]?.bonus || '')}</span></span></li>`).join('') || '<li class="piccolo">Per ora solo muri e un camino</li>'}</ul>
    ${gioca ? `<details><summary>Aggiungi una stanza</summary><ul class="tesoro-ogg">${Object.entries(st).filter(([k]) => !b.stanze.includes(k)).map(([k, x]) => `<li><span>${esc(x.nome)} <span class="piccolo">${esc(x.bonus)}</span></span><button type="button" data-casa="${k}">${x.prezzo} mo</button></li>`).join('')}</ul></details>` : ''}`;
}
$('#tesoro').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.prendi) invia({ t: 'gruppo', op: 'prendi', nome: b.dataset.prendi });
  if (b.dataset.gioco) invia({ t: 'gioco_' + b.dataset.gioco });
  if (b.dataset.casa) { invia({ t: 'base', cosa: b.dataset.casa === 'casa' ? '' : b.dataset.casa }); Report.log('casa', { cosa: b.dataset.casa }); }
  if (b.dataset.tes === 'dividi') invia({ t: 'gruppo', op: 'dividi' });
  if (b.dataset.tes === 'deposita') { const v = parseInt(prompt('Quante monete metti nel tesoro comune?'), 10); if (v > 0) { if (mioPg()) modifica([{ op: 'oro', delta: -v }]); invia({ t: 'gruppo', op: 'oro', delta: v }); } }
});
$('#tesoro').addEventListener('submit', e => { e.preventDefault(); if (e.target.id === 'formGioco') { invia({ t: 'gioco_apri', tipo: $('#giocoTipo').value, posta: +$('#giocoPosta').value }); Report.log('gioco_taverna', {}); return; } const n = $('#tesOggetto').value.trim(); if (n) invia({ t: 'gruppo', op: 'oggetto', nome: n, qta: 1 }); });
$('#btnEsciEd').addEventListener('click', () => invia({ t: 'esci_edificio' }));
$('#formVai').addEventListener('submit', e => { e.preventDefault(); const n = $('#vaiNome').value.trim(); if (!n) return; invia({ t: 'vai', nome: n }); $('#vaiNome').value = ''; Report.log('vai', { nome: n }); });
// volto del PNG: illustrato dall'AI quando è pronto, altrimenti quello in pixel art
function mostraVolto(png) {
  const id = S.st?.volti?.[png], box = $('#narrVolto');
  box.innerHTML = id ? `<img src="${urlMedia('img', id)}" alt="${esc(png)}" class="volto-png">` : Ritratto.volto(png, 64);
  const im = box.querySelector('img'); if (im) { im.onerror = () => { box.innerHTML = Ritratto.volto(png, 64); }; im.onload = () => { if (im.naturalWidth < 8) im.onerror(); }; } // volto non disponibile o vuoto: quello in pixel art
}
function mostraNarrazione(testo, png) {
  const n = $('#narrazione'); n.hidden = false; n.classList.remove('pensa');
  $('#narrChi').textContent = png ? (stileGioco() ? png : `${png} (dal master)`) : 'Il master'; $('#narrChi').dataset.png = png || '';
  Scrittura.scrivi($('#narrTesto'), testo);
  // nella casella c'è sempre un volto: quello del personaggio che parla, oppure il master col cappuccio
  $('#narrVolto').hidden = !png && !stileGioco();
  if (png) mostraVolto(png); else if (stileGioco()) $('#narrVolto').innerHTML = `<img src="${Volti.master()}" alt="" width="64" height="64">`;
}
$('#btnZitto').addEventListener('click', () => { Narratore.zitto(); $('#narrazione').hidden = true; });
Narratore.onInizio = () => { Ascolto.pausa(true); $('#av-master')?.classList.add('parla'); };
Narratore.onFine = () => { Ascolto.pausa(false); $('#av-master')?.classList.remove('parla'); };
// sottotitoli: il testo del master a frasi, ognuna per il tempo che ci mette a dirla
let timerSottotitoli = [];
Narratore.onFrase = (testoS, durata) => {
  timerSottotitoli.forEach(clearTimeout); timerSottotitoli = [];
  const el = $('#sottotitoli');
  if (!testoS || OPZ.sottotitoli === false) { el.hidden = true; return; }
  const frasi = testoS.match(/[^.!?…]+[.!?…]*["»”]?\s*/g)?.map(f => f.trim()).filter(Boolean) || [testoS];
  const tot = frasi.reduce((a, f) => a + f.length, 0); let t = 0;
  frasi.forEach(f => { timerSottotitoli.push(setTimeout(() => { el.textContent = f; el.hidden = false; }, t)); t += durata * f.length / tot; });
  timerSottotitoli.push(setTimeout(() => { el.hidden = true; }, t + 600));
};
