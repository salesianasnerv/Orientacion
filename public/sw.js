// Permite instalar Orientación como app y que abra rápido.
// Solo se guardan los archivos de diseño (estilos, código e iconos); las páginas con datos
// del alumnado NUNCA se guardan en el dispositivo: siempre se piden al servidor.
const VERSION = 'v1';
const CACHE = `orientacion-${VERSION}`;
const ESTATICO = /^\/(_next\/static\/|icon-|logo\.svg|og-image\.png|favicon\.ico)/;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('orientacion-') && k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin || !ESTATICO.test(url.pathname)) return;
  e.respondWith(
    caches.match(req).then(guardado => guardado || fetch(req).then(res => {
      if (res.ok) { const copia = res.clone(); caches.open(CACHE).then(c => c.put(req, copia)); }
      return res;
    }))
  );
});
