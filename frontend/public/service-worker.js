/* Kill-switch service worker.
 *
 * Earlier product iterations registered a cache-first PWA worker at this exact
 * path (/sw.js) that precached "/internship" and kept serving a since-deleted
 * static internship landing page. A service worker a visitor's browser
 * installed in the past stays active FOREVER until something explicitly
 * unregisters it — deleting the file and removing the registration call does
 * not remove an already-installed worker. Worse, once the old worker's
 * fetch handler intercepts "/internship" and serves stale HTML, the fresh JS
 * bundle (which contains the runtime cleanup) never loads on that route, so it
 * could never self-heal from inside the app.
 *
 * The browser periodically re-fetches this script (its scriptURL) to check for
 * updates. Serving valid JavaScript here — instead of the SPA index.html the
 * "/*" fallback used to return — lets the browser install THIS worker, which
 * then deletes every Cache Storage entry, unregisters itself, and reloads open
 * tabs so the live network content is served. Self-healing for every returning
 * visitor, no manual cache clear required. It has no fetch handler, so it never
 * intercepts navigations again.
 *
 * The current, legitimate push worker lives at /web-push-sw.js and is untouched
 * by this file.
 */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        if (self.caches) {
          const names = await caches.keys();
          await Promise.all(names.map((name) => caches.delete(name)));
        }
      } catch (e) {
        /* ignore */
      }
      try {
        await self.clients.claim();
      } catch (e) {
        /* ignore */
      }
      try {
        await self.registration.unregister();
      } catch (e) {
        /* ignore */
      }
      try {
        const clientList = await self.clients.matchAll({ type: "window" });
        clientList.forEach((client) => client.navigate(client.url));
      } catch (e) {
        /* ignore */
      }
    })()
  );
});
