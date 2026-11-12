// ── 3D 延後載入：預設 3D 時等頁面畫好再下載 three.js；預設 2D 時等使用者按下 3D 才下載 ──
(function(){
  const THREE_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
  const ORBIT_URL = "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js";
  const card = document.querySelector(".map-card");
  const b2 = document.getElementById("view-2d"), b3 = document.getElementById("view-3d");
  const hint = document.getElementById("map3d-hint"), zoom = document.getElementById("view-zoom");
  let saved = null;
  try { saved = localStorage.getItem("wagyu-view"); } catch(e) {}
  // 手機且記憶體或核心數較少時，預設用平面地圖
  const coarse = matchMedia("(pointer: coarse)").matches;
  const lowEnd = coarse && ((navigator.deviceMemory && navigator.deviceMemory <= 4) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4));
  const first = saved === "2d" || saved === "3d" ? saved : (lowEnd ? "2d" : "3d");

  function show2d(){
    card.classList.remove("is-3d");
    b2.setAttribute("aria-pressed", "true"); b3.setAttribute("aria-pressed", "false");
    zoom.hidden = true; hint.hidden = true;
  }
  function loadScript(src){
    return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.async = false; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  }
  let loading = null;
  function load(){
    if (loading) return loading;
    b3.textContent = "載入中…"; b3.setAttribute("aria-busy", "true");
    loading = loadScript(THREE_URL).then(() => loadScript(ORBIT_URL)).catch(() => {}).then(() => { b3.textContent = "3D"; b3.removeAttribute("aria-busy"); });
    return loading;
  }
  let desired = first, started = false;
  function go(){
    load().then(() => {
      if (started || !window.start3D) return;
      if (!(window.THREE && THREE.OrbitControls)) {
        // 下載失敗（例如離線且沒有快取）：先用平面地圖，連線後可以再按 3D
        loading = null; show2d();
        hint.hidden = false; hint.textContent = navigator.onLine ? "3D 地圖載入失敗，已改用平面地圖，可以再按一次 3D 重試。" : "目前離線，3D 地圖需要連線才能載入，已改用平面地圖。";
        return;
      }
      started = true; window.start3D(desired);
    });
  }
  // start3D 接手之前，先由這裡處理 2D／3D 按鈕
  b2.onclick = () => { desired = "2d"; try { localStorage.setItem("wagyu-view", "2d"); } catch(e) {} show2d(); };
  b3.onclick = () => { desired = "3d"; go(); };

  show2d();
  if (first === "3d") {
    // 等瀏覽器有空再載入，不擋住第一次畫面
    const later = window.requestIdleCallback || (fn => setTimeout(fn, 200));
    later(go, { timeout: 1500 });
  }
})();
