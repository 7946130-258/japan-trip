/* 離線也能打開網站（資料本身由 Firebase 的離線快取處理） */
const CACHE = "jp27-v2";
const SHELL = [
  "./", "index.html", "styles.css", "config.js", "manifest.webmanifest",
  "i18n.js", "util.js", "store.js", "ui.js", "plan.js", "money.js", "flights.js", "main.js",
  "barlow-condensed-latin-500-normal.woff2", "barlow-condensed-latin-600-normal.woff2", "barlow-condensed-latin-700-normal.woff2",
  "icon.svg", "icon-192.png", "icon-512.png", "apple-touch-icon.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // 自己的檔案：先上網拿最新版，失敗才用快取（改了網站大家馬上看到新版）
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match("index.html")))
    );
    return;
  }

  // Firebase 程式庫：有快取就先用，背景更新
  if (url.hostname === "www.gstatic.com" && url.pathname.startsWith("/firebasejs/")) {
    e.respondWith(
      caches.open(CACHE).then((c) => c.match(req).then((hit) => {
        const net = fetch(req).then((res) => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => hit);
        return hit || net;
      }))
    );
  }
  // 其他（Firestore 連線等）不攔截
});
