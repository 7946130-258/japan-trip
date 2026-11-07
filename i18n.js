/* 中 / 英 文字 */
(function () {
  const JP = (window.JP = window.JP || {});

  const DICT = {
    zh: {
      "tab.plan": "行程", "tab.money": "賒賬", "tab.flights": "航班",
      "lang.switch": "EN",
      "common.save": "儲存", "common.cancel": "取消", "common.delete": "刪除", "common.edit": "編輯",
      "common.close": "關閉", "common.confirmDelete": "再按一次確認刪除", "common.unspecified": "未指定",
      "common.notes": "備註", "common.date": "日期", "common.back": "返回", "common.copy": "複製",
      "common.copied": "已複製", "common.saved": "已儲存", "common.deleted": "已刪除",
      "common.by": "{name} 新增", "common.optional": "選填",

      "sync.local": "單機模式", "sync.ok": "已同步", "sync.pending": "同步中…", "sync.offline": "離線中，連線後自動同步",
      "sync.error": "同步出錯", "sync.connecting": "連線中…",
      "local.banner": "單機模式：資料只存在這支手機。完成 Firebase 設定後才會和大家共享。",

      "join.title": "加入旅程",
      "join.desc": "輸入旅程代碼，或直接點朋友分享給你的連結。",
      "join.code": "旅程代碼", "join.go": "加入",
      "join.or": "第一次使用？",
      "join.create": "建立新的旅程代碼",
      "join.short": "代碼至少要 10 個字元",
      "join.created": "這是你們的旅程代碼。把下面的連結傳給旅伴，他們點一下就能加入。",
      "join.link": "分享連結", "join.enter": "進入網站", "join.copyLink": "複製連結",
      "join.keep": "代碼就像鑰匙：拿到的人都能看到和修改資料，只傳給旅伴。",

      "me.title": "你是哪一位？", "me.desc": "選好之後，賒賬和航班會先顯示你的資料。之後可以點右上角頭像更換。",
      "me.switch": "切換身分",
      "settings.title": "設定", "settings.tripCode": "旅程代碼", "settings.share": "分享連結給旅伴",
      "settings.leave": "離開這個旅程（換代碼）", "settings.lang": "語言",

      "plan.countdown": "出發倒數 {n} 天", "plan.today": "出發日就是今天", "plan.dayN": "第 {n} 天，共 {total} 天",
      "plan.over": "旅程結束",
      "plan.month": "月", "plan.week": "週", "plan.day": "日",
      "plan.add": "新增行程", "plan.empty": "這天還沒有行程。點「新增行程」開始安排。",
      "plan.openDay": "看日視圖", "plan.allDay": "全天",
      "plan.dayNote": "當天備註", "plan.dayNotePh": "例如：記得帶護照、早點出門搶位子…",
      "plan.dayNoteSave": "儲存備註",
      "plan.travelDay": "{a} 移動到 {b}",
      "plan.tapToAdd": "點空白時段可以直接新增",

      "ev.new": "新增行程", "ev.edit": "編輯行程",
      "ev.title": "標題", "ev.titlePh": "例如：淺草寺、一蘭拉麵",
      "ev.allDay": "全天", "ev.start": "開始", "ev.end": "結束",
      "ev.location": "地點", "ev.locationPh": "地址或地名（可在地圖開啟）",
      "ev.notes": "備註", "ev.notesPh": "想記下的任何事：訂位編號、要買的東西、集合地點…",
      "ev.category": "類別", "ev.openMap": "在 Google 地圖開啟",
      "ev.needTitle": "請填寫標題", "ev.needTime": "請填寫開始和結束時間",
      "ev.overnight": "（隔天結束）",
      "cat.sight": "景點", "cat.food": "美食", "cat.transport": "交通", "cat.shopping": "購物",
      "cat.stay": "住宿", "cat.other": "其他",

      "fl.title": "航班", "fl.people": "每個人的航班", "fl.count": "{n} 個航班", "fl.none": "還沒有航班",
      "fl.add": "新增航班", "fl.edit": "編輯航班", "fl.page": "{name} 的航班",
      "fl.airline": "航空公司", "fl.airlineUnspec": "航空公司未指定", "fl.flightNo": "航班號碼",
      "fl.date": "出發日期", "fl.dep": "起飛", "fl.arr": "抵達", "fl.arrDate": "抵達日期",
      "fl.from": "出發地", "fl.to": "目的地", "fl.code": "機場代碼", "fl.city": "城市", "fl.airport": "機場",
      "fl.terminal": "航廈", "fl.depAirport": "出發機場", "fl.arrAirport": "抵達機場", "fl.depTerminal": "出發航廈", "fl.arrTerminal": "抵達航廈",
      "fl.gate": "登機口", "fl.boarding": "登機時間", "fl.seat": "座位", "fl.bookingRef": "訂位代號",
      "fl.passengers": "乘客", "fl.shared": "航班資料（同班機的人會一起更新）",
      "fl.personal": "{name} 的個人資料", "fl.notes": "備註",
      "fl.viewPage": "看 {name} 的航班頁",
      "fl.needPassenger": "至少選一位乘客", "fl.needDate": "請填寫出發日期",
      "fl.removeMe": "這班沒有 {name}",

      "money.viewAs": "選擇一個人", "money.add": "記一筆",
      "money.youOwe": "你需還 {name}", "money.owesYou": "{name} 需還你",
      "money.net": "合計", "money.netOwesYou": "{name} 需還你", "money.netYouOwe": "你需還 {name}",
      "money.settled": "已結清",
      "money.repaid": "共 {total}，已還 {paid}",
      "money.details": "明細", "money.hide": "收起", "money.settle": "記錄還款",
      "money.summary": "{name} 的總覽",
      "money.sumOwedYou": "別人總共需還你", "money.sumYouOwe": "你總共需還別人",
      "money.sumOwed": "別人總共需還 {who}", "money.sumOwe": "{who} 總共需還別人", "money.aOweB": "{a} 需還 {b}",
      "money.you": "你",
      "money.records": "所有紀錄", "money.noRecords": "還沒有任何紀錄。點「記一筆」記下第一筆消費。",
      "money.noneWith": "和 {name} 之間沒有帳",
      "money.paidBy": "{name} 付款",
      "money.repayLine": "{from} 還給 {to}",

      "ex.new": "記一筆", "ex.edit": "編輯紀錄",
      "ex.type.expense": "消費", "ex.type.settle": "還款",
      "ex.title": "項目", "ex.titlePh": "例如：晚餐、Suica 加值",
      "ex.currency": "幣別", "ex.payer": "誰付的錢",
      "ex.mode.items": "各付各的", "ex.mode.equal": "平均分攤",
      "ex.modeHint.items": "輸入每個人自己那份的金額。沒份的留空。",
      "ex.modeHint.equal": "輸入總金額，勾選有份的人。",
      "ex.payerSelf": "付款人自己的",
      "ex.total": "總金額", "ex.each": "每人 {amt}", "ex.participants": "有份的人",
      "ex.computedTotal": "總計 {amt}",
      "ex.from": "誰還錢", "ex.to": "還給誰", "ex.amount": "金額",
      "ex.needAmount": "請輸入金額", "ex.needOther": "至少要有一位付款人以外的人有金額，才會產生欠款",
      "ex.sameperson": "還錢的人和收錢的人不能是同一位",
      "ex.needTitle": "請填寫項目名稱",
      "ex.shareOf": "{name} 的部分"
    },

    en: {
      "tab.plan": "Plan", "tab.money": "IOUs", "tab.flights": "Flights",
      "lang.switch": "中",
      "common.save": "Save", "common.cancel": "Cancel", "common.delete": "Delete", "common.edit": "Edit",
      "common.close": "Close", "common.confirmDelete": "Tap again to delete", "common.unspecified": "Unspecified",
      "common.notes": "Notes", "common.date": "Date", "common.back": "Back", "common.copy": "Copy",
      "common.copied": "Copied", "common.saved": "Saved", "common.deleted": "Deleted",
      "common.by": "Added by {name}", "common.optional": "optional",

      "sync.local": "This device only", "sync.ok": "Synced", "sync.pending": "Syncing…", "sync.offline": "Offline. Changes sync when you reconnect",
      "sync.error": "Sync error", "sync.connecting": "Connecting…",
      "local.banner": "This device only: data stays on this phone until Firebase is set up.",

      "join.title": "Join the trip",
      "join.desc": "Enter the trip code, or open the link a travel buddy sent you.",
      "join.code": "Trip code", "join.go": "Join",
      "join.or": "First time here?",
      "join.create": "Create a new trip code",
      "join.short": "The code needs at least 10 characters",
      "join.created": "This is your trip code. Send the link below to everyone; one tap and they're in.",
      "join.link": "Share link", "join.enter": "Open the site", "join.copyLink": "Copy link",
      "join.keep": "The code works like a key: anyone who has it can see and edit the data. Only share it with the group.",

      "me.title": "Who are you?", "me.desc": "IOUs and flights open on your own info first. Tap your avatar at the top right to change it later.",
      "me.switch": "Switch person",
      "settings.title": "Settings", "settings.tripCode": "Trip code", "settings.share": "Share link with the group",
      "settings.leave": "Leave this trip (use another code)", "settings.lang": "Language",

      "plan.countdown": "{n} days to go", "plan.today": "We fly today", "plan.dayN": "Day {n} of {total}",
      "plan.over": "Trip complete",
      "plan.month": "Month", "plan.week": "Week", "plan.day": "Day",
      "plan.add": "Add plan", "plan.empty": "Nothing planned for this day yet. Tap Add plan to start.",
      "plan.openDay": "Day view", "plan.allDay": "All day",
      "plan.dayNote": "Notes for the day", "plan.dayNotePh": "e.g. bring passports, leave early to beat the queue…",
      "plan.dayNoteSave": "Save note",
      "plan.travelDay": "{a} to {b}",
      "plan.tapToAdd": "Tap an empty slot to add a plan there",

      "ev.new": "Add plan", "ev.edit": "Edit plan",
      "ev.title": "Title", "ev.titlePh": "e.g. Senso-ji, Ichiran ramen",
      "ev.allDay": "All day", "ev.start": "Start", "ev.end": "End",
      "ev.location": "Place", "ev.locationPh": "Address or place name (opens in Maps)",
      "ev.notes": "Notes", "ev.notesPh": "Anything worth remembering: booking numbers, things to buy, meeting point…",
      "ev.category": "Type", "ev.openMap": "Open in Google Maps",
      "ev.needTitle": "Add a title", "ev.needTime": "Add a start and end time",
      "ev.overnight": "(ends next day)",
      "cat.sight": "Sights", "cat.food": "Food", "cat.transport": "Transport", "cat.shopping": "Shopping",
      "cat.stay": "Stay", "cat.other": "Other",

      "fl.title": "Flights", "fl.people": "Everyone's flights", "fl.count": "{n} flights", "fl.none": "No flights yet",
      "fl.add": "Add flight", "fl.edit": "Edit flight", "fl.page": "{name}'s flights",
      "fl.airline": "Airline", "fl.airlineUnspec": "Airline unspecified", "fl.flightNo": "Flight number",
      "fl.date": "Departure date", "fl.dep": "Departs", "fl.arr": "Arrives", "fl.arrDate": "Arrival date",
      "fl.from": "From", "fl.to": "To", "fl.code": "Airport code", "fl.city": "City", "fl.airport": "Airport",
      "fl.terminal": "Terminal", "fl.depAirport": "Departure airport", "fl.arrAirport": "Arrival airport", "fl.depTerminal": "Departure terminal", "fl.arrTerminal": "Arrival terminal",
      "fl.gate": "Gate", "fl.boarding": "Boarding", "fl.seat": "Seat", "fl.bookingRef": "Booking ref",
      "fl.passengers": "Passengers", "fl.shared": "Flight details (updates for everyone on this flight)",
      "fl.personal": "{name}'s details", "fl.notes": "Notes",
      "fl.viewPage": "Open {name}'s flights",
      "fl.needPassenger": "Pick at least one passenger", "fl.needDate": "Add the departure date",
      "fl.removeMe": "{name} isn't on this flight",

      "money.viewAs": "Pick a person", "money.add": "Add expense",
      "money.youOwe": "You owe {name}", "money.owesYou": "{name} owes you",
      "money.net": "Total", "money.netOwesYou": "{name} owes you", "money.netYouOwe": "You owe {name}",
      "money.settled": "All settled",
      "money.repaid": "{total} total, {paid} paid back",
      "money.details": "Details", "money.hide": "Hide", "money.settle": "Record repayment",
      "money.summary": "{name}'s overview",
      "money.sumOwedYou": "Others owe you", "money.sumYouOwe": "You owe others",
      "money.sumOwed": "Others owe {who}", "money.sumOwe": "{who} owes others", "money.aOweB": "{a} owes {b}",
      "money.you": "you",
      "money.records": "All records", "money.noRecords": "No records yet. Tap Add expense to log the first one.",
      "money.noneWith": "Nothing between you and {name}",
      "money.paidBy": "Paid by {name}",
      "money.repayLine": "{from} paid back {to}",

      "ex.new": "Add expense", "ex.edit": "Edit record",
      "ex.type.expense": "Expense", "ex.type.settle": "Repayment",
      "ex.title": "What for", "ex.titlePh": "e.g. dinner, Suica top-up",
      "ex.currency": "Currency", "ex.payer": "Who paid",
      "ex.mode.items": "Each their own", "ex.mode.equal": "Split equally",
      "ex.modeHint.items": "Enter each person's own amount. Leave blank if they had nothing.",
      "ex.modeHint.equal": "Enter the total and tick who shares it.",
      "ex.payerSelf": "payer's own",
      "ex.total": "Total", "ex.each": "{amt} each", "ex.participants": "Shared by",
      "ex.computedTotal": "Total {amt}",
      "ex.from": "Who paid back", "ex.to": "Paid to", "ex.amount": "Amount",
      "ex.needAmount": "Enter an amount", "ex.needOther": "Someone other than the payer needs an amount for anyone to owe money",
      "ex.sameperson": "The payer and receiver can't be the same person",
      "ex.needTitle": "Add what it was for",
      "ex.shareOf": "{name}'s part"
    }
  };

  let lang = "zh";
  try { const saved = localStorage.getItem("jp27.lang"); if (saved) lang = saved; } catch (e) { /* ignore */ }
  if (lang !== "zh" && lang !== "en") lang = "zh";

  JP.i18n = {
    get lang() { return lang; },
    set(l) {
      lang = l === "en" ? "en" : "zh";
      try { localStorage.setItem("jp27.lang", lang); } catch (e) { /* ignore */ }
      document.documentElement.lang = lang === "zh" ? "zh-Hant" : "en";
    }
  };

  JP.t = function (key, vars) {
    let s = (DICT[lang] && DICT[lang][key]) || DICT.zh[key] || key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
    return s;
  };

  /* 取雙語欄位（字串或 {zh,en}） */
  JP.loc = function (v) {
    if (v == null) return "";
    if (typeof v === "string") return v;
    return v[lang] || v.zh || v.en || "";
  };
})();
