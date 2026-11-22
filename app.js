/* Tavolo d'Avventura — app principale: ingresso, stanza online, scheda, dadi, mappa, diario, voce, rapporti, aggiornamenti */
const VERSION = '3.0.3';
const CHANGELOG = [
  { v: '3.0.3', data: '22/11/2026', voci: [
    'La mappa del mondo sul telefono si apre centrata sul luogo dove siete (prima restava sul bordo).',
    'Spettatori e TV non hanno più il tasto del microfono; la TV non mostra i bottoni delle reazioni.',
    'I sottotitoli non coprono più le finestre aperte; scegliendo la lingua si traducono subito anche le ultime battute.',
    'Premi della campagna solo quando sono meritati (non più «Lanciadadi compulsivo» con un tiro solo).'
  ] },
  { v: '3.0.2', data: '22/11/2026', voci: [
    'Tronchi e ceppi della grafica nuova restano nella loro casella (non coprono più strade e caselle vicine); i ponti di legno si vedono sopra l\'acqua.'
  ] },
  { v: '3.0.1', data: '22/11/2026', voci: [
    'Mappe all\'aperto: niente più quadrati neri, le rocce sono massi veri sul prato.',
    'Ponti, viadotti e guadi hanno il fiume e il ponte sulla mappa; se il ponte è spezzato si passa dal guado.',
    'Chi non ha ancora la scheda ha comunque una figura sulla mappa; i nomi sotto le figure si leggono (anche a mappa intera).',
    'Il combattimento non parte più vuoto ("tocca a —"): serve almeno un personaggio o un nemico.',
    'Ogni mappa si controlla da sola: se qualcosa non va, finisce nel rapporto.'
  ] },
  { v: '3.0.0', data: '22/11/2026', voci: [
    'Tre avventure pronte nuove: il seguito della miniera ("L\'ombra della Torre di Corvonero") e due da una serata ("La notte della lanterna", "Il pedaggio dell\'ogre"). Finita un\'avventura si sceglie la prossima dallo schermo del master.',
    'Calendario delle serate: il master propone la data, ognuno risponde "ci sono" e mette il promemoria nel calendario del telefono (in Altro).',
    'Amici spettatori: un link apposta per guardare la partita senza giocare, con le reazioni che volano sulla mappa.',
    'Traduzione automatica del master e della chat (inglese, spagnolo, francese, tedesco, italiano), da Altro.',
    'Note sulla mappa: tocca 📌 Nota e scrivi "trappola", "porta chiusa"… restano sul luogo per tutti.',
    'Giochi di taverna: dadi o carte con le monete della scheda, chi vince prende il piatto (nel Tesoro).',
    'Cornici intorno al nome per chi viene alle serate (bronzo, argento, oro, leggenda), sfida della settimana da giocare da soli e guida "Come si gioca" per chi non ha mai giocato.'
  ] },
  { v: '2.9.0', data: '22/11/2026', voci: [
    'Il mondo è vivo: bacheca delle missioni, nemesi che torna, minacce che crescono se le ignorate e scelte morali che cambiano il finale (nel Diario).',
    'Voto del gruppo: quando c\'è da decidere insieme ognuno vota dal telefono.',
    'Enigmi e indovinelli: rispondete dall\'app, dopo tre errori arriva un indizio.',
    'Obiettivo segreto per ogni personaggio (lo vedete solo voi e il master) e sogni privati con indizi.',
    'Casa del gruppo con stanze che danno vantaggi, mestieri e creazione di oggetti, animali compagni e cavalcature.',
    'Mercante ambulante con oggetti rari, prezzi diversi a seconda di come vi vedono nel luogo, ora e meteo che cambiano la partita.'
  ] },
  { v: '2.8.0', data: '22/11/2026', voci: [
    'Diario del personaggio: a fine serata ognuno riceve una pagina scritta dal punto di vista del suo personaggio (nella Scheda).',
    'Bentornato: chi ha saltato una o più serate, quando rientra, trova il racconto di cosa si è perso.',
    'Cartolina della serata: dal riepilogo, un\'immagine ricordo con illustrazione, momento migliore e personaggi, da mandare sul gruppo.',
    'Personaggi incontrati: nel Diario la galleria dei PNG con volto, luogo e cosa si sa di loro.',
    'Storia e famiglia: rispondi a quattro domande e il master scrive la storia del tuo personaggio, che poi usa nell\'avventura.',
    'Memoriale dei caduti: chi muore resta ricordato con le sue imprese, e puoi creare un erede che riceve un suo oggetto.',
    'Premi della campagna nelle statistiche (Re degli 1 naturali, Spugna del gruppo, Mani bucate...) e libro della campagna con diari e memoriale.'
  ] },
  { v: '2.7.0', data: '22/11/2026', voci: [
    'Musica vera che cambia da sola con la scena: giorno, notte, taverna, dungeon, combattimento e boss (JP Soundworks). Si accende con "Musica e suoni d\'ambiente" in Altro.',
    'Effetti sonori: il master ha una tavola dei suoni (porta, colpo, magia, monete, pozione, tuono, vittoria, sconfitta) che suona su tutti i telefoni; anche il master AI li usa nei momenti giusti.',
    'Controller: se colleghi un gamepad (es. sulla Odin) si attiva da solo. Croce per muoverti, A per tirare, X tenuto per parlare, dorsali per cambiare scheda, Y per vedere tutta la mappa.',
    'Dadi personalizzati: in Altro scegli colore e materiale (opaco, lucido, metallo, gemma) dei tuoi dadi 3D.',
    'Momento epico sul 20 naturale: grande animazione per tutti, suono e il master racconta l\'impresa.'
  ] },
  { v: '2.6.0', data: '22/11/2026', voci: [
    'Mappe disegnate a mano: prati, strade, acqua, alberi di stagione, case, botteghe, taverne e oggetti presi dai pacchetti grafici comprati (The Fan-tasy Tileset, Time Fantasy, pixelbean). La grafica arriva solo a chi è dentro la campagna.',
    'Illustrazioni anche quando finiscono i crediti gratuiti di Cloudflare: c\'è la riserva di Hugging Face.'
  ] },
  { v: '2.5.4', data: '22/11/2026', voci: [
    'Partita bot più leggera: non consuma più le immagini gratuite del giorno (ne fa una sola, piccola, per controllare il servizio) e alla fine la campagna di prova si cancella da sola.',
    'Master AI più veloce: riparte dal modello di Gemini che ha appena risposto invece di riprovare quelli occupati.',
    'Il rapporto della partita bot resta intero anche se metti l\'app in sottofondo mentre gira.'
  ] },
  { v: '2.5.3', data: '22/11/2026', voci: [
    'Comandi a voce: i nomi delle abilità dell\'altra edizione vengono capiti (in 3.5 "tiro per furtività" tira Muoversi silenziosamente, in 5e "tiro per osservare" tira Percezione).',
    'Illustrazioni: quando finisce la quota gratuita del giorno l\'app lo dice chiaramente e prova anche i modelli immagine di Gemini.'
  ] },
  { v: '2.5.2', data: '22/11/2026', voci: [
    'Controllo completo: sulla TV la mappa mostra sempre tutta la parte scoperta e niente comandi; sul computer la barra "Annulla" non copre più il tasto per parlare.',
    'Illustrazioni: se non riescono l\'app lo dice, e il luogo viene disegnato anche quando il master AI è occupato.'
  ] },
  { v: '2.5.1', data: '22/11/2026', voci: ['Dadi: resta evidenziato il dado che hai appena lanciato, non più sempre il d20.'] },
  { v: '2.5.0', data: '22/11/2026', voci: [
    'Grafica più armoniosa e leggibile: titolo della campagna più leggibile, presenze compatte, stesse spaziature e titoli in tutte le schede, strumenti della mappa ordinati in due colonne con lo zoom raccolto in un unico comando.',
    'I sottotitoli del master non coprono più il tasto per parlare, la barra "Annulla" né la fine delle pagine.',
    'Il volto del PNG usa il ritratto in pixel art se l\'immagine non arriva; le illustrazioni non lasciano più riquadri neri.'
  ] },
  { v: '2.4.4', data: '22/11/2026', voci: [
    'In Altro, "Avvia partita bot" prende il posto del bot di prova: ogni volta crea una campagna nuova con 4 personaggi bot (razze, classi e nomi diversi) e il master AI, che in pochi minuti provano tutte le funzioni. La tua campagna non viene toccata e alla fine parte il rapporto completo.'
  ] },
  { v: '2.4.3', data: '22/11/2026', voci: [
    'Master AI più pronto: se un modello di Gemini ci mette troppo (oltre 30 secondi), passa subito a un altro invece di bloccare la partita.'
  ] },
  { v: '2.4.2', data: '22/11/2026', voci: [
    'Il d100 si tira come al tavolo: due dadi da dieci, uno per le decine (00-90) e uno per le unità (0-9). Prima il dado mostrava un numero diverso dal risultato.',
    'Master AI più resistente: se un modello Gemini ha finito la quota gratuita o non esiste più, passa da solo ad altri modelli. Se la quota è finita per tutti, l\'app lo dice chiaramente.'
  ] },
  { v: '2.4.1', data: '22/11/2026', voci: [
    'Controllo di qualità: quando il telefono si risveglia o torna la rete, l\'app si ricollega subito (e rifà una connessione rimasta muta).',
    'Vista 3D più leggera: quando vi muovete si aggiornano solo luci e buio, non tutto il luogo; edifici bruciati o distrutti si vedono subito anche in 3D.',
    'Zoom con due dita più fluido sulla mappa 2D; avvio più veloce perché figure e grafica 3D restano salvate nel telefono.',
    'Gli avvisi compaiono in alto e non coprono più i sottotitoli del master.'
  ] },
  { v: '2.4.0', data: '22/11/2026', voci: [
    'Niente più muri attraversati: il personaggio cammina sul percorso vero e gira intorno a muri, case e mobili. Se un punto non si raggiunge, l\'app lo dice.',
    'Le parti della mappa non ancora viste restano al buio: si scopre solo ciò che i personaggi vedono davvero (i muri bloccano la vista).',
    'Zoom sulla mappa 2D e 3D: due dita, rotellina o i tasti − e +. "Tutta la mappa" mostra tutto ciò che il gruppo ha già scoperto. Col dito si sposta la vista.',
    'Oggetti al loro posto e in proporzione: letti lunghi due caselle con la testiera al muro e il baule ai piedi, scaffali e rastrelliere contro le pareti, sedie girate verso i tavoli, misure vere in 3D (una casella è 1,5 m).',
    'Mostri, PNG e compagni compaiono sempre su caselle libere, mai dentro un muro o un mobile.'
  ] },
  { v: '2.3.0', data: '22/11/2026', voci: [
    'Avventura pronta "La miniera dei goblin" (livelli 1-3, una serata): luoghi, PNG, incontri, tesori e segreti già preparati. Si sceglie creando la campagna o dallo schermo del master; il master AI la segue, quello umano la trova nello schermo del master.',
    'Gioco da solo: il master AI interpreta anche due compagni (Mira la ranger e Fra\' Tobia il chierico), che sono sulla mappa e combattono con te.',
    'Mappa del mondo illustrata come una pergamena: mare, coste, boschi, monti, fiumi e i vostri viaggi. Si allarga man mano che scoprite luoghi nuovi.',
    'Statistiche e trofei: critici, cadute, danni, cure e spese per ognuno, con i trofei della serata anche nel riepilogo.',
    'Sottotitoli grandi mentre parla il master (si possono spegnere in Altro).'
  ] },
  { v: '2.2.0', data: '22/11/2026', voci: [
    'Negozi: quando il master apre il banco di un mercante, nella Scheda comprate e vendete con le vostre monete (si vende a metà prezzo).',
    'Inventario con le icone in pixel art: trascina l\'icona sul ritratto per indossare un oggetto.',
    'Schermo del master (in Altro): PNG pronti, incontri bilanciati sul livello del gruppo da mettere sulla mappa, tesori casuali, negozi e note segrete.',
    'Libro della campagna: riepiloghi, illustrazioni e cronaca completa in un libro da stampare o salvare in PDF.',
    'Sessione zero: crea il personaggio con il master, che ti fa qualche domanda (anche a voce) e lo collega agli altri del gruppo.'
  ] },
  { v: '2.1.0', data: '22/11/2026', voci: [
    'Battaglie spettacolari: i personaggi fanno la mossa vera quando attaccano (fendente, affondo, arco, incantesimo), i danni e le cure saltano fuori sopra le figure, i nemici sconfitti svaniscono, gli incantesimi ad area esplodono col loro colore.',
    'Condizioni visibili: a terra se K.O. o prono, verde se avvelenato, stelline se stordito, trasparente se invisibile.',
    'Mostri disegnati: draghi, lupi, scheletri e gli altri mostri vengono disegnati una volta sola e restano per tutta la campagna.',
    'Volti dei PNG: quando un personaggio del master parla compare il suo volto illustrato.',
    'Dadi 3D che rotolano e si fermano sul numero uscito (si possono spegnere in Altro).'
  ] },
  { v: '2.0.0', data: '22/11/2026', voci: [
    'Vista 3D in stile HD-2D (pulsante "Vista 3D" sotto la mappa): muri, case e tetti in rilievo, oggetti di scena in 3D, personaggi in piedi che camminano, sole e luci vere con le ombre, pioggia e neve, bagliore delle luci e sfocatura di profondità.',
    'Nella vista 3D: trascina per spostare l\'inquadratura, due dita per avvicinarti, tocca una casella per muoverti, tieni premuto su un edificio. La scelta resta salvata; su telefoni poco potenti conviene la vista 2D.'
  ] },
  { v: '1.9.0', data: '22/11/2026', voci: [
    'Voce naturale del master: narratore e personaggi parlano con voci vere e diverse (Gemini). Se non arriva in tempo, legge la voce del telefono.',
    'Illustrazioni realistiche: quando scoprite un luogo nuovo o succede qualcosa di memorabile compare un\'immagine nel diario; il master può chiederne una con "Illustra la scena".',
    'Fine serata: riepilogo illustrato con racconto, nemici sconfitti, bottino, PX e livelli, da condividere nel gruppo.',
    'Suoni della scena: pioggia, vento, tuoni coi lampi, crepitio del fuoco più forte quando ci siete vicini.',
    'Vista del personaggio: vedete solo ciò che il vostro personaggio vede davvero; al buio serve una torcia, nani ed elfi hanno la scurovisione.',
    'Personaggi animati come nelle Cronache dei Varchi: camminano sulla mappa e mostrano armatura e armi; in scena anche l\'oste, gli abitanti e i nemici con forma umana. Nuova scelta "Figura" nell\'aspetto.'
  ] },
  { v: '1.8.0', data: '22/11/2026', voci: [
    'Mappe con la tecnologia delle Cronache dei Varchi: luci vere che proiettano le ombre dei muri, buio di notte, lanterne accese davanti alle porte, fiamme che tremolano.',
    'Ombre del sole che cambiano con l\'ora: lunghe verso ovest al mattino, corte a mezzogiorno, lunghe verso est la sera.',
    'Meteo sulla mappa: pioggia, temporale con i lampi, neve, nebbia. Stagioni: foglie rosse in autunno, alberi spogli e neve d\'inverno, fiori in primavera.',
    'Muri in rilievo e personaggi in piedi sulla loro basetta, come nello stile HD-2D. Il master AI decide ora e tempo atmosferico; se non lo fa, vale l\'ora vera.'
  ] },
  { v: '1.7.0', data: '22/11/2026', voci: [
    'Mappe nuove in stile battle map di D&D, molto più realistiche: pavimenti in legno e pietra, ciottoli, erba, acqua con le rive, tetti con le tegole, ombre dei muri, luce di camini, torce e candele.',
    'Oggetti di scena sulla mappa: tavoli, sedie, botti, casse, bauli, letti, scaffali, forzieri, altari, colonne, carretti, bancarelle, tronchi, massi e altro. Restano al loro posto quando tornate.',
    'Il master AI sposta, rompe, brucia, toglie o aggiunge oggetti in base a quello che succede; il master umano può trascinare quelli movibili. Se un edificio brucia, bruciano anche gli oggetti dentro.',
    'I personaggi sulla mappa hanno il loro ritratto e un anello che mostra i punti ferita.'
  ] },
  { v: '1.6.3', data: '22/11/2026', voci: [
    'Lo stato degli edifici (danneggiato, bruciato, distrutto) lo cambia solo il master: quello AI in automatico in base a ciò che succede in gioco, quello umano a mano.'
  ] },
  { v: '1.6.2', data: '22/11/2026', voci: [
    'Mappa: un tocco breve su una casella sposta il tuo segnalino (niente più finestra dell\'edificio che si apre per sbaglio).',
    'Per vedere un edificio o cambiarne lo stato ora si tiene premuto.'
  ] },
  { v: '1.6.1', data: '22/11/2026', voci: [
    'Il master AI ricorda i PNG già incontrati: lo stesso personaggio non cambia più nome da un turno all\'altro.',
    'Inizi d\'avventura più originali e narrazione meno ripetitiva.',
    'Master più rapido con i modelli Gemini più recenti (ragionamento minimo invece di quello pieno).',
    'Nuove frasi vocali: "togli la pozione", "bevo la pozione", "elimino la corda".',
    'Se l\'app si apre a metà di un aggiornamento, si ricarica da sola una volta invece di bloccarsi.'
  ] },
  { v: '1.6.0', data: '22/11/2026', voci: [
    'Maestro e allievo: il master usa il modello migliore (Claude, se attivato, oppure Gemini Flash), i compiti leggeri usano Gemini Flash-Lite, più veloce.',
    'Server di inoltro per la voce: se attivato, la chat vocale funziona anche fra reti mobili diverse.',
    'Connettore "D&D" per Claude: si può leggere la campagna e preparare la sessione dalla chat di Claude.',
    'Due canali: pubblico per gli amici, prova per le versioni nuove.'
  ] },
  { v: '1.5.0', data: '22/11/2026', voci: [
    'Musica e suoni d\'ambiente generati dall\'app: cambiano da soli con il luogo e durante il combattimento; suoni per dadi, critici e livelli.',
    'Edifici in cui entrare: l\'interno viene creato una volta (stanze e descrizione dall\'IA gratuita di Cloudflare) e poi resta sempre uguale.',
    'Eventi stagionali: neve a dicembre, colori di Halloween e carnevale; il master li intreccia nella storia.',
    'Calendario di gioco con giorni e stagioni gestito dal master.'
  ] },
  { v: '1.4.0', data: '22/11/2026', voci: [
    'Fazioni e reputazione: il master AI le crea e le aggiorna, e i PNG trattano il gruppo di conseguenza.',
    'Valute locali con il cambio in monete d\'oro ("trovo 30 corone di Argentea").',
    'Relazioni tra personaggi: più il legame è stretto, più della tua scheda vedono gli altri.',
    'Il mondo va avanti tra una sessione e l\'altra: ricostruzioni, notizie del banditore, fazioni.',
    'Mappa del mondo con i luoghi conosciuti e il diario dei viaggi del gruppo.'
  ] },
  { v: '1.3.0', data: '22/11/2026', voci: [
    'Incantesimi: slot per livello calcolati da soli (5e e 3.5, anche patto del warlock e incantesimi bonus), CD e attacco, "lancio palla di fuoco" a voce.',
    'Talenti nella scheda, con il conteggio dei talenti disponibili in 3.5; in 5e un talento può sostituire l\'aumento di caratteristica.',
    'Multiclasse: quando sali di livello scegli la classe; BAB, tiri salvezza, slot e PF seguono le regole.',
    'Oggetti magici con bonus e rarità ("trovo una spada lunga +1 rara"): il bonus conta per colpire, danni e CA, e l\'arma brilla nel ritratto.',
    'Aspetto con altezza e peso, capacità di carico calcolata; il master AI ne tiene conto nel racconto.'
  ] },
  { v: '1.2.0', data: '22/11/2026', voci: [
    'Combattimento a turni: iniziativa tirata in automatico, ordine sullo schermo, "fine turno" anche a voce, avviso quando tocca a te.',
    'Gittata di movimento evidenziata sulla mappa nel tuo turno e aree degli incantesimi (cerchio, quadrato, cono, linea) visibili a tutti.',
    'Nebbia di guerra: si vede solo ciò che il gruppo ha esplorato; il master vede tutto.',
    'Tesoro del gruppo: monete e oggetti in comune, "dividi il bottino" a voce o col tasto.',
    'Volti dei PNG nelle vignette del master, sempre uguali per lo stesso personaggio.',
    'Il master AI gestisce combattimenti, PF dei nemici e bottino.'
  ] },
  { v: '1.1.0', data: '22/11/2026', voci: [
    'Tasto "Tieni premuto e parla": comandi vocali e azioni per il master anche con la chat vocale accesa (su Android il microfono si libera solo mentre parli).',
    'Prova prima della partita: usa lo stesso microfono della chat vocale, niente più "Non ti sento" falso.',
    'Bot di prova per l\'amministratore: gioca da solo una partita completa e manda il rapporto.',
    'Tiri rapidi: ultimi tiri e preferiti a portata di dito.',
    'Pannello dell\'uso dell\'AI per sessione (chiamate, token, modelli).',
    'Si può lasciare una campagna; l\'amministratore può togliere un membro.',
    'Le narrazioni del master e dei PNG finiscono nei rapporti.',
    'Barra in alto più ordinata sul telefono.'
  ] },
  { v: '1.0.0', data: '22/11/2026', voci: [
    'Prima versione: stanze online con codice e QR che cambia a ogni sessione.',
    'Chat vocale tra i giocatori e master che legge ad alta voce, con voci diverse per i PNG.',
    'Master AI (o master in carne e ossa) con memoria della campagna.',
    'Regolamento a scelta: D&D 5ª edizione o 3.5, con scheda che si calcola da sola (PF, CA, livelli, caratteristiche, abilità, tiri salvezza).',
    'Comandi vocali sulla scheda: "aumenta di due punti intelligenza", "subisco 7 danni", "equipaggio l\'ascia bipenne", "tiro per percezione", "annulla".',
    'Ritratto in pixel art che cambia con ferite, armatura, armi, scudo e condizioni.',
    'Mappe persistenti: tornando in un luogo ritrovate la stessa mappa, con gli edifici bruciati o distrutti.',
    'Dadi tirati dal server (nessuno bara), vantaggio, svantaggio e tiri segreti del master.',
    'Modalità TV, prova di microfono e connessione, suggerimenti, rapporti cifrati e aggiornamento dall\'app.'
  ] }
];
const SERVER_WS = location.hostname === 'localhost' ? 'ws://localhost:8787' : 'wss://rapporti-vincenzo.vincenzociriello91.workers.dev';
const urlMedia = (tipo, id) => `${SERVER_WS.replace(/^ws/, 'http')}/tavolo/${S.codice}/media/${tipo}/${id}`;
let REPORT_URL = (() => { try { return localStorage.getItem('ta_report_url') || 'https://rapporti-vincenzo.vincenzociriello91.workers.dev'; } catch { return ''; } })();
const REPORT_PUBKEY = {"key_ops":["encrypt"],"ext":true,"alg":"RSA-OAEP-256","kty":"RSA","n":"sFS_s5aqCnKSiQM9bFXHWIQkxaihGR1p8Quwtd7Tz07giEL7RGaOSa8sEF7OEJGmS0fxvrHch74oQOuS7O4UnTxNfKOFAoVWALB4R4vT-Vl6ke5ql1i9jmCbUPvHjz9XCnlpX7vDurnpHPsVSaDl0Tk7ofhj8zkHBlSb2YuvIu45LippEh-nb98fru9-B6Ezc-Cwd69piNcBLTGjwoxWjBMJxkKUB0IPm60FkvlNr0NcI8fJNMWRVSuh5yhkG4GO0r-_tP2lId0ttkESO7TsOXHG1BzuOfyC-rPI6B15LEVftPyM990C2cRVxnuXmYke0n9O7sX3XCkKSIB3IwzCWCYlEKTN_16JENZCV4rLMEB4dKH8BBZLwXyGBXbrizMyovPqHhcVWpheBfZneYt9C9L2ZUekLxiFLwQHZAoRjsZOR9VgWvrTdDuOGhcNQPULIlWkRhu25jMP3_gIMA10QoQD9iwdKmjchkn_HWw7DyXSVfZnJvG8JNGAd4fJ889j","e":"AQAB"};

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const leggi = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } };
const scrivi = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const clona = o => JSON.parse(JSON.stringify(o));
function toast(msg, errore = false, ms = 3500) { const t = $('#toast'); t.textContent = msg; t.classList.toggle('errore', errore); t.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(() => t.hidden = true, ms); }
function chiedi(html, bottoni) {
  return new Promise(res => {
    const d = $('#dlg'); $('#dlgCorpo').innerHTML = html;
    $('#dlgAzioni').innerHTML = bottoni.map((b, i) => `<button value="${i}" class="${b.pieno ? 'pieno' : ''}">${esc(b.testo)}</button>`).join('');
    d.onclose = () => res(d.returnValue === '' ? -1 : Number(d.returnValue));
    d.returnValue = ''; d.showModal();
  });
}

/* ============ RAPPORTI CIFRATI ============ */
const Report = {
  sessione: { id: Math.random().toString(36).slice(2, 10), inizio: new Date().toISOString(), versione: VERSION, ua: navigator.userAgent, schermo: `${screen.width}x${screen.height}`, installata: matchMedia('(display-mode: standalone)').matches },
  eventi: [],
  log(tipo, dati) { this.eventi.push({ t: new Date().toISOString(), tipo, dati }); if (this.eventi.length > 600) this.eventi.splice(0, this.eventi.length - 600); },
  async cifra(obj) {
    const testo = new TextEncoder().encode(JSON.stringify(obj));
    const aes = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt']);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const dati = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aes, testo);
    const pub = await crypto.subtle.importKey('jwk', REPORT_PUBKEY, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt']);
    const chiave = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, pub, await crypto.subtle.exportKey('raw', aes));
    const b64 = b => { const u = new Uint8Array(b); let s = ''; for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode(...u.subarray(i, i + 8192)); return btoa(s); };
    return { app: 'TavoloAvventura', v: VERSION, alg: 'RSA-OAEP-256+A256GCM', key: b64(chiave), iv: b64(iv), data: b64(dati) };
  },
  async chiudi(motivo) {
    if (!this.eventi.length) return;
    // durante la partita bot il rapporto resta intero: in sottofondo si mandano solo quelli già pronti
    if (typeof BotProva !== 'undefined' && BotProva.attivo && /background|chiusa/.test(motivo)) { this.invia(); return; }
    this.log('fine', { motivo, stato: riepilogoStato() });
    const rapporto = { sessione: this.sessione, fine: new Date().toISOString(), motivo, eventi: this.eventi };
    this.eventi = [];
    try {
      const pacchetto = await this.cifra(rapporto);
      const coda = leggi('ta_rapporti', []); coda.push(pacchetto); while (coda.length > 30) coda.shift();
      scrivi('ta_rapporti', coda); this.invia();
    } catch (e) { console.warn('rapporto', e); }
  },
  invia() {
    if (!REPORT_URL || !navigator.onLine) return;
    const coda = leggi('ta_rapporti', []);
    if (!coda.length || this._inVolo) return;
    const url = REPORT_URL.replace(/\/$/, '') + '/r/TavoloAvventura';
    const corpo = JSON.stringify(coda);
    if (document.visibilityState === 'hidden') { if (navigator.sendBeacon(url, new Blob([corpo], { type: 'text/plain' }))) scrivi('ta_rapporti', []); return; }
    const esito = (stato, testo) => scrivi('ta_report_esito', { t: new Date().toLocaleString('it-IT'), stato, testo: String(testo).slice(0, 200), n: coda.length });
    this._inVolo = true;
    return fetch(url, { method: 'POST', body: corpo, headers: { 'Content-Type': 'text/plain' }, keepalive: corpo.length < 60000 })
      .finally(() => { this._inVolo = false; })
      .then(async r => { esito(r.status, await r.text().catch(() => '')); if (r.ok) scrivi('ta_rapporti', leggi('ta_rapporti', []).slice(coda.length)); })
      .catch(e => esito(0, e.message || e));
  },
  async salvaFile() {
    await this.chiudi('salvataggio manuale');
    const blob = new Blob([JSON.stringify(leggi('ta_rapporti', []))], { type: 'application/json' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `rapporto-tavolo-${Date.now()}.json` }); a.click();
    this.log('ripresa', {});
  }
};
window.addEventListener('error', e => {
  if (/ResizeObserver loop/.test(e.message)) return; // avviso innocuo del browser, non un errore
  Report.log('errore', { msg: e.message, file: e.filename, riga: e.lineno, col: e.colno });
  // subito dopo un aggiornamento GitHub Pages può servire index.html vecchio con app.js nuovo: si ricarica una volta sola
  if (performance.now() < 5000 && /null/.test(e.message)) { try { if (!sessionStorage.getItem('ta_ricaricata')) { sessionStorage.setItem('ta_ricaricata', '1'); location.reload(); } } catch {} }
});
window.addEventListener('unhandledrejection', e => Report.log('errore-promise', { msg: String(e.reason?.message || e.reason), stack: String(e.reason?.stack || '').slice(0, 500) }));
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') Report.chiudi('app in background o chiusa'); else { Report.log('ripresa', {}); Report.invia(); Voce.riattivaAudio(); } });
window.addEventListener('pagehide', () => Report.chiudi('chiusura'));
function riepilogoStato() {
  return { codice: S.codice || null, ruolo: me()?.ruolo, regole: S.st?.campagna?.regole, master: S.st?.campagna?.masterTipo, online: S.st?.online?.length, membri: Object.keys(S.st?.membri || {}).length,
    luogo: S.st?.luogo?.nome, voce: Voce.stato(), ascolto: Ascolto.attivo, narratore: Narratore.attivo, pg: mioPg() ? { classe: mioPg().classe, livello: mioPg().livello, pf: mioPg().pf, pfMax: mioPg().pfMax } : null };
}

/* ============ STATO ============ */
const S = { codice: null, io: null, chiave: null, st: null, ws: null, vista: 'vMappa', viewPg: null, undo: [], pendenti: {}, tentativi: 0, ultimoParlato: 0, trad: new Map(), attesaTrad: {} };
const OPZ = Object.assign({ narratore: true, avvisi: true, master: true, grandi: false, suoni: false, volume: 0.5 }, leggi('ta_opzioni', {}));
const me = () => S.st?.membri?.[S.io];
const capo = () => !!(me() && (me().ruolo === 'master' || me().admin));
const mioPg = () => S.st?.pg?.[S.io] || null;
const regole = () => S.st?.campagna?.regole || '5e';
const masterAI = () => S.st?.campagna?.masterTipo === 'ai';
const campagneSalvate = () => leggi('ta_campagne', []);
function salvaCampagna(c) { const l = campagneSalvate().filter(x => x.codice !== c.codice); l.unshift({ ...c, ultimo: Date.now() }); scrivi('ta_campagne', l.slice(0, 20)); }
function dimenticaCampagna(codice) { scrivi('ta_campagne', campagneSalvate().filter(x => x.codice !== codice)); }
const codiceNuovo = () => { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; const r = crypto.getRandomValues(new Uint32Array(8)); return [...r].map(x => a[x % a.length]).join(''); };

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
function invia(o) { if (S.ws?.readyState === 1) { S.ws.send(JSON.stringify(o)); return true; } toast('Non connesso: riprovo tra poco', true); return false; }
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
      mostraGioco(); renderTutto(); avviaVoce(); controllaMappa();
      Mappa.pacchetti(`${SERVER_WS.replace(/^ws/, 'http')}/tavolo/${S.codice}/grafica/atlante`, S.io, S.chiave); // grafica comprata, solo per i membri
      // l'invito sparisce dalla barra degli indirizzi; resta il codice, così ricaricando si rientra da soli
      history.replaceState(null, '', `${location.pathname}?c=${S.codice}${document.body.classList.contains('tv') ? '&tv=1' : ''}`);
      scrivi('ta_attiva', S.codice);
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
      if (prima && m.pg && prima.pf !== m.pg.pf && S.st.segnalini?.[m.per]) { const d = m.pg.pf - prima.pf; Mappa.effettoTesto(m.per, (d > 0 ? '+' : '') + d, d > 0 ? '#7dff8a' : '#ff6a5a'); if (d < 0 && m.da === 'master') { const me_ = S.st.segnalini[m.per], nem = Object.entries(S.st.segnalini).filter(([, v]) => v.tipo === 'nemico').sort(([, a], [, b]) => Math.hypot(a.x - me_.x, a.y - me_.y) - Math.hypot(b.x - me_.x, b.y - me_.y))[0]; if (nem && Math.hypot(nem[1].x - me_.x, nem[1].y - me_.y) < 8) Mappa.attacco(nem[0]); } }
      if (m.per === S.io && m.da !== S.io) {
        if (OPZ.avvisi && prima && prima.pf > prima.pfMax / 2 && m.pg.pf <= m.pg.pfMax / 2 && m.pg.pf > 0) Narratore.avviso('Attenzione: sei sotto metà dei punti ferita');
        if (OPZ.avvisi && prima && prima.pf > 0 && m.pg.pf <= 0) Narratore.avviso('Sei a terra, privo di sensi');
        if (m.nota) toast(`${m.pg.nome}: ${m.nota}`);
      }
      if (S.st.segnalini?.[m.per]) S.st.segnalini[m.per].nome = m.pg.nome;
      renderSchedaSeServe(); renderPresenza(); return;
    }
    case 'dado': {
      S.st.dadi = [...(S.st.dadi || []), m.tiro].slice(-60);
      if (/attacc|colp|fendent|affond|spada|ascia|mazza|martell|pugnal|arco|frecci|balestr|incantesim|dardo|palla di fuoco|raggio|per colpire|tiro per colpire/i.test(m.tiro.motivo || '')) Mappa.attacco(m.tiro.chi);
      if (m.tiro.chi === S.io) { S.ultimoMio = m.tiro; $('#tiroAzioni').hidden = false; Suoni.effetto(m.tiro.critico ? 'critico' : m.tiro.fallimento ? 'fallimento' : 'dado'); }
      if (m.tiro.chi === S.io || document.body.classList.contains('tv')) mostraTiro(m.tiro);
      if (OPZ.dadi3d !== false && (m.tiro.chi === S.io || S.vista === 'vMappa' || document.body.classList.contains('tv'))) import('./dadi3d.js').then(d => d.lancia(m.tiro, m.tiro.chi === S.io ? { colore: OPZ.dadiColore, materiale: OPZ.dadiMateriale } : { colore: S.st.membri?.[m.tiro.chi]?.colore, materiale: 'opaco' })).catch(e => Report.log('dadi-3d', { errore: String(e?.message || e) }));
      if (m.tiro.critico && /^1?d20/.test(m.tiro.formula) && !m.tiro.segreto) momentoEpico(m.tiro);
      renderTiri(); renderRapidi(); return;
    }
    case 'suono': Suoni.effetto(m.nome); return;
    case 'png': S.st.png = m.png; renderDiarioExtra(); return;
    case 'mondo_vivo': { const { t, ...r } = m; Object.assign(S.st, r); renderMondoVivo(); renderTesoro(); renderMondo(); renderSchedaSeServe(); return; }
    case 'sogno': chiedi(`<h2>🌙 Un sogno</h2><p class="piccolo">Lo vedi solo tu: decidi tu se raccontarlo agli altri.</p><p class="storia-pg">${esc(m.testo)}</p>`, [{ testo: 'Mi sveglio', pieno: true }]); if (OPZ.narratore) Narratore.parla(m.testo); Report.log('sogno', {}); return;
    case 'memoriale': S.st.memoriale = m.memoriale; if (m.caduto) { delete S.st.pg[m.caduto]; renderSchedaSeServe(true); } renderDiarioExtra(); return;
    case 'bentornato': mostraBentornato(m.riepiloghi); return;
    case 'luogo': S.st.luogo = m.luogo; S.st.segnalini = m.segnalini; S.st.luoghi = m.luoghi; S.st.aree = []; renderMappa(); if (!$('#mondoBox').hidden) renderMappaMondo(); Report.log('luogo', { nome: m.luogo.nome, tipo: m.luogo.tipo }); controllaMappa(); return;
    case 'luogo_mod': S.st.luogo = m.luogo; renderMappa(); return;
    case 'segnalini': {
      const prima = S.st.segnalini || {};
      for (const [id, v] of Object.entries(prima)) {
        if (v.tipo !== 'nemico') continue;
        const ora = m.segnalini[id];
        if (!ora) { Mappa.effettoTesto(id, 'Sconfitto!', '#ffd25a', v); Mappa.sconfitto(v); }
        else if (v.pf !== undefined && ora.pf !== undefined && ora.pf !== v.pf) Mappa.effettoTesto(id, (ora.pf > v.pf ? '+' : '') + (ora.pf - v.pf), ora.pf > v.pf ? '#7dff8a' : '#ff6a5a');
      }
      S.st.segnalini = m.segnalini; Mappa.aggiornaSegnalini(m.segnalini); return;
    }
    case 'diario': S.st.diario = [...(S.st.diario || []), m.ev].slice(-200); renderDiario(); if (m.ev.tipo === 'chat' && m.ev.chi !== S.io) traduciTesto(m.ev.testo); return;
    case 'serate': S.st.serate = m.serate; renderSerate(); return;
    case 'reazione': reazioneVola(m.emoji, m.nome); return;
    case 'traduzione': { const cb = S.attesaTrad?.[m.id]; if (cb) { delete S.attesaTrad[m.id]; cb(m); } return; }
    case 'note_mappa': S.st.noteMappa = { luogo: m.luogo, note: m.note }; renderNoteMappa(); return;
    case 'gioco_taverna': S.st.giocoTaverna = m.gioco; renderTesoro(); return;
    case 'sfida': S.st.campagna.sfida = m.sfida; sfidaFinita(m.sfida); return;
    case 'narra': {
      const ev = { t: Date.now(), tipo: 'narrazione', testo: m.testo, chi: m.chi, png: m.png };
      S.st.diario = [...(S.st.diario || []), ev].slice(-200);
      if (S.ultimoParlato) { Report.log('master-risposta', { ms: Date.now() - S.ultimoParlato, modello: m.modello, parole: m.testo.split(' ').length }); S.ultimoParlato = 0; }
      Report.log('narrazione', { png: m.png || null, testo: m.testo, modello: m.modello || null, riassunto: !!m.riassunto });
      mostraNarrazione(m.testo, m.png); renderDiario(); traduciTesto(m.testo);
      if (OPZ.narratore && m.voce) { // la voce naturale arriva tra poco: si aspetta al massimo 12 secondi, poi voce del telefono
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
    case 'master_pensa': { const n = $('#narrazione'); n.hidden = false; n.classList.add('pensa'); $('#narrChi').textContent = 'Il master'; $('#narrTesto').textContent = 'Il master sta pensando…'; return; }
    case 'master_zitto': { const n = $('#narrazione'); if (n.classList.contains('pensa')) n.hidden = true; n.classList.remove('pensa'); return; }
    case 'richiesta_tiro': {
      if (m.pg === S.io) {
        $('#richTesto').textContent = `Il master chiede: prova di ${m.prova}${m.cd ? ' (CD ' + m.cd + ')' : ''}`;
        $('#richiesta').hidden = false; $('#richTira').onclick = () => { tiraProva(m.prova); $('#richiesta').hidden = true; };
        if (OPZ.avvisi) Narratore.avviso(`Tocca a te: prova di ${m.prova}`);
      } else toast(`${m.nome || 'Un personaggio'} deve fare una prova di ${m.prova}`);
      return;
    }
    case 'avviso': toast(m.msg); return;
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
    case 'invito': S.st.campagna.invito = m.invito; renderInvito(); toast('Nuovo codice invito creato: i vecchi QR non funzionano più'); return;
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
      const prima = S.st.combattimento; S.st.combattimento = m.combattimento; renderCombat();
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
  renderPresenza(); renderMappa(); renderCombat(); renderSchedaSeServe(true); renderTesoro(); renderTiri(); renderRapidi(); renderDiario(); renderDiarioExtra(); renderMondoVivo(); renderSerate(); renderPresenze(); renderNoteMappa(); $('#reazioni').hidden = me()?.ruolo !== 'spettatore'; $('#btnNota').hidden = me()?.ruolo === 'spettatore'; renderMondo(); renderAltro();
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
  Report.log('vista', { id });
}
$('#nav').addEventListener('click', e => { const b = e.target.closest('button'); if (b) mostraVista(b.dataset.v); });

/* ============ MAPPA ============ */
const largo = () => matchMedia('(min-width: 1100px)').matches;
Mappa.init($('#mappa'), {
  io: () => S.io,
  puoMuovere: id => id === S.io || capo(),
  capo: () => capo(),
  vediTutto: () => document.body.classList.contains('tv'), // sulla TV la mappa inquadra sempre tutta la parte scoperta
  onBloccato: () => toast('Non ci si arriva da qui: c\'è un muro o un ostacolo in mezzo', true),
  onMuovi: (id, x, y) => invia({ t: 'segnalino', id, x, y }),
  pg: id => S.st?.pg?.[id],
  puoMuovereOggetti: () => me()?.ruolo === 'master',
  onMuoviOggetto: (id, x, y) => invia({ t: 'scena', azione: 'sposta', oggetto: id, x, y }),
  onLampo: () => Suoni.effetto('tuono'),
  urlMostro: n => S.st?.mostri?.[n] ? urlMedia('img', S.st.mostri[n]) : null,
  onCambio: () => { if (S.m3) S.m3.aggiorna(Mappa.dati3D()); },
  altezzaMax: () => largo() || document.body.classList.contains('tv') ? window.innerHeight - 200 : 9999,
  onEdificio: async ed => {
    const puoEntrare = (capo() || masterAI()) && !['dungeon', 'grotta', 'taverna', 'interno'].includes(S.st.luogo?.tipo) && ed.stato !== 'distrutto' && !/pozzo|torre|radura|ponte|viadotto|guado/i.test(ed.nome);
    if (me()?.ruolo !== 'master') { // lo stato degli edifici lo cambia solo il master (AI con gli eventi, umano da qui)
      if (!puoEntrare) { toast(`${ed.nome}${ed.stato !== 'integro' ? ' — ' + ed.stato : ''}`); return; }
      const i = await chiedi(`<h2>${esc(ed.nome)}</h2>${ed.stato !== 'integro' ? `<p>Stato: ${esc(ed.stato)}</p>` : ''}`, [{ testo: 'Entra', pieno: true }, { testo: 'Chiudi' }]);
      if (i === 0) invia({ t: 'entra_edificio', edificio: ed.id });
      return;
    }
    const stati = ['integro', 'danneggiato', 'bruciato', 'distrutto'];
    const i = await chiedi(`<h2>${esc(ed.nome)}</h2><p>Stato attuale: <strong>${esc(ed.stato)}</strong>. Il cambiamento resta sulla mappa per sempre.</p>`, [...(puoEntrare ? [{ testo: 'Entra', pieno: true }] : []), ...stati.map(s => ({ testo: s.charAt(0).toUpperCase() + s.slice(1) })), { testo: 'Chiudi' }]);
    const k = puoEntrare ? i - 1 : i;
    if (puoEntrare && i === 0) { invia({ t: 'entra_edificio', edificio: ed.id }); return; }
    if (k >= 0 && k < stati.length && stati[k] !== ed.stato) invia({ t: 'modifica_luogo', edificio: ed.id, stato: stati[k] });
  }
});
function renderMappa() {
  const l = S.st?.luogo;
  $('#mappaVuota').hidden = !!l;
  $('#mappa').hidden = !l;
  $('#luogoNome').textContent = l ? l.nome : 'Nessun luogo';
  const TIPI = { citta: 'città', villaggio: 'villaggio', taverna: 'taverna', dungeon: 'dungeon', foresta: 'foresta', grotta: 'grotta', castello: 'castello', porto: 'porto', aperto: 'all\'aperto' };
  $('#luogoTipo').textContent = l ? `${TIPI[l.tipo] || (l.tipo === 'interno' ? 'interno' : l.tipo)}${l.visite > 1 ? ' · visitato ' + l.visite + ' volte' : ''}` : '';
  $('#btnEsciEd').hidden = !(l?.genitore && (capo() || masterAI()));
  Mappa.setAmbiente(S.st?.mondo?.calendario);
  if (l) { Mappa.imposta(l, S.st.segnalini, S.st.membri); aggiornaExtraMappa(); }
  if (OPZ.vista3d && l && (!S.m3 || $('#mappa3dBox').hidden)) vista3D(true);
}
function aggiornaScenaSonora() { const c = S.st?.combattimento, boss = c?.attivo && c.ordine?.some(o => o.nemico !== false && /boss|capo|re |regina|drago|grumsh|lich|demone|gigante|ogre|troll/i.test(o.nome || '')); Suoni.scena(c?.attivo ? (boss ? 'boss' : 'combattimento') : S.st?.luogo?.tipo || 'aperto'); }
function aggiornaExtraMappa() {
  aggiornaScenaSonora();
  const c = S.st?.combattimento, ora = c?.attivo && c.ordine[c.turno];
  const pg = mioPg();
  Mappa.setExtra({ aree: S.st?.aree || [], vedeTutto: capo(), movimento: ora && ora.id === S.io && pg ? { id: S.io, celle: Math.max(1, Math.floor((pg.vel || 9) / 1.5)) } : null });
}
// ogni mappa nuova si controlla da sola: se qualcosa non va finisce nel rapporto (e lo vedo senza che nessuno lo dica)
function controllaMappa() {
  clearTimeout(S.timerControllo);
  S.timerControllo = setTimeout(async () => { if (!S.st?.luogo || document.hidden) return; try { const p = await Mappa.controllo(); S.problemiMappa = p; if (p.length) Report.log('problema-grafica', { luogo: S.st.luogo.nome, tipo: S.st.luogo.tipo, problemi: p }); } catch (e) { Report.log('problema-grafica', { errore: String(e).slice(0, 200) }); } }, 2500);
}
function renderCombat() {
  const c = S.st?.combattimento, box = $('#combat');
  $('#btnCombat').textContent = c?.attivo ? 'Fine combattimento' : 'Inizia combattimento';
  box.hidden = !c?.attivo;
  aggiornaExtraMappa();
  if (!c?.attivo) return;
  const ora = c.ordine[c.turno];
  if (!ora) Report.log('problema', { cosa: 'combattimento senza nessuno in ordine', round: c.round, ordine: c.ordine.length });
  const posso = ora && (ora.id === S.io || capo());
  box.innerHTML = `<div class="testa"><span>Round ${c.round} · ${ora ? `tocca a <strong>${esc(ora.nome)}</strong>` : 'nessuno in ordine: chiudi e riapri il combattimento quando ci sono personaggi o nemici'}</span>${posso ? '<button id="btnFineTurno" class="pieno" type="button">Fine turno</button>' : ''}</div>
    <ol>${c.ordine.map((o, i) => `<li class="${i === c.turno ? 'ora' : ''} ${o.tipo === 'nemico' ? 'nemico' : ''}">${esc(o.nome)} <span class="piccolo">${o.iniz}</span></li>`).join('')}</ol>`;
  $('#btnFineTurno')?.addEventListener('click', () => invia({ t: 'combattimento', azione: 'prossimo' }));
}
$('#btnCombat').addEventListener('click', () => invia({ t: 'combattimento', azione: S.st?.combattimento?.attivo ? 'fine' : 'inizia' }));
$('#btnPulisciAree').addEventListener('click', () => invia({ t: 'area', pulisci: true }));
$('#btnArea').addEventListener('click', async () => {
  if (!S.st?.luogo) { toast('Prima serve un luogo con la mappa'); return; }
  const forme = ['cerchio', 'quadrato', 'cono', 'linea'];
  const i = await chiedi(`<h2>Area incantesimo</h2><label>Nome (facoltativo)<input id="arNome" maxlength="40" placeholder="Es. Palla di fuoco"></label><label>Misura in quadretti (1 quadretto = 1,5 m)<input id="arDim" type="number" min="1" max="20" value="4"></label><label>Direzione (cono e linea)<select id="arDir"><option value="e">Destra</option><option value="o">Sinistra</option><option value="n">Su</option><option value="s">Giù</option></select></label><p class="piccolo">Scegli la forma, poi tocca il punto sulla mappa.</p>`, [...forme.map(f => ({ testo: f.charAt(0).toUpperCase() + f.slice(1) })), { testo: 'Annulla' }]);
  if (i < 0 || i >= forme.length) return;
  const cfg = { forma: forme[i], dim: Number($('#arDim').value) || 4, dir: $('#arDir').value, nome: $('#arNome').value.trim() };
  toast('Tocca il centro o l\'origine dell\'area sulla mappa');
  Mappa.chiediCasella((x, y) => invia({ t: 'area', ...cfg, x, y, colore: me()?.colore }));
});
function renderTesoro() {
  const g = S.st?.gruppo || { oro: 0, oggetti: [] }, box = $('#tesoro');
  if (!box) return;
  const gioca = me()?.ruolo === 'giocatore' || capo();
  box.innerHTML = `<h3 style="margin-top:0">Tesoro del gruppo</h3>
    <div class="riga"><span>Monete in comune: <strong>${g.oro}</strong></span>${gioca ? '<button type="button" data-tes="deposita">Metti monete</button><button type="button" data-tes="dividi">Dividi il bottino</button>' : ''}</div>
    <ul class="tesoro-ogg">${g.oggetti.map(o => `<li><span>${esc(o.nome)}${o.qta > 1 ? ' ×' + o.qta : ''}</span>${gioca ? `<button type="button" data-prendi="${esc(o.nome)}">Prendi</button>` : ''}</li>`).join('') || '<li class="piccolo">Nessun oggetto in comune</li>'}</ul>
    ${gioca ? '<form id="formTesoro" class="riga" autocomplete="off"><input id="tesOggetto" maxlength="60" placeholder="Metti un oggetto in comune"><button class="pieno">Metti</button></form>' : ''}
    <p class="piccolo">A voce: "metti 20 monete nel tesoro comune", "dividi il bottino".</p>${cartaCasa(gioca)}${cartaGioco(gioca)}`;
}
// giochi di taverna: dadi o carte con le monete della scheda, chi vince prende il piatto
function cartaGioco(gioca) {
  const g = S.st?.giocoTaverna, nomeDi = id => S.st.pg?.[id]?.nome || S.st.membri?.[id]?.nome || '?';
  if (!g) return gioca ? `<h3>Giochi di taverna</h3><form class="riga" id="formGioco" autocomplete="off"><select id="giocoTipo" aria-label="Gioco"><option value="dadi">Dadi: 2d6, vince il più alto</option><option value="carte">Carte: vince la più alta</option></select><input id="giocoPosta" type="number" min="1" max="100" value="5" inputmode="numeric" style="width:80px;flex:0 0 80px" aria-label="Posta in monete"><button>Apri il tavolo</button></form><p class="piccolo">Si gioca con le monete della scheda: chi vince prende tutto il piatto.</p>` : '';
  const dentro = g.giocatori.includes(S.io), mio = g.da === S.io || capo();
  return `<h3>Tavolo di ${g.tipo}: posta ${g.posta} mo</h3><p class="piccolo">Giocano: ${g.giocatori.map(id => esc(nomeDi(id))).join(', ')} · nel piatto ${g.posta * g.giocatori.length} mo</p>
    <div class="riga">${gioca && !dentro ? `<button type="button" data-gioco="entra">Gioco anch'io (${g.posta} mo)</button>` : ''}${mio ? `<button type="button" class="pieno" data-gioco="via" ${g.giocatori.length < 2 ? 'disabled' : ''}>${g.tipo === 'dadi' ? 'Tirate i dadi!' : 'Girate le carte!'}</button><button type="button" data-gioco="annulla">Chiudi il tavolo</button>` : ''}</div>`;
}
// casa del gruppo: si compra e si arreda col tesoro comune, ogni stanza dà un vantaggio
function cartaCasa(gioca) {
  const b = S.st?.base, st = S.st?.catalogo?.stanze || {};
  if (!b) return `<h3>Casa del gruppo</h3><p class="piccolo">Una base tutta vostra dove riposare, creare oggetti e tenere le cavalcature.</p>${gioca ? '<button type="button" data-casa="casa">Comprate una casa (500 mo dal tesoro comune)</button>' : ''}`;
  return `<h3>${esc(b.nome)}</h3><ul class="tesoro-ogg">${b.stanze.map(k => `<li><span><strong>${esc(st[k]?.nome || k)}</strong> <span class="piccolo">${esc(st[k]?.bonus || '')}</span></span></li>`).join('') || '<li class="piccolo">Per ora solo muri e un camino</li>'}</ul>
    ${gioca ? `<details><summary>Aggiungi una stanza</summary><ul class="tesoro-ogg">${Object.entries(st).filter(([k]) => !b.stanze.includes(k)).map(([k, x]) => `<li><span>${esc(x.nome)} <span class="piccolo">${esc(x.bonus)}</span></span><button type="button" data-casa="${k}">${x.prezzo} mo</button></li>`).join('')}</ul></details>` : ''}`;
}
$('#tesoro').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.prendi) invia({ t: 'gruppo', op: 'prendi', nome: b.dataset.prendi });
  if (b.dataset.gioco) invia({ t: 'gioco_' + b.dataset.gioco });
  if (b.dataset.casa) { invia({ t: 'base', cosa: b.dataset.casa === 'casa' ? '' : b.dataset.casa }); Report.log('casa', { cosa: b.dataset.casa }); }
  if (b.dataset.tes === 'dividi') invia({ t: 'gruppo', op: 'dividi' });
  if (b.dataset.tes === 'deposita') { const v = parseInt(prompt('Quante monete metti nel tesoro comune?'), 10); if (v > 0) { if (mioPg()) modifica([{ op: 'oro', delta: -v }]); invia({ t: 'gruppo', op: 'oro', delta: v }); } }
});
$('#tesoro').addEventListener('submit', e => { e.preventDefault(); if (e.target.id === 'formGioco') { invia({ t: 'gioco_apri', tipo: $('#giocoTipo').value, posta: +$('#giocoPosta').value }); Report.log('gioco_taverna', {}); return; } const n = $('#tesOggetto').value.trim(); if (n) invia({ t: 'gruppo', op: 'oggetto', nome: n, qta: 1 }); });
$('#btnEsciEd').addEventListener('click', () => invia({ t: 'esci_edificio' }));
$('#formVai').addEventListener('submit', e => { e.preventDefault(); const n = $('#vaiNome').value.trim(); if (!n) return; invia({ t: 'vai', nome: n }); $('#vaiNome').value = ''; Report.log('vai', { nome: n }); });
// volto del PNG: illustrato dall'AI quando è pronto, altrimenti quello in pixel art
function mostraVolto(png) {
  const id = S.st?.volti?.[png], box = $('#narrVolto');
  box.innerHTML = id ? `<img src="${urlMedia('img', id)}" alt="${esc(png)}" class="volto-png">` : Ritratto.volto(png, 64);
  const im = box.querySelector('img'); if (im) im.onerror = () => { box.innerHTML = Ritratto.volto(png, 64); }; // volto non disponibile: quello in pixel art
}
function mostraNarrazione(testo, png) { const n = $('#narrazione'); n.hidden = false; n.classList.remove('pensa'); $('#narrChi').textContent = png ? `${png} (dal master)` : 'Il master'; $('#narrChi').dataset.png = png || ''; $('#narrTesto').textContent = testo; $('#narrVolto').hidden = !png; if (png) mostraVolto(png); }
$('#btnZitto').addEventListener('click', () => { Narratore.zitto(); $('#narrazione').hidden = true; });
Narratore.onInizio = () => { Ascolto.pausa(true); $('#av-master')?.classList.add('parla'); };
Narratore.onFine = () => { Ascolto.pausa(false); $('#av-master')?.classList.remove('parla'); };
// sottotitoli: il testo del master a frasi, ognuna per il tempo che ci mette a dirla
let timerSottotitoli = [];
Narratore.onFrase = (testoS, durata) => {
  timerSottotitoli.forEach(clearTimeout); timerSottotitoli = [];
  const el = $('#sottotitoli');
  if (!testoS || OPZ.sottotitoli === false) { el.hidden = true; return; }
  const frasi = testoS.match(/[^.!?…]+[.!?…]*["»”]?\s*/g)?.map(f => f.trim()).filter(Boolean) || [testoS];
  const tot = frasi.reduce((a, f) => a + f.length, 0); let t = 0;
  frasi.forEach(f => { timerSottotitoli.push(setTimeout(() => { el.textContent = f; el.hidden = false; }, t)); t += durata * f.length / tot; });
  timerSottotitoli.push(setTimeout(() => { el.hidden = true; }, t + 600));
};

/* ============ SCHEDA ============ */
function renderSchedaSeServe(forza) { if (S.vista === 'vScheda' || largo() || forza) renderScheda(); }
const PRIORITA = { Barbaro: 'for cos des sag car int', Bardo: 'car des cos sag int for', Chierico: 'sag cos for car int des', Druido: 'sag cos des int car for', Guerriero: 'for cos des sag car int', Ladro: 'des int cos sag car for', Mago: 'int cos des sag car for', Monaco: 'des sag cos for int car', Paladino: 'for car cos sag des int', Ranger: 'des sag cos for int car', Stregone: 'car cos des int sag for', Warlock: 'car cos des sag int for' };
let bozza = null;
function renderScheda() {
  if (!S.st) return;
  const sel = $('#selPg');
  const ids = Object.entries(S.st.membri).filter(([, m]) => m.ruolo === 'giocatore').map(([id]) => id);
  if (!S.viewPg || !S.st.membri[S.viewPg]) S.viewPg = ids.includes(S.io) ? S.io : ids[0];
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
      <div class="ritratto">${Ritratto.svg(pg, { dim: largo() ? 130 : 120 })}</div>
      <div class="pg-info">
        <h2>${esc(pg.nome)}</h2>
        <div class="piccolo">${esc(pg.razza)} · ${esc(Regole.nomeClassi(pg))} · livello ${pg.livello} · ${esc(pg.allineamento || '')}</div>
        <div class="barra-pf" role="meter" aria-valuemin="0" aria-valuemax="${pg.pfMax}" aria-valuenow="${pg.pf}" aria-label="Punti ferita"><div class="${r <= 0.25 ? 'basso' : r <= 0.5 ? 'meta' : ''}" style="width:${Math.max(0, Math.min(100, r * 100))}%"></div></div>
        <div><strong>${pg.pf}</strong> / ${pg.pfMax} PF${(pg.condizioni || []).length ? ' · <span style="color:#ffb199">' + esc(pg.condizioni.join(', ')) + '</span>' : ''}</div>
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
    ${(pg.diario || []).length ? `<details><summary>Il diario di ${esc(pg.nome)} (${pg.diario.length})</summary>${[...pg.diario].reverse().map(d => `<div class="pagina-diario"><span class="piccolo">Sessione ${d.sessione || '?'} · ${esc(d.titolo || '')}</span><p>${esc(d.testo)}</p></div>`).join('')}</details>` : ''}
    <label>Note<textarea id="pgNote" rows="3" maxlength="4000" ${puo ? '' : 'readonly'}>${esc(pg.note || '')}</textarea></label>
    <div class="riga"><button id="btnStampa">Stampa o salva in PDF</button>${puo ? '<button id="btnAnnullaScheda">Annulla ultima modifica</button>' : ''}${puo ? '<button id="btnCaduto" class="pericolo">Il personaggio è caduto</button>' : ''}</div>
  </div>`;
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
    <h4>Compagni</h4>${(pg.compagni || []).map(a => `<div class="mondo-riga"><strong>${esc(a.nome)}</strong> <span class="piccolo">${esc(a.specie)} · PF ${a.pf} · CA ${a.ca} · ${esc(a.abilita)}</span></div>`).join('') || '<p class="piccolo">Nessun animale per ora: il master può farvene incontrare uno.</p>'}
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
    ${ne ? `<div class="carta-mini nemesi"><strong>😈 ${esc(ne.nome)}</strong><p class="piccolo">${esc(ne.descrizione || '')}</p><p class="piccolo">Incontri: ${ne.incontri || 1}${ne.fughe ? ` · fughe: ${ne.fughe}` : ''}${ne.ultimaFuga ? ` · l'ultima volta: ${esc(ne.ultimaFuga)}` : ''}</p></div>` : ''}
    ${mi.length ? `<div class="carta-mini"><strong>⚠️ Minacce che crescono</strong>${mi.map(x => `<div class="mondo-riga"><span><strong>${esc(x.nome)}</strong> <span class="piccolo">${esc(x.descrizione || '')}</span></span><span class="livello-minaccia" aria-label="livello ${x.livello} su 5">${'●'.repeat(x.livello)}${'○'.repeat(5 - x.livello)}</span></div>`).join('')}<p class="piccolo">Se le ignorate peggiorano a ogni sessione.</p></div>` : ''}
    <details class="carta-mini"${q.some(x => x.stato === 'aperta') ? ' open' : ''}><summary>📜 Bacheca delle missioni (${q.filter(x => x.stato !== 'completata').length})</summary>${q.map(x => `<div class="missione ${x.stato}"><strong>${esc(x.titolo)}</strong> <span class="piccolo">${x.stato}${x.ricompensa ? ' · ricompensa: ' + esc(x.ricompensa) : ''}</span><p class="piccolo">${esc(x.descrizione || '')}</p>${x.stato === 'aperta' && gioca ? `<button type="button" data-missione="${x.id}">Accettiamo</button>` : ''}</div>`).join('') || '<p class="piccolo">Nessuna missione appesa. Passate da una taverna o da una città.</p>'}
      ${capo() ? `<form class="colonna" data-missione-nuova autocomplete="off"><input name="titolo" maxlength="80" placeholder="Titolo della missione"><input name="descrizione" maxlength="300" placeholder="Cosa bisogna fare"><div class="riga"><input name="ricompensa" maxlength="80" placeholder="Ricompensa"><button>Appendi</button></div></form>` : ''}</details>
    ${sc.length ? `<details class="carta-mini"><summary>⚖️ Le vostre scelte (${sc.filter(x => x.peso === 'buona').length} buone, ${sc.filter(x => x.peso === 'cattiva').length} cattive)</summary>${[...sc].reverse().map(x => `<p class="piccolo">${x.peso === 'buona' ? '🕊️' : x.peso === 'cattiva' ? '🗡️' : '🌗'} ${esc(x.descrizione)}</p>`).join('')}<p class="piccolo">Il finale della campagna dipende da queste scelte.</p></details>` : ''}
    ${capo() && !v ? `<details class="carta-mini"><summary>🗳️ Fai votare il gruppo</summary><form class="colonna" data-voto-apri autocomplete="off"><input name="domanda" maxlength="160" placeholder="Domanda (es. Da che parte andiamo?)"><input name="opzioni" maxlength="240" placeholder="Opzioni separate da virgola (es. ponte, foresta, fiume)"><button>Apri il voto</button></form></details>` : ''}`;
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
  if (f.dataset.missioneNuova !== undefined && f.titolo.value.trim()) invia({ t: 'missione_nuova', titolo: f.titolo.value.trim(), descrizione: f.descrizione.value.trim(), ricompensa: f.ricompensa.value.trim() });
  if (f.dataset.votoApri !== undefined) { const op = f.opzioni.value.split(',').map(x => x.trim()).filter(Boolean); if (f.domanda.value.trim() && op.length >= 2) invia({ t: 'voto_apri', domanda: f.domanda.value.trim(), opzioni: op }); else toast('Scrivi la domanda e almeno due opzioni'); }
});
// storia e albero genealogico: il giocatore risponde a 4 domande, il master la scrive
function cartaStoria(pg, puo) {
  const f = pg.famiglia || {};
  return `<details${pg.storia ? '' : ' open'}><summary>Storia e famiglia</summary>${pg.storia ? `<p class="storia-pg">${esc(pg.storia)}</p>` : ''}
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
  $('#mondo').innerHTML = `<h3>Fazioni</h3>${fz.map(([n, f]) => `<div class="mondo-riga"><strong>${esc(n)}</strong><span class="piccolo">${f.reputazione > 30 ? 'alleati' : f.reputazione > 5 ? 'amichevoli' : f.reputazione < -30 ? 'ostili' : f.reputazione < -5 ? 'diffidenti' : 'neutrali'} (${f.reputazione})</span></div>${barra(f.reputazione)}${f.descrizione ? `<p class="piccolo">${esc(f.descrizione)}</p>` : ''}`).join('') || '<p class="piccolo">Nessuna fazione conosciuta.</p>'}
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
    <ul class="equip">${(pg.incantesimi || []).map((inc, i) => `<li><span class="n">${esc(inc.nome)} <span class="piccolo">${inc.livello ? inc.livello + '°' : 'trucchetto'}</span></span>${puo ? `<button data-lancia="${i}">Lancia</button><button data-toginc="${i}" aria-label="Togli ${esc(inc.nome)}">×</button>` : ''}</li>`).join('') || '<li class="piccolo">Nessun incantesimo: aggiungili qui sotto o di\' "imparo l\'incantesimo dardo incantato".</li>'}</ul>
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
  if (b.dataset.attacco) { const at = Regole.attacco(pg, { nome: b.dataset.attacco }); tira('d20' + fm(at.colpire), 'Attacco con ' + b.dataset.attacco); return; }
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
    return;
  }
  if (b.id === 'btnStampa') { window.print(); return; }
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

/* ============ ALTRO ============ */
$('#btnSpettatori').addEventListener('click', async () => {
  const l = linkInvito() + '&s=1';
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
  invia({ t: 'impostazioni', nome: $('#aNome').value.trim(), ambientazione: $('#aAmb').value.trim(), regole: $('input[name="aRegole"]:checked')?.value, masterTipo: $('input[name="aMaster"]:checked')?.value, ruoli });
  toast('Impostazioni salvate');
});
$('#btnNuovaSessione').addEventListener('click', async () => { const i = await chiedi('<h2>Nuova sessione</h2><p>Si apre una nuova sessione e si crea un nuovo codice invito: i vecchi QR smettono di funzionare. La campagna, le schede e le mappe restano.</p>', [{ testo: 'Inizia', pieno: true }, { testo: 'Annulla' }]); if (i === 0) { invia({ t: 'impostazioni', nuovaSessione: true }); if (masterAI()) setTimeout(() => invia({ t: 'riassunto' }), 800); } });
$('#btnRiepilogo').addEventListener('click', () => invia({ t: 'riepilogo' }));
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
  box.innerHTML = `<details ${a.iniziata ? '' : 'open'}><summary><strong>Avventura: ${esc(a.titolo)}</strong>${a.iniziata ? ` · scena ${a.scena + 1} di ${a.scene.length}` : ''}</summary>
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
  const tabella = (dati) => { const ids = Object.keys(dati || {}).filter(id => id !== 'gruppo'); if (!ids.length) return '<p class="piccolo">Ancora niente da contare.</p>'; return `<div style="overflow-x:auto"><table class="stat-tab"><tr><th></th>${ids.map(id => `<th>${esc(m.nomi[id] || id)}</th>`).join('')}</tr>${VOCI.map(([k, n]) => `<tr><td>${n}</td>${ids.map(id => `<td>${dati[id][k] || 0}</td>`).join('')}</tr>`).join('')}</table></div>${dati.gruppo ? `<p class="piccolo">Il gruppo: ${dati.gruppo.nemici || 0} nemici sconfitti, ${dati.gruppo.combattimenti || 0} combattimenti.</p>` : ''}`; };
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
  $('#costi').innerHTML = `<p><strong>Sessione ${c.sessione.n}</strong>: ${n(c.sessione.chiamate)} chiamate, ${n(c.sessione.in)} token letti, ${n(c.sessione.out)} token scritti.</p>
    <p><strong>Totale campagna</strong>: ${n(c.totale.chiamate)} chiamate, ${n(c.totale.in + c.totale.out)} token.</p>
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
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (aveva && !ricaricato) { ricaricato = true; location.reload(); } });
}

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
(() => { const d = new Date(), m = d.getMonth() + 1, g = d.getDate(); const st = m === 12 || (m === 1 && g <= 6) ? 'inverno' : (m === 10 && g >= 20) || (m === 11 && g <= 2) ? 'ombre' : m === 2 ? 'carnevale' : ''; if (st) document.body.classList.add('st-' + st); })();
window.addEventListener('resize', () => { if (largo() && S.vista === 'vMappa') mostraVista('vScheda'); });
(() => {
  const q = new URLSearchParams(location.search);
  if (q.get('tv') === '1') document.body.classList.add('tv');
  Report.log('avvio', { versione: VERSION, tv: q.get('tv') === '1', schermo: `${innerWidth}x${innerHeight}`, dpr: devicePixelRatio, voce: Ascolto.supportato(), webrtc: !!window.RTCPeerConnection });
  cercaAggiornamenti(false); Report.invia();
  const codice = (q.get('c') || (q.has('i') ? '' : leggi('ta_attiva', '')) || '').toUpperCase(), invito = (q.get('i') || '').toUpperCase();
  const salvata = codice && campagneSalvate().find(x => x.codice === codice);
  mostraIngresso();
  if (largo()) mostraVista('vScheda');
  if (salvata) { S.io = salvata.io; S.chiave = salvata.chiave; connetti(codice, () => ({ t: 'ciao', membro: salvata.io, chiave: salvata.chiave })); return; }
  if (codice && invito) {
    $('#eCodice').value = codice; $('#eInvito').value = invito;
    if (document.body.classList.contains('tv')) { connetti(codice, () => ({ t: 'entra', invito, nome: 'TV del tavolo', ruolo: 'spettatore' })); return; }
    $('#cartaCrea').hidden = true; $('#eNome').focus();
    if (q.get('s') === '1') { $('input[name="eRuolo"][value="spettatore"]').checked = true; $('#btnEntra').textContent = 'Guarda la partita'; }
  }
})();

/* ============ Traduzione automatica di master e chat ============ */
function tradotto(t) { const x = OPZ.lingua && S.trad.get(t); return x ? `<p class="trad">🌐 ${esc(x)}</p>` : ''; }
function traduciTesto(t) {
  if (!OPZ.lingua || !t || S.trad.has(t)) return;
  S.trad.set(t, null); const id = 'q' + Math.random().toString(36).slice(2, 9);
  S.attesaTrad[id] = m => { if (m.errore) { S.trad.delete(t); return; } S.trad.set(t, m.testo); renderDiario(); if ($('#narrTesto').textContent === t) { $('#narrTrad')?.remove(); $('#narrTesto').insertAdjacentHTML('afterend', `<p class="trad" id="narrTrad">🌐 ${esc(m.testo)}</p>`); } };
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
  if (b.dataset.serata) invia({ t: 'serata_risposta', id: b.dataset.serata, ci: b.dataset.ci === '1' });
  if (b.dataset.serataTogli) invia({ t: 'serata_togli', id: b.dataset.serataTogli });
  if (b.dataset.ics) { const x = (S.st.serate || []).find(y => y.id === b.dataset.ics); if (x) { scaricaIcs(x); Report.log('promemoria', {}); } }
});
$('#serate').addEventListener('submit', e => { e.preventDefault(); const v = $('#serataQuando').value; if (!v) { toast('Scegli giorno e ora', true); return; } invia({ t: 'serata_nuova', quando: new Date(v).toISOString(), nota: $('#serataNota').value.trim() }); });
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

/* ============ 20 NATURALE: momento epico ============ */
function momentoEpico(tiro) {
  const chi = S.st.pg?.[tiro.chi]?.nome || S.st.membri?.[tiro.chi]?.nome || 'Qualcuno';
  const el = document.createElement('div'); el.className = 'epico';
  el.innerHTML = `<div><b>20</b><span>naturale!</span><small>${esc(chi)}${tiro.motivo ? ' · ' + esc(tiro.motivo) : ''}</small></div>`;
  document.body.appendChild(el); setTimeout(() => el.remove(), 2600);
  Suoni.effetto('raro'); if (navigator.vibrate) navigator.vibrate([60, 40, 120]);
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
  const png = Object.entries(S.st?.png || {}).sort((a, b) => (b[1].t || 0) - (a[1].t || 0));
  const g = $('#galleriaPng'); if (g) { g.hidden = !png.length; $('#galleriaPngLista').innerHTML = png.map(([nome, p]) => { const v = S.st.volti?.[nome];
    return `<div class="carta-png">${v ? `<img src="${urlMedia('img', v)}" alt="" class="volto-png" onerror="this.outerHTML=Ritratto.volto(${esc(JSON.stringify(nome))}, 64)">` : Ritratto.volto(nome, 64)}<div><strong>${esc(nome)}</strong>${p.luogo ? `<div class="piccolo">Incontrato a ${esc(p.luogo)}</div>` : ''}${(p.note || []).map(n => `<div class="piccolo">• ${esc(n)}</div>`).join('')}</div></div>`; }).join(''); $('#galleriaPngConta').textContent = png.length; }
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
  let y = testoA(r.titolo, 700, W - 160, '700 56px Cinzel, Georgia, serif', '#f0c46a', 64);
  const momento = (r.racconto || '').split(/(?<=[.!?])\s/)[0];
  y = testoA('«' + momento + '»', y + 70, W - 200, 'italic 34px Georgia, serif', '#f3ead9', 44);
  const pgs = Object.values(S.st.pg || {}).slice(0, 6), passo = (W - 120) / Math.max(1, pgs.length);
  for (const [i, p] of pgs.entries()) {
    const svg = Ritratto.svg(p, { dim: 120 }).replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    const im = await carica('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)); const cx = 60 + passo * i + passo / 2;
    if (im) k.drawImage(im, cx - 60, H - 300, 120, 120);
    k.font = '600 26px Inter, sans-serif'; k.fillStyle = '#f3ead9'; k.fillText(p.nome.split(' ')[0], cx, H - 150);
  }
  k.font = '500 26px Inter, sans-serif'; k.fillStyle = '#bcae96'; k.fillText(`${S.st.campagna.nome} · ${new Date(r.t || Date.now()).toLocaleDateString('it-IT')}`, W / 2, H - 70);
  const blob = await new Promise(res => c.toBlob(res, 'image/png'));
  const file = new File([blob], 'cartolina.png', { type: 'image/png' });
  try { if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: r.titolo }); return; } } catch {}
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'cartolina.png' }); a.click();
  Report.log('cartolina', { titolo: r.titolo });
}
