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
  $('#chatABox').hidden = me()?.ruolo === 'spettatore' || !altri.length;
  const prima = sel.value;
  sel.innerHTML = '<option value="">tutto il tavolo</option>' + altri.map(([id, m]) => `<option value="${esc(id)}">solo ${esc(S.st.pg[id]?.nome || m.nome)} (in privato)</option>`).join('');
  if ([...sel.options].some(o => o.value === prima)) sel.value = prima;
}
function arrivaSussurro(m) {
  S.sussurri.push({ t: m.quando || Date.now(), tipo: 'sussurro', chi: m.da, testo: m.da === S.io ? `In privato a ${m.perNome}: ${m.testo}` : `${m.nome}, in privato: ${m.testo}` });
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
    renderMondoCondiviso();
    const ta = $('#aAppunti'); if (document.activeElement !== ta && !ta.dataset.toccato) ta.value = S.st.appunti || '';
    const f = S.st.fatti || []; $('#boxFatti').hidden = !f.length; $('#fattiConta').textContent = f.length; $('#fattiLista').innerHTML = f.map(x => `<li>${esc(x)}</li>`).join('');
  }
}
$('#aAppunti').addEventListener('input', e => { e.target.dataset.toccato = '1'; });
$('#btnSalvaAppunti').addEventListener('click', () => { const t = $('#aAppunti').value.trim(); if (invia({ t: 'appunti', testo: t })) { delete $('#aAppunti').dataset.toccato; toast('Appunti salvati: il master li userà da adesso'); Report.log('appunti', { caratteri: t.length }); } });
$('#fileAppunti').addEventListener('change', async e => {
  const f = e.target.files?.[0]; e.target.value = ''; if (!f) return;
  if (f.size > 200000) { toast('Il file è troppo grande: servono appunti di poche pagine', true); return; }
  const t = (await f.text()).replace(/\r/g, '').trim(), ta = $('#aAppunti');
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
