// Tavolo d'Avventura — Funzioni aggiunte: illustrazioni di riserva, meteo, sezioni, traduzione, serate, note, guida, controller, ricordi. Si carica dopo app.js, nell'ordine scritto in index.html.
/* ============ Illustrazione di riserva: la disegna questo telefono quando le quote del server sono finite ============ */
async function disegnaDalTelefono(m) {
  // la disegna un solo telefono: il primo (in ordine) tra i giocatori collegati; TV e spettatori no
  const chi = (S.st.online || []).filter(id => S.st.membri?.[id] && S.st.membri[id].ruolo !== 'spettatore' && !/^TV /.test(S.st.membri[id].nome)).sort()[0];
  if (chi !== S.io || document.body.classList.contains('tv')) return;
  // il servizio gratuito accetta un disegno ogni 45 secondi circa: le richieste fanno la fila
  S.codaDisegni = S.codaDisegni || []; S.codaDisegni.push(m); if (S.disegnoInCorso) return;
  S.disegnoInCorso = true;
  while (S.codaDisegni.length) {
    const d = S.codaDisegni.shift(), lato = d.piccola ? [512, 512] : [768, 432];
    if (!d.piccola) toast('Disegno la scena con il servizio di riserva…');
    try {
      const r = await fetch(`https://image.pollinations.ai/prompt/${encodeURIComponent(d.prompt.slice(0, 900))}?width=${lato[0]}&height=${lato[1]}&nologo=true&model=flux&seed=${Math.floor(Math.random() * 1e6)}`, { signal: AbortSignal.timeout(90000) });
      if (!r.ok || !/^image\//.test(r.headers.get('content-type') || '')) throw new Error('HTTP ' + r.status);
      const bmp = await createImageBitmap(await r.blob()), w = Math.min(lato[0], bmp.width), c = Object.assign(document.createElement('canvas'), { width: w, height: Math.round(w * bmp.height / bmp.width) });
      c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
      const dati = c.toDataURL('image/jpeg', 0.82).split(',')[1];
      invia({ t: 'immagine_esterna', id: d.id, dati }); Report.log('illustrazione-riserva', { esito: 'ok', piccola: !!d.piccola, kb: Math.round(dati.length * 0.75 / 1024) });
    } catch (e) { Report.log('illustrazione-riserva', { esito: 'errore', errore: String(e?.message || e).slice(0, 200) }); if (!d.piccola) toast("Immagini gratuite finite per oggi: tornano dopo l'una di notte.", true, 6000); }
    if (S.codaDisegni.length) await new Promise(r => setTimeout(r, 46000));
  }
  S.disegnoInCorso = false;
}
/* ============ Meteo vero nella partita (come nei Varchi): Open-Meteo, posizione arrotondata a ~10 km che non lascia il telefono ============ */
async function meteoVero() {
  clearTimeout(S.timerMeteo); if (!OPZ.meteoVero || !capo() || !S.st) return;
  try {
    const pos = await new Promise((ok, no) => navigator.geolocation.getCurrentPosition(ok, no, { maximumAge: 3600000, timeout: 20000 }));
    const lat = pos.coords.latitude.toFixed(1), lon = pos.coords.longitude.toFixed(1);
    const j = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weather_code`).then(r => r.json()), c = j.current?.weather_code ?? 0;
    const meteo = c >= 95 ? 'temporale' : (c >= 71 && c <= 77) || c === 85 || c === 86 ? 'neve' : c >= 51 ? 'pioggia' : c === 45 || c === 48 ? 'nebbia' : c >= 2 ? 'nuvoloso' : 'sereno';
    invia({ t: 'meteo_vero', meteo }); Report.log('meteo-vero', { meteo }); // solo il tempo, mai le coordinate
  } catch (e) { Report.log('meteo-vero', { errore: String(e?.message || e).slice(0, 120) }); if (e?.code === 1) { OPZ.meteoVero = false; scrivi('ta_opzioni', OPZ); $('#optMeteoVero').checked = false; toast('Senza posizione il meteo vero non funziona', true); } }
  S.timerMeteo = setTimeout(meteoVero, 30 * 60000);
}
$('#optMeteoVero').checked = !!OPZ.meteoVero;
$('#optMeteoVero').addEventListener('change', e => { OPZ.meteoVero = e.target.checked; scrivi('ta_opzioni', OPZ); if (OPZ.meteoVero) meteoVero(); else clearTimeout(S.timerMeteo); });
$('#btnDungeon').addEventListener('click', () => { invia({ t: 'dungeon_giorno' }); Report.log('dungeon-giorno', {}); });
/* ============ Sezioni pieghevoli: il titolo apre e chiude, l'app si ricorda com'erano ============ */
const APERTE = ['Invita al tavolo', 'Prossime serate', 'Schermo del master', 'Gioco', 'Caratteristiche', 'Attacchi', 'Equipaggiamento', 'Incantesimi', 'Banco', 'Tesoro del gruppo', 'Tiri salvezza'];
const pieghe = leggi('ta_pieghe', {});
const titoloPiega = h => h.firstChild?.textContent?.trim().split(/[·(:]/)[0].trim() || h.textContent.trim();
function applicaPieghe() {
  document.querySelectorAll('#vAltro > .carta > h2, #scheda .carta > h3:first-child, #tesoro > h3:first-child').forEach(h => {
    const c = h.parentElement, k = titoloPiega(h), aperta = pieghe[k] ?? APERTE.some(a => k.startsWith(a));
    c.classList.add('piegabile'); h.classList.add('testa-piega'); h.setAttribute('role', 'button'); h.tabIndex = 0;
    c.classList.toggle('chiusa', !aperta); h.setAttribute('aria-expanded', aperta);
  });
}
function piega(h, aperta) { const c = h.parentElement; c.classList.toggle('chiusa', !aperta); h.setAttribute('aria-expanded', aperta); pieghe[titoloPiega(h)] = aperta; scrivi('ta_pieghe', pieghe); }
document.addEventListener('click', e => { const h = e.target.closest('.testa-piega'); if (h && !e.target.closest('button, a, input, select, label')) piega(h, h.parentElement.classList.contains('chiusa')); });
document.addEventListener('keydown', e => { const h = e.target.closest?.('.testa-piega'); if (h && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); piega(h, h.parentElement.classList.contains('chiusa')); } });
// apre la sezione che contiene un elemento (serve anche alle prove automatiche)
function apriSezione(sel) { const c = document.querySelector(sel)?.closest('.piegabile'); const h = c?.querySelector(':scope > .testa-piega'); if (h && c.classList.contains('chiusa')) piega(h, true); }
applicaPieghe();
/* ============ Traduzione automatica di master e chat ============ */
// chi gioca in un'altra lingua sente il master nella sua lingua (voce del telefono)
const VOCI_LINGUA = { en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', it: 'it-IT' };
const altraLingua = () => OPZ.lingua && OPZ.lingua !== 'it';
function leggiTradotto(t) { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = VOCI_LINGUA[OPZ.lingua] || 'en-US'; const v = speechSynthesis.getVoices().find(x => x.lang?.startsWith(OPZ.lingua)); if (v) u.voice = v; speechSynthesis.speak(u); Report.log('voce-tradotta', { lingua: OPZ.lingua }); } catch (e) { Report.log('voce-tradotta', { errore: String(e).slice(0, 100) }); } }
function tradotto(t) { const x = OPZ.lingua && S.trad.get(t); return x ? `<p class="trad">🌐 ${esc(x)}</p>` : ''; }
function traduciTesto(t) {
  if (!OPZ.lingua || !t || S.trad.has(t)) return;
  S.trad.set(t, null); const id = 'q' + Math.random().toString(36).slice(2, 9);
  S.attesaTrad[id] = m => { if (m.errore) { S.trad.delete(t); if (S.daLeggere === t) { S.daLeggere = null; Narratore.parla(t); } return; } S.trad.set(t, m.testo); renderDiario(); if (S.daLeggere === t) { S.daLeggere = null; leggiTradotto(m.testo); } if ($('#narrTesto').textContent === t) { $('#narrTrad')?.remove(); $('#narrTesto').insertAdjacentHTML('afterend', `<p class="trad" id="narrTrad">🌐 ${esc(m.testo)}</p>`); } };
  invia({ t: 'traduci', id, testo: t, lingua: OPZ.lingua });
}
/* ============ Calendario delle serate ============ */
function renderSerate() {
  const box = $('#serate'); if (!box || !S.st) return;
  const l = S.st.serate || [], nomeDi = id => S.st.membri?.[id]?.nome || '?';
  const fmt = t => new Date(t).toLocaleString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  box.innerHTML = l.map(x => { const r = Object.entries(x.risposte || {}), si = r.filter(([, v]) => v).map(([id]) => esc(nomeDi(id))), no = r.filter(([, v]) => !v).map(([id]) => esc(nomeDi(id))), mia = x.risposte?.[S.io];
    return `<div class="serata"><strong>${esc(fmt(x.t))}</strong>${x.nota ? ` <span class="piccolo">${esc(x.nota)}</span>` : ''}<p class="piccolo">Ci sono: ${si.join(', ') || 'nessuno'}${no.length ? ` · Non ci sono: ${no.join(', ')}` : ''}</p>
      <div class="riga"><button type="button" data-serata="${x.id}" data-ci="1" class="${mia === true ? 'pieno' : ''}">Ci sono</button><button type="button" data-serata="${x.id}" data-ci="0" class="${mia === false ? 'pieno' : ''}">Non ci sono</button><button type="button" data-ics="${x.id}">📅 Promemoria</button>${capo() ? `<button type="button" class="testo-btn" data-serata-togli="${x.id}">Togli</button>` : ''}</div></div>`; }).join('') || '<p class="piccolo">Nessuna serata in programma.</p>';
  if ('PushManager' in window && me()?.ruolo !== 'spettatore') box.insertAdjacentHTML('beforeend', leggi('ta_push', false) ? '<p class="piccolo">🔔 Avvisi sul telefono attivi.</p>' : '<button type="button" id="btnAvvisi" class="largo">🔔 Avvisami sul telefono prima delle serate</button>');
  if (capo()) box.insertAdjacentHTML('beforeend', `<form class="colonna" id="formSerata" autocomplete="off"><input type="datetime-local" id="serataQuando" aria-label="Data e ora della serata"><div class="riga"><input id="serataNota" maxlength="120" placeholder="Nota (es. da Marco, alle 21)"><button class="pieno">Proponi</button></div></form>`);
}
// promemoria: un file .ics che il calendario del telefono apre, con avviso il giorno prima e un'ora prima
function scaricaIcs(x) {
  const d = t => new Date(t).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''), pulito = v => String(v || '').replace(/[\\,;\n]/g, ' ');
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Tavolo d Avventura//IT', 'BEGIN:VEVENT', `UID:${x.id}-${S.codice}@tavoloavventura`, `DTSTAMP:${d(Date.now())}`, `DTSTART:${d(x.t)}`, `DTEND:${d(x.t + 3 * 3600000)}`, `SUMMARY:D&D: ${pulito(S.st.campagna.nome)}`, `DESCRIPTION:${pulito(x.nota)} ${location.origin}${location.pathname}?c=${S.codice}`, 'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', 'DESCRIPTION:Domani si gioca a D&D', 'END:VALARM', 'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', 'DESCRIPTION:Tra un\'ora si gioca a D&D', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })), download: 'serata-dnd.ics' }); a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
$('#serate').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.id === 'btnAvvisi') { invia({ t: 'push_chiave' }); return; }
  if (b.dataset.serata) invia({ t: 'serata_risposta', id: b.dataset.serata, ci: b.dataset.ci === '1' });
  if (b.dataset.serataTogli) invia({ t: 'serata_togli', id: b.dataset.serataTogli });
  if (b.dataset.ics) { const x = (S.st.serate || []).find(y => y.id === b.dataset.ics); if (x) { scaricaIcs(x); Report.log('promemoria', {}); } }
});
$('#serate').addEventListener('submit', e => { e.preventDefault(); const v = $('#serataQuando').value; if (!v) { toast('Scegli giorno e ora', true); return; } invia({ t: 'serata_nuova', quando: new Date(v).toISOString(), nota: $('#serataNota').value.trim() }); });
async function attivaNotifiche(pub) {
  try {
    if (!pub) throw new Error('chiave mancante');
    if (await Notification.requestPermission() !== 'granted') { toast('Senza il permesso alle notifiche gli avvisi non possono arrivare', true); return; }
    const reg = await navigator.serviceWorker.ready, b = atob(pub.replace(/-/g, '+').replace(/_/g, '/')), chiave = Uint8Array.from(b, c => c.charCodeAt(0));
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chiave });
    invia({ t: 'push_iscrivi', endpoint: sub.endpoint });
  } catch (e) { Report.log('notifiche', { esito: 'errore', errore: String(e?.message || e).slice(0, 160) }); toast('Le notifiche non funzionano su questo telefono: usa il 📅 Promemoria', true); }
}
/* ============ Ricompense per la presenza: cornici del ritratto ============ */
const CORNICI = [[20, 'leggenda', 'Leggenda del tavolo'], [10, 'oro', 'Veterano d\'oro'], [6, 'argento', 'Compagno d\'argento'], [3, 'bronzo', 'Avventuriero di bronzo']];
function cornice(n) { return CORNICI.find(c => (n || 0) >= c[0]) || null; }
function renderPresenze() {
  const box = $('#presenze'); if (!box || !S.st) return;
  const n = me()?.presenze || 0, c = cornice(n), prossima = [...CORNICI].reverse().find(x => n < x[0]);
  box.innerHTML = `<div class="riga"><div class="av on ${c ? 'cornice-' + c[1] : ''}" style="background:${esc(me()?.colore || '#888')}">${esc((me()?.nome || '?').charAt(0).toUpperCase())}</div><div><strong>${c ? esc(c[2]) : 'Nuovo arrivato'}</strong><div class="piccolo">Serate giocate in questa campagna: ${n}</div></div></div>
    <p class="piccolo">${prossima ? `Ancora ${prossima[0] - n} ${prossima[0] - n === 1 ? 'serata' : 'serate'} per la cornice ${prossima[1]} (${esc(prossima[2])}).` : 'Hai la cornice più rara: sei una leggenda!'} Le cornici le vedono tutti intorno al tuo nome.</p>`;
}
/* ============ Note dei giocatori sulla mappa ============ */
function renderNoteMappa() {
  if (!S.st) return;
  const note = S.st.luogo && S.st.noteMappa?.luogo === S.st.luogo.id ? S.st.noteMappa.note || [] : [];
  if (S.st.luogo) Mappa.setExtra({ note });
  $('#noteMappaBox').hidden = !note.length; $('#noteMappaConta').textContent = note.length;
  $('#noteMappaLista').innerHTML = note.map(n => `<div class="mondo-riga"><span>📌 <strong>${esc(n.testo)}</strong> <span class="piccolo">${esc(n.nome)}</span></span>${n.chi === S.io || capo() ? `<button type="button" class="testo-btn" data-nota-togli="${esc(n.id)}">Togli</button>` : ''}</div>`).join('');
}
$('#noteMappaLista').addEventListener('click', e => { const b = e.target.closest('[data-nota-togli]'); if (b) invia({ t: 'nota_mappa', togli: b.dataset.notaTogli }); });
$('#btnNota').addEventListener('click', () => {
  if (!S.st?.luogo) { toast('Prima il gruppo deve essere in un luogo'); return; }
  toast('Tocca la casella dove mettere la nota');
  Mappa.chiediCasella((x, y) => { const t = prompt('Cosa scrivi sulla mappa? (es. trappola, porta chiusa, tesoro)'); if (t?.trim()) { invia({ t: 'nota_mappa', x, y, testo: t.trim().slice(0, 80) }); Report.log('nota_mappa', {}); } });
});
/* ============ Guida per chi non ha mai giocato ============ */
const GUIDA = [
  ['Cos\'è D&D', 'È una storia che costruite insieme. Ognuno interpreta un personaggio (un guerriero, una maga, un ladro…). Il master racconta il mondo e fa parlare tutti gli altri: mercanti, mostri, re. Non si vince contro gli altri: si gioca insieme.'],
  ['Come si gioca', 'Il master descrive la scena. Tu dici cosa fa il tuo personaggio, come se fossi lì: "mi avvicino alla porta e ascolto", "chiedo all\'oste se ha visto qualcuno". Puoi parlare a voce, scrivere nel Diario o usare il microfono.'],
  ['I dadi', 'Quando l\'esito è incerto si tira il dado a 20 facce (d20). Al numero si aggiunge un bonus della tua scheda: se il totale supera la difficoltà, ci riesci. 20 naturale è un successo straordinario, 1 un disastro. L\'app fa tutti i conti.'],
  ['La tua scheda', 'Nella Scheda ci sono punti ferita (la vita), classe armatura (quanto è difficile colpirti), caratteristiche e oggetti. Si aggiorna da sola: puoi dire "subisco 7 danni" o "trovo 50 monete" e cambia tutto.'],
  ['Il combattimento', 'Si gioca a turni, nell\'ordine di iniziativa. Nel tuo turno ti muovi sulla mappa e fai un\'azione: attacchi, lanci un incantesimo, aiuti un amico, bevi una pozione. L\'app ti avvisa quando tocca a te.'],
  ['Un consiglio', 'Non esistono mosse sbagliate: le idee strane spesso sono le migliori. Fai domande al master, parla con i personaggi, aiuta gli altri. E se non sai una regola, chiedila nel Diario: risponde l\'app.']
];
async function guida() {
  Report.log('guida', {});
  for (let i = 0; i < GUIDA.length; i++) {
    const r = await chiedi(`<p class="piccolo">${i + 1} di ${GUIDA.length}</p><h2>${esc(GUIDA[i][0])}</h2><p>${esc(GUIDA[i][1])}</p>`, i < GUIDA.length - 1 ? [{ testo: 'Avanti', pieno: true }, { testo: 'Chiudi' }] : [{ testo: 'Ho capito, giochiamo!', pieno: true }]);
    if (r !== 0) return;
  }
}
$('#btnGuida').addEventListener('click', guida);
document.addEventListener('click', e => { if (e.target.closest('[data-guida]')) guida(); });
document.addEventListener('click', e => { if (e.target.closest('[data-invito-guida]')) { scrivi('ta_guida_vista', true); $('#invitoGuida').hidden = true; } });

/* ============ 20 NATURALE: momento epico ============ */
function momentoEpico(tiro) {
  const chi = S.st.pg?.[tiro.chi]?.nome || S.st.membri?.[tiro.chi]?.nome || 'Qualcuno';
  const el = document.createElement('div'); el.className = 'epico';
  el.innerHTML = `<div><b>20</b><span>naturale!</span><small>${esc(chi)}${tiro.motivo ? ' · ' + esc(tiro.motivo) : ''}</small></div>`;
  document.body.appendChild(el); setTimeout(() => el.remove(), 2600);
  Suoni.effetto('raro'); vibra([60, 40, 120]);
}

/* ============ Tavola dei suoni del master ============ */
document.addEventListener('click', e => { const b = e.target.closest('[data-suono]'); if (b) invia({ t: 'suono', nome: b.dataset.suono }); });

/* ============ Dadi personalizzati ============ */
if ($('#optDadiColore')) {
  $('#optDadiColore').value = OPZ.dadiColore || '#b8433a'; $('#optDadiMateriale').value = OPZ.dadiMateriale || 'lucido';
  $('#optDadiColore').addEventListener('change', e => { OPZ.dadiColore = e.target.value; scrivi('ta_opzioni', OPZ); });
  $('#optDadiMateriale').addEventListener('change', e => { OPZ.dadiMateriale = e.target.value; scrivi('ta_opzioni', OPZ); });
  $('#btnProvaDadi').addEventListener('click', () => import('./dadi3d.js').then(d => d.lancia({ formula: '1d20', dadi: [1 + Math.floor(Math.random() * 20)] }, { colore: OPZ.dadiColore, materiale: OPZ.dadiMateriale })));
}

/* ============ Controller (gamepad): si attiva da solo quando l'app ne vede uno ============ */
const Pad = (() => {
  let attivo = false, prima = {}, ultimoPasso = 0;
  const VISTE = ['vMappa', 'vScheda', 'vDadi', 'vDiario', 'vAltro'];
  const premuto = (p, i) => !!p.buttons[i]?.pressed;
  function giro() {
    const p = [...(navigator.getGamepads?.() || [])].find(Boolean);
    if (!p) { attivo = false; return; }
    requestAnimationFrame(giro);
    const ora = performance.now(), b = i => premuto(p, i) && !prima[i];
    // croce o levetta sinistra: muove il mio segnalino di una casella (gira intorno ai muri come col dito)
    const dx = (premuto(p, 15) ? 1 : premuto(p, 14) ? -1 : 0) || (Math.abs(p.axes[0]) > 0.6 ? Math.sign(p.axes[0]) : 0);
    const dy = (premuto(p, 13) ? 1 : premuto(p, 12) ? -1 : 0) || (Math.abs(p.axes[1]) > 0.6 ? Math.sign(p.axes[1]) : 0);
    const s = S.st?.segnalini?.[S.io];
    if ((dx || dy) && s && ora - ultimoPasso > 220) { ultimoPasso = ora; Mappa.azioneCasella(s.x + dx, s.y + dy, false); }
    if (b(0)) { const tira = $('#richiesta:not([hidden]) button'); if (tira) tira.click(); else if ($('#dlg').open) $('#dlgAzioni button')?.click(); else $('#dadiTasti button[data-f="20"]')?.click(); } // A: tira o conferma
    if (b(1) && $('#dlg').open) $('#dlg').close(); // B: chiude
    if (b(4) || b(5)) { const i = VISTE.indexOf(S.vista), j = (i + (b(5) ? 1 : VISTE.length - 1)) % VISTE.length; $(`#nav button[data-v="${VISTE[j]}"]`)?.click(); } // dorsali: scheda dopo/prima
    if (b(3)) $('#btnZoomTutta')?.click(); // Y: tutta la mappa
    const x = premuto(p, 2); if (x !== !!prima[2]) $('#btnParla')?.dispatchEvent(new PointerEvent(x ? 'pointerdown' : 'pointerup', { bubbles: true })); // X tenuto: parla
    prima = Object.fromEntries(p.buttons.map((v, i) => [i, v.pressed]));
  }
  addEventListener('gamepadconnected', e => { if (attivo) return; attivo = true; toast(`🎮 Controller collegato: croce per muoverti, A tira, X tenuto per parlare, dorsali per cambiare scheda`); Report.log('controller', { id: e.gamepad.id.slice(0, 60) }); giro(); });
  addEventListener('gamepaddisconnected', () => toast('Controller scollegato'));
  return { get attivo() { return attivo; } };
})();

/* ============ Diario: galleria dei PNG e memoriale dei caduti ============ */
function renderDiarioExtra() {
  renderCarte();
  const png = Object.entries(S.st?.png || {}).sort((a, b) => (b[1].t || 0) - (a[1].t || 0));
  const g = $('#galleriaPng'); if (g) { g.hidden = !png.length; $('#galleriaPngLista').innerHTML = png.map(([nome, p]) => { const v = S.st.volti?.[nome];
    return `<div class="carta-png">${v ? `<img src="${urlMedia('img', v)}" alt="" class="volto-png" onerror="this.outerHTML=Ritratto.volto(${esc(JSON.stringify(nome))}, 64)">` : Ritratto.volto(nome, 64)}<div><strong>${esc(nome)}</strong>${p.luogo ? `<div class="piccolo">Incontrato a ${esc(p.luogo)}</div>` : ''}${(p.legami || []).length ? `<div class="piccolo">🔗 ${p.legami.map(l => `${esc(l.tipo)} di ${esc(l.con)}`).join(', ')}</div>` : ''}${p.novita ? `<div class="piccolo">🕯️ Nel frattempo: ${esc(p.novita)}</div>` : ''}${(p.note || []).map(n => `<div class="piccolo">• ${esc(n)}</div>`).join('')}</div></div>`; }).join(''); $('#galleriaPngConta').textContent = png.length; }
  const mem = S.st?.memoriale || [], mm = $('#memoriale'); if (mm) { mm.hidden = !mem.length; $('#memorialeLista').innerHTML = [...mem].reverse().map(c => `<div class="caduto"><strong>✝ ${esc(c.nome)}</strong> <span class="piccolo">${esc(c.razza || '')} ${esc(c.classe || '')}, livello ${c.livello || 1} · ${new Date(c.t).toLocaleDateString('it-IT')}</span>${c.motivo ? `<p class="piccolo">${esc(c.motivo)}</p>` : ''}${(c.imprese || []).length ? `<ul class="piccolo">${c.imprese.map(i => `<li>${esc(i)}</li>`).join('')}</ul>` : ''}</div>`).join(''); }
}
/* ============ Bentornato: cosa ti sei perso ============ */
function mostraBentornato(rie) {
  if (!rie?.length) return;
  chiedi(`<h2>Bentornato!</h2><p class="piccolo">Mentre eri via il gruppo ha giocato ${rie.length === 1 ? 'una serata' : rie.length + ' serate'}. Ecco cosa ti sei perso:</p>${rie.map(r => `<h3>${esc(r.titolo)}</h3>${r.img ? `<img src="${urlMedia('img', r.img)}" alt="" style="width:100%;border-radius:10px">` : ''}<p style="white-space:pre-wrap">${esc(r.racconto)}</p>`).join('')}`, [{ testo: 'Torniamo a giocare', pieno: true }]);
  if (OPZ.narratore && rie[rie.length - 1].racconto) Narratore.parla(rie[rie.length - 1].racconto);
  Report.log('bentornato', { serate: rie.length });
}
/* ============ Cartolina della serata: immagine ricordo da mandare sul gruppo ============ */
async function cartolina(r) {
  const W = 1080, H = 1350, c = Object.assign(document.createElement('canvas'), { width: W, height: H }), k = c.getContext('2d');
  const g = k.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2b2018'); g.addColorStop(1, '#120e0b'); k.fillStyle = g; k.fillRect(0, 0, W, H);
  k.strokeStyle = '#d9a441'; k.lineWidth = 10; k.strokeRect(24, 24, W - 48, H - 48);
  const carica = src => new Promise(res => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
  if (r.img) { const im = await carica(urlMedia('img', r.img)); if (im) { const lato = W - 120; k.drawImage(im, 60, 60, lato, lato * 0.62); k.strokeStyle = 'rgba(217,164,65,.7)'; k.lineWidth = 4; k.strokeRect(60, 60, lato, lato * 0.62); } }
  k.fillStyle = '#f0c46a'; k.textAlign = 'center'; k.font = '700 58px Cinzel, Georgia, serif';
  const testoA = (t, y, max, font, col, alt) => { k.font = font; k.fillStyle = col; const parole = String(t).split(' '); let riga = '', yy = y; for (const p of parole) { if (k.measureText(riga + p).width > max) { k.fillText(riga.trim(), W / 2, yy); riga = ''; yy += alt; } riga += p + ' '; } k.fillText(riga.trim(), W / 2, yy); return yy; };
  const px = stileGioco(); if (px) await document.fonts.load('64px "Jersey 15"').catch(() => {}); // con l'aspetto da videogioco anche la cartolina usa le scritte in pixel
  let y = testoA(r.titolo, 700, W - 160, px ? '400 76px "Jersey 15", Georgia, serif' : '700 56px Cinzel, Georgia, serif', '#f0c46a', px ? 72 : 64);
  const momento = (r.racconto || '').split(/(?<=[.!?])\s/)[0];
  y = testoA('«' + momento + '»', y + 70, W - 200, 'italic 34px Georgia, serif', '#f3ead9', 44);
  const trofeo = (r.stats?.trofei || [])[0]; if (trofeo && y < H - 380) testoA(`🏆 ${trofeo.titolo}: ${trofeo.chi}`, y + 40, W - 200, px ? '400 40px "Jersey 15", sans-serif' : '600 28px Inter, sans-serif', '#d9a441', 40);
  const pgs = Object.values(S.st.pg || {}).slice(0, 6), passo = (W - 120) / Math.max(1, pgs.length);
  for (const [i, p] of pgs.entries()) {
    const cx = 60 + passo * i + passo / 2, quadro = p.ritratto ? await carica(urlMedia('img', p.ritratto)) : null; // il ritratto illustrato, se c'è; se no la figura in pixel
    if (quadro) { k.save(); k.beginPath(); k.arc(cx, H - 240, 62, 0, Math.PI * 2); k.clip(); const s2 = Math.max(124 / quadro.width, 124 / quadro.height); k.drawImage(quadro, cx - quadro.width * s2 / 2, H - 302, quadro.width * s2, quadro.height * s2); k.restore(); k.strokeStyle = '#d9a441'; k.lineWidth = 4; k.beginPath(); k.arc(cx, H - 240, 62, 0, Math.PI * 2); k.stroke(); }
    else { const svg = Ritratto.svg(p, { dim: 120 }).replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"'); const im = await carica('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)); if (im) k.drawImage(im, cx - 60, H - 300, 120, 120); }
    k.font = px ? '400 36px "Jersey 15", sans-serif' : '600 26px Inter, sans-serif'; k.fillStyle = '#f3ead9'; k.fillText(p.nome.split(' ')[0], cx, H - 150);
  }
  k.font = '500 26px Inter, sans-serif'; k.fillStyle = '#bcae96'; k.fillText(`${S.st.campagna.nome} · ${new Date(r.t || Date.now()).toLocaleDateString('it-IT')}`, W / 2, H - 70);
  const blob = await new Promise(res => c.toBlob(res, 'image/png'));
  const file = new File([blob], 'cartolina.png', { type: 'image/png' });
  try { if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: r.titolo }); return; } } catch {}
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'cartolina.png' }); a.click();
  Report.log('cartolina', { titolo: r.titolo });
}
