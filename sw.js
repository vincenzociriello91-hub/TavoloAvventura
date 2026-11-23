// Service worker: prima la rete (sempre l'ultima versione), cache solo se offline.
const CACHE = 'tavoloavventura-4.1.0';
const FILES = ['./', 'index.html', 'styles.css', 'qrcode.js', 'regole.js', 'comandi.js', 'ritratto.js', 'lpc.js', 'mondo.js', 'mappa.js', 'voce.js', 'bot.js', 'suoni.js', 'app.js', 'app-rete.js', 'app-mappa.js', 'app-scheda.js', 'app-gioco.js', 'app-altro.js', 'app-avvio.js', 'app-extra.js', 'app-stile.js', 'app-regia.js', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png'];
const CDN = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  // cache: 'reload' salta la cache HTTP di GitHub Pages (10 minuti) e scarica i file nuovi
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    if (url.pathname.endsWith('version.json')) return; // sempre dalla rete
    // figure LPC e three.js non cambiano dentro una versione: prima la cache (avvio più veloce, meno richieste)
    if (/\/(lpc|vendor|audio)\//.test(url.pathname)) {
      e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { if (res.ok) { const copia = res.clone(); caches.open(CACHE).then(c => c.put(req, copia)); } return res; })));
      return;
    }
    e.respondWith(fetch(req, { cache: 'no-cache' }).then(res => {
      if (res.ok) { const copia = res.clone(); caches.open(CACHE).then(c => c.put(req, copia)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('index.html'))));
  } else if (CDN.includes(url.hostname)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copia = res.clone(); caches.open(CACHE).then(c => c.put(req, copia)); }
      return res;
    })));
  }
});
// promemoria delle serate: la notifica arriva senza contenuto (nessun dato personale passa dal servizio di notifiche)
self.addEventListener('push', e => e.waitUntil(self.registration.showNotification("Tavolo d'Avventura", { body: 'Si avvicina la serata di D&D! Tocca per entrare al tavolo.', icon: 'icon-192.png', badge: 'icon-192.png', tag: 'serata' })));
self.addEventListener('notificationclick', e => { e.notification.close(); e.waitUntil(self.clients.matchAll({ type: 'window' }).then(l => l.length ? l[0].focus() : self.clients.openWindow('./'))); });
