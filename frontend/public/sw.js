const CACHE = 'partyboom-v1';
const CORE = ['/', '/index.html']; // 최소 셸. 필요하면 정적 이미지/폰트 추가.

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 네비게이션은 Network-First → 실패 시 캐시된 index.html
// 그 외 정적요청은 Stale-While-Revalidate
self.addEventListener('fetch', (e) => {
  const req = e.request;

  // 외부 도메인, 비-GET은 패스
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put('/index.html', copy));
        return res;
      }).catch(() =>
        caches.match('/index.html')
      )
    );
    return;
  }

  // 정적 리소스: 캐시 우선 + 백그라운드 갱신
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    const fetchPromise = fetch(req).then((res) => {
      cache.put(req, res.clone());
      return res;
    }).catch(() => cached);
    return cached || fetchPromise;
  })());
});