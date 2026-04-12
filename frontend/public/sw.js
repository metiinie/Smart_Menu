const CACHE_NAME = 'arifsmart-v1';
const STATIC_CACHE = 'arifsmart-static-v1';
const IMAGE_CACHE = 'arifsmart-images-v1';

const STATIC_ASSETS = [
  '/',
  '/offline.html',
];

// ─── Install ───────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    }).then(() => self.skipWaiting())
  );
});

// ─── Activate ──────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => ![CACHE_NAME, STATIC_CACHE, IMAGE_CACHE].includes(k))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch ─────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension
  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  // Images → CacheFirst (long TTL)
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request)
            .then((res) => {
              cache.put(request, res.clone());
              return res;
            })
            .catch(() => cached);
        })
      )
    );
    return;
  }

  // API /menu → NetworkFirst with cache fallback
  if (url.pathname.startsWith('/api/menu')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        fetch(request)
          .then((res) => {
            cache.put(request, res.clone());
            return res;
          })
          .catch(() => cache.match(request))
      )
    );
    return;
  }

  // Static Next.js assets → StaleWhileRevalidate
  if (
    url.pathname.startsWith('/_next/static') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css')
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const networkFetch = fetch(request).then((res) => {
            cache.put(request, res.clone());
            return res;
          });
          return cached || networkFetch;
        })
      )
    );
    return;
  }

  // Navigation → NetworkFirst, fallback to cached page or offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then((c) => c || caches.match('/offline.html'))
      )
    );
  }
});

// ─── Background sync for failed orders ─────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'retry-orders') {
    event.waitUntil(retryPendingOrders());
  }
});

async function retryPendingOrders() {
  try {
    const db = await openDB();
    const pending = await getAllPending(db);
    for (const item of pending) {
      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.payload),
        });
        if (res.ok) await deletePending(db, item.id);
      } catch {}
    }
  } catch {}
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('arifsmart-offline', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('pending', { keyPath: 'id', autoIncrement: true });
    req.onsuccess = () => resolve(req.result);
    req.onerror = reject;
  });
}

function getAllPending(db) {
  return new Promise((resolve) => {
    const tx = db.transaction('pending', 'readonly');
    const req = tx.objectStore('pending').getAll();
    req.onsuccess = () => resolve(req.result);
  });
}

function deletePending(db, id) {
  return new Promise((resolve) => {
    const tx = db.transaction('pending', 'readwrite');
    tx.objectStore('pending').delete(id);
    tx.oncomplete = resolve;
  });
}
