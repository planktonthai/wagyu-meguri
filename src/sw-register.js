// 註冊 service worker（只在 https 的正式網站與本機測試時）
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => {}); });
}
