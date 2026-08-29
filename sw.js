/* Nightside service worker.
   Shell is NETWORK-FIRST and the cache name carries a build stamp, so a
   deployed fix actually reaches installed phones instead of sitting behind
   a stale cache. Data is network-first with a cached fallback, which is what
   lets the app open and still show you last night's numbers with no signal. */

const BUILD = '2026-08-29-9';
const SHELL = 'ns-shell-' + BUILD;
const LIB   = 'ns-lib-' + BUILD;
const DATA  = 'ns-data';

const SHELL_FILES = [
  './', './index.html', './manifest.json',
  './icon-192.png', './icon-512.png', './apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => (k === SHELL || k === LIB || k === DATA) ? null : caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const isData = u =>
  u.hostname === 'services.swpc.noaa.gov' ||
  u.hostname === 'api.open-meteo.com';

const isLib = u =>
  u.hostname === 'unpkg.com' ||
  u.hostname === 'fonts.googleapis.com' ||
  u.hostname === 'fonts.gstatic.com';

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  /* Map tiles and place search: straight to the network, never cached. */
  if (url.hostname.endsWith('basemaps.cartocdn.com') || url.hostname.endsWith('arcgisonline.com')
      || url.hostname === 'tile.openstreetmap.org' || url.hostname === 'geocoding-api.open-meteo.com'
      || url.hostname === 'sdo.gsfc.nasa.gov'
      || url.hostname === 'api.helioviewer.org') return;

  /* Space weather + forecast: fresh if we can, last known if we can't. */
  if (isData(url)) {
    e.respondWith(
      fetch(req).then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(DATA).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  /* Leaflet and web fonts: cache-first, they are versioned by URL. */
  if (isLib(url)) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(LIB).then(c => c.put(req, copy)); }
        return res;
      }))
    );
    return;
  }

  /* App shell: network-first so updates land, cache as the fallback. */
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(req).then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(SHELL).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
    );
  }
});

/* Tapping a notification should open the app, not a new tab each time. */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) if ('focus' in c) return c.focus();
      if (self.clients.openWindow) return self.clients.openWindow('./');
    })
  );
});
