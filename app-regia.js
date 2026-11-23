// Tavolo d'Avventura — Regia: cronaca, appunti del mondo, turni a giro, messaggi privati, aiuto, azioni del turno, mazzo, ricerca nel diario, riassunti.
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
  const attivo = !!(S.st?.campagna?.giro && masterAI() && g && !S.st.combattimento?.attivo && g.detti.length);
  box.hidden = !attivo; if (!attivo) return;
  const tocca = me()?.ruolo === 'giocatore' && mioPg() && !g.detti.includes(S.io), altri = g.mancano.filter(n => !tocca || n !== me().nome);
  $('#giroTesto').textContent = !g.mancano.length ? 'Tutti hanno detto la loro: il master risponde.' : tocca ? `Turni a giro: tocca a te dire cosa fai${altri.length ? ` (manca anche ${altri.join(', ')})` : ''}. Poi il master risponde a tutti insieme.` : `Turni a giro: manca ${g.mancano.join(', ')}. Poi il master risponde a tutti insieme.`;
  $('#btnGiroOra').hidden = !capo() || !g.mancano.length;
}
$('#btnGiroOra').addEventListener('click', () => invia({ t: 'master_ora' }));
// chi non sta guardando il diario lo viene a sapere lo stesso: a chi non ha ancora parlato si dice che tocca a lui
function avvisaGiro(g) {
  if (!g?.detti.length || !g.mancano.length || S.vista === 'vDiario' || largo()) return;
  const tocca = me()?.ruolo === 'giocatore' && !g.detti.includes(S.io);
  toast(tocca ? 'Turni a giro: tocca anche a te dire cosa fai' : `Turni a giro: manca ${g.mancano.join(', ')}`, false, 5000);
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
    if (k === 'scatto') { S.mosso = (S.mosso || 0) - Math.max(1, Math.floor((pg.vel || 9) / 1.5)); aggiornaExtraMappa(); renderCombat(); }
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
  chiedi(`<h2>Nelle puntate precedenti</h2><div class="storia-pg">${m.testo.split(/\n+/).map(r => `<p>${esc(r)}</p>`).join('')}</div>`, [{ testo: 'Condividi', pieno: true }, { testo: 'Chiudi' }]).then(i => { if (i === 0) condividiRiassunto(); });
}

/* ============ APPUNTI DEL MONDO E IMPOSTAZIONI DELLA REGIA ============ */
function renderRegia() {
  if (!S.st) return;
  renderCronaca(); renderGiro(); renderDestinatari();
  $('#btnMischia').hidden = !capo(); $('#btnMano').hidden = me()?.ruolo !== 'giocatore' || Object.keys(S.st.membri).length < 2;
  const c = S.st.campagna;
  if (capo()) {
    $('#aDifficolta').value = c.difficolta || 'normale'; $('#aGiro').checked = !!c.giro; $('#aStile').value = c.stileImg || 'realistico';
    $('#aGiro').closest('label').hidden = c.masterTipo !== 'ai';
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
