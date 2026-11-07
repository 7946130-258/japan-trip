/* 共用工具：日期、金額、HTML 跳脫 */
(function () {
  const JP = (window.JP = window.JP || {});
  const C = window.TRIP_CONFIG;

  const U = (JP.u = {});

  U.esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  };

  U.uid = function () {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  };

  U.ls = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };

  /* ---------- 日期（全部用 YYYY-MM-DD 字串，避免時區問題） ---------- */
  const pad = (n) => String(n).padStart(2, "0");
  U.pad = pad;
  U.iso = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
  U.parse = (s) => { const [y, m, d] = s.split("-").map(Number); return { y, m, d }; };
  U.toUTC = (s) => { const p = U.parse(s); return Date.UTC(p.y, p.m - 1, p.d); };
  U.fromUTC = (ms) => { const d = new Date(ms); return U.iso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()); };
  U.addDays = (s, n) => U.fromUTC(U.toUTC(s) + n * 86400000);
  U.diffDays = (a, b) => Math.round((U.toUTC(b) - U.toUTC(a)) / 86400000);
  U.dow = (s) => new Date(U.toUTC(s)).getUTCDay();
  U.today = () => { const d = new Date(); return U.iso(d.getFullYear(), d.getMonth() + 1, d.getDate()); };
  U.nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
  U.daysInMonth = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
  U.startOfWeek = (s) => U.addDays(s, -U.dow(s)); // 週日開始
  U.addMonths = (s, n) => {
    const p = U.parse(s);
    let m = p.m - 1 + n, y = p.y + Math.floor(m / 12);
    m = ((m % 12) + 12) % 12;
    return U.iso(y, m + 1, Math.min(p.d, U.daysInMonth(y, m + 1)));
  };
  U.min = (t) => { if (!t) return null; const [h, m] = t.split(":").map(Number); return h * 60 + (m || 0); };
  U.hm = (mins) => `${pad(Math.floor(mins / 60) % 24)}:${pad(mins % 60)}`;

  const WD_ZH = ["日", "一", "二", "三", "四", "五", "六"];
  const WD_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MON_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const MON_EN_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  U.wd = (i) => (JP.i18n.lang === "zh" ? WD_ZH[i] : WD_EN[i]);
  U.wdShort = (i) => (JP.i18n.lang === "zh" ? WD_ZH[i] : WD_EN[i].slice(0, 2));

  U.fmtDate = function (s, withWd = true) {
    if (!s) return "";
    const p = U.parse(s), w = U.dow(s);
    if (JP.i18n.lang === "zh") return `${p.m}月${p.d}日${withWd ? `（${WD_ZH[w]}）` : ""}`;
    return `${withWd ? WD_EN[w] + " " : ""}${p.d} ${MON_EN[p.m - 1]}`;
  };
  U.fmtShort = (s) => { const p = U.parse(s); return `${p.m}/${p.d}`; };
  U.fmtMonth = function (s) {
    const p = U.parse(s);
    return JP.i18n.lang === "zh" ? `${p.y}年${p.m}月` : `${MON_EN_FULL[p.m - 1]} ${p.y}`;
  };
  U.fmtRange = function (a, b) {
    const pa = U.parse(a), pb = U.parse(b);
    if (JP.i18n.lang === "zh") return pa.m === pb.m ? `${pa.m}月${pa.d}日 – ${pb.d}日` : `${pa.m}月${pa.d}日 – ${pb.m}月${pb.d}日`;
    return pa.m === pb.m ? `${pa.d} – ${pb.d} ${MON_EN[pb.m - 1]}` : `${pa.d} ${MON_EN[pa.m - 1]} – ${pb.d} ${MON_EN[pb.m - 1]}`;
  };

  /* ---------- 金額（以最小單位整數儲存：日圓 = 1 円，新幣/令吉 = 1 分） ---------- */
  const CUR = {
    JPY: { dec: 0, sym: "¥" },
    SGD: { dec: 2, sym: "S$" },
    MYR: { dec: 2, sym: "RM" }
  };
  U.cur = (c) => CUR[c] || { dec: 2, sym: c + " " };
  U.currencies = () => C.currencies.filter((c) => CUR[c]);
  U.toMinor = function (str, c) {
    if (str === "" || str == null) return 0;
    const n = parseFloat(String(str).replace(/[^0-9.\-]/g, ""));
    if (!isFinite(n)) return NaN;
    return Math.round(n * Math.pow(10, U.cur(c).dec));
  };
  U.fromMinor = (n, c) => n / Math.pow(10, U.cur(c).dec);
  U.money = function (minor, c, opts = {}) {
    const info = U.cur(c);
    const v = Math.abs(minor) / Math.pow(10, info.dec);
    const s = v.toLocaleString("en-US", { minimumFractionDigits: info.dec, maximumFractionDigits: info.dec });
    const sign = minor < 0 && !opts.abs ? "−" : "";
    return `${sign}${info.sym}${s}`;
  };
  U.inputVal = (minor, c) => (minor ? String(U.fromMinor(minor, c)) : "");

  /* ---------- 人 ---------- */
  U.person = (id) => C.people.find((p) => p.id === id) || { id, name: id || "?", color: "#868E96" };
  U.pname = (id) => U.person(id).name;
  U.initials = function (name) {
    const parts = String(name).trim().split(/\s+/);
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return String(name).slice(0, 2).toUpperCase();
  };
  U.avatar = function (id, size = 32) {
    const p = U.person(id);
    const cls = "av-" + String(p.id).replace(/[^a-z0-9_-]/gi, "");
    return `<span class="avatar ${cls}" style="--av:${p.color};width:${size}px;height:${size}px;font-size:${Math.round(size * 0.38)}px" aria-hidden="true">${U.esc(U.initials(p.name))}</span>`;
  };

  /* ---------- 城市 ---------- */
  U.staysOn = (date) => C.stays.filter((s) => date >= s.from && date <= s.to);
  U.stayColor = function (date) {
    const s = U.staysOn(date);
    return s.length ? s[s.length - 1].color : null;
  };

  U.mapsUrl = (q) => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q);
})();
