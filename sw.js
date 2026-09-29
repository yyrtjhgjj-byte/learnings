/*
 * オフライン対応。
 * 自分のファイルは「キャッシュを先に返し、裏で最新を取りに行く」。
 * コンテンツを大きく変えたら VERSION を上げると古いキャッシュが消える。
 */
const VERSION = 'v7';
const CACHE = 'otona-shakai-' + VERSION;
const FONT_CACHE = 'otona-shakai-fonts';

const PRECACHE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'assets/css/style.css',
  'assets/js/app.js',
  'assets/icons/icon.svg',
  'assets/icons/icon-180.png',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'data/_registry.js',
  'data/diagrams.js',
  'data/politics-1.js',
  'data/politics-2.js',
  'data/economics-1.js',
  'data/economics-2.js',
  'data/ethics-1.js',
  'data/ethics-2.js',
  'data/geography-1.js',
  'data/geography-2.js',
  'data/history-1.js',
  'data/history-2.js',
  'data/physics-1.js',
  'data/physics-2.js',
  'data/chemistry-1.js',
  'data/chemistry-2.js',
  'data/biology-1.js',
  'data/biology-2.js',
  'data/earth-1.js',
  'data/earth-2.js',
  'data/manners.js',
  'data/ceremony.js',
  'data/living.js',
  'data/trivia-physics.js',
  'data/trivia-life.js',
  'data/trivia-culture.js',
  'data/timeline.js',
  'data/timeline-science.js',
  'data/people.js',
  'data/people-science.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== FONT_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function staleWhileRevalidate(request, cacheName) {
  return caches.open(cacheName).then((cache) =>
    cache.match(request, { ignoreSearch: true }).then((hit) => {
      const net = fetch(request)
        .then((res) => {
          if (res && (res.ok || res.type === 'opaque')) cache.put(request, res.clone());
          return res;
        })
        .catch(() => hit);
      return hit || net;
    })
  );
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(req, CACHE));
  } else if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    event.respondWith(staleWhileRevalidate(req, FONT_CACHE));
  }
});
