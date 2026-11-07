/* 行程頁：路線圖 + 月 / 週 / 日 行事曆 */
(function () {
  const JP = (window.JP = window.JP || {});
  const C = window.TRIP_CONFIG;
  const U = JP.u, t = JP.t, esc = U.esc, ui = JP.ui;
  const S = JP.store;

  const CATS = [
    { id: "sight", emoji: "⛩️", color: "#2B8A3E" },
    { id: "food", emoji: "🍜", color: "#E8590C" },
    { id: "transport", emoji: "🚄", color: "#495057" },
    { id: "shopping", emoji: "🛍️", color: "#D6336C" },
    { id: "stay", emoji: "🏨", color: "#5F3DC4" },
    { id: "other", emoji: "📌", color: "#1971C2" }
  ];
  const cat = (id) => CATS.find((c) => c.id === id) || CATS[CATS.length - 1];
  const FLIGHT_COLOR = "#2C3A4B";

  let today = U.today();
  const initialDate = today >= C.tripStart && today <= C.tripEnd ? today : C.tripStart;
  const cal = (JP.app = JP.app || {}).cal = {
    mode: U.ls.get("jp27.calMode", "month"),
    date: initialDate
  };
  let scrollMemo = { key: null, top: 0 };

  /* ---------- 資料整理 ---------- */
  function itemsFor(date) {
    const out = [];
    S.data.events.forEach((e) => {
      if (e.date !== date) return;
      const s = U.min(e.start), en = U.min(e.end);
      const overnight = !e.allDay && s != null && en != null && en <= s;
      out.push({
        kind: "event", id: e.id, title: e.title, allDay: !!e.allDay,
        start: e.allDay ? 0 : s, end: e.allDay ? 0 : (overnight ? 1440 : en),
        startLabel: e.start, endLabel: e.end, overnight,
        color: cat(e.cat).color, emoji: cat(e.cat).emoji, loc: e.location, notes: e.notes
      });
    });
    S.data.flights.forEach((f) => {
      const dep = U.min(f.depTime), arr = U.min(f.arrTime);
      const arrDate = f.arrDate || f.date;
      const base = {
        kind: "flight", id: f.id, allDay: false, color: FLIGHT_COLOR, emoji: "✈️",
        title: `${f.fromCode || "?"} → ${f.toCode || "?"}`,
        loc: [f.airline, f.flightNo].filter(Boolean).join(" "),
        notes: passengersNote(f)
      };
      if (f.date === date) {
        const sameDay = arrDate === f.date;
        const st = dep == null ? 0 : dep;
        const en = sameDay && arr != null && arr > st ? arr : (sameDay ? Math.min(st + 60, 1440) : 1440);
        out.push(Object.assign({}, base, { start: st, end: en, startLabel: f.depTime, endLabel: sameDay ? f.arrTime : "", allDay: dep == null }));
      } else if (arrDate === date && arrDate > f.date) {
        out.push(Object.assign({}, base, { start: 0, end: arr || 60, startLabel: "", endLabel: f.arrTime }));
      }
    });
    out.sort((a, b) => (b.allDay - a.allDay) || (a.start - b.start) || (a.end - b.end));
    return out;
  }

  function passengersNote(f) {
    const ps = f.passengers || [];
    if (ps.length === C.people.length) return "";
    return ps.map(U.pname).join(", ");
  }

  function dayNote(date) { return S.data.daynotes.find((d) => d.id === date); }

  function cityBadges(date) {
    const st = U.staysOn(date);
    if (!st.length) return "";
    if (st.length > 1) {
      return `<span class="city-move">${st.map((s) => `<span class="city-badge" style="--c:${s.color}">${esc(s.code)}</span>`).join("")}<span class="city-move-text">${esc(t("plan.travelDay", { a: JP.loc(st[0].name), b: JP.loc(st[st.length - 1].name) }))}</span></span>`;
    }
    return `<span class="city-badge with-name" style="--c:${st[0].color}"><b>${esc(st[0].code)}</b>${esc(JP.loc(st[0].name))}</span>`;
  }

  /* 月曆格子裡的路線色帶：左半 / 右半 */
  function railFor(date) {
    const st = U.staysOn(date);
    if (!st.length) return null;
    let l = st[0].color, r = st[st.length - 1].color;
    if (date === C.tripStart) l = "transparent";
    if (date === C.tripEnd) r = "transparent";
    return { l, r };
  }

  /* ---------- 路線圖（頂部） ---------- */
  function routeCard() {
    let head;
    const n = U.diffDays(today, C.tripStart);
    const total = U.diffDays(C.tripStart, C.tripEnd) + 1;
    if (n > 0) head = t("plan.countdown", { n });
    else if (n === 0) head = t("plan.today");
    else if (today <= C.tripEnd) head = t("plan.dayN", { n: U.diffDays(C.tripStart, today) + 1, total });
    else head = t("plan.over");

    const d = cal.date;
    const stops = [];
    stops.push({ kind: "home", code: C.home.code, name: JP.loc(C.home.name), date: U.fmtShort(C.tripStart), go: C.tripStart, l: "none", r: "air", active: false });
    C.stays.forEach((s, i) => {
      stops.push({
        kind: "stay", code: s.code, name: JP.loc(s.name), color: s.color,
        date: `${U.fmtShort(s.from)}–${U.parse(s.to).d}`, go: s.from,
        l: i === 0 ? "air" : s.color, r: i === C.stays.length - 1 ? "air" : s.color,
        active: d >= s.from && d < s.to
      });
    });
    stops.push({ kind: "home", code: C.home.code, name: JP.loc(C.home.name), date: U.fmtShort(C.tripEnd), go: C.tripEnd, l: "air", r: "none", active: d >= C.tripEnd });

    return `
      <section class="route-card" aria-label="${esc(JP.loc(C.tripName))}">
        <div class="route-head">
          <span class="route-count">${esc(head)}</span>
          <span class="route-dates">${esc(U.fmtRange(C.tripStart, C.tripEnd))}</span>
        </div>
        <ol class="route">
          ${stops.map((s) => `
            <li class="stop ${s.kind} ${s.active ? "active" : ""}" style="--c:${s.color || FLIGHT_COLOR};--lc:${s.l.startsWith("#") ? s.l : "transparent"};--rc:${s.r.startsWith("#") ? s.r : "transparent"}" data-l="${s.l === "air" ? "air" : ""}" data-r="${s.r === "air" ? "air" : ""}">
              <button class="stop-btn" data-go="${s.go}" aria-label="${esc(s.name + " " + s.date)}">
                <span class="stop-mark">${s.kind === "home" ? "✈" : esc(s.code)}</span>
                <span class="stop-name">${esc(s.name)}</span>
                <span class="stop-date">${esc(s.date)}</span>
              </button>
            </li>`).join("")}
        </ol>
      </section>`;
  }

  /* ---------- 月視圖 ---------- */
  function monthView() {
    const p = U.parse(cal.date);
    const first = U.iso(p.y, p.m, 1);
    const start = U.startOfWeek(first);
    const dim = U.daysInMonth(p.y, p.m);
    const rows = Math.ceil((U.dow(first) + dim) / 7);
    let cells = "";
    for (let i = 0; i < rows * 7; i++) {
      const d = U.addDays(start, i);
      const dp = U.parse(d);
      const items = itemsFor(d);
      const rail = railFor(d);
      const dots = items.slice(0, 3).map((it) => `<i style="--c:${it.color}"></i>`).join("");
      const more = items.length > 3 ? `<em>+${items.length - 3}</em>` : "";
      cells += `
        <button class="mcell ${dp.m !== p.m ? "out" : ""} ${d === today ? "today" : ""} ${d === cal.date ? "sel" : ""}" data-date="${d}" aria-label="${esc(U.fmtDate(d))}${items.length ? ", " + items.length : ""}">
          <span class="dnum">${dp.d}</span>
          ${rail ? `<span class="rail" style="--l:${rail.l};--r:${rail.r}"></span>` : ""}
          <span class="dots">${dots}${more}</span>
        </button>`;
    }
    return `
      <div class="month">
        <div class="wd-row">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<span class="${i === 0 || i === 6 ? "we" : ""}">${esc(U.wdShort(i))}</span>`).join("")}</div>
        <div class="mgrid">${cells}</div>
      </div>
      ${agenda(cal.date)}`;
  }

  function agenda(date) {
    const items = itemsFor(date);
    const note = dayNote(date);
    return `
      <section class="agenda">
        <div class="agenda-head">
          <div>
            <h3>${esc(U.fmtDate(date))}</h3>
            <div class="agenda-city">${cityBadges(date)}</div>
          </div>
          <button class="btn small ghost" data-mode-to="day">${esc(t("plan.openDay"))}</button>
        </div>
        ${items.length ? `<ul class="ag-list">${items.map(agItem).join("")}</ul>` : `<p class="empty">${esc(t("plan.empty"))}</p>`}
        ${dayNoteBlock(date, note)}
        <button class="btn primary wide add-ev" data-add="${date}">${ui.ICON.plus}<span>${esc(t("plan.add"))}</span></button>
      </section>`;
  }

  function agItem(it) {
    const time = it.allDay ? `<span class="ag-time all">${esc(t("plan.allDay"))}</span>`
      : `<span class="ag-time"><b>${esc(it.startLabel || "")}</b><span>${esc(it.endLabel || "")}</span></span>`;
    return `
      <li>
        <button class="ag-item ${it.kind}" data-${it.kind === "flight" ? "flight" : "ev"}="${esc(it.id)}" style="--c:${it.color}">
          ${time}
          <span class="ag-main">
            <span class="ag-title"><span class="emo" aria-hidden="true">${it.emoji}</span>${esc(it.title)}${it.overnight ? ` <small>${esc(t("ev.overnight"))}</small>` : ""}</span>
            ${it.loc ? `<span class="ag-sub">${it.kind === "event" ? ui.ICON.pin : ""}${esc(it.loc)}</span>` : ""}
            ${it.notes ? `<span class="ag-note">${esc(it.notes)}</span>` : ""}
          </span>
        </button>
      </li>`;
  }

  function dayNoteBlock(date, note) {
    const has = note && note.text;
    return `
      <button class="daynote ${has ? "has" : ""}" data-daynote="${date}">
        <span class="daynote-label">${ui.ICON.note}${esc(t("plan.dayNote"))}</span>
        ${has ? `<span class="daynote-text">${esc(note.text)}</span>` : `<span class="daynote-ph">${esc(t("plan.dayNotePh"))}</span>`}
      </button>`;
  }

  /* ---------- 時間軸（週 / 日共用） ---------- */
  function layoutLanes(items) {
    const timed = items.filter((i) => !i.allDay).map((i) => Object.assign({}, i));
    timed.sort((a, b) => a.start - b.start || b.end - a.end);
    let cluster = [], laneEnds = [], clusterEnd = -1;
    const flush = () => { const n = laneEnds.length; cluster.forEach((c) => (c.lanes = n)); cluster = []; laneEnds = []; };
    timed.forEach((it) => {
      if (it.start >= clusterEnd && cluster.length) flush();
      let lane = laneEnds.findIndex((e) => e <= it.start);
      if (lane === -1) { lane = laneEnds.length; laneEnds.push(0); }
      laneEnds[lane] = Math.max(it.end, it.start + 20);
      it.lane = lane;
      cluster.push(it);
      clusterEnd = Math.max(clusterEnd, laneEnds[lane]);
    });
    if (cluster.length) flush();
    return timed;
  }

  function timeGrid(days, H, compact) {
    const gutter = Array.from({ length: 24 }, (_, h) => `<span class="tg-hour" style="top:${h * H}px">${h ? U.pad(h) + ":00" : ""}</span>`).join("");
    const cols = days.map((d) => {
      const evs = layoutLanes(itemsFor(d)).map((it) => {
        const top = (it.start / 60) * H;
        const h = Math.max(compact ? 18 : 26, ((it.end - it.start) / 60) * H - 2);
        const w = 100 / it.lanes;
        const small = h < 38;
        return `
          <button class="tg-ev ${it.kind} ${small ? "short" : ""}" data-${it.kind === "flight" ? "flight" : "ev"}="${esc(it.id)}"
            style="--c:${it.color};top:${top}px;height:${h}px;left:calc(${it.lane * w}% + 1px);width:calc(${w}% - 2px)">
            <span class="tg-title">${compact ? "" : `<span class="emo">${it.emoji}</span>`}${esc(it.title)}</span>
            ${!compact && !small ? `<span class="tg-time">${esc(it.startLabel || "")}${it.endLabel ? "–" + esc(it.endLabel) : ""}</span>` : ""}
            ${!compact && h > 70 && it.loc ? `<span class="tg-sub">${esc(it.loc)}</span>` : ""}
            ${!compact && h > 92 && it.notes ? `<span class="tg-sub note">${esc(it.notes)}</span>` : ""}
          </button>`;
      }).join("");
      const now = d === today ? `<span class="tg-now" style="top:${(U.nowMin() / 60) * H}px"></span>` : "";
      return `<div class="tg-col" data-date="${d}" style="height:${24 * H}px">${evs}${now}</div>`;
    }).join("");
    return `
      <div class="tg-scroll" style="--H:${H}px">
        <div class="tg" style="height:${24 * H}px">
          <div class="tg-gutter">${gutter}</div>
          <div class="tg-cols">${cols}</div>
        </div>
      </div>`;
  }

  function allDayRow(days, withLabel) {
    const any = days.some((d) => itemsFor(d).some((i) => i.allDay));
    if (!any) return "";
    return `<div class="allday-row">
      <span class="allday-label">${withLabel ? esc(t("plan.allDay")) : ""}</span>
      ${days.map((d) => `<div class="allday-cell">${itemsFor(d).filter((i) => i.allDay).map((it) =>
        `<button class="allday-ev" data-${it.kind === "flight" ? "flight" : "ev"}="${esc(it.id)}" style="--c:${it.color}">${esc(it.title)}</button>`).join("")}</div>`).join("")}
    </div>`;
  }

  function weekView() {
    const start = U.startOfWeek(cal.date);
    const days = Array.from({ length: 7 }, (_, i) => U.addDays(start, i));
    return `
      <div class="week">
        <div class="wk-head">
          <span class="wk-gutter"></span>
          ${days.map((d) => {
            const rail = railFor(d);
            return `<button class="wk-day ${d === today ? "today" : ""} ${d === cal.date ? "sel" : ""}" data-day="${d}">
              <span class="wk-wd">${esc(U.wdShort(U.dow(d)))}</span>
              <span class="wk-num">${U.parse(d).d}</span>
              <span class="rail" style="--l:${rail ? rail.l : "transparent"};--r:${rail ? rail.r : "transparent"}"></span>
            </button>`;
          }).join("")}
        </div>
        ${allDayRow(days, false)}
        ${timeGrid(days, 44, true)}
      </div>`;
  }

  function dayView() {
    const d = cal.date;
    const note = dayNote(d);
    return `
      <div class="dayv">
        <div class="day-top">
          <div class="agenda-city">${cityBadges(d)}</div>
          ${dayNoteBlock(d, note)}
        </div>
        ${allDayRow([d], true)}
        ${timeGrid([d], 60, false)}
        <p class="hint">${esc(t("plan.tapToAdd"))}</p>
      </div>`;
  }

  /* ---------- 主畫面 ---------- */
  function title() {
    if (cal.mode === "month") return U.fmtMonth(cal.date);
    if (cal.mode === "week") { const s = U.startOfWeek(cal.date); return U.fmtRange(s, U.addDays(s, 6)); }
    return U.fmtDate(cal.date);
  }

  function step(dir) {
    if (cal.mode === "month") cal.date = U.addMonths(cal.date, dir);
    else if (cal.mode === "week") cal.date = U.addDays(cal.date, 7 * dir);
    else cal.date = U.addDays(cal.date, dir);
    JP.views.plan.render(document.getElementById("view"));
  }

  JP.views.plan = {
    render(el) {
      today = U.today();
      const body = cal.mode === "week" ? weekView() : cal.mode === "day" ? dayView() : monthView();
      el.classList.toggle("fill", cal.mode !== "month");
      el.innerHTML = `
        <div class="plan mode-${cal.mode}">
          ${routeCard()}
          <div class="cal-bar">
            <div class="cal-nav">
              <button class="icon-btn" data-step="-1" aria-label="prev">${ui.ICON.left}</button>
              <h2 class="cal-title">${esc(title())}</h2>
              <button class="icon-btn" data-step="1" aria-label="next">${ui.ICON.right}</button>
            </div>
            <div class="seg" role="group">
              ${["month", "week", "day"].map((m) => `<button class="${cal.mode === m ? "on" : ""}" data-mode="${m}">${esc(t("plan." + m))}</button>`).join("")}
            </div>
          </div>
          <div class="cal-body">${body}</div>
        </div>
        <button class="fab" data-add="${cal.date}" aria-label="${esc(t("plan.add"))}">${ui.ICON.plus}</button>`;
      bind(el);
      restoreScroll(el);
    }
  };

  function restoreScroll(el) {
    const sc = el.querySelector(".tg-scroll");
    if (!sc) return;
    const key = cal.mode + ":" + (cal.mode === "week" ? U.startOfWeek(cal.date) : cal.date);
    if (scrollMemo.key === key) { sc.scrollTop = scrollMemo.top; }
    else {
      const days = cal.mode === "week" ? Array.from({ length: 7 }, (_, i) => U.addDays(U.startOfWeek(cal.date), i)) : [cal.date];
      const starts = days.flatMap((d) => itemsFor(d).filter((i) => !i.allDay).map((i) => i.start));
      const H = cal.mode === "week" ? 44 : 60;
      const first = cal.mode === "week" ? 7 * 60 : (starts.length ? Math.min(...starts, 8 * 60) : 8 * 60);
      sc.scrollTop = Math.max(0, (first / 60) * H - H * 0.5);
      scrollMemo = { key, top: sc.scrollTop };
    }
    sc.addEventListener("scroll", () => { scrollMemo = { key, top: sc.scrollTop }; }, { passive: true });
  }

  function bind(el) {
    el.querySelectorAll("[data-step]").forEach((b) => b.addEventListener("click", () => step(+b.dataset.step)));
    el.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => {
      cal.mode = b.dataset.mode; U.ls.set("jp27.calMode", cal.mode); JP.views.plan.render(el);
    }));
    el.querySelectorAll("[data-mode-to]").forEach((b) => b.addEventListener("click", () => {
      cal.mode = b.dataset.modeTo; U.ls.set("jp27.calMode", cal.mode); JP.views.plan.render(el); window.scrollTo(0, 0);
    }));
    el.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => {
      cal.date = b.dataset.go; JP.views.plan.render(el);
    }));
    el.querySelectorAll(".mcell").forEach((b) => b.addEventListener("click", () => {
      cal.date = b.dataset.date; JP.views.plan.render(el);
    }));
    el.querySelectorAll("[data-day]").forEach((b) => b.addEventListener("click", () => {
      cal.date = b.dataset.day; cal.mode = "day"; U.ls.set("jp27.calMode", "day"); JP.views.plan.render(el);
    }));
    el.querySelectorAll("[data-add]").forEach((b) => b.addEventListener("click", () => openEventForm(null, { date: b.dataset.add })));
    el.querySelectorAll("[data-ev]").forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); openEvent(b.dataset.ev); }));
    el.querySelectorAll("[data-flight]").forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); openFlight(b.dataset.flight); }));
    el.querySelectorAll("[data-daynote]").forEach((b) => b.addEventListener("click", () => openDayNote(b.dataset.daynote)));

    // 點空白時段新增
    el.querySelectorAll(".tg-col").forEach((col) => col.addEventListener("click", (e) => {
      if (e.target.closest(".tg-ev")) return;
      const H = cal.mode === "week" ? 44 : 60;
      const y = e.clientY - col.getBoundingClientRect().top;
      const mins = Math.max(0, Math.min(23 * 60 + 30, Math.floor((y / H) * 2) * 30));
      openEventForm(null, { date: col.dataset.date, start: U.hm(mins), end: U.hm(Math.min(mins + 60, 23 * 60 + 59)) });
    }));

    // 左右滑動切換
    const body = el.querySelector(".cal-body");
    let sx = 0, sy = 0, st = 0;
    body.addEventListener("touchstart", (e) => { const p = e.touches[0]; sx = p.clientX; sy = p.clientY; st = Date.now(); }, { passive: true });
    body.addEventListener("touchend", (e) => {
      const p = e.changedTouches[0];
      const dx = p.clientX - sx, dy = p.clientY - sy;
      if (Math.abs(dx) > 70 && Math.abs(dy) < 45 && Date.now() - st < 600) step(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  /* ---------- 行程表單 ---------- */
  function openEventForm(id, preset) {
    const ev = id ? S.get("events", id) : null;
    const d = Object.assign({ title: "", cat: "sight", date: cal.date, allDay: false, start: "09:00", end: "10:00", location: "", notes: "" }, preset || {}, ev || {});
    const sh = ui.sheet({
      title: t(ev ? "ev.edit" : "ev.new"),
      body: `
        <form class="form" novalidate>
          <label class="field"><span class="field-label">${esc(t("ev.title"))}</span>
            <input name="title" value="${esc(d.title)}" placeholder="${esc(t("ev.titlePh"))}" autocomplete="off"></label>
          <div class="field"><span class="field-label">${esc(t("ev.category"))}</span>
            <div class="chips">${CATS.map((c) => `<button type="button" class="chip ${d.cat === c.id ? "on" : ""}" data-cat="${c.id}" style="--c:${c.color}"><span aria-hidden="true">${c.emoji}</span>${esc(t("cat." + c.id))}</button>`).join("")}</div>
          </div>
          <div class="row2">
            <label class="field"><span class="field-label">${esc(t("common.date"))}</span>
              <input type="date" name="date" value="${esc(d.date)}"></label>
            <label class="field toggle-field"><span class="field-label">${esc(t("ev.allDay"))}</span>
              <span class="switch"><input type="checkbox" name="allDay" ${d.allDay ? "checked" : ""}><i></i></span></label>
          </div>
          <div class="row2 times" ${d.allDay ? "hidden" : ""}>
            <label class="field"><span class="field-label">${esc(t("ev.start"))}</span><input type="time" name="start" value="${esc(d.start || "")}"></label>
            <label class="field"><span class="field-label">${esc(t("ev.end"))}</span><input type="time" name="end" value="${esc(d.end || "")}"></label>
          </div>
          <label class="field"><span class="field-label">${esc(t("ev.location"))} <small>${esc(t("common.optional"))}</small></span>
            <input name="location" value="${esc(d.location || "")}" placeholder="${esc(t("ev.locationPh"))}" autocomplete="off"></label>
          <label class="field"><span class="field-label">${esc(t("ev.notes"))} <small>${esc(t("common.optional"))}</small></span>
            <textarea name="notes" rows="4" placeholder="${esc(t("ev.notesPh"))}">${esc(d.notes || "")}</textarea></label>
        </form>`,
      footer: `<button class="btn ghost" data-close>${esc(t("common.cancel"))}</button><button class="btn primary" data-save>${esc(t("common.save"))}</button>`,
      onMount(el, api) {
        let chosen = d.cat;
        el.querySelector("[data-close]").addEventListener("click", () => api.close());
        el.querySelectorAll("[data-cat]").forEach((b) => b.addEventListener("click", () => {
          chosen = b.dataset.cat;
          el.querySelectorAll("[data-cat]").forEach((x) => x.classList.toggle("on", x === b));
        }));
        const f = el.querySelector("form");
        f.allDay.addEventListener("change", () => { el.querySelector(".times").hidden = f.allDay.checked; });
        const save = () => {
          const data = {
            title: f.title.value.trim(), cat: chosen, date: f.date.value, allDay: f.allDay.checked,
            start: f.allDay.checked ? "" : f.start.value, end: f.allDay.checked ? "" : f.end.value,
            location: f.location.value.trim(), notes: f.notes.value.trim()
          };
          if (!data.title) return ui.formError(el, t("ev.needTitle"));
          if (!data.date) return ui.formError(el, t("common.date"));
          if (!data.allDay && (!data.start || !data.end)) return ui.formError(el, t("ev.needTime"));
          const me = ui.me();
          data.updatedAt = Date.now(); data.updatedBy = me;
          data.createdBy = ev ? (ev.createdBy || me) : me;
          data.createdAt = ev ? (ev.createdAt || Date.now()) : Date.now();
          S.put("events", ev ? ev.id : U.uid(), data);
          cal.date = data.date;
          api.close();
          ui.toast(t("common.saved"));
        };
        el.querySelector("[data-save]").addEventListener("click", save);
        f.addEventListener("submit", (e) => { e.preventDefault(); save(); });
        if (!ev) setTimeout(() => f.title.focus({ preventScroll: true }), 250);
      }
    });
  }

  function openEvent(id) {
    const ev = S.get("events", id);
    if (!ev) return;
    const c = cat(ev.cat);
    const s = U.min(ev.start), e = U.min(ev.end);
    const overnight = !ev.allDay && s != null && e != null && e <= s;
    ui.sheet({
      title: ev.title,
      body: `
        <div class="detail">
          <p class="detail-cat" style="--c:${c.color}"><span aria-hidden="true">${c.emoji}</span>${esc(t("cat." + c.id))}</p>
          <p class="detail-when"><b>${esc(U.fmtDate(ev.date))}</b>
            <span>${ev.allDay ? esc(t("plan.allDay")) : `${esc(ev.start)} – ${esc(ev.end)}${overnight ? " " + esc(t("ev.overnight")) : ""}`}</span></p>
          ${ev.location ? `<p class="detail-loc">${ui.ICON.pin}<span>${esc(ev.location)}</span></p>
            <a class="btn ghost small" href="${esc(U.mapsUrl(ev.location))}" target="_blank" rel="noopener">${esc(t("ev.openMap"))}</a>` : ""}
          ${ev.notes ? `<div class="detail-notes">${esc(ev.notes)}</div>` : ""}
          ${ev.createdBy ? `<p class="muted small detail-by">${U.avatar(ev.createdBy, 20)} ${esc(t("common.by", { name: U.pname(ev.createdBy) }))}</p>` : ""}
        </div>`,
      footer: `<button class="btn ghost danger-text" data-del>${esc(t("common.delete"))}</button><button class="btn primary" data-edit>${esc(t("common.edit"))}</button>`,
      onMount(el, api) {
        ui.confirmButton(el.querySelector("[data-del]"), () => { S.del("events", id); api.close(); ui.toast(t("common.deleted")); });
        el.querySelector("[data-edit]").addEventListener("click", () => openEventForm(id));
      }
    });
  }

  function openFlight(id) {
    const f = S.get("flights", id);
    if (!f) return;
    const un = `<span class="unspec">${esc(t("common.unspecified"))}</span>`;
    const v = (x) => (x ? esc(x) : un);
    ui.sheet({
      title: `${f.fromCode || "?"} → ${f.toCode || "?"}`,
      body: `
        <div class="detail">
          <p class="detail-when"><b>${esc(U.fmtDate(f.date))}</b><span>${v(f.depTime)} – ${v(f.arrTime)}</span></p>
          <dl class="kv">
            <dt>${esc(t("fl.airline"))}</dt><dd>${v(f.airline)}</dd>
            <dt>${esc(t("fl.flightNo"))}</dt><dd>${v(f.flightNo)}</dd>
            <dt>${esc(t("fl.gate"))}</dt><dd>${v(f.gate)}</dd>
          </dl>
          <h3 class="field-label">${esc(t("fl.passengers"))}</h3>
          <div class="pass-links">
            ${(f.passengers || []).map((p) => `<a class="pass-link" href="#flights-${esc(p)}">${U.avatar(p, 28)}<span>${esc(t("fl.viewPage", { name: U.pname(p) }))}</span>${ui.ICON.right}</a>`).join("")}
          </div>
        </div>`,
      onMount(el, api) {
        el.querySelectorAll(".pass-link").forEach((a) => a.addEventListener("click", () => api.close(true)));
      }
    });
  }

  function openDayNote(date) {
    const note = dayNote(date);
    ui.sheet({
      title: `${t("plan.dayNote")}：${U.fmtDate(date)}`,
      body: `<textarea class="daynote-input" rows="7" placeholder="${esc(t("plan.dayNotePh"))}">${esc(note ? note.text : "")}</textarea>
        ${note && note.updatedBy ? `<p class="muted small">${U.avatar(note.updatedBy, 18)} ${esc(U.pname(note.updatedBy))}</p>` : ""}`,
      footer: `<button class="btn ghost" data-close>${esc(t("common.cancel"))}</button><button class="btn primary" data-save>${esc(t("plan.dayNoteSave"))}</button>`,
      onMount(el, api) {
        el.querySelector(".sheet-foot [data-close]").addEventListener("click", () => api.close());
        el.querySelector("[data-save]").addEventListener("click", () => {
          const text = el.querySelector("textarea").value.trim();
          if (!text) { if (note) S.del("daynotes", date); }
          else S.put("daynotes", date, { text, updatedBy: ui.me(), updatedAt: Date.now() });
          api.close(); ui.toast(t("common.saved"));
        });
      }
    });
  }

  JP.plan = { openEventForm, itemsFor };
})();
