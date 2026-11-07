/* 航班頁：每人一頁，登機證樣式 */
(function () {
  const JP = (window.JP = window.JP || {});
  const C = window.TRIP_CONFIG;
  const U = JP.u, t = JP.t, esc = U.esc, ui = JP.ui;
  const S = JP.store;

  const un = () => `<span class="unspec">${esc(t("common.unspecified"))}</span>`;
  const v = (x) => (x ? esc(x) : un());

  function flightsOf(pid) {
    return S.data.flights
      .filter((f) => (f.passengers || []).includes(pid))
      .sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.depTime || "").localeCompare(b.depTime || ""));
  }

  JP.views.flights = {
    render(el, route) {
      if (route.person && C.people.some((p) => p.id === route.person)) personPage(el, route.person);
      else listPage(el);
      window.scrollTo(0, 0);
    }
  };

  function listPage(el) {
    const me = ui.me();
    el.innerHTML = `
      <div class="flights">
        <h2 class="page-title">${esc(t("fl.people"))}</h2>
        <ul class="fl-people">
          ${C.people.map((p) => {
            const fs = flightsOf(p.id);
            return `<li><a class="fl-person ${p.id === me ? "me" : ""}" href="#flights-${p.id}">
              ${U.avatar(p.id, 42)}
              <span class="flp-main">
                <b>${esc(p.name)}${p.id === me ? " ★" : ""}</b>
                <span class="flp-legs">${fs.length ? fs.map((f) => `<span class="leg"><em>${esc(U.fmtShort(f.date))}</em>${esc(f.fromCode || "?")}<span class="leg-arrow" aria-hidden="true">✈</span>${esc(f.toCode || "?")}</span>`).join("") : esc(t("fl.none"))}</span>
              </span>
              <span class="flp-go">${ui.ICON.right}</span>
            </a></li>`;
          }).join("")}
        </ul>
      </div>`;
  }

  function personPage(el, pid) {
    const fs = flightsOf(pid);
    el.innerHTML = `
      <div class="flights">
        <a class="back-link" href="#flights">${ui.ICON.left}<span>${esc(t("fl.people"))}</span></a>
        <header class="fl-head">${U.avatar(pid, 48)}<h2>${esc(t("fl.page", { name: U.pname(pid) }))}</h2></header>
        ${fs.length ? fs.map((f) => pass(f, pid)).join("") : `<p class="empty">${esc(t("fl.none"))}</p>`}
        <button class="btn ghost wide" data-add>${ui.ICON.plus}<span>${esc(t("fl.add"))}</span></button>
      </div>`;
    el.querySelectorAll("[data-edit]").forEach((b) => b.addEventListener("click", () => openForm(b.dataset.edit, pid)));
    el.querySelector("[data-add]").addEventListener("click", () => openForm(null, pid));
  }

  function pass(f, pid) {
    const seat = (f.seats || {})[pid], ref = (f.bookingRefs || {})[pid];
    const plusDay = f.arrDate && f.date && f.arrDate > f.date ? U.diffDays(f.date, f.arrDate) : 0;
    const others = (f.passengers || []).filter((p) => p !== pid);
    return `
      <article class="pass">
        <div class="pass-top">
          <span class="pass-airline">${f.airline ? esc(f.airline) : `<span class="unspec">${esc(t("fl.airlineUnspec"))}</span>`}</span>
          <span class="pass-no">${f.flightNo ? esc(f.flightNo) : un()}</span>
        </div>
        <div class="pass-route">
          <div class="pass-end">
            <span class="pass-code">${esc(f.fromCode || "???")}</span>
            <span class="pass-city">${esc(JP.loc(f.fromCity))}</span>
            <span class="pass-time">${f.depTime ? esc(f.depTime) : un()}</span>
          </div>
          <div class="pass-mid" aria-hidden="true"><span class="pass-plane">✈</span><span class="pass-date">${esc(U.fmtDate(f.date))}</span></div>
          <div class="pass-end right">
            <span class="pass-code">${esc(f.toCode || "???")}</span>
            <span class="pass-city">${esc(JP.loc(f.toCity))}</span>
            <span class="pass-time">${f.arrTime ? esc(f.arrTime) : un()}${plusDay ? `<sup>+${plusDay}</sup>` : ""}</span>
          </div>
        </div>
        <div class="pass-perf" aria-hidden="true"></div>
        <dl class="pass-grid">
          <div class="big"><dt>${esc(t("fl.seat"))}</dt><dd>${v(seat)}</dd></div>
          <div class="big"><dt>${esc(t("fl.gate"))}</dt><dd>${v(f.gate)}</dd></div>
          <div><dt>${esc(t("fl.boarding"))}</dt><dd>${v(f.boardingTime)}</dd></div>
          <div><dt>${esc(t("fl.date"))}</dt><dd>${v(f.date && U.fmtDate(f.date))}</dd></div>
          <div><dt>${esc(t("fl.depTerminal"))}</dt><dd>${v(f.fromTerminal)}</dd></div>
          <div><dt>${esc(t("fl.arrTerminal"))}</dt><dd>${v(f.toTerminal)}</dd></div>
          <div><dt>${esc(t("fl.depAirport"))}</dt><dd>${v(f.fromAirport)}</dd></div>
          <div><dt>${esc(t("fl.arrAirport"))}</dt><dd>${v(f.toAirport)}</dd></div>
          <div><dt>${esc(t("fl.bookingRef"))}</dt><dd>${v(ref)}</dd></div>
          <div><dt>${esc(t("fl.arrDate"))}</dt><dd>${v(f.arrDate && U.fmtDate(f.arrDate))}</dd></div>
        </dl>
        ${f.notes ? `<p class="pass-notes">${esc(f.notes)}</p>` : ""}
        <div class="pass-foot">
          <span class="pass-with">${others.map((p) => `<a href="#flights-${esc(p)}" title="${esc(U.pname(p))}">${U.avatar(p, 24)}</a>`).join("")}</span>
          <button class="btn small" data-edit="${esc(f.id)}">${esc(t("common.edit"))}</button>
        </div>
      </article>`;
  }

  /* ---------- 編輯 / 新增航班 ---------- */
  function openForm(id, pid) {
    const f = id ? S.get("flights", id) : null;
    const d = Object.assign({
      airline: "", flightNo: "", date: "", depTime: "", arrDate: "", arrTime: "",
      fromCode: "", fromCity: "", fromAirport: "", fromTerminal: "",
      toCode: "", toCity: "", toAirport: "", toTerminal: "",
      gate: "", boardingTime: "", notes: "", passengers: [pid], seats: {}, bookingRefs: {}
    }, f || {});
    let passengers = (d.passengers || []).slice();

    const inp = (name, label, type = "text", extra = "") =>
      `<label class="field"><span class="field-label">${esc(label)}</span><input type="${type}" name="${name}" value="${esc(JP.loc(d[name]) || "")}" ${extra}></label>`;
    const code = (name) => inp(name, t("fl.code"), "text", `maxlength="4" autocapitalize="characters" autocomplete="off" class="code-in"`);

    ui.sheet({
      title: t(f ? "fl.edit" : "fl.add"),
      body: `
        <form class="form fl-form" novalidate>
          <h3 class="form-section">${esc(t("fl.shared"))}</h3>
          <div class="row2">${inp("airline", t("fl.airline"))}${inp("flightNo", t("fl.flightNo"), "text", 'autocapitalize="characters" autocomplete="off"')}</div>
          <fieldset class="fl-leg"><legend>${esc(t("fl.from"))}</legend>
            <div class="row3">${code("fromCode")}${inp("fromCity", t("fl.city"))}</div>
            <div class="row2">${inp("fromAirport", t("fl.airport"))}${inp("fromTerminal", t("fl.terminal"))}</div>
            <div class="row2">${inp("date", t("fl.date"), "date")}${inp("depTime", t("fl.dep"), "time")}</div>
            <div class="row2">${inp("gate", t("fl.gate"))}${inp("boardingTime", t("fl.boarding"), "time")}</div>
          </fieldset>
          <fieldset class="fl-leg"><legend>${esc(t("fl.to"))}</legend>
            <div class="row3">${code("toCode")}${inp("toCity", t("fl.city"))}</div>
            <div class="row2">${inp("toAirport", t("fl.airport"))}${inp("toTerminal", t("fl.terminal"))}</div>
            <div class="row2">${inp("arrDate", t("fl.arrDate"), "date")}${inp("arrTime", t("fl.arr"), "time")}</div>
          </fieldset>
          <label class="field"><span class="field-label">${esc(t("fl.notes"))}</span><textarea name="notes" rows="2">${esc(d.notes || "")}</textarea></label>
          <div class="field"><span class="field-label">${esc(t("fl.passengers"))}</span>
            <div class="chips people">${C.people.map((p) => `<button type="button" class="chip person ${passengers.includes(p.id) ? "on" : ""}" data-pass="${p.id}" aria-pressed="${passengers.includes(p.id)}">${U.avatar(p.id, 22)}${esc(p.name)}</button>`).join("")}</div>
          </div>
          <h3 class="form-section">${esc(t("fl.personal", { name: U.pname(pid) }))}</h3>
          <div class="row2">
            <label class="field"><span class="field-label">${esc(t("fl.seat"))}</span><input name="seat" value="${esc((d.seats || {})[pid] || "")}" autocapitalize="characters" autocomplete="off"></label>
            <label class="field"><span class="field-label">${esc(t("fl.bookingRef"))}</span><input name="bookingRef" value="${esc((d.bookingRefs || {})[pid] || "")}" autocapitalize="characters" autocomplete="off"></label>
          </div>
        </form>`,
      footer: `${f ? `<button class="btn ghost danger-text" data-del>${esc(t("common.delete"))}</button>` : `<button class="btn ghost" data-close>${esc(t("common.cancel"))}</button>`}<button class="btn primary" data-save>${esc(t("common.save"))}</button>`,
      onMount(el, api) {
        const form = el.querySelector("form");
        form.querySelectorAll(".code-in").forEach((i) => i.addEventListener("input", () => { i.value = i.value.toUpperCase(); }));
        form.querySelectorAll("[data-pass]").forEach((b) => b.addEventListener("click", () => {
          const p = b.dataset.pass;
          passengers = passengers.includes(p) ? passengers.filter((x) => x !== p) : passengers.concat(p);
          b.classList.toggle("on", passengers.includes(p));
          b.setAttribute("aria-pressed", passengers.includes(p));
        }));
        if (f) ui.confirmButton(el.querySelector("[data-del]"), () => { S.del("flights", f.id); api.close(); ui.toast(t("common.deleted")); });

        const save = () => {
          const g = (n) => form[n].value.trim();
          if (!g("date")) return ui.formError(el, t("fl.needDate"));
          if (!passengers.length) return ui.formError(el, t("fl.needPassenger"));
          const shared = {};
          ["airline", "flightNo", "date", "depTime", "arrDate", "arrTime", "fromAirport", "fromTerminal", "toAirport", "toTerminal", "gate", "boardingTime", "notes"].forEach((n) => { shared[n] = g(n); });
          shared.flightNo = g("flightNo").toUpperCase();
          shared.fromCode = g("fromCode").toUpperCase();
          shared.toCode = g("toCode").toUpperCase();
          // 城市：沒改就保留原本的中英雙語
          ["fromCity", "toCity"].forEach((n) => { shared[n] = g(n) === JP.loc(d[n]) ? (d[n] || "") : g(n); });
          if (!shared.arrDate) shared.arrDate = shared.date;
          shared.passengers = passengers;
          shared.updatedAt = Date.now(); shared.updatedBy = ui.me();
          const seat = g("seat").toUpperCase(), ref = g("bookingRef").toUpperCase();
          if (f) {
            const fields = Object.assign({}, shared);
            fields["seats." + pid] = seat || null;
            fields["bookingRefs." + pid] = ref || null;
            S.patch("flights", f.id, fields);
          } else {
            const doc = Object.assign(shared, { seats: {}, bookingRefs: {}, createdAt: Date.now(), createdBy: ui.me() });
            if (seat) doc.seats[pid] = seat;
            if (ref) doc.bookingRefs[pid] = ref;
            S.put("flights", U.uid(), doc);
          }
          api.close();
          ui.toast(t("common.saved"));
        };
        el.querySelector("[data-save]").addEventListener("click", save);
        form.addEventListener("submit", (e) => { e.preventDefault(); save(); });
      }
    });
  }
})();
