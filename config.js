/* =========================================================
   日本行網站：設定檔
   你只需要改這個檔案，其他檔案不用動。
   ========================================================= */
window.TRIP_CONFIG = {

  /* 1) Firebase 設定（完成「部署說明.md」第 1 步後，把 Firebase 給你的內容貼進來）
        全部留空 = 單機模式：資料只存在每支手機裡，不會共享。 */
  firebase: {
    apiKey: "AIzaSyBNRLTTSzXSpi-qsH6neDeXcZmalafI898",
    authDomain: "jp27-44c7a.firebaseapp.com",
    projectId: "jp27-44c7a",
    storageBucket: "jp27-44c7a.firebasestorage.app",
    messagingSenderId: "176774593152",
    appId: "1:176774593152:web:339835f2a3985fc7250465"
  },
  firebaseVersion: "13.2.0",

  /* 2) 旅程代碼（選填）
        留空（建議）：第一次打開時要輸入代碼，或點你分享的連結自動加入。
        填了：打開網站就直接進入，不用輸入代碼（但任何拿到網址的人都能看到資料）。 */
  tripCode: "",

  tripName: { zh: "日本行 2027", en: "Japan 2027" },

  /* 3) 旅伴 */
  people: [
    { id: "jiayu",   name: "Jia Yu",   color: "#0C8599" },
    { id: "mingxun", name: "Ming Xun", color: "#C2255C" },
    { id: "ossas",   name: "Ossas",    color: "#5C940D" },
    { id: "agnes",   name: "Agnes",    color: "#D9480F" },
    { id: "andee",   name: "Andee",    color: "#6741D9" }
  ],

  /* 4) 住宿城市（from = 入住當天，to = 離開當天） */
  stays: [
    { id: "tokyo", code: "TYO", from: "2027-01-15", to: "2027-01-19", color: "#2F4A9A", name: { zh: "東京", en: "Tokyo" } },
    { id: "kyoto", code: "KYO", from: "2027-01-19", to: "2027-01-22", color: "#7B4B94", name: { zh: "京都", en: "Kyoto" } },
    { id: "osaka", code: "OSA", from: "2027-01-22", to: "2027-01-25", color: "#E8820C", name: { zh: "大阪", en: "Osaka" } }
  ],
  tripStart: "2027-01-15",
  tripEnd: "2027-01-25",
  home: { code: "SIN", name: { zh: "新加坡", en: "Singapore" } },

  /* 5) 記帳幣別（第一個是預設） */
  currencies: ["JPY", "SGD", "MYR"],

  /* 6) 第一次使用時自動建立的航班（之後在網站上修改即可，這裡改了不會覆蓋已存在的資料） */
  seedFlights: [
    {
      id: "out-0115",
      airline: "", flightNo: "",
      date: "2027-01-15", depTime: "00:40",
      arrDate: "2027-01-15", arrTime: "08:25",
      fromCode: "SIN", fromCity: { zh: "新加坡", en: "Singapore" }, fromAirport: "", fromTerminal: "",
      toCode: "TYO", toCity: { zh: "東京", en: "Tokyo" }, toAirport: "", toTerminal: "",
      gate: "", boardingTime: "", notes: "",
      passengers: ["jiayu", "mingxun", "ossas", "agnes", "andee"],
      seats: {}, bookingRefs: {}
    },
    {
      id: "ret-0124",
      airline: "", flightNo: "",
      date: "2027-01-24", depTime: "11:30",
      arrDate: "2027-01-24", arrTime: "17:30",
      fromCode: "KIX", fromCity: { zh: "大阪（關西）", en: "Osaka (Kansai)" }, fromAirport: "", fromTerminal: "",
      toCode: "SIN", toCity: { zh: "新加坡", en: "Singapore" }, toAirport: "", toTerminal: "",
      gate: "", boardingTime: "", notes: "",
      passengers: ["agnes", "andee"],
      seats: {}, bookingRefs: {}
    },
    {
      id: "ret-0125",
      airline: "", flightNo: "",
      date: "2027-01-25", depTime: "11:30",
      arrDate: "2027-01-25", arrTime: "17:30",
      fromCode: "KIX", fromCity: { zh: "大阪（關西）", en: "Osaka (Kansai)" }, fromAirport: "", fromTerminal: "",
      toCode: "SIN", toCity: { zh: "新加坡", en: "Singapore" }, toAirport: "", toTerminal: "",
      gate: "", boardingTime: "", notes: "",
      passengers: ["jiayu", "mingxun", "ossas"],
      seats: {}, bookingRefs: {}
    }
  ]
};
