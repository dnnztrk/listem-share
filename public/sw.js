/* List-em — paylaşılan listeyi markette çekmeyen yerde de açık tutar.
   Sayfalar önce ağdan istenir; ağ yoksa son açılan hâli gösterilir. */
const CACHE = 'listem-share-v3';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const isList = req.mode === 'navigate' && (url.pathname.startsWith('/s/') || url.pathname === '/share');
  const isAsset = /\.(svg|png|ico)$/.test(url.pathname);
  if (!isList && !isAsset) return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || Response.error()))
  );
});
