/* Comandi vocali per la scheda: "aumenta di due punti intelligenza", "subisco 7 danni", "equipaggio l'ascia bipenne"...
   Se la frase non è un comando, torna null e la frase va al master. */
const NUMERI_PAROLE = { zero: 0, un: 1, uno: 1, una: 1, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7, otto: 8, nove: 9, dieci: 10, undici: 11, dodici: 12, tredici: 13, quattordici: 14, quindici: 15, sedici: 16, diciassette: 17, diciotto: 18, diciannove: 19, venti: 20, trenta: 30, quaranta: 40, cinquanta: 50, sessanta: 60, settanta: 70, ottanta: 80, novanta: 90, cento: 100, mille: 1000 };
const ORDINALI = { primo: 1, secondo: 2, terzo: 3, quarto: 4, quinto: 5, sesto: 6, settimo: 7, ottavo: 8, nono: 9 };
const CAR_PAROLE = { forza: 'for', destrezza: 'des', costituzione: 'cos', intelligenza: 'int', saggezza: 'sag', carisma: 'car' };
const pulisci = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[.,;:!?"]/g, ' ').replace(/'/g, "' ").replace(/\s+/g, ' ').trim();

function parolaNumero(w) {
  if (/^\d+$/.test(w)) return Number(w);
  if (NUMERI_PAROLE[w] !== undefined) return NUMERI_PAROLE[w];
  // composti: ventidue, trentacinque, centoventi
  for (const base of ['novanta', 'ottanta', 'settanta', 'sessanta', 'cinquanta', 'quaranta', 'trenta', 'venti', 'cento']) {
    const b = base.slice(0, -1);
    for (const pre of [base, b]) if (w.startsWith(pre) && w.length > pre.length) { const r = parolaNumero(w.slice(pre.length)); if (r !== null && r < 100) return NUMERI_PAROLE[base] + r; }
  }
  return null;
}
// primo numero della frase (cifre o parole), opzionalmente dopo una certa posizione
function primoNumero(f) {
  for (const w of f.split(' ')) { const n = parolaNumero(w.replace(/[^a-z0-9]/g, '')); if (n !== null && !(w === 'un' || w === 'una' || w === 'uno')) return n; }
  return null;
}
const RIF_ARTICOLI = /^(il|lo|la|l'|i|gli|le|un|una|uno|un'|del|della|dello|dei|degli|delle|mio|mia|miei|mie)\s+/;
const pulisciNome = s => { let n = s.trim(); for (let k = 0; k < 3; k++) n = n.replace(RIF_ARTICOLI, ''); n = n.replace(/\s+(nello|nell'|nella|all'|allo|alla|nel)\s+(zaino|inventario).*$/, '').replace(/\s+(per favore|grazie)$/, '').trim(); return n.charAt(0).toUpperCase() + n.slice(1); };

const Comandi = {
  interpreta(frase, pg, regole, mondo) {
    const f = pulisci(frase);
    if (!f) return null;
    const n = primoNumero(f);
    const piu = /\b(aumenta|aumento|alza|alzo|aggiungi|aggiungo|metti|metto|incrementa|piu|guadagno|ottengo|recupero|sali)\b/.test(f);
    const meno = /\b(diminuisci|diminuisco|abbassa|abbasso|togli|tolgo|riduci|riduco|meno|perdo|sottrai|leva)\b/.test(f);

    if (/^(annulla|annullare|torna indietro|ho sbagliato|cancella l'? ultim)/.test(f)) return { annulla: true };
    if (/\b(fine turno|finisco il turno|ho finito il (mio )?turno|passo il turno|termino il turno|tocca al prossimo)\b/.test(f)) return { turno: true };
    if (/\bdividi(amo)? (il )?bottino\b|\bdividiamo le monete\b/.test(f)) return { gruppo: { op: 'dividi' } };
    const comune = /\b(tesoro|fondo|cassa|forziere|bottino) (comune|del gruppo)\b/.test(f);
    if (comune && n !== null && /\b(monete|oro|mo)\b/.test(f)) {
      if (/\b(prendo|prelevo|tolgo|ritiro)\b/.test(f)) return { gruppo: { op: 'oro', delta: -n }, ops: [{ op: 'oro', delta: n }] };
      return { gruppo: { op: 'oro', delta: n }, ops: [{ op: 'oro', delta: -n }] };
    }
    const mettiComune = comune && f.match(/\b(metto|metti|deposito|lascio)\s+(.+?)\s+(nel|nella|in)\s+(tesoro|fondo|cassa|forziere|bottino)/);
    if (mettiComune) return { gruppo: { op: 'oggetto', nome: pulisciNome(mettiComune[2]), qta: 1 }, ops: [{ op: 'togli', nome: pulisciNome(mettiComune[2]) }] };
    const prendiComune = comune && f.match(/\b(prendo|ritiro)\s+(.+?)\s+(dal|dalla)\s+(tesoro|fondo|cassa|forziere|bottino)/);
    if (prendiComune) return { gruppo: { op: 'prendi', nome: pulisciNome(prendiComune[2]) } };

    // --- dadi ---
    const md = f.match(/\b(tiro|tira|lancio|lancia|tirare|lanciare)\b.*?\b(?:(\d{1,2}|un|uno|due|tre|quattro|cinque|sei)\s*)?(?:d|dado da|dadi da)\s?(4|6|8|10|12|20|100)\b(?:\s*(piu|\+|meno|-)\s*(\w+))?/);
    if (md) {
      const q = md[2] ? (parolaNumero(md[2]) || 1) : 1;
      const m2 = md[5] ? (parolaNumero(md[5]) || 0) * (/meno|-/.test(md[4]) ? -1 : 1) : 0;
      return { dado: { formula: `${q > 1 ? q : ''}d${md[3]}${m2 ? (m2 > 0 ? '+' : '') + m2 : ''}`, modo: /svantaggio/.test(f) ? 'svantaggio' : /vantaggio/.test(f) ? 'vantaggio' : null, motivo: 'a voce' } };
    }
    if (pg && /\b(tiro|tira|faccio una prova|prova di)\b/.test(f)) {
      const set = Regole.set(regole || pg.regole);
      const modo = /svantaggio/.test(f) ? 'svantaggio' : /vantaggio/.test(f) ? 'vantaggio' : null;
      if (/salvezza/.test(f)) {
        if ((regole || pg.regole) === '3.5') {
          const k = /tempra/.test(f) ? 'tem' : /riflessi/.test(f) ? 'rif' : /volonta/.test(f) ? 'vol' : null;
          if (k) return { dado: { formula: 'd20' + fm(Regole.tiroSalvezza(pg, k)), modo, motivo: 'Tiro salvezza ' + { tem: 'Tempra', rif: 'Riflessi', vol: 'Volontà' }[k] } };
        }
        for (const [p, k] of Object.entries(CAR_PAROLE)) if (f.includes(p)) return { dado: { formula: 'd20' + fm(Regole.tiroSalvezza(pg, k)), modo, motivo: 'Tiro salvezza ' + CAR_NOMI[k] } };
      }
      if (/iniziativa/.test(f)) return { dado: { formula: 'd20' + fm(Regole.iniziativa(pg)), modo, motivo: 'Iniziativa' } };
      if (/colpire|attacco|attacc/.test(f)) { const arma = trovaOggetto(pg, f) || (pg.equip || []).find(e => e.indossato && ARMI[e.nome]); const a = Regole.attacco(pg, arma); return { dado: { formula: 'd20' + fm(a.colpire), modo, motivo: 'Attacco' + (arma ? ' con ' + arma.nome : '') } }; }
      if (/\bdanni\b|\bdanno\b/.test(f)) { const arma = trovaOggetto(pg, f) || (pg.equip || []).find(e => e.indossato && ARMI[e.nome]); const a = Regole.attacco(pg, arma); return { dado: { formula: a.danno.replace(/^1d/, 'd'), motivo: 'Danni' + (arma ? ' ' + arma.nome : '') } }; }
      for (const ab of Object.keys(set.abilita)) if (f.includes(pulisci(ab))) return { dado: { formula: 'd20' + fm(Regole.abilita(pg, ab)), modo, motivo: ab } };
      for (const [p, k] of Object.entries(CAR_PAROLE)) if (f.includes(p)) return { dado: { formula: 'd20' + fm(mod(pg.car[k])), modo, motivo: 'Prova di ' + CAR_NOMI[k] } };
    }

    // --- livello ---
    if (/\b(salgo|sali|salire|passo|aumenta|alza|aumento)\b.{0,20}\blivell/.test(f) || /\blivello successivo\b|\blevel up\b/.test(f)) {
      const target = f.match(/livello (\w+)/); const t = target ? parolaNumero(target[1]) : null;
      const delta = t && pg && t > pg.livello ? t - pg.livello : 1;
      const cl = f.match(/\bcome\s+(\w+)/); const classe = cl && Object.keys(Regole.set(regole || pg?.regole).classi).find(c => pulisci(c) === cl[1]);
      return { ops: [{ op: 'livello', delta, ...(classe ? { classe } : {}) }] };
    }

    // --- caratteristiche ---
    for (const [p, k] of Object.entries(CAR_PAROLE)) {
      if (!f.includes(p)) continue;
      if (!(piu || meno || /\bpunt[oi]\b/.test(f))) break;
      const delta = (n || 1) * (meno && !piu ? -1 : meno && piu && f.indexOf('meno') < f.indexOf(p) ? -1 : 1);
      return { ops: [{ op: 'car', car: k, delta }] };
    }

    // --- punti ferita ---
    if (n !== null && /\b(danni|danno|punti ferita|punti vita|pf|ferite)\b/.test(f)) {
      if (/massim/.test(f)) return { ops: [{ op: 'pfmax', delta: meno && !piu ? -n : n }] };
      if (/\b(curo|cura|curare|guarisco|guarire|recupero|recuperare|ripristino|rigenero|mi curo|piu)\b/.test(f) && !/\bdanni\b/.test(f)) return { ops: [{ op: 'pf', delta: n }] };
      if (/\b(subisco|subito|prendo|preso|presi|mi fanno|perdo|meno|togli|tolgo|ricevo|incasso|colpito)\b|\bdanni\b|\bdanno\b/.test(f)) return { ops: [{ op: 'pf', delta: -n }] };
    }
    if (/\b(riposo lungo|lungo riposo)\b/.test(f)) return { ops: [{ op: 'riposo' }] };

    // --- valute locali (dal mondo della campagna) ---
    if (n !== null && mondo?.valute) {
      const v = Object.keys(mondo.valute).find(k => f.includes(pulisci(k)) || f.includes(pulisci(k).split(' ')[0]));
      if (v) return { ops: [{ op: 'valuta', valuta: v, delta: /\b(spendo|pago|perdo|consegno|do|tolgo|meno)\b/.test(f) ? -n : n }] };
    }
    // --- monete ed esperienza ---
    if (n !== null && /\b(monete|moneta|mo|oro|pezzi d' oro|pezzi d'oro)\b/.test(f)) {
      if (/\b(spendo|pago|perdo|consegno|do|dono|regalo|tolgo|togli|meno)\b/.test(f)) return { ops: [{ op: 'oro', delta: -n }] };
      return { ops: [{ op: 'oro', delta: n }] };
    }
    if (n !== null && /\b(esperienza|px|xp)\b/.test(f)) return { ops: [{ op: 'px', delta: n }] };

    // --- condizioni ---
    const nonPiu = f.match(/\bnon sono piu\s+(\w+(?:\s+di\s+sensi)?)/);
    if (nonPiu && CONDIZIONI.some(c => pulisci(c) === nonPiu[1])) return { ops: [{ op: 'condizione', nome: nonPiu[1], attiva: false }] };
    const sono = f.match(/\b(sono|divento|mi sento)\s+(\w+(?:\s+di\s+sensi)?)/);
    if (sono && CONDIZIONI.some(c => pulisci(c) === sono[2])) return { ops: [{ op: 'condizione', nome: sono[2], attiva: true }] };

    // --- classe armatura ---
    const ca = f.match(/\b(classe armatura|ca)\b.*?\b(piu|meno)\b\s*(\w+)/);
    if (ca) { const v = parolaNumero(ca[3]) || 1; return { ops: [{ op: 'ca', delta: ca[2] === 'meno' ? -v : v }] }; }

    // --- incantesimi e talenti ---
    if (/\b(riposo breve|breve riposo)\b/.test(f)) return { ops: [{ op: 'riposobreve' }] };
    if (/\brecuper\w* (gli |tutti gli )?slot\b/.test(f)) return { ops: [{ op: 'recuperaslot' }] };
    const slot = f.match(/\bslot di (\w+) livello\b/);
    if (slot && /\b(uso|usa|consumo|spendo)\b/.test(f)) { const l = ORDINALI[slot[1]] || parolaNumero(slot[1]); if (l) return { ops: [{ op: 'slot', livello: l }] }; }
    const impara = f.match(/\b(imparo|impara|aggiungi|preparo|aggiungo) (l' ?)?incantesimo\s+(.+?)(?:\s+di (\w+) livello)?$/);
    if (impara) return { ops: [{ op: 'impara', nome: pulisciNome(impara[3]), livello: impara[4] ? (ORDINALI[impara[4]] || parolaNumero(impara[4])) : undefined }] };
    const tal = f.match(/\b(aggiungi|aggiungo|prendo|scelgo|imparo) (il )?talento\s+(.+)/);
    if (tal) return { ops: [{ op: 'talento', nome: pulisciNome(tal[3]) }] };
    const lan = f.match(/\b(lancio|lancia|casto|uso) (l' ?)?(incantesimo\s+)?(.+?)(?:\s+(?:con uno slot|al|di) (\w+) livello)?$/);
    if (lan && pg) {
      const nome = pulisciNome(lan[4]);
      const noto = (pg.incantesimi || []).find(i => pulisci(i.nome) === pulisci(nome)) || Object.keys(INCANTESIMI_NOTI).find(k => pulisci(k) === pulisci(nome));
      if (noto || lan[3]) return { ops: [{ op: 'lancia', nome: noto?.nome || noto || nome, livello: lan[5] ? (ORDINALI[lan[5]] || parolaNumero(lan[5])) : undefined }] };
    }

    // --- equipaggiamento ---
    const eq = f.match(/\b(equipaggio|equipaggia|equipaggiami|indosso|indossa|impugno|impugna|imbraccio|sfodero|mi metto|metto addosso|brandisco)\s+(.+)/);
    if (eq) return { ops: [{ op: 'indossa', nome: pulisciNome(eq[2]) }] };
    const rip = f.match(/\b(ripongo|riponi|rinfodero|mi tolgo|tolgo di dosso|levo)\s+(.+)/);
    if (rip) return { ops: [{ op: 'ripon', nome: pulisciNome(rip[2]) }] };
    const butta = f.match(/\b(butto|getto|vendo|lascio cadere|perdo|rimuovi|rimuovo|cancella)\s+(.+?)(\s+dall'?\s*(zaino|inventario))?$/);
    if (butta && !/\bmonete|oro\b/.test(f)) return { ops: [{ op: 'togli', nome: pulisciNome(butta[2]) }] };
    const agg = f.match(/\b(aggiungi|aggiungo|raccolgo|metto nello zaino|metti nello zaino|metto nell' inventario)\s+(.+)/) || f.match(/\b(prendo|trovo|compro|ottengo)\s+(.+?)\s+(e lo metto|e la metto|nello|nell' inventario|nell'inventario|all' inventario)/);
    if (agg) {
      const nome = pulisciNome(agg[2].replace(/^(all' inventario|allo zaino)\s+/, ''));
      const q = primoNumero(agg[2]);
      if (nome.length > 1) return { ops: [{ op: 'oggetto', nome: q ? pulisciNome(nome.replace(/^\d+\s*/, '').replace(new RegExp('^' + Object.keys(NUMERI_PAROLE).join('|^') + '\\s', 'i'), '')) : nome, qta: q || 1 }] };
    }
    return null;
  },

  // Applica le operazioni alla scheda (modifica pg) e restituisce le note leggibili
  applica(pg, ops) {
    const note = [];
    for (const o of ops || []) {
      switch (o.op) {
        case 'car': { const r = Regole.aumentaCar(pg, o.car, Number(o.delta) || 0); if (r) note.push(r); break; }
        case 'pf': { const d = Number(o.delta) || 0; pg.pf = Math.max(-pg.pfMax, Math.min(pg.pfMax, pg.pf + d)); if (d < 0) pg.ferite = [...(pg.ferite || []), { zona: ['torso', 'braccio', 'gamba', 'testa'][(pg.ferite || []).length % 4], t: Date.now() }].slice(-6); else if (pg.pf >= pg.pfMax) pg.ferite = []; else pg.ferite = (pg.ferite || []).slice(1); note.push(`${d < 0 ? 'subisce ' + -d + ' danni' : 'recupera ' + d + ' punti ferita'} (PF ${pg.pf}/${pg.pfMax})`); break; }
        case 'pfmax': { const d = Number(o.delta) || 0; pg.pfMax = Math.max(1, pg.pfMax + d); pg.pf = Math.min(pg.pfMax, pg.pf + Math.max(0, d)); note.push(`PF massimi ${d > 0 ? '+' : ''}${d} (ora ${pg.pfMax})`); break; }
        case 'livello': { for (let i = 0; i < Math.min(5, o.delta || 1); i++) { const r = Regole.saliLivello(pg, null, o.classe); note.push(r.msg); if (!r.ok) break; } break; }
        case 'valuta': { pg.valute = { ...(pg.valute || {}) }; pg.valute[o.valuta] = Math.max(0, (pg.valute[o.valuta] || 0) + (Number(o.delta) || 0)); note.push(`${o.delta >= 0 ? '+' : ''}${o.delta} ${o.valuta} (totale ${pg.valute[o.valuta]})`); break; }
        case 'lancia': { const r = Regole.lancia(pg, o.nome, o.livello); note.push(r.msg); break; }
        case 'slot': { const max = Regole.slotMax(pg); pg.slotUsati = pg.slotUsati || []; if ((max[o.livello] || 0) > (pg.slotUsati[o.livello] || 0)) { pg.slotUsati[o.livello] = (pg.slotUsati[o.livello] || 0) + 1; note.push(`usa uno slot di ${o.livello}° livello`); } else note.push(`nessuno slot di ${o.livello}° livello libero`); break; }
        case 'recuperaslot': { Regole.recuperaSlot(pg); note.push('recupera tutti gli slot degli incantesimi'); break; }
        case 'riposobreve': { if (pg.patto) { Regole.recuperaSlot(pg, true); note.push('riposo breve: recupera gli slot del patto'); } else note.push('riposo breve'); break; }
        case 'impara': { const liv = o.livello ?? INCANTESIMI_NOTI[Object.keys(INCANTESIMI_NOTI).find(k => pulisci(k) === pulisci(o.nome))] ?? 1; if (!(pg.incantesimi || []).some(i => pulisci(i.nome) === pulisci(o.nome))) pg.incantesimi = [...(pg.incantesimi || []), { nome: o.nome, livello: liv }]; note.push(`impara ${o.nome} (${liv ? liv + '° livello' : 'trucchetto'})`); break; }
        case 'talento': { if (!(pg.talenti || []).includes(o.nome)) pg.talenti = [...(pg.talenti || []), o.nome]; if (pg.regole === '5e' && (pg.puntiCar || 0) >= 2) pg.puntiCar -= 2; note.push(`nuovo talento: ${o.nome}`); break; }
        case 'oro': { const d = Number(o.delta) || 0; pg.oro = Math.max(0, (pg.oro || 0) + d); note.push(`${d >= 0 ? '+' : ''}${d} monete d'oro (totale ${pg.oro})`); break; }
        case 'px': { pg.px = Math.max(0, (pg.px || 0) + (Number(o.delta) || 0)); note.push(`+${o.delta} punti esperienza (totale ${pg.px})${Regole.puoSalire(pg) ? ' — puoi salire di livello!' : ''}`); break; }
        case 'ca': { pg.caExtra = (pg.caExtra || 0) + (Number(o.delta) || 0); Regole.ricalcola(pg); note.push(`Classe Armatura ${pg.ca}`); break; }
        case 'riposo': { pg.pf = pg.pfMax; pg.ferite = []; pg.slotUsati = []; pg.condizioni = (pg.condizioni || []).filter(c => c === 'invisibile'); note.push('riposo lungo: punti ferita al massimo'); break; }
        case 'condizione': { const s = new Set(pg.condizioni || []); const nome = CONDIZIONI.find(c => pulisci(c) === pulisci(o.nome)) || o.nome; o.attiva === false ? s.delete(nome) : s.add(nome); pg.condizioni = [...s]; note.push(`${o.attiva === false ? 'non è più' : 'è'} ${nome}`); break; }
        case 'oggetto': {
          // "spada lunga +1 rara": bonus magico e rarità dal nome
          let nome = String(o.nome); const bm = nome.match(/\s*(?:\+|piu\s*|più\s*)(\d|uno|due|tre)\b/i); let bonus = o.bonus || 0;
          if (bm) { bonus = parolaNumero(bm[1].toLowerCase()) || Number(bm[1]) || 0; nome = nome.replace(bm[0], ''); }
          let rarita = o.rarita || null; for (const r of [...RARITA].reverse()) { const re = new RegExp('\\s+' + r.replace(/o$/, '[oa]') + '$', 'i'); if (re.test(nome)) { rarita = r; nome = nome.replace(re, ''); break; } }
          const n2 = normalizzaNomeOggetto(nome.trim());
          const es = !bonus && !rarita && trovaOggetto(pg, n2);
          if (es) es.qta = (es.qta || 1) + (o.qta || 1);
          else pg.equip = [...(pg.equip || []), { nome: n2, qta: o.qta || 1, indossato: false, ...(bonus ? { bonus } : {}), ...(rarita || bonus ? { rarita: rarita || (bonus >= 3 ? 'molto raro' : bonus === 2 ? 'raro' : 'non comune') } : {}) }];
          note.push(`aggiunge ${o.qta > 1 ? o.qta + ' × ' : ''}${n2}${bonus ? ' +' + bonus : ''}${rarita ? ' (' + rarita + ')' : ''} all'inventario`); break;
        }
        case 'togli': { const es = trovaOggetto(pg, o.nome); if (es) { pg.equip = pg.equip.filter(e => e !== es); Regole.ricalcola(pg); note.push(`rimuove ${es.nome}`); } else note.push(`non trovo "${o.nome}" nell'inventario`); break; }
        case 'ripon': { const es = trovaOggetto(pg, o.nome); if (es) { es.indossato = false; Regole.ricalcola(pg); note.push(`ripone ${es.nome}`); } break; }
        case 'indossa': {
          let es = trovaOggetto(pg, o.nome);
          if (!es) { es = { nome: normalizzaNomeOggetto(o.nome), qta: 1, indossato: false }; pg.equip = [...(pg.equip || []), es]; }
          const tipo = tipoOggetto(es.nome);
          if (tipo) pg.equip.forEach(e => { if (e !== es && e.indossato && tipoOggetto(e.nome) === tipo) e.indossato = false; });
          // un'arma a due mani toglie lo scudo
          if (tipo === 'arma' && /bipenne|spadone|arco|falcione|bastone|balestra(?! leggera)/i.test(es.nome)) pg.equip.forEach(e => { if (tipoOggetto(e.nome) === 'scudo') e.indossato = false; });
          es.indossato = true; Regole.ricalcola(pg);
          note.push(`equipaggia ${es.nome}${tipo === 'armatura' || tipo === 'scudo' ? ' (CA ' + pg.ca + ')' : ''}`); break;
        }
      }
    }
    return note;
  }
};
const fm = n => (n ? (n > 0 ? '+' : '') + n : '');
function normalizzaNomeOggetto(nome) {
  const p = pulisci(nome);
  const tutti = [...Object.keys(ARMI), ...Object.keys(ARMATURE), ...Object.keys(SCUDI), ...ELMI, 'Mantello', 'Amuleto', 'Pozione di guarigione', 'Torcia', 'Corda'];
  return tutti.find(t => pulisci(t) === p) || tutti.find(t => p.includes(pulisci(t))) || (nome.charAt(0).toUpperCase() + nome.slice(1));
}
function trovaOggetto(pg, testoNome) {
  const p = pulisci(testoNome);
  const lista = pg.equip || [];
  return lista.find(e => pulisci(e.nome) === p) || lista.find(e => p.includes(pulisci(e.nome))) || lista.find(e => pulisci(e.nome).includes(p) && p.length > 3)
    || lista.find(e => pulisci(e.nome).split(' ').some(w => w.length > 3 && p.split(' ').includes(w)));
}
function tipoOggetto(nome) {
  if (ARMI[nome]) return 'arma';
  if (ARMATURE[nome]) return 'armatura';
  if (SCUDI[nome] !== undefined) return 'scudo';
  if (ELMI.includes(nome)) return 'elmo';
  if (/mantello/i.test(nome)) return 'mantello';
  if (/amuleto|collana|ciondolo/i.test(nome)) return 'amuleto';
  if (/anello/i.test(nome)) return null;
  if (/spada|ascia|martello|mazza|lancia|arco|balestra|pugnale|bastone|stocco|falcione|scimitarra/i.test(nome)) return 'arma';
  if (/armatura|corazza|cotta|maglia/i.test(nome)) return 'armatura';
  if (/scudo/i.test(nome)) return 'scudo';
  if (/elmo|cappello|cappuccio|corona/i.test(nome)) return 'elmo';
  return null;
}
if (typeof module !== 'undefined') module.exports = { Comandi, trovaOggetto, tipoOggetto, pulisci, parolaNumero };
