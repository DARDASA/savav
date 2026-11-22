// פותח מהזיכרון מיד (עובד גם בלי קליטה), ומעדכן ברקע.
// מעלים את CACHE בכל שינוי בקבצים, כדי שהטלפון יוריד גרסה שלמה ואחידה.
const CACHE = 'savav-v3';
const FILES = ['./', 'index.html', 'app.js', 'fitness.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  // cache: 'reload' עוקף את זיכרון הדפדפן, אחרת אפשר לקבל קובץ ישן לצד קובץ חדש
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))));
  self.skipWaiting();
});

self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())));

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => {
    const net = fetch(e.request.url, { cache: 'no-cache' }).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    });
    return hit ? (net.catch(() => {}), hit) : net;
  }));
});
