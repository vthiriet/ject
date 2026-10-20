// Service worker de Ject : garde l'app en cache pour qu'elle s'ouvre même hors ligne.
const CACHE = 'ject-v7';
const SHELL = ['/', '/manifest.webmanifest', '/icons/icon.svg', '/icons/icon-192.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return;

  // Pages : réseau d'abord (pour avoir la dernière version), cache si hors ligne.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('/', copy));
          return res;
        })
        .catch(() => caches.match('/', { ignoreSearch: true })),
    );
    return;
  }

  // Fichiers de l'app (noms uniques à chaque version) : cache d'abord.
  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});

// ---------- Rappels des habitudes (notifications) ----------

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }
  const options = {
    body: data.body || '',
    tag: data.tag || 'ject',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: data.url || '/', habitId: data.habitId || null },
  };
  // Une seule habitude : bouton « +1 » pour compter une fois sans ouvrir Ject.
  if (data.habitId) options.actions = [{ action: 'plus1', title: '+1' }];
  event.waitUntil(self.registration.showNotification(data.title || 'Ject', options));
});

self.addEventListener('notificationclick', (event) => {
  const { url, habitId } = event.notification.data || {};
  event.notification.close();
  if (event.action === 'plus1' && habitId) {
    event.waitUntil(
      addOnce(habitId).then(async (ok) => {
        // Ject ouvert en arrière-plan : il relit sa base pour afficher le +1.
        for (const c of await self.clients.matchAll({ type: 'window' })) c.postMessage('ject:refresh');
        return self.registration.showNotification(ok ? '+1 enregistré' : 'Ouvre Ject pour compter cette fois', {
          tag: 'ject-plus1',
          icon: '/icons/icon-192.png',
          data: { url: '/?tab=habit' },
        });
      }),
    );
    return;
  }
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const open = list.find((c) => new URL(c.url).origin === location.origin);
      if (open) return open.focus().then((c) => c && c.navigate(url || '/'));
      return self.clients.openWindow(url || '/');
    }),
  );
});

/**
 * Compte une fois l'habitude aujourd'hui, directement dans la base locale de l'app
 * (IndexedDB « ject ») ; la synchronisation l'enverra à la prochaine ouverture.
 */
function addOnce(id) {
  return new Promise((resolve) => {
    const req = indexedDB.open('ject');
    req.onerror = () => resolve(false);
    req.onupgradeneeded = () => req.transaction.abort(); // base absente : on ne la crée pas ici
    req.onsuccess = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('notes') || !db.objectStoreNames.contains('outbox')) {
        db.close();
        return resolve(false);
      }
      const tx = db.transaction(['notes', 'outbox'], 'readwrite');
      const notes = tx.objectStore('notes');
      const get = notes.get(id);
      get.onsuccess = () => {
        const note = get.result;
        if (!note) return tx.abort();
        const d = new Date();
        const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const log = Object.assign({}, note.habitLog);
        log[day] = (log[day] || 0) + 1;
        notes.put(Object.assign({}, note, { habitLog: log, updatedAt: Date.now() }));
        tx.objectStore('outbox').put({ id, kind: 'note' });
      };
      tx.oncomplete = () => {
        db.close();
        resolve(true);
      };
      tx.onabort = () => {
        db.close();
        resolve(false);
      };
    };
  });
}
