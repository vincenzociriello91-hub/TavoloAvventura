// Tavolo d'Avventura — Rete, ingresso e disegno generale. Si carica dopo app.js, nell'ordine scritto in index.html.
/* ============ RETE ============ */
function connetti(codice, primo) {
  S.codice = codice.toUpperCase();
  try { S.ws?.close(); } catch {}
  const ws = new WebSocket(`${SERVER_WS}/tavolo/${S.codice}/ws`);
  S.ws = ws;
  ws.onopen = () => { S.tentativi = 0; $('#statoRete').hidden = true; ws.send(JSON.stringify(primo())); Report.log('connessione', { aperta: true }); };
  ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch { return; } try { gestisci(m); } catch (err) { Report.log('errore-gestione', { tipo: m.t, msg: err.message, stack: String(err.stack).slice(0, 400) }); console.error(err); } };
  ws.onclose = () => {
    if (S.ws !== ws) return;
    Report.log('connessione', { chiusa: true, tentativi: S.tentativi });
    if (!S.io) return;
    $('#statoRete').hidden = false;
    const attesa = Math.min(15000, 1000 * 2 ** S.tentativi++);
    setTimeout(() => { if (S.ws === ws && S.io) connetti(S.codice, () => ({ t: 'ciao', membro: S.io, chiave: S.chiave })); }, attesa);
  };
}
function invia(o) { if (S.ws?.readyState === 1) { S.ws.send(JSON.stringify(o)); if (window.passoFatto) passoFatto(o); return true; } toast('Non connesso: riprovo tra poco', true); return false; }
setInterval(() => { if (S.ws?.readyState === 1) { S.ping = performance.now(); S.ws.send('{"t":"ping"}'); } }, 25000);
// telefono che si risveglia o rete che torna: si riconnette subito; una connessione muta (nessuna risposta in 5 s) si rifà
function svegliaRete() {
  if (!S.io || !S.codice) return;
  const rientra = () => { S.tentativi = 0; connetti(S.codice, () => ({ t: 'ciao', membro: S.io, chiave: S.chiave })); };
  if (!S.ws || S.ws.readyState > 1) return rientra();
  if (S.ws.readyState !== 1) return;
  const ws = S.ws, prima = S.pong || 0; S.ping = performance.now(); ws.send('{"t":"ping"}');
  setTimeout(() => { if (S.ws === ws && (S.pong || 0) === prima) { Report.log('connessione', { muta: true }); rientra(); } }, 5000);
}
addEventListener('online', svegliaRete);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') svegliaRete(); });

function gestisci(m) {
  switch (m.t) {
    case 'benvenuto': {
      S.io = m.io; if (m.chiave) S.chiave = m.chiave; S.st = m.stato; S.viewPg = S.io;
      salvaCampagna({ codice: S.codice, io: S.io, chiave: S.chiave, nome: S.st.campagna.nome, ruolo: me()?.ruolo });
      Report.log('entrato', { ruolo: me()?.ruolo, admin: me()?.admin, regole: regole(), master: S.st.campagna.masterTipo });
      mostraGioco(); renderTutto(); avviaVoce(); controllaMappa(); meteoVero(); if (S.st.luogo) setTimeout(() => entraLuogo(S.st.luogo), 400); $('#invitoGuida').hidden = !(me()?.ruolo === 'giocatore' && !leggi('ta_guida_vista', false)); renderPassi(); // l'elenco dei primi passi aspetta che l'invito alla guida sia chiuso
      Mappa.pacchetti(`${SERVER_WS.replace(/^ws/, 'http')}/tavolo/${S.codice}/grafica/atlante`, S.io, S.chiave); // grafica comprata, solo per i membri
      // l'invito sparisce dalla barra degli indirizzi; resta il codice, così ricaricando si rientra da soli
      history.replaceState(null, '', `${location.pathname}?c=${S.codice}${document.body.classList.contains('tv') ? '&tv=1' : ''}`);
      scrivi('ta_attiva', S.codice);
      if (S.mondoDaPortare && me()?.admin) { invia({ t: 'mondo_importa', codice: S.mondoDaPortare }); Report.log('mondo-importa', { allaCreazione: true }); } S.mondoDaPortare = '';
      ricordaAvvisi(); riprendiDistanza();
      return;
    }
    case 'stato': S.st = m.stato; renderTutto(); return;
    case 'presenza': {
      S.st.online = m.online;
      if (m.entrato && m.membro) S.st.membri[m.entrato] = m.membro;
      if (m.entrato && m.entrato !== S.io && Voce.attivo && S.io < m.entrato) Voce.crea(m.entrato, true);
      if (m.uscito && m.uscito !== S.io) Voce.chiudi(m.uscito);
      renderPresenza(); return;
    }
    case 'scheda': {
      const prima = S.st.pg[m.per];
      S.st.pg[m.per] = m.pg;
      if (m.per === S.io && !prima) renderPassi(); // personaggio appena creato: il primo passo è fatto
      if (prima && m.pg && prima.pf !== m.pg.pf && S.st.segnalini?.[m.per]) {
        const d = m.pg.pf - prima.pf; Mappa.effettoTesto(m.per, (d > 0 ? '+' : '') + d, d > 0 ? '#7dff8a' : '#ff6a5a');
        let chiColpisce = null;
        if (d < 0 && m.da === 'master') { const me_ = S.st.segnalini[m.per], nem = Object.entries(S.st.segnalini).filter(([, v]) => v.tipo === 'nemico').sort(([, a], [, b]) => Math.hypot(a.x - me_.x, a.y - me_.y) - Math.hypot(b.x - me_.x, b.y - me_.y))[0]; if (nem && Math.hypot(nem[1].x - me_.x, nem[1].y - me_.y) < 8) { Mappa.attacco(nem[0]); chiColpisce = nem[0]; } }
        if (d < 0) colpoASegno(m.per, chiColpisce, -d / Math.max(1, m.pg.pfMax || 10), m.per === S.io); else { Mappa.cura(m.per); Suoni.effetto('cura'); }
      }
      if (m.per === S.io && m.da !== S.io) {
        if (OPZ.avvisi && prima && prima.pf > prima.pfMax / 2 && m.pg.pf <= m.pg.pfMax / 2 && m.pg.pf > 0) Narratore.avviso('Attenzione: sei sotto metà dei punti ferita');
        if (OPZ.avvisi && prima && prima.pf > 0 && m.pg.pf <= 0) Narratore.avviso('Sei a terra, privo di sensi');
        if (m.nota) toast(`${m.pg.nome}: ${m.nota}`);
      }
      if (S.st.segnalini?.[m.per]) S.st.segnalini[m.per].nome = m.pg.nome;
      renderSchedaSeServe(); renderPresenza(); renderHud(); return;
    }
    case 'dado': {
      S.st.dadi = [...(S.st.dadi || []), m.tiro].slice(-60);
      if (/attacc|colp|fendent|affond|spada|ascia|mazza|martell|pugnal|arco|frecci|balestr|incantesim|dardo|palla di fuoco|raggio|per colpire|tiro per colpire/i.test(m.tiro.motivo || '')) { Mappa.attacco(m.tiro.chi); S.ultimoAttacco = { chi: m.tiro.chi, t: Date.now() }; if (/arco|frecci|balestr|quadrell|fionda|giavellott|incantesim|dardo|palla di fuoco|raggio|fulmin|magic|trucchett/i.test(m.tiro.motivo || '')) { Mappa.proiettile(m.tiro.chi, m.tiro.motivo); Suoni.effetto(/arco|frecci|balestr|quadrell|fionda|giavellott/i.test(m.tiro.motivo) ? 'fruscio' : 'magia'); } }
      if (m.tiro.chi === S.io) { S.ultimoMio = m.tiro; $('#tiroAzioni').hidden = false; Suoni.effetto(m.tiro.critico ? 'critico' : m.tiro.fallimento ? 'fallimento' : 'dado'); }
      const conPannello = m.tiro.chi === S.io && provaInVista(m.tiro);
      if (m.tiro.chi === S.io || document.body.classList.contains('tv')) mostraTiro(m.tiro, conPannello);
      if (OPZ.dadi3d !== false && (m.tiro.chi === S.io || S.vista === 'vMappa' || document.body.classList.contains('tv'))) import('./dadi3d.js').then(d => d.lancia(m.tiro, m.tiro.chi === S.io ? { colore: OPZ.dadiColore, materiale: OPZ.dadiMateriale } : { colore: S.st.membri?.[m.tiro.chi]?.colore, materiale: 'opaco' })).catch(e => Report.log('dadi-3d', { errore: String(e?.message || e) }));
      if (m.tiro.critico && /^1?d20/.test(m.tiro.formula) && !m.tiro.segreto) momentoEpico(m.tiro);
      if (m.tiro.fallimento && /^1?d20/.test(m.tiro.formula) && !m.tiro.segreto && (m.tiro.chi === S.io || document.body.classList.contains('tv'))) momentoFiasco(m.tiro);
      renderTiri(); renderRapidi(); return;
    }
    case 'suono': Suoni.effetto(m.nome); return;
    case 'png': S.st.png = m.png; renderDiarioExtra(); return;
    case 'mondo_vivo': { const { t, ...r } = m; Object.assign(S.st, r); renderMondoVivo(); renderTesoro(); renderMondo(); renderSchedaSeServe(); return; }
    case 'sogno': chiedi(`<h2>🌙 Un sogno</h2><p class="piccolo">Lo vedi solo tu: decidi tu se raccontarlo agli altri.</p><p class="storia-pg">${esc(m.testo)}</p>`, [{ testo: 'Mi sveglio', pieno: true }]); if (OPZ.narratore) Narratore.parla(m.testo); Report.log('sogno', {}); return;
    case 'memoriale': S.st.memoriale = m.memoriale; if (m.caduto) { delete S.st.pg[m.caduto]; renderSchedaSeServe(true); } renderDiarioExtra(); return;
    case 'bentornato': mostraBentornato(m.riepiloghi); return;
    case 'luogo': { const nuovoLuogo = S.st.luogo?.id !== m.luogo?.id; S.st.luogo = m.luogo; S.st.segnalini = m.segnalini; S.st.luoghi = m.luoghi; S.st.aree = []; renderMappa(); if (!$('#mondoBox').hidden) renderMappaMondo(); Report.log('luogo', { nome: m.luogo.nome, tipo: m.luogo.tipo }); controllaMappa(); if (nuovoLuogo) { entraLuogo(m.luogo); $('#passaggio').hidden = true; } return; }
    case 'luogo_mod': S.st.luogo = m.luogo; renderMappa(); return;
    case 'segnalini': {
      const prima = S.st.segnalini || {};
      for (const [id, v] of Object.entries(prima)) {
        if (v.tipo !== 'nemico') continue;
        const ora = m.segnalini[id];
        if (!ora) { Mappa.effettoTesto(id, 'Sconfitto!', '#ffd25a', v); Mappa.sconfitto(v, v.nome); Suoni.effetto('impatto'); Suoni.abbassa(600); vibra([30, 30, 60]); }
        else if (v.pf !== undefined && ora.pf !== undefined && ora.pf !== v.pf) { Mappa.effettoTesto(id, (ora.pf > v.pf ? '+' : '') + (ora.pf - v.pf), ora.pf > v.pf ? '#7dff8a' : '#ff6a5a'); if (ora.pf < v.pf) colpoASegno(id, S.ultimoAttacco && Date.now() - S.ultimoAttacco.t < 15000 ? S.ultimoAttacco.chi : null, (v.pf - ora.pf) / Math.max(v.pf, 1), false); else Mappa.cura(id); }
      }
      S.st.segnalini = m.segnalini; Mappa.aggiornaSegnalini(m.segnalini); return;
    }
    case 'diario': S.st.diario = [...(S.st.diario || []), m.ev].slice(-200); renderDiario(); if (m.ev.tipo === 'chat' && m.ev.chi !== S.io) traduciTesto(m.ev.testo); return;
    case 'serate': S.st.serate = m.serate; renderSerate(); return;
    case 'esportazione': { const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([JSON.stringify({ app: 'TavoloAvventura', versione: VERSION, salvata: new Date().toISOString(), codice: S.codice, dati: m.dati })], { type: 'application/json' })), download: `campagna-${(S.st.campagna.nome || 'tavolo').replace(/[^\w]+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json` }); a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); toast('Copia della campagna scaricata'); Report.log('copia', { voci: Object.keys(m.dati).length }); return; }
    case 'push_chiave': attivaNotifiche(m.pub); return;
    case 'push_ok': scrivi('ta_push', true); toast(S.st.campagna.differito ? 'Avvisi attivi: ti arriva una notifica quando tocca a te' : 'Avvisi attivi: ti arriva una notifica il giorno prima e un\'ora prima di ogni serata'); renderSerate(); renderGiro(); ricordaAvvisi(); Report.log('notifiche', { esito: 'ok' }); return;
    case 'disegna_tu': disegnaDalTelefono(m); return;
    case 'reazione': reazioneVola(m.emoji, m.nome); if (m.emoji === '✋' && m.nome) toast(`✋ ${m.nome} alza la mano`); return;
    case 'giro': S.st.giro = m.giro; renderGiro(); avvisaGiro(m.giro); return;
    case 'sussurro': arrivaSussurro(m); return;
    case 'aiuto': arrivaAiuto(m); return;
    case 'carta': arrivaCarta(m); return;
    case 'cronaca': S.st.cronaca = m.cronaca; renderCronaca(); return;
    case 'mondo_chiave': S.st.mondoChiave = m.chiave; renderMondoCondiviso(); toast(m.chiave ? 'Codice del mondo pronto: dallo a chi vuoi far giocare nel vostro mondo' : 'Codice ritirato: non funziona più'); return;
    case 'appunti': S.st.appunti = m.testo; delete $('#aAppunti').dataset.toccato; renderRegia(); return;
    case 'traduzione': { const cb = S.attesaTrad?.[m.id]; if (cb) { delete S.attesaTrad[m.id]; cb(m); } return; }
    case 'note_mappa': S.st.noteMappa = { luogo: m.luogo, note: m.note }; renderNoteMappa(); return;
    case 'disegni': S.st.disegni = { luogo: m.luogo, disegni: m.disegni }; aggiornaExtraMappa(); return;
    case 'gioco_taverna': S.st.giocoTaverna = m.gioco; renderTesoro(); return;
    case 'sfida': S.st.campagna.sfida = m.sfida; sfidaFinita(m.sfida); return;
    case 'narra': {
      const ev = { t: Date.now(), tipo: 'narrazione', testo: m.testo, chi: m.chi, png: m.png };
      S.st.diario = [...(S.st.diario || []), ev].slice(-200);
      if (S.ultimoParlato) { Report.log('master-risposta', { ms: Date.now() - S.ultimoParlato, modello: m.modello, parole: m.testo.split(' ').length }); S.ultimoParlato = 0; }
      Report.log('narrazione', { png: m.png || null, testo: m.testo, modello: m.modello || null, riassunto: !!m.riassunto, riserva: !!m.riserva }); // ogni battuta parola per parola, come nei Varchi
      mostraNarrazione(m.testo, m.png); renderDiario(); traduciTesto(m.testo);
      riassuntoArrivato(m);
      if (OPZ.narratore && altraLingua()) { S.daLeggere = m.testo; } // si legge la traduzione, appena arriva
      else if (OPZ.narratore && m.voce) { // la voce naturale arriva tra poco: si aspetta al massimo 12 secondi, poi voce del telefono
        S.vociAttese = S.vociAttese || {};
        S.vociAttese[m.voce] = { testo: m.testo, png: m.png || null, timer: setTimeout(() => { delete S.vociAttese[m.voce]; Narratore.parla(m.testo, { png: m.png || null }); Report.log('voce-master', { esito: 'scaduta' }); }, 12000) };
      } else if (OPZ.narratore) Narratore.parla(m.testo, { png: m.png || null });
      return;
    }
    case 'voce': {
      const a = S.vociAttese?.[m.id]; if (!a) return;
      clearTimeout(a.timer); delete S.vociAttese[m.id];
      if (!m.ok) { Narratore.parla(a.testo, { png: a.png }); Report.log('voce-master', { esito: 'non generata' }); return; }
      const t0 = Date.now();
      fetch(urlMedia('voce', m.id)).then(r => r.ok ? r.blob() : Promise.reject(r.status)).then(b => { Narratore.parla(a.testo, { png: a.png, audio: URL.createObjectURL(b) }); Report.log('voce-master', { esito: 'ok', kb: Math.round(b.size / 1024), ms: Date.now() - t0 }); })
        .catch(e => { Narratore.parla(a.testo, { png: a.png }); Report.log('voce-master', { esito: 'scaricamento fallito', errore: String(e) }); });
      return;
    }
    case 'master_pensa': { const n = $('#narrazione'); n.hidden = false; n.classList.add('pensa'); $('#narrChi').textContent = 'Il master'; Scrittura.tutto(); $('#narrTesto').textContent = 'Il master sta pensando…'; n.classList.remove('finita'); if (stileGioco()) { $('#narrVolto').hidden = false; $('#narrVolto').innerHTML = `<img src="${Volti.master()}" alt="" width="64" height="64">`; } return; }
    case 'master_zitto': { const n = $('#narrazione'); if (n.classList.contains('pensa')) n.hidden = true; n.classList.remove('pensa'); return; }
    case 'richiesta_tiro': {
      if (m.pg === S.io) {
        $('#richTesto').textContent = `Il master chiede: prova di ${m.prova}${m.cd ? ' (CD ' + m.cd + ')' : ''}`;
        S.provaAttesa = { prova: m.prova, cd: Number(m.cd) || null, t: Date.now() };
        $('#richiesta').hidden = false; $('#richTira').textContent = 'Tira'; $('#richTira').onclick = () => { tiraProva(m.prova); $('#richiesta').hidden = true; };
        if (S.aiuto && Date.now() - S.aiuto.t < 180000) $('#richTesto').textContent += ` · con l'aiuto di ${S.aiuto.nome} (vantaggio)`;
        if (OPZ.avvisi) Narratore.avviso(`Tocca a te: prova di ${m.prova}`);
      } else proponiAiuto(m);
      return;
    }
    case 'avviso': toast(m.msg, !!m.motivo || !!m.errore || /non è riuscit|finite|errore|impossibile/i.test(m.msg), m.msg.length > 70 ? 7000 : 3500); return; // un avviso di fallimento è rosso, non verde
    case 'negozio': { const prima = S.st.negozio; S.st.negozio = m.negozio; if (m.negozio && !prima) { toast(`È aperto il banco: ${m.negozio.nome}. Guarda nella Scheda.`); Report.log('negozio', { nome: m.negozio.nome, merci: m.negozio.merci.length }); } renderSchedaSeServe(); return; }
    case 'strumento': mostraStrumento(m.tipo, m.ris); return;
    case 'note_master': $('#smNote').value = m.testo || ''; return;
    case 'libro': apriLibro(m); return;
    case 'statistiche': mostraStatistiche(m); return;
    case 'avventura': S.st.avventura = m.avventura; renderAvventura(); return;
    case 'sessione_zero': szRisposta(m); return;
    case 'mostri': S.st.mostri = m.mostri; Mappa.disegna(); if (S.m3) S.m3.aggiorna(Mappa.dati3D()); return;
    case 'volti': S.st.volti = m.volti; { const png = $('#narrChi').dataset.png; if (png && m.volti[png]) mostraVolto(png); } return;
    case 'riepilogo': Report.log('riepilogo', { titolo: m.r.titolo, immagine: !!m.r.img }); mostraRiepilogo(m.r); return;
    case 'riepiloghi': { const r = m.elenco.find(x => x.t === S.apriRiepilogo); if (r) mostraRiepilogo(r); return; }
    case 'rtc': Voce.segnale(m.da, m.dati); return;
    case 'invito': S.st.campagna.invito = m.invito; S.st.campagna.invitoSpettatori = m.invitoSpettatori; renderInvito(); toast('Nuovo codice invito creato: i vecchi QR non funzionano più'); return;
    case 'interpretato': {
      const frase = S.pendenti[m.id]; delete S.pendenti[m.id];
      if (m.ops?.length) { modifica(m.ops, `a voce: "${frase}"`); Report.log('comando-voce', { testo: frase, esito: 'capito dall\'AI', ops: m.ops }); }
      else { Report.log('comando-voce', { testo: frase, esito: 'non capito' }); if (masterAI() && OPZ.master && frase) inviaParlato(frase); }
      return;
    }
    case 'regola': { const b = $('#rispostaRegola'); b.hidden = false; b.innerHTML = `<strong>${esc(m.domanda || 'Regola')}</strong><p>${esc(m.testo)}</p>`; return; }
    case 'errore': {
      toast(m.msg, true, 5000); Report.log('errore-server', { msg: m.msg, codice: m.codice });
      if (m.codice === 'accesso' || m.codice === 'inesistente') { dimenticaCampagna(S.codice); S.io = null; mostraIngresso(); }
      if (m.codice === 'invito') { S.io = null; mostraIngresso(); }
      return;
    }
    case 'ok': if (m.cosa === 'suggerimento') toast('Grazie! Suggerimento inviato'); return;
    case 'costi': S.st.costi = m.costi; renderCosti(); return;
    case 'combattimento': {
      const prima = S.st.combattimento;
      { const c2 = m.combattimento, cambiato = !prima?.attivo || !c2?.attivo || prima.turno !== c2.turno || prima.round !== c2.round; if (cambiato) { S.mosso = 0; S.arrivoTurno = Date.now(); S.tempoAvvisato = false; } } // turno nuovo: movimento e clessidra ripartono
      S.st.combattimento = m.combattimento; renderCombat(); renderHud(); striscioneCombattimento(prima, m.combattimento);
      const c = m.combattimento, ora = c?.attivo && c.ordine[c.turno];
      if (ora && ora.id === S.io && !(prima?.attivo && prima.ordine[prima.turno]?.id === S.io && prima.round === c.round)) { if (OPZ.avvisi) Narratore.avviso('Tocca a te'); toast('È il tuo turno!'); Suoni.effetto('turno'); }
      Report.log('combattimento', { attivo: c?.attivo, round: c?.round, turno: ora?.nome });
      return;
    }
    case 'aree': { const nuove = (m.aree || []).filter(a => !(S.st.aree || []).some(b => b.x === a.x && b.y === a.y && b.nome === a.nome)); S.st.aree = m.aree; aggiornaExtraMappa(); nuove.forEach(a => Mappa.effettoArea(a)); return; }
    case 'nebbia': if (S.st.luogo?.id === m.id) { S.st.luogo.visto = m.visto; Mappa.setVisto(m.id, m.visto); } return;
    case 'gruppo': S.st.gruppo = m.gruppo; renderTesoro(); return;
    case 'mondo': S.st.mondo = m.mondo; renderMondo(); Mappa.setAmbiente(m.mondo?.calendario); if (!$('#mondoBox').hidden) renderMappaMondo(); return;
    case 'relazioni': S.st.relazioni = m.relazioni; renderSchedaSeServe(); return;
    case 'pong': S.latenza = Math.round(performance.now() - (S.ping || performance.now())); S.pong = Date.now(); return;
  }
}

/* ============ INGRESSO ============ */
function mostraIngresso() {
  $('#ingresso').hidden = false; $('#gioco').hidden = true; $('#azioniBarra').hidden = true;
  $('#tCampagna').textContent = "Tavolo d'Avventura"; $('#tSotto').textContent = 'D&D online con gli amici'; $('#presenza').innerHTML = '';
  const l = campagneSalvate();
  $('#cartaMie').hidden = !l.length;
  $('#listaMie').innerHTML = l.map(c => `<li><button class="apri" data-c="${esc(c.codice)}"><span><strong>${esc(c.nome || c.codice)}</strong><br><span class="piccolo">${esc(c.codice)} · ${esc(c.ruolo || 'giocatore')}</span></span><span aria-hidden="true">›</span></button><button class="testo-btn togli" data-c="${esc(c.codice)}" aria-label="Dimentica ${esc(c.nome || c.codice)}">Dimentica</button></li>`).join('');
  const nome = leggi('ta_nome', ''); if (nome) { $('#eNome').value ||= nome; $('#cMioNome').value ||= nome; }
}
function mostraGioco() { $('#ingresso').hidden = true; $('#gioco').hidden = false; $('#azioniBarra').hidden = document.body.classList.contains('tv'); }
$('#listaMie').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const c = campagneSalvate().find(x => x.codice === b.dataset.c); if (!c) return;
  if (b.classList.contains('togli')) { dimenticaCampagna(c.codice); mostraIngresso(); return; }
  S.io = c.io; S.chiave = c.chiave; connetti(c.codice, () => ({ t: 'ciao', membro: c.io, chiave: c.chiave }));
});
$$('input[name="cMaster"]').forEach(r => r.addEventListener('change', () => { $('#cMioRuoloBox').hidden = $('input[name="cMaster"]:checked').value !== 'umano'; }));
$('#chipsAmb').addEventListener('click', e => { const b = e.target.closest('.chip'); if (b) $('#cAmbientazione').value = b.textContent; });
// sfide settimanali in solitaria: una diversa ogni settimana, uguale per tutti
const SFIDE = [
  { titolo: 'Il ladro di campane', obiettivo: 'Qualcuno ha rubato la campana del tempio di Valfonda. Trova il ladro e riportala prima del tramonto, senza uccidere nessuno.' },
  { titolo: 'La torre che crolla', obiettivo: 'Una torre di guardia sta crollando con tre soldati intrappolati dentro. Salvali tutti e tre prima che venga giù.' },
  { titolo: 'Il drago di carta', obiettivo: 'Un giovane mago ha animato un drago di carta che sta incendiando i campi. Fermalo senza far del male al mago.' },
  { titolo: 'La fiera dei bugiardi', obiettivo: 'Alla fiera di Borgo Rosso uno dei cinque mercanti è un mutaforma. Smaschera quello giusto: hai una sola accusa.' },
  { titolo: 'Notte nella cripta', obiettivo: 'Sopravvivi fino all\'alba chiuso in una cripta piena di scheletri, e porta fuori il calice d\'oro.' },
  { titolo: 'Il ponte di corda', obiettivo: 'Scorta una carovana di tre carri oltre un ponte di corda sorvegliato da banditi, perdendo al massimo un carro.' },
  { titolo: 'Il lupo del villaggio', obiettivo: 'Nel villaggio di Pieve un lupo mannaro uccide le pecore. Scopri chi è prima della luna piena (tre giorni di gioco).' },
  { titolo: 'Il tesoro dell\'annegato', obiettivo: 'Recupera lo scrigno di un capitano dal relitto nella baia prima che arrivino i pirati della Medusa.' }
];
function sfidaDellaSettimana() { const d = new Date(), inizio = new Date(d.getFullYear(), 0, 1), sett = Math.ceil(((d - inizio) / 86400000 + inizio.getDay() + 1) / 7); return { ...SFIDE[(d.getFullYear() * 53 + sett) % SFIDE.length], settimana: `${d.getFullYear()}-${sett}` }; }
(() => { const sf = sfidaDellaSettimana(), vinte = leggi('ta_sfide_vinte', []); $('#sfidaTesto').innerHTML = `<strong>${esc(sf.titolo)}</strong>: ${esc(sf.obiettivo)}`; $('#sfidaVinte').textContent = vinte.length ? `Sfide vinte: ${vinte.length}${vinte.some(v => v.settimana === sf.settimana) ? ' (questa l\'hai già vinta!)' : ''}` : 'Ogni lunedì una sfida nuova: giochi da solo con il master AI e due compagni.'; })();
$('#btnSfida').addEventListener('click', () => {
  const mioNome = $('#cMioNome').value.trim() || leggi('ta_nome', '') || $('#eNome').value.trim();
  if (!mioNome) { toast('Scrivi il tuo nome nella carta "Crea una campagna"', true); $('#cMioNome').focus(); return; }
  scrivi('ta_nome', mioNome); const sf = sfidaDellaSettimana();
  Voce.riattivaAudio(); Report.log('sfida', { settimana: sf.settimana });
  connetti(codiceNuovo(), () => ({ t: 'crea', nome: 'Sfida: ' + sf.titolo, regole: $('input[name="cRegole"]:checked').value, ambientazione: 'Fantasy classico. ' + sf.obiettivo, masterTipo: 'ai', mioNome, solitaria: true, sfida: sf }));
});
function sfidaFinita(sf) {
  if (sf?.esito === 'vinta') { const v = leggi('ta_sfide_vinte', []); if (!v.some(x => x.settimana === sf.settimana)) { v.push({ settimana: sf.settimana, titolo: sf.titolo }); scrivi('ta_sfide_vinte', v); } }
  chiedi(sf?.esito === 'vinta' ? `<h2>🏆 Sfida vinta!</h2><p>${esc(sf.titolo)}: ce l'hai fatta. Lunedì arriva la prossima.</p>` : `<h2>Sfida persa</h2><p>${esc(sf?.titolo || '')}: non è andata. Puoi riprovarla quando vuoi fino a domenica.</p>`, [{ testo: 'Ok', pieno: true }]);
}
$('#btnCrea').addEventListener('click', () => {
  const mioNome = $('#cMioNome').value.trim();
  if (!mioNome) { toast('Scrivi il tuo nome', true); $('#cMioNome').focus(); return; }
  scrivi('ta_nome', mioNome);
  const dati = { t: 'crea', nome: $('#cNome').value.trim() || 'La nostra campagna', regole: $('input[name="cRegole"]:checked').value, ambientazione: $('#cAmbientazione').value.trim() || 'Fantasy classico', masterTipo: $('input[name="cMaster"]:checked').value, ruolo: $('input[name="cMioRuolo"]:checked').value, mioNome, avventura: $('#cAvventura').value || undefined, solitaria: $('#cSolitaria').checked };
  S.mondoDaPortare = $('#cMondo').value.trim();
  Voce.riattivaAudio();
  connetti(codiceNuovo(), () => dati);
});
$('#btnEntra').addEventListener('click', () => {
  const nome = $('#eNome').value.trim(), codice = $('#eCodice').value.trim().toUpperCase(), invito = $('#eInvito').value.trim().toUpperCase();
  if (!nome) { toast('Scrivi il tuo nome', true); $('#eNome').focus(); return; }
  if (!codice || !invito) { toast('Servono il codice della campagna e il codice invito (sono nel QR)', true); return; }
  scrivi('ta_nome', nome);
  const salvata = campagneSalvate().find(x => x.codice === codice);
  if (salvata) { S.io = salvata.io; S.chiave = salvata.chiave; connetti(codice, () => ({ t: 'ciao', membro: salvata.io, chiave: salvata.chiave })); return; }
  connetti(codice, () => ({ t: 'entra', invito, nome, ruolo: $('input[name="eRuolo"]:checked').value }));
});

/* ============ RENDER GENERALE ============ */
function renderTutto() {
  if (!S.st) return;
  const c = S.st.campagna;
  $('#tCampagna').textContent = c.nome;
  const cal = S.st.mondo?.calendario;
  $('#tSotto').textContent = `${Regole.set(c.regole).nome} · master ${c.masterTipo === 'ai' ? 'AI' : 'in carne e ossa'} · sessione ${c.sessione || 1}${cal ? ` · giorno ${cal.giorno}, ${cal.stagione}` : ''}`;
  $('#aiutoCapo').hidden = me()?.ruolo !== 'master';
  $('#dSegretoBox').hidden = !capo();
  $('#boxNarra').hidden = !(capo() && c.masterTipo === 'umano');
  $('#alMasterBox').hidden = !masterAI();
  $('#formVai').hidden = !(capo() || masterAI());
  $('#mappaVuotaSugg').textContent = masterAI() ? 'Il master AI vi porterà nel primo luogo appena iniziate a giocare: salutatelo o scrivete un luogo qui sopra.' : 'Il master sceglierà il primo luogo.';
  $('#optMaster').closest('label').hidden = !masterAI();
  $('#btnCombat').hidden = !capo(); $('#btnPulisciAree').hidden = !capo(); if ($('#schermoMaster').hidden === capo()) { $('#schermoMaster').hidden = !capo(); if (capo()) invia({ t: 'note_master' }); }
  if (capo()) renderAvventura(); $('#btnIllustra').hidden = !capo(); $('#btnRiepilogo').hidden = !capo();
  renderPresenza(); renderMappa(); renderCombat(); renderHud(); renderSchedaSeServe(true); renderTesoro(); renderTiri(); renderRapidi(); renderDiario(); renderDiarioExtra(); renderMondoVivo(); renderSerate(); renderPresenze(); renderNoteMappa(); $('#reazioni').hidden = me()?.ruolo !== 'spettatore'; $('#btnNota').hidden = me()?.ruolo === 'spettatore'; $('#altriStrumenti').hidden = me()?.ruolo === 'spettatore'; $('#btnArea').hidden = me()?.ruolo === 'spettatore'; $('#btnDungeon').hidden = !(capo() || masterAI()) || me()?.ruolo === 'spettatore'; $('#copiaBox').hidden = !me()?.admin; $('#optMeteoVero').closest('label').hidden = !capo(); renderMondo(); renderAltro(); renderRegia(); renderPassi();
}
function renderPresenza() {
  if (!S.st) return;
  const on = new Set(S.st.online || []);
  const ordinati = Object.entries(S.st.membri).sort((a, b) => (b[1].ruolo === 'master') - (a[1].ruolo === 'master'));
  let html = masterAI() ? `<div class="av on ${Narratore.parlando ? 'parla' : ''}" id="av-master" style="background:#d9a441" title="Master AI">AI</div>` : '';
  const visibili = ordinati.filter(([, m]) => m.ruolo !== 'spettatore').sort((a, b) => on.has(b[0]) - on.has(a[0]));
  const max = innerWidth < 480 ? 3 : 8;
  html += visibili.slice(0, max).map(([id, m]) => {
    const pg = S.st.pg[id];
    return `<div class="av ${on.has(id) ? 'on' : ''} ${cornice(m.presenze) ? 'cornice-' + cornice(m.presenze)[1] : ''}" id="av-${id}" style="background:${esc(m.colore)}" title="${esc(m.nome)}${pg ? ' — ' + esc(pg.nome) : ''}${m.ruolo === 'master' ? ' (master)' : ''}">${esc((m.nome || '?').charAt(0).toUpperCase())}${m.ruolo === 'master' ? '<span class="ruolo">M</span>' : ''}</div>`;
  }).join('') + (visibili.length > max ? `<div class="av altri" title="Altri ${visibili.length - max}">+${visibili.length - max}</div>` : '');
  $('#presenza').innerHTML = html;
}
function mostraVista(id) {
  S.vista = id;
  $$('.vista').forEach(v => v.classList.toggle('attiva', v.id === id));
  $$('#nav button').forEach(b => b.classList.toggle('attivo', b.dataset.v === id));
  if (id === 'vScheda') renderScheda();
  if (id === 'vMappa') Mappa.adatta();
  Report.log('vista', { id }); if (window.passoFatto) passoFatto({ t: 'vista', id });
}
$('#nav').addEventListener('click', e => { const b = e.target.closest('button'); if (b) mostraVista(b.dataset.v); });
