const CACHE_NAME = 'tfd-internship-v1';
const TO_CACHE = [
  '/internship',
  '/public/internship.html',
  '/public/manifest.json',
  '/assets/logo-internship.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(TO_CACHE)).catch(()=>{})
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});
