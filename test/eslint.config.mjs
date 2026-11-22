// Controllo del codice: nomi non definiti, doppioni, costanti riassegnate. Uso: sh test/controllo-codice.sh
import globals from 'globals';
const regole = { 'no-undef': 'error', 'no-redeclare': 'error', 'no-dupe-keys': 'error', 'no-dupe-class-members': 'error', 'no-const-assign': 'error' };
export default [
  { files: ['**/cliente.js'], languageOptions: { ecmaVersion: 2024, sourceType: 'script', globals: { ...globals.browser, qrcode: 'readonly', module: 'readonly' } }, rules: regole },
  { files: ['**/mappa3d.js', '**/dadi3d.js'], languageOptions: { ecmaVersion: 2024, sourceType: 'module', globals: { ...globals.browser, Mappa: 'readonly', Lpc: 'readonly', Ritratto: 'readonly' } }, rules: regole },
  { files: ['**/sw.js'], languageOptions: { ecmaVersion: 2024, sourceType: 'script', globals: globals.serviceworker }, rules: regole },
  { files: ['**/server/*.js'], languageOptions: { ecmaVersion: 2024, sourceType: 'module', globals: { ...globals.serviceworker, WebSocketPair: 'readonly' } }, rules: regole }
];
