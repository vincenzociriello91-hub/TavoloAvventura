// Tavolo d'Avventura — Dadi, diario e voce. Si carica dopo app.js, nell'ordine scritto in index.html.
/* ============ DADI ============ */
$('#dadiTasti').innerHTML = [4, 6, 8, 10, 12, 20, 100].map(f => `<button type="button" data-f="${f}" class="${f === 20 ? 'd20 scelto' : ''}" aria-pressed="${f === 20}">d${f}</button>`).join('');
$('#dadiTasti').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  // l'ultimo dado lanciato resta evidenziato (non sempre il d20)
  $$('#dadiTasti button').forEach(x => { x.classList.toggle('scelto', x === b); x.setAttribute('aria-pressed', x === b); });
  const q = Math.max(1, Math.min(20, Number($('#dQuanti').value) || 1)), m = Number($('#dMod').value) || 0;
  tira(`${q > 1 ? q : ''}d${b.dataset.f}${fm(m)}`, $('#dMotivo').value.trim(), $('input[name="dModo"]:checked').value || null, $('#dSegreto').checked);
});
function tira(formula, motivo, modo, segreto) {
  if (me()?.ruolo === 'spettatore') { toast('Gli spettatori non tirano i dadi'); return; }
  if (invia({ t: 'dado', formula, motivo: motivo || '', modo, segreto: !!segreto })) Report.log('dado', { formula, motivo, modo });
}
function tiraProva(prova) {
  const pg = mioPg(); if (!pg) { tira('d20', prova); return; }
  const set = Regole.set(pg.regole);
  const ab = Object.keys(set.abilita).find(a => pulisci(a) === pulisci(prova));
  if (ab) return tira('d20' + fm(Regole.abilita(pg, ab)), ab);
  const r = Comandi.interpreta('tiro ' + prova, pg, pg.regole);
  if (r?.dado) return tira(r.dado.formula, r.dado.motivo || prova, r.dado.modo);
  tira('d20', prova);
}
function mostraTiro(t) {
  const el = $('#ultimoTiro');
  el.innerHTML = `<div class="tot gira ${t.critico ? 'crit' : t.fallimento ? 'fail' : ''}">${t.totale}</div><div>${esc(t.nome)} · ${esc(t.formula)}${t.motivo ? ' · ' + esc(t.motivo) : ''}</div><div class="piccolo">dadi: ${t.dadi.join(', ')}${t.scartati?.length ? ` (scartato ${t.scartati.join(', ')}, ${t.modo})` : ''}${t.mod ? ' · modificatore ' + fm(t.mod) : ''}${t.segreto ? ' · segreto' : ''}${t.critico ? ' · CRITICO!' : t.fallimento ? ' · fallimento critico' : ''}</div>`;
  if (t.chi === S.io && S.vista !== 'vDadi' && !largo()) toast(`${t.motivo || t.formula}: ${t.totale}${t.critico ? ' — CRITICO!' : t.fallimento ? ' — fallimento critico' : ''}`);
}
function renderTiri() {
  const l = [...(S.st?.dadi || [])].reverse().slice(0, 30);
  $('#listaTiri').innerHTML = l.map(t => `<li><b>${t.totale}</b> — ${esc(t.nome)}: ${esc(t.formula)}${t.motivo ? ' · ' + esc(t.motivo) : ''}${t.modo ? ' · ' + t.modo : ''}${t.segreto ? ' · segreto' : ''}${t.critico ? ' · CRITICO' : t.fallimento ? ' · fallimento' : ''}</li>`).join('') || '<li class="piccolo">Nessun tiro ancora.</li>';
}

/* ============ DIARIO ============ */
function renderDiario() {
  const l = [...(S.st?.diario || [])].reverse().slice(0, 150);
  const ora = t => new Date(t).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  $('#diario').innerHTML = l.map(d => {
    if (d.tipo === 'narrazione') return `<li class="narrazione-ev"><span class="chi">${ora(d.t)} · ${esc(d.png || (d.chi === 'master' ? 'Master AI' : S.st.membri[d.chi]?.nome || 'Master'))}</span><p>${esc(d.testo)}</p>${tradotto(d.testo)}</li>`;
    if (d.tipo === 'riepilogo') return `<li class="illustrazione-ev"><span class="chi">${ora(d.t)} · Riepilogo della serata</span><p><button type="button" data-riepilogo="${d.riepilogo}">${esc(d.testo)}</button></p></li>`;
    if (d.tipo === 'illustrazione' && d.img) return `<li class="illustrazione-ev"><span class="chi">${ora(d.t)} · Illustrazione</span><img src="${urlMedia('img', d.img)}" alt="${esc(d.testo)}" loading="lazy" data-img="${esc(d.img)}" onerror="this.remove()"><p>${esc(d.testo)}</p></li>`;
    const cls = { scheda: 'scheda-ev', comando: 'comando' }[d.tipo] || d.tipo;
    const chi = d.tipo === 'chat' ? `<strong>${esc(S.st.membri[d.chi]?.nome || '?')}:</strong> ` : '';
    return `<li class="${esc(cls)}"><span class="chi">${ora(d.t)}</span> ${chi}${esc(d.testo)}${d.tipo === 'chat' ? tradotto(d.testo) : ''}</li>`;
  }).join('') || '<li class="piccolo">Il diario della campagna è vuoto: iniziate a giocare!</li>';
}
$('#formChat').addEventListener('submit', e => {
  e.preventDefault(); const t = $('#chatTesto').value.trim(); if (!t) return;
  const r = mioPg() ? Comandi.interpreta(t, mioPg(), regole(), S.st.mondo) : null;
  if (r) eseguiComando(r, t, 'scritto');
  else { invia({ t: 'chat', testo: t, alMaster: masterAI() && $('#alMaster').checked }); if (masterAI() && $('#alMaster').checked) S.ultimoParlato = Date.now(); }
  $('#chatTesto').value = '';
});
$('#formNarra').addEventListener('submit', e => { e.preventDefault(); const t = $('#narraTesto').value.trim(); if (!t) return; invia({ t: 'narra', testo: t, png: $('#narraPng').value.trim() }); $('#narraTesto').value = ''; });
$('#formRegola').addEventListener('submit', e => { e.preventDefault(); const t = $('#regolaTesto').value.trim(); if (!t) return; invia({ t: 'regola', testo: t }); $('#rispostaRegola').hidden = false; $('#rispostaRegola').textContent = 'Cerco nel regolamento…'; $('#regolaTesto').value = ''; Report.log('regola', { testo: t }); });

/* ============ VOCE ============ */
async function avviaVoce() {
  $('#btnParla').hidden = me()?.ruolo === 'spettatore' || document.body.classList.contains('tv') || !Ascolto.supportato();
  if (document.body.classList.contains('tv') || me()?.ruolo === 'spettatore') return; // TV e amici spettatori: niente microfono, la voce dei giocatori resta tra loro
  try { const j = await fetch(SERVER_WS.replace(/^ws/, 'http') + '/turn').then(r => r.json()); Voce.impostaIce(j.iceServers); Report.log('voce-inoltro', { attivo: !!j.turn }); } catch {}
  Voce.avvia({
    io: S.io, invia, log: (t, d) => Report.log(t, d),
    onParlante: (id, p) => { const el = id === S.io ? $(`#av-${S.io}`) : $(`#av-${id}`); el?.classList.toggle('parla', p); },
    onStato: msg => { if (msg) toast(msg, true, 6000); }
  }).then(ok => { if (ok) Voce.collegaTutti(S.st.online || []); aggiornaBottoniVoce(); });
  if (me()?.ruolo !== 'spettatore' && leggi('ta_ascolto', false)) attivaAscolto();
  $('#btnParla').hidden = me()?.ruolo === 'spettatore' || !Ascolto.supportato();
}
function attivaAscolto() {
  const ok = Ascolto.avvia({
    log: (t, d) => Report.log(t, d),
    onFrase: frase => sentitaFrase(frase),
    onParziale: p => { const el = $('#parziale'); el.hidden = !p; el.textContent = '🎙 ' + p; },
    onStato: msg => { if (msg) toast(msg, true, 6000); aggiornaBottoniVoce(); }
  });
  aggiornaBottoniVoce();
  return ok;
}
function sentitaFrase(frase) {
  if (!S.st || me()?.ruolo === 'spettatore') return;
  const r = Comandi.interpreta(frase, mioPg(), regole(), S.st.mondo);
  if (r) return eseguiComando(r, frase, 'voce');
  if (mioPg() && /\b(punt[oi]|livell|danni|monete|equipagg|indoss|inventario|zaino|caratteristic|punti ferita|ferit|esperienza)\b/i.test(frase)) {
    const id = Math.random().toString(36).slice(2, 8); S.pendenti[id] = frase;
    invia({ t: 'interpreta', id, testo: frase, regole: regole() }); return;
  }
  if (masterAI() && OPZ.master) inviaParlato(frase);
}
function inviaParlato(frase) { invia({ t: 'parlato', testo: frase }); S.ultimoParlato = Date.now(); }
function eseguiComando(r, frase, come) {
  if (r.annulla) { annulla(); return; }
  if (r.turno) { invia({ t: 'combattimento', azione: 'prossimo' }); Report.log('comando-voce', { testo: frase, esito: 'fine turno', come }); return; }
  if (r.gruppo) { invia({ t: 'gruppo', ...r.gruppo }); Report.log('comando-voce', { testo: frase, esito: 'tesoro', come }); if (!r.ops) return; }
  if (r.dado) { tira(r.dado.formula, r.dado.motivo === 'a voce' ? frase : r.dado.motivo, r.dado.modo); Report.log('comando-voce', { testo: frase, esito: 'dado', come }); return; }
  if (r.ops) { const pv = S.viewPg; S.viewPg = S.io; modifica(r.ops, come === 'voce' ? `a voce: "${frase}"` : null); S.viewPg = pv; invia({ t: 'comando', testo: frase }); Report.log('comando-voce', { testo: frase, esito: 'ok', ops: r.ops, come }); }
}
function aggiornaBottoniVoce() {
  $('#btnMic').classList.toggle('muto', Voce.muto || !Voce.attivo);
  $('#btnMic').setAttribute('aria-pressed', String(!Voce.muto && Voce.attivo));
  $('#btnMic').title = !Voce.attivo ? 'Microfono non attivo: tocca per attivarlo' : Voce.muto ? 'Microfono spento: tocca per parlare' : 'Microfono acceso';
  $('#btnAscolto').classList.toggle('on', Ascolto.attivo);
  $('#btnAscolto').setAttribute('aria-pressed', String(Ascolto.attivo));
}
$('#btnMic').addEventListener('click', async () => {
  Voce.riattivaAudio();
  if (!Voce.attivo) { const ok = await Voce.avvia({ io: S.io, invia, log: (t, d) => Report.log(t, d), onParlante: (id, p) => $(`#av-${id}`)?.classList.toggle('parla', p) }); if (ok) Voce.collegaTutti(S.st.online || []); }
  else Voce.setMuto(!Voce.muto);
  aggiornaBottoniVoce(); Report.log('microfono-tasto', { muto: Voce.muto });
});
$('#btnAscolto').addEventListener('click', () => {
  if (Ascolto.attivo) { Ascolto.ferma(); scrivi('ta_ascolto', false); toast('Comandi vocali spenti'); }
  else if (attivaAscolto()) { scrivi('ta_ascolto', true); toast('Ti ascolto: prova "tiro un d20" o "subisco 3 danni"'); }
  aggiornaBottoniVoce();
});
document.addEventListener('pointerdown', () => Voce.riattivaAudio(), { once: true });

// Tieni premuto e parla: libera il microfono della chat, ascolta, poi lo restituisce
let premuto = false;
async function inizioParla(e) {
  e?.preventDefault?.();
  if (premuto || !S.st) return;
  premuto = true; $('#btnParla').classList.add('on');
  const t0 = Date.now();
  Narratore.zitto();
  const continuo = Ascolto.attivo; if (continuo) Ascolto.pausa(true);
  Voce.pausaMicrofono();
  const promessa = Ascolto.unaFrase({ log: (t, d) => Report.log(t, d), onParziale: p => { const el = $('#parziale'); el.hidden = !p; el.textContent = '🎙 ' + p; } });
  if (!premuto) Ascolto.fineFrase();
  const frase = await promessa;
  $('#parziale').hidden = true;
  await Voce.riprendiMicrofono();
  if (continuo) Ascolto.pausa(false);
  Report.log('tasto-parla', { ms: Date.now() - t0, capito: !!frase, parole: frase ? frase.split(' ').length : 0 });
  if (frase) sentitaFrase(frase); else toast('Non ho sentito niente: tieni premuto mentre parli');
}
function fineParla() { if (!premuto) return; premuto = false; $('#btnParla').classList.remove('on'); setTimeout(() => Ascolto.fineFrase(), 250); }
$('#btnParla').addEventListener('pointerdown', inizioParla);
['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => $('#btnParla').addEventListener(ev, fineParla));
$('#btnParla').addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) inizioParla(e); });
$('#btnParla').addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') fineParla(); });
$('#btnParla').addEventListener('contextmenu', e => e.preventDefault());
