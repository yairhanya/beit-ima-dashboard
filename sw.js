/* ===========================================
   Service Worker - הבית של אמא
   שומר את המסכים במכשיר: פתיחה מיידית תמיד,
   עדכון שקט ברקע כשיש רשת.
   =========================================== */
const CACHE = "beit-ima-shell-v1";

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  /* שומרים רק את דפי הממשק - לעולם לא את ה-API */
  if (!url.pathname.startsWith("/local/")) return;
  if (!url.pathname.endsWith(".html")) return;

  const key = url.pathname; /* מתעלמים מ-?v= כדי שכל הגרסאות יפגעו באותו מטמון */

  e.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(key).then((cached) => {
        const fromNetwork = fetch(e.request)
          .then((res) => {
            if (res && res.ok) cache.put(key, res.clone());
            return res;
          })
          .catch(() =>
            cached ||
            new Response("אין חיבור לבית כרגע - נסו שוב עוד רגע", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" }
            })
          );
        /* יש עותק שמור? מגישים אותו מיידית, והרשת מעדכנת ברקע */
        return cached || fromNetwork;
      })
    )
  );
});
