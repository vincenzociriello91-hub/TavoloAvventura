/* Tavolo d'Avventura — app principale: ingresso, stanza online, scheda, dadi, mappa, diario, voce, rapporti, aggiornamenti */
const VERSION = '3.9.0';
const CHANGELOG = [
  { v: '3.9.0', data: '23/11/2026', voci: [
    'La mappa è viva: gli alberi ondeggiano al vento, l\'acqua luccica, dai comignoli sale il fumo, d\'autunno cadono le foglie, di notte ci sono le lucciole e le finestre delle case fanno luce. Nei sotterranei la polvere brilla vicino alle torce e il buio si muove.',
    'Di giorno passano le ombre delle nuvole. Chi cammina dietro un albero resta mezzo coperto dalla chioma.',
    'Le figure ferme respirano. Chi è di turno ha una freccia sopra la testa e un anello dorato ai piedi.',
    'I colpi si sentono: la figura lampeggia e arretra, sale la polvere, la mappa trema, la musica si abbassa un attimo e il telefono vibra se hanno colpito te.',
    'Frecce e incantesimi volano verso il bersaglio e scoppiano. Le cure fanno salire crocette verdi. Il nemico sconfitto sparisce in uno sbuffo di fumo e scintille.',
    'Nemici: barra della vita sopra la testa (senza numeri per i giocatori), basetta a rombo per riconoscerli anche senza i colori, numero nel nome («Goblin 2»).',
    'Tiro di prova da videogioco: quando il master chiede una prova compaiono difficoltà, dado, bonus, totale e «Riuscita!» o «Fallita». L\'1 naturale ha il suo annuncio, come il 20.',
    'Sotto il nome del personaggio compare lo stato (avvelenato, prono…). Con «Meno movimento» (Altro → Gioco) tutte le animazioni si fermano.'
  ] },
  { v: '3.8.0', data: '23/11/2026', voci: [
    'Aspetto da videogioco: cornici e pulsanti in pixel, scritte da gioco, una sola tavolozza di colori. Se preferisci com\'era prima: Altro → Gioco → togli «Aspetto da videogioco».',
    'Il master parla come nei giochi di ruolo: nella casella c\'è il volto di chi parla (o il master col cappuccio) e il testo compare lettera per lettera. Un tocco lo mostra tutto.',
    'Il gruppo è sempre a vista sopra la mappa: volti e barre della vita. Tocca un volto per aprire la sua scheda.',
    'In combattimento l\'ordine di iniziativa ha i volti, e uno striscione annuncia l\'inizio dello scontro e di chi è il turno.',
    'Quando si entra in un luogo nuovo la mappa esce dal buio e compare il nome.',
    'Nel diario ogni voce ha il volto di chi parla o un\'icona.',
    'Schermata iniziale con un paesaggio in pixel che si muove e segue l\'ora vera: alba, giorno, tramonto, notte.',
    'Nuove opzioni in Altro → Gioco: volumi separati per musica, effetti e voce del master, alto contrasto, meno movimento, vibrazione, velocità di scritte e animazioni.'
  ] },
  { v: '3.7.2', data: '23/11/2026', voci: [
    'Nelle avventure pronte, entrando per la prima volta in un luogo il diario non dice più "Il gruppo torna a" e arriva anche l\'illustrazione dell\'arrivo.',
    'Le caselle da spuntare con la scritta lunga (meteo vero) hanno la stessa misura delle altre.',
    'Master e spettatori nella Scheda vedono il personaggio di un giocatore, non più "non ha ancora creato il personaggio".',
    'Sulla mappa della taverna il nome del bancone non finisce più sotto quello dell\'oste.',
    'Statistiche e uso dell\'AI: "1 dado tirato", "1 chiamata", "1 combattimento" invece del plurale.'
  ] },
  { v: '3.7.1', data: '22/11/2026', voci: [
    'Chi apre il link per spettatori non vede più la scelta del ruolo: entra direttamente a guardare.'
  ] },
  { v: '3.7.0', data: '22/11/2026', voci: [
    'Nuova avventura pronta: «Il Re sotto la Montagna» (livelli 3-5, due serate), terzo capitolo dopo la miniera e la Torre di Corvonero.',
    'Il tasto del microfono non copre più gli ultimi bottoni: sotto ogni schermata c\'è spazio per scorrere.',
    'Nei Dadi c\'è scritto cosa fare (tocca un dado per tirare); nella Scheda «Storia e famiglia» parte chiusa.',
    'Battute di riserva del master più varie.'
  ] },
  { v: '3.6.0', data: '22/11/2026', voci: [
    'Codice riordinato: app e server divisi in parti più piccole e controllati da un nuovo controllo automatico. Per chi gioca non cambia niente, ma le prossime novità saranno più sicure.',
    'Il voto del gruppo non resta più bloccato da chi stasera non c\'è o si scollega.',
    'Se qualcuno esce a metà di una partita a dadi o a carte, le monete tornano agli altri.',
    'L\'app si apre un po\' più in fretta: il disegno del QR si scarica solo quando serve.'
  ] },
  { v: '3.5.0', data: '22/11/2026', voci: [
    'Più sicurezza: il link per gli amici spettatori ha un codice suo e fa entrare solo a guardare; chi guarda non può spostare il gruppo, toccare il tesoro o chiamare il master.',
    'Le schede non possono più portare codice nascosto agli altri giocatori, e chi manda messaggi a raffica viene frenato.',
    'La storia del personaggio scritta col master non cancella più le modifiche fatte alla scheda nel frattempo.'
  ] },
  { v: '3.4.1', data: '22/11/2026', voci: [
    'L\'invito alla guida «Come si gioca» per chi entra la prima volta adesso compare davvero sulla Mappa (sparisce con «No grazie»).'
  ] },
  { v: '3.4.0', data: '22/11/2026', voci: [
    'Promemoria delle serate come notifica sul telefono, il giorno prima e un\'ora prima (in Altro → Prossime serate → «Avvisami sul telefono»).',
    'Quando le immagini gratuite del server finiscono, il telefono disegna anche volti dei personaggi, mostri e il riepilogo di fine serata, non solo le scene.',
    'Gli animali compagni compaiono sulla mappa accanto al loro personaggio: li muove il loro giocatore e combattono nel suo ordine.',
    'Nei villaggi e nelle città le zone illuminate (lampioni, falò, case) si vedono anche da lontano.',
    'Chi gioca in un\'altra lingua sente il master leggere la traduzione nella sua lingua.',
    'Copia della campagna: chi l\'ha creata la può scaricare in un file e ripristinare (in Altro → Campagna).',
    'A chi entra per la prima volta compare un piccolo invito alla guida «Come si gioca», che non blocca niente.'
  ] },
  { v: '3.3.0', data: '22/11/2026', voci: [
    'App più semplice, senza togliere niente: le sezioni lunghe di Scheda e Altro si aprono e chiudono toccando il titolo (l\'app si ricorda come le hai lasciate); quelle che si usano meno partono chiuse.',
    'Strumenti della mappa più compatti: tutti i bottoni restano, ma occupano metà spazio. Le istruzioni della mappa si aprono con «Come si usa la mappa».'
  ] },
  { v: '3.2.0', data: '22/11/2026', voci: [
    'Quando il master AI finisce la quota non resta più muto: improvvisa con battute di riserva, mai uguali, finché la quota torna.',
    'Ogni bottega, taverna o tempio ha il suo personaggio che si ricorda cosa avete fatto lì e vi saluta di conseguenza.',
    'I nemici intelligenti e il cattivo ricorrente si adattano alle tattiche che usate di più (fuoco, frecce, furtività, magia…).',
    'Discesa del giorno (sulla Mappa): ogni giorno un dungeon nuovo, sempre più in basso, con un custode in fondo. Se vi sconfigge diventa il vostro cattivo ricorrente.',
    'Meteo vero (in Altro, per chi crea la campagna): nella partita fa il tempo che fa nella tua zona. La posizione resta nel telefono, al server arriva solo il tempo.'
  ] },
  { v: '3.1.0', data: '22/11/2026', voci: [
    'Il master AI impara: tiene un manuale di esperienza comune a tutte le partite (regole sbagliate, correzioni dei giocatori, errori) e lo rilegge prima di ogni turno, per non ripetere due volte lo stesso errore.',
    'Master proattivo: se il tavolo tace per qualche minuto fa succedere qualcosa di piccolo (al massimo due volte di fila).',
    'I personaggi del mondo vivono anche senza di voi: tra una sessione e l\'altra fanno cose e stringono legami (amici, rivali, mentore e allievo…), visibili nella galleria dei personaggi incontrati.',
    'Racconti di fine serata, storie dei personaggi e notizie dal mondo scritti dal modello più bravo; le cose veloci restano al modello leggero.',
    'I problemi trovati dai telefoni e dalla partita bot finiscono nel manuale, così vengono corretti.'
  ] },
  { v: '3.0.5', data: '22/11/2026', voci: [
    'Illustrazioni anche quando le immagini gratuite del server sono finite: la scena la disegna uno dei vostri telefoni con un servizio di riserva gratuito e la manda a tutti.'
  ] },
  { v: '3.0.4', data: '22/11/2026', voci: [
    'Gli avvisi sono più piccoli, stanno sulla barra in alto (non coprono più il nome del luogo) e sono rossi quando qualcosa non è riuscito. Si chiudono toccandoli.'
  ] },
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
function toast(msg, errore = false, ms = 3500) { const t = $('#toast'); t.onclick = () => { t.hidden = true; }; t.textContent = msg; t.classList.toggle('errore', errore); t.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(() => t.hidden = true, ms); }
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
