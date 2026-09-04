const CACHE = 'mp-central-2026.09.04-1838';
const ASSETS = ['./','./index.html','./instalar.html','./manifest.json','./logo.png',
  './icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(async c => {
    await Promise.all(ASSETS.map(u => c.add(u).catch(() => {})));
    self.skipWaiting();
  }));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // chamadas do Firebase e das fontes nunca passam pelo cache
  const url = new URL(req.url);

  // a página de manutenção sempre vem do servidor
  if (url.pathname.endsWith('/atualizar.html')) return;
  if (/googleapis|gstatic|firebase/.test(url.hostname)) return;

  // A página sempre é buscada na rede primeiro. Sem isso, uma publicação
  // nova pode continuar servindo a versão antiga guardada no cache.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req, { cache: 'no-store' })
      .then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok && url.origin === location.origin) {
      const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c));
    }
    return r;
  }).catch(() => hit)));
});
