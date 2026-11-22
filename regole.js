/* Regole di D&D 5ª edizione (SRD 5.1) e D&D 3.5 (SRD 3.5): dati e calcoli automatici della scheda.
   Solo contenuti del System Reference Document, pubblicati con licenza libera (CC-BY-4.0 / OGL). */
const CAR = ['for', 'des', 'cos', 'int', 'sag', 'car'];
const CAR_NOMI = { for: 'Forza', des: 'Destrezza', cos: 'Costituzione', int: 'Intelligenza', sag: 'Saggezza', car: 'Carisma' };
const CAR_SIGLE = { for: 'FOR', des: 'DES', cos: 'COS', int: 'INT', sag: 'SAG', car: 'CAR' };
const mod = v => Math.floor(((Number(v) || 10) - 10) / 2);
const segno = n => (n >= 0 ? '+' : '') + n;

const REGOLE = {
  '5e': {
    nome: 'D&D 5ª edizione',
    razze: {
      'Umano': { car: { for: 1, des: 1, cos: 1, int: 1, sag: 1, car: 1 }, vel: 9, taglia: 'media' },
      'Nano': { car: { cos: 2 }, vel: 7.5, taglia: 'media', tratti: 'Scurovisione, resistenza al veleno' },
      'Elfo': { car: { des: 2 }, vel: 9, taglia: 'media', tratti: 'Scurovisione, trance, sensi acuti' },
      'Halfling': { car: { des: 2 }, vel: 7.5, taglia: 'piccola', tratti: 'Fortunato, coraggioso' },
      'Dragonide': { car: { for: 2, car: 1 }, vel: 9, taglia: 'media', tratti: 'Arma a soffio, resistenza ai danni' },
      'Gnomo': { car: { int: 2 }, vel: 7.5, taglia: 'piccola', tratti: 'Scurovisione, astuzia gnomesca' },
      'Mezzelfo': { car: { car: 2, des: 1, cos: 1 }, vel: 9, taglia: 'media', tratti: 'Scurovisione, retaggio fatato' },
      'Mezzorco': { car: { for: 2, cos: 1 }, vel: 9, taglia: 'media', tratti: 'Scurovisione, tenacia implacabile' },
      'Tiefling': { car: { car: 2, int: 1 }, vel: 9, taglia: 'media', tratti: 'Scurovisione, resistenza infernale' }
    },
    classi: {
      'Barbaro': { dv: 12, ts: ['for', 'cos'], abilita: 2, magia: null, equip: ['Ascia bipenne', 'Giavellotti', 'Armatura di pelle'] },
      'Bardo': { dv: 8, ts: ['des', 'car'], abilita: 3, magia: 'car', equip: ['Stocco', 'Liuto', 'Armatura di cuoio'] },
      'Chierico': { dv: 8, ts: ['sag', 'car'], abilita: 2, magia: 'sag', equip: ['Mazza', 'Corazza a scaglie', 'Scudo', 'Simbolo sacro'] },
      'Druido': { dv: 8, ts: ['int', 'sag'], abilita: 2, magia: 'sag', equip: ['Bastone', 'Armatura di cuoio', 'Scudo di legno'] },
      'Guerriero': { dv: 10, ts: ['for', 'cos'], abilita: 2, magia: null, asiExtra: [6, 14], equip: ['Spada lunga', 'Cotta di maglia', 'Scudo'] },
      'Ladro': { dv: 8, ts: ['des', 'int'], abilita: 4, magia: null, asiExtra: [10], equip: ['Spada corta', 'Pugnale', 'Armatura di cuoio', 'Arnesi da scasso'] },
      'Mago': { dv: 6, ts: ['int', 'sag'], abilita: 2, magia: 'int', equip: ['Bastone', 'Libro degli incantesimi', 'Mantello'] },
      'Monaco': { dv: 8, ts: ['for', 'des'], abilita: 2, magia: null, equip: ['Bastone', 'Dardi'] },
      'Paladino': { dv: 10, ts: ['sag', 'car'], abilita: 2, magia: 'car', equip: ['Spada lunga', 'Cotta di maglia', 'Scudo', 'Simbolo sacro'] },
      'Ranger': { dv: 10, ts: ['for', 'des'], abilita: 3, magia: 'sag', equip: ['Arco lungo', 'Spada corta', 'Armatura di cuoio borchiato'] },
      'Stregone': { dv: 6, ts: ['cos', 'car'], abilita: 2, magia: 'car', equip: ['Pugnale', 'Focus arcano', 'Mantello'] },
      'Warlock': { dv: 8, ts: ['sag', 'car'], abilita: 2, magia: 'car', equip: ['Balestra leggera', 'Armatura di cuoio', 'Amuleto'] }
    },
    abilita: { 'Acrobazia': 'des', 'Addestrare animali': 'sag', 'Arcano': 'int', 'Atletica': 'for', 'Furtività': 'des', 'Indagare': 'int', 'Inganno': 'car', 'Intimidire': 'car', 'Intrattenere': 'car', 'Intuizione': 'sag', 'Medicina': 'sag', 'Natura': 'int', 'Percezione': 'sag', 'Persuasione': 'car', 'Rapidità di mano': 'des', 'Religione': 'int', 'Sopravvivenza': 'sag', 'Storia': 'int' },
    px: [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000],
    livelloMax: 20
  },
  '3.5': {
    nome: 'D&D 3.5',
    razze: {
      'Umano': { car: {}, vel: 9, taglia: 'media', tratti: 'Talento extra, 4 gradi di abilità extra al 1° livello' },
      'Nano': { car: { cos: 2, car: -2 }, vel: 6, taglia: 'media', tratti: 'Scurovisione 18 m, esperto minatore' },
      'Elfo': { car: { des: 2, cos: -2 }, vel: 9, taglia: 'media', tratti: 'Visione crepuscolare, immune al sonno magico' },
      'Gnomo': { car: { cos: 2, for: -2 }, vel: 6, taglia: 'piccola', tratti: 'Visione crepuscolare, illusioni' },
      'Mezzelfo': { car: {}, vel: 9, taglia: 'media', tratti: 'Visione crepuscolare, sangue elfico' },
      'Mezzorco': { car: { for: 2, int: -2, car: -2 }, vel: 9, taglia: 'media', tratti: 'Scurovisione 18 m' },
      'Halfling': { car: { des: 2, for: -2 }, vel: 6, taglia: 'piccola', tratti: '+1 a tutti i tiri salvezza' }
    },
    classi: {
      'Barbaro': { dv: 12, bab: 1, ts: ['tem'], gradi: 4, magia: null, equip: ['Ascia bipenne', 'Armatura di pelle'] },
      'Bardo': { dv: 6, bab: 0.75, ts: ['rif', 'vol'], gradi: 6, magia: 'car', equip: ['Stocco', 'Liuto', 'Armatura di cuoio'] },
      'Chierico': { dv: 8, bab: 0.75, ts: ['tem', 'vol'], gradi: 2, magia: 'sag', equip: ['Mazza', 'Corazza a scaglie', 'Scudo'] },
      'Druido': { dv: 8, bab: 0.75, ts: ['tem', 'vol'], gradi: 4, magia: 'sag', equip: ['Bastone', 'Armatura di cuoio', 'Scudo di legno'] },
      'Guerriero': { dv: 10, bab: 1, ts: ['tem'], gradi: 2, magia: null, equip: ['Spada lunga', 'Cotta di maglia', 'Scudo'] },
      'Ladro': { dv: 6, bab: 0.75, ts: ['rif'], gradi: 8, magia: null, equip: ['Spada corta', 'Pugnale', 'Armatura di cuoio'] },
      'Mago': { dv: 4, bab: 0.5, ts: ['vol'], gradi: 2, magia: 'int', equip: ['Bastone', 'Libro degli incantesimi', 'Mantello'] },
      'Monaco': { dv: 8, bab: 0.75, ts: ['tem', 'rif', 'vol'], gradi: 4, magia: null, equip: ['Bastone'] },
      'Paladino': { dv: 10, bab: 1, ts: ['tem'], gradi: 2, magia: 'sag', equip: ['Spada lunga', 'Cotta di maglia', 'Scudo'] },
      'Ranger': { dv: 8, bab: 1, ts: ['tem', 'rif'], gradi: 6, magia: 'sag', equip: ['Arco lungo', 'Spada corta', 'Armatura di cuoio borchiato'] },
      'Stregone': { dv: 4, bab: 0.5, ts: ['vol'], gradi: 2, magia: 'car', equip: ['Pugnale', 'Mantello'] }
    },
    abilita: { 'Acrobazia': 'des', 'Artista della fuga': 'des', 'Ascoltare': 'sag', 'Cercare': 'int', 'Concentrazione': 'cos', 'Conoscenze (arcane)': 'int', 'Diplomazia': 'car', 'Disattivare congegni': 'int', 'Equilibrio': 'des', 'Guarire': 'sag', 'Intimidire': 'car', 'Muoversi silenziosamente': 'des', 'Nascondersi': 'des', 'Nuotare': 'for', 'Osservare': 'sag', 'Percepire intenzioni': 'sag', 'Raggirare': 'car', 'Saltare': 'for', 'Sapienza magica': 'int', 'Scalare': 'for', 'Scassinare': 'des', 'Sopravvivenza': 'sag' },
    px: Array.from({ length: 20 }, (_, i) => 1000 * i * (i + 1) / 2),
    livelloMax: 20
  }
};

// Armature e scudi: CA base, limite DES, aspetto nel ritratto
const ARMATURE = {
  'Armatura imbottita': { ca5: 11, ca35: 1, dmax: 99, tipo: 'leggera', look: 'stoffa' },
  'Armatura di cuoio': { ca5: 11, ca35: 2, dmax: 99, tipo: 'leggera', look: 'cuoio' },
  'Armatura di cuoio borchiato': { ca5: 12, ca35: 3, dmax: 99, tipo: 'leggera', look: 'borchie' },
  'Armatura di pelle': { ca5: 12, ca35: 3, dmax: 2, tipo: 'media', look: 'pelle' },
  'Camicia di maglia': { ca5: 13, ca35: 4, dmax: 2, tipo: 'media', look: 'maglia' },
  'Corazza a scaglie': { ca5: 14, ca35: 4, dmax: 2, tipo: 'media', look: 'scaglie' },
  'Corazza di piastre': { ca5: 14, ca35: 5, dmax: 2, tipo: 'media', look: 'piastre' },
  'Mezza armatura': { ca5: 15, ca35: 7, dmax: 2, tipo: 'media', look: 'piastre' },
  'Cotta di maglia': { ca5: 16, ca35: 5, dmax: 0, tipo: 'pesante', look: 'maglia' },
  'Armatura a strisce': { ca5: 17, ca35: 6, dmax: 0, tipo: 'pesante', look: 'piastre' },
  'Armatura completa': { ca5: 18, ca35: 8, dmax: 0, tipo: 'pesante', look: 'completa' }
};
const SCUDI = { 'Scudo': 2, 'Scudo di legno': 2, 'Scudo grande': 2, 'Buckler': 1 };
const ARMI = {
  'Spada lunga': { danno: '1d8', look: 'spada' }, 'Spada corta': { danno: '1d6', look: 'spadacorta', fin: true }, 'Spadone': { danno: '2d6', look: 'spadone' },
  'Stocco': { danno: '1d8', look: 'stocco', fin: true }, 'Pugnale': { danno: '1d4', look: 'pugnale', fin: true }, 'Ascia': { danno: '1d6', look: 'ascia' },
  'Ascia bipenne': { danno: '1d12', look: 'bipenne' }, 'Ascia da battaglia': { danno: '1d8', look: 'ascia' }, 'Martello da guerra': { danno: '1d8', look: 'martello' },
  'Mazza': { danno: '1d6', look: 'mazza' }, 'Bastone': { danno: '1d6', look: 'bastone' }, 'Lancia': { danno: '1d6', look: 'lancia' },
  'Arco lungo': { danno: '1d8', look: 'arco', dist: true }, 'Arco corto': { danno: '1d6', look: 'arco', dist: true },
  'Balestra leggera': { danno: '1d8', look: 'balestra', dist: true }, 'Balestra': { danno: '1d8', look: 'balestra', dist: true },
  'Giavellotti': { danno: '1d6', look: 'lancia' }, 'Dardi': { danno: '1d4', look: 'nessuna', dist: true }, 'Falcione': { danno: '1d10', look: 'lancia' }
};
// Slot degli incantesimi (SRD). 5e: tabella dei lanciatori completi; i mezzi lanciatori usano metà livello (per eccesso, dal 2°).
const SLOT5 = [[], [2], [3], [4, 2], [4, 3], [4, 3, 2], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1, 1], [4, 3, 3, 3, 3, 1, 1, 1, 1], [4, 3, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 3, 2, 2, 1, 1]];
const COMPLETI5 = ['Bardo', 'Chierico', 'Druido', 'Mago', 'Stregone'], MEZZI5 = ['Paladino', 'Ranger'];
// 3.5: incantesimi al giorno di base (dal livello 0); -1 = nessuno
const T35 = {
  mago: ['31', '42', '421', '432', '4321', '4332', '44321', '44332', '444321', '444332', '4444321', '4444332', '44444321', '44444332', '444444321', '444444332', '4444444321', '4444444332', '4444444433', '4444444444'],
  stregone: ['53', '64', '65', '663', '664', '6653', '6664', '66653', '66664', '666653', '666664', '6666653', '6666664', '66666653', '66666664', '666666653', '666666664', '6666666653', '6666666664', '6666666666'],
  bardo: ['2', '30', '31', '320', '331', '332', '3320', '3331', '3332', '33320', '33331', '33332', '333320', '433331', '443332', '4443320', '4444331', '4444432', '4444443', '4444444'],
  mezzo: ['', '', '', 'x0', 'x0', 'x1', 'x1', 'x10', 'x10', 'x11', 'x110', 'x111', 'x111', 'x2110', 'x2111', 'x2211', 'x2221', 'x3221', 'x3332', 'x3333']
};
const CLASSI35 = { Mago: 'mago', Chierico: 'mago', Druido: 'mago', Stregone: 'stregone', Bardo: 'bardo', Paladino: 'mezzo', Ranger: 'mezzo' };
const RARITA = ['comune', 'non comune', 'raro', 'molto raro', 'leggendario', 'artefatto'];
const COLORI_RARITA = { comune: '#bcae96', 'non comune': '#57b47a', raro: '#5b8fd9', 'molto raro': '#a98be8', leggendario: '#e8b04b', artefatto: '#e2735f' };
const INCANTESIMI_NOTI = { 'Luce': 0, 'Mano magica': 0, 'Prestidigitazione': 0, 'Fiotto acido': 0, 'Raggio di gelo': 0, 'Dardo incantato': 1, 'Scudo': 1, 'Cura ferite': 1, 'Parola guaritrice': 1, 'Sonno': 1, 'Charme su persone': 1, 'Benedizione': 1, 'Mani brucianti': 1, 'Individuazione del magico': 1, 'Invisibilità': 2, 'Passo velato': 2, 'Ristorare inferiore': 2, 'Ragnatela': 2, 'Palla di fuoco': 3, 'Fulmine': 3, 'Volare': 3, 'Controincantesimo': 3, 'Dissolvi magie': 3, 'Rianimare morti': 3, 'Porta dimensionale': 4, 'Muro di fuoco': 4, 'Cono di freddo': 5, 'Rianimare i morti': 5, 'Disintegrazione': 6, 'Teletrasporto': 7, 'Parola del potere stordire': 8, 'Desiderio': 9 };
const ELMI = ['Elmo', 'Elmo d\'acciaio', 'Cappuccio', 'Cappello da mago', 'Corona'];
const CONDIZIONI = ['accecato', 'affascinato', 'afferrato', 'assordato', 'avvelenato', 'incapacitato', 'invisibile', 'paralizzato', 'pietrificato', 'prono', 'spaventato', 'stordito', 'trattenuto', 'privo di sensi', 'esausto'];

const Regole = {
  set(r) { return REGOLE[r === '3.5' ? '3.5' : '5e']; },
  classi(pg) { return pg.classi?.length ? pg.classi : [{ classe: pg.classe, livello: pg.livello }]; },
  nomeClassi(pg) { const c = this.classi(pg); return c.length > 1 ? c.map(x => `${x.classe} ${x.livello}`).join(' / ') : pg.classe; },
  // Slot degli incantesimi per livello (indice 1..9; in 3.5 anche lo 0)
  slotMax(pg) {
    const c = this.classi(pg);
    if (pg.regole === '3.5') {
      const tot = []; const sett = this.set('3.5');
      for (const x of c) {
        const tab = T35[CLASSI35[x.classe]]; if (!tab) continue;
        const riga = tab[Math.min(19, x.livello - 1)] || '';
        const k = sett.classi[x.classe]?.magia; const m = mod(pg.car?.[k] || 10);
        [...riga].forEach((ch, i) => { const liv = CLASSI35[x.classe] === 'mezzo' ? i : i; if (ch === 'x') return; const base = Number(ch); const bonus = liv >= 1 && m >= liv ? Math.floor((m - liv) / 4) + 1 : 0; tot[liv] = (tot[liv] || 0) + base + bonus + (x.classe === 'Chierico' && liv >= 1 ? 1 : 0); });
      }
      return Array.from(tot, v => v || 0);
    }
    let lv = 0; for (const x of c) { if (COMPLETI5.includes(x.classe)) lv += x.livello; else if (MEZZI5.includes(x.classe)) lv += c.length > 1 ? Math.floor(x.livello / 2) : (x.livello >= 2 ? Math.ceil(x.livello / 2) : 0); }
    const out = [0, ...(SLOT5[Math.min(20, lv)] || [])];
    const w = c.find(x => x.classe === 'Warlock');
    if (w) { const n = w.livello >= 17 ? 4 : w.livello >= 11 ? 3 : w.livello >= 2 ? 2 : 1; const l = Math.min(5, Math.ceil(w.livello / 2)); out[l] = (out[l] || 0) + n; pg.patto = { livello: l, n }; }
    return Array.from(out, v => v || 0);
  },
  cd(pg) { const k = this.set(pg.regole).classi[this.classi(pg).find(x => this.set(pg.regole).classi[x.classe]?.magia)?.classe]?.magia; if (!k) return null; return pg.regole === '3.5' ? { cd: 10 + mod(pg.car[k]), car: k, nota: '+ livello dell\'incantesimo' } : { cd: 8 + this.competenza(pg.livello) + mod(pg.car[k]), attacco: this.competenza(pg.livello) + mod(pg.car[k]), car: k }; },
  talentiDisponibili(pg) {
    if (pg.regole !== '3.5') return null;
    let n = 1 + Math.floor(pg.livello / 3) + (pg.razza === 'Umano' ? 1 : 0);
    const g = this.classi(pg).find(x => x.classe === 'Guerriero'); if (g) n += 1 + Math.floor(g.livello / 2);
    return n;
  },
  caricoMax(pg) { const f = pg.car?.for || 10; return pg.regole === '3.5' ? Math.round(f * 5 * (pg.taglia === 'piccola' ? 0.75 : 1)) : Math.round(f * 7.5); },
  competenza(livello) { return 2 + Math.floor((Math.max(1, livello) - 1) / 4); },
  bab(r, classe, livello, pg) { if (pg && this.classi(pg).length > 1) return this.classi(pg).reduce((s, x) => s + Math.floor((this.set(r).classi[x.classe]?.bab || 0.75) * x.livello), 0); const c = this.set(r).classi[classe]; return c ? Math.floor((c.bab || 0.75) * livello) : 0; },
  tsBase35(buono, livello) { return buono ? 2 + Math.floor(livello / 2) : Math.floor(livello / 3); },
  // Caratteristiche finali = base + razza + aumenti ottenuti salendo di livello
  carFinali(pg) {
    const raz = this.set(pg.regole).razze[pg.razza]?.car || {};
    const o = {};
    for (const k of CAR) o[k] = (pg.carBase?.[k] ?? pg.car?.[k] ?? 10) + (raz[k] || 0) + (pg.carExtra?.[k] || 0);
    return o;
  },
  // Livelli in cui si guadagnano punti caratteristica
  livelliAumento(r, classe) {
    if (r === '3.5') return [4, 8, 12, 16, 20];
    return [4, 8, 12, 16, 19, ...(this.set('5e').classi[classe]?.asiExtra || [])].sort((a, b) => a - b);
  },
  dadoVita(pg) { return this.set(pg.regole).classi[pg.classe]?.dv || 8; },
  pfAlLivello1(pg) { return this.dadoVita(pg) + mod(pg.car.cos); },
  mediaPf(pg) { return Math.floor(this.dadoVita(pg) / 2) + 1; },
  // Classe Armatura dall'equipaggiamento indossato
  ca(pg) {
    const ind = (pg.equip || []).filter(e => e.indossato);
    const arm = ind.map(e => ARMATURE[e.nome]).find(Boolean);
    const scudo = ind.some(e => SCUDI[e.nome] !== undefined);
    const d = mod(pg.car.des);
    const bonusMagico = ind.reduce((s, e) => s + (Number(e.bonusCa) || 0) + ((ARMATURE[e.nome] || SCUDI[e.nome] !== undefined) ? Number(e.bonus) || 0 : 0), 0);
    if (pg.regole === '3.5') return 10 + (arm ? arm.ca35 : 0) + Math.min(d, arm ? arm.dmax : 99) + (scudo ? 1 : 0) + bonusMagico + (pg.taglia === 'piccola' ? 1 : 0) + (pg.caExtra || 0);
    let base;
    if (arm) base = arm.ca5 + Math.min(d, arm.dmax);
    else if (pg.classe === 'Barbaro') base = 10 + d + mod(pg.car.cos);
    else if (pg.classe === 'Monaco') base = 10 + d + mod(pg.car.sag);
    else base = 10 + d;
    return base + (scudo ? 2 : 0) + bonusMagico + (pg.caExtra || 0);
  },
  // Bonus di un'abilità (5e: caratteristica + competenza; 3.5: caratteristica + gradi)
  abilita(pg, nome) {
    const set = this.set(pg.regole);
    const c = set.abilita[nome]; if (!c) return 0;
    if (pg.regole === '3.5') return mod(pg.car[c]) + (pg.gradi?.[nome] || 0);
    return mod(pg.car[c]) + ((pg.competenze || []).includes(nome) ? this.competenza(pg.livello) : 0);
  },
  tiroSalvezza(pg, k) {
    if (pg.regole === '3.5') {
      const c = this.set('3.5').classi[pg.classe];
      const car = { tem: 'cos', rif: 'des', vol: 'sag' }[k];
      const base = this.classi(pg).reduce((s, x) => s + this.tsBase35(this.set('3.5').classi[x.classe]?.ts.includes(k), x.livello), 0);
      return base + mod(pg.car[car]) + (pg.razza === 'Halfling' ? 1 : 0);
    }
    const c = this.set('5e').classi[pg.classe];
    return mod(pg.car[k]) + (c?.ts.includes(k) ? this.competenza(pg.livello) : 0);
  },
  attacco(pg, arma) {
    const a = ARMI[arma?.nome] || {};
    const k = a.dist ? 'des' : a.fin ? (mod(pg.car.des) > mod(pg.car.for) ? 'des' : 'for') : 'for';
    const magico = Number(arma?.bonus) || 0;
    const bonus = (pg.regole === '3.5' ? this.bab(pg.regole, pg.classe, pg.livello, pg) + mod(pg.car[k]) : this.competenza(pg.livello) + mod(pg.car[k])) + magico;
    const dm = mod(pg.car[k]) + magico;
    return { colpire: bonus, danno: `${a.danno || '1d4'}${dm ? segno(dm) : ''}` };
  },
  iniziativa(pg) { return mod(pg.car.des) + (pg.iniziativaExtra || 0); },
  prossimoLivelloPx(pg) { return this.set(pg.regole).px[Math.min(pg.livello, 19)] ?? Infinity; },
  puoSalire(pg) { return pg.livello < 20 && (pg.px || 0) >= this.prossimoLivelloPx(pg); },
  // Ricalcola tutto ciò che deriva da altri valori
  ricalcola(pg) {
    pg.car = this.carFinali(pg);
    pg.taglia = this.set(pg.regole).razze[pg.razza]?.taglia || 'media';
    pg.vel = this.set(pg.regole).razze[pg.razza]?.vel || 9;
    pg.ca = this.ca(pg);
    pg.pf = Math.min(pg.pf, pg.pfMax);
    pg.slotUsati = pg.slotUsati || [];
    return pg;
  },
  // Incantesimi: lanciarne uno consuma uno slot del livello scelto (o superiore)
  lancia(pg, nome, livelloSlot) {
    const inc = (pg.incantesimi || []).find(i => i.nome.toLowerCase() === String(nome).toLowerCase()) || { nome, livello: INCANTESIMI_NOTI[nome] ?? livelloSlot ?? 1 };
    if (!inc.livello) return { ok: true, msg: `lancia ${inc.nome} (trucchetto, nessuno slot)` };
    const max = this.slotMax(pg); pg.slotUsati = pg.slotUsati || [];
    for (let l = Math.max(inc.livello, livelloSlot || 0); l < max.length; l++) {
      if ((max[l] || 0) - (pg.slotUsati[l] || 0) > 0) { pg.slotUsati[l] = (pg.slotUsati[l] || 0) + 1; return { ok: true, msg: `lancia ${inc.nome} usando uno slot di ${l}° livello (restano ${max[l] - pg.slotUsati[l]})` }; }
    }
    return { ok: false, msg: `nessuno slot libero per ${inc.nome}` };
  },
  recuperaSlot(pg, soloPatto) { if (soloPatto && pg.patto) pg.slotUsati[pg.patto.livello] = 0; else pg.slotUsati = []; },
  // Sale di un livello: punti ferita, aumenti di caratteristica, gradi di abilità (3.5)
  saliLivello(pg, tiroDado, classeScelta) {
    if (pg.livello >= 20) return { ok: false, msg: 'Sei già al livello massimo' };
    const set = this.set(pg.regole);
    pg.classi = this.classi(pg).map(x => ({ ...x }));
    const nuova = classeScelta && set.classi[classeScelta] ? classeScelta : pg.classe;
    let voce = pg.classi.find(x => x.classe === nuova);
    if (!voce) { voce = { classe: nuova, livello: 0 }; pg.classi.push(voce); }
    voce.livello++;
    pg.livello++;
    const dv = set.classi[nuova]?.dv || 8;
    const guadagno = Math.max(1, (tiroDado || Math.floor(dv / 2) + 1) + mod(pg.car.cos));
    pg.pfMax += guadagno; pg.pf += guadagno;
    const note = [`livello ${pg.livello}${pg.classi.length > 1 ? ' (' + nuova + ' ' + voce.livello + ')' : ''}`, `+${guadagno} punti ferita massimi`];
    if (pg.regole === '3.5' ? this.livelliAumento('3.5').includes(pg.livello) : this.livelliAumento('5e', nuova).includes(voce.livello)) {
      const punti = pg.regole === '3.5' ? 1 : 2;
      pg.puntiCar = (pg.puntiCar || 0) + punti;
      note.push(`${punti} punt${punti > 1 ? 'i' : 'o'} caratteristica da assegnare`);
    }
    if (pg.regole === '3.5') {
      const c = this.set('3.5').classi[nuova];
      const gr = Math.max(1, (c?.gradi || 2) + mod(pg.car.int) + (pg.razza === 'Umano' ? 1 : 0));
      pg.puntiAbilita = (pg.puntiAbilita || 0) + gr;
      note.push(`${gr} gradi di abilità`);
      if ([3, 6, 9, 12, 15, 18].includes(pg.livello)) note.push('nuovo talento');
    }
    if (pg.regole === '5e' && [5, 9, 13, 17].includes(pg.livello)) note.push(`bonus di competenza +${this.competenza(pg.livello)}`);
    if (voce.livello === 1 && pg.classi.length > 1) note.push(`nuova classe: ${nuova}`);
    pg.storiaLivelli = [...(pg.storiaLivelli || []), { livello: pg.livello, classe: nuova, pf: guadagno, t: Date.now() }];
    this.ricalcola(pg);
    return { ok: true, msg: note.join(', ') };
  },
  // Aumenta una caratteristica: usa prima i punti guadagnati con i livelli
  aumentaCar(pg, k, delta) {
    if (!CAR.includes(k)) return null;
    pg.carExtra = pg.carExtra || {};
    pg.carExtra[k] = (pg.carExtra[k] || 0) + delta;
    if (delta > 0 && pg.puntiCar) pg.puntiCar = Math.max(0, pg.puntiCar - delta);
    const primaCos = pg.car.cos;
    this.ricalcola(pg);
    // Un cambio di Costituzione cambia i PF massimi per ogni livello
    if (k === 'cos') { const d = (mod(pg.car.cos) - mod(primaCos)) * pg.livello; pg.pfMax += d; pg.pf += d; }
    return `${CAR_NOMI[k]} ${delta > 0 ? '+' : ''}${delta} (ora ${pg.car[k]}, modificatore ${segno(mod(pg.car[k]))})`;
  },
  nuovo(regole, dati) {
    const set = this.set(regole);
    const classe = set.classi[dati.classe] ? dati.classe : Object.keys(set.classi)[0];
    const razza = set.razze[dati.razza] ? dati.razza : Object.keys(set.razze)[0];
    const pg = {
      regole, nome: dati.nome || 'Senza nome', razza, classe, livello: 1, px: 0,
      carBase: { ...dati.carBase }, carExtra: {}, car: {}, competenze: dati.competenze || [], gradi: dati.gradi || {},
      equip: (set.classi[classe].equip || []).map(n => ({ nome: n, qta: 1, indossato: !!(ARMATURE[n] || SCUDI[n] !== undefined || ARMI[n] || n === 'Mantello' || n === 'Amuleto') })),
      oro: dati.oro ?? 15, condizioni: [], ferite: [], aspetto: dati.aspetto || {}, note: '', allineamento: dati.allineamento || 'Neutrale',
      puntiCar: 0, puntiAbilita: regole === '3.5' ? Math.max(1, (set.classi[classe].gradi + mod((dati.carBase?.int || 10) + (set.razze[razza].car.int || 0))) * 4 + (razza === 'Umano' ? 4 : 0)) : 0,
      creato: Date.now()
    };
    // una sola arma in mano all'inizio (la prima), lo zaino tiene le altre
    let armaFatta = false;
    pg.equip.forEach(e => { if (ARMI[e.nome]) { if (armaFatta) e.indossato = false; armaFatta = true; } });
    pg.car = this.carFinali(pg);
    pg.pfMax = Math.max(1, this.pfAlLivello1(pg)); pg.pf = pg.pfMax;
    return this.ricalcola(pg);
  },
  tira4d6() { const d = () => 1 + Math.floor(Math.random() * 6); const v = [d(), d(), d(), d()].sort((a, b) => a - b); return v[1] + v[2] + v[3]; },
  arrayStandard: [15, 14, 13, 12, 10, 8]
};
if (typeof module !== 'undefined') module.exports = { Regole, REGOLE, ARMATURE, SCUDI, ARMI, ELMI, CONDIZIONI, CAR, CAR_NOMI, CAR_SIGLE, mod, segno };
