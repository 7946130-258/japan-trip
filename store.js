/* 資料層：Firebase（共享）或 localStorage（單機） */
(function () {
  const JP = (window.JP = window.JP || {});
  const C = window.TRIP_CONFIG;
  const U = JP.u;

  const COLLECTIONS = ["events", "expenses", "flights", "daynotes"];
  const listeners = new Set();

  const S = (JP.store = {
    mode: "local",
    status: "local",
    code: null,
    data: { events: [], expenses: [], flights: [], daynotes: [] },
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    cloudConfigured() {
      const f = C.firebase || {};
      return !!(f.apiKey && f.projectId);
    }
  });

  let notifyQueued = false;
  function notify(what) {
    if (notifyQueued) return;
    notifyQueued = true;
    requestAnimationFrame(() => {
      notifyQueued = false;
      listeners.forEach((fn) => { try { fn(what); } catch (e) { console.error(e); } });
    });
  }

  function clean(obj) { return JSON.parse(JSON.stringify(obj)); }

  function setPath(obj, path, value) {
    const keys = path.split(".");
    let o = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      if (typeof o[keys[i]] !== "object" || o[keys[i]] === null) o[keys[i]] = {};
      o = o[keys[i]];
    }
    if (value === undefined) delete o[keys[keys.length - 1]];
    else o[keys[keys.length - 1]] = value;
  }

  function seedDocs() {
    return C.seedFlights.map((f) => {
      const d = clean(f);
      const id = d.id; delete d.id;
      d.createdAt = Date.now();
      return { col: "flights", id, data: d };
    });
  }

  /* ================= 單機模式 ================= */
  const Local = {
    key: (col) => `jp27.local.${col}`,
    read(col) { return U.ls.get(this.key(col), {}); },
    write(col, obj) { U.ls.set(this.key(col), obj); },
    load(col) {
      const obj = this.read(col);
      S.data[col] = Object.keys(obj).map((id) => Object.assign({ id }, obj[id]));
    },
    async start() {
      if (!U.ls.get("jp27.local.seeded", false)) {
        seedDocs().forEach((d) => {
          const obj = this.read(d.col); obj[d.id] = d.data; this.write(d.col, obj);
        });
        U.ls.set("jp27.local.seeded", true);
      }
      COLLECTIONS.forEach((c) => this.load(c));
      // 同一支手機開兩個分頁時同步
      window.addEventListener("storage", (e) => {
        const c = COLLECTIONS.find((x) => e.key === this.key(x));
        if (c) { this.load(c); notify(c); }
      });
      S.status = "local";
      notify("all");
    },
    put(col, id, data) {
      const obj = this.read(col); obj[id] = clean(data); this.write(col, obj); this.load(col); notify(col);
      return Promise.resolve();
    },
    patch(col, id, fields) {
      const obj = this.read(col);
      if (!obj[id]) obj[id] = {};
      Object.keys(fields).forEach((k) => setPath(obj[id], k, fields[k] === null ? undefined : fields[k]));
      this.write(col, obj); this.load(col); notify(col);
      return Promise.resolve();
    },
    del(col, id) {
      const obj = this.read(col); delete obj[id]; this.write(col, obj); this.load(col); notify(col);
      return Promise.resolve();
    }
  };

  /* ================= Firebase 模式 ================= */
  const Cloud = {
    fs: null, db: null,
    meta: {},
    gotServer: false,
    timedOut: false,
    error: null,
    async start(code) {
      const base = `https://www.gstatic.com/firebasejs/${C.firebaseVersion || "13.2.0"}/`;
      const appMod = await import(base + "firebase-app.js");
      const fs = await import(base + "firebase-firestore.js");
      this.fs = fs;
      const app = appMod.initializeApp(C.firebase);
      try {
        this.db = fs.initializeFirestore(app, {
          ignoreUndefinedProperties: true,
          localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() })
        });
      } catch (e) {
        console.warn("離線快取無法啟用，改用一般模式", e);
        this.db = fs.getFirestore(app);
      }
      S.status = "connecting";
      setTimeout(() => { this.timedOut = true; this.updateStatus(); }, 6000);
      window.addEventListener("online", () => this.updateStatus());
      window.addEventListener("offline", () => this.updateStatus());

      COLLECTIONS.forEach((col) => {
        fs.onSnapshot(
          fs.collection(this.db, "trips", code, col),
          { includeMetadataChanges: true },
          (snap) => {
            S.data[col] = snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
            this.meta[col] = { cache: snap.metadata.fromCache, pending: snap.metadata.hasPendingWrites };
            if (!snap.metadata.fromCache) this.gotServer = true;
            this.error = null;
            this.updateStatus();
            notify(col);
          },
          (err) => {
            console.error("Firestore", col, err);
            this.error = err;
            this.updateStatus();
          }
        );
      });
      this.seed(code);
    },
    async seed(code) {
      const fs = this.fs;
      try {
        const markRef = fs.doc(this.db, "trips", code, "meta", "seed");
        const mark = await fs.getDocFromServer(markRef);
        if (mark.exists()) return;
        const batch = fs.writeBatch(this.db);
        seedDocs().forEach((d) => batch.set(fs.doc(this.db, "trips", code, d.col, d.id), d.data));
        batch.set(markRef, { at: Date.now() });
        await batch.commit();
      } catch (e) {
        console.warn("初始資料稍後再建立（目前可能離線）", e);
      }
    },
    updateStatus() {
      let st;
      const vals = Object.values(this.meta);
      const cached = !vals.length || vals.some((m) => m.cache);
      const offline = navigator.onLine === false || this.timedOut;
      if (this.error) st = "error";
      else if (cached && offline) st = "offline";
      else if (vals.some((m) => m.pending)) st = "pending";
      else if (cached) st = "connecting";
      else st = "ok";
      if (st !== S.status) { S.status = st; notify("status"); }
    },
    ref(col, id) { return this.fs.doc(this.db, "trips", S.code, col, id); },
    put(col, id, data) { return this.fs.setDoc(this.ref(col, id), clean(data)); },
    patch(col, id, fields) {
      const f = {};
      Object.keys(fields).forEach((k) => { f[k] = fields[k] === null ? this.fs.deleteField() : fields[k]; });
      return this.fs.updateDoc(this.ref(col, id), f);
    },
    del(col, id) { return this.fs.deleteDoc(this.ref(col, id)); }
  };

  /* ================= 對外介面 ================= */
  let impl = Local;

  S.start = async function (code) {
    if (S.cloudConfigured()) {
      S.mode = "cloud"; S.code = code; impl = Cloud;
      try {
        await Cloud.start(code);
      } catch (e) {
        console.error("Firebase 載入失敗", e);
        S.status = "error";
        notify("status");
        throw e;
      }
    } else {
      S.mode = "local"; impl = Local;
      await Local.start();
    }
  };

  function guard(p) {
    // 不等伺服器確認：畫面會立即更新，離線時也能先存下
    Promise.resolve(p).catch((e) => {
      console.error(e);
      if (JP.ui && JP.ui.toast) JP.ui.toast(JP.t("sync.error") + "：" + (e.code || e.message || e), true);
    });
  }

  S.put = (col, id, data) => guard(impl.put(col, id, data));
  S.patch = (col, id, fields) => guard(impl.patch(col, id, fields));
  S.del = (col, id) => guard(impl.del(col, id));
  S.get = (col, id) => S.data[col].find((d) => d.id === id);
})();
