// Tavolo d'Avventura — Regia: cronaca, appunti del mondo, turni a giro e gioco a distanza, messaggi privati, aiuto, azioni del turno, mazzo, ricerca nel diario, riassunti, mondi condivisi, primi passi.
/* ============ COSA RICORDA IL MASTER ============ */
function renderCronaca() {
  const box = $('#cronaca'); if (!box || !S.st) return;
  const t = (S.st.cronaca || '').trim();
  box.innerHTML = t ? t.split(/\n+/).filter(Boolean).map(r => `<p>${esc(r.replace(/^[•\-*]\s*/, '• '))}</p>`).join('') : '<p class="piccolo">Per ora niente: dopo un po\' di gioco qui compare quello che il master ricorda della vostra campagna.</p>';
  $('#formRicorda').hidden = !capo();
}
$('#formRicorda').addEventListener('submit', e => { e.preventDefault(); const t = $('#ricordaTesto').value.trim(); if (!t) return; if (invia({ t: 'ricorda', testo: t })) { $('#ricordaTesto').value = ''; toast('Il master lo ricorderà'); Report.log('ricorda', {}); } });

/* ============ TURNI A GIRO ============ */
function renderGiro() {
  const g = S.st?.giro, box = $('#giroStato'); if (!box) return;
  const c = S.st?.campagna, lontano = !!c?.differito;
  const attivo = !!((c?.giro || lontano) && masterAI() && g && !S.st.combattimento?.attivo && (g.detti.length || lontano));
  box.hidden = !attivo; if (!attivo) return;
  const tocca = me()?.ruolo === 'giocatore' && mioPg() && !g.detti.includes(S.io), altri = g.mancano.filter(n => !tocca || n !== me().nome);
  const titolo = lontano ? 'Gioco a distanza' : 'Turni a giro', quando = lontano && g.scade ? ` Il master risponde quando avete scritto tutti, al più tardi ${quandoScade(g.scade)}.` : ' Poi il master risponde a tutti insieme.';
  $('#giroTesto').textContent = !g.mancano.length ? 'Tutti hanno detto la loro: il master risponde.'
    : lontano && !g.detti.length ? (tocca ? 'Gioco a distanza: scrivi cosa fa il tuo personaggio quando vuoi. Il master risponde quando avete scritto tutti.' : 'Gioco a distanza: ognuno scrive quando può, il master risponde quando hanno scritto tutti.')
    : tocca ? `${titolo}: tocca a te dire cosa fai${altri.length ? ` (manca anche ${altri.join(', ')})` : ''}.${quando}` : `${titolo}: manca ${g.mancano.join(', ')}.${quando}`;
  $('#btnGiroOra').hidden = !capo() || !g.mancano.length || !g.detti.length;
  $('#btnGiroAvvisi').hidden = !(lontano && 'PushManager' in window && me()?.ruolo === 'giocatore' && !leggi('ta_push', false));
}
// «entro stasera alle 21:30», «entro domani alle 9:00», «entro giovedì alle 9:00»
function quandoScade(t) {
  const d = new Date(t), oggi = new Date(), giorni = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate())) / 86400000);
  const ora = d.toLocaleTimeString('it-IT', { hour: 'numeric', minute: '2-digit' });
  return `${giorni <= 0 ? 'oggi' : giorni === 1 ? 'domani' : d.toLocaleDateString('it-IT', { weekday: 'long' })} alle ${ora}`;
}
$('#btnGiroAvvisi').addEventListener('click', () => invia({ t: 'push_chiave' }));
// gioco a distanza: chi rientra trova subito l'ultima risposta del master, se è arrivata dopo la sua ultima mossa
function riprendiDistanza() {
  if (!S.st?.campagna?.differito || !masterAI()) return;
  const d = S.st.diario || [], iN = d.map(x => x.tipo === 'narrazione' && x.chi === 'master').lastIndexOf(true), iMio = d.map(x => x.chi === S.io && ['chat', 'parlato'].includes(x.tipo)).lastIndexOf(true);
  if (iN > iMio && iN >= 0) { mostraNarrazione(d[iN].testo, d[iN].png); Scrittura.tutto(); Report.log('distanza-ripresa', {}); }
}
$('#btnGiroOra').addEventListener('click', () => invia({ t: 'master_ora' }));
// chi non sta guardando il diario lo viene a sapere lo stesso: a chi non ha ancora parlato si dice che tocca a lui
function avvisaGiro(g) {
  if (!g?.detti.length || !g.mancano.length || S.vista === 'vDiario' || largo()) return;
  const tocca = me()?.ruolo === 'giocatore' && !g.detti.includes(S.io), titolo = g.differito ? 'Gioco a distanza' : 'Turni a giro';
  toast(tocca ? `${titolo}: tocca anche a te dire cosa fai` : `${titolo}: manca ${g.mancano.join(', ')}`, false, 5000);
}

/* ============ MESSAGGI PRIVATI ============ */
S.sussurri = [];
function renderDestinatari() {
  const sel = $('#chatA'); if (!sel || !S.st) return;
  const altri = Object.entries(S.st.membri).filter(([id, m]) => id !== S.io && m.ruolo !== 'spettatore');
  $('#chatABox').hidden = me()?.ruolo === 'spettatore' || (!altri.length && !(masterAI() && me()?.ruolo === 'giocatore'));
  const prima = sel.value;
  const alMaster = masterAI() && me()?.ruolo === 'giocatore' ? '<option value="master">solo il master (in segreto)</option>' : '';
  sel.innerHTML = '<option value="">tutto il tavolo</option>' + alMaster + altri.map(([id, m]) => `<option value="${esc(id)}">solo ${esc(S.st.pg[id]?.nome || m.nome)} (in privato)</option>`).join('');
  if ([...sel.options].some(o => o.value === prima)) sel.value = prima;
}
function arrivaSussurro(m) {
  S.sussurri.push({ t: m.quando || Date.now(), tipo: 'sussurro', chi: m.da, testo: m.da === S.io ? (m.a === 'master' ? `In segreto al master: ${m.testo}` : `In privato a ${m.perNome}: ${m.testo}`) : `${m.nome}, in privato: ${m.testo}` });
  if (S.sussurri.length > 60) S.sussurri.shift();
  if (m.da !== S.io) { toast(`🤫 ${m.nome}, in privato: ${m.testo}`, false, 8000); vibra(40); }
  renderDiario(); Report.log('sussurro', { mio: m.da === S.io });
}

// alzo la mano: lo vedono tutti, senza interrompere chi sta parlando
$('#btnMano').addEventListener('click', () => { invia({ t: 'reazione', emoji: '✋' }); vibra(20); Report.log('mano', {}); });

/* ============ AIUTO DI UN COMPAGNO ============ */
// un compagno deve fare una prova: posso aiutarlo (tira con vantaggio)
function proponiAiuto(m) {
  if (me()?.ruolo !== 'giocatore' || !mioPg()) { toast(`${m.nome || 'Un personaggio'} deve fare una prova di ${m.prova}`); return; }
  $('#richTesto').textContent = `${m.nome || 'Un compagno'} deve fare una prova di ${m.prova}`;
  $('#richiesta').hidden = false; $('#richTira').textContent = 'Aiutalo';
  $('#richTira').onclick = () => { invia({ t: 'aiuto', per: m.pg }); $('#richiesta').hidden = true; $('#richTira').textContent = 'Tira'; Report.log('aiuto', { dato: true }); };
  clearTimeout(S.timerAiuto); S.timerAiuto = setTimeout(() => { if ($('#richTira').textContent === 'Aiutalo') { $('#richiesta').hidden = true; $('#richTira').textContent = 'Tira'; } }, 30000);
}
function arrivaAiuto(m) {
  S.aiuto = { nome: m.nome, t: Date.now() };
  toast(`${m.nome} ti aiuta: il prossimo tiro è con vantaggio`, false, 6000);
  if (!$('#richiesta').hidden && $('#richTira').textContent === 'Tira' && !/con l'aiuto/.test($('#richTesto').textContent)) $('#richTesto').textContent += ` · con l'aiuto di ${m.nome} (vantaggio)`;
  Report.log('aiuto', { ricevuto: true });
}
const aiutoFresco = () => { const a = S.aiuto; if (a && Date.now() - a.t < 180000) { S.aiuto = null; return true; } return false; };

/* ============ AZIONI DEL TURNO SEMPRE A VISTA ============ */
const AZIONI_TURNO = {
  scatto: { nome: 'Scatto', nome35: 'Correre', dico: 'Uso l\'azione Scatto: in questo turno mi muovo del doppio.' },
  disimpegno: { nome: 'Disimpegno', nome35: 'Ritirata', dico: 'Uso l\'azione Disimpegno: mi allontano senza provocare attacchi di opportunità.' },
  schivata: { nome: 'Schivata', nome35: 'Difesa totale', dico: 'Uso l\'azione Schivata: fino al mio prossimo turno chi mi attacca ha svantaggio.' },
  aiuto: { nome: 'Aiuta', nome35: 'Aiutare', dico: '' },
  spingere: { nome: 'Spingi', nome35: 'Spingere', dico: 'Provo a spingere il nemico più vicino.', prova: 'Atletica' },
  nascondersi: { nome: 'Nasconditi', nome35: 'Nascondersi', dico: 'Uso l\'azione Nascondersi.', prova: 'Furtività' },
  cerco: { nome: 'Cerca', nome35: 'Cercare', dico: 'Uso l\'azione Cercare: mi guardo intorno con attenzione.', prova: 'Percezione' }
};
function htmlAzioniTurno() {
  const v35 = regole() === '3.5';
  return `<div class="azioni-turno" aria-label="Azioni del turno">${Object.entries(AZIONI_TURNO).map(([k, a]) => `<button type="button" class="chip" data-azione="${k}">${esc(v35 ? a.nome35 : a.nome)}</button>`).join('')}</div>`;
}
async function azioneTurno(k) {
  const a = AZIONI_TURNO[k], pg = mioPg(); if (!a || !pg) return;
  const dillo = t => invia(masterAI() ? { t: 'parlato', testo: t, alMaster: true } : { t: 'chat', testo: `${pg.nome}: ${t}` });
  if (k === 'aiuto') {
    const amici = Object.entries(S.st.pg || {}).filter(([id, p]) => id !== S.io && p);
    if (!amici.length) { toast('Non c\'è nessun compagno da aiutare'); return; }
    const i = await chiedi('<h2>Chi aiuti?</h2><p class="piccolo">Il compagno che aiuti fa il suo prossimo tiro con vantaggio.</p>', [...amici.map(([, p]) => ({ testo: p.nome })), { testo: 'Annulla' }]);
    if (i < 0 || i >= amici.length) return;
    invia({ t: 'aiuto', per: amici[i][0] }); dillo(`Uso l'azione Aiuto su ${amici[i][1].nome}.`);
  } else {
    if (k === 'scatto') { const c = S.st.combattimento, chiave = c ? `${c.round}:${c.turno}` : ''; if (S.scattoIn === chiave) { toast('Lo Scatto si usa una volta per turno'); return; } S.scattoIn = chiave; S.mosso = (S.mosso || 0) - Math.max(1, Math.floor((pg.vel || 9) / 1.5)); aggiornaExtraMappa(); renderCombat(); }
    dillo(a.dico); if (a.prova) tiraProva(a.prova);
  }
  if (masterAI()) S.ultimoParlato = Date.now();
  Report.log('azione-turno', { azione: k });
}
$('#combat').addEventListener('click', e => { const b = e.target.closest('[data-azione]'); if (b) azioneTurno(b.dataset.azione); });

/* ============ MAZZO DI CARTE DEL TAVOLO ============ */
const SEMI = { Cuori: '♥', Quadri: '♦', Fiori: '♣', Picche: '♠' };
function cartaBreve(c) { const m = String(c).match(/^(\S+) di (\S+)$/); return m ? `${{ Asso: 'A', Fante: 'J', Donna: 'Q', Re: 'K' }[m[1]] || m[1]}${SEMI[m[2]] || ''}` : '🃏'; }
function arrivaCarta(m) {
  $('#cartaUltima').textContent = `${m.nome}: ${m.carta} · ne restano ${m.restano}`;
  if (m.chi !== S.io && !document.body.classList.contains('tv')) return;
  document.querySelectorAll('.carta-pescata').forEach(e => e.remove());
  const el = document.createElement('div'), rossa = /Cuori|Quadri|rosso/.test(m.carta); el.className = 'carta-pescata' + (rossa ? ' rossa' : '');
  el.innerHTML = `<b>${esc(cartaBreve(m.carta))}</b><span>${esc(m.carta)}</span>`; el.addEventListener('click', () => el.remove());
  document.body.appendChild(el); setTimeout(() => el.remove(), 2600); Suoni.effetto('fruscio');
}
$('#btnCarta').addEventListener('click', () => { if (me()?.ruolo === 'spettatore') { toast('Gli spettatori non pescano'); return; } invia({ t: 'carta' }); Report.log('carta', {}); });
$('#btnMischia').addEventListener('click', () => { invia({ t: 'carta', mischia: true }); $('#cartaUltima').textContent = 'Mazzo rimescolato: 54 carte'; });

/* ============ RICERCA NEL DIARIO ============ */
$('#cercaDiario').addEventListener('input', () => renderDiario());

/* ============ RIASSUNTI ============ */
$('#btnRiassuntoLungo').addEventListener('click', () => { invia({ t: 'riassunto', formato: 'completo' }); toast('Il master prepara il riassunto completo…'); Report.log('riassunto', { formato: 'completo' }); });
$('#btnRiassuntoRima').addEventListener('click', () => { invia({ t: 'riassunto', formato: 'cantastorie' }); toast('Il master accorda il liuto…'); Report.log('riassunto', { formato: 'cantastorie' }); });
async function condividiRiassunto() {
  const t = S.testoRiassunto; if (!t) return; const testoS = `${S.st.campagna.nome} — nelle puntate precedenti:\n${t}`;
  try { if (navigator.share) { await navigator.share({ title: S.st.campagna.nome, text: testoS }); Report.log('riassunto-condiviso', { come: 'condivisione' }); return; } } catch { return; }
  try { await navigator.clipboard.writeText(testoS); toast('Riassunto copiato: incollalo dove vuoi'); Report.log('riassunto-condiviso', { come: 'copia' }); } catch { toast('Non sono riuscito a copiarlo', true); }
}
$('#btnCondividiNarr').addEventListener('click', condividiRiassunto);
// il riassunto arriva nella casella del master, che sta sulla mappa: chi è in un'altra scheda lo legge in una finestra
function riassuntoArrivato(m) {
  S.testoRiassunto = m.riassunto ? m.testo : ''; $('#btnCondividiNarr').hidden = !m.riassunto;
  if (m.riassunto && S.filmAtteso && Date.now() - S.filmAtteso < 60000) { S.filmAtteso = 0; return film(m.testo); }
  if (m.riassunto) togliToast(/^Il master (prepara il riassunto|accorda il liuto)/);
  if (!m.riassunto || S.vista === 'vMappa' || largo()) return;
  if ($('#dlg').open) { toast('Il riassunto è pronto: lo trovi nel Diario'); return; } // un'altra finestra è aperta: non la si copre
  chiedi(`<h2>Nelle puntate precedenti</h2><div class="storia-pg">${m.testo.split(/\n+/).map(r => `<p>${esc(r)}</p>`).join('')}</div>`, [{ testo: 'Condividi', pieno: true }, { testo: 'Chiudi' }]).then(i => { if (i === 0) condividiRiassunto(); });
}

/* ============ APPUNTI DEL MONDO E IMPOSTAZIONI DELLA REGIA ============ */
function renderRegia() {
  if (!S.st) return;
  renderCronaca(); renderGiro(); renderDestinatari();
  $('#btnMischia').hidden = !capo(); $('#btnMano').hidden = me()?.ruolo !== 'giocatore' || Object.keys(S.st.membri).length < 2;
  const c = S.st.campagna;
  if (capo()) {
    $('#aDifficolta').value = c.difficolta || 'normale'; $('#aGiro').checked = !!c.giro; $('#aStile').value = c.stileImg || 'realistico'; $('#aDifferito').value = String(c.differito || 0);
    $('#aGiro').closest('label').hidden = c.masterTipo !== 'ai'; $('#aDifferito').closest('label').hidden = c.masterTipo !== 'ai';
    renderMondoCondiviso(); renderHomebrew();
    const ta = $('#aAppunti'); if (document.activeElement !== ta && !ta.dataset.toccato) ta.value = S.st.appunti || '';
    const f = S.st.fatti || []; $('#boxFatti').hidden = !f.length; $('#fattiConta').textContent = f.length; $('#fattiLista').innerHTML = f.map(x => `<li>${esc(x)}</li>`).join('');
  }
}
$('#aAppunti').addEventListener('input', e => { e.target.dataset.toccato = '1'; });
$('#btnSalvaAppunti').addEventListener('click', () => { const t = $('#aAppunti').value.trim(); if (invia({ t: 'appunti', testo: t })) { delete $('#aAppunti').dataset.toccato; toast('Appunti salvati: il master li userà da adesso'); Report.log('appunti', { caratteri: t.length }); } });
$('#fileAppunti').addEventListener('change', async e => {
  const f = e.target.files?.[0]; e.target.value = ''; if (!f) return;
  const pdf = /\.pdf$/i.test(f.name) || f.type === 'application/pdf';
  if (f.size > (pdf ? 15e6 : 200000)) { toast('Il file è troppo grande: servono appunti di poche pagine', true); return; }
  let t;
  try { t = (pdf ? await testoDaPdf(f) : await f.text()).replace(/\r/g, '').trim(); } catch (err) { toast('Non riesco a leggere questo PDF: se è una scansione (foto delle pagine) non contiene testo', true); Report.log('appunti-file', { errore: String(err?.message || err).slice(0, 120) }); return; }
  if (!t) { toast('Nel file non c\'è testo da leggere (forse sono pagine fotografate)', true); return; }
  const ta = $('#aAppunti');
  ta.value = ((ta.value ? ta.value + '\n\n' : '') + t).slice(0, 8000); ta.dataset.toccato = '1';
  toast(t.length > 8000 ? 'File caricato, tagliato a 8000 caratteri: controlla e salva' : 'File caricato: controlla e salva'); Report.log('appunti-file', { caratteri: t.length });
});

/* ============ MONDI CONDIVISI CON CODICE ============ */
// chi ha creato la campagna dà un codice: un altro gruppo comincia la sua storia nello stesso mondo (non riceve personaggi, diario, tesori)
const codiceMondo = () => S.st?.mondoChiave ? `${S.codice}-${S.st.mondoChiave}` : '';
function renderMondoCondiviso() {
  const box = $('#boxMondoCodice'); if (!box || !S.st) return;
  box.hidden = !me()?.admin; if (box.hidden) return;
  const cod = codiceMondo();
  $('#mondoCodice').hidden = !cod; $('#mondoCodice').textContent = cod;
  $('#btnMondoCrea').textContent = cod ? 'Cambia codice' : 'Crea il codice del mondo'; $('#btnMondoCrea').classList.toggle('pieno', !cod);
  $('#btnMondoCopia').hidden = !cod; $('#btnMondoRitira').hidden = !cod;
  const da = S.st.campagna.mondoDa; $('#mondoDa').hidden = !da; $('#mondoDa').textContent = da ? `Questa campagna si svolge nel mondo «${da}».` : '';
}
$('#btnMondoCrea').addEventListener('click', () => { invia({ t: 'mondo_condividi', nuovo: !!S.st.mondoChiave }); Report.log('mondo-codice', { nuovo: !!S.st.mondoChiave }); });
$('#btnMondoRitira').addEventListener('click', () => { invia({ t: 'mondo_condividi', ritira: true }); Report.log('mondo-codice', { ritirato: true }); });
$('#btnMondoCopia').addEventListener('click', async () => {
  const testoM = `Vieni a giocare nel mondo di «${S.st.campagna.nome}»: crea una campagna su ${location.origin}${location.pathname} e scrivi questo codice del mondo: ${codiceMondo()}`;
  try { if (navigator.share) { await navigator.share({ title: "Tavolo d'Avventura", text: testoM }); return; } } catch { return; }
  try { await navigator.clipboard.writeText(codiceMondo()); toast('Codice del mondo copiato'); } catch { toast(codiceMondo()); }
});
$('#formMondo').addEventListener('submit', async e => {
  e.preventDefault(); const cod = $('#mondoEntra').value.trim(); if (!cod) return;
  const i = await chiedi('<h2>Portare qui quel mondo?</h2><p>Arrivano ambientazione, appunti del mondo, luoghi con le loro mappe e fazioni. Personaggi, diario e tesori di questa campagna restano come sono. I luoghi che avete già non cambiano.</p>', [{ testo: 'Porta qui', pieno: true }, { testo: 'Annulla' }]);
  if (i !== 0) return;
  if (invia({ t: 'mondo_importa', codice: cod })) { $('#mondoEntra').value = ''; Report.log('mondo-importa', {}); }
});

/* ============ PRIMI PASSI GUIDATI ============ */
// Un elenco di cinque cose da fare la prima volta: ognuna si spunta da sola quando la fai, e «Mostrami» porta nel punto giusto.
// Lo vede chi è nuovo (o chi gioca l'avventura dei primi passi); chi usava già l'app non lo vede.
const PASSI = [
  { id: 'pg', titolo: 'Crea il tuo personaggio', come: 'Nella Scheda scegli razza e classe: i numeri li calcola l\'app.', vista: 'vScheda' },
  { id: 'parla', titolo: 'Di\' al master cosa fai', come: 'Scrivilo nel Diario, oppure premi il microfono e dillo a voce.', vista: 'vDiario', punta: '#formChat' },
  { id: 'dado', titolo: 'Tira un dado', come: 'Quando il master chiede una prova compare il tasto Tira. Puoi tirare anche dalla scheda Dadi.', vista: 'vDadi', punta: '#vDadi .dadi, #vDadi' },
  { id: 'muovi', titolo: 'Muoviti sulla mappa', come: 'Tocca una casella: la tua figura ci va camminando.', vista: 'vMappa', punta: '#mappaBox' },
  { id: 'scheda', titolo: 'Guarda cosa sai fare', come: 'Nella Scheda trovi abilità, armi e incantesimi: toccali per usarli.', vista: 'vScheda' }
];
const statoPassi = () => leggi('ta_passi', null);
(() => { if (!statoPassi()) scrivi('ta_passi', leggi('ta_guida_vista', false) || leggi('ta_attiva', '') || leggi('ta_nome', '') ? { chiuso: true } : { fatti: {} }); })(); // chi giocava già non ha bisogno dell'elenco
function renderPassi() {
  const box = $('#primiPassi'); if (!box || !S.st) return;
  const st = statoPassi() || { fatti: {} }, fatti = st.fatti || {};
  if (mioPg()) fatti.pg = true;
  const tutti = PASSI.every(p => fatti[p.id]);
  box.hidden = !!st.chiuso || tutti || me()?.ruolo !== 'giocatore' || document.body.classList.contains('tv') || !$('#invitoGuida').hidden;
  if (box.hidden) return;
  const prossimo = PASSI.find(p => !fatti[p.id]), n = PASSI.filter(p => fatti[p.id]).length, aperto = !!box.querySelector('details')?.open;
  // chiuso occupa due righe (il prossimo passo e «Mostrami»); aperto mostra tutto l'elenco
  box.innerHTML = `<details${aperto ? ' open' : ''}><summary><strong>Primi passi</strong> <span class="piccolo">${n} di ${PASSI.length}</span></summary>
    <ol>${PASSI.map(p => `<li class="${fatti[p.id] ? 'fatto' : p === prossimo ? 'ora' : ''}"><span class="pp-segno" aria-hidden="true">${fatti[p.id] ? '✔' : ''}</span>${esc(p.titolo)}</li>`).join('')}</ol>
    <button type="button" class="testo-btn" data-pp="chiudi">Non mi serve: nascondi</button></details>
    <div class="pp-ora"><span><b>${esc(prossimo.titolo)}</b><small>${esc(prossimo.come)}</small></span><button type="button" class="pieno" data-pp="${prossimo.id}">Mostrami</button></div>`;
}
document.addEventListener('click', e => { if (e.target.closest('[data-invito-guida]')) setTimeout(renderPassi, 0); });
// l'app vede cosa fai (un messaggio che parte, una scheda che si apre) e spunta il passo
function passoFatto(o) {
  const st = statoPassi(); if (!st || st.chiuso || !S.st) return;
  const id = o.t === 'vista' ? (o.id === 'vScheda' && mioPg() ? 'scheda' : null)
    : o.t === 'dado' ? 'dado' : o.t === 'segnalino' && (o.id || S.io) === S.io && !('aura' in o) ? 'muovi'
    : (o.t === 'parlato' || o.t === 'chat') && masterAI() ? 'parla' : o.t === 'chat' || o.t === 'narra' ? 'parla' : null;
  if (!id || st.fatti?.[id]) return;
  st.fatti = { ...(st.fatti || {}), [id]: true, pg: !!mioPg() || !!st.fatti?.pg };
  const finito = PASSI.every(p => st.fatti[p.id]); if (finito) st.chiuso = true;
  scrivi('ta_passi', st); Report.log('primi-passi', { passo: id, finito });
  if (finito) { toast('Primi passi fatti: adesso sai giocare!', false, 5000); Suoni.effetto('striscione'); $('#primiPassi').hidden = true; } else renderPassi();
}
$('#primiPassi').addEventListener('click', e => {
  const b = e.target.closest('[data-pp]'); if (!b) return;
  if (b.dataset.pp === 'chiudi') { scrivi('ta_passi', { ...(statoPassi() || {}), chiuso: true }); $('#primiPassi').hidden = true; Report.log('primi-passi', { nascosti: true }); return; }
  const p = PASSI.find(x => x.id === b.dataset.pp); if (!p) return;
  mostraVista(p.vista);
  const el = p.punta && document.querySelector(p.punta); if (el) { el.scrollIntoView({ block: 'center', behavior: menoMoto() ? 'auto' : 'smooth' }); el.classList.add('pp-punta'); setTimeout(() => el.classList.remove('pp-punta'), 2600); }
  toast(p.come, false, 6000);
});
// dall'ingresso: un'avventura di un quarto d'ora, da soli con il master AI, che spiega una cosa alla volta
$('#btnPrimiPassi').addEventListener('click', async () => {
  const i = await chiedi(`<h2>Primi passi</h2><p>Un'avventura di un quarto d'ora, da solo con il master: ti spiega come si gioca, una cosa alla volta. Poi potrai creare la tua campagna e invitare gli amici.</p><label>Il tuo nome<input id="ppNome" maxlength="30" autocomplete="nickname" value="${esc(leggi('ta_nome', ''))}" placeholder="Es. Vincenzo"></label>`, [{ testo: 'Comincia', pieno: true }, { testo: 'Annulla' }]);
  if (i !== 0) return;
  const mioNome = ($('#ppNome')?.value || '').trim(); if (!mioNome) { toast('Scrivi il tuo nome', true); return; }
  scrivi('ta_nome', mioNome); scrivi('ta_passi', { fatti: {} }); scrivi('ta_guida_vista', true);
  Voce.riattivaAudio(); Report.log('primi-passi', { avventura: true });
  connetti(codiceNuovo(), () => ({ t: 'crea', nome: 'Primi passi', regole: '5e', ambientazione: 'Fantasy classico', masterTipo: 'ai', ruolo: 'giocatore', mioNome, avventura: 'primi' }));
});

/* ============ NOTIFICHE: DI CHE COSA PARLANO ============ */
// La notifica viaggia vuota (niente dati in giro): quando arriva, il telefono chiede al server se parla di una serata o di un turno.
// Qui si lascia scritto, dove il service worker lo trova, a quale tavolo chiedere.
function ricordaAvvisi() {
  if (!('caches' in window) || !S.codice) return;
  caches.open('ta-avvisi').then(c => c.put('tavolo', new Response(JSON.stringify({ url: `${SERVER_WS.replace(/^ws/, 'http')}/tavolo/${S.codice}/avviso` }), { headers: { 'Content-Type': 'application/json' } }))).catch(() => {});
}

/* ============ MUNIZIONI ============ */
// archi e balestre consumano una freccia o un quadrello a ogni attacco; senza munizioni non si tira
function usaMunizione(pg, nomeArma) {
  const m = Regole.munizioni(pg, nomeArma); if (!m) return true;
  if (!m.n) { toast(`Niente ${m.tipo.toLowerCase()} per ${nomeArma}: comprane al banco o raccoglile dopo lo scontro`, true); Report.log('munizioni', { finite: m.tipo }); return false; }
  const pv = S.viewPg; S.viewPg = Object.keys(S.st.pg).find(id => S.st.pg[id] === pg) || S.io;
  modifica(p => { const r = Regole.consumaMunizione(p, nomeArma); if (r?.resta === 5 || r?.resta === 0) toast(r.resta ? `Restano 5 ${r.tipo.toLowerCase()}` : `Era l'ultima: ${r.tipo.toLowerCase()} finite`, !r.resta); return ''; });
  S.viewPg = pv; return true;
}
// finito lo scontro si raccoglie metà delle frecce tirate
function recuperaMunizioni() {
  const pg = mioPg(); if (!pg || !Object.values(pg.munSpese || {}).some(n => n > 1)) return;
  const pv = S.viewPg; S.viewPg = S.io;
  modifica(p => { const f = Regole.recuperaMunizioni(p); if (f.length) toast(`Raccogli ${f.join(' e ')} dal campo`); return f.length ? `dopo lo scontro raccoglie ${f.join(' e ')}` : ''; });
  S.viewPg = pv;
}

/* ============ CALENDARIO DI GIOCO ============ */
// stagioni di 30 giorni, settimane di 7, una festa per stagione (stessa regola in tavolo-dati.js sul server)
const GIORNI_SETT = ['Giorno della Luna', 'Giorno del Fuoco', 'Giorno dell\'Acqua', 'Giorno del Vento', 'Giorno della Terra', 'Giorno delle Stelle', 'Giorno del Sole'];
const FESTE = { primavera: [15, 'Festa dei Fiori'], estate: [20, 'Torneo d\'Estate'], autunno: [10, 'Festa del Raccolto'], inverno: [25, 'Festa del Ghiaccio'] };
function dataGioco(cal) {
  if (!cal) return null;
  const g = cal.giorno || 1, gs = g - (cal.inizioStagione || 1) + 1, [gf, festa] = FESTE[cal.stagione] || [0, ''];
  return { settimana: GIORNI_SETT[(g - 1) % 7], giornoStagione: gs, festa: gf === gs ? festa : null, prossimaFesta: gf > gs ? { nome: festa, tra: gf - gs } : null };
}
const testoData = cal => { const d = dataGioco(cal); return d ? `${d.settimana}, ${d.giornoStagione} di ${cal.stagione}` : ''; };
function htmlCalendario() {
  const cal = S.st?.mondo?.calendario, d = dataGioco(cal); if (!d) return '';
  const q = (S.st.missioni || []).filter(x => x.scadenza && x.stato !== 'completata' && x.stato !== 'scaduta').sort((a, b) => a.scadenza - b.scadenza);
  return `<h3>Calendario</h3><p><strong>${esc(testoData(cal))}</strong> <span class="piccolo">· giorno ${cal.giorno} dall'inizio della campagna</span></p>
    ${d.festa ? `<p>🎉 Oggi è la <strong>${esc(d.festa)}</strong>.</p>` : d.prossimaFesta ? `<p class="piccolo">Prossima festa: ${esc(d.prossimaFesta.nome)}, tra ${d.prossimaFesta.tra} ${d.prossimaFesta.tra === 1 ? 'giorno' : 'giorni'}.</p>` : ''}
    ${q.map(x => { const r = x.scadenza - cal.giorno; return `<p class="piccolo scadenza${r <= 2 ? ' vicina' : ''}">⏳ ${esc(x.titolo)}: ${r <= 0 ? 'scade oggi' : `scade tra ${r} ${r === 1 ? 'giorno' : 'giorni'}`}</p>`; }).join('')}`;
}

/* ============ CARTE DA COLLEZIONE ============ */
// una carta per ogni tipo di mostro incontrato; la cornice sale con quelli sconfitti
const CORNICI_CARTE = [[10, 'oro', 'Oro'], [3, 'argento', 'Argento'], [1, 'bronzo', 'Bronzo'], [0, 'vista', 'Solo visto']];
function renderCarte() {
  const box = $('#boxCarte'); if (!box || !S.st) return;
  const b = Object.entries(S.st.bestiario || {}).sort((x, y) => (y[1].sconfitti - x[1].sconfitti) || (x[1].prima - y[1].prima));
  box.hidden = !b.length; $('#carteConta').textContent = b.length;
  $('#carteLista').innerHTML = b.map(([nome, x]) => {
    const [, cls, etichetta] = CORNICI_CARTE.find(([n]) => x.sconfitti >= n), img = S.st.mostri?.[Mappa.nomeMostro(nome)];
    return `<div class="carta-coll ${cls}"><div class="cc-img">${img ? `<img src="${urlMedia('img', img)}" alt="" loading="lazy">` : `<img src="${Volti.nome(nome)}" alt="" class="pixel">`}</div><strong>${esc(nome)}</strong><span class="piccolo">${etichetta} · sconfitti ${x.sconfitti} · visti ${x.visti}</span></div>`;
  }).join('');
}

// testo di un PDF letto nel telefono con pdf.js (Apache 2.0, in vendor/): si carica solo quando serve
async function testoDaPdf(file) {
  const pdfjs = await import('./vendor/pdf.min.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('vendor/pdf.worker.min.mjs', location.href).href;
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise, righe = [];
  for (let i = 1; i <= Math.min(doc.numPages, 60) && righe.join('\n').length < 9000; i++) {
    const c = await (await doc.getPage(i)).getTextContent();
    righe.push(c.items.map(x => x.str + (x.hasEOL ? '\n' : ' ')).join('').replace(/[ \t]+/g, ' ').trim());
  }
  return righe.filter(Boolean).join('\n\n');
}

/* ============ SALITA DI LIVELLO GUIDATA ============ */
// dopo «Sali di livello»: cosa è cambiato, e le scelte da fare una alla volta (caratteristiche, incantesimi nuovi, talento)
async function livelloGuidato(prima) {
  const pg = () => S.st.pg[S.viewPg] || mioPg(); if (!pg()) return;
  const p = pg(), set = Regole.set(p.regole), maxPrima = Regole.slotMax(prima), maxOra = Regole.slotMax(p);
  const slotNuovi = maxOra.map((n, l) => (n || 0) - (maxPrima[l] || 0)).map((d, l) => d > 0 && l ? `${d} slot di ${l}° livello` : '').filter(Boolean);
  const righe = [`Punti ferita massimi: ${prima.pfMax} → <strong>${p.pfMax}</strong>`, Regole.competenza && p.regole === '5e' && Regole.competenza(p.livello) !== Regole.competenza(prima.livello) ? `Bonus di competenza: <strong>+${Regole.competenza(p.livello)}</strong> (tiri per colpire, abilità e tiri salvezza in cui sei competente)` : '', slotNuovi.length ? `Nuovi slot degli incantesimi: ${slotNuovi.join(', ')}` : ''].filter(Boolean);
  await chiedi(`<h2>🎉 Livello ${p.livello}!</h2><p>${esc(p.nome)} diventa più forte. Ecco cosa cambia:</p><ul>${righe.map(r => `<li>${r}</li>`).join('')}</ul><p class="piccolo">Adesso ti guido nelle scelte, una alla volta. Puoi sempre saltarle e farle dopo dalla scheda.</p>`, [{ testo: 'Avanti', pieno: true }]);
  // caratteristiche: le due più importanti per la classe
  if (pg().puntiCar) {
    const ord = (PRIORITA[pg().classe] || 'for des cos int sag car').split(' '), [k1, k2] = ord, pts = pg().puntiCar;
    const scelte = pts >= 2 ? [{ testo: `+2 ${CAR_SIGLE[k1]}`, pieno: true, ops: [{ op: 'car', car: k1, delta: 2 }] }, { testo: `+1 ${CAR_SIGLE[k1]} e +1 ${CAR_SIGLE[k2]}`, ops: [{ op: 'car', car: k1, delta: 1 }, { op: 'car', car: k2, delta: 1 }] }] : [{ testo: `+1 ${CAR_SIGLE[k1]}`, pieno: true, ops: [{ op: 'car', car: k1, delta: 1 }] }, { testo: `+1 ${CAR_SIGLE[k2]}`, ops: [{ op: 'car', car: k2, delta: 1 }] }];
    const i = await chiedi(`<h2>Caratteristiche</h2><p>Hai <strong>${pts}</strong> punt${pts > 1 ? 'i' : 'o'} da assegnare. Per un ${esc(pg().classe.toLowerCase())} contano di più <strong>${CAR_NOMI[k1]}</strong> e <strong>${CAR_NOMI[k2]}</strong>.</p>${pts >= 2 && p.regole === '5e' && Regole.talentiDaScegliere(pg()).length ? '<p class="piccolo">In alternativa puoi prendere un talento: lo trovi nella scheda, sezione Talenti.</p>' : ''}`, [...scelte, { testo: 'Scelgo dopo' }]);
    if (scelte[i]) modifica(scelte[i].ops);
  }
  // incantesimi: fino a due nuovi, della tradizione della classe
  for (let k = 0; k < 2 && set.classi[pg().classe]?.magia; k++) {
    const sug = Regole.suggerisciIncantesimi(pg(), 3); if (!sug.length) break;
    const i = await chiedi(`<h2>${k ? 'Un altro incantesimo?' : 'Un incantesimo nuovo'}</h2><p class="piccolo">Proposti in base alla tua classe e agli slot che hai. Il master può sempre permetterne altri.</p>`, [...sug.map((x, j) => ({ testo: `${x.nome} (${x.livello ? x.livello + '°' : 'trucchetto'})`, pieno: j === 0 })), { testo: k ? 'Basta così' : 'Scelgo dopo' }]);
    if (!sug[i]) break; modifica([{ op: 'impara', nome: sug[i].nome, livello: sug[i].livello }]);
  }
  // talento nella 3.5 (ogni 3 livelli)
  const disp = Regole.talentiDisponibili(pg());
  if (p.regole === '3.5' && disp && (pg().talenti || []).length < disp) {
    const tl = Regole.talentiDaScegliere(pg()).slice(0, 5);
    const i = await chiedi(`<h2>Un talento nuovo</h2><ul class="piccolo">${tl.map(([n, d]) => `<li><strong>${esc(n)}</strong>: ${esc(d)}</li>`).join('')}</ul>`, [...tl.map(([n], j) => ({ testo: n, pieno: j === 0 })), { testo: 'Scelgo dopo' }]);
    if (tl[i]) modifica([{ op: 'talento', nome: tl[i][0] }]);
  }
  Report.log('livello-guidato', { livello: p.livello });
}

/* ============ DIARIO DEL PERSONAGGIO ============ */
// pagine scritte dal master in prima persona, dal punto di vista del personaggio
function cartaDiarioPg(pg, puo) {
  const pag = [...(pg.pagine || [])].reverse();
  return `<details class="diario-pg"${pag.length ? '' : ''}><summary>📖 Diario di ${esc(pg.nome.split(' ')[0])} (${pag.length} ${pag.length === 1 ? 'pagina' : 'pagine'})</summary>
    <p class="piccolo">Il master scrive una pagina in prima persona, con la voce di ${esc(pg.nome.split(' ')[0])}, su quello che è successo dall'ultima volta.</p>
    ${puo && me()?.ruolo !== 'spettatore' ? '<button type="button" data-diario-pg class="pieno">✒️ Scrivi la pagina di oggi</button>' : ''}
    ${pag.map((x, i) => `<article class="pagina-pg"><span class="piccolo">Sessione ${x.sessione} · ${new Date(x.t).toLocaleDateString('it-IT')}</span><p>${esc(x.testo).replace(/\n+/g, '</p><p>')}</p>${i === 0 ? `<button type="button" class="testo-btn" data-condividi-pagina="${x.t}">Condividi</button>` : ''}</article>`).join('')}</details>`;
}
$('#scheda').addEventListener('click', async e => {
  if (e.target.closest('[data-diario-pg]')) { invia({ t: 'diario_pg', per: S.viewPg }); toast('Il master scrive il diario…'); Report.log('diario-pg', {}); return; }
  const c = e.target.closest('[data-condividi-pagina]'); if (!c) return;
  const pg = S.st.pg[S.viewPg], x = (pg?.pagine || []).find(p => String(p.t) === c.dataset.condividiPagina); if (!x) return;
  const t = `Dal diario di ${pg.nome}:\n\n${x.testo}`;
  try { if (navigator.share) { await navigator.share({ title: `Diario di ${pg.nome}`, text: t }); return; } } catch { return; }
  try { await navigator.clipboard.writeText(t); toast('Pagina copiata'); } catch { toast('Non sono riuscito a copiarla', true); }
});

/* ============ VIAGGI A TAPPE ============ */
function renderViaggio() {
  const v = S.st?.viaggio, bar = $('#viaggioBar'); if (!bar) return;
  bar.hidden = !v; if (!v) return;
  const comb = S.st.combattimento?.attivo;
  $('#viaggioTesto').textContent = `In viaggio verso ${v.verso}: giorno ${v.fatti} di ${v.giorni}.${comb ? ' Prima finite lo scontro.' : ''}`;
  $('#btnRiprendi').hidden = !!comb || !(capo() || masterAI()) || me()?.ruolo === 'spettatore';
}
$('#btnRiprendi').addEventListener('click', () => { invia({ t: 'viaggio', riprendi: true }); Report.log('viaggio', { ripreso: true }); });
$('#btnViaggio').addEventListener('click', async () => {
  const pre = $('#vaiNome').value.trim();
  const i = await chiedi(`<h2>🧭 Viaggio a tappe</h2><p class="piccolo">Per i luoghi lontani: passano i giorni, la sera vi accampate e lungo la strada può capitare un incontro. Per spostarvi subito usa «Vai».</p><label>Dove andate?<input id="viaggioMeta" maxlength="60" value="${esc(pre)}" placeholder="Es. Castello Nero" list="viaggioLuoghi"></label><datalist id="viaggioLuoghi">${Object.values(S.st.luoghi || {}).filter(l => !l.interno).map(l => `<option value="${esc(l.nome)}">`).join('')}</datalist>`, [{ testo: 'A piedi', pieno: true }, { testo: 'A cavallo (metà dei giorni)' }, { testo: 'Annulla' }]);
  const meta = ($('#viaggioMeta')?.value || '').trim(); if (i > 1 || i < 0 || !meta) return;
  invia({ t: 'viaggio', nome: meta, cavallo: i === 1 }); $('#vaiNome').value = ''; Report.log('viaggio', { cavallo: i === 1 });
});

/* ============ SCHEDA STAMPABILE ============ */
// la scheda impaginata come quella di carta (A4, bianco e nero): si apre in una finestra e si stampa o si salva in PDF
function stampaScheda(pg) {
  const w = window.open('', '_blank'); if (!w) { toast('Consenti le finestre a comparsa per stampare la scheda', true); return; }
  const sg = n => (n >= 0 ? '+' : '') + n; // sulla carta anche lo zero ha il segno
  const set = Regole.set(pg.regole), v35 = pg.regole === '3.5', comp = Regole.competenza(pg.livello);
  const ts = v35 ? [['tem', 'Tempra'], ['rif', 'Riflessi'], ['vol', 'Volontà']] : CAR.map(k => [k, CAR_NOMI[k]]);
  const armi = (pg.equip || []).filter(e => e.indossato && ARMI[e.nome]).map(e => ({ e, a: Regole.attacco(pg, e) }));
  const max = Regole.slotMax(pg), usati = pg.slotUsati || [];
  const ritr = pg.ritratto ? `<img src="${urlMedia('img', pg.ritratto)}" alt="">` : Ritratto.svg(pg, { dim: 120 });
  const riga = (n, v, x = '') => `<div class="r"><span>${n}</span><b>${v}</b>${x}</div>`;
  w.document.write(`<!doctype html><html lang="it"><head><meta charset="utf-8"><title>${esc(pg.nome)} — scheda</title><style>
    @page { size: A4; margin: 12mm; } * { box-sizing: border-box; } body { font: 11px/1.35 Georgia, serif; color: #111; margin: 0; }
    h1 { font-size: 24px; margin: 0; letter-spacing: .02em; } h2 { font-size: 11px; text-transform: uppercase; letter-spacing: .12em; margin: 0 0 4px; border-bottom: 1px solid #111; }
    .testa { display: grid; grid-template-columns: 1fr 120px; gap: 10px; border: 2px solid #111; border-radius: 8px; padding: 8px 10px; margin-bottom: 8px; }
    .testa .dati { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px 12px; margin-top: 4px; } .testa .dati div { border-bottom: 1px solid #999; padding: 2px 0; } .testa .dati small { display: block; font-size: 8px; text-transform: uppercase; color: #555; }
    .ritr { width: 120px; height: 120px; border: 1px solid #111; border-radius: 6px; overflow: hidden; display: flex; align-items: center; justify-content: center; } .ritr img, .ritr svg { width: 100%; height: 100%; object-fit: cover; }
    .corpo { display: grid; grid-template-columns: 92px 1fr 1fr; gap: 8px; } .box { border: 1.5px solid #111; border-radius: 8px; padding: 6px 8px; margin-bottom: 8px; break-inside: avoid; }
    .car { border: 1.5px solid #111; border-radius: 10px; text-align: center; padding: 4px 2px; margin-bottom: 6px; } .car small { font-size: 8px; text-transform: uppercase; display: block; } .car b { font-size: 20px; display: block; } .car span { display: inline-block; border: 1px solid #111; border-radius: 10px; padding: 0 8px; font-size: 11px; }
    .stat3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 8px; } .stat3 div { border: 1.5px solid #111; border-radius: 8px; text-align: center; padding: 4px; } .stat3 b { font-size: 18px; display: block; } .stat3 small { font-size: 8px; text-transform: uppercase; }
    .r { display: flex; gap: 6px; align-items: baseline; border-bottom: 1px dotted #aaa; padding: 1px 0; } .r span { flex: 1; } .r b { min-width: 26px; text-align: right; } .r i { font-style: normal; width: 10px; }
    table { width: 100%; border-collapse: collapse; } td, th { border-bottom: 1px solid #bbb; padding: 2px 3px; text-align: left; font-size: 10.5px; } th { font-size: 8px; text-transform: uppercase; }
    p { margin: 3px 0; } .piede { margin-top: 6px; font-size: 8px; color: #666; text-align: center; }
  </style></head><body>
  <div class="testa"><div><h1>${esc(pg.nome)}</h1><div class="dati">
    <div><small>Classe e livello</small>${esc(Regole.nomeClassi(pg))} ${pg.livello}</div><div><small>Razza</small>${esc(pg.razza)}</div><div><small>Allineamento</small>${esc(pg.allineamento || '')}</div>
    <div><small>Punti esperienza</small>${pg.px || 0}</div><div><small>Campagna</small>${esc(S.st.campagna.nome)}</div><div><small>Regolamento</small>${esc(set.nome)}</div></div></div><div class="ritr">${ritr}</div></div>
  <div class="corpo">
    <div>${CAR.map(k => `<div class="car"><small>${CAR_NOMI[k]}</small><b>${pg.car[k]}</b><span>${sg(mod(pg.car[k]))}</span></div>`).join('')}</div>
    <div>
      <div class="stat3"><div><b>${pg.ca}</b><small>Classe armatura</small></div><div><b>${sg(Regole.iniziativa(pg))}</b><small>Iniziativa</small></div><div><b>${pg.vel || 9} m</b><small>Velocità</small></div></div>
      <div class="box"><h2>Punti ferita</h2>${riga('Massimi', pg.pfMax)}${riga('Attuali', '')}${riga('Temporanei', '')}${(pg.condizioni || []).length ? `<p>Condizioni: ${esc(pg.condizioni.join(', '))}</p>` : ''}</div>
      <div class="box"><h2>Tiri salvezza</h2>${ts.map(([k, n]) => riga(n, sg(bonusSalvezza(pg, k)), v35 ? '' : `<i>${set.classi[pg.classe]?.ts?.includes(k) ? '●' : '○'}</i>`)).join('')}${v35 ? '' : riga('Bonus di competenza', sg(comp))}</div>
      <div class="box"><h2>Abilità</h2>${Object.keys(set.abilita).map(ab => riga(`${ab} <small>(${CAR_SIGLE[set.abilita[ab]]})</small>`, sg(Regole.abilita(pg, ab)), v35 ? '' : `<i>${(pg.competenze || []).includes(ab) ? '●' : '○'}</i>`)).join('')}</div>
    </div>
    <div>
      <div class="box"><h2>Attacchi</h2><table><tr><th>Arma</th><th>Colpire</th><th>Danni</th></tr>${armi.map(({ e, a }) => `<tr><td>${esc(e.nome)}${e.bonus ? ' +' + e.bonus : ''}</td><td>${sg(a.colpire)}</td><td>${esc(a.danno)}</td></tr>`).join('') || '<tr><td colspan="3">—</td></tr>'}</table></div>
      <div class="box"><h2>Equipaggiamento</h2><p>${(pg.equip || []).map(e => esc(e.nome) + (e.qta > 1 ? ' ×' + e.qta : '')).join(', ') || '—'}</p><p><b>Monete d'oro:</b> ${pg.oro || 0}</p></div>
      ${(pg.talenti || []).length ? `<div class="box"><h2>Talenti</h2><p>${pg.talenti.map(esc).join(', ')}</p></div>` : ''}
      ${(pg.incantesimi || []).length || max.some(n => n) ? `<div class="box"><h2>Incantesimi</h2>${max.map((n, l) => n && l ? riga(`Slot di ${l}° livello`, `${'○'.repeat(n)}`) : '').join('')}${(c2 => c2 ? riga('CD dei tiri salvezza', `${c2.cd}${c2.nota ? ' ' + c2.nota : ''}`) + (c2.attacco !== undefined ? riga('Attacco con incantesimo', sg(c2.attacco)) : '') : '')(Regole.cd(pg))}<p>${(pg.incantesimi || []).map(i => `${esc(i.nome)} <small>(${i.livello ? i.livello + '°' : 'trucchetto'})</small>`).join(', ')}</p></div>` : ''}
      ${pg.storia ? `<div class="box"><h2>Storia</h2><p>${esc(pg.storia)}</p></div>` : ''}
    </div>
  </div>
  <div class="piede">Tavolo d'Avventura · ${new Date().toLocaleDateString('it-IT')} · regole: ${pg.regole === '3.5' ? 'SRD 3.5 (OGL)' : 'SRD 5.1 (CC-BY-4.0)'}</div>
  <script>window.onload = () => setTimeout(() => window.print(), 400);<\/script></body></html>`);
  w.document.close(); Report.log('stampa-scheda', { regole: pg.regole });
}

/* ============ NELLE PUNTATE PRECEDENTI, CON LE IMMAGINI ============ */
// le illustrazioni della campagna scorrono a tutto schermo mentre il master racconta il riassunto
$('#btnFilm').addEventListener('click', () => { S.filmAtteso = Date.now(); invia({ t: 'riassunto', formato: 'completo' }); toast('Il master prepara il racconto…'); Report.log('film', {}); });
function film(testo) {
  const imgs = (S.st.diario || []).filter(d => d.img && (d.tipo === 'illustrazione' || d.tipo === 'riepilogo')).map(d => urlMedia('img', d.img)).slice(-10);
  if (!imgs.length) { const c = Mappa.immagine?.(); if (c?.width) imgs.push(c.toDataURL('image/jpeg', 0.85)); }
  const frasi = String(testo).split(/(?<=[.!?…])\s+/).filter(Boolean), durata = Math.max(12000, testo.length / 14 * 1000), passo = durata / Math.max(1, imgs.length);
  document.querySelector('.film')?.remove();
  const el = document.createElement('div'); el.className = 'film'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Nelle puntate precedenti');
  el.innerHTML = `${imgs.map((src, i) => `<img src="${src}" alt="" class="${i === 0 ? 'su' : ''}" style="animation-duration:${Math.round(passo + 1500)}ms">`).join('')}<div class="film-titolo">Nelle puntate precedenti…</div><p class="film-sotto" aria-live="polite"></p><button type="button" class="film-chiudi" aria-label="Chiudi">✕</button>`;
  document.body.appendChild(el);
  const quadri = [...el.querySelectorAll('img')], sotto = el.querySelector('.film-sotto'); let q = 0, f = 0;
  const giro = setInterval(() => { if (quadri.length > 1) { quadri[q].classList.remove('su'); q = (q + 1) % quadri.length; quadri[q].classList.add('su'); } }, passo);
  const scrivi1 = () => { if (f >= frasi.length) return; sotto.textContent = frasi[f]; const t = Math.max(2200, frasi[f].length / 14 * 1000); f++; S.filmFrase = setTimeout(scrivi1, t); };
  scrivi1(); const primaVoce = Narratore.attivo; try { Narratore.attivo = true; Narratore.parla(testo); } catch { /* senza voce restano i sottotitoli */ }
  const chiudi = () => { clearInterval(giro); clearTimeout(S.filmFrase); clearTimeout(S.filmFine); Narratore.zitto(); Narratore.attivo = primaVoce; el.remove(); };
  el.querySelector('.film-chiudi').addEventListener('click', chiudi);
  S.filmFine = setTimeout(chiudi, durata + 4000);
}

/* ============ MOSTRI E OGGETTI INVENTATI ============ */
function renderHomebrew() {
  const box = $('#listaHomebrew'); if (!box || !S.st) return;
  $('#boxHomebrew').hidden = !capo();
  const hb = S.st.homebrew || { mostri: [], oggetti: [] };
  box.innerHTML = `${hb.mostri.length ? `<h3>I vostri mostri</h3>${hb.mostri.map(x => { const img = S.st.mostri?.[Mappa.nomeMostro(x.nome)]; return `<div class="hb-voce">${img ? `<img src="${urlMedia('img', img)}" alt="" class="hb-img">` : `<img src="${Volti.nome(x.nome)}" alt="" class="hb-img pixel">`}<div><strong>${esc(x.nome)}</strong> <span class="piccolo">PF ${x.pf} · CA ${x.ca}${x.attacco ? ' · ' + esc(x.attacco) : ''}</span>${x.descrizione ? `<p class="piccolo">${esc(x.descrizione)}</p>` : ''}<div class="riga"><button type="button" data-hb-scena="${esc(x.nome)}">Metti in scena</button><button type="button" class="testo-btn" data-hb-togli="${esc(x.nome)}">Togli</button></div></div></div>`; }).join('')}` : ''}
    ${hb.oggetti.length ? `<h3>I vostri oggetti</h3>${hb.oggetti.map(x => `<div class="hb-voce"><div><strong>${esc(x.nome)}</strong> <span class="piccolo">${esc(x.rarita)}</span>${x.effetto ? `<p class="piccolo">${esc(x.effetto)}</p>` : ''}<div class="riga"><button type="button" data-hb-dai="${esc(x.nome)}">Dai a un personaggio</button><button type="button" class="testo-btn" data-hb-togli="${esc(x.nome)}">Togli</button></div></div></div>`).join('')}` : ''}`;
}
$('#formMostroHb').addEventListener('submit', e => { e.preventDefault(); const f = e.target; invia({ t: 'homebrew', mostro: { nome: f.nome.value, pf: f.pf.value, ca: f.ca.value, attacco: f.attacco.value, descrizione: f.descrizione.value } }); f.reset(); toast('Mostro creato: il disegno arriva tra poco'); Report.log('homebrew', { tipo: 'mostro' }); });
$('#formOggettoHb').addEventListener('submit', e => { e.preventDefault(); const f = e.target; invia({ t: 'homebrew', oggetto: { nome: f.nome.value, rarita: f.rarita.value, effetto: f.effetto.value } }); f.reset(); toast('Oggetto creato'); Report.log('homebrew', { tipo: 'oggetto' }); });
$('#listaHomebrew').addEventListener('click', async e => {
  const b = e.target.closest('button'); if (!b) return; const hb = S.st.homebrew || { mostri: [], oggetti: [] };
  if (b.dataset.hbTogli) { invia({ t: 'homebrew', togli: b.dataset.hbTogli }); return; }
  if (b.dataset.hbScena) { const x = hb.mostri.find(y => y.nome === b.dataset.hbScena); if (!x) return; if (!S.st.luogo) { toast('Prima andate in un luogo', true); return; } invia({ t: 'piazza_nemici', mostri: [{ nome: x.nome, numero: 1, pf: x.pf, ca: x.ca }] }); toast(`${x.nome} è sulla mappa`); return; }
  if (b.dataset.hbDai) {
    const x = hb.oggetti.find(y => y.nome === b.dataset.hbDai), pgs = Object.entries(S.st.pg || {}); if (!x || !pgs.length) return;
    const i = await chiedi(`<h2>A chi dai «${esc(x.nome)}»?</h2>`, [...pgs.map(([, p]) => ({ testo: p.nome })), { testo: 'Annulla' }]); if (!pgs[i]) return;
    const pv = S.viewPg; S.viewPg = pgs[i][0]; modifica([{ op: 'oggetto', nome: x.nome, qta: 1, rarita: x.rarita }], x.effetto ? `effetto: ${x.effetto}` : null); S.viewPg = pv; renderScheda();
  }
});

/* ============ IL VOSTRO MESE ============ */
$('#btnMese').addEventListener('click', () => { invia({ t: 'mese' }); Report.log('mese', {}); });
const nomeMese = m => new Date(m + '-15').toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
function totaliMese(r) {
  const tot = {}; for (const [id, o] of Object.entries(r.numeri || {})) if (id !== 'gruppo') for (const [k, v] of Object.entries(o)) tot[k] = (tot[k] || 0) + v;
  return [['🎲', 'dadi tirati', tot.tiri], ['✨', 'venti naturali', tot.critici], ['💀', 'uno naturali', tot.fallimenti], ['⚔️', 'nemici sconfitti', r.numeri?.gruppo?.nemici || r.sconfitti], ['🩸', 'danni presi', tot.danniSubiti], ['💚', 'punti ferita curati', tot.cure], ['🪙', 'monete spese', tot.speso]].filter(x => x[2]);
}
async function mostraMese(r) {
  const tot = totaliMese(r), i0 = r.mesi.indexOf(r.mese), prima = i0 > 0 ? r.mesi[i0 - 1] : null;
  const vuoto = !tot.length && !r.luoghi.length && !r.serate.length;
  const i = await chiedi(`<h2>📅 ${esc(nomeMese(r.mese))}</h2>${vuoto ? '<p>Questo mese il gruppo non ha ancora giocato: i numeri arrivano appena tirate i dadi.</p>' : ''}
    ${tot.length ? `<div class="mese-numeri">${tot.map(([ic, n, v]) => `<div><b>${ic} ${v}</b><span>${n}</span></div>`).join('')}</div>` : ''}
    ${r.trofei.length ? `<h3>Trofei del mese</h3><ul>${r.trofei.map(t => `<li>🏆 <strong>${esc(t.titolo)}</strong>: ${esc(t.chi)} <span class="piccolo">(${esc(t.motivo)})</span></li>`).join('')}</ul>` : ''}
    ${r.serate.length ? `<h3>Serate</h3><ul>${r.serate.map(s => `<li>${esc(s.titolo)}</li>`).join('')}</ul>` : ''}
    ${r.luoghi.length ? `<h3>Luoghi scoperti</h3><p>${r.luoghi.map(esc).join(' · ')}</p>` : ''}
    ${r.illustrazioni.length ? `<div class="mese-img">${r.illustrazioni.map(x => `<img src="${urlMedia('img', x.img)}" alt="${esc(x.testo)}" loading="lazy">`).join('')}</div>` : ''}`,
  [...(vuoto ? [] : [{ testo: 'Condividi come immagine', pieno: true }]), ...(prima ? [{ testo: `‹ ${nomeMese(prima)}` }] : []), { testo: 'Chiudi' }]);
  const azioni = [...(vuoto ? [] : ['img']), ...(prima ? ['prima'] : []), 'chiudi'];
  if (azioni[i] === 'img') return cartolinaMese(r, tot);
  if (azioni[i] === 'prima') invia({ t: 'mese', mese: prima });
}
async function cartolinaMese(r, tot) {
  const W = 1080, H = 1350, c = Object.assign(document.createElement('canvas'), { width: W, height: H }), k = c.getContext('2d'), px = stileGioco();
  await Promise.all(['64px "Jersey 15"', '700 64px Cinzel', '600 26px Inter'].map(f => document.fonts.load(f).catch(() => {}))); // le immagini da condividere non partono con il carattere di riserva
  const F = (n, p = 'Inter, sans-serif') => px ? `400 ${Math.round(n * 1.35)}px "Jersey 15", sans-serif` : `600 ${n}px ${p}`;
  const g = k.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#231a2e'); g.addColorStop(1, '#0e0b12'); k.fillStyle = g; k.fillRect(0, 0, W, H);
  k.strokeStyle = '#d9a441'; k.lineWidth = 10; k.strokeRect(24, 24, W - 48, H - 48);
  const carica = src => new Promise(res => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
  const ill = r.illustrazioni.slice(-3); let y = 70;
  if (ill.length) { const lato = (W - 120 - (ill.length - 1) * 12) / ill.length; for (const [i, x] of ill.entries()) { const im = await carica(urlMedia('img', x.img)); if (im) { const s2 = Math.max(lato / im.width, 300 / im.height); k.save(); k.beginPath(); k.rect(60 + i * (lato + 12), y, lato, 300); k.clip(); k.drawImage(im, 60 + i * (lato + 12) + (lato - im.width * s2) / 2, y + (300 - im.height * s2) / 2, im.width * s2, im.height * s2); k.restore(); } } y += 340; }
  k.textAlign = 'center'; k.fillStyle = '#f0c46a'; k.font = px ? '400 88px "Jersey 15", serif' : '700 64px Cinzel, Georgia, serif'; k.fillText(nomeMese(r.mese).replace(/^./, s => s.toUpperCase()), W / 2, y + 40); y += 70;
  k.fillStyle = '#bcae96'; k.font = F(28); k.fillText(S.st.campagna.nome, W / 2, y); y += 60;
  const col = 3, cw = (W - 120) / col; tot.slice(0, 6).forEach(([ic, n, v], i) => { const x = 60 + (i % col) * cw + cw / 2, yy = y + Math.floor(i / col) * 130; k.fillStyle = '#f3ead9'; k.font = F(54); k.fillText(`${ic} ${v}`, x, yy + 50); k.fillStyle = '#bcae96'; k.font = F(24); k.fillText(n, x, yy + 90); });
  y += Math.ceil(Math.min(6, tot.length) / col) * 130 + 30;
  for (const t of r.trofei.slice(0, 3)) { k.fillStyle = '#d9a441'; k.font = F(30); k.fillText(`🏆 ${t.titolo}: ${t.chi}`, W / 2, y); y += 50; }
  k.fillStyle = '#8f8270'; k.font = F(22); k.fillText("Tavolo d'Avventura", W / 2, H - 60);
  const blob = await new Promise(res => c.toBlob(res, 'image/png')), file = new File([blob], `mese-${r.mese}.png`, { type: 'image/png' });
  try { if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: `Il nostro mese: ${nomeMese(r.mese)}` }); return; } } catch { return; }
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: file.name }); a.click(); Report.log('mese-immagine', { mese: r.mese });
}

/* ============ 4.5: caccia al tesoro, rompicapi da toccare, torneo, animali che crescono, avventure scritte da voi ============ */
// caccia al tesoro: indizi da decifrare (prova di Intelligenza) e scavo nel posto giusto
function htmlCaccia(gioca) {
  const c = S.st?.caccia, pg = mioPg(), mappa = gioca && pg && (pg.equip || []).some(e => /mappa di un tesoro/i.test(e.nome)) && (!c || c.trovato);
  if (!c) return mappa ? '<div class="carta-mini caccia"><strong>🗺️ Hai una mappa del tesoro</strong><p class="piccolo">Aprila: il master nasconde il tesoro e voi seguite gli indizi.</p><button type="button" class="pieno" data-caccia="nuova">Apri la mappa</button></div>' : '';
  if (c.trovato) return `<details class="carta-mini caccia"><summary>🗺️ ${esc(c.titolo)}: tesoro trovato a ${esc(c.luogo)}</summary><p class="piccolo">${c.oro} monete d'oro${c.oggetto ? ' e ' + esc(c.oggetto) : ''} nel tesoro comune.</p>${mappa ? '<button type="button" data-caccia="nuova">Apri la tua nuova mappa</button>' : ''}</details>`;
  const visti = c.scoperti || 1, tot = c.totale || c.indizi.length;
  return `<div class="carta-mini caccia"><strong>🗺️ ${esc(c.titolo)}</strong>
    <ol class="indizi">${Array.from({ length: tot }, (_, i) => i < visti ? `<li>${esc(c.indizi[i])}</li>` : `<li class="nascosto">❓ Indizio da decifrare${capo() && c.indizi[i] ? ` <span class="piccolo">(lo vedi solo tu: ${esc(c.indizi[i])})</span>` : ''}</li>`).join('')}</ol>
    ${capo() && c.luogo ? `<p class="piccolo">Il tesoro è a: <strong>${esc(c.luogo)}</strong> (lo vedi solo tu)</p>` : ''}
    ${gioca ? `<div class="riga"><button type="button" data-caccia="decifra" ${visti >= tot ? 'disabled' : ''}>🔍 Decifra un indizio</button><button type="button" class="pieno" data-caccia="scava">⛏️ Scava qui</button></div><p class="piccolo">Decifrare è una prova di Intelligenza (+2 con la biblioteca della casa). Quando avete capito il posto, andateci e scavate.</p>` : ''}${c.scavi ? `<p class="piccolo">Buche scavate a vuoto: ${c.scavi}</p>` : ''}</div>`;
}
// rompicapi: leve su e giù, rune nell'ordine giusto, serratura a tre cifre (le mosse restano sul telefono finché si preme Prova)
function htmlRompicapo(gioca) {
  const r = S.st?.rompicapo; if (!r) return '';
  if (S.mosse?.t !== r.t) S.mosse = { t: r.t, leve: [false, false, false, false], rune: [], cifre: [0, 0, 0] };
  const m = S.mosse, rune = S.st.catalogo?.rune || [], no = gioca ? '' : 'disabled';
  const corpo = r.tipo === 'leve' ? `<div class="leve">${m.leve.map((su, i) => `<button type="button" class="leva${su ? ' su' : ''}" data-leva="${i}" aria-pressed="${su}" aria-label="Leva ${i + 1}: ${su ? 'alzata' : 'abbassata'}" ${no}><span class="manico" aria-hidden="true">${su ? '⬆' : '⬇'}</span>${i + 1}</button>`).join('')}</div>`
    : r.tipo === 'rune' ? `<div class="rune">${rune.map(([s, n], i) => `<button type="button" class="runa" data-runa="${i}" aria-label="Runa ${n}" ${gioca && m.rune.length < 3 ? '' : 'disabled'}><span aria-hidden="true">${s}</span>${n}</button>`).join('')}</div><p class="sequenza" aria-live="polite">${m.rune.length ? m.rune.map(i => `${rune[i]?.[0]} ${rune[i]?.[1]}`).join(' → ') : 'Toccate tre rune nell\'ordine giusto'}</p>`
      : `<div class="cifre">${m.cifre.map((n, i) => `<div class="cifra"><button type="button" data-cifra="${i}" data-delta="1" aria-label="Cifra ${i + 1}: più uno" ${no}>▲</button><span aria-live="polite" aria-label="Cifra ${i + 1}: ${n}">${n}</span><button type="button" data-cifra="${i}" data-delta="-1" aria-label="Cifra ${i + 1}: meno uno" ${no}>▼</button></div>`).join('')}</div>`;
  const sol = !r.soluzione ? '' : r.tipo === 'leve' ? r.soluzione.map(x => x ? 'su' : 'giù').join(', ') : r.tipo === 'rune' ? r.soluzione.map(i => rune[i]?.[1]).join(', ') : r.soluzione.join('');
  return `<div class="carta-mini rompicapo"><strong>🔐 ${esc(r.titolo || ({ leve: 'Le quattro leve', rune: 'Le rune incise', serratura: 'La serratura a combinazione' })[r.tipo])}</strong>
    <ul class="indizi">${r.indizi.map(x => `<li>${esc(x)}</li>`).join('')}</ul>${corpo}
    ${gioca ? `<div class="riga"><button type="button" class="pieno" data-rompicapo="prova">Prova</button>${r.tipo === 'rune' ? '<button type="button" data-rompicapo="cancella">Ricomincia</button>' : ''}</div>` : ''}
    <p class="piccolo">⚠️ Chi sbaglia fa scattare la trappola: ${esc(r.trappolaNome || '')}.${r.tentativi ? ` Tentativi sbagliati: ${r.tentativi}.` : ''}${sol ? ` Soluzione (la vedi solo tu): ${esc(sol)}.` : ''}</p></div>`;
}
// torneo: prove a punti tra i personaggi e due sfidanti del posto
function htmlTorneo(gioca) {
  const tr = S.st?.torneo; if (!tr) return '';
  const nome = id => tr.nomi?.[id] || S.st.pg?.[id]?.nome || (id.startsWith('npc:') ? id.slice(4) : '?');
  const classifica = Object.entries(tr.punti || {}).sort((a, b) => b[1] - a[1]);
  const tab = classifica.length ? `<ol class="classifica">${classifica.map(([id, n]) => `<li>${esc(nome(id))} <strong>${n}</strong></li>`).join('')}</ol>` : '';
  if (tr.finito) return `<div class="carta-mini torneo"><strong>🏆 Torneo finito: vince ${esc(tr.vincitore || '')}</strong>${tab}${capo() ? '<button type="button" data-torneo="chiudi">Chiudi il torneo</button>' : ''}</div>`;
  const prova = tr.prove[tr.round], giro = tr.tiri?.[tr.round] || {}, CAR = { for: 'Forza', des: 'Destrezza', cos: 'Costituzione', int: 'Intelligenza', sag: 'Saggezza', car: 'Carisma' };
  return `<div class="carta-mini torneo"><strong>🏆 Torneo · prova ${tr.round + 1} di ${tr.prove.length}: ${prova.icona} ${esc(prova.nome)}</strong>
    <p class="piccolo">Si tira d20 + ${CAR[prova.car]}. Punti: 3 al primo, 2 al secondo, 1 al terzo.</p>
    <ul class="tiri">${Object.values(giro).sort((a, b) => b.tot - a.tot).map(x => `<li>${esc(x.nome)} <span class="piccolo">${x.d20}${x.bonus >= 0 ? '+' : ''}${x.bonus}</span> = <strong>${x.tot}</strong></li>`).join('')}</ul>
    <div class="riga">${gioca && mioPg() && !giro[S.io] ? '<button type="button" class="pieno" data-torneo="tira">🎲 Tira</button>' : ''}${capo() ? '<button type="button" data-torneo="avanti">Prossima prova</button><button type="button" class="testo-btn" data-torneo="chiudi">Chiudi</button>' : ''}</div>
    ${tab ? `<p class="piccolo">Classifica</p>${tab}` : ''}</div>`;
}
// strumenti di chi guida: nascondere un tesoro, preparare un rompicapo, aprire un torneo
function htmlGiochiCapo() {
  if (!capo()) return '';
  return `<details class="carta-mini"><summary>🎲 Giochi per il gruppo: tesoro, rompicapo, torneo</summary>
    <div class="riga"><button type="button" data-caccia="nuova" ${S.st.caccia && !S.st.caccia.trovato ? 'disabled' : ''}>🗺️ Nascondi un tesoro</button><button type="button" data-torneo="apri" ${S.st.torneo && !S.st.torneo.finito ? 'disabled' : ''}>🏆 Organizza un torneo</button></div>
    <form class="riga" data-rompicapo-nuovo autocomplete="off"><select name="forma" aria-label="Tipo di rompicapo"><option value="">Rompicapo a caso</option><option value="leve">Quattro leve</option><option value="rune">Rune in ordine</option><option value="serratura">Serratura a combinazione</option></select><select name="trappola" aria-label="Trappola"><option value="">Trappola a caso</option><option value="dardi">Dardi avvelenati</option><option value="fulmine">Fulmini</option><option value="gas">Gas</option><option value="fossa">Botola</option><option value="lame">Lame</option></select><button>🔐 Prepara</button></form>
    <div class="riga"><button type="button" data-festa>🎉 Festa della stagione adesso</button><button type="button" data-giornale>📰 Stampa il giornale</button></div>
    <p class="piccolo">Indizi e soluzioni li prepara il gioco. Anche il master AI può nascondere tesori, preparare rompicapi e aprire tornei. Le feste arrivano da sole nel giorno giusto del calendario.</p></details>`;
}
$('#mondoVivo').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || !S.st) return;
  const torna = sel => requestAnimationFrame(() => $('#mondoVivo').querySelector(sel)?.focus()); // dopo il ridisegno il dito resta sullo stesso tasto
  if (b.dataset.caccia) { invia({ t: 'caccia_' + b.dataset.caccia }); Report.log('caccia', { cosa: b.dataset.caccia }); }
  if (b.dataset.torneo) { invia({ t: 'torneo_' + b.dataset.torneo }); Report.log('torneo', { cosa: b.dataset.torneo }); }
  const m = S.mosse, r = S.st.rompicapo; if (!m || !r) return;
  if (b.dataset.leva !== undefined) { const i = +b.dataset.leva; m.leve[i] = !m.leve[i]; renderMondoVivo(); torna(`[data-leva="${i}"]`); }
  if (b.dataset.runa !== undefined && m.rune.length < 3) { m.rune.push(+b.dataset.runa); renderMondoVivo(); torna(m.rune.length < 3 ? `[data-runa="${b.dataset.runa}"]` : '[data-rompicapo="prova"]'); }
  if (b.dataset.cifra !== undefined) { const i = +b.dataset.cifra; m.cifre[i] = (m.cifre[i] + Number(b.dataset.delta) + 10) % 10; renderMondoVivo(); torna(`[data-cifra="${i}"][data-delta="${b.dataset.delta}"]`); }
  if (b.dataset.rompicapo === 'cancella') { m.rune = []; renderMondoVivo(); torna('[data-runa="0"]'); }
  if (b.dataset.rompicapo === 'prova') { invia({ t: 'rompicapo_prova', mosse: r.tipo === 'leve' ? m.leve : r.tipo === 'rune' ? m.rune : m.cifre }); Report.log('rompicapo', { tipo: r.tipo }); if (r.tipo === 'rune') { m.rune = []; renderMondoVivo(); } }
});
$('#mondoVivo').addEventListener('submit', e => { const f = e.target; if (f.dataset.rompicapoNuovo !== undefined) { e.preventDefault(); invia({ t: 'rompicapo_nuovo', forma: f.forma.value, trappola: f.trappola.value }); Report.log('rompicapo_nuovo', { forma: f.forma.value }); } });

// animali che crescono: livello, barra dei punti, trucchi imparati e addestramento una volta al giorno di gioco
function htmlAnimale(a, i, puo) {
  const soglie = S.st?.catalogo?.pxAnimale || [0, 100, 300, 700, 1500], liv = a.livello || 1, prossimo = soglie[liv], prima = soglie[liv - 1] || 0;
  const perc = prossimo ? Math.max(0, Math.min(100, Math.round(((a.px || 0) - prima) / (prossimo - prima) * 100))) : 100;
  return `<div class="animale"><div class="mondo-riga"><strong>${esc(a.nome)}</strong> <span class="piccolo">${esc(a.specie)} · livello ${liv} · PF ${a.pf}${a.pfMax && a.pfMax !== a.pf ? '/' + a.pfMax : ''} · CA ${a.ca}</span></div>
    <div class="barra-px" role="progressbar" aria-label="Crescita di ${esc(a.nome)}" aria-valuenow="${perc}" aria-valuemin="0" aria-valuemax="100"><span style="width:${perc}%"></span></div>
    <p class="piccolo">${prossimo ? `${a.px || 0} su ${prossimo} punti per il livello ${liv + 1}` : 'Livello massimo'}${a.abilita ? ' · ' + esc(a.abilita) : ''}</p>
    ${(a.trucchi || []).length ? `<ul class="trucchi">${a.trucchi.map(t => `<li>✨ ${esc(t)}</li>`).join('')}</ul>` : '<p class="piccolo">Impara il primo trucco al livello 2: cresce con metà dei vostri PX e con l\'addestramento.</p>'}
    ${puo ? `<button type="button" data-addestra="${i}">🦴 Addestra ${esc(a.nome)}</button>` : ''}</div>`;
}
$('#scheda').addEventListener('click', e => { const b = e.target.closest('[data-addestra]'); if (b) { invia({ t: 'addestra', animale: +b.dataset.addestra }); Report.log('addestra', {}); } });

// avventure scritte da voi: editor a scene, codice di condivisione, importazione da un altro gruppo
const CAMPI_SCENA = [['luogo', 'Luogo (es. Cripta di Sale)', 60], ['leggi', 'Da leggere ad alta voce quando arrivano', 1200], ['obiettivo', 'Cosa devono fare qui', 300], ['png', 'Personaggi che incontrano', 200], ['indizi', 'Indizi da trovare', 300], ['nemici', 'Nemici (es. 3 Scheletro, 1 Zombi)', 120], ['tesoro', 'Tesoro', 200]];
function campiScena(sc = {}) {
  const f = document.createElement('fieldset'); f.className = 'avv-scena';
  const val = k => k === 'nemici' ? (sc.incontro || []).map(n => `${n.numero} ${n.nome}`).join(', ') : sc[k] || '';
  f.innerHTML = `<legend>Scena</legend>${CAMPI_SCENA.map(([k, ph, max]) => k === 'leggi' ? `<textarea name="${k}" rows="3" maxlength="${max}" placeholder="${ph}" aria-label="${ph}">${esc(val(k))}</textarea>` : `<input name="${k}" maxlength="${max}" placeholder="${ph}" aria-label="${ph}" value="${esc(val(k))}">`).join('')}<button type="button" class="testo-btn" data-togli-scena>Togli questa scena</button>`;
  $('#avvScene').append(f); numeraScene();
}
function numeraScene() { $('#avvScene').querySelectorAll('legend').forEach((l, i) => { l.textContent = `Scena ${i + 1}`; }); }
function leggiAvventura() {
  const f = $('#formAvvMia');
  return { titolo: f.titolo.value, sinossi: f.sinossi.value, livelli: f.livelli.value, ricompensa: f.ricompensa.value, segreti: f.segreti.value, scene: [...$('#avvScene').children].map(fs => Object.fromEntries(CAMPI_SCENA.map(([k]) => [k, fs.querySelector(`[name="${k}"]`).value]))) };
}
function apriEditor(id) {
  const a = id ? S.st?.avventureMie?.[id] : null, f = $('#formAvvMia'); if (!f) return;
  f.reset(); f.dataset.id = a ? id : ''; $('#avvScene').innerHTML = '';
  if (a) { f.titolo.value = a.titolo; f.sinossi.value = a.sinossi || ''; f.livelli.value = a.livelli || ''; f.ricompensa.value = a.ricompensa || ''; f.segreti.value = (a.segreti || []).join('\n'); a.scene.forEach(sc => campiScena(sc)); } else campiScena();
  $('#avvMiaTitolo').textContent = a ? `Modifica: ${a.titolo}` : 'Nuova avventura'; $('#btnAvvAnnulla').hidden = !a;
}
function renderAvventureMie() {
  const box = $('#listaAvvMie'); if (!box || !S.st) return;
  $('#boxAvvMie').hidden = !capo();
  const mie = Object.entries(S.st.avventureMie || {});
  box.innerHTML = mie.length ? mie.map(([id, a]) => `<div class="hb-voce"><div><strong>${esc(a.titolo)}</strong> <span class="piccolo">${a.scene.length} ${a.scene.length === 1 ? 'scena' : 'scene'} · livelli ${esc(a.livelli)}${a.autore ? ' · scritta da ' + esc(a.autore) : ''}${a.da ? ' (' + esc(a.da) + ')' : ''}</span>
    ${a.chiave ? `<p class="codice-mondo">${esc(S.codice + '-' + a.chiave)}</p>` : ''}
    <div class="riga"><button type="button" class="pieno" data-avv-gioca="${esc(id)}">Gioca</button><button type="button" data-avv-modifica="${esc(id)}">Modifica</button>${a.chiave ? `<button type="button" data-avv-copia="${esc(id)}">Copia il codice</button><button type="button" data-avv-ritira="${esc(id)}">Non condividere più</button>` : `<button type="button" data-avv-condividi="${esc(id)}">Condividi</button>`}<button type="button" class="testo-btn" data-avv-elimina="${esc(id)}">Elimina</button></div></div></div>`).join('') : '<p class="piccolo">Ancora nessuna avventura scritta da voi.</p>';
}
$('#listaAvvMie').addEventListener('click', async e => {
  const b = e.target.closest('button'); if (!b) return; const d = b.dataset;
  if (d.avvGioca) { invia({ t: 'avventura_inizia', id: d.avvGioca }); toast('L\'avventura comincia…'); Report.log('avventura_mia', { cosa: 'gioca' }); }
  if (d.avvModifica) { apriEditor(d.avvModifica); $('#formAvvMia').scrollIntoView({ block: 'start', behavior: 'smooth' }); }
  if (d.avvCondividi) { invia({ t: 'avventura_condividi', id: d.avvCondividi }); Report.log('avventura_mia', { cosa: 'condividi' }); }
  if (d.avvRitira) invia({ t: 'avventura_condividi', id: d.avvRitira, ritira: true });
  if (d.avvCopia) { const cod = `${S.codice}-${S.st.avventureMie?.[d.avvCopia]?.chiave}`; try { await navigator.clipboard.writeText(cod); toast('Codice copiato: mandalo all\'altro gruppo'); } catch { toast(cod); } }
  if (d.avvElimina) { if (!d.sicuro) { d.sicuro = '1'; b.textContent = 'Tocca ancora per eliminare'; return; } invia({ t: 'avventura_elimina', id: d.avvElimina }); }
});
$('#formAvvMia').addEventListener('submit', e => {
  e.preventDefault(); const f = e.target, a = leggiAvventura();
  if (!a.titolo.trim() || !a.scene.some(s => s.luogo.trim() && (s.leggi.trim() || s.obiettivo.trim()))) { toast('Servono il titolo e almeno una scena con il luogo e cosa succede', true); return; }
  invia({ t: 'avventura_salva', id: f.dataset.id || undefined, avventura: a }); Report.log('avventura_mia', { cosa: 'salva', scene: a.scene.length }); apriEditor();
});
$('#btnAvvScena').addEventListener('click', () => { if ($('#avvScene').children.length >= 12) { toast('Al massimo 12 scene', true); return; } campiScena(); $('#avvScene').lastElementChild.querySelector('input').focus(); });
$('#avvScene').addEventListener('click', e => { if (e.target.closest('[data-togli-scena]')) { e.target.closest('fieldset').remove(); numeraScene(); } });
$('#btnAvvAnnulla').addEventListener('click', () => apriEditor());
$('#formAvvImporta').addEventListener('submit', e => { e.preventDefault(); const c = $('#avvCodice').value.trim(); if (!c) return; invia({ t: 'avventura_importa', codice: c }); $('#avvCodice').value = ''; Report.log('avventura_mia', { cosa: 'importa' }); });
apriEditor();

/* ============ 4.6: mercato, duello, giornale, patti, feste delle stagioni, allenamento, biblioteca, scelte rapide, temi, album, rivincite, notte ============ */
// mercato tra di voi: una bancarella con gli oggetti messi in vendita (o regalati) dai personaggi
function cartaMercato(gioca) {
  const b = S.st?.bancarella || [], pg = mioPg(), mie = (pg?.equip || []).filter(e => !e.indossato);
  return `<h3>Mercato tra di voi</h3><ul class="tesoro-ogg">${b.map(x => `<li><span><strong>${esc(x.nome)}</strong> <span class="piccolo">di ${esc(x.chi)} · ${x.prezzo ? x.prezzo + ' mo' : 'in regalo'}</span></span>${gioca && pg ? (x.da === S.io ? `<button type="button" data-banc-togli="${esc(x.id)}">Riprendi</button>` : `<button type="button" data-banc-compra="${esc(x.id)}" ${(pg.oro || 0) >= x.prezzo ? '' : 'disabled'}>${x.prezzo ? 'Compra' : 'Prendi'}</button>`) : capo() ? `<button type="button" data-banc-togli="${esc(x.id)}">Togli</button>` : ''}</li>`).join('') || '<li class="piccolo">La bancarella è vuota</li>'}</ul>
    ${gioca && pg && mie.length ? `<form id="formBancarella" class="riga" autocomplete="off"><select id="bancOggetto" aria-label="Oggetto da mettere sulla bancarella">${[...new Set(mie.map(e => e.nome))].map(n => `<option>${esc(n)}</option>`).join('')}</select><input id="bancPrezzo" type="number" min="0" max="100000" value="0" inputmode="numeric" style="width:90px;flex:0 0 90px" aria-label="Prezzo in monete (0 = regalo)"><button>Metti in vendita</button></form><p class="piccolo">Prezzo 0 = lo regali. Le monete passano da una scheda all'altra.</p>` : ''}`;
}
$('#tesoro').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.bancCompra) { invia({ t: 'bancarella_compra', id: b.dataset.bancCompra }); Report.log('mercato', { cosa: 'compra' }); } if (b.dataset.bancTogli) invia({ t: 'bancarella_togli', id: b.dataset.bancTogli }); });
$('#tesoro').addEventListener('submit', e => { if (e.target.id !== 'formBancarella') return; e.preventDefault(); invia({ t: 'bancarella_metti', nome: $('#bancOggetto').value, prezzo: Number($('#bancPrezzo').value) || 0 }); Report.log('mercato', { cosa: 'metti' }); });

// duello amichevole: due personaggi o il campione dell'arena, senza ferite vere
function htmlDuello(gioca) {
  const d = S.st?.duello, pg = mioPg(), io = S.io;
  if (!d) {
    if (!gioca || !pg) return '';
    const altri = Object.entries(S.st.pg || {}).filter(([id, p]) => id !== io && p?.nome);
    return `<details class="carta-mini"><summary>⚔️ Duello amichevole</summary><p class="piccolo">Un combattimento veloce tra due personaggi: nessuna ferita vera, solo l'onore.</p><form class="riga" data-duello-sfida autocomplete="off"><select name="con" aria-label="Chi sfidi a duello">${altri.map(([id, p]) => `<option value="${esc(id)}">${esc(p.nome)}</option>`).join('')}<option value="campione">Il campione dell'arena</option></select><button>Sfida</button></form></details>`;
  }
  const dentro = io === d.a || io === d.b;
  const barra = id => { const st = d.stat[id], perc = Math.round(d.pf[id] / st.pf * 100); return `<div class="duellante"><div class="mondo-riga"><strong>${esc(d.nomi[id])}</strong> <span class="piccolo">CA ${st.ca} · ${d.pf[id]}/${st.pf} PF</span></div><div class="barra-px" role="progressbar" aria-label="Punti ferita di ${esc(d.nomi[id])} nel duello" aria-valuenow="${perc}" aria-valuemin="0" aria-valuemax="100"><span style="width:${perc}%;background:${perc > 50 ? coloreBene() : coloreMale()}"></span></div></div>`; };
  const fondo = d.finito ? `<p><strong>🏆 Vince ${esc(d.nomi[d.vincitore])}</strong></p>${dentro || capo() ? '<button type="button" data-duello="chiudi">Chiudi</button>' : ''}`
    : d.stato === 'invito' ? (io === d.b ? '<div class="riga"><button type="button" class="pieno" data-duello="si">Accetto</button><button type="button" data-duello="no">No, grazie</button></div>' : `<p class="piccolo">Si aspetta che ${esc(d.nomi[d.b])} accetti…</p>${dentro || capo() ? '<button type="button" class="testo-btn" data-duello="chiudi">Annulla</button>' : ''}`)
      : `<p class="piccolo">Tocca a ${esc(d.nomi[d.turno])}</p><div class="riga">${d.turno === io ? '<button type="button" class="pieno" data-duello="colpo">⚔️ Colpisci</button>' : ''}${dentro ? '<button type="button" class="testo-btn" data-duello="resa">Mi arrendo</button>' : ''}</div>`;
  return `<div class="carta-mini duello"><strong>⚔️ Duello: ${esc(d.nomi[d.a])} contro ${esc(d.nomi[d.b])}</strong>${barra(d.a)}${barra(d.b)}${d.log.length ? `<ul class="tiri">${d.log.slice(-4).map(x => `<li class="piccolo">${esc(x)}</li>`).join('')}</ul>` : ''}${fondo}</div>`;
}
// patti e debiti con i PNG: il master li ricorda e li fa pagare
function htmlPatti() {
  const l = S.st?.patti || [], aperti = l.filter(x => x.stato === 'aperto'), chiusi = l.filter(x => x.stato !== 'aperto');
  if (!l.length && !capo()) return '';
  const riga = x => `<div class="mondo-riga"><span>${x.chi === 'png' ? `<strong>${esc(x.png)}</strong> deve al gruppo: ` : `Il gruppo deve a <strong>${esc(x.png)}</strong>: `}${esc(x.cosa)}${x.stato !== 'aperto' ? ` <span class="piccolo">(${x.stato === 'saldato' ? 'mantenuto' : 'tradito'})</span>` : ''}</span>${capo() && x.stato === 'aperto' ? `<span class="riga"><button type="button" data-patto="${esc(x.id)}" data-esito="saldato" aria-label="Patto mantenuto">✔</button><button type="button" data-patto="${esc(x.id)}" data-esito="tradito" aria-label="Patto tradito">✖</button></span>` : ''}</div>`;
  return `<details class="carta-mini patti"${aperti.length ? ' open' : ''}><summary>🤝 Patti e debiti (${aperti.length})</summary>${aperti.map(riga).join('') || '<p class="piccolo">Nessuna promessa in sospeso.</p>'}${chiusi.length ? `<details><summary class="piccolo">Patti chiusi (${chiusi.length})</summary>${chiusi.map(riga).join('')}</details>` : ''}
    ${capo() ? '<form class="colonna" data-patto-nuovo autocomplete="off"><div class="riga"><input name="png" maxlength="60" placeholder="Con chi (es. Oste Bruno)" aria-label="Personaggio del patto"><select name="chi" aria-label="Chi deve a chi" style="flex:0 0 150px"><option value="gruppo">Il gruppo deve</option><option value="png">Il PNG deve</option></select></div><div class="riga"><input name="cosa" maxlength="200" placeholder="Cosa (es. un favore a sua figlia)" aria-label="Cosa è stato promesso"><button>Segna</button></div></form>' : ''}
    <p class="piccolo">Il master ricorda le promesse e torna a riscuoterle al momento giusto.</p></details>`;
}
// rivincite: chi vi ha messo a terra torna più forte; batterlo vale un trofeo
function htmlRivincite() {
  const l = S.st?.rivincite || []; if (!l.length) return '';
  return `<div class="carta-mini rivincite"><strong>🔁 Rivincite</strong>${l.map(r => `<div class="mondo-riga"><span>${r.vinta ? '🏆' : '⚡'} <strong>${esc(r.nome)}</strong> <span class="piccolo">${r.vinta ? 'sconfitto: rivincita presa!' : `vi ha battuti ${r.volte === 1 ? 'una volta' : r.volte + ' volte'}${r.chi ? ` (ultima: ${esc(r.chi)} a terra)` : ''}`}</span></span></div>`).join('')}<p class="piccolo">Quando torna è più forte: batterlo vale il trofeo «Rivincita!».</p></div>`;
}
$('#mondoVivo').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || !S.st) return;
  const d = b.dataset.duello; if (d) { invia(d === 'si' || d === 'no' ? { t: 'duello_rispondi', si: d === 'si' } : { t: 'duello_' + d }); Report.log('duello', { cosa: d }); }
  if (b.dataset.patto) invia({ t: 'patto_chiudi', id: b.dataset.patto, esito: b.dataset.esito });
  if (b.dataset.festa !== undefined) { invia({ t: 'festa_stagione' }); Report.log('festa', {}); }
  if (b.dataset.giornale !== undefined) invia({ t: 'giornale_stampa' });
});
$('#mondoVivo').addEventListener('submit', e => {
  const f = e.target;
  if (f.dataset.duelloSfida !== undefined) { e.preventDefault(); invia({ t: 'duello_sfida', con: f.con.value }); Report.log('duello', { cosa: 'sfida' }); }
  if (f.dataset.pattoNuovo !== undefined) { e.preventDefault(); if (f.png.value.trim() && f.cosa.value.trim()) invia({ t: 'patto_nuovo', png: f.png.value.trim(), cosa: f.cosa.value.trim(), chi: f.chi.value }); else toast('Scrivi con chi è il patto e cosa è stato promesso', true); }
});

// giornale del regno: l'ultimo numero e i precedenti
function renderGiornale() {
  const box = $('#giornale'); if (!box || !S.st) return;
  const l = S.st.giornali || [], g = l.find(x => x.numero === S.giornaleN) || l.at(-1);
  if (!g) { box.innerHTML = capo() ? '<div class="carta-mini"><strong>📰 Il giornale del regno</strong><p class="piccolo">Esce da solo a ogni nuova serata, con le vostre imprese viste dalla gente.</p><button type="button" data-stampa-giornale>Stampa il primo numero</button></div>' : ''; return; }
  box.innerHTML = `<article class="giornale"><header><h3>${esc(g.testata)}</h3><p class="piccolo">Numero ${g.numero} · serata ${g.sessione}</p></header>${g.articoli.map(a => `<section><h4>${esc(a.titolo)}</h4><p>${esc(a.testo)}</p></section>`).join('')}${g.pettegolezzo ? `<p class="pettegolezzo"><strong>Si mormora:</strong> ${esc(g.pettegolezzo)}</p>` : ''}
    <div class="riga">${l.length > 1 ? `<select data-numero aria-label="Numero del giornale">${[...l].reverse().map(x => `<option value="${x.numero}" ${x.numero === g.numero ? 'selected' : ''}>Numero ${x.numero}</option>`).join('')}</select>` : ''}${capo() ? '<button type="button" data-stampa-giornale>Stampa un numero nuovo</button>' : ''}</div></article>`;
}
$('#giornale').addEventListener('click', e => { if (e.target.closest('[data-stampa-giornale]')) { invia({ t: 'giornale_stampa' }); Report.log('giornale', {}); } });
$('#giornale').addEventListener('change', e => { if (e.target.dataset.numero !== undefined) { S.giornaleN = Number(e.target.value); renderGiornale(); } });

// scelte rapide: tre idee del master per chi non sa cosa fare
function mostraScelte(scelte) {
  const box = $('#scelteRapide'); if (!box) return;
  const l = Array.isArray(scelte) ? scelte : []; S.scelte = l;
  box.hidden = !l.length || me()?.ruolo !== 'giocatore' || !mioPg() || !masterAI();
  box.innerHTML = box.hidden ? '' : `<span class="piccolo">Non sai cosa fare? Prova:</span>${l.map((x, i) => `<button type="button" class="chip" data-scelta="${i}">${esc(x)}</button>`).join('')}`;
}
$('#scelteRapide').addEventListener('click', e => { const b = e.target.closest('[data-scelta]'); if (!b) return; const t = S.scelte?.[+b.dataset.scelta]; if (!t) return; invia({ t: 'parlato', testo: t, alMaster: true }); S.ultimoParlato = Date.now(); mostraScelte([]); Report.log('scelta-rapida', {}); });

// biblioteca delle regole illustrata: condizioni, incantesimi e regole di base, ognuna con il suo disegno
function voceBiblioteca(nome) {
  for (const [tipo, gr] of Object.entries(BIBLIOTECA)) { const k = Object.keys(gr).find(x => x.toLowerCase() === String(nome).toLowerCase()); if (k) return { tipo, nome: k, icona: gr[k][0], testo: gr[k][1] }; }
  return null;
}
function apriVoce(nome) {
  const v = voceBiblioteca(nome); if (!v) return;
  const liv = v.tipo === 'incantesimi' ? INCANTESIMI_NOTI[v.nome] : null;
  chiedi(`<div class="voce-bib"><div class="voce-disegno" aria-hidden="true">${v.icona}</div><h2>${esc(v.nome[0].toUpperCase() + v.nome.slice(1))}</h2><p class="piccolo">${v.tipo === 'condizioni' ? 'Condizione' : v.tipo === 'incantesimi' ? (liv ? `Incantesimo di ${liv}° livello` : 'Trucchetto') : 'Regola'}</p><p>${esc(v.testo)}</p></div>`, [{ testo: 'Chiudi', pieno: true }]);
  Report.log('biblioteca', { voce: v.nome });
}
function renderBiblioteca() {
  const box = $('#bibliotecaVoci'); if (!box) return;
  const q = ($('#cercaRegola')?.value || '').trim().toLowerCase(), TIT = { condizioni: 'Condizioni', incantesimi: 'Incantesimi', regole: 'Regole di base' };
  box.innerHTML = Object.entries(BIBLIOTECA).map(([tipo, gr]) => { const voci = Object.entries(gr).filter(([n, [, t]]) => !q || n.toLowerCase().includes(q) || t.toLowerCase().includes(q)); return voci.length ? `<h4>${TIT[tipo]}</h4><div class="chips">${voci.map(([n, [ic]]) => `<button type="button" class="chip" data-voce="${esc(n)}"><span aria-hidden="true">${ic}</span> ${esc(n)}</button>`).join('')}</div>` : ''; }).join('') || '<p class="piccolo">Niente con queste parole.</p>';
}
document.addEventListener('click', e => { const b = e.target.closest('[data-voce]'); if (b) apriVoce(b.dataset.voce); });
$('#cercaRegola').addEventListener('input', renderBiblioteca);
renderBiblioteca();

// tema personale: parte quando il personaggio fa un colpo critico (lo sentono tutti)
const NOMI_TEMI = { eroico: 'Fanfara eroica', arpa: 'Arpa elfica', tamburi: 'Tamburi dei nani', flauto: 'Flauto del bosco', oscuro: 'Organo oscuro', campane: 'Campane del tempio' };
function htmlTema(pg, puo) {
  return `<label>Il tuo tema sui colpi critici<select data-tema ${puo ? '' : 'disabled'}><option value="">quello di tutti</option>${Object.entries(NOMI_TEMI).map(([k, n]) => `<option value="${k}" ${pg.tema === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label>`;
}
$('#scheda').addEventListener('change', e => { if (e.target.dataset.tema === undefined || S.viewPg !== S.io || !mioPg()) return; const v = e.target.value; invia({ t: 'scheda', pg: { ...mioPg(), tema: v || undefined } }); Suoni.avvia(); if (v) Suoni.tema(v); else Suoni.effetto('critico'); toast(v ? `Tema scelto: ${NOMI_TEMI[v]}` : 'Tema di tutti'); Report.log('tema', { tema: v }); });

// album della campagna: tutte le illustrazioni, serata per serata
function mostraAlbum(m) {
  const per = {}; for (const x of m.immagini || []) (per[x.sessione] = per[x.sessione] || []).push(x);
  const serate = Object.keys(per).map(Number).sort((a, b) => b - a);
  S.album = serate.flatMap(n => per[n]);
  chiedi(`<h2>📷 Album della campagna</h2>${serate.length ? serate.map(n => `<h3>Serata ${n}</h3><div class="album-griglia">${per[n].map(x => `<button type="button" class="album-foto" data-foto="${esc(x.id)}" aria-label="${esc(x.didascalia || 'Illustrazione')}"><img src="${urlMedia('img', x.id)}" alt="" loading="lazy"></button>`).join('')}</div>`).join('') : '<p class="piccolo">Ancora nessuna illustrazione: chiedete al master di disegnare una scena.</p>'}`, [{ testo: 'Chiudi', pieno: true }]);
  Report.log('album', { foto: S.album.length });
}
function fotoGrande(i) {
  const x = S.album?.[i]; if (!x) return; document.querySelector('.album-grande')?.remove();
  const el = document.createElement('div'); el.className = 'album-grande'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Illustrazione');
  el.innerHTML = `<img src="${urlMedia('img', x.id)}" alt="${esc(x.didascalia || '')}"><p>${esc(x.didascalia || '')}${x.luogo ? ` <span class="piccolo">· ${esc(S.st.luoghi?.[x.luogo]?.nome || '')}</span>` : ''}</p><div class="riga"><button type="button" data-album="-1" ${i ? '' : 'disabled'}>‹ Prima</button><button type="button" data-album="chiudi" class="pieno">Chiudi</button><button type="button" data-album="1" ${i < S.album.length - 1 ? '' : 'disabled'}>Dopo ›</button></div>`;
  el.dataset.i = i; ($('#dlg').open ? $('#dlg') : document.body).append(el); el.querySelector('[data-album="chiudi"]').focus();
}
document.addEventListener('click', e => {
  const f = e.target.closest('[data-foto]'); if (f) fotoGrande(S.album.findIndex(x => x.id === f.dataset.foto));
  const a = e.target.closest('[data-album]'); if (a) { const el = a.closest('.album-grande'), i = Number(el.dataset.i); if (a.dataset.album === 'chiudi') el.remove(); else fotoGrande(i + Number(a.dataset.album)); }
});
$('#btnAlbum').addEventListener('click', () => invia({ t: 'album' }));

// allenamento di cinque minuti: una scena da soli per provare un personaggio nuovo
const ALLENAMENTI = [
  { titolo: 'L\'arena', obiettivo: 'Nell\'arena di Pietrarossa due goblin ti sfidano davanti alla folla: battili, con le armi o con la magia.' },
  { titolo: 'Il corridoio delle trappole', obiettivo: 'Attraversa un vecchio corridoio pieno di trappole fino alla porta in fondo, perdendo meno ferite possibile.' },
  { titolo: 'La torre del mago', obiettivo: 'Un vecchio mago ti mette alla prova con tre piccoli incarichi da risolvere con l\'ingegno o con i tuoi poteri.' },
  { titolo: 'La trattativa', obiettivo: 'Convinci il capo dei banditi a liberare un mercante senza combattere.' }
];
$('#allenamento').innerHTML = ALLENAMENTI.map((a, i) => `<option value="${i}">${esc(a.titolo)}</option>`).join('');
$('#btnAllenamento').addEventListener('click', () => {
  const mioNome = $('#cMioNome').value.trim() || leggi('ta_nome', '') || $('#eNome').value.trim();
  if (!mioNome) { toast('Scrivi il tuo nome nella carta "Crea una campagna"', true); $('#cMioNome').focus(); return; }
  const a = ALLENAMENTI[Number($('#allenamento').value) || 0]; scrivi('ta_nome', mioNome); Voce.riattivaAudio(); Report.log('allenamento', { titolo: a.titolo });
  connetti(codiceNuovo(), () => ({ t: 'crea', nome: 'Allenamento: ' + a.titolo, regole: $('input[name="cRegole"]:checked').value, ambientazione: 'Fantasy classico. ' + a.obiettivo, masterTipo: 'ai', mioNome, solitaria: true, sfida: { ...a, settimana: 'allenamento', allenamento: true } }));
});

// modalità notte: luci basse, effetti più piano e voce del master più calma (anche da sola, dalle 22 alle 7)
function notteAttiva() { const o = OPZ.notte; if (o === 'si') return true; if (o !== 'auto') return false; const h = new Date().getHours(); return h >= 22 || h < 7; }
function applicaNotte() {
  const n = notteAttiva(); document.body.classList.toggle('notte', n); Narratore.calmo = n;
  Narratore.volume = (OPZ.volVoce ?? 1) * (n ? 0.6 : 1); Suoni.volEffetti = (OPZ.volEffetti ?? 1) * (n ? 0.5 : 1); Suoni.volMusica = (OPZ.volMusica ?? 1) * (n ? 0.6 : 1);
}
$('#optNotte').value = OPZ.notte || 'no';
$('#optNotte').addEventListener('change', e => { OPZ.notte = e.target.value; scrivi('ta_opzioni', OPZ); applicaNotte(); Report.log('notte', { notte: OPZ.notte }); });
setInterval(() => { if (OPZ.notte === 'auto') applicaNotte(); }, 60000);
applicaNotte();
