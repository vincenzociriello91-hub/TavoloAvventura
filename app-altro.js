// Tavolo d'Avventura — Scheda Altro e aggiornamenti. Si carica dopo app.js, nell'ordine scritto in index.html.
/* ============ ALTRO ============ */
$('#btnSpettatori').addEventListener('click', async () => {
  const sp = S.st?.campagna?.invitoSpettatori; if (!sp) { toast('Link per spettatori non disponibile: ricarica la pagina', true); return; }
  const l = `${location.origin}${location.pathname}?c=${S.codice}&i=${sp}&s=1`; // codice a parte: con questo link si entra solo per guardare
  try { if (navigator.share) await navigator.share({ title: 'Guarda la nostra partita di D&D', url: l }); else { await navigator.clipboard.writeText(l); toast('Link per spettatori copiato'); } } catch {}
  Report.log('link_spettatori', {});
});
$('#reazioni').addEventListener('click', e => { const b = e.target.closest('[data-reazione]'); if (b) invia({ t: 'reazione', emoji: b.dataset.reazione }); });
function reazioneVola(emoji, nome) {
  const el = document.createElement('div'); el.className = 'reazione-vola'; el.innerHTML = `${esc(emoji)}<small>${esc(nome || '')}</small>`;
  el.style.left = (8 + Math.random() * 78) + '%'; $('#volano').appendChild(el); setTimeout(() => el.remove(), 2800);
}
function linkInvito() { const c = S.st?.campagna; return c?.invito ? `${location.origin}${location.pathname}?c=${S.codice}&i=${c.invito}` : ''; }
function renderInvito() {
  const url = linkInvito();
  $('#cartaInvito').hidden = !url;
  if (!url) return;
  if (typeof qrcode === 'undefined') { if (!renderInvito.carico) { renderInvito.carico = true; const sc = document.createElement('script'); sc.src = 'qrcode.js'; sc.onload = renderInvito; document.head.appendChild(sc); } return; } // il disegno del QR si scarica solo quando serve
  try { const q = qrcode(0, 'M'); q.addData(url); q.make(); $('#qr').innerHTML = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); } catch { $('#qr').textContent = S.codice; }
  $('#btnNuovoInvito').hidden = !capo();
  $('#linkTv').href = url + '&tv=1';
}
function renderAltro() {
  renderInvito();
  const c = S.st.campagna;
  $('#cartaCampagna').hidden = !capo();
  if (capo()) {
    $('#aNome').value = c.nome; $('#aAmb').value = c.ambientazione;
    $$('input[name="aRegole"]').forEach(r => r.checked = r.value === c.regole);
    $$('input[name="aMaster"]').forEach(r => r.checked = r.value === c.masterTipo);
    $('#aTimer').value = String(c.timerTurno || 0);
    $('#ruoliBox').innerHTML = me()?.admin ? `<h3>Ruoli</h3>${Object.entries(S.st.membri).map(([id, m]) => `<div class="riga"><label style="flex:1">${esc(m.nome)}${id === S.io ? ' (tu)' : ''}<select data-ruolo="${id}">${['giocatore', 'master', 'spettatore'].map(r => `<option ${r === m.ruolo ? 'selected' : ''}>${r}</option>`).join('')}</select></label>${id !== S.io ? `<button type="button" data-rimuovi="${id}">Togli</button>` : ''}</div>`).join('')}` : '';
  }
  $('#cartaBot').hidden = !me()?.admin;
  if (me()?.admin && !$('#linkCanale')) $('#ver').insertAdjacentHTML('afterend', ` · <a id="linkCanale" href="${CANALE === 'prova' ? location.pathname.replace(/prova\/.*$/, '') : location.pathname.replace(/[^/]*$/, '') + 'prova/'}">${CANALE === 'prova' ? 'vai al canale pubblico' : 'vai al canale di prova'}</a>`);
  renderCosti();
  $('#optNome').value = me()?.nome || '';
  $('#optSuoni').checked = OPZ.suoni; $('#optVolume').value = OPZ.volume;
  $('#optNarratore').checked = OPZ.narratore; $('#optAvvisi').checked = OPZ.avvisi; $('#optMaster').checked = OPZ.master; $('#optGrandi').checked = OPZ.grandi;
  const n = leggi('ta_rapporti', []).length, es = leggi('ta_report_esito', null);
  $('#repInfo').textContent = (n ? `${n} rapporti in coda. ` : 'Nessun rapporto in coda. ') + (es ? `Ultimo invio ${es.t}: ${es.stato >= 200 && es.stato < 300 ? 'OK' : 'errore ' + es.stato}` : '');
}
$('#btnCondividi').addEventListener('click', async () => { const url = linkInvito(); if (!url) return; if (navigator.share) { try { await navigator.share({ title: S.st.campagna.nome, text: `Unisciti alla nostra partita di D&D: ${S.st.campagna.nome}`, url }); } catch {} } else { await navigator.clipboard?.writeText(url); toast('Link copiato'); } });
$('#btnCopia').addEventListener('click', async () => { try { await navigator.clipboard.writeText(linkInvito()); toast('Link copiato'); } catch { toast(linkInvito()); } });
$('#btnNuovoInvito').addEventListener('click', () => invia({ t: 'nuovo_invito' }));
$('#btnSalvaCamp').addEventListener('click', () => {
  const ruoli = Object.fromEntries($$('[data-ruolo]').map(s => [s.dataset.ruolo, s.value]));
  invia({ t: 'impostazioni', nome: $('#aNome').value.trim(), ambientazione: $('#aAmb').value.trim(), regole: $('input[name="aRegole"]:checked')?.value, masterTipo: $('input[name="aMaster"]:checked')?.value, timerTurno: Number($('#aTimer').value) || 0, difficolta: $('#aDifficolta').value, giro: $('#aGiro').checked, differito: Number($('#aDifferito').value) || 0, stileImg: $('#aStile').value, ruoli });
  toast('Impostazioni salvate');
});
$('#btnNuovaSessione').addEventListener('click', async () => { const i = await chiedi('<h2>Nuova sessione</h2><p>Si apre una nuova sessione e si crea un nuovo codice invito: i vecchi QR smettono di funzionare. La campagna, le schede e le mappe restano.</p>', [{ testo: 'Inizia', pieno: true }, { testo: 'Annulla' }]); if (i === 0) { invia({ t: 'impostazioni', nuovaSessione: true }); if (masterAI()) setTimeout(() => invia({ t: 'riassunto' }), 800); } });
$('#btnRiepilogo').addEventListener('click', () => invia({ t: 'riepilogo' }));
// copia della campagna: si scarica in un file e si può ripristinare (solo chi l'ha creata)
$('#btnEsporta').addEventListener('click', () => invia({ t: 'esporta' }));
$('#fileImporta').addEventListener('change', async e => {
  const f = e.target.files?.[0]; e.target.value = ''; if (!f) return;
  try {
    const j = JSON.parse(await f.text()); if (j.app !== 'TavoloAvventura' || !j.dati) throw new Error('non è una copia di Tavolo d\'Avventura');
    const corpo = JSON.stringify({ t: 'importa', dati: j.dati }); if (corpo.length > 390000) throw new Error('la copia è troppo grande per essere ripristinata da qui');
    const i = await chiedi(`<h2>Ripristinare la campagna?</h2><p>Copia del ${new Date(j.salvata).toLocaleString('it-IT')}. Schede, mappe, diario e mondo tornano come erano allora: quello che è successo dopo si perde.</p>`, [{ testo: 'Ripristina', pieno: true }, { testo: 'Annulla' }]);
    if (i === 0) { invia({ t: 'importa', dati: j.dati }); toast('Campagna ripristinata'); Report.log('ripristino', { voci: Object.keys(j.dati).length }); }
  } catch (err) { toast('Ripristino non riuscito: ' + err.message, true, 6000); }
});
/* ---- negozio: compra e vendi con le monete della scheda ---- */
// la reputazione del gruppo nel luogo cambia i prezzi (come sul server: fino al 25%)
function fattorePrezzo() { const l = S.st?.luogo, nome = l?.genitore ? S.st.luoghi?.[l.genitore]?.nome : l?.nome, r = Math.max(-100, Math.min(100, S.st?.reputazioneLuoghi?.[nome] || 0)); return 1 - r / 400; }
function cartaNegozio(pg) {
  const n0 = S.st?.negozio; if (!n0) return '';
  const f = fattorePrezzo(), n = { ...n0, merci: n0.merci.map(x => ({ ...x, prezzo: Math.max(1, Math.round(x.prezzo * f)) })) };
  const vendibili = (pg.equip || []).map((e, i) => [e, i]).filter(([e]) => !e.indossato);
  const prezzoVendita = e => Math.floor((n0.merci.find(x => x.nome === e.nome)?.prezzo ?? (/pozione|pergamena/i.test(e.nome) ? 50 : /spada|ascia|martello|arco/i.test(e.nome) ? 10 : 2)) / 2 / f);
  return `<div class="carta"><h3 style="margin-top:0">Banco: ${esc(n.nome)} <span class="piccolo">· hai ${pg.oro || 0} mo</span></h3>${f !== 1 ? `<p class="piccolo">${f < 1 ? 'Qui vi stimano: prezzi più bassi' : 'Qui non vi vedono di buon occhio: prezzi più alti'} (${f < 1 ? '-' : '+'}${Math.round(Math.abs(1 - f) * 100)}%).</p>` : ''}
    <ul class="equip negozio">${n.merci.map(x => `<li>${Ritratto.icona(x.nome, 26)}<span class="n">${esc(x.nome)}</span><span class="prezzo">${x.prezzo} mo</span><button data-compra="${esc(x.nome)}" ${(pg.oro || 0) < x.prezzo ? 'disabled' : ''}>Compra</button></li>`).join('')}</ul>
    ${vendibili.length ? `<details><summary>Vendi i tuoi oggetti (metà prezzo)</summary><ul class="equip negozio">${vendibili.map(([e, i]) => `<li>${Ritratto.icona(e.nome, 26)}<span class="n">${esc(e.nome)}${e.qta > 1 ? ' ×' + e.qta : ''}</span><span class="prezzo">${prezzoVendita(e)} mo</span><button data-vendi="${i}">Vendi</button></li>`).join('')}</ul></details>` : ''}</div>`;
}
/* ---- inventario: trascina l'icona sul ritratto per indossare l'oggetto ---- */
document.addEventListener('pointerdown', e => {
  const ic = e.target.closest('[data-trascina]'); if (!ic) return;
  e.preventDefault();
  const i = Number(ic.dataset.trascina), fantasma = ic.cloneNode(true); fantasma.className = 'fantasma-ogg'; document.body.appendChild(fantasma);
  const sposta = ev => { fantasma.style.left = ev.clientX + 'px'; fantasma.style.top = ev.clientY + 'px'; const sopra = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('.ritratto'); document.querySelectorAll('.ritratto').forEach(r => r.classList.toggle('bersaglio', r === sopra)); };
  const fine = ev => {
    removeEventListener('pointermove', sposta); removeEventListener('pointerup', fine); fantasma.remove();
    document.querySelectorAll('.ritratto.bersaglio').forEach(r => r.classList.remove('bersaglio'));
    const pg = S.st?.pg?.[S.viewPg], it = pg?.equip?.[i];
    if (it && document.elementFromPoint(ev.clientX, ev.clientY)?.closest('.ritratto') && !it.indossato) { modifica([{ op: 'indossa', nome: it.nome }]); Report.log('trascina-equip', { oggetto: it.nome }); }
  };
  sposta(e); addEventListener('pointermove', sposta); addEventListener('pointerup', fine);
});
/* ---- schermo del master ---- */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-strumento]'); if (b) { $('#smRisultato').textContent = 'Un momento…'; invia({ t: 'strumento', tipo: b.dataset.strumento, difficolta: $('#smDiff').value, gs: Number($('#smGs').value) }); }
  const pz = e.target.closest('[data-piazza]'); if (pz && S.ultimoIncontro) { invia({ t: 'piazza_nemici', mostri: S.ultimoIncontro.mostri }); toast('Nemici sulla mappa'); }
  const tg = e.target.closest('[data-tesoro]'); if (tg && S.ultimoTesoro) { invia({ t: 'gruppo', op: 'oro', delta: S.ultimoTesoro.oro }); S.ultimoTesoro.oggetti.forEach(o => invia({ t: 'gruppo', op: 'oggetto', nome: o, qta: 1 })); toast('Tesoro messo nel tesoro comune'); }
});
function mostraStrumento(tipo, r) {
  const el = $('#smRisultato'); if (!r) { el.textContent = 'Non disponibile ora.'; return; }
  if (tipo === 'png') el.innerHTML = `<p><strong>${esc(r.nome)}</strong> · ${esc(r.razza || '')} · ${esc(r.mestiere || '')}</p><p>${esc(r.aspetto || '')}. ${esc(r.tratto || '')}.</p><p>Segreto: ${esc(r.segreto || '')}</p><p><em>${esc(r.battuta || '')}</em></p>`;
  if (tipo === 'incontro') { S.ultimoIncontro = r; el.innerHTML = `<p>Incontro ${esc(r.difficolta)} (budget ${r.budget} PX):</p><ul>${r.mostri.map(m => `<li>${m.numero} × ${esc(m.nome)} (GS ${esc(m.gs || '?')}, PF ${m.pf}, CA ${m.ca})</li>`).join('')}</ul>${r.tattica ? `<p>${esc(r.tattica)}</p>` : ''}<button type="button" data-piazza="1">Metti sulla mappa</button>`; }
  if (tipo === 'tesoro') { S.ultimoTesoro = r; el.innerHTML = `<p>${r.oro} monete d'oro</p><ul>${r.oggetti.map(o => `<li>${esc(o)}</li>`).join('')}</ul><button type="button" data-tesoro="1">Metti nel tesoro comune</button>`; }
}
$('#smSalvaNote').addEventListener('click', () => { invia({ t: 'note_master', testo: $('#smNote').value }); toast('Note salvate'); });
$('#smApriNeg').addEventListener('click', () => { invia({ t: 'apri_negozio', nome: $('#smNegozio').value || ({ emporio: 'Emporio', fabbro: 'Fabbro', alchimista: 'Alchimista', magia: 'Bottega arcana' })[$('#smTipoNeg').value], tipo: $('#smTipoNeg').value }); });
$('#smChiudiNeg').addEventListener('click', () => invia({ t: 'chiudi_negozio' }));
/* ---- libro della campagna: pagina da stampare o salvare in PDF ---- */
$('#btnStatistiche').addEventListener('click', () => invia({ t: 'statistiche' }));
/* ---- avventura pronta nello schermo del master ---- */
function renderAvventura() {
  const box = $('#smAvventura'); if (!box || !capo()) return;
  const a = S.st?.avventura;
  const scelta = `<div class="riga"><select id="smAvvId" aria-label="Avventura pronta">${(S.st.avventure || [{ id: 'miniera', titolo: 'La miniera dei goblin', livelli: '1-3' }]).filter(x => x.id !== a?.id).map(x => `<option value="${esc(x.id)}" ${x.seguito && x.seguito === a?.id ? 'selected' : ''}>${esc(x.titolo)} (livelli ${esc(x.livelli || '?')}${x.tipo === 'one-shot' ? ', una serata' : x.tipo === 'seguito' ? ', seguito' : ''})</option>`).join('')}</select><button type="button" data-avv-nuova="1">${a ? 'Inizia un\'altra avventura' : 'Inizia l\'avventura pronta'}</button></div>`;
  if (!a) { box.innerHTML = scelta; return; }
  box.innerHTML = `<details ${a.iniziata ? '' : 'open'}><summary><span><strong>Avventura: ${esc(a.titolo)}</strong>${a.iniziata ? ` · scena ${a.scena + 1} di ${a.scene.length}` : ''}</span></summary>
    <p class="piccolo">${esc(a.sinossi)}</p>
    ${a.iniziata ? '' : '<button type="button" data-avv-inizia="1">Inizia adesso</button>'}
    <ol>${a.scene.map((sc, i) => `<li ${i === a.scena && a.iniziata ? 'style="color:#e8c86a"' : ''}><strong>${esc(sc.luogo)}</strong>: ${esc(sc.obiettivo)}<br><span class="piccolo">PNG: ${esc(sc.png)}. Indizi: ${esc(sc.indizi)}${sc.incontro ? `. Nemici: ${esc(sc.incontro.map(n => n.numero + ' ' + n.nome).join(', '))}` : ''}${sc.tesoro ? `. Tesoro: ${esc(sc.tesoro)}` : ''}</span>
      <div class="riga"><button type="button" data-avv-scena="${esc(sc.id)}">Vai a questa scena</button><button type="button" data-avv-leggi="${esc(sc.id)}">Leggi ad alta voce</button></div></li>`).join('')}</ol>
    <p><strong>Segreti</strong></p><ul class="piccolo">${a.segreti.map(x => `<li>${esc(x)}</li>`).join('')}</ul><p class="piccolo"><strong>Ricompensa:</strong> ${esc(a.ricompensa)}</p></details>${a.iniziata ? `<details><summary>Avventura finita? Scegli la prossima</summary>${scelta}</details>` : ''}`;
}
document.addEventListener('click', e => {
  if (e.target.closest('[data-avv-nuova]')) { invia({ t: 'avventura_inizia', id: $('#smAvvId').value }); toast('L\'avventura comincia…'); Report.log('avventura', { id: $('#smAvvId').value }); }
  if (e.target.closest('[data-avv-inizia]')) { invia({ t: 'avventura_inizia', id: $('#smAvvId')?.value || S.st?.avventura?.id || 'miniera' }); toast('L\'avventura comincia…'); }
  const sc = e.target.closest('[data-avv-scena]'); if (sc) invia({ t: 'avventura_scena', scena: sc.dataset.avvScena });
  const lg = e.target.closest('[data-avv-leggi]'); if (lg) invia({ t: 'avventura_leggi', scena: lg.dataset.avvLeggi });
});
function mostraStatistiche(m) {
  const VOCI = [['tiri', 'Dadi tirati'], ['critici', 'Critici'], ['fallimenti', 'Fallimenti critici'], ['danniSubiti', 'Danni subiti'], ['cadute', 'Volte a terra'], ['cure', 'PF recuperati'], ['speso', 'Monete spese']];
  const tabella = (dati) => { const ids = Object.keys(dati || {}).filter(id => id !== 'gruppo'); if (!ids.length) return '<p class="piccolo">Ancora niente da contare.</p>'; return `<div style="overflow-x:auto"><table class="stat-tab"><tr><th></th>${ids.map(id => `<th>${esc(m.nomi[id] || id)}</th>`).join('')}</tr>${VOCI.map(([k, n]) => `<tr><td>${n}</td>${ids.map(id => `<td>${dati[id][k] || 0}</td>`).join('')}</tr>`).join('')}</table></div>${dati.gruppo ? `<p class="piccolo">Il gruppo: ${dati.gruppo.nemici === 1 ? '1 nemico sconfitto' : `${dati.gruppo.nemici || 0} nemici sconfitti`}, ${dati.gruppo.combattimenti === 1 ? '1 combattimento' : `${dati.gruppo.combattimenti || 0} combattimenti`}.</p>` : ''}`; };
  chiedi(`<h2>Statistiche</h2>${(m.premi || []).length ? `<h3>Premi della campagna</h3><ul>${m.premi.map(x => `<li>🎖️ <strong>${esc(x.titolo)}</strong>: ${esc(x.chi)} <span class="piccolo">(${esc(x.motivo)})</span></li>`).join('')}</ul>` : ''}${m.trofei.length ? `<h3>Trofei della serata</h3><ul>${m.trofei.map(x => `<li>🏆 <strong>${esc(x.titolo)}</strong>: ${esc(x.chi)} <span class="piccolo">(${esc(x.motivo)})</span></li>`).join('')}</ul>` : ''}<h3>Questa sessione (${m.sessione || 1})</h3>${tabella(m.s)}<h3>Tutta la campagna</h3>${tabella(m.tot)}`, [{ testo: 'Chiudi' }]);
}
$('#btnLibro').addEventListener('click', () => { invia({ t: 'libro' }); toast('Preparo il libro…'); });
function apriLibro(m) {
  const w = window.open('', '_blank'); if (!w) { toast('Consenti le finestre a comparsa per aprire il libro', true); return; }
  const img = id => `<img src="${urlMedia('img', id)}" alt="">`;
  const capitoli = m.riepiloghi.length ? m.riepiloghi.map(r => `<section class="cap"><h2>${esc(r.titolo)}</h2>${r.img ? img(r.img) : ''}<p>${esc(r.racconto).replace(/\n/g, '</p><p>')}</p>${r.stats?.nemici?.length ? `<p class="nota">Nemici sconfitti: ${esc(r.stats.nemici.join(', '))}</p>` : ''}</section>`).join('') : '';
  const cronaca = m.diario.map(d => d.tipo === 'illustrazione' ? `<figure>${img(d.img)}<figcaption>${esc(d.testo)}</figcaption></figure>` : d.tipo === 'sistema' ? `<h3>${esc(d.testo)}</h3>` : d.tipo === 'luogo' ? `<p class="luogo">${esc(d.testo)}</p>` : d.tipo === 'narrazione' ? `<p>${esc(d.testo)}</p>` : d.tipo === 'combattimento' ? `<p class="nota">${esc(d.testo)}</p>` : '').join('');
  const copertina = m.diario.find(d => d.tipo === 'illustrazione')?.img || m.riepiloghi.find(r => r.img)?.img;
  w.document.write(`<!doctype html><html lang="it"><head><meta charset="utf-8"><title>${esc(m.campagna.nome)}</title><style>
    body{font-family:Georgia,'Times New Roman',serif;color:#2a1e12;background:#f4ead6;margin:0;padding:24px;line-height:1.55;font-size:12pt}
    h1{font-size:30pt;text-align:center;margin:30px 0 4px} .sotto{text-align:center;color:#6a5434} h2{font-size:18pt;border-bottom:2px solid #8a6a3a;margin-top:28px} h3{color:#7a4a1a}
    img{width:100%;max-width:640px;display:block;margin:12px auto;border-radius:8px} figure{margin:16px 0;page-break-inside:avoid} figcaption{text-align:center;font-style:italic;color:#6a5434}
    .luogo{font-variant:small-caps;color:#7a4a1a} .nota{font-size:10.5pt;color:#6a5434} .pg{display:flex;gap:14px;align-items:center;page-break-inside:avoid} .pg svg{width:80px;height:auto} .cap{page-break-before:always}
    @media print{body{background:#fff;padding:0} .stampa{display:none}}</style></head><body>
    <p class="stampa" style="text-align:center"><button onclick="print()" style="font-size:16px;padding:10px 18px">Stampa o salva in PDF</button></p>
    <h1>${esc(m.campagna.nome)}</h1><p class="sotto">${esc(m.campagna.ambientazione || '')} · D&amp;D ${esc(m.campagna.regole)} · ${m.campagna.sessione || 1} sessioni</p>${copertina ? img(copertina) : ''}
    <h2>I protagonisti</h2>${m.pg.map(p => `<div class="pg">${Ritratto.svg(p, { dim: 80 })}<div><strong>${esc(p.nome)}</strong><br>${esc(p.razza)} ${esc(p.classe)}, livello ${p.livello}${p.storia ? `<br><span class="nota">${esc(p.storia)}</span>` : ''}</div></div>`).join('')}
    ${capitoli}${m.pg.some(p => (p.diario || []).length) ? `<section class="cap"><h2>Dai diari dei protagonisti</h2>${m.pg.filter(p => (p.diario || []).length).map(p => `<h3>${esc(p.nome)}</h3>${p.diario.map(d => `<p><em>Sessione ${d.sessione || '?'}</em> — ${esc(d.testo)}</p>`).join('')}`).join('')}</section>` : ''}${(S.st.memoriale || []).length ? `<section class="cap"><h2>Memoriale</h2>${S.st.memoriale.map(c => `<p><strong>${esc(c.nome)}</strong>, ${esc(c.razza || '')} ${esc(c.classe || '')} di livello ${c.livello}. ${esc(c.motivo || '')}</p>`).join('')}</section>` : ''}<section class="cap"><h2>Cronaca completa</h2>${cronaca || '<p>Nessuna narrazione ancora.</p>'}</section></body></html>`);
  w.document.close(); Report.log('libro', { capitoli: m.riepiloghi.length, voci: m.diario.length });
}
/* ---- sessione zero: il master aiuta a creare il personaggio ---- */
function cartaSessioneZero() {
  const z = S.sz;
  if (!z) return `<div class="carta-mini"><strong>Non sai da dove cominciare?</strong><p class="piccolo">Il master ti fa qualche domanda e ti propone un personaggio legato agli altri del gruppo.</p><button type="button" id="szInizia">Crea il personaggio con il master</button></div>`;
  return `<div class="carta-mini"><strong>Sessione zero con il master</strong><div class="sz-log">${z.storia.map(x => `<p class="${x.chi === 'io' ? 'io' : ''}">${esc(x.testo)}</p>`).join('')}${z.attesa ? '<p class="piccolo">Il master pensa…</p>' : ''}</div>
    ${z.proposta ? `<p><strong>${esc(z.proposta.nome)}</strong> · ${esc(z.proposta.razza)} ${esc(z.proposta.classe)}</p><p class="piccolo">${esc(z.proposta.storia || '')}</p>${z.proposta.legami ? `<p class="piccolo">Legami: ${esc(z.proposta.legami)}</p>` : ''}<button type="button" class="pieno" id="szUsa">${z.usata ? 'Applicata ✓' : 'Usa questa proposta'}</button>`
      : `<div class="riga"><input id="szTesto" maxlength="400" placeholder="Rispondi al master"><button type="button" id="szParla" aria-label="Rispondi a voce">🎙</button><button type="button" class="pieno" id="szInvia">Invia</button></div>`}</div>`;
}
function szInvia(testoR) {
  S.sz = S.sz || { storia: [] };
  if (testoR) S.sz.storia.push({ chi: 'io', testo: testoR });
  S.sz.attesa = true; renderScheda();
  const set = Regole.set(regole());
  invia({ t: 'sessione_zero', storia: S.sz.storia, razze: Object.keys(set.razze), classi: Object.keys(set.classi) });
}
function szRisposta(m) {
  if (!S.sz) return; S.sz.attesa = false;
  if (m.errore) toast(m.errore, true);
  if (m.domanda) { S.sz.storia.push({ chi: 'master', testo: m.domanda }); if (OPZ.narratore) Narratore.parla(m.domanda); }
  if (m.proposta) { S.sz.proposta = m.proposta; Report.log('sessione-zero', { razza: m.proposta.razza, classe: m.proposta.classe, domande: S.sz.storia.length }); }
  renderScheda();
}
// riepilogo della serata: racconto, immagine e numeri, da condividere nel gruppo
async function mostraRiepilogo(r) {
  const s = r.stats || {}, img = r.img ? urlMedia('img', r.img) : null;
  const righe = [...(s.trofei || []).map(x => `🏆 ${x.titolo}: ${x.chi} (${x.motivo})`), s.nemici?.length ? `Nemici sconfitti: ${s.nemici.join(', ')}` : '', s.combattimenti ? `Combattimenti: ${s.combattimenti}` : '', s.luoghi?.length ? `Luoghi: ${s.luoghi.join(', ')}` : '', ...Object.entries(s.px || {}).map(([n, v]) => `${n}: +${v} PX`), ...(s.livelli || []), ...(s.bottino || []).slice(-6)].filter(Boolean);
  const testoCondiviso = `${r.titolo}\n\n${r.racconto}\n\n${righe.join('\n')}`;
  const i = await chiedi(`<h2>${esc(r.titolo)}</h2>${img ? `<img src="${img}" alt="" style="width:100%;border-radius:10px;margin:4px 0 8px">` : ''}<p style="white-space:pre-wrap">${esc(r.racconto)}</p>${righe.length ? `<ul class="piccolo">${righe.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}`, [{ testo: 'Condividi', pieno: true }, { testo: 'Cartolina' }, { testo: 'Chiudi' }]);
  if (i === 1) return cartolina(r);
  if (i !== 0) return;
  try {
    const files = img ? [new File([await fetch(img).then(x => x.blob())], 'serata.jpg', { type: 'image/jpeg' })] : [];
    if (navigator.canShare?.({ files, text: testoCondiviso })) await navigator.share({ title: r.titolo, text: testoCondiviso, files });
    else if (navigator.share) await navigator.share({ title: r.titolo, text: testoCondiviso });
    else { await navigator.clipboard.writeText(testoCondiviso); toast('Riepilogo copiato: incollalo nel gruppo'); }
  } catch {}
}
$('#btnRiassunto').addEventListener('click', () => { invia({ t: 'riassunto' }); toast('Il master prepara il riassunto…'); });
$('#optNarratore').addEventListener('change', e => { OPZ.narratore = e.target.checked; Narratore.attivo = OPZ.narratore; scrivi('ta_opzioni', OPZ); });
$('#optAvvisi').addEventListener('change', e => { OPZ.avvisi = e.target.checked; scrivi('ta_opzioni', OPZ); });
$('#optMaster').addEventListener('change', e => { OPZ.master = e.target.checked; scrivi('ta_opzioni', OPZ); });
$('#optSuoni').addEventListener('change', e => { OPZ.suoni = e.target.checked; scrivi('ta_opzioni', OPZ); Suoni.attivo = OPZ.suoni; if (OPZ.suoni) aggiornaScenaSonora(); Report.log('suoni', { attivi: OPZ.suoni }); });
$('#optLingua').value = OPZ.lingua || '';
$('#optLingua').addEventListener('change', e => { OPZ.lingua = e.target.value; scrivi('ta_opzioni', OPZ); S.trad.clear(); renderDiario(); (S.st?.diario || []).filter(d => d.tipo === 'narrazione' || (d.tipo === 'chat' && d.chi !== S.io)).slice(-6).forEach(d => traduciTesto(d.testo)); Report.log('lingua', { lingua: OPZ.lingua }); });
$('#optSottotitoli').checked = OPZ.sottotitoli !== false;
$('#optSottotitoli').addEventListener('change', e => { OPZ.sottotitoli = e.target.checked; scrivi('ta_opzioni', OPZ); });
$('#optDadi3d').checked = OPZ.dadi3d !== false;
$('#optDadi3d').addEventListener('change', e => { OPZ.dadi3d = e.target.checked; scrivi('ta_opzioni', OPZ); });
$('#optVolume').addEventListener('input', e => { OPZ.volume = Number(e.target.value); Suoni.volume = OPZ.volume; scrivi('ta_opzioni', OPZ); });
$('#optGrandi').addEventListener('change', e => { OPZ.grandi = e.target.checked; scrivi('ta_opzioni', OPZ); applicaGrandi(); });
$('#optNome').addEventListener('change', e => { const v = e.target.value.trim(); if (v) { invia({ t: 'impostazioni', mioNome: v }); scrivi('ta_nome', v); } });
function applicaGrandi() { document.documentElement.style.setProperty('--scala', OPZ.grandi ? 1.2 : 1); setTimeout(() => Mappa.adatta(), 50); }
$('#formSugg').addEventListener('submit', e => { e.preventDefault(); const t = $('#suggTesto').value.trim(); if (!t) return; invia({ t: 'suggerimento', testo: t }); Report.log('suggerimento', { testo: t }); $('#suggTesto').value = ''; });
$('#btnRapporto').addEventListener('click', () => Report.salvaFile());
$('#btnEsci').addEventListener('click', () => { scrivi('ta_attiva', null); history.replaceState(null, '', location.pathname); const ws = S.ws; S.io = null; S.ws = null; try { ws?.close(); } catch {} Object.keys(Voce.stato()).forEach(id => Voce.chiudi(id)); Ascolto.ferma(); Narratore.zitto(); mostraIngresso(); });

// Prova prima della partita: browser, microfono, cuffie, connessione, voce
$('#btnProva').addEventListener('click', async () => {
  const ul = $('#esitoProva'); ul.innerHTML = '';
  const riga = (ok, t) => { ul.insertAdjacentHTML('beforeend', `<li>${ok === true ? '✅' : ok === false ? '❌' : '⚠️'} ${esc(t)}</li>`); };
  const chrome = /Chrome|CriOS|Edg\//.test(navigator.userAgent);
  riga(chrome ? true : null, chrome ? 'Browser compatibile' : 'Per i comandi vocali è consigliato Chrome');
  riga(Ascolto.supportato(), Ascolto.supportato() ? 'Riconoscimento vocale disponibile' : 'Riconoscimento vocale non disponibile su questo browser');
  riga(!!window.RTCPeerConnection, window.RTCPeerConnection ? 'Chat vocale supportata' : 'Chat vocale non supportata');
  try {
    Voce.riattivaAudio();
    const propria = !Voce.stream;
    const s = Voce.stream || await navigator.mediaDevices.getUserMedia({ audio: true });
    riga(true, 'Microfono autorizzato. Parla per 4 secondi…');
    Voce.livelloProva = 0; Voce.analizza('__prova', s);
    await new Promise(r => setTimeout(r, 4000));
    if (propria) s.getTracks().forEach(t => t.stop());
    riga(Voce.livelloProva > 0.02 ? true : false, Voce.livelloProva > 0.02 ? 'Ti sento bene' : 'Non ti sento: controlla il microfono');
    const dev = await navigator.mediaDevices.enumerateDevices();
    const cuffie = dev.some(d => /cuffie|headphone|headset|buds|airpods|bluetooth|auricolar/i.test(d.label));
    riga(cuffie ? true : null, cuffie ? 'Cuffie o auricolari rilevati' : 'Non vedo cuffie: usale, così il microfono non ripete la voce degli altri');
  } catch (e) { riga(false, 'Microfono non autorizzato: ' + e.name); }
  const tipo = navigator.connection?.effectiveType;
  riga(navigator.onLine, navigator.onLine ? `Connessione attiva${tipo ? ' (' + tipo + ')' : ''}${S.latenza ? ', ritardo ' + S.latenza + ' ms' : ''}` : 'Sei offline');
  const st = Voce.stato(), n = Object.keys(st).length, ok = Object.values(st).filter(x => x === 'connected').length;
  riga(n ? ok === n : null, n ? `Voce collegata con ${ok} su ${n} giocatori` : 'Nessun altro giocatore collegato in voce per ora');
  Report.log('prova', { righe: [...ul.children].map(li => li.textContent) });
});

function renderCosti() {
  const c = S.st?.costi;
  $('#cartaCosti').hidden = !capo();
  if (!capo()) return;
  if (!c) { $('#costi').textContent = 'Nessuna chiamata all\'AI finora.'; return; }
  const n = x => x.toLocaleString('it-IT');
  $('#costi').innerHTML = `<p><strong>Sessione ${c.sessione.n}</strong>: ${n(c.sessione.chiamate)} ${c.sessione.chiamate === 1 ? 'chiamata' : 'chiamate'}, ${n(c.sessione.in)} token letti, ${n(c.sessione.out)} token scritti.</p>
    <p><strong>Totale campagna</strong>: ${n(c.totale.chiamate)} ${c.totale.chiamate === 1 ? 'chiamata' : 'chiamate'}, ${n(c.totale.in + c.totale.out)} token.</p>
    <p>Modelli: ${Object.entries(c.modelli).map(([k, v]) => `${esc(k)} ×${v}`).join(', ')}. Compiti: ${Object.entries(c.compiti).map(([k, v]) => `${esc(k)} ×${v}`).join(', ')}.</p>
    <p>Costo: 0 € finché si resta nel piano gratuito di Gemini.</p>`;
}
// Tiri rapidi: ultimi tiri tuoi e preferiti
const chiavePref = () => 'ta_pref_' + S.codice;
function renderRapidi() {
  const pref = leggi(chiavePref(), []);
  const visti = new Set(); const ultimi = [];
  for (const t of [...(S.st?.dadi || [])].reverse()) { if (t.chi !== S.io) continue; const k = t.formula + '|' + (t.motivo || ''); if (visti.has(k) || pref.some(p => p.formula + '|' + p.motivo === k)) continue; visti.add(k); ultimi.push({ formula: t.formula, motivo: t.motivo || '', modo: t.modo }); if (ultimi.length >= 6) break; }
  $('#rapidi').innerHTML = [...pref.map((p, i) => `<span class="riga" style="gap:2px"><button class="chip on" data-rap="p${i}">★ ${esc(p.motivo || p.formula)} ${esc(p.motivo ? p.formula : '')}</button><button class="chip" data-togli="${i}" aria-label="Togli dai preferiti">×</button></span>`), ...ultimi.map((u, i) => `<button class="chip" data-rap="u${i}">${esc(u.motivo || u.formula)} ${esc(u.motivo ? u.formula : '')}</button>`)].join('') || '<span class="piccolo">I tuoi tiri compariranno qui.</span>';
  renderRapidi.ultimi = ultimi;
}
$('#rapidi').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const pref = leggi(chiavePref(), []);
  if (b.dataset.togli !== undefined) { pref.splice(Number(b.dataset.togli), 1); scrivi(chiavePref(), pref); renderRapidi(); return; }
  const k = b.dataset.rap; const t = k[0] === 'p' ? pref[Number(k.slice(1))] : renderRapidi.ultimi[Number(k.slice(1))];
  if (t) tira(t.formula, t.motivo, t.modo);
});
$('#btnPreferito').addEventListener('click', () => {
  const t = S.ultimoMio; if (!t) return;
  const pref = leggi(chiavePref(), []);
  if (!pref.some(p => p.formula === t.formula && p.motivo === (t.motivo || ''))) { pref.push({ formula: t.formula, motivo: t.motivo || '', modo: t.modo || null }); scrivi(chiavePref(), pref.slice(-12)); }
  renderRapidi(); toast('Salvato nei preferiti');
});
// Bot di prova (solo amministratore)
$('#btnBot').addEventListener('click', async () => {
  if (BotProva.attivo) return;
  const ul = $('#botLog'); ul.innerHTML = ''; $('#btnBot').disabled = true; $('#btnBot').textContent = 'La partita bot è in corso…';
  // ogni volta una campagna nuova: 4 personaggi bot e il master AI provano tutte le funzioni, poi parte il rapporto
  const r = await BotProva.avvia({
    server: SERVER_WS,
    log: (t, d) => Report.log(t, d),
    onPasso: t => ul.insertAdjacentHTML('beforeend', `<li>▶ ${esc(t)}</li>`),
    onErr: m => ul.insertAdjacentHTML('beforeend', `<li>❌ ${esc(m)}</li>`)
  });
  if (r) ul.insertAdjacentHTML('beforeend', `<li>✅ Finito in ${r.durataS} s: ${r.ok} prove riuscite, ${r.falliti.length} non riuscite${r.falliti.length ? ' (' + esc(r.falliti.join(', ')) + ')' : ''}.</li>`);
  $('#btnBot').disabled = false; $('#btnBot').textContent = 'Avvia partita bot';
  await Report.chiudi('partita bot'); toast('Rapporto della partita bot inviato');
});
$('#btnLascia').addEventListener('click', async () => {
  const i = await chiedi('<h2>Lasciare la campagna?</h2><p>Il tuo personaggio e il tuo posto nella campagna vengono cancellati per sempre. Per tornare servirà un nuovo invito.</p>', [{ testo: 'Lascia', pieno: true }, { testo: 'Annulla' }]);
  if (i !== 0) return;
  invia({ t: 'esci' }); dimenticaCampagna(S.codice); setTimeout(() => $('#btnEsci').click(), 300);
});
$('#ruoliBox').addEventListener('click', async e => {
  const b = e.target.closest('[data-rimuovi]'); if (!b) return;
  const nome = S.st.membri[b.dataset.rimuovi]?.nome;
  const i = await chiedi(`<h2>Togliere ${esc(nome)}?</h2><p>Il suo personaggio viene cancellato. Potrà rientrare solo con un nuovo invito.</p>`, [{ testo: 'Togli', pieno: true }, { testo: 'Annulla' }]);
  if (i === 0) invia({ t: 'rimuovi', membro: b.dataset.rimuovi });
});

/* ============ AGGIORNAMENTI ============ */
let swReg = null;
const confrontaVersioni = (a, b) => { const pa = String(a).split('.').map(Number), pb = String(b).split('.').map(Number); for (let i = 0; i < 3; i++) { if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0); } return 0; };
async function installaAggiornamento() {
  Report.log('aggiornamento', { da: VERSION }); await Report.chiudi('aggiornamento');
  try { const r = await navigator.serviceWorker?.getRegistration(); await r?.update(); if (r?.waiting) r.waiting.postMessage('skipWaiting'); } catch {}
  location.href = location.pathname + '?v=' + Date.now();
}
async function cercaAggiornamenti(manuale) {
  try {
    const j = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' }).then(r => r.json());
    if (typeof j.rapporti === 'string' && j.rapporti !== REPORT_URL) { REPORT_URL = j.rapporti; try { localStorage.setItem('ta_report_url', REPORT_URL); } catch {} Report.invia(); }
    if (confrontaVersioni(j.versione, VERSION) > 0) {
      $('#updatebar').hidden = false; $('#updatenotes').textContent = `Versione ${j.versione}: ${(j.novita || []).join(' · ')}`; $('#btnUpdate').onclick = installaAggiornamento;
      if (manuale) $('#btnCheck').textContent = 'Nuova versione trovata';
    } else if (manuale) $('#btnCheck').textContent = 'Sei all\'ultima versione';
  } catch { if (manuale) $('#btnCheck').textContent = 'Nessuna connessione'; }
  if (manuale) setTimeout(() => $('#btnCheck').textContent = 'Cerca aggiornamenti', 3000);
}
$('#btnCheck').addEventListener('click', () => { $('#btnCheck').textContent = 'Controllo…'; swReg?.update().catch(() => {}); cercaAggiornamenti(true); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') cercaAggiornamenti(false); });
setInterval(() => cercaAggiornamenti(false), 30 * 60 * 1000);
if ('serviceWorker' in navigator && location.protocol !== 'file:' && location.hostname !== 'localhost') {
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(reg => { swReg = reg; reg.update().catch(() => {}); }).catch(() => {});
  const aveva = !!navigator.serviceWorker.controller; let ricaricato = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (aveva && !ricaricato && performance.now() > 15000) { ricaricato = true; location.reload(); } }); // appena aperta la pagina è già nuova (prima la rete): ricaricarla farebbe vedere tutto due volte
}
