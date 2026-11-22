# Tavolo d'Avventura

D&D online con gli amici, dal browser di qualsiasi telefono, PC, Odin o TV. Niente da installare (si può anche aggiungere alla schermata Home).

**App:** https://vincenzociriello91-hub.github.io/TavoloAvventura/

## Cosa fa
- **Stanze online**: chi crea la campagna ottiene un QR e un link; il codice invito cambia a ogni sessione, così i vecchi inviti non funzionano più.
- **Voce**: chat vocale tra i giocatori (da telefono a telefono, l'audio non passa da nessun server e non viene mai registrato).
- **Master AI o in carne e ossa**: il master AI ascolta, narra a voce (con un timbro diverso per ogni PNG), chiede i tiri, applica danni e oggetti, sposta il gruppo nei luoghi e ricorda tutta la campagna.
- **Regolamento a scelta**: D&D 5ª edizione o 3.5, con scheda che si calcola da sola (PF, CA, tiri salvezza, abilità, BAB, livelli e punti caratteristica).
- **Comandi vocali sulla scheda**: "aumenta di due punti intelligenza", "subisco 7 danni", "recupero 5 punti ferita", "equipaggio l'ascia bipenne", "salgo di livello", "trovo 50 monete d'oro", "sono avvelenato", "tiro per percezione con vantaggio", "annulla".
- **Ritratto in pixel art** generato dal codice: cambia con armatura, armi, scudo, elmo, ferite (bende), punti ferita e condizioni.
- **Mappe persistenti**: ogni luogo ha sempre la stessa mappa; edifici e oggetti bruciati, rotti o spostati restano così.
- **Movimento realistico**: i personaggi camminano sul percorso vero e non attraversano muri né mobili (lo controlla anche il server); le zone mai viste restano al buio finché qualcuno non le vede; zoom 2D e 3D con "Tutta la mappa" (solo la parte scoperta); oggetti in proporzione (una casella è 1,5 m).
- **Mappe realistiche** (tecnologia delle Cronache dei Varchi): luci vere con le ombre, giorno e notte, ombre del sole, meteo animato, stagioni, oggetti di scena, vista del personaggio con scurovisione e torce, personaggi LPC animati; **vista 3D** stile HD-2D (three.js).
- **Voce naturale del master** (Gemini TTS), **illustrazioni** delle scene (Workers AI) e **riepilogo illustrato** di fine serata da condividere.
- **Battaglie spettacolari** (mosse LPC, danni e cure che saltano fuori, esplosioni degli incantesimi, condizioni visibili), **mostri disegnati** e **volti dei PNG** generati una volta per campagna, **dadi 3D**.
- **Avventura pronta** "La miniera dei goblin", **gioco da solo** con due compagni del master AI, **mappa del mondo illustrata**, **statistiche e trofei**, **sottotitoli**.
- **Negozi** con compra e vendi, **inventario con icone** da trascinare sul ritratto, **schermo del master** (PNG, incontri bilanciati, tesori, note segrete), **libro della campagna** in PDF, **sessione zero** guidata.
- **Personaggi con una storia**: storia e famiglia scritte col master, diario del personaggio a fine serata, memoriale dei caduti con eredi, obiettivo segreto e sogni privati, mestieri e creazione di oggetti, animali compagni e cavalcature.
- **Mondo vivo**: bacheca delle missioni, voto del gruppo, enigmi, nemesi ricorrente, minacce che crescono, scelte morali che cambiano il finale, casa del gruppo con stanze, mercante ambulante, prezzi secondo la reputazione nel luogo, musica ed effetti per scena (licenze in `audio/LICENZE.md`), grafica dei pacchetti comprati servita solo ai membri della campagna.
- **Serate e amici**: calendario delle serate con promemoria (.ics), link per amici spettatori con reazioni, traduzione automatica, note sulla mappa, giochi di taverna, cornici per chi viene alle serate, sfida della settimana in solitaria, guida per chi non ha mai giocato.
- **Avventure pronte**: La miniera dei goblin e il suo seguito (L'ombra della Torre di Corvonero), più due avventure da una serata (La notte della lanterna, Il pedaggio dell'ogre).
- **Dadi tirati dal server** (nessuno bara), vantaggio/svantaggio, tiri segreti del master.
- **Modalità TV**, prova di microfono e connessione, domande sulle regole, suggerimenti, rapporti cifrati, aggiornamento dall'app.

## Come è fatta
- Web app in JavaScript puro, pubblicata con GitHub Pages.
- Server: Durable Object `Tavolo` dentro il Worker Cloudflare `rapporti-vincenzo` (`GET /tavolo/<codice>/ws`).
- Master AI con Gemini (chiave solo sul server).
- File: `regole.js` (5e/3.5), `comandi.js` (comandi vocali), `ritratto.js`, `lpc.js` (figure animate), `mappa.js` (mappa 2D, luci, vista), `mappa3d.js` (vista 3D, three.js in `vendor/`, licenza MIT), `voce.js` (WebRTC, riconoscimento vocale, narratore), `suoni.js`, `app.js`.

## Licenze
Regole tratte dal System Reference Document 5.1 (CC-BY-4.0) e 3.5 (OGL). Dungeons & Dragons è un marchio di Wizards of the Coast: app non ufficiale, fatta da fan. Libreria QR di Kazuhiko Arase (MIT). Personaggi animati: Universal LPC Spritesheet Character Generator (OGA-BY 3.0 / CC-BY-SA 3.0 / GPL 3.0), autori in `lpc/crediti.json`; si aggiornano con `strumenti/lpc_da_varchi.py`.

## Pubblicare una versione
Aggiornare insieme `VERSION`/`CHANGELOG` in `app.js`, `version.json` e `CACHE` in `sw.js`, lanciare le prove (`test/README.md`), poi:
- `./pubblica.sh prova` → canale di prova (`/TavoloAvventura/prova/`), per Vincenzo
- `./pubblica.sh pubblico` → anche il canale pubblico (`/TavoloAvventura/`), per gli amici

## Segreti facoltativi del server
- `ANTHROPIC_KEY`: il master usa Claude invece di Gemini (a pagamento).
- `TURN_KEY_ID` e `TURN_API_TOKEN`: server di inoltro Cloudflare per la voce fra reti diverse.
- `MCP_CHIAVE`: attiva il connettore "D&D" per Claude su `/mcp?chiave=...`.
