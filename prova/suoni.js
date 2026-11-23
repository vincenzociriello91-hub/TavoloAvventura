/* Musica e suoni d'ambiente generati dal browser (Web Audio): nessun file audio da scaricare o da licenziare.
   La scena cambia da sola col luogo (taverna, dungeon, foresta...) e col combattimento; effetti per dadi e livelli. */
const Suoni = (() => {
  let ctx = null, bus = null, attivo = false, volume = 0.5, scena = null, nodi = [], timer = [], gainScena = null;
  // volumi separati: musica e ambiente da una parte, effetti dall'altra (la voce del master è in voce.js)
  let vm = 1, ve = 1, busAmb = null, fx = null, giu = 1;
  // strati della scena (dai Varchi): meteo e fuoco vicino, separati dalla musica del luogo
  let amb = { meteo: '', esterno: false, fuoco: 0 }, gMeteo = null, gFuoco = null, nodiAmb = [], timerAmb = [], meteoAttivo = '';
  const PENTA = [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3];
  function avvia() {
    if (!ctx) { ctx = new (window.AudioContext || window.webkitAudioContext)(); bus = ctx.createGain(); bus.gain.value = volume * 0.5; bus.connect(ctx.destination); busAmb = ctx.createGain(); busAmb.gain.value = vm; busAmb.connect(bus); fx = ctx.createGain(); fx.gain.value = ve; fx.connect(bus); }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  }
  function bufRumore() { const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = b.getChannelData(0); let ult = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; ult = (ult + 0.02 * w) / 1.02; d[i] = ult * 3.5; } return b; }
  function bufBianco() { const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; }
  function rumore(tipoFiltro, freq, q, g, uscita, bianco) {
    const src = ctx.createBufferSource(); src.buffer = bianco ? bufBianco() : bufRumore(); src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = tipoFiltro; f.frequency.value = freq; f.Q.value = q;
    const gn = ctx.createGain(); gn.gain.value = g;
    src.connect(f).connect(gn).connect(uscita); src.start(); nodi.push(src);
    return gn;
  }
  function drone(freq, g, uscita, tipo = 'sine') { const o = ctx.createOscillator(); o.type = tipo; o.frequency.value = freq; const gn = ctx.createGain(); gn.gain.value = g; o.connect(gn).connect(uscita); o.start(); nodi.push(o); return gn; }
  function nota(freq, durata, tipo = 'triangle', g = 0.08, uscita = bus, quando = 0, scivola) {
    if (!ctx) return;
    const t = ctx.currentTime + quando, o = ctx.createOscillator(), gn = ctx.createGain();
    o.type = tipo; o.frequency.setValueAtTime(freq, t); if (scivola) o.frequency.exponentialRampToValueAtTime(scivola, t + durata);
    gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(g, t + 0.01); gn.gain.exponentialRampToValueAtTime(0.0001, t + durata);
    o.connect(gn).connect(uscita); o.start(t); o.stop(t + durata + 0.05);
  }
  function ogni(min, max, fn) { const giro = () => { if (!attivo) return; fn(); timer.push(setTimeout(giro, min + Math.random() * (max - min))); }; timer.push(setTimeout(giro, min * Math.random())); }
  const SCENE = {
    taverna: u => { rumore('bandpass', 450, 0.8, 0.08, u); ogni(900, 2600, () => { const f = PENTA[Math.floor(Math.random() * PENTA.length)]; nota(f, 0.9, 'triangle', 0.05, u); nota(f * 1.5, 0.6, 'sine', 0.02, u, 0.05); }); },
    dungeon: u => { drone(55, 0.05, u); drone(82.4, 0.03, u); ogni(2000, 5000, () => nota(1800 + Math.random() * 600, 0.25, 'sine', 0.05, u, 0, 700)); },
    grotta: u => { drone(49, 0.05, u); rumore('lowpass', 200, 0.5, 0.03, u); ogni(1500, 4000, () => nota(1500 + Math.random() * 900, 0.3, 'sine', 0.06, u, 0, 500)); },
    foresta: u => { rumore('lowpass', 600, 0.3, 0.05, u); ogni(1500, 4500, () => { const f = 2200 + Math.random() * 1400; nota(f, 0.12, 'sine', 0.04, u, 0, f * 1.3); nota(f * 1.1, 0.1, 'sine', 0.03, u, 0.15, f * 1.4); }); },
    citta: u => { rumore('bandpass', 700, 0.6, 0.06, u); ogni(12000, 20000, () => [0, 0.9].forEach(d => nota(392, 2.5, 'sine', 0.05, u, d))); },
    villaggio: u => { rumore('lowpass', 500, 0.4, 0.04, u); ogni(2500, 6000, () => nota(2600, 0.1, 'sine', 0.03, u, 0, 3200)); },
    porto: u => { const onde = rumore('lowpass', 500, 0.4, 0.07, u); const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.12; lg.gain.value = 0.05; lfo.connect(lg).connect(onde.gain); lfo.start(); nodi.push(lfo); ogni(5000, 11000, () => nota(950, 0.5, 'sawtooth', 0.015, u, 0, 620)); },
    castello: u => { drone(65.4, 0.04, u); drone(98, 0.025, u, 'triangle'); ogni(14000, 24000, () => [0, 0.5, 1].forEach((d, i) => nota([220, 277, 330][i], 1.1, 'sawtooth', 0.02, u, d))); },
    aperto: u => { rumore('lowpass', 400, 0.3, 0.035, u); ogni(4000, 9000, () => nota(2400, 0.12, 'sine', 0.03, u, 0, 3000)); },
    interno: u => { rumore('lowpass', 250, 0.3, 0.02, u); ogni(6000, 14000, () => nota(140, 0.4, 'square', 0.01, u, 0, 90)); },
    combattimento: u => { drone(73.4, 0.04, u, 'sawtooth'); let k = 0; ogni(420, 440, () => { nota(k % 4 === 0 ? 55 : 70, 0.25, 'sine', k % 4 === 0 ? 0.22 : 0.12, u, 0, 40); k++; }); }
  };
  // musica vera (JP Soundworks, CC BY 4.0): un brano per scena, con dissolvenza; i suoni generati restano sotto, più bassi
  const BRANI = { taverna: 'taverna', dungeon: 'dungeon', grotta: 'dungeon', combattimento: 'fantasy_combattimento', boss: 'fantasy_boss', interno: 'taverna' };
  let brano = null, nomeBrano = '', notte = false;
  function suonaBrano(nome) {
    const file = BRANI[nome] || (notte ? 'notte' : 'fantasy');
    if (file === nomeBrano) return;
    nomeBrano = file;
    const vecchio = brano, nuovo = new Audio('audio/musica/' + file + '.ogg'); nuovo.loop = true; nuovo.volume = 0;
    nuovo.play().catch(() => {}); brano = nuovo;
    let k = 0; const giro = setInterval(() => { k++; nuovo.volume = Math.min(1, k / 20) * volume * 0.45 * vm * giu; if (vecchio) vecchio.volume = Math.max(0, (1 - k / 20) * volume * 0.45 * vm * giu); if (k >= 20) { clearInterval(giro); if (vecchio) { vecchio.pause(); vecchio.src = ''; } } }, 100);
  }
  function fermaBrano() { if (brano) { brano.pause(); brano.src = ''; brano = null; } nomeBrano = ''; }
  const CAMPIONI = ['colpo', 'critico', 'ferito', 'livello', 'magia', 'monete', 'porta', 'pozione', 'raro', 'sconfitta', 'successo', 'tocco', 'vittoria'];
  function campione(nome, g = 0.8) { if (!CAMPIONI.includes(nome)) return false; const a = new Audio('audio/effetti/' + nome + '.ogg'); a.volume = Math.min(1, volume * g * ve); a.play().catch(() => {}); return true; }
  SCENE.boss = SCENE.combattimento;
  function cambiaScena(nome) {
    if (attivo) suonaBrano(nome);
    if (!attivo || !ctx || nome === scena) return;
    const vecchi = nodi, vecchio = gainScena; nodi = []; timer.forEach(clearTimeout); timer = [];
    if (vecchio) { vecchio.gain.setTargetAtTime(0, ctx.currentTime, 0.4); setTimeout(() => { vecchi.forEach(n => { try { n.stop(); } catch {} }); vecchio.disconnect(); }, 2000); }
    scena = nome;
    if (!SCENE[nome]) return;
    gainScena = ctx.createGain(); gainScena.gain.value = 0; gainScena.connect(busAmb); gainScena.gain.setTargetAtTime(0.45, ctx.currentTime, 0.8);
    SCENE[nome](gainScena);
  }
  // colpo di rumore breve (gocce, scoppiettii, tuono)
  function botto(freq, durata, g, uscita = bus, quando = 0) {
    if (!ctx) return;
    const t = ctx.currentTime + quando, src = ctx.createBufferSource(); src.buffer = bufBianco();
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq;
    const gn = ctx.createGain(); gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(g, t + 0.01); gn.gain.exponentialRampToValueAtTime(0.0001, t + durata);
    src.connect(f).connect(gn).connect(uscita); src.start(t); src.stop(t + durata + 0.05);
  }
  function ogniAmb(min, max, fn) { const giro = () => { if (!attivo) return; fn(); timerAmb.push(setTimeout(giro, min + Math.random() * (max - min))); }; timerAmb.push(setTimeout(giro, min * Math.random())); }
  function aggiornaAmbiente() {
    if (!attivo || !ctx) return;
    const m = amb.esterno ? amb.meteo : '';
    if (m !== meteoAttivo) {
      nodiAmb.forEach(n => { try { n.stop(); } catch {} }); nodiAmb = []; timerAmb.forEach(clearTimeout); timerAmb = [];
      gMeteo?.disconnect(); gMeteo = ctx.createGain(); gMeteo.gain.value = 0; gMeteo.connect(busAmb); gMeteo.gain.setTargetAtTime(1, ctx.currentTime, 1);
      const pr = nodi.length; // rumore() mette i nodi in "nodi": li spostiamo negli strati dell'ambiente
      if (m === 'pioggia' || m === 'temporale') {
        rumore('highpass', 1200, 0.3, m === 'temporale' ? 0.16 : 0.1, gMeteo, true);
        rumore('lowpass', 500, 0.5, m === 'temporale' ? 0.1 : 0.05, gMeteo);
        ogniAmb(60, 220, () => botto(3000 + Math.random() * 3000, 0.04, 0.05, gMeteo));
      } else if (m === 'neve' || m === 'nebbia') {
        const vento = rumore('bandpass', 380, 0.6, 0.06, gMeteo);
        const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.08; lg.gain.value = 0.04; lfo.connect(lg).connect(vento.gain); lfo.start(); nodi.push(lfo);
      }
      nodiAmb = nodi.splice(pr);
      meteoAttivo = m;
    }
    if (!gFuoco) {
      gFuoco = ctx.createGain(); gFuoco.gain.value = 0; gFuoco.connect(busAmb);
      const pr = nodi.length; rumore('lowpass', 900, 0.4, 0.14, gFuoco); nodiAmb.push(...nodi.splice(pr));
      ogniAmb(90, 400, () => { if (amb.fuoco > 0.05) botto(1500 + Math.random() * 2500, 0.03 + Math.random() * 0.05, 0.12 * amb.fuoco, gFuoco); });
    }
    gFuoco.gain.setTargetAtTime(Math.min(1, amb.fuoco) * 0.9, ctx.currentTime, 0.6);
  }
  function ambiente(a) { amb = { ...amb, ...a }; if (attivo && a.notte !== undefined && a.notte !== notte) { notte = a.notte; if (!BRANI[scena]) { nomeBrano = ''; suonaBrano(scena); } } aggiornaAmbiente(); }
  function effetto(tipo) {
    if (!attivo || !ctx) return;
    if (tipo === 'tuono') { const r = 0.4 + Math.random() * 1.6; botto(180, 2.8, 0.5, fx, r); botto(90, 3.5, 0.4, fx, r + 0.15); return; }
    if (tipo === 'tocco') { campione('tocco', 0.3); return; }
    if (tipo === 'critico' && campione('critico')) return;
    if (tipo === 'livello' && campione('livello')) return;
    if (campione(tipo)) return;
    if (tipo === 'dado') for (let i = 0; i < 4; i++) nota(300 + Math.random() * 500, 0.05, 'square', 0.04, fx, i * 0.07);
    if (tipo === 'critico') [523, 659, 784, 1047].forEach((f, i) => nota(f, 0.35, 'triangle', 0.09, fx, i * 0.09));
    if (tipo === 'fallimento') [392, 330, 262, 196].forEach((f, i) => nota(f, 0.4, 'sawtooth', 0.04, fx, i * 0.12));
    if (tipo === 'livello') [523, 659, 784].forEach(f => nota(f, 1.4, 'sine', 0.06, fx, 0));
    if (tipo === 'turno') nota(880, 0.6, 'sine', 0.07, fx);
    if (tipo === 'impatto') { botto(240, 0.16, 0.5, fx); nota(110, 0.14, 'sine', 0.22, fx, 0, 50); }
    if (tipo === 'fruscio') botto(5200, 0.12, 0.08, fx);
    if (tipo === 'scintilla') [1320, 1760, 2090].forEach((f, i) => nota(f, 0.18, 'sine', 0.05, fx, i * 0.05));
    if (tipo === 'cura') [523, 659, 784, 1047].forEach((f, i) => nota(f, 0.5, 'sine', 0.05, fx, i * 0.08));
    if (tipo === 'striscione') { nota(196, 0.5, 'sawtooth', 0.05, fx, 0, 392); botto(800, 0.4, 0.12, fx); }
  }
  // musica e ambiente si abbassano per un attimo: il colpo si sente senza alzare il volume
  function abbassa(ms = 500) {
    if (!attivo || !ctx) return;
    giu = 0.5; if (brano) brano.volume = volume * 0.45 * vm * giu;
    busAmb.gain.setTargetAtTime(vm * 0.5, ctx.currentTime, 0.02);
    clearTimeout(abbassa._t); abbassa._t = setTimeout(() => { giu = 1; if (brano) brano.volume = volume * 0.45 * vm; if (busAmb) busAmb.gain.setTargetAtTime(vm, ctx.currentTime, 0.12); }, ms);
  }
  return {
    avvia, effetto, ambiente, abbassa,
    scena: n => cambiaScena(n),
    set attivo(b) { attivo = b; if (b) { avvia(); const s = scena; scena = null; cambiaScena(s || 'aperto'); meteoAttivo = null; aggiornaAmbiente(); } else { fermaBrano(); timer.forEach(clearTimeout); timer = []; nodi.forEach(n => { try { n.stop(); } catch {} }); nodi = []; gainScena?.disconnect(); gainScena = null; nodiAmb.forEach(n => { try { n.stop(); } catch {} }); nodiAmb = []; timerAmb.forEach(clearTimeout); timerAmb = []; gMeteo?.disconnect(); gMeteo = null; gFuoco?.disconnect(); gFuoco = null; meteoAttivo = ''; } },
    get attivo() { return attivo; },
    set volume(v) { volume = v; if (bus) bus.gain.value = v * 0.5; if (brano) brano.volume = v * 0.45 * vm * giu; },
    set volMusica(v) { vm = v; if (busAmb) busAmb.gain.value = v; if (brano) brano.volume = volume * 0.45 * vm * giu; },
    set volEffetti(v) { ve = v; if (fx) fx.gain.value = v; },
    CAMPIONI,
    get scenaAttuale() { return scena; }
  };
})();
