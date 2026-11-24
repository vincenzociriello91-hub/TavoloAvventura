// Tavolo d'Avventura — Scheda del personaggio. Si carica dopo app.js, nell'ordine scritto in index.html.
/* ============ SCHEDA ============ */
function renderSchedaSeServe(forza) { if (S.vista === 'vScheda' || largo() || forza) renderScheda(); }
const PRIORITA = { Barbaro: 'for cos des sag car int', Bardo: 'car des cos sag int for', Chierico: 'sag cos for car int des', Druido: 'sag cos des int car for', Guerriero: 'for cos des sag car int', Ladro: 'des int cos sag car for', Mago: 'int cos des sag car for', Monaco: 'des sag cos for int car', Paladino: 'for car cos sag des int', Ranger: 'des sag cos for int car', Stregone: 'car cos des int sag for', Warlock: 'car cos des sag int for' };
let bozza = null;
function renderScheda() {
  if (!S.st) return;
  const sel = $('#selPg');
  const ids = Object.entries(S.st.membri).filter(([, m]) => m.ruolo === 'giocatore').map(([id]) => id);
  if (!ids.includes(S.viewPg)) S.viewPg = ids.includes(S.io) ? S.io : ids.find(id => S.st.pg[id]) || ids[0]; // master e spettatori non hanno scheda: si mostra quella di un giocatore
  sel.innerHTML = ids.map(id => `<option value="${id}" ${id === S.viewPg ? 'selected' : ''}>${esc(S.st.pg[id]?.nome || '—')} (${esc(S.st.membri[id].nome)}${id === S.io ? ', tu' : ''})</option>`).join('');
  $('#selPgBox').hidden = ids.length < 2;
  const box = $('#scheda');
  const pg = S.st.pg[S.viewPg];
  if (!S.viewPg) { box.innerHTML = '<p class="piccolo">Nessun giocatore al tavolo.</p>'; return; }
  if (!pg) {
    if (S.viewPg === S.io && me()?.ruolo === 'giocatore') return renderCreazione(box);
    box.innerHTML = `<div class="carta"><p>${esc(S.st.membri[S.viewPg]?.nome)} non ha ancora creato il personaggio.</p></div>`; return;
  }
  const puo = S.viewPg === S.io || capo();
  const vis = visibilita(S.viewPg);
  if (vis < 2) {
    const lv = S.st.relazioni?.[S.viewPg]?.[S.io] || 'sconosciuti';
    box.innerHTML = `<div class="carta"><div class="pg-testa"><div class="ritratto">${Ritratto.svg(pg, { dim: 110 })}</div><div class="pg-info"><h2>${esc(pg.nome)}</h2><div class="piccolo">${esc(pg.razza)} · ${esc(Regole.nomeClassi(pg))} · livello ${pg.livello}</div>${vis >= 1 ? `<p>PF ${pg.pf}/${pg.pfMax} · CA ${pg.ca}</p><div class="car-griglia">${CAR.map(k => `<div class="car"><div class="sigla">${CAR_SIGLE[k]}</div><div class="val">${pg.car[k]}</div></div>`).join('')}</div>` : ''}<p class="piccolo">Siete ${esc(lv)}: ${vis >= 1 ? 'vedi le informazioni principali' : 'vedi solo l\'aspetto'}. Più il legame è stretto, più vedi della sua scheda.</p></div></div></div>`;
    return;
  }
  const set = Regole.set(pg.regole);
  const r = pg.pfMax ? pg.pf / pg.pfMax : 1;
  const comp = pg.regole === '3.5' ? `<div class="stat"><b>${segno(Regole.bab('3.5', pg.classe, pg.livello, pg))}</b><span>BAB</span></div>` : `<div class="stat"><b>+${Regole.competenza(pg.livello)}</b><span>COMPETENZA</span></div>`;
  const ts = pg.regole === '3.5' ? [['tem', 'Tempra'], ['rif', 'Riflessi'], ['vol', 'Volontà']] : CAR.map(k => [k, CAR_SIGLE[k]]);
  const armi = (pg.equip || []).filter(e => e.indossato && (ARMI[e.nome] || tipoOggetto(e.nome) === 'arma'));
  box.innerHTML = `${S.viewPg === S.io ? cartaNegozio(pg) : ''}
  <div class="carta">
    <div class="pg-testa">
      <div class="ritratto${pg.ritratto && !S.ritrattoPixel ? ' illustrato' : ''}" ${pg.ritratto ? 'data-cambia-ritratto title="Tocca per passare dal ritratto illustrato alla figura in pixel"' : ''}>${pg.ritratto && !S.ritrattoPixel ? `<img src="${urlMedia('img', pg.ritratto)}" alt="Ritratto di ${esc(pg.nome)}" onerror="this.parentElement.innerHTML=''">` : Ritratto.svg(pg, { dim: largo() ? 130 : 120 })}</div>
      <div class="pg-info">
        <h2>${esc(pg.nome)}</h2>
        <div class="piccolo">${esc(pg.razza)} · ${esc(Regole.nomeClassi(pg))} · livello ${pg.livello} · ${esc(pg.allineamento || '')}</div>
        <div class="barra-pf" role="meter" aria-valuemin="0" aria-valuemax="${pg.pfMax}" aria-valuenow="${pg.pf}" aria-label="Punti ferita"><div class="${r <= 0.25 ? 'basso' : r <= 0.5 ? 'meta' : ''}" style="width:${Math.max(0, Math.min(100, r * 100))}%"></div></div>
        <div><strong>${pg.pf}</strong> / ${pg.pfMax} PF${(pg.condizioni || []).length ? ' · ' + pg.condizioni.map(c => `<button type="button" class="cond-voce" data-voce="${esc(c)}" aria-label="Cosa vuol dire ${esc(c)}">${esc(c)}</button>`).join(', ') : ''}</div>
        ${puo && me()?.ruolo !== 'spettatore' ? `<button type="button" class="testo-btn" data-ritratto>${pg.ritratto ? '🎨 Rifai il ritratto illustrato' : '🎨 Crea il ritratto illustrato'}</button>` : ''}
        ${puo ? `<div class="pf-tasti"><button data-pf="-5">−5</button><button data-pf="-1">−1</button><button data-pf="1">+1</button><button data-pf="5">+5</button><button data-pf="?">Altro…</button></div>` : ''}
      </div>
    </div>
    <div class="statini">
      <div class="stat"><b>${pg.ca}</b><span>CLASSE ARMATURA</span></div>
      <div class="stat"><b>${segno(Regole.iniziativa(pg))}</b><span>INIZIATIVA</span></div>
      <div class="stat"><b>${String(pg.vel).replace('.', ',')} m</b><span>VELOCITÀ</span></div>
      ${comp}
    </div>
    ${pg.puntiCar ? `<div class="avviso-punti">Hai <strong>${pg.puntiCar}</strong> punt${pg.puntiCar > 1 ? 'i' : 'o'} caratteristica da assegnare: tocca <strong>+</strong> su una caratteristica o dillo a voce ("aumenta di ${pg.puntiCar} punti intelligenza").</div>` : ''}
    ${pg.regole === '3.5' && pg.puntiAbilita ? `<div class="avviso-punti">Hai <strong>${pg.puntiAbilita}</strong> gradi di abilità da assegnare: usa i tasti + nelle abilità.</div>` : ''}
    <div class="riga">${puo ? `<button id="btnLivello" class="${Regole.puoSalire(pg) ? 'pieno' : ''}">Sali di livello${Regole.puoSalire(pg) ? ' (hai i PX!)' : ''}</button>` : ''}<span class="piccolo">PX ${pg.px || 0} / ${Regole.prossimoLivelloPx(pg)}</span></div>
  </div>
  <div class="carta"><h3 style="margin-top:0">Caratteristiche</h3>
    <div class="car-griglia">${CAR.map(k => `<div class="car"><button class="tira" data-prova="car:${k}" aria-label="Prova di ${CAR_NOMI[k]}"><div class="sigla">${CAR_SIGLE[k]}</div><div class="val">${pg.car[k]}</div><div class="mod">${segno(mod(pg.car[k]))}</div></button>${puo && pg.puntiCar ? `<button class="piu" data-piu="${k}" aria-label="Aumenta ${CAR_NOMI[k]}">+</button>` : ''}</div>`).join('')}</div>
    <h3>Tiri salvezza</h3>
    <div class="chips">${ts.map(([k, n]) => `<button class="chip" data-prova="ts:${k}">${n} ${segno(Regole.tiroSalvezza(pg, k))}</button>`).join('')}</div>
  </div>
  ${armi.length ? `<div class="carta"><h3 style="margin-top:0">Attacchi</h3><ul class="equip">${armi.map(a => { const at = Regole.attacco(pg, a); return `<li><span class="n">${esc(a.nome)}</span><button data-attacco="${esc(a.nome)}">Colpire ${segno(at.colpire)}</button><button data-danni="${esc(a.nome)}">Danni ${esc(at.danno)}</button></li>`; }).join('')}</ul></div>` : ''}
  <div class="carta"><h3 style="margin-top:0">Abilità</h3>
    <ul class="lista-ab">${Object.keys(set.abilita).map(ab => `<li><span class="nome">${pg.regole === '5e' ? `<input type="checkbox" class="comp" data-comp="${esc(ab)}" ${(pg.competenze || []).includes(ab) ? 'checked' : ''} ${puo ? '' : 'disabled'} aria-label="Competenza in ${esc(ab)}"> ` : ''}${esc(ab)} <span class="piccolo">${CAR_SIGLE[set.abilita[ab]]}${pg.regole === '3.5' ? ' · gradi ' + (pg.gradi?.[ab] || 0) : ''}</span></span><b class="b">${segno(Regole.abilita(pg, ab))}</b>${pg.regole === '3.5' && puo && pg.puntiAbilita ? `<button data-grado="${esc(ab)}" aria-label="Aggiungi un grado a ${esc(ab)}">+</button>` : ''}<button data-prova="ab:${esc(ab)}" aria-label="Tira ${esc(ab)}">Tira</button></li>`).join('')}</ul>
  </div>
  <div class="carta"><h3 style="margin-top:0">Equipaggiamento</h3>
    <ul class="equip">${(pg.equip || []).map((e, i) => `<li class="${e.indossato ? 'ind' : ''}"><span class="icona-ogg" ${puo && tipoOggetto(e.nome) ? `data-trascina="${i}" title="Trascina sul ritratto per indossarlo"` : ''}>${Ritratto.icona(e.nome, 26)}</span><span class="n">${esc(e.nome)}${e.bonus ? ' +' + e.bonus : ''}${e.qta > 1 ? ' ×' + e.qta : ''}${e.rarita ? ` <span class="piccolo" style="color:${COLORI_RARITA[e.rarita] || '#bcae96'}">${esc(e.rarita)}</span>` : ''}${e.indossato ? ' <span class="piccolo">· indossato</span>' : ''}</span>${puo ? `${tipoOggetto(e.nome) ? `<button data-ind="${i}">${e.indossato ? 'Riponi' : 'Indossa'}</button>` : ''}<button data-modogg="${i}" aria-label="Modifica ${esc(e.nome)}">✎</button><button data-tog="${i}" aria-label="Togli ${esc(e.nome)}">Togli</button>` : ''}</li>`).join('') || '<li class="piccolo">Zaino vuoto</li>'}</ul>
    <p class="piccolo">Capacità di carico: ${Regole.caricoMax(pg)} kg${pg.aspetto?.altezza ? ` · altezza ${esc(pg.aspetto.altezza)} cm` : ''}${pg.aspetto?.peso ? ` · peso ${esc(pg.aspetto.peso)} kg` : ''}</p>
    ${puo ? `<form id="formOggetto" class="riga" autocomplete="off" style="margin-top:8px"><input id="nuovoOggetto" maxlength="60" placeholder="Aggiungi oggetto (es. Pozione di guarigione)" list="listaOggetti"><button class="pieno">Aggiungi</button></form>
    <datalist id="listaOggetti">${[...Object.keys(ARMI), ...Object.keys(ARMATURE), ...Object.keys(SCUDI), ...ELMI, 'Mantello', 'Amuleto', 'Pozione di guarigione', 'Torcia', 'Corda (15 m)', 'Razioni'].map(n => `<option value="${esc(n)}">`).join('')}</datalist>` : ''}
    ${Object.keys(pg.valute || {}).length ? `<p class="piccolo">Valute locali: ${Object.entries(pg.valute).map(([k, v]) => `${v} ${esc(k)}${S.st.mondo?.valute?.[k] ? ` (≈ ${Math.round(v * S.st.mondo.valute[k].cambio * 10) / 10} mo)` : ''}`).join(' · ')}</p>` : ''}
    <div class="riga" style="margin-top:10px"><span>Monete d'oro: <strong>${pg.oro || 0}</strong></span>${puo ? '<button data-oro="?">Modifica</button>' : ''}<span>PX: <strong>${pg.px || 0}</strong></span>${puo ? '<button data-px="?">Aggiungi PX</button>' : ''}</div>
  </div>
  ${cartaMagia(pg, puo)}
  <div class="carta"><h3 style="margin-top:0">Talenti${Regole.talentiDisponibili(pg) ? ` <span class="piccolo">(${(pg.talenti || []).length} su ${Regole.talentiDisponibili(pg)} disponibili)</span>` : ''}</h3>
    <div class="chips">${(pg.talenti || []).map((t, i) => `<span class="chip">${esc(t)}${puo ? ` <button class="testo-btn" data-togtal="${i}" aria-label="Togli ${esc(t)}" style="min-height:24px;padding:0 4px">×</button>` : ''}</span>`).join('') || '<span class="piccolo">Nessun talento</span>'}</div>
    ${puo ? `<form id="formTalento" class="riga" autocomplete="off" style="margin-top:8px"><input id="nuovoTalento" maxlength="60" placeholder="${pg.regole === '5e' ? 'Es. Lottatore' : 'Es. Arma focalizzata'}"><button class="pieno">Aggiungi</button></form>${pg.regole === '5e' && pg.puntiCar >= 2 ? '<p class="piccolo">In 5e puoi scegliere un talento al posto dei 2 punti caratteristica: aggiungilo qui e i punti verranno usati.</p>' : ''}` : ''}
  </div>
  ${S.viewPg === S.io ? cartaRelazioni() : ''}
  ${cartaVita(pg, puo)}
  <div class="carta"><h3 style="margin-top:0">Condizioni</h3>
    <div class="cond">${CONDIZIONI.map(c => `<button class="chip ${(pg.condizioni || []).includes(c) ? 'on' : ''}" data-cond="${esc(c)}" ${puo ? '' : 'disabled'}>${esc(c)}</button>`).join('')}</div>
  </div>
  <div class="carta">
    <details><summary>Aspetto del personaggio</summary>${puo ? formAspetto(pg.aspetto || {}, pg.razza) : ''}</details>
    ${cartaStoria(pg, puo)}
    ${cartaDiarioPg(pg, puo)}
    ${(pg.diario || []).length ? `<details><summary>Il diario di ${esc(pg.nome)} (${pg.diario.length})</summary>${[...pg.diario].reverse().map(d => `<div class="pagina-diario"><span class="piccolo">Sessione ${d.sessione || '?'} · ${esc(d.titolo || '')}</span><p>${esc(d.testo)}</p></div>`).join('')}</details>` : ''}
    <label>Note<textarea id="pgNote" rows="3" maxlength="4000" ${puo ? '' : 'readonly'}>${esc(pg.note || '')}</textarea></label>
    <div class="riga"><button id="btnStampa">Stampa o salva in PDF</button>${puo ? '<button id="btnAnnullaScheda">Annulla ultima modifica</button>' : ''}${puo ? '<button id="btnCaduto" class="pericolo">Il personaggio è caduto</button>' : ''}</div>
  </div>`;
  applicaPieghe();
}
// obiettivo segreto, sogni, mestiere con le ricette, compagni animali
function cartaVita(pg, puo) {
  const cat = S.st?.catalogo || {}, mio = S.viewPg === S.io || capo();
  const ricette = (cat.ricette || []).map(r => { const ha = r.ingredienti.every(i => (pg.equip || []).some(e => e.nome.toLowerCase().startsWith(i.toLowerCase()))); return `<li><span><strong>${esc(r.nome)}</strong> <span class="piccolo">${r.ingredienti.map(esc).join(' + ')}${r.costo ? ` + ${r.costo} mo` : ''} · CD ${r.cd}${pg.mestiere === r.mestiere ? ' · +3 dal tuo mestiere' : ''}</span></span>${puo ? `<button type="button" data-crea="${esc(r.nome)}" ${ha && (pg.oro || 0) >= r.costo ? '' : 'disabled'}>Crea</button>` : ''}</li>`; }).join('');
  return `<div class="carta"><h3 style="margin-top:0">Vita del personaggio</h3>
    ${mio && pg.segreto ? `<div class="segreto${pg.segreto.fatto ? ' fatto' : ''}"><strong>${pg.segreto.fatto ? '✔ Obiettivo segreto raggiunto' : '🔒 Obiettivo segreto'}</strong><p>${esc(pg.segreto.testo)}</p><p class="piccolo">Lo vedete solo tu e il master. Se lo realizzi guadagni 300 PX.</p></div>` : ''}
    ${mio && (pg.sogni || []).length ? `<details><summary>🌙 Sogni e visioni (${pg.sogni.length})</summary>${[...pg.sogni].reverse().map(x => `<p class="storia-pg">${esc(x.testo)}</p>`).join('')}</details>` : ''}
    <label>Mestiere<select data-mestiere ${puo ? '' : 'disabled'}><option value="">nessuno</option>${Object.entries(cat.mestieri || {}).map(([k, n]) => `<option value="${k}" ${pg.mestiere === k ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
    <details><summary>Crea oggetti</summary><p class="piccolo">Servono gli ingredienti nell'inventario (si comprano dai mercanti o si trovano in giro). Tiro d20 + caratteristica, +3 col mestiere giusto, +2 col laboratorio della casa.</p><ul class="tesoro-ogg">${ricette}</ul></details>
    <h4>Compagni</h4>${(pg.compagni || []).map((a, i) => htmlAnimale(a, i, puo && S.viewPg === S.io)).join('') || '<p class="piccolo">Nessun animale per ora: il master può farvene incontrare uno.</p>'}
    ${htmlTema(pg, puo && S.viewPg === S.io)}
    ${capo() ? `<form class="riga" data-compagno autocomplete="off"><input name="nome" maxlength="30" placeholder="Nome del compagno"><select name="specie">${(cat.specie || []).map(x => `<option>${x}</option>`).join('')}</select><button>Dai</button></form>` : ''}
  </div>`;
}
$('#scheda').addEventListener('change', e => { if (e.target.dataset.mestiere !== undefined) { invia({ t: 'mestiere', mestiere: e.target.value }); toast('Mestiere scelto'); } });
$('#scheda').addEventListener('click', e => { const b = e.target.closest('[data-crea]'); if (b) { invia({ t: 'crea_oggetto', ricetta: b.dataset.crea }); Report.log('crea_oggetto', { ricetta: b.dataset.crea }); } });
$('#scheda').addEventListener('submit', e => { const f = e.target.closest('[data-compagno]'); if (!f) return; e.preventDefault(); invia({ t: 'compagno_nuovo', per: S.viewPg, nome: f.nome.value.trim(), specie: f.specie.value }); });
// il mondo vivo: voto del gruppo, enigma, bacheca, nemesi, minacce, scelte morali
function renderMondoVivo() {
  const box = $('#mondoVivo'); if (!box || !S.st) return;
  const v = S.st.voto, en = S.st.enigma, q = S.st.missioni || [], ne = S.st.nemesi, mi = (S.st.minacce || []).filter(x => !x.sventata), sc = S.st.scelte || [];
  const gioca = me()?.ruolo === 'giocatore' || capo(), mioVoto = v?.voti?.[S.io];
  const conta = v ? v.opzioni.map((_, i) => Object.values(v.voti || {}).filter(x => x === i).length) : [];
  box.innerHTML = `${v ? `<div class="carta-mini voto"><strong>🗳️ Il gruppo decide: ${esc(v.domanda)}</strong><div class="opzioni-voto">${v.opzioni.map((o, i) => `<button type="button" data-voto="${i}" class="${mioVoto === i ? 'pieno' : ''}" ${gioca ? '' : 'disabled'}>${esc(o)} <span class="piccolo">${conta[i]}</span></button>`).join('')}</div>${capo() ? '<button type="button" class="testo-btn" data-voto-chiudi>Chiudi la votazione</button>' : ''}</div>` : ''}
    ${en ? `<div class="carta-mini enigma"><strong>🧩 Enigma</strong><p class="storia-pg">${esc(en.domanda)}</p>${en.risposta ? `<p class="piccolo">Risposta (la vedi solo tu): ${esc(en.risposta)}</p>` : ''}<form class="riga" data-enigma autocomplete="off"><input name="r" maxlength="60" placeholder="La vostra risposta"><button class="pieno">Rispondi</button></form>${en.tentativi ? `<p class="piccolo">Tentativi sbagliati: ${en.tentativi}${en.tentativi >= 3 && en.indizio ? ` · Indizio: ${esc(en.indizio)}` : ''}</p>` : ''}</div>` : ''}
    ${htmlRompicapo(gioca)}${htmlCaccia(gioca)}${htmlTorneo(gioca)}${htmlDuello(gioca)}${htmlRivincite()}${htmlPatti()}
    ${ne ? `<div class="carta-mini nemesi"><strong>😈 ${esc(ne.nome)}</strong><p class="piccolo">${esc(ne.descrizione || '')}</p><p class="piccolo">Incontri: ${ne.incontri || 1}${ne.fughe ? ` · fughe: ${ne.fughe}` : ''}${ne.ultimaFuga ? ` · l'ultima volta: ${esc(ne.ultimaFuga)}` : ''}</p></div>` : ''}
    ${mi.length ? `<div class="carta-mini"><strong>⚠️ Minacce che crescono</strong>${mi.map(x => `<div class="mondo-riga"><span><strong>${esc(x.nome)}</strong> <span class="piccolo">${esc(x.descrizione || '')}</span></span><span class="livello-minaccia" aria-label="livello ${x.livello} su 5">${'●'.repeat(x.livello)}${'○'.repeat(5 - x.livello)}</span></div>`).join('')}<p class="piccolo">Se le ignorate peggiorano a ogni sessione.</p></div>` : ''}
    <details class="carta-mini"${q.some(x => x.stato === 'aperta') ? ' open' : ''}><summary>📜 Bacheca delle missioni (${q.filter(x => x.stato !== 'completata').length})</summary>${q.map(x => `<div class="missione ${x.stato}"><strong>${esc(x.titolo)}</strong> <span class="piccolo">${x.stato}${x.ricompensa ? ' · ricompensa: ' + esc(x.ricompensa) : ''}${x.scadenza && x.stato === 'aperta' || x.scadenza && x.stato === 'accettata' ? ` · ⏳ entro il giorno ${x.scadenza}` : ''}</span><p class="piccolo">${esc(x.descrizione || '')}</p>${x.stato === 'aperta' && gioca ? `<button type="button" data-missione="${x.id}">Accettiamo</button>` : ''}</div>`).join('') || '<p class="piccolo">Nessuna missione appesa. Passate da una taverna o da una città.</p>'}
      ${capo() ? `<form class="colonna" data-missione-nuova autocomplete="off"><input name="titolo" maxlength="80" placeholder="Titolo della missione"><input name="descrizione" maxlength="300" placeholder="Cosa bisogna fare"><div class="riga"><input name="ricompensa" maxlength="80" placeholder="Ricompensa"><input name="entro" type="number" min="0" max="120" placeholder="Entro giorni" aria-label="Scade tra quanti giorni (facoltativo)" style="width:110px;flex:0 0 110px"><button>Appendi</button></div></form>` : ''}</details>
    ${sc.length ? `<details class="carta-mini"><summary>⚖️ Le vostre scelte (${sc.filter(x => x.peso === 'buona').length} buone, ${sc.filter(x => x.peso === 'cattiva').length} cattive)</summary>${[...sc].reverse().map(x => `<p class="piccolo">${x.peso === 'buona' ? '🕊️' : x.peso === 'cattiva' ? '🗡️' : '🌗'} ${esc(x.descrizione)}</p>`).join('')}<p class="piccolo">Il finale della campagna dipende da queste scelte.</p></details>` : ''}
    ${capo() && !v ? `<details class="carta-mini"><summary>🗳️ Fai votare il gruppo</summary><form class="colonna" data-voto-apri autocomplete="off"><input name="domanda" maxlength="160" placeholder="Domanda (es. Da che parte andiamo?)"><input name="opzioni" maxlength="240" placeholder="Opzioni separate da virgola (es. ponte, foresta, fiume)"><button>Apri il voto</button></form></details>` : ''}${htmlGiochiCapo()}`;
}
$('#mondoVivo').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.voto !== undefined) { invia({ t: 'voto', scelta: +b.dataset.voto }); Report.log('voto', {}); }
  if (b.dataset.votoChiudi !== undefined) invia({ t: 'voto_chiudi' });
  if (b.dataset.missione) { invia({ t: 'missione_accetta', id: b.dataset.missione }); Report.log('missione', {}); }
});
$('#mondoVivo').addEventListener('submit', e => {
  e.preventDefault(); const f = e.target;
  if (f.dataset.enigma !== undefined) { const r = f.r.value.trim(); if (r) { invia({ t: 'enigma_risposta', risposta: r }); Report.log('enigma', {}); } }
  if (f.dataset.missioneNuova !== undefined && f.titolo.value.trim()) invia({ t: 'missione_nuova', titolo: f.titolo.value.trim(), descrizione: f.descrizione.value.trim(), ricompensa: f.ricompensa.value.trim(), entro: Number(f.entro.value) || 0 });
  if (f.dataset.votoApri !== undefined) { const op = f.opzioni.value.split(',').map(x => x.trim()).filter(Boolean); if (f.domanda.value.trim() && op.length >= 2) invia({ t: 'voto_apri', domanda: f.domanda.value.trim(), opzioni: op }); else toast('Scrivi la domanda e almeno due opzioni'); }
});
// storia e albero genealogico: il giocatore risponde a 4 domande, il master la scrive
function cartaStoria(pg, puo) {
  const f = pg.famiglia || {};
  return `<details><summary>Storia e famiglia${pg.storia ? '' : ' (da scrivere col master)'}</summary>${pg.storia ? `<p class="storia-pg">${esc(pg.storia)}</p>` : ''}
    ${puo ? `<div class="colonna"><label>Da dove viene<input id="stOrigini" maxlength="200" value="${esc(f.origini || '')}" placeholder="Es. un villaggio di pescatori sulla costa"></label>
    <label>Famiglia (genitori, fratelli, legami)<input id="stFamiglia" maxlength="300" value="${esc(f.famiglia || '')}" placeholder="Es. padre fabbro, sorella maggiore scomparsa"></label>
    <label>Segno particolare<input id="stSegno" maxlength="150" value="${esc(f.segno || '')}" placeholder="Es. una cicatrice a forma di luna"></label>
    <label>Cosa sogna o teme<input id="stSogno" maxlength="150" value="${esc(f.sogno || '')}" placeholder="Es. ritrovare la sorella"></label>
    <button type="button" id="btnStoria">${pg.storia ? 'Riscrivila col master' : 'Scrivila col master'}</button></div>` : ''}</details>`;
}
const LIVELLI_REL = ['sconosciuti', 'conoscenti', 'rivali', 'amici', 'amici stretti', 'compagni di vita', 'famiglia'];
// 0 = solo aspetto, 1 = informazioni principali, 2 = tutta la scheda
function visibilita(id) {
  if (id === S.io || capo()) return 2;
  const lv = S.st.relazioni?.[id]?.[S.io] || 'sconosciuti';
  return ['amici stretti', 'compagni di vita', 'famiglia'].includes(lv) ? 2 : lv === 'amici' ? 1 : 0;
}
function cartaRelazioni() {
  const altri = Object.entries(S.st.membri).filter(([id, m]) => id !== S.io && m.ruolo === 'giocatore');
  if (!altri.length) return '';
  const mie = S.st.relazioni?.[S.io] || {};
  return `<div class="carta"><h3 style="margin-top:0">Relazioni</h3><p class="piccolo">Scegli che legame hai con gli altri: gli amici vedono PF e caratteristiche, amici stretti, compagni e famiglia vedono tutta la scheda.</p>
    ${altri.map(([id, m]) => `<label>${esc(S.st.pg[id]?.nome || m.nome)} <span class="piccolo">(${esc(m.nome)})</span><select data-rel="${id}">${LIVELLI_REL.map(l => `<option ${l === (mie[id] || 'sconosciuti') ? 'selected' : ''}>${l}</option>`).join('')}</select></label>`).join('')}</div>`;
}
$('#scheda').addEventListener('change', e => { if (e.target.dataset.rel) { invia({ t: 'relazione', con: e.target.dataset.rel, livello: e.target.value }); toast('Legame aggiornato'); } });
function renderMondo() {
  const mo = S.st?.mondo || { fazioni: {}, valute: {}, viaggi: [], notizie: [] };
  const fz = Object.entries(mo.fazioni || {}), vl = Object.entries(mo.valute || {});
  const barra = r => `<div class="rep" role="meter" aria-valuemin="-100" aria-valuemax="100" aria-valuenow="${r}"><div style="left:${r < 0 ? 50 + r / 2 : 50}%;width:${Math.abs(r) / 2}%;background:${r < 0 ? 'var(--rosso)' : 'var(--verde)'}"></div></div>`;
  $('#mondo').innerHTML = `${htmlCalendario()}<h3>Fazioni</h3>${fz.map(([n, f]) => `<div class="mondo-riga"><strong>${esc(n)}</strong><span class="piccolo">${f.reputazione > 30 ? 'alleati' : f.reputazione > 5 ? 'amichevoli' : f.reputazione < -30 ? 'ostili' : f.reputazione < -5 ? 'diffidenti' : 'neutrali'} (${f.reputazione})</span></div>${barra(f.reputazione)}${f.descrizione ? `<p class="piccolo">${esc(f.descrizione)}</p>` : ''}`).join('') || '<p class="piccolo">Nessuna fazione conosciuta.</p>'}
    ${Object.keys(S.st?.reputazioneLuoghi || {}).length ? `<h3>Come vi vedono nei luoghi</h3>${Object.entries(S.st.reputazioneLuoghi).map(([n, r]) => `<div class="mondo-riga"><strong>${esc(n)}</strong><span class="piccolo">${r > 30 ? 'eroi' : r > 5 ? 'benvoluti' : r < -30 ? 'banditi' : r < -5 ? 'malvisti' : 'sconosciuti'}</span>${barra(r)}</div>`).join('')}` : ''}
    <h3>Valute locali</h3>${vl.map(([n, v]) => `<p>${esc(n)}: 1 = ${v.cambio} monete d'oro</p>`).join('') || '<p class="piccolo">Solo monete d\'oro, per ora.</p>'}
    <h3>Notizie</h3>${[...(mo.notizie || [])].reverse().slice(0, 5).map(n => `<p class="piccolo">Sessione ${n.sessione}: ${esc(n.testo)}</p>`).join('') || '<p class="piccolo">Nessuna notizia.</p>'}
    <p class="piccolo">Viaggi registrati: ${(mo.viaggi || []).length}.</p>
    ${capo() ? `<form id="formFazione" class="riga" autocomplete="off"><input id="fzNome" maxlength="40" placeholder="Fazione"><input id="fzRep" type="number" min="-100" max="100" value="0" style="width:90px;flex:0 0 90px" aria-label="Reputazione"><button>Salva fazione</button></form>
    <form id="formValuta" class="riga" autocomplete="off"><input id="vlNome" maxlength="40" placeholder="Valuta (es. Corone di Argentea)"><input id="vlCambio" type="number" step="0.01" min="0.01" value="1" style="width:90px;flex:0 0 90px" aria-label="Cambio in oro"><button>Salva valuta</button></form>
    <button id="btnEvolvi" type="button" class="largo">Fai andare avanti il mondo</button>` : ''}`;
}
$('#mondo').addEventListener('submit', e => {
  e.preventDefault();
  if (e.target.id === 'formFazione' && $('#fzNome').value.trim()) invia({ t: 'mondo', fazione: $('#fzNome').value.trim(), reputazione: Number($('#fzRep').value) });
  if (e.target.id === 'formValuta' && $('#vlNome').value.trim()) invia({ t: 'mondo', valuta: $('#vlNome').value.trim(), cambio: Number($('#vlCambio').value) });
});
$('#mondo').addEventListener('click', e => { if (e.target.id === 'btnEvolvi') { invia({ t: 'mondo_evolvi' }); toast('Il mondo va avanti…'); } });
// Mappa del mondo: luoghi conosciuti e viaggi del gruppo
function renderMappaMondo() {
  MappaMondo.disegna($('#mondoCanvas'), { idx: S.st?.luoghi || {}, viaggi: S.st?.mondo?.viaggi || [], attuale: S.st?.luogo?.id, seme: S.st?.campagna?.creata || 1, nome: S.st?.campagna?.nome || 'Il mondo' });
}
$('#btnIllustra').addEventListener('click', () => invia({ t: 'illustra' }));
// vista 3D stile HD-2D (three.js, caricata solo quando serve)
async function vista3D(attiva) {
  OPZ.vista3d = attiva; scrivi('ta_opzioni', OPZ);
  $('#btn3d').textContent = attiva ? 'Vista 2D' : 'Vista 3D';
  if (attiva && !S.m3) {
    try { const m = await import('./mappa3d.js'); S.m3 = m.crea($('#mappa3dBox'), { io: () => S.io, onLampo: () => Suoni.effetto('tuono') }); Report.log('vista-3d', { esito: 'ok' }); }
    catch (e) { Report.log('vista-3d', { esito: 'errore', errore: String(e?.message || e) }); toast('La vista 3D non funziona su questo dispositivo'); OPZ.vista3d = false; $('#btn3d').textContent = 'Vista 3D'; return; }
  }
  if (!attiva && S.m3) { S.m3.chiudi(); S.m3 = null; }
  const conLuogo = !!S.st?.luogo;
  $('#mappa3dBox').hidden = !(attiva && conLuogo); $('#mappaBox').hidden = attiva && conLuogo;
  if (S.m3 && conLuogo) S.m3.aggiorna(Mappa.dati3D()); else Mappa.adatta();
}
$('#btn3d').addEventListener('click', () => vista3D(!OPZ.vista3d));
// zoom della mappa del luogo (2D o 3D): 'tutta' inquadra solo ciò che il gruppo ha già scoperto
function zoomMappa(z) { const in3d = S.m3 && !$('#mappa3dBox').hidden; if (z === 'tutta') return in3d ? S.m3.zoom('tutta') : Mappa.zoom('tutta'); if (in3d) S.m3.zoom(z > 0 ? 0.8 : 1.25); else Mappa.zoom(z > 0 ? 1.25 : 0.8); }
$('#btnZoomPiu').addEventListener('click', () => zoomMappa(1));
$('#btnZoomMeno').addEventListener('click', () => zoomMappa(-1));
$('#btnZoomTutta').addEventListener('click', () => zoomMappa('tutta'));
$('#diario').addEventListener('click', e => { const im = e.target.closest('img[data-img]'); if (im) window.open(im.src, '_blank'); const rb = e.target.closest('[data-riepilogo]'); if (rb) { S.apriRiepilogo = Number(rb.dataset.riepilogo); invia({ t: 'riepiloghi' }); } });
$('#btnMondo').addEventListener('click', () => { const b = $('#mondoBox'); b.hidden = !b.hidden; $('#btnMondo').textContent = b.hidden ? 'Mappa del mondo' : 'Mappa del luogo'; $('#mappaBox').hidden = !b.hidden; $('#zoomMappa').hidden = !b.hidden; if (!b.hidden) renderMappaMondo(); else Mappa.adatta(); });
$('#mondoCanvas').addEventListener('click', e => { const nome = MappaMondo.luogoIn($('#mondoCanvas'), e); if (!nome) return; if (capo() || masterAI()) invia({ t: 'vai', nome }); else toast(nome); });
function cartaMagia(pg, puo) {
  const max = Regole.slotMax(pg); const cd = Regole.cd(pg);
  const usati = pg.slotUsati || [];
  if (!cd && !(pg.incantesimi || []).length && !max.some(x => x)) return '';
  const righe = max.map((n, l) => n ? `<div class="riga slot-riga"><span class="piccolo" style="min-width:56px">${l ? l + '° livello' : 'trucchi'}</span><span class="slot">${'●'.repeat(Math.max(0, n - (usati[l] || 0)))}${'○'.repeat(Math.min(n, usati[l] || 0))}</span>${puo && l ? `<button data-usaslot="${l}" aria-label="Usa uno slot di ${l}° livello">−</button><button data-ridaislot="${l}" aria-label="Recupera uno slot di ${l}° livello">+</button>` : ''}</div>` : '').join('');
  return `<div class="carta"><h3 style="margin-top:0">Incantesimi${cd ? ` <span class="piccolo">CD ${cd.cd}${cd.nota ? ' ' + cd.nota : ''}${cd.attacco !== undefined ? ' · attacco ' + segno(cd.attacco) : ''} (${CAR_SIGLE[cd.car]})</span>` : ''}</h3>
    ${righe || '<p class="piccolo">Nessuno slot a questo livello.</p>'}${pg.patto ? `<p class="piccolo">Slot del patto: ${pg.patto.n} di ${pg.patto.livello}° livello, tornano con un riposo breve.</p>` : ''}
    <ul class="equip">${(pg.incantesimi || []).map((inc, i) => `<li><span class="n">${esc(inc.nome)} <span class="piccolo">${inc.livello ? inc.livello + '°' : 'trucchetto'}</span>${BIBLIOTECA.incantesimi[inc.nome] ? ` <button type="button" class="testo-btn" data-voce="${esc(inc.nome)}" aria-label="Cosa fa ${esc(inc.nome)}">ℹ️</button>` : ''}</span>${puo ? `<button data-lancia="${i}">Lancia</button><button data-toginc="${i}" aria-label="Togli ${esc(inc.nome)}">×</button>` : ''}</li>`).join('') || '<li class="piccolo">Nessun incantesimo: aggiungili qui sotto o di\' "imparo l\'incantesimo dardo incantato".</li>'}</ul>
    ${puo ? `<form id="formIncantesimo" class="riga" autocomplete="off" style="margin-top:8px"><input id="nuovoInc" maxlength="60" list="listaInc" placeholder="Nome dell'incantesimo"><input id="nuovoIncLiv" type="number" min="0" max="9" value="1" style="width:76px;flex:0 0 76px" aria-label="Livello"><button class="pieno">Aggiungi</button></form><datalist id="listaInc">${Object.keys(INCANTESIMI_NOTI).map(n => `<option value="${esc(n)}">`).join('')}</datalist>
    <div class="riga" style="margin-top:8px"><button data-riposo="lungo">Riposo lungo (tutto)</button><button data-riposo="breve">Riposo breve</button></div>` : ''}
  </div>`;
}
function formAspetto(a, razza) {
  const sel = (id, nome, opz, val) => `<label>${nome}<select data-asp="${id}">${opz.map(o => `<option ${o === val ? 'selected' : ''}>${o}</option>`).join('')}</select></label>`;
  return `<div class="crea-car" style="grid-template-columns:repeat(2,minmax(0,1fr))">
    ${sel('pelle', 'Pelle', Object.keys(Ritratto.PELLE), a.pelle || 'chiara')}
    ${sel('capelli', 'Capelli', ['corti', 'lunghi', 'coda', 'ricci', 'cresta', 'calvo'], a.capelli || (razza === 'Elfo' ? 'lunghi' : 'corti'))}
    ${sel('coloreCapelli', 'Colore capelli', Object.keys(Ritratto.CAPELLI), a.coloreCapelli || (razza === 'Nano' ? 'rosso' : razza === 'Elfo' ? 'biondo' : 'castano'))}
    ${sel('barba', 'Barba', ['nessuna', 'corta', 'lunga'], a.barba || (razza === 'Nano' ? 'lunga' : 'nessuna'))}
    ${sel('occhi', 'Occhi', Object.keys(Ritratto.OCCHI), a.occhi || 'marroni')}
    ${sel('corporatura', 'Corporatura', ['normale', 'snella', 'robusta'], a.corporatura || 'normale')}
    ${sel('figura', 'Figura', ['maschile', 'femminile'], a.figura || 'maschile')}
    ${razza === 'Dragonide' ? sel('drago', 'Scaglie', Object.keys(Ritratto.DRAGO), a.drago || 'rosso') : ''}
    <label>Altezza (cm)<input type="number" min="60" max="260" data-asp="altezza" value="${esc(a.altezza || '')}" inputmode="numeric"></label>
    <label>Peso (kg)<input type="number" min="10" max="300" data-asp="peso" value="${esc(a.peso || '')}" inputmode="numeric"></label>
  </div>`;
}
function renderCreazione(box) {
  const r = regole(); const set = Regole.set(r);
  bozza = bozza && bozza.regole === r ? bozza : { regole: r, nome: '', razza: Object.keys(set.razze)[0], classe: 'Guerriero', carBase: { for: 15, des: 13, cos: 14, int: 8, sag: 12, car: 10 }, competenze: [], aspetto: {}, allineamento: 'Neutrale buono' };
  const anteprima = Regole.nuovo(r, bozza);
  const nAb = r === '5e' ? set.classi[bozza.classe]?.abilita || 2 : 0;
  box.innerHTML = `<div class="carta">
    <h2>Crea il tuo personaggio</h2><p class="piccolo">${esc(set.nome)}: tutto il resto (PF, CA, tiri salvezza, abilità) si calcola da solo. Prima volta? <button type="button" class="testo-btn" data-guida>Come si gioca</button></p>
    ${(() => { const c = (S.st.memoriale || []).filter(x => x.chi === S.io).pop(); return c && !bozza.erede ? `<div class="carta-mini"><strong>In ricordo di ${esc(c.nome)}</strong><p class="piccolo">Puoi creare un erede della sua famiglia: riceve ${esc(c.eredita?.nome || 'il suo ricordo')}.</p><button type="button" id="cpErede">Crea un erede</button></div>` : ''; })()}
    ${cartaSessioneZero()}
    <div class="pg-testa"><div class="ritratto" id="anteprima">${Ritratto.svg(anteprima, { dim: 120 })}</div>
      <div class="pg-info"><label>Nome<input id="cpNome" maxlength="40" value="${esc(bozza.nome)}" placeholder="Es. Brann Barbaferro"></label>
      <div class="piccolo">PF ${anteprima.pfMax} · CA ${anteprima.ca} · velocità ${String(anteprima.vel).replace('.', ',')} m</div></div></div>
    <div class="crea-car" style="grid-template-columns:repeat(2,minmax(0,1fr))">
      <label>Razza<select id="cpRazza">${Object.keys(set.razze).map(x => `<option ${x === bozza.razza ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
      <label>Classe<select id="cpClasse">${Object.keys(set.classi).map(x => `<option ${x === bozza.classe ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
    </div>
    <p class="piccolo">${esc(set.razze[bozza.razza]?.tratti || '')}</p>
    <h3>Caratteristiche (prima dei bonus di razza)</h3>
    <div class="riga"><button id="cpAuto" type="button">Distribuisci per la classe</button><button id="cpTira" type="button">Tira 4d6</button></div>
    <div class="crea-car">${CAR.map(k => `<label>${CAR_NOMI[k]}<input type="number" min="3" max="18" data-cb="${k}" value="${bozza.carBase[k]}" inputmode="numeric"><span class="piccolo">finale ${anteprima.car[k]} (${segno(mod(anteprima.car[k]))})</span></label>`).join('')}</div>
    ${r === '5e' ? `<h3>Abilità in cui sei competente (${bozza.competenze.length}/${nAb})</h3><div class="chips">${Object.keys(set.abilita).map(ab => `<button type="button" class="chip ${bozza.competenze.includes(ab) ? 'on' : ''}" data-cpab="${esc(ab)}">${esc(ab)}</button>`).join('')}</div>` : '<p class="piccolo">In 3.5 assegnerai i gradi di abilità dalla scheda dopo la creazione.</p>'}
    <label>Allineamento<select id="cpAll">${['Legale buono', 'Neutrale buono', 'Caotico buono', 'Legale neutrale', 'Neutrale', 'Caotico neutrale', 'Legale malvagio', 'Neutrale malvagio', 'Caotico malvagio'].map(x => `<option ${x === bozza.allineamento ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
    <details open><summary>Aspetto</summary>${formAspetto(bozza.aspetto, bozza.razza)}</details>
    <p class="piccolo">Equipaggiamento iniziale: ${esc(set.classi[bozza.classe].equip.join(', '))}.</p>
    <button id="cpCrea" class="pieno grande" type="button">Crea il personaggio</button>
  </div>`;
}
// eventi della scheda (delegati)
$('#scheda').addEventListener('input', e => {
  const t = e.target;
  if (bozza && !mioPg()) {
    if (t.id === 'cpNome') bozza.nome = t.value;
    if (t.dataset.cb) { bozza.carBase[t.dataset.cb] = Math.max(3, Math.min(18, Number(t.value) || 10)); aggiornaAnteprima(); }
  }
});
$('#scheda').addEventListener('change', e => {
  const t = e.target;
  if (bozza && !mioPg() && (t.id === 'cpRazza' || t.id === 'cpClasse' || t.id === 'cpAll' || t.dataset.asp)) {
    if (t.id === 'cpRazza') bozza.razza = t.value;
    if (t.id === 'cpClasse') { bozza.classe = t.value; bozza.competenze = []; }
    if (t.id === 'cpAll') bozza.allineamento = t.value;
    if (t.dataset.asp) bozza.aspetto[t.dataset.asp] = t.value;
    renderScheda(); return;
  }
  const pg = S.st?.pg?.[S.viewPg]; if (!pg) return;
  if (t.dataset.asp) modifica(p => { p.aspetto = { ...(p.aspetto || {}), [t.dataset.asp]: t.value }; return 'aspetto aggiornato'; });
  if (t.dataset.comp) modifica(p => { const s = new Set(p.competenze || []); t.checked ? s.add(t.dataset.comp) : s.delete(t.dataset.comp); p.competenze = [...s]; return `${t.checked ? 'competente' : 'non più competente'} in ${t.dataset.comp}`; });
  if (t.id === 'pgNote') modifica(p => { p.note = t.value; return null; });
});
function aggiornaAnteprima() { const a = Regole.nuovo(regole(), bozza); $('#anteprima').innerHTML = Ritratto.svg(a, { dim: 120 }); $$('[data-cb]').forEach(i => { i.nextElementSibling.textContent = `finale ${a.car[i.dataset.cb]} (${segno(mod(a.car[i.dataset.cb]))})`; }); }
$('#scheda').addEventListener('click', async e => {
  if (e.target.closest('[data-cambia-ritratto]')) { S.ritrattoPixel = !S.ritrattoPixel; renderScheda(); return; } // ritratto illustrato o figura in pixel
  const b = e.target.closest('button'); if (!b) return;
  // creazione
  if (b.id === 'cpAuto') { const ord = (PRIORITA[bozza.classe] || 'for des cos int sag car').split(' '); ord.forEach((k, i) => bozza.carBase[k] = Regole.arrayStandard[i]); renderScheda(); return; }
  if (b.id === 'cpTira') { const v = CAR.map(() => Regole.tira4d6()).sort((x, y) => y - x); (PRIORITA[bozza.classe] || 'for des cos int sag car').split(' ').forEach((k, i) => bozza.carBase[k] = v[i]); renderScheda(); toast('Tirati: ' + v.join(', ')); return; }
  if (b.dataset.cpab) { const s = new Set(bozza.competenze); const max = Regole.set(regole()).classi[bozza.classe].abilita; s.has(b.dataset.cpab) ? s.delete(b.dataset.cpab) : s.size < max ? s.add(b.dataset.cpab) : toast(`La classe ${bozza.classe} ne ha ${max}`); bozza.competenze = [...s]; renderScheda(); return; }
  if (b.id === 'szInizia' || b.id === 'szInvia') { szInvia(b.id === 'szInizia' ? null : $('#szTesto').value); return; }
  if (b.id === 'szParla') { b.disabled = true; Ascolto.unaFrase({ log: (t, d) => Report.log(t, d) }).then(f => { b.disabled = false; if (f) szInvia(f); }); setTimeout(() => Ascolto.fineFrase(), 9000); return; }
  if (b.id === 'szUsa' && S.sz?.proposta) { const pr = S.sz.proposta; Object.assign(bozza, { nome: pr.nome || bozza.nome, razza: pr.razza, classe: pr.classe, allineamento: pr.allineamento || bozza.allineamento, aspetto: { ...bozza.aspetto, ...(pr.aspetto || {}) }, note: [pr.storia, pr.legami && 'Legami: ' + pr.legami].filter(Boolean).join('\n\n'), competenze: [] }); S.sz.usata = true; renderScheda(); toast('Proposta applicata: scegli le caratteristiche e crea il personaggio'); return; }
  if (b.dataset.compra) { invia({ t: 'compra', merce: b.dataset.compra }); return; }
  if (b.dataset.vendi !== undefined) { invia({ t: 'vendi', indice: Number(b.dataset.vendi) }); return; }
  if (b.id === 'cpErede') { const c = (S.st.memoriale || []).filter(x => x.chi === S.io).pop(); if (c) { bozza.nome = `${bozza.nome.split(' ')[0] || 'Nuovo'} ${c.cognome}`.trim(); bozza.erede = c; renderScheda(); toast(`Erede di ${c.nome}: riceverà ${c.eredita?.nome || 'il suo ricordo'}`); } return; }
  if (b.id === 'cpCrea') {
    if (!bozza.nome.trim()) { toast('Dai un nome al personaggio', true); $('#cpNome').focus(); return; }
    const pg = Regole.nuovo(regole(), bozza);
    if (bozza.erede) { if (bozza.erede.eredita) pg.equip = [...(pg.equip || []), { nome: bozza.erede.eredita.nome + ' (eredità)', qta: 1 }]; pg.storia = `Erede di ${bozza.erede.nome}, caduto nella sessione precedente.`; }
    invia({ t: 'scheda', pg, nota: `${pg.nome}, ${pg.razza} ${pg.classe}, entra in gioco` });
    S.st.pg[S.io] = pg; bozza = null; Report.log('pg-creato', { razza: pg.razza, classe: pg.classe, regole: pg.regole });
    renderScheda(); toast('Personaggio creato!'); return;
  }
  const pg = S.st?.pg?.[S.viewPg]; if (!pg) return;
  if (b.id === 'btnStoria') { invia({ t: 'storia', origini: $('#stOrigini').value, famiglia: $('#stFamiglia').value, segno: $('#stSegno').value, sogno: $('#stSogno').value }); toast('Il master scrive la storia…'); return; }
  if (b.id === 'btnCaduto') { chiedi(`<h2>${esc(pg.nome)} è caduto?</h2><p>Il personaggio va nel memoriale con le sue imprese. Potrai creare un erede che riceve un suo oggetto.</p>`, [{ testo: 'Sì, è caduto', pieno: true }, { testo: 'Annulla' }]).then(i => { if (i === 0) invia({ t: 'caduto', pg: S.viewPg }); }); return; }
  if (b.dataset.prova) { const [tipo, k] = b.dataset.prova.split(':'); if (tipo === 'car') tira('d20' + fm(mod(pg.car[k])), 'Prova di ' + CAR_NOMI[k]); else if (tipo === 'ts') tira('d20' + fm(Regole.tiroSalvezza(pg, k)), 'Tiro salvezza ' + ({ tem: 'Tempra', rif: 'Riflessi', vol: 'Volontà' }[k] || CAR_NOMI[k])); else tira('d20' + fm(Regole.abilita(pg, k)), k); return; }
  if (b.dataset.ritratto !== undefined) { invia({ t: 'ritratto', per: S.viewPg }); toast('Il pittore prepara il ritratto: ci vuole qualche secondo…'); Report.log('ritratto', { rifatto: !!pg.ritratto }); return; }
  if (b.dataset.attacco) { if (!usaMunizione(pg, b.dataset.attacco)) return; const at = Regole.attacco(pg, { nome: b.dataset.attacco }); tira('d20' + fm(at.colpire), 'Attacco con ' + b.dataset.attacco); return; }
  if (b.dataset.danni) { const at = Regole.attacco(pg, { nome: b.dataset.danni }); tira(at.danno.replace(/^1d/, 'd'), 'Danni ' + b.dataset.danni); return; }
  if (b.dataset.pf) { let d = Number(b.dataset.pf); if (b.dataset.pf === '?') { const v = prompt('Punti ferita: scrivi un numero negativo per i danni (es. -7) o positivo per le cure (es. 5)'); d = parseInt(v, 10); if (!d) return; } modifica([{ op: 'pf', delta: d }]); return; }
  if (b.dataset.piu) { modifica([{ op: 'car', car: b.dataset.piu, delta: 1 }]); return; }
  if (b.dataset.grado) { modifica(p => { p.gradi = { ...(p.gradi || {}), [b.dataset.grado]: (p.gradi?.[b.dataset.grado] || 0) + 1 }; p.puntiAbilita = Math.max(0, (p.puntiAbilita || 0) - 1); return `+1 grado in ${b.dataset.grado}`; }); return; }
  if (b.dataset.ind !== undefined) { const it = pg.equip[Number(b.dataset.ind)]; modifica([{ op: it.indossato ? 'ripon' : 'indossa', nome: it.nome }]); return; }
  if (b.dataset.tog !== undefined) { const it = pg.equip[Number(b.dataset.tog)]; modifica(p => { p.equip.splice(Number(b.dataset.tog), 1); return `rimuove ${it.nome}`; }); return; }
  if (b.dataset.usaslot) { modifica([{ op: 'slot', livello: Number(b.dataset.usaslot) }]); return; }
  if (b.dataset.ridaislot) { modifica(p => { const l = Number(b.dataset.ridaislot); p.slotUsati = p.slotUsati || []; p.slotUsati[l] = Math.max(0, (p.slotUsati[l] || 0) - 1); return `recupera uno slot di ${l}° livello`; }); return; }
  if (b.dataset.lancia !== undefined) { const inc = pg.incantesimi[Number(b.dataset.lancia)]; modifica([{ op: 'lancia', nome: inc.nome }]); return; }
  if (b.dataset.toginc !== undefined) { const inc = pg.incantesimi[Number(b.dataset.toginc)]; modifica(p => { p.incantesimi.splice(Number(b.dataset.toginc), 1); return `dimentica ${inc.nome}`; }); return; }
  if (b.dataset.togtal !== undefined) { const t = pg.talenti[Number(b.dataset.togtal)]; modifica(p => { p.talenti.splice(Number(b.dataset.togtal), 1); return `toglie il talento ${t}`; }); return; }
  if (b.dataset.riposo) { modifica([{ op: b.dataset.riposo === 'lungo' ? 'riposo' : 'riposobreve' }]); return; }
  if (b.dataset.modogg !== undefined) {
    const it = pg.equip[Number(b.dataset.modogg)];
    const i = await chiedi(`<h2>${esc(it.nome)}</h2><label>Bonus magico<select id="ogBonus">${[0, 1, 2, 3].map(n => `<option value="${n}" ${Number(it.bonus || 0) === n ? 'selected' : ''}>${n ? '+' + n : 'nessuno'}</option>`).join('')}</select></label><label>Rarità<select id="ogRar"><option value="">—</option>${RARITA.map(r => `<option ${it.rarita === r ? 'selected' : ''}>${r}</option>`).join('')}</select></label><label>Quantità<input id="ogQta" type="number" min="1" max="999" value="${it.qta || 1}"></label>`, [{ testo: 'Salva', pieno: true }, { testo: 'Annulla' }]);
    if (i === 0) { const bonus = Number($('#ogBonus').value), rarita = $('#ogRar').value || undefined, qta = Math.max(1, Number($('#ogQta').value) || 1); modifica(p => { const o = p.equip[Number(b.dataset.modogg)]; o.bonus = bonus || undefined; o.rarita = rarita; o.qta = qta; return `${o.nome}: ${bonus ? '+' + bonus + ' ' : ''}${rarita || ''}`.trim(); }); }
    return;
  }
  if (b.dataset.cond) { const on = (pg.condizioni || []).includes(b.dataset.cond); modifica([{ op: 'condizione', nome: b.dataset.cond, attiva: !on }]); return; }
  if (b.dataset.oro) { const v = parseInt(prompt('Monete d\'oro da aggiungere (usa il meno per togliere, es. -10)'), 10); if (v) modifica([{ op: 'oro', delta: v }]); return; }
  if (b.dataset.px) { const v = parseInt(prompt('Punti esperienza guadagnati'), 10); if (v) modifica([{ op: 'px', delta: v }]); return; }
  if (b.id === 'btnLivello') {
    const classi = Object.keys(Regole.set(pg.regole).classi);
    const i = await chiedi(`<h2>Sali al livello ${pg.livello + 1}</h2><label>Classe (per la multiclasse scegline un'altra)<select id="lvClasse">${classi.map(c => `<option ${c === pg.classe ? 'selected' : ''}>${c}</option>`).join('')}</select></label><p>Punti ferita: media del dado vita della classe oppure tiro del dado. Si aggiunge il modificatore di Costituzione.</p>`, [{ testo: 'Media', pieno: true }, { testo: 'Tira il dado' }, { testo: 'Annulla' }]);
    const classe = $('#lvClasse')?.value;
    if (i === 0) modifica([{ op: 'livello', delta: 1, classe }]);
    if (i === 1) { const dv = Regole.set(pg.regole).classi[classe]?.dv || 8; const d = 1 + Math.floor(Math.random() * dv); modifica(p => Regole.saliLivello(p, d, classe).msg + ` (tiro 1d${dv}: ${d})`); }
    if (i === 0 || i === 1) await livelloGuidato(clona(pg));
    return;
  }
  if (b.id === 'btnStampa') { stampaScheda(pg); return; }
  if (b.id === 'btnAnnullaScheda') { annulla(); return; }
});
$('#scheda').addEventListener('submit', e => {
  e.preventDefault();
  if (e.target.id === 'formOggetto') { const n = $('#nuovoOggetto').value.trim(); if (n) modifica([{ op: 'oggetto', nome: n, qta: 1 }]); }
  if (e.target.id === 'formIncantesimo') { const n = $('#nuovoInc').value.trim(); if (n) modifica([{ op: 'impara', nome: n, livello: Number($('#nuovoIncLiv').value) }]); }
  if (e.target.id === 'formTalento') { const n = $('#nuovoTalento').value.trim(); if (n) modifica([{ op: 'talento', nome: n }]); }
});
$('#scheda').addEventListener('input', e => { if (e.target.id === 'nuovoInc' && INCANTESIMI_NOTI[e.target.value] !== undefined) $('#nuovoIncLiv').value = INCANTESIMI_NOTI[e.target.value]; });
$('#selPg').addEventListener('change', e => { S.viewPg = e.target.value; renderScheda(); });

// Ogni modifica: copia per "annulla", applica, ricalcola, invia a tutti
function modifica(azione, notaExtra) {
  const per = S.viewPg && (S.viewPg === S.io || capo()) ? S.viewPg : S.io;
  const pg = S.st?.pg?.[per];
  if (!pg) { toast('Prima crea il personaggio nella scheda', true); return; }
  if (per !== S.io && !capo()) return;
  S.undo.push({ per, prima: clona(pg) }); if (S.undo.length > 30) S.undo.shift();
  let note;
  if (Array.isArray(azione)) note = Comandi.applica(pg, azione).join(', ');
  else note = azione(pg);
  Regole.ricalcola(pg);
  if (notaExtra) note = note ? `${note} — ${notaExtra}` : notaExtra;
  invia({ t: 'scheda', per, pg, nota: note || null });
  renderScheda(); renderPresenza();
  if (note) mostraAnnulla(`${pg.nome}: ${note}`);
  if (/livello \d/.test(note || '')) Suoni.effetto('livello');
  Report.log('scheda', { nota: note, per: per === S.io ? 'io' : 'altro', pf: pg.pf, livello: pg.livello });
}
function annulla() {
  const u = S.undo.pop(); if (!u) { toast('Niente da annullare'); return; }
  S.st.pg[u.per] = u.prima;
  invia({ t: 'scheda', per: u.per, pg: u.prima, nota: 'annullata l\'ultima modifica' });
  renderScheda(); $('#annullaBar').hidden = true; toast('Modifica annullata'); Report.log('annulla', {});
}
function mostraAnnulla(testo) { $('#annullaTesto').textContent = testo; $('#annullaBar').hidden = false; clearTimeout(mostraAnnulla._t); mostraAnnulla._t = setTimeout(() => $('#annullaBar').hidden = true, 8000); }
$('#btnAnnulla').addEventListener('click', annulla);
