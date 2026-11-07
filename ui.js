/* 介面外框：頂欄、分頁、底部彈出面板、提示、加入旅程、選擇身分 */
(function () {
  const JP = (window.JP = window.JP || {});
  const C = window.TRIP_CONFIG;
  const U = JP.u, t = JP.t, esc = U.esc;

  const ui = (JP.ui = {});
  JP.views = JP.views || {};

  /* ---------- 身分 ---------- */
  ui.me = () => {
    const id = U.ls.get("jp27.me", null);
    return C.people.some((p) => p.id === id) ? id : null;
  };
  ui.setMe = (id) => { U.ls.set("jp27.me", id); };

  /* ---------- 提示 ---------- */
  let toastTimer;
  ui.toast = function (msg, isError) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.className = "toast show" + (isError ? " error" : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.className = "toast"; }, isError ? 4200 : 1800);
  };

  /* ---------- 底部彈出面板 ---------- */
  let current = null;
  ui.sheet = function (opts) {
    if (current) current.close(true);
    const root = document.getElementById("sheetRoot");
    const wrap = document.createElement("div");
    wrap.className = "sheet-wrap";
    wrap.innerHTML = `
      <div class="sheet-backdrop" data-close></div>
      <section class="sheet" role="dialog" aria-modal="true" aria-label="${esc(opts.title || "")}">
        <div class="sheet-grip" aria-hidden="true"></div>
        <header class="sheet-head">
          <h2>${esc(opts.title || "")}</h2>
          ${opts.locked ? "" : `<button class="icon-btn" data-close aria-label="${esc(t("common.close"))}">${ICON.x}</button>`}
        </header>
        <div class="sheet-body">${opts.body || ""}</div>
        ${opts.footer ? `<footer class="sheet-foot">${opts.footer}</footer>` : ""}
      </section>`;
    root.appendChild(wrap);
    document.body.classList.add("sheet-open");
    requestAnimationFrame(() => wrap.classList.add("open"));

    const api = {
      el: wrap.querySelector(".sheet"),
      close(immediate) {
        if (api.closed) return;
        api.closed = true;
        if (current === api) current = null;
        document.removeEventListener("keydown", onKey);
        document.body.classList.remove("sheet-open");
        if (immediate) { wrap.remove(); }
        else { wrap.classList.add("closing"); wrap.classList.remove("open"); setTimeout(() => wrap.remove(), 220); }
        if (opts.onClose) opts.onClose();
      }
    };
    if (!opts.locked) {
      wrap.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => api.close()));
    }
    function onKey(e) { if (e.key === "Escape" && !opts.locked) api.close(); }
    document.addEventListener("keydown", onKey);
    current = api;
    if (opts.onMount) opts.onMount(api.el, api);
    return api;
  };
  ui.closeSheet = () => { if (current) current.close(); };

  /* 「再按一次確認刪除」 */
  ui.confirmButton = function (btn, fn) {
    let armed = false, timer;
    const label = btn.innerHTML;
    btn.addEventListener("click", () => {
      if (armed) { clearTimeout(timer); fn(); return; }
      armed = true;
      btn.classList.add("armed");
      btn.textContent = t("common.confirmDelete");
      timer = setTimeout(() => { armed = false; btn.classList.remove("armed"); btn.innerHTML = label; }, 3000);
    });
  };

  ui.copy = async function (text) {
    try { await navigator.clipboard.writeText(text); ui.toast(t("common.copied")); return true; }
    catch (e) { return false; }
  };

  /* 表單錯誤 */
  ui.formError = function (sheetEl, msg) {
    let box = sheetEl.querySelector(".form-error");
    if (!box) {
      box = document.createElement("p");
      box.className = "form-error";
      box.setAttribute("role", "alert");
      const foot = sheetEl.querySelector(".sheet-foot");
      foot.parentNode.insertBefore(box, foot);
    }
    box.textContent = msg;
  };

  /* ---------- 圖示 ---------- */
  const ICON = (ui.ICON = {
    x: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
    plus: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`,
    left: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>`,
    right: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>`,
    cal: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/><circle cx="8.5" cy="14.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="12" cy="14.5" r="1.1" fill="currentColor" stroke="none"/></svg>`,
    yen: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M8.8 7.5L12 12l3.2-4.5M12 12v5M9.3 12.5h5.4M9.3 15h5.4"/></svg>`,
    plane: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 13.5L4 11l1.2-1.6 7.3.9 4.6-4.8c.8-.8 2-.9 2.6-.3s.5 1.8-.3 2.6l-4.8 4.6.9 7.3L14 21l-2.5-6.5L8 17.6V20l-1.4 1-1.3-3.2L2 16.5l1-1.4h2.4z"/></svg>`,
    pin: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 1113 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/></svg>`,
    note: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h10l4 4v12H5z"/><path d="M8 11h8M8 15h6"/></svg>`,
    chevron: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`
  });

  /* ---------- 頂欄 ---------- */
  ui.renderHeader = function () {
    const S = JP.store;
    document.getElementById("brand").textContent = JP.loc(C.tripName);
    const st = S.mode === "local" ? "local" : S.status;
    const syncBtn = document.getElementById("syncBtn");
    syncBtn.className = "sync sync-" + st;
    syncBtn.innerHTML = `<span class="dot"></span><span class="sync-label">${esc(t("sync." + st))}</span>`;
    syncBtn.setAttribute("aria-label", t("sync." + st));
    document.getElementById("langBtn").textContent = t("lang.switch");
    const me = ui.me();
    document.getElementById("meBtn").innerHTML = me ? U.avatar(me, 34) : `<span class="avatar ghost" style="width:34px;height:34px">?</span>`;
    document.getElementById("meBtn").setAttribute("aria-label", t("settings.title"));
    document.querySelectorAll(".tabbar [data-tab]").forEach((b) => {
      b.querySelector(".tab-label").textContent = t("tab." + b.dataset.tab);
    });
  };

  /* ---------- 路由 ---------- */
  ui.route = function () {
    const h = (location.hash || "").replace(/^#/, "");
    if (h.startsWith("flights-")) return { tab: "flights", person: h.slice(8) };
    if (h === "money" || h === "flights" || h === "plan") return { tab: h };
    return { tab: "plan" };
  };

  ui.render = function () {
    ui.renderHeader();
    const r = ui.route();
    document.querySelectorAll(".tabbar [data-tab]").forEach((b) => {
      const on = b.dataset.tab === r.tab;
      b.classList.toggle("active", on);
      b.setAttribute("aria-current", on ? "page" : "false");
    });
    const view = document.getElementById("view");
    view.dataset.tab = r.tab;
    view.classList.remove("fill");
    const v = JP.views[r.tab];
    if (v) v.render(view, r);
  };

  /* ---------- 選擇身分 / 設定 ---------- */
  ui.pickMe = function (first) {
    const me = ui.me();
    const sh = ui.sheet({
      title: t("me.title"),
      locked: !!first,
      body: `<p class="muted">${esc(t("me.desc"))}</p>
        <div class="people-pick">
          ${C.people.map((p) => `<button class="person-btn ${p.id === me ? "on" : ""}" data-id="${p.id}">${U.avatar(p.id, 40)}<span>${esc(p.name)}</span></button>`).join("")}
        </div>`,
      onMount(el) {
        el.querySelectorAll(".person-btn").forEach((b) => b.addEventListener("click", () => {
          ui.setMe(b.dataset.id);
          JP.app.moneyViewer = b.dataset.id;
          sh.close();
          ui.render();
        }));
      }
    });
  };

  ui.settings = function () {
    const S = JP.store;
    const me = ui.me();
    const link = S.code ? location.origin + location.pathname + "#trip=" + S.code : "";
    const sh = ui.sheet({
      title: t("settings.title"),
      body: `
        <h3 class="field-label">${esc(t("me.switch"))}</h3>
        <div class="people-pick compact">
          ${C.people.map((p) => `<button class="person-btn ${p.id === me ? "on" : ""}" data-id="${p.id}">${U.avatar(p.id, 30)}<span>${esc(p.name)}</span></button>`).join("")}
        </div>
        <h3 class="field-label">${esc(t("settings.lang"))}</h3>
        <div class="seg" role="group">
          <button class="${JP.i18n.lang === "zh" ? "on" : ""}" data-lang="zh">中文</button>
          <button class="${JP.i18n.lang === "en" ? "on" : ""}" data-lang="en">English</button>
        </div>
        <p class="status-line sync-${S.mode === "local" ? "local" : S.status}"><span class="dot"></span>${esc(t("sync." + (S.mode === "local" ? "local" : S.status)))}</p>
        ${S.mode === "local" ? `<p class="local-note">${esc(t("local.banner"))}</p>` : ""}
        ${S.mode === "cloud" ? `
          <h3 class="field-label">${esc(t("settings.tripCode"))}</h3>
          <p class="code-box">${esc(S.code)}</p>
          <h3 class="field-label">${esc(t("settings.share"))}</h3>
          <div class="copy-row"><input readonly value="${esc(link)}" aria-label="${esc(t("join.link"))}"><button class="btn small" data-copy>${esc(t("common.copy"))}</button></div>
          <p class="muted small">${esc(t("join.keep"))}</p>
          ${C.tripCode ? "" : `<button class="btn ghost danger-text wide" data-leave>${esc(t("settings.leave"))}</button>`}
        ` : ""}
      `,
      onMount(el) {
        el.querySelectorAll(".person-btn").forEach((b) => b.addEventListener("click", () => {
          ui.setMe(b.dataset.id); JP.app.moneyViewer = b.dataset.id;
          el.querySelectorAll(".person-btn").forEach((x) => x.classList.toggle("on", x === b));
          ui.render();
        }));
        el.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", () => {
          JP.i18n.set(b.dataset.lang); sh.close(); ui.render();
        }));
        const cp = el.querySelector("[data-copy]");
        if (cp) cp.addEventListener("click", async () => {
          const inp = el.querySelector(".copy-row input");
          if (!(await ui.copy(inp.value))) { inp.select(); }
        });
        const lv = el.querySelector("[data-leave]");
        if (lv) ui.confirmButton(lv, () => { U.ls.del("jp27.trip"); location.hash = ""; location.reload(); });
      }
    });
  };

  /* ---------- 加入旅程（Firebase 模式） ---------- */
  function genCode() {
    const abc = "abcdefghjkmnpqrstuvwxyz23456789";
    const arr = new Uint32Array(10);
    (window.crypto || window.msCrypto).getRandomValues(arr);
    return "jp27-" + Array.from(arr, (n) => abc[n % abc.length]).join("");
  }

  ui.joinScreen = function () {
    return new Promise((resolve) => {
      const root = document.getElementById("joinRoot");
      root.hidden = false;
      document.body.classList.add("joining");
      const paint = (created) => {
        const link = created ? location.origin + location.pathname + "#trip=" + created : "";
        root.innerHTML = `
          <div class="join-card">
            <div class="join-route" aria-hidden="true">
              ${C.stays.map((s) => `<span class="station-dot" style="--c:${s.color}">${esc(s.code)}</span>`).join('<span class="join-line"></span>')}
            </div>
            <h1>${esc(JP.loc(C.tripName))}</h1>
            ${created ? `
              <p>${esc(t("join.created"))}</p>
              <p class="code-box big">${esc(created)}</p>
              <div class="copy-row"><input readonly value="${esc(link)}" aria-label="${esc(t("join.link"))}"><button class="btn small" data-copy>${esc(t("join.copyLink"))}</button></div>
              <p class="muted small">${esc(t("join.keep"))}</p>
              <button class="btn primary wide" data-enter>${esc(t("join.enter"))}</button>
            ` : `
              <p>${esc(t("join.desc"))}</p>
              <form class="join-form" novalidate>
                <label class="field-label" for="joinCode">${esc(t("join.code"))}</label>
                <input id="joinCode" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="jp27-xxxxxxxxxx">
                <p class="form-error" hidden></p>
                <button class="btn primary wide" type="submit">${esc(t("join.go"))}</button>
              </form>
              <p class="join-or">${esc(t("join.or"))}</p>
              <button class="btn ghost wide" data-create>${esc(t("join.create"))}</button>
            `}
            <button class="lang-mini" data-lang>${esc(t("lang.switch"))}</button>
          </div>`;
        const done = (code) => {
          U.ls.set("jp27.trip", code);
          root.hidden = true; root.innerHTML = "";
          document.body.classList.remove("joining");
          resolve(code);
        };
        root.querySelector("[data-lang]").addEventListener("click", () => {
          JP.i18n.set(JP.i18n.lang === "zh" ? "en" : "zh"); paint(created);
        });
        if (created) {
          root.querySelector("[data-copy]").addEventListener("click", async () => {
            const inp = root.querySelector(".copy-row input");
            if (!(await ui.copy(inp.value))) inp.select();
          });
          root.querySelector("[data-enter]").addEventListener("click", () => done(created));
        } else {
          root.querySelector(".join-form").addEventListener("submit", (e) => {
            e.preventDefault();
            const code = root.querySelector("#joinCode").value.trim();
            if (code.length < 10) {
              const er = root.querySelector(".form-error"); er.hidden = false; er.textContent = t("join.short"); return;
            }
            done(code);
          });
          root.querySelector("[data-create]").addEventListener("click", () => paint(genCode()));
        }
      };
      paint(null);
    });
  };
})();
