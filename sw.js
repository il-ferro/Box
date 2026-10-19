// Tiene l'app salvata sul telefono così si apre anche senza connessione.
const CACHE = 'box-v11';
const FILES = ['./', './index.html', './manifest.json', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Pagina principale: prova prima la rete (così gli aggiornamenti arrivano subito),
// se non c'è campo usa la copia salvata. Il resto: prima la copia salvata.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const sameOrigin = new URL(e.request.url).origin === location.origin;
  const store = res => { if (res && res.ok && sameOrigin) { const c = res.clone(); caches.open(CACHE).then(k => k.put(e.request, c)); } return res; };
  if (e.request.mode === 'navigate') {
    e.respondWith(
      Promise.race([
        fetch(e.request).then(store),
        new Promise((_, rej) => setTimeout(rej, 3000))
      ]).catch(() => caches.match(e.request, {ignoreSearch: true}).then(r => r || caches.match('./index.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request, {ignoreSearch: true}).then(cached =>
      cached || fetch(e.request).then(store)
    )
  );
});
