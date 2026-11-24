// Tavolo d'Avventura — Avvio. Si carica dopo app.js, nell'ordine scritto in index.html.
/* ============ AVVIO ============ */
const CANALE = /\/prova\//.test(location.pathname) ? 'prova' : 'pubblico';
$('#ver').textContent = VERSION + (CANALE === 'prova' ? ' (canale di prova)' : '');
Report.sessione.canale = CANALE;
$('#changelog').innerHTML = CHANGELOG.map(c => `<p><strong>${c.v}</strong> <span class="piccolo">${c.data}</span></p><ul>${c.voci.map(v => `<li>${esc(v)}</li>`).join('')}</ul>`).join('');
Narratore.attivo = OPZ.narratore; applicaGrandi();
Suoni.volume = OPZ.volume;
Lpc.suPronto = () => Mappa.disegna();
Lpc.carica();
setInterval(() => { if (Suoni.attivo) Suoni.ambiente(Mappa.ambienteSonoro()); }, 1000);
document.addEventListener('pointerdown', () => { if (OPZ.suoni && !Suoni.attivo) { Suoni.attivo = true; aggiornaScenaSonora(); } }, { once: true });
(() => { const d = new Date(), m = d.getMonth() + 1, g = d.getDate(); const st = m === 12 || (m === 1 && g <= 6) ? 'inverno' : (m === 10 && g >= 20) || (m === 11 && g <= 2) ? 'ombre' : m === 2 ? 'carnevale' : ''; if (st) { document.body.classList.add('st-' + st); document.querySelector('link[rel="icon"]').href = `icone/favicon-${st === 'ombre' ? 'ombre' : st}.svg`; } })();
window.addEventListener('resize', () => { if (largo() && S.vista === 'vMappa') mostraVista('vScheda'); });
(() => {
  const q = new URLSearchParams(location.search);
  if (q.get('tv') === '1') document.body.classList.add('tv');
  Report.log('avvio', { versione: VERSION, tv: q.get('tv') === '1', schermo: `${innerWidth}x${innerHeight}`, dpr: devicePixelRatio, dispositivo: Dispositivo.profilo(), voce: Ascolto.supportato(), webrtc: !!window.RTCPeerConnection });
  cercaAggiornamenti(false); Report.invia();
  const azione = q.get('azione'); S.azioneAvvio = azione; // scorciatoie dell'icona: riprendi, d20, sfida
  const codice = (q.get('c') || (q.has('i') || azione === 'sfida' ? '' : leggi('ta_attiva', '')) || '').toUpperCase(), invito = (q.get('i') || '').toUpperCase();
  const salvata = codice && campagneSalvate().find(x => x.codice === codice);
  if (azione === 'sfida') setTimeout(() => { $('#cartaSfida').scrollIntoView({ block: 'center' }); $('#btnSfida').focus(); }, 300);
  if (azione === 'd20' && !salvata) setTimeout(() => toast('Per tirare il d20 entra prima in una campagna'), 400);
  if (!salvata) mostraIngresso(); else setTimeout(() => { if ($('#gioco').hidden) mostraIngresso(); }, 8000); // rientro: niente schermata d'ingresso finché il tavolo risponde (al massimo 8 s)
  if (largo()) mostraVista('vScheda');
  if (salvata) { S.io = salvata.io; S.chiave = salvata.chiave; connetti(codice, () => ({ t: 'ciao', membro: salvata.io, chiave: salvata.chiave })); return; }
  if (codice && invito) {
    $('#eCodice').value = codice; $('#eInvito').value = invito;
    if (document.body.classList.contains('tv')) { connetti(codice, () => ({ t: 'entra', invito, nome: 'TV del tavolo', ruolo: 'spettatore' })); return; }
    $('#cartaCrea').hidden = true; $('#eNome').focus();
    if (q.get('s') === '1') { $('input[name="eRuolo"][value="spettatore"]').checked = true; $('#btnEntra').textContent = 'Guarda la partita'; $('#eRuolo').hidden = true; } // con questo link si entra solo a guardare: la scelta del ruolo non serve
  }
})();
