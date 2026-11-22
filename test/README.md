# Prove di Tavolo d'Avventura

Servono: Node 20+, `npm i ws playwright wrangler@4`, il repository `rapporti-vincenzo` accanto a questo.

1. Gemini finto: `node test/gemini-finto.mjs` (porta 8799)
2. Server delle stanze, dalla cartella `rapporti-vincenzo`:
   `npx wrangler dev --local --port 8787 --var GEMINI_KEY:finta --var GEMINI_BASE:http://localhost:8799 --var MCP_CHIAVE:segreta --var IMG_FINTA:1`
3. App, da questa cartella: `python3 -m http.server 8765`
4. Prove:
   - `node test/comandi.test.js` (regole 5e/3.5 e comandi vocali)
   - `node test/mappe.test.mjs` (mappe generate: oggetti fuori dai muri, ogni casella raggiungibile, percorsi senza attraversare muri; non serve il server)
   - `node test/prova-server.mjs` e `node test/prova-master.mjs` (server e master AI)
   - `node test/e2e.js` (app intera nel browser: due giocatori, TV, voce, bot di prova)

   - `node test/push.test.mjs` (firma delle notifiche) e `sh test/controllo-codice.sh` (nomi non definiti e doppioni in app e server; serve `npm i eslint@9 globals`)

Devono passare tutte prima di pubblicare.

Sull'app pubblicata: `node test/giro-schermate.js <cartella>` apre tutte le schermate (telefono, computer, spettatore, TV, master umano) e salva le foto: vanno guardate una per una.

Partita bot sul server vero (4 bot + master AI, rapporti cifrati in TavoloAvventura-rapporti): workflow "Partita bot" su GitHub, a mano o con `[partita-bot]` nel messaggio del commit. In locale: `APP=http://localhost:8765/ node test/partita-bot.js`.
