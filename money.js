/* 賒賬頁：誰欠誰、互相抵銷、合計 */
(function () {
  const JP = (window.JP = window.JP || {});
  const C = window.TRIP_CONFIG;
  const U = JP.u, t = JP.t, esc = U.esc, ui = JP.ui;
  const S = JP.store;
  const app = (JP.app = JP.app || {});
  const expanded = new Set();

  /* ---------- 計算 ---------- */
  function ledger(viewer) {
    const res = {};
    const get = (o, c) => {
      res[o] = res[o] || {};
      return (res[o][c] = res[o][c] || { iOwe: 0, theyOwe: 0, iRepaid: 0, theyRepaid: 0, items: [] });
    };
    S.data.expenses.forEach((e) => {
      const cur = e.currency || C.currencies[0];
      if (e.type === "settle") {
        const amt = e.amount || 0;
        if (!amt || e.from === e.to) return;
        if (e.from === viewer) { const b = get(e.to, cur); b.iRepaid += amt; b.items.push({ kind: "youRepaid", amt, e }); }
        else if (e.to === viewer) { const b = get(e.from, cur); b.theyRepaid += amt; b.items.push({ kind: "repaidYou", amt, e }); }
        return;
      }
      const shares = e.shares || {};
      if (e.payer === viewer) {
        Object.keys(shares).forEach((p) => {
          const amt = shares[p] || 0;
          if (p !== viewer && amt > 0) { const b = get(p, cur); b.theyOwe += amt; b.items.push({ kind: "owed", amt, e }); }
        });
      } else if ((shares[viewer] || 0) > 0) {
        const amt = shares[viewer];
        const b = get(e.payer, cur); b.iOwe += amt; b.items.push({ kind: "owe", amt, e });
      }
    });
    Object.values(res).forEach((byCur) => Object.values(byCur).forEach((b) => {
      b.iOweLeft = b.iOwe - b.iRepaid;
      b.theyOweLeft = b.theyOwe - b.theyRepaid;
      b.net = b.theyOweLeft - b.iOweLeft; // 正數：對方需還 viewer；負數：viewer 需還對方
      b.items.sort((a, c) => (c.e.date || "").localeCompare(a.e.date || "") || (c.e.createdAt || 0) - (a.e.createdAt || 0));
    }));
    return res;
  }
  JP.money = { ledger };

  /* a 欠 b 的說法（站在這支手機使用者的角度） */
  function owes(a, b) {
    const me = ui.me();
    if (a === me) return t("money.youOwe", { name: U.pname(b) });
    if (b === me) return t("money.owesYou", { name: U.pname(a) });
    return t("money.aOweB", { a: U.pname(a), b: U.pname(b) });
  }

  function curOrder(c) { const i = C.currencies.indexOf(c); return i < 0 ? 99 : i; }

  /* ---------- 畫面 ---------- */
  JP.views.money = {
    render(el) {
      const me = ui.me();
      const viewer = app.moneyViewer && C.people.some((p) => p.id === app.moneyViewer) ? app.moneyViewer : (me || C.people[0].id);
      app.moneyViewer = viewer;
      const L = ledger(viewer);
      const others = C.people.filter((p) => p.id !== viewer).map((p) => p.id);
      others.sort((a, b) => (L[b] ? 1 : 0) - (L[a] ? 1 : 0));

      // 總覽
      const sums = {};
      Object.values(L).forEach((byCur) => Object.keys(byCur).forEach((c) => {
        sums[c] = sums[c] || { owed: 0, owe: 0 };
        const n = byCur[c].net;
        if (n > 0) sums[c].owed += n; else sums[c].owe += -n;
      }));
      const who = viewer === me ? t("money.you") : U.pname(viewer);
      const curs = Object.keys(sums).sort((a, b) => curOrder(a) - curOrder(b));

      el.innerHTML = `
        <div class="money">
          <section class="viewer-pick" aria-label="${esc(t("money.viewAs"))}">
            <h2 class="sr-only">${esc(t("money.viewAs"))}</h2>
            ${C.people.map((p) => `
              <button class="vp ${p.id === viewer ? "on" : ""}" data-viewer="${p.id}" aria-pressed="${p.id === viewer}">
                ${U.avatar(p.id, 44)}<span>${esc(p.name)}${p.id === me ? " ★" : ""}</span>
              </button>`).join("")}
          </section>

          <section class="summary">
            <h2>${esc(t("money.summary", { name: U.pname(viewer) }))}</h2>
            ${curs.length ? curs.map((c) => `
              <div class="sum-row">
                <div class="sum-cell pos"><span>${esc(viewer === me ? t("money.sumOwedYou") : t("money.sumOwed", { who }))}</span><b>${U.money(sums[c].owed, c)}</b></div>
                <div class="sum-cell neg"><span>${esc(viewer === me ? t("money.sumYouOwe") : t("money.sumOwe", { who }))}</span><b>${U.money(sums[c].owe, c)}</b></div>
              </div>`).join("") : `<p class="muted">${esc(t("money.settled"))}</p>`}
          </section>

          <section class="debts">
            ${others.map((o) => debtCard(viewer, o, L[o])).join("")}
          </section>

          <section class="records">
            <h2>${esc(t("money.records"))}</h2>
            ${recordsList()}
          </section>
        </div>
        <button class="fab wide" data-add aria-label="${esc(t("money.add"))}">${ui.ICON.plus}<span>${esc(t("money.add"))}</span></button>`;
      bind(el, viewer);
    }
  };

  function debtCard(viewer, other, byCur) {
    if (!byCur) {
      return `<article class="debt-card empty-card">${U.avatar(other, 30)}<span>${esc(t("money.noneWith", { name: U.pname(other) }))}</span></article>`;
    }
    const curs = Object.keys(byCur).sort((a, b) => curOrder(a) - curOrder(b));
    const key = viewer + ">" + other;
    const open = expanded.has(key);
    const settleTarget = curs.find((c) => byCur[c].net !== 0);
    return `
      <article class="debt-card">
        <header class="debt-head">${U.avatar(other, 36)}<h3>${esc(U.pname(other))}</h3></header>
        ${curs.map((c) => {
          const b = byCur[c];
          const netCls = b.net > 0 ? "pos" : b.net < 0 ? "neg" : "zero";
          const netText = b.net > 0 ? owes(other, viewer) : b.net < 0 ? owes(viewer, other) : t("money.settled");
          return `
          <div class="debt-block">
            <div class="drow neg">
              <span class="drow-label">${esc(owes(viewer, other))}</span>
              <b>${U.money(b.iOweLeft, c)}</b>
              ${b.iRepaid ? `<small>${esc(t("money.repaid", { total: U.money(b.iOwe, c), paid: U.money(b.iRepaid, c) }))}</small>` : ""}
            </div>
            <div class="drow pos">
              <span class="drow-label">${esc(owes(other, viewer))}</span>
              <b>${U.money(b.theyOweLeft, c)}</b>
              ${b.theyRepaid ? `<small>${esc(t("money.repaid", { total: U.money(b.theyOwe, c), paid: U.money(b.theyRepaid, c) }))}</small>` : ""}
            </div>
            <div class="dnet ${netCls}">
              <span class="dnet-label">${esc(t("money.net"))}</span>
              <span class="dnet-val">${b.net === 0 ? `<b>${esc(netText)}</b>` : `<span>${esc(netText)}</span><b>${U.money(Math.abs(b.net), c)}</b>`}</span>
            </div>
          </div>`;
        }).join("")}
        <footer class="debt-foot">
          <button class="btn small ghost" data-expand="${key}" aria-expanded="${open}">${esc(t(open ? "money.hide" : "money.details"))}<span class="chev ${open ? "up" : ""}">${ui.ICON.chevron}</span></button>
          ${settleTarget ? `<button class="btn small" data-settle="${other}" data-cur="${settleTarget}">${esc(t("money.settle"))}</button>` : ""}
        </footer>
        ${open ? `<ul class="debt-items">${curs.flatMap((c) => byCur[c].items.map((it) => itemLine(it, c, viewer, other))).join("")}</ul>` : ""}
      </article>`;
  }

  function itemLine(it, c, viewer, other) {
    const e = it.e;
    let caption, sign, cls;
    if (it.kind === "owe") { caption = t("money.paidBy", { name: U.pname(e.payer) }); sign = "−"; cls = "neg"; }
    else if (it.kind === "owed") { caption = t("money.paidBy", { name: U.pname(viewer) }); sign = "+"; cls = "pos"; }
    else if (it.kind === "youRepaid") { caption = t("money.repayLine", { from: U.pname(viewer), to: U.pname(other) }); sign = "+"; cls = "pos"; }
    else { caption = t("money.repayLine", { from: U.pname(other), to: U.pname(viewer) }); sign = "−"; cls = "neg"; }
    const title = e.type === "settle" ? t("ex.type.settle") : e.title;
    return `
      <li><button class="ditem" data-record="${esc(e.id)}">
        <span class="ditem-main"><b>${esc(title)}</b><small>${esc(U.fmtDate(e.date, false))}　${esc(caption)}</small></span>
        <span class="ditem-amt ${cls}">${sign}${U.money(it.amt, c, { abs: true })}</span>
      </button></li>`;
  }

  function recordsList() {
    const list = S.data.expenses.slice().sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.createdAt || 0) - (a.createdAt || 0));
    if (!list.length) return `<p class="empty">${esc(t("money.noRecords"))}</p>`;
    let lastDate = null;
    return `<ul class="rec-list">${list.map((e) => {
      const head = e.date !== lastDate ? `<li class="rec-date">${esc(U.fmtDate(e.date))}</li>` : "";
      lastDate = e.date;
      const cur = e.currency || C.currencies[0];
      if (e.type === "settle") {
        return head + `<li><button class="rec settle" data-record="${esc(e.id)}">
          <span class="rec-av">${U.avatar(e.from, 30)}</span>
          <span class="rec-main"><b>${esc(t("money.repayLine", { from: U.pname(e.from), to: U.pname(e.to) }))}</b>${e.notes ? `<small>${esc(e.notes)}</small>` : ""}</span>
          <span class="rec-amt">${U.money(e.amount || 0, cur)}</span></button></li>`;
      }
      const ps = Object.keys(e.shares || {}).filter((p) => (e.shares[p] || 0) > 0);
      return head + `<li><button class="rec" data-record="${esc(e.id)}">
        <span class="rec-av">${U.avatar(e.payer, 30)}</span>
        <span class="rec-main"><b>${esc(e.title)}</b><small>${esc(t("money.paidBy", { name: U.pname(e.payer) }))}</small>
          <span class="mini-avs">${ps.map((p) => U.avatar(p, 18)).join("")}</span></span>
        <span class="rec-amt">${U.money(e.total || 0, cur)}</span></button></li>`;
    }).join("")}</ul>`;
  }

  function bind(el, viewer) {
    el.querySelectorAll("[data-viewer]").forEach((b) => b.addEventListener("click", () => {
      app.moneyViewer = b.dataset.viewer; JP.views.money.render(el);
    }));
    el.querySelectorAll("[data-expand]").forEach((b) => b.addEventListener("click", () => {
      const k = b.dataset.expand; expanded.has(k) ? expanded.delete(k) : expanded.add(k); JP.views.money.render(el);
    }));
    el.querySelectorAll("[data-settle]").forEach((b) => b.addEventListener("click", () => {
      const other = b.dataset.settle, cur = b.dataset.cur;
      const net = ledger(viewer)[other][cur].net;
      openForm(null, { type: "settle", currency: cur, from: net > 0 ? other : viewer, to: net > 0 ? viewer : other, amount: Math.abs(net) });
    }));
    el.querySelectorAll("[data-record]").forEach((b) => b.addEventListener("click", () => openRecord(b.dataset.record)));
    el.querySelector("[data-add]").addEventListener("click", () => openForm(null));
  }

  /* ---------- 紀錄詳情 ---------- */
  function openRecord(id) {
    const e = S.get("expenses", id);
    if (!e) return;
    const cur = e.currency || C.currencies[0];
    let body;
    if (e.type === "settle") {
      body = `<div class="detail">
        <p class="detail-when"><b>${esc(U.fmtDate(e.date))}</b></p>
        <div class="settle-viz">${U.avatar(e.from, 40)}<span class="settle-arrow"><b>${U.money(e.amount || 0, cur)}</b></span>${U.avatar(e.to, 40)}</div>
        <p class="center">${esc(t("money.repayLine", { from: U.pname(e.from), to: U.pname(e.to) }))}</p>
        ${e.notes ? `<div class="detail-notes">${esc(e.notes)}</div>` : ""}
      </div>`;
    } else {
      const ps = C.people.map((p) => p.id).filter((p) => (e.shares || {})[p] > 0);
      body = `<div class="detail">
        <p class="detail-when"><b>${esc(U.fmtDate(e.date))}</b><span>${esc(t("money.paidBy", { name: U.pname(e.payer) }))}</span></p>
        <table class="share-table">
          ${ps.map((p) => `<tr class="${p === e.payer ? "is-payer" : ""}"><td>${U.avatar(p, 24)} ${esc(U.pname(p))}${p === e.payer ? ` <small>(${esc(t("ex.payerSelf"))})</small>` : ""}</td><td>${U.money(e.shares[p], cur)}</td></tr>`).join("")}
          <tr class="total"><td>${esc(t("ex.total"))}</td><td>${U.money(e.total || 0, cur)}</td></tr>
        </table>
        ${e.notes ? `<div class="detail-notes">${esc(e.notes)}</div>` : ""}
      </div>`;
    }
    ui.sheet({
      title: e.type === "settle" ? t("ex.type.settle") : e.title,
      body,
      footer: `<button class="btn ghost danger-text" data-del>${esc(t("common.delete"))}</button><button class="btn primary" data-edit>${esc(t("common.edit"))}</button>`,
      onMount(el, api) {
        ui.confirmButton(el.querySelector("[data-del]"), () => { S.del("expenses", id); api.close(); ui.toast(t("common.deleted")); });
        el.querySelector("[data-edit]").addEventListener("click", () => openForm(id));
      }
    });
  }

  /* ---------- 記一筆 / 編輯 ---------- */
  function openForm(id, preset) {
    const e = id ? S.get("expenses", id) : null;
    const me = ui.me() || C.people[0].id;
    const st = {
      type: "expense", title: "", date: U.today(), currency: C.currencies[0], payer: me,
      mode: "items", inputs: {}, total: "", participants: C.people.map((p) => p.id),
      from: me, to: C.people.find((p) => p.id !== me).id, amount: "", notes: ""
    };
    if (e) {
      Object.assign(st, { type: e.type || "expense", date: e.date, currency: e.currency || st.currency, notes: e.notes || "" });
      if (st.type === "settle") Object.assign(st, { from: e.from, to: e.to, amount: U.inputVal(e.amount, st.currency) });
      else {
        Object.assign(st, { title: e.title || "", payer: e.payer, mode: e.mode || "items" });
        Object.keys(e.shares || {}).forEach((p) => { st.inputs[p] = U.inputVal(e.shares[p], st.currency); });
        if (st.mode === "equal") { st.total = U.inputVal(e.total, st.currency); st.participants = Object.keys(e.shares || {}).filter((p) => e.shares[p] > 0); }
      }
    }
    if (preset) {
      Object.assign(st, preset);
      if (preset.amount != null) st.amount = U.inputVal(preset.amount, st.currency);
    }

    const sh = ui.sheet({
      title: t(e ? "ex.edit" : "ex.new"),
      body: `<form class="form ex-form" novalidate></form>`,
      footer: `<button class="btn ghost" data-close>${esc(t("common.cancel"))}</button><button class="btn primary" data-save>${esc(t("common.save"))}</button>`,
      onMount(el, api) {
        const form = el.querySelector("form");
        const curInfo = () => U.cur(st.currency);

        function equalShares() {
          const T = U.toMinor(st.total, st.currency);
          const ps = C.people.map((p) => p.id).filter((p) => st.participants.includes(p));
          const out = {};
          if (!ps.length || !(T > 0)) return { out, T: T || 0, each: 0 };
          const base = Math.floor(T / ps.length);
          let rem = T - base * ps.length;
          const order = ps.includes(st.payer) ? [st.payer].concat(ps.filter((p) => p !== st.payer)) : ps;
          order.forEach((p) => { out[p] = base + (rem > 0 ? 1 : 0); if (rem > 0) rem--; });
          return { out, T, each: base };
        }

        function paint() {
          const chipsPeople = (name, sel, multi) => `<div class="chips people">${C.people.map((p) => {
            const on = multi ? sel.includes(p.id) : sel === p.id;
            return `<button type="button" class="chip person ${on ? "on" : ""}" data-${name}="${p.id}" aria-pressed="${on}">${U.avatar(p.id, 22)}${esc(p.name)}</button>`;
          }).join("")}</div>`;
          const curSeg = `<div class="seg wide">${U.currencies().map((c) => `<button type="button" class="${st.currency === c ? "on" : ""}" data-currency="${c}">${esc(U.cur(c).sym.trim())} ${c}</button>`).join("")}</div>`;

          let html = `
            <div class="seg wide" role="group">
              <button type="button" class="${st.type === "expense" ? "on" : ""}" data-type="expense">${esc(t("ex.type.expense"))}</button>
              <button type="button" class="${st.type === "settle" ? "on" : ""}" data-type="settle">${esc(t("ex.type.settle"))}</button>
            </div>`;
          if (st.type === "expense") {
            html += `
              <label class="field"><span class="field-label">${esc(t("ex.title"))}</span>
                <input name="title" value="${esc(st.title)}" placeholder="${esc(t("ex.titlePh"))}" autocomplete="off"></label>
              <label class="field"><span class="field-label">${esc(t("common.date"))}</span><input type="date" name="date" value="${esc(st.date)}"></label>
              <div class="field"><span class="field-label">${esc(t("ex.currency"))}</span>${curSeg}</div>
              <div class="field"><span class="field-label">${esc(t("ex.payer"))}</span>${chipsPeople("payer", st.payer, false)}</div>
              <div class="seg wide" role="group">
                <button type="button" class="${st.mode === "items" ? "on" : ""}" data-mode="items">${esc(t("ex.mode.items"))}</button>
                <button type="button" class="${st.mode === "equal" ? "on" : ""}" data-mode="equal">${esc(t("ex.mode.equal"))}</button>
              </div>
              <p class="muted small">${esc(t(st.mode === "items" ? "ex.modeHint.items" : "ex.modeHint.equal"))}</p>`;
            if (st.mode === "items") {
              html += `<div class="share-inputs">${C.people.map((p) => `
                <label class="share-in ${p.id === st.payer ? "is-payer" : ""}">
                  ${U.avatar(p.id, 30)}
                  <span class="share-name">${esc(p.name)}${p.id === st.payer ? `<small>${esc(t("ex.payerSelf"))}</small>` : ""}</span>
                  <span class="money-in"><i>${esc(curInfo().sym)}</i><input name="sh-${p.id}" inputmode="decimal" value="${esc(st.inputs[p.id] || "")}" placeholder="0" aria-label="${esc(t("ex.shareOf", { name: p.name }))}"></span>
                </label>`).join("")}</div>
                <p class="calc-total" data-total></p>`;
            } else {
              html += `
                <label class="field"><span class="field-label">${esc(t("ex.total"))}</span>
                  <span class="money-in big"><i>${esc(curInfo().sym)}</i><input name="total" inputmode="decimal" value="${esc(st.total)}" placeholder="0"></span></label>
                <div class="field"><span class="field-label">${esc(t("ex.participants"))}</span>${chipsPeople("part", st.participants, true)}</div>
                <p class="calc-total" data-total></p>`;
            }
          } else {
            html += `
              <div class="field"><span class="field-label">${esc(t("ex.from"))}</span>${chipsPeople("from", st.from, false)}</div>
              <div class="field"><span class="field-label">${esc(t("ex.to"))}</span>${chipsPeople("to", st.to, false)}</div>
              <div class="row2">
                <label class="field"><span class="field-label">${esc(t("ex.amount"))}</span>
                  <span class="money-in"><i>${esc(curInfo().sym)}</i><input name="amount" inputmode="decimal" value="${esc(st.amount)}" placeholder="0"></span></label>
                <label class="field"><span class="field-label">${esc(t("common.date"))}</span><input type="date" name="date" value="${esc(st.date)}"></label>
              </div>
              <div class="field"><span class="field-label">${esc(t("ex.currency"))}</span>${curSeg}</div>`;
          }
          html += `<label class="field"><span class="field-label">${esc(t("common.notes"))} <small>${esc(t("common.optional"))}</small></span>
            <textarea name="notes" rows="2">${esc(st.notes)}</textarea></label>`;
          form.innerHTML = html;
          wire();
          updateTotal();
        }

        function updateTotal() {
          const box = form.querySelector("[data-total]");
          if (!box) return;
          if (st.mode === "items") {
            const sum = C.people.reduce((a, p) => a + (U.toMinor(st.inputs[p.id], st.currency) || 0), 0);
            box.textContent = t("ex.computedTotal", { amt: U.money(sum, st.currency) });
          } else {
            const { T, each, out } = equalShares();
            const n = Object.keys(out).length;
            box.textContent = n && T > 0 ? `${t("ex.computedTotal", { amt: U.money(T, st.currency) })}，${t("ex.each", { amt: U.money(each, st.currency) })}` : "";
          }
        }

        function wire() {
          form.querySelectorAll("[data-type]").forEach((b) => b.addEventListener("click", () => { st.type = b.dataset.type; paint(); }));
          form.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => { st.mode = b.dataset.mode; paint(); }));
          form.querySelectorAll("[data-currency]").forEach((b) => b.addEventListener("click", () => { st.currency = b.dataset.currency; paint(); }));
          form.querySelectorAll("[data-payer]").forEach((b) => b.addEventListener("click", () => { st.payer = b.dataset.payer; paint(); }));
          form.querySelectorAll("[data-from]").forEach((b) => b.addEventListener("click", () => { st.from = b.dataset.from; paint(); }));
          form.querySelectorAll("[data-to]").forEach((b) => b.addEventListener("click", () => { st.to = b.dataset.to; paint(); }));
          form.querySelectorAll("[data-part]").forEach((b) => b.addEventListener("click", () => {
            const p = b.dataset.part;
            st.participants = st.participants.includes(p) ? st.participants.filter((x) => x !== p) : st.participants.concat(p);
            paint();
          }));
          form.querySelectorAll("input, textarea").forEach((inp) => {
            const sync = () => {
              const n = inp.name;
              if (n.startsWith("sh-")) st.inputs[n.slice(3)] = inp.value;
              else if (n in st) st[n] = inp.value;
              updateTotal();
            };
            inp.addEventListener("input", sync);
            inp.addEventListener("change", sync);
          });
        }
        form.addEventListener("submit", (ev) => { ev.preventDefault(); save(); });

        function save() {
          const now = Date.now();
          const base = {
            date: st.date || U.today(), currency: st.currency, notes: (st.notes || "").trim(),
            updatedAt: now, updatedBy: ui.me(),
            createdBy: e ? (e.createdBy || ui.me()) : ui.me(), createdAt: e ? (e.createdAt || now) : now
          };
          let data;
          if (st.type === "settle") {
            const amt = U.toMinor(st.amount, st.currency);
            if (st.from === st.to) return ui.formError(el, t("ex.sameperson"));
            if (!(amt > 0)) return ui.formError(el, t("ex.needAmount"));
            data = Object.assign(base, { type: "settle", from: st.from, to: st.to, amount: amt });
          } else {
            const title = (st.title || "").trim();
            if (!title) return ui.formError(el, t("ex.needTitle"));
            let shares = {}, total = 0;
            if (st.mode === "items") {
              for (const p of C.people) {
                const v = U.toMinor(st.inputs[p.id], st.currency);
                if (isNaN(v) || v < 0) return ui.formError(el, t("ex.needAmount"));
                if (v > 0) { shares[p.id] = v; total += v; }
              }
            } else {
              const r = equalShares();
              if (!(r.T > 0)) return ui.formError(el, t("ex.needAmount"));
              shares = r.out; total = r.T;
            }
            if (!total) return ui.formError(el, t("ex.needAmount"));
            if (!Object.keys(shares).some((p) => p !== st.payer && shares[p] > 0)) return ui.formError(el, t("ex.needOther"));
            data = Object.assign(base, { type: "expense", title, payer: st.payer, mode: st.mode, shares, total });
          }
          S.put("expenses", e ? e.id : U.uid(), data);
          api.close();
          ui.toast(t("common.saved"));
        }

        el.querySelector("[data-save]").addEventListener("click", save);
        paint();
      }
    });
    return sh;
  }
})();
