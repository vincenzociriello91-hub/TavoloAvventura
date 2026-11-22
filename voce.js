/* Voce: chat vocale tra i giocatori (WebRTC, da telefono a telefono), ascolto dei comandi (riconoscimento vocale
   del browser) e narratore che legge ad alta voce il master e i PNG. L'audio non viene mai registrato né salvato. */
const Voce = (() => {
  const ICE = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] }];
  let stream = null, io = null, invia = () => {}, muto = false, log = () => {}, onParlante = () => {}, onStato = () => {};
  const peers = {}; const analisi = {}; const iceInAttesa = {};
  let actx = null, risolviMicro; const microPronto = new Promise(r => { risolviMicro = r; });

  async function avvia(opz) {
    io = opz.io; invia = opz.invia; log = opz.log || log; onParlante = opz.onParlante || onParlante; onStato = opz.onStato || onStato;
    if (stream) return true;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      stream.getAudioTracks().forEach(t => t.enabled = !muto);
      analizza(io, stream);
      log('microfono', { ok: true });
      risolviMicro();
      return true;
    } catch (e) { risolviMicro(); log('microfono', { ok: false, errore: e.name }); onStato('Microfono non disponibile: ' + (e.name === 'NotAllowedError' ? 'permesso negato' : e.message)); return false; }
  }
  function collegaTutti(online) { for (const id of online) if (id !== io && !peers[id] && io < id) crea(id, true); }
  function crea(id, iniziatore) {
    if (peers[id]) chiudi(id);
    const pc = new RTCPeerConnection({ iceServers: ICE });
    peers[id] = { pc, audio: null };
    if (stream) stream.getTracks().forEach(t => pc.addTrack(t, stream));
    else pc.addTransceiver('audio', { direction: 'recvonly' });
    pc.onicecandidate = e => { if (e.candidate) invia({ t: 'rtc', a: id, dati: { tipo: 'ice', c: e.candidate } }); };
    pc.ontrack = e => {
      let el = peers[id]?.audio;
      if (!el) { el = document.createElement('audio'); el.autoplay = true; el.playsInline = true; document.body.append(el); if (peers[id]) peers[id].audio = el; }
      el.srcObject = e.streams[0]; el.play().catch(() => onStato('Tocca lo schermo per attivare l\'audio'));
      analizza(id, e.streams[0]);
    };
    pc.onconnectionstatechange = () => { log('voce-collegamento', { con: id, stato: pc.connectionState }); onStato(); if (pc.connectionState === 'failed') { chiudi(id); if (io < id) setTimeout(() => crea(id, true), 2000); } };
    if (iniziatore) pc.createOffer().then(o => pc.setLocalDescription(o)).then(() => invia({ t: 'rtc', a: id, dati: { tipo: 'offerta', sdp: pc.localDescription } })).catch(e => log('voce-errore', { msg: e.message }));
    return pc;
  }
  async function segnale(da, dati) {
    try {
      if (dati.tipo === 'offerta') {
        // aspetta il proprio microfono (al massimo 8 s), così l'audio parte in entrambe le direzioni
        await Promise.race([microPronto, new Promise(r => setTimeout(r, 8000))]);
        const pc = crea(da, false);
        peers[da].attesa = iceInAttesa[da] || []; delete iceInAttesa[da];
        await pc.setRemoteDescription(dati.sdp);
        await pc.setLocalDescription(await pc.createAnswer());
        invia({ t: 'rtc', a: da, dati: { tipo: 'risposta', sdp: pc.localDescription } });
        for (const c of peers[da].attesa || []) await pc.addIceCandidate(c).catch(() => {});
      } else if (dati.tipo === 'risposta') { const p = peers[da]; if (p) { await p.pc.setRemoteDescription(dati.sdp); for (const c of p.attesa || []) await p.pc.addIceCandidate(c).catch(() => {}); p.attesa = []; } }
      else if (dati.tipo === 'ice') {
        const p = peers[da];
        if (p && p.pc.remoteDescription) await p.pc.addIceCandidate(dati.c).catch(() => {});
        else if (p) (p.attesa = p.attesa || []).push(dati.c);
        else (iceInAttesa[da] = iceInAttesa[da] || []).push(dati.c);
      }
    } catch (e) { log('voce-errore', { msg: e.message, tipo: dati.tipo }); }
  }
  function chiudi(id) { const p = peers[id]; if (!p) return; try { p.pc.close(); } catch {} p.audio?.remove(); delete peers[id]; delete analisi[id]; onParlante(id, false); }
  function setMuto(b) { muto = b; stream?.getAudioTracks().forEach(t => t.enabled = !b); }
  function stato() { return Object.fromEntries(Object.entries(peers).map(([id, p]) => [id, p.pc.connectionState])); }
  function analizza(id, s) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume().catch(() => {});
      const src = actx.createMediaStreamSource(s); const an = actx.createAnalyser(); an.fftSize = 512; src.connect(an);
      const buf = new Uint8Array(an.fftSize); let parla = false, ultimo = 0;
      analisi[id] = true;
      const giro = () => {
        if (!analisi[id]) return;
        an.getByteTimeDomainData(buf); let s2 = 0; for (const v of buf) { const d = (v - 128) / 128; s2 += d * d; }
        const rms = Math.sqrt(s2 / buf.length), ora = performance.now();
        if (rms > 0.035) ultimo = ora;
        const p = ora - ultimo < 300 && !(id === io && muto);
        if (p !== parla) { parla = p; onParlante(id, p); }
        if (id === '__prova') Voce.livelloProva = Math.max(Voce.livelloProva || 0, rms);
        requestAnimationFrame(giro);
      };
      giro();
    } catch {}
  }
  function riattivaAudio() { actx?.resume?.().catch(() => {}); Object.values(peers).forEach(p => p.audio?.play().catch(() => {})); }
  return { avvia, collegaTutti, crea, segnale, chiudi, setMuto, stato, riattivaAudio, get muto() { return muto; }, get attivo() { return !!stream; }, analizza };
})();

/* Ascolto dei comandi e delle frasi per il master (riconoscimento vocale del browser, italiano). */
const Ascolto = (() => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null, attivo = false, inPausa = false, onFrase = () => {}, onParziale = () => {}, onStato = () => {}, log = () => {};
  function supportato() { return !!SR; }
  function avvia(opz) {
    onFrase = opz.onFrase || onFrase; onParziale = opz.onParziale || onParziale; onStato = opz.onStato || onStato; log = opz.log || log;
    if (!SR) { onStato('Il riconoscimento vocale non è disponibile su questo browser: usa Chrome'); return false; }
    attivo = true; parti(); return true;
  }
  function parti() {
    if (!attivo || inPausa || rec) return;
    rec = new SR(); rec.lang = 'it-IT'; rec.continuous = true; rec.interimResults = true; rec.maxAlternatives = 1;
    rec.onresult = e => {
      let parziale = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) { const t = r[0].transcript.trim(); if (t) onFrase(t, r[0].confidence); }
        else parziale += r[0].transcript;
      }
      onParziale(parziale);
    };
    rec.onerror = e => { log('ascolto-errore', { errore: e.error }); if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { attivo = false; onStato('Permesso del microfono negato per i comandi vocali'); } };
    rec.onend = () => { rec = null; onParziale(''); if (attivo && !inPausa) setTimeout(parti, 250); };
    try { rec.start(); onStato(); } catch { rec = null; setTimeout(parti, 1000); }
  }
  function ferma() { attivo = false; try { rec?.stop(); } catch {} rec = null; onStato(); }
  function pausa(b) { inPausa = b; if (b) { try { rec?.abort(); } catch {} rec = null; } else parti(); }
  return { supportato, avvia, ferma, pausa, get attivo() { return attivo; } };
})();

/* Narratore: legge ad alta voce il master e i PNG, ognuno con un timbro diverso; avvisi brevi in cuffia. */
const Narratore = (() => {
  let attivo = true, voce = null, coda = [], parlando = false, onInizio = () => {}, onFine = () => {};
  function scegliVoce() {
    const v = speechSynthesis.getVoices().filter(v => /^it/i.test(v.lang));
    voce = v.find(x => /google/i.test(x.name)) || v[0] || null;
  }
  if ('speechSynthesis' in window) { scegliVoce(); speechSynthesis.onvoiceschanged = scegliVoce; }
  const hash = s => [...String(s || '')].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  function parla(testo, opz = {}) {
    if (!attivo || !('speechSynthesis' in window) || !testo) return;
    coda.push({ testo, opz }); if (!parlando) prossimo();
  }
  function prossimo() {
    const el = coda.shift(); if (!el) { parlando = false; onFine(); return; }
    parlando = true; onInizio();
    const u = new SpeechSynthesisUtterance(el.testo);
    u.lang = 'it-IT'; if (voce) u.voice = voce;
    const h = el.opz.png ? hash(el.opz.png) : 0;
    u.pitch = el.opz.avviso ? 1.15 : el.opz.png ? 0.7 + (h % 70) / 100 : 0.92;
    u.rate = el.opz.avviso ? 1.15 : el.opz.png ? 0.92 + (h % 25) / 100 : 1.0;
    u.onend = u.onerror = () => setTimeout(prossimo, 120);
    speechSynthesis.speak(u);
  }
  function zitto() { coda = []; try { speechSynthesis.cancel(); } catch {} parlando = false; onFine(); }
  return { parla, zitto, avviso: t => parla(t, { avviso: true }), set attivo(b) { attivo = b; if (!b) zitto(); }, get attivo() { return attivo; }, set onInizio(f) { onInizio = f; }, set onFine(f) { onFine = f; }, get parlando() { return parlando; } };
})();
