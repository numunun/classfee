self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  if (e.request.mode !== "navigate") return;
  e.respondWith(fetch(e.request).catch(() => new Response(
    '<meta charset="utf-8"><body style="background:#0e0e10;color:#aaa;font-family:sans-serif;text-align:center;padding-top:40vh">인터넷에 연결되어 있지 않아요</body>',
    { headers: { "content-type": "text/html; charset=utf-8" } })));
});