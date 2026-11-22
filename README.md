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
- **Mappe persistenti**: ogni luogo ha sempre la stessa mappa; edifici bruciati o distrutti restano così.
- **Dadi tirati dal server** (nessuno bara), vantaggio/svantaggio, tiri segreti del master.
- **Modalità TV**, prova di microfono e connessione, domande sulle regole, suggerimenti, rapporti cifrati, aggiornamento dall'app.

## Come è fatta
- Web app in JavaScript puro, pubblicata con GitHub Pages.
- Server: Durable Object `Tavolo` dentro il Worker Cloudflare `rapporti-vincenzo` (`GET /tavolo/<codice>/ws`).
- Master AI con Gemini (chiave solo sul server).
- File: `regole.js` (5e/3.5), `comandi.js` (comandi vocali), `ritratto.js`, `mappa.js`, `voce.js` (WebRTC, riconoscimento vocale, narratore), `app.js`.

## Licenze
Regole tratte dal System Reference Document 5.1 (CC-BY-4.0) e 3.5 (OGL). Dungeons & Dragons è un marchio di Wizards of the Coast: app non ufficiale, fatta da fan. Libreria QR di Kazuhiko Arase (MIT).

## Pubblicare una versione
GitHub Pages pubblica il ramo `gh-pages`: dopo ogni commit su `main` fare `git push origin main main:gh-pages`. Aggiornare insieme `VERSION`/`CHANGELOG` in `app.js`, `version.json` e `CACHE` in `sw.js`.
