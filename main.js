/* 啟動 */
(async function () {
  const JP = window.JP;
  const C = window.TRIP_CONFIG;
  const U = JP.u, ui = JP.ui, S = JP.store, t = JP.t;

  JP.i18n.set(JP.i18n.lang);

  // 分享連結：#trip=代碼
  const m = (location.hash || "").match(/^#trip=([^&]+)/);
  if (m) {
    U.ls.set("jp27.trip", decodeURIComponent(m[1]).trim());
    history.replaceState(null, "", location.pathname + location.search + "#plan");
  }

  // 分頁列圖示
  const icons = { plan: ui.ICON.cal, money: ui.ICON.yen, flights: ui.ICON.plane };
  document.querySelectorAll(".tabbar [data-tab]").forEach((a) => {
    a.insertAdjacentHTML("afterbegin", icons[a.dataset.tab]);
  });

  document.getElementById("langBtn").addEventListener("click", () => {
    JP.i18n.set(JP.i18n.lang === "zh" ? "en" : "zh");
    ui.render();
  });
  document.getElementById("meBtn").addEventListener("click", () => ui.settings());
  document.getElementById("syncBtn").addEventListener("click", () => ui.settings());
  window.addEventListener("hashchange", () => { ui.closeSheet(); ui.render(); });

  // 旅程代碼（Firebase 模式才需要）
  let code = null;
  if (S.cloudConfigured()) {
    code = (C.tripCode || U.ls.get("jp27.trip", "") || "").trim();
    if (!code) code = await ui.joinScreen();
  }

  ui.renderHeader();
  try {
    await S.start(code);
  } catch (e) {
    document.getElementById("view").innerHTML =
      `<div class="boot-error"><b>${U.esc(t("sync.error"))}</b>${U.esc(e && (e.message || e))}</div>`;
    ui.renderHeader();
    return;
  }

  S.onChange(() => ui.render());
  ui.render();
  if (!ui.me()) ui.pickMe(true);

  // 過了午夜重畫（「今天」會變）
  let lastDay = U.today();
  setInterval(() => {
    if (U.today() !== lastDay && !document.body.classList.contains("sheet-open")) { lastDay = U.today(); ui.render(); }
  }, 60000);

  // 離線可開啟
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    navigator.serviceWorker.register("sw.js").catch((e) => console.warn("SW", e));
  }
})();
