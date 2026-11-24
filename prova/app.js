/* Tavolo d'Avventura — app principale: ingresso, stanza online, scheda, dadi, mappa, diario, voce, rapporti, aggiornamenti */
const VERSION = '4.8.3';
const CHANGELOG = [
  { v: '4.8.3', data: '24/11/2026', voci: [
    'Partita bot più realistica: dopo i passi di sempre i bot giocano come persone vere, 76 passi in tutto',
    'Turni liberi con azioni scelte a caso tra venti (parlare coi PNG, esplorare, rubare, combattere, fare magie, accamparsi, scherzare), e i tiri chiesti dal master',
    'Un bot sceglie uno dei suggerimenti del master, i giocatori chiacchierano tra loro, due agiscono nello stesso momento, uno fa una domanda fuori dal gioco',
    'Un bot perde la connessione e rientra: la sua scheda deve restare uguale',
    'Nel rapporto si vede se il master ha ripetuto la stessa risposta'
  ] },
  { v: '4.8.2', data: '24/11/2026', voci: [
    'Partita bot: i dadi di prova leggono solo il proprio tiro (prima un tiro in ritardo faceva scalare tutti i risultati)'
  ] },
  { v: '4.8.1', data: '24/11/2026', voci: [
    'Pulizia: meno pulsanti a vista, niente è stato tolto',
    'Mappa: righello, aree, note e discesa del giorno sono in «Altri strumenti», sotto la mappa',
    'Diario: in alto solo quello che si gioca adesso; giornale, missioni, patti, giochi e ricordi nella sezione «Il regno»',
    'Altro: riassunti, voce e suoni, aspetto e strumenti del master in sezioni che si aprono, e l\'app si ricorda quali hai aperto',
    'Scheda: il banco del mercante sta accanto all\'equipaggiamento; casa, mercato e giochi di taverna si aprono a richiesta',
    'Sui telefoni stretti i tasti Invia e Chiedi restano accanto al campo',
    'All\'apertura il tavolo si collega solo quando l\'app è tutta caricata: niente errori sui telefoni lenti'
  ] },
  { v: '4.8.0', data: '24/11/2026', voci: [
    'Descrivilo tu: scrivi o detta chi è il tuo personaggio (razza, classe, carattere, passato, altezza, peso, corporatura) e l\'IA compila la scheda',
    'Hai già una scheda? Carica il PDF o una foto della scheda di carta: l\'IA la legge e la ricopia con livello, punti ferita, oggetti e incantesimi',
    'Il corpo conta, come in Varchi: robusto, snello, muscoloso, alto, basso, pesante o leggero danno piccoli vantaggi pagati con piccoli svantaggi',
    'Corporatura «muscolosa» tra quelle dell\'aspetto',
    'Anche il master della sessione zero propone altezza e peso'
  ] },
  { v: '4.7.1', data: '24/11/2026', voci: [
    'Pulsante sole/luna in basso a sinistra: un tocco e passi ai colori chiari del giorno o a quelli scuri della notte',
    'Il tavolo riconosce il dispositivo (telefono, tablet, computer, TV): in Altro → Gioco vedi schermo, Hz, memoria e grafica scelta',
    'Grafica da sola come in Varchi: sui telefoni lenti, con la batteria scarica o quando il telefono scalda si alleggerisce (o la scegli tu)',
    'Colori «come il telefono»: chiari o scuri seguendo il tema del telefono',
    'Nero vero per gli schermi OLED, che consuma meno batteria',
    'Più spazio in fondo alle pagine: i tasti in basso non coprono più l\'ultima riga'
  ] },
  { v: '4.7.0', data: '24/11/2026', voci: [
    'Icona nuova in pixel art: un d20 dorato con il 20 ben leggibile. Su Android si adatta al cerchio o alla goccia del telefono e c\'è anche la versione a un colore per le icone a tema.',
    'L\'icona della scheda del browser cambia con le stagioni: d\'inverno, ad Halloween e a Carnevale.',
    'Scorciatoie: tenendo premuta l\'icona dell\'app compaiono «Riprendi la campagna», «Tira un d20» e «Sfida della settimana».',
    'Installando l\'app si vedono anche le foto del gioco; all\'apertura c\'è l\'icona mentre si rientra al tavolo.',
    'Icone in pixel al posto delle faccine su pulsanti e titoli (uguali su ogni telefono), anche nella barra in basso.',
    'Animazioni: la carta pescata si gira, le monete cadono quando il tesoro comune cresce, la mappa del tesoro e il giornale si srotolano.',
    'Cornici nuove: pergamena per la mappa del tesoro, pietra per i rompicapi, stendardo per il torneo, acciaio per il duello.',
    'Tema chiaro «pergamena» per giocare di giorno (Altro → Gioco → Colori).'
  ] },
  { v: '4.6.4', data: '24/11/2026', voci: [
    'Apertura più pulita: chi rientra nella sua campagna non vede più passare la schermata d\'ingresso, ma solo «Rientro al tavolo…» e poi il tavolo.',
    'Dopo un aggiornamento l\'app non si ricarica più da sola appena aperta (si vedeva tutto due volte).'
  ] },
  { v: '4.6.3', data: '24/11/2026', voci: [
    'Scritte più leggibili: etichette della scheda (classe armatura, iniziativa, caratteristiche) e carte da collezione un po\' più grandi; le scritte piccole in pixel dentro titoli e pulsanti ora si leggono.',
    'Barra in basso: su telefoni stretti la voce «Altro» non esce più dallo schermo. Cursori del volume allineati.'
  ] },
  { v: '4.6.2', data: '24/11/2026', voci: [
    'Caratteri controllati: Inter e Cinzel ora sono dentro l\'app, come Jersey 15. Si vedono giusti anche senza rete o dove Google è bloccato, con tutti gli spessori, e senza richieste a Google.',
    'Le immagini da condividere (cartolina, il vostro mese) aspettano i caratteri veri prima di disegnarsi; la mappa si ridisegna appena arrivano.'
  ] },
  { v: '4.6.1', data: '24/11/2026', voci: [
    'Riepilogo illustrato della serata più affidabile: l\'IA ha più tempo per scriverlo e, se non risponde, arriva lo stesso con i numeri della serata.'
  ] },
  { v: '4.6.0', data: '24/11/2026', voci: [
    'Mercato tra di voi: mettete sulla bancarella (o regalate) gli oggetti dell\'inventario, le monete passano da una scheda all\'altra.',
    'Duello amichevole tra due personaggi o con il campione dell\'arena: colpo dopo colpo, senza ferite vere.',
    'Giornale del regno: a ogni nuova serata le vostre imprese raccontate dalla gente, con un pettegolezzo che può diventare la prossima avventura.',
    'Patti e debiti con i PNG: le promesse restano segnate, il master le ricorda e torna a riscuoterle; chi tradisce un patto se lo sente rinfacciare.',
    'Feste delle stagioni: Festa dei Fiori, Torneo d\'Estate, Festa del Raccolto e Festa del Ghiaccio portano una missione speciale (d\'estate anche il torneo).',
    'Allenamento di cinque minuti: una scena veloce da solo per provare un personaggio nuovo.',
    'Biblioteca delle regole illustrata: condizioni, incantesimi e regole di base, ognuno con la sua scheda e il suo disegno (anche dalla scheda del personaggio).',
    'Scelte rapide: con ogni risposta il master propone tre idee, per chi non sa cosa fare.',
    'Tema musicale personale: ognuno sceglie il suo, e parte per tutti quando fa un colpo critico.',
    'Album della campagna: tutte le illustrazioni divise per serata, da sfogliare in grande.',
    'Rivincite: il nemico che vi ha messi a terra torna più forte, e batterlo vale il trofeo «Rivincita!».',
    'Modalità notte: luci basse, effetti più piano e voce del master più calma, anche da sola dalle 22 alle 7.'
  ] },
  { v: '4.5.0', data: '24/11/2026', voci: [
    'Mappa del tesoro: il master nasconde un tesoro, voi decifrate gli indizi (prova di Intelligenza) e scavate nel posto giusto. Anche la «Mappa di un tesoro sepolto» del negozio apre una caccia.',
    'Rompicapi da toccare: quattro leve, rune da premere in ordine, serrature a combinazione. Il gioco prepara indizi e soluzione; chi sbaglia fa scattare la trappola.',
    'Torneo: prove a punti tra i vostri personaggi e due sfidanti del posto (arco, braccio di ferro, indovinelli…), con classifica e premio. Si gioca anche in solitaria.',
    'Gli animali compagni crescono: livello, punti ferita e trucchi nuovi, con metà dei vostri PX e con l\'addestramento (una volta al giorno di gioco).',
    'La casa del gruppo diventa locanda e poi rocca, con una rendita a ogni nuova serata; si può rinominare. La stalla accorcia i viaggi a cavallo, la biblioteca aiuta a decifrare le mappe.',
    'Avventure scritte da voi: chi guida le scrive a scene nello schermo del master, il master AI le segue, e con un codice le gioca anche un altro gruppo.'
  ] },
  { v: '4.4.1', data: '24/11/2026', voci: [
    'Entrare in un edificio nuovo è immediato anche quando il servizio che descrive l\'interno è lento: la descrizione arriva appena è pronta.',
    'Scheda stampata: la CD dei tiri salvezza degli incantesimi ora si legge (e c\'è anche il bonus di attacco con incantesimo).'
  ] },
  { v: '4.4.0', data: '24/11/2026', voci: [
    'Salita di livello guidata: dopo «Sali di livello» l\'app spiega cosa cambia e ti guida nelle scelte, una alla volta (caratteristiche consigliate per la classe, incantesimi nuovi adatti, talento nella 3.5).',
    'Diario del personaggio: nella scheda il master scrive una pagina in prima persona, con la voce del tuo personaggio, su quello che è successo. Si può condividere.',
    'Viaggi a tappe (🧭 Viaggio, accanto a Vai): per i luoghi lontani passano i giorni, la sera vi accampate e lungo la strada può capitare un agguato. A cavallo si fa prima.',
    'Scheda stampabile: «Stampa o salva in PDF» apre la scheda impaginata come quella di carta.',
    'Nelle puntate precedenti, con le immagini: le illustrazioni della campagna scorrono a tutto schermo mentre il master racconta.',
    'Mostri e oggetti inventati: chi guida crea un mostro (con il suo disegno) o un oggetto magico, lo mette in scena o lo dà a un personaggio, e il master AI lo usa nella storia.',
    'Accessibilità: colori per daltonici e lettura ad alta voce dei pulsanti che tocchi (in Altro, Aspetto e comodità).',
    'Il vostro mese: in Altro, il riepilogo mensile della campagna con numeri, trofei, serate e luoghi scoperti, da condividere come immagine.'
  ] },
  { v: '4.3.3', data: '24/11/2026', voci: [
    'Entrando in un luogo più largo dello schermo, la mappa parte dalla tua figura (per gli spettatori dal primo personaggio) invece che dall\'angolo in alto a sinistra.'
  ] },
  { v: '4.3.2', data: '24/11/2026', voci: [
    'Finito lo scontro, l\'avviso «È il tuo turno!» sparisce subito invece di restare in alto.',
    'Quando arriva il riassunto, l\'avviso «Il master prepara il riassunto» si chiude da solo.',
    'Le parti che si aprono (Altri strumenti, Come si usa la mappa, Aspetto del personaggio...) hanno la freccina: prima sembravano semplici titoli.',
    'Sulla mappa il nome di una figura sul bordo non viene più tagliato.'
  ] },
  { v: '4.3.1', data: '23/11/2026', voci: [
    'Vista 3D con la nebbia: non diventa più tutta grigia. Le zone non esplorate restano scure e la nebbia si adatta a quanto è lontana la vista.'
  ] },
  { v: '4.3.0', data: '23/11/2026', voci: [
    'Messaggio segreto al master AI: nei messaggi scegli «solo il master» e gli dici una cosa che gli altri non sanno. Lui ne tiene conto e risponde solo a te.',
    'Frecce e quadrelli si consumano a ogni tiro con l\'arco o la balestra; senza munizioni non si tira, e dopo lo scontro se ne raccoglie metà. Ranger e warlock partono con 20.',
    'Quando il gruppo riposa nella storia, il master fa tornare da solo punti ferita e slot degli incantesimi. Il master vede anche quanti slot e frecce vi restano.',
    'Calendario di gioco: giorni della settimana, stagioni che cambiano da sole ogni 30 giorni, una festa per stagione e missioni con scadenza.',
    'Carte da collezione nel Diario: ogni mostro incontrato diventa una carta, con cornice di bronzo, argento o oro secondo quanti ne sconfiggete.',
    'Appunti del mondo anche da PDF.',
    'Ritratto illustrato del personaggio, creato dalla scheda nello stile della campagna (tocca il ritratto per tornare alla figura in pixel).',
    'La musica cambia anche secondo il momento: il master può renderla tesa, misteriosa, di festa, triste o epica.',
    'Sulla mappa, chi passa dietro una casa finisce sotto il tetto, che diventa trasparente.',
    'La cartolina della serata usa le scritte in pixel e i ritratti illustrati.',
    'La copia della campagna ora salva anche cronaca, appunti del mondo, fatti, disegni e carte.'
  ] },
  { v: '4.2.2', data: '23/11/2026', voci: [
    'Cosa ricorda il master: con la memoria piena, il fatto appena aggiunto resta e si perde il più vecchio.',
    'In combattimento lo Scatto si usa una volta per turno.',
    'Vista spettatore: la riga delle reazioni torna su una riga sola.'
  ] },
  { v: '4.2.1', data: '23/11/2026', voci: [
    'Gioco a distanza: quando rientri trovi subito l\'ultima risposta del master.',
    'Primi passi: l\'elenco compare dopo l\'invito alla guida, non insieme, e si spunta appena crei il personaggio.',
    'Spegnendo i turni a giro o il gioco a distanza, il master risponde subito a chi aveva già scritto.'
  ] },
  { v: '4.2.0', data: '23/11/2026', voci: [
    'Primi passi: nell\'ingresso «Mai giocato? Prova in un quarto d\'ora» apre una piccola avventura da soli con il master AI, che spiega come si gioca una cosa alla volta.',
    'Elenco dei primi passi per chi è nuovo: cinque cose da fare che si spuntano da sole mentre giochi, e «Mostrami» ti porta nel punto giusto.',
    'Gioco a distanza: ognuno scrive la sua mossa quando può. Il master risponde quando hanno scritto tutti, o al più tardi dopo 6 ore, 12 ore, 1 giorno o 2 giorni.',
    'Con il gioco a distanza una notifica ti avvisa quando tocca a te (tasto Avvisami nel Diario).',
    'Mondi condivisi: chi ha creato la campagna dà un codice e un altro gruppo comincia la sua storia nello stesso mondo, con ambientazione, appunti, luoghi con le loro mappe e fazioni.',
    'Il codice del mondo si può scrivere anche quando si crea una campagna nuova.',
    'Le notifiche ora dicono di che cosa parlano: serata in arrivo oppure tocca a te.'
  ] },
  { v: '4.1.0', data: '23/11/2026', voci: [
    'Il vostro mondo: chi guida la campagna scrive (o carica da un file) appunti su storia, luoghi, personaggi e segreti, e il master AI li usa come verità.',
    'Master più onesto: tiene fermi i fatti che ha deciso (chi è il colpevole, cosa c\'è dietro la porta), fa fallire le azioni impossibili e non cambia la storia per accontentare.',
    'Difficoltà della campagna: Storia, Normale o Dura.',
    'Turni a giro: il master AI aspetta che tutti abbiano detto cosa fanno e risponde a tutti insieme. Chi guida può farlo rispondere subito.',
    'Messaggi privati tra giocatori: li leggono solo i due, nel diario hanno un segno a parte.',
    'Azioni del turno sempre a vista in combattimento: Scatto, Disimpegno, Schivata, Aiuta, Spingi, Nasconditi, Cerca.',
    'Aiuto: quando un compagno deve fare una prova puoi aiutarlo, e lui tira con vantaggio.',
    'Cosa ricorda il master: nel Diario si legge la memoria della campagna, e chi guida può aggiungere un fatto da non dimenticare.',
    'Ricerca nel diario.',
    'Mazzo di carte del tavolo (52 carte e 2 jolly) nella scheda Dadi.',
    'Riassunto completo e riassunto da cantastorie in rima, da condividere con un tocco.',
    'Stile delle illustrazioni a scelta: realistico, acquerello, fumetto, pixel art, inchiostro antico, pittura a olio.',
    'Alzo la mano: un tasto per chiedere la parola senza interrompere.',
    'Sulla mappa i nomi di due figure vicine non si coprono più, e gli alberi non nascondono i nomi dei luoghi.'
  ] },
  { v: '4.0.0', data: '23/11/2026', voci: [
    'Righello sulla mappa: trascina per misurare in linea d\'aria, tocca una casella per sapere quanti passi servono girando intorno ai muri.',
    'In combattimento, nel tuo turno, vedi quanto movimento ti resta: le caselle si scalano a ogni passo.',
    'Disegna sulla mappa col dito (Altri strumenti): frecce, cerchi, piani d\'attacco. Lo vedono tutti; ognuno toglie i suoi tratti, il master tutti.',
    'Aure: tieni premuto sulla tua figura per darle un cerchio attorno (luce della torcia, aura magica). La vedono tutti.',
    'Area incantesimo con tiro salvezza e danni: scegli caratteristica, difficoltà e dadi; il server tira per ogni creatura dentro e applica i danni (metà a chi supera).',
    'Arrivando alla porta di un edificio l\'app ti propone di entrare; sulla porta di un interno, di uscire.',
    'Clessidra del turno (Altro → Campagna): 30 secondi, 1 minuto, 1 minuto e mezzo o 2. Avvisa chi è di turno quando scade, senza passargli il turno.',
    'Il master può nascondere il nome di un nemico finché il gruppo non lo scopre (tieni premuto sulla figura). I giocatori vedono «???».',
    'Salva la mappa come immagine, da stampare o mandare agli amici (Altri strumenti).'
  ] },
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
function togliToast(re) { const t = $('#toast'); if (!t.hidden && re.test(t.textContent)) t.hidden = true; } // l'avviso "sto preparando…" o "tocca a te" non resta sopra il risultato arrivato
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

/* ============ DISPOSITIVO (4.7.1): che cos'è, quanto è potente e com'è lo schermo; la grafica si sceglie da sola, come in Le Cronache dei Varchi ============ */
const Dispositivo = window.Dispositivo = (() => {
  const mm = q => matchMedia(q).matches;
  const stato = { batteria: null, carica: true, caldo: false, modello: '', hz: 0 };
  const memoria = () => navigator.deviceMemory || 0, nuclei = () => navigator.hardwareConcurrency || 0;
  function tipo() {
    if (/[?&]tv=1/.test(location.search) || /\b(TV|AFT\w*|BRAVIA|SmartTV|GoogleTV|CrKey)\b/.test(navigator.userAgent)) return 'tv';
    if (/Odin|Retroid|AYN|AYANEO|Steam ?Deck/i.test(stato.modello + ' ' + navigator.userAgent)) return 'console';
    if (mm('(pointer: coarse)')) return Math.min(screen.width, screen.height) >= 600 ? 'tablet' : 'telefono';
    return 'computer';
  }
  // come qualita_effettiva() di Varchi: memoria (Chrome la dice fino a 8 GB), poi risparmio energetico e telefono caldo abbassano tutto
  function automatica() {
    if (navigator.connection?.saveData || stato.caldo || (stato.batteria !== null && stato.batteria < 0.15 && !stato.carica)) return 'bassa';
    const m = memoria(), n = nuclei();
    if (m) return m >= 6 ? 'alta' : m >= 3 ? 'media' : 'bassa';
    if (tipo() === 'computer') return 'alta';
    return n >= 8 ? 'alta' : n >= 4 ? 'media' : 'bassa';
  }
  const manuale = () => ['alta', 'media', 'bassa'].includes(OPZ.grafica);
  const qualita = () => manuale() ? OPZ.grafica : automatica();
  // nitidezza delle immagini disegnate: con la grafica media o bassa si disegnano meno pixel
  const dpr = max => Math.min(window.devicePixelRatio || 1, max, { alta: 9, media: 1.5, bassa: 1 }[qualita()]);
  let ultima = qualita();
  function cambiato() { const q = qualita(); if (q === ultima) return; ultima = q; Report.log('grafica', { qualita: q, auto: !manuale(), caldo: stato.caldo, batteria: stato.batteria }); if (typeof applicaStile === 'function') applicaStile(); }
  try { navigator.getBattery?.().then(b => { const su = () => { stato.batteria = b.level; stato.carica = b.charging; cambiato(); }; su(); b.addEventListener('levelchange', su); b.addEventListener('chargingchange', su); }).catch(() => {}); } catch {}
  // processore sotto sforzo (telefono che scalda): la grafica scende dopo 15 secondi e risale dopo un minuto tranquillo, senza saltare avanti e indietro
  let attesaCaldo = null;
  const caldoDopo = (v, ms) => { clearTimeout(attesaCaldo); attesaCaldo = setTimeout(() => { stato.caldo = v; cambiato(); }, ms); };
  try { if ('PressureObserver' in window) new PressureObserver(r => { const sotto = ['serious', 'critical'].includes(r.at(-1)?.state); if (sotto && !stato.caldo) caldoDopo(true, 15000); else if (!sotto && stato.caldo) caldoDopo(false, 60000); else clearTimeout(attesaCaldo); }).observe('cpu', { sampleInterval: 5000 }).catch(() => {}); } catch {}
  try { navigator.userAgentData?.getHighEntropyValues(['model']).then(v => { stato.modello = v.model || ''; }).catch(() => {}); } catch {}
  // frequenza dello schermo: fotogrammi contati in un secondo, arrotondati ai valori veri (60, 90, 120…)
  function misuraHz() {
    if (stato.hz) return Promise.resolve(stato.hz);
    return new Promise(ok => { let n = 0; const t0 = performance.now(); const giro = t => { if (t - t0 < 1000) { n++; requestAnimationFrame(giro); return; } stato.hz = [30, 48, 50, 60, 72, 75, 90, 120, 144, 165, 240].reduce((a, b) => Math.abs(b - n) < Math.abs(a - n) ? b : a); ok(stato.hz); }; requestAnimationFrame(giro); });
  }
  function profilo() {
    const d = window.devicePixelRatio || 1;
    return { tipo: tipo(), modello: stato.modello, schermo: `${screen.width}x${screen.height}`, pixel: `${Math.round(screen.width * d)}x${Math.round(screen.height * d)}`, finestra: `${innerWidth}x${innerHeight}`, dpr: d,
      hz: stato.hz, verticale: mm('(orientation: portrait)'), tocco: mm('(pointer: coarse)'), memoria: memoria(), nuclei: nuclei(), qualita: qualita(), auto: !manuale(),
      caldo: stato.caldo, batteria: stato.batteria, risparmioDati: !!navigator.connection?.saveData, temaTelefono: mm('(prefers-color-scheme: light)') ? 'chiaro' : 'scuro' };
  }
  return { tipo, qualita, dpr, misuraHz, profilo };
})();
// dadi 3D: sui dispositivi lenti partono spenti, finché chi gioca non li riaccende
const dadi3d = () => OPZ.dadi3d ?? Dispositivo.qualita() !== 'bassa';
const me = () => S.st?.membri?.[S.io];
const capo = () => !!(me() && (me().ruolo === 'master' || me().admin));
const mioPg = () => S.st?.pg?.[S.io] || null;
const regole = () => S.st?.campagna?.regole || '5e';
const masterAI = () => S.st?.campagna?.masterTipo === 'ai';
const campagneSalvate = () => leggi('ta_campagne', []);
function salvaCampagna(c) { const l = campagneSalvate().filter(x => x.codice !== c.codice); l.unshift({ ...c, ultimo: Date.now() }); scrivi('ta_campagne', l.slice(0, 20)); }
function dimenticaCampagna(codice) { scrivi('ta_campagne', campagneSalvate().filter(x => x.codice !== codice)); }
const codiceNuovo = () => { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; const r = crypto.getRandomValues(new Uint32Array(8)); return [...r].map(x => a[x % a.length]).join(''); };
