// ── 3D 立體地圖（three.js）──
// 由 loader.js 在需要 3D 時才載入 three.js，載好後呼叫 start3D()
window.start3D = function(initialView){
  const card = document.querySelector(".map-card");
  const box = document.getElementById("map3d");
  const overlay = document.getElementById("map3d-overlay");
  const tip = document.getElementById("map3d-tip");
  const btn2d = document.getElementById("view-2d"), btn3d = document.getElementById("view-3d"), btnReset = document.getElementById("view-reset");
  const hint = document.getElementById("map3d-hint");
  const VIEW_KEY = "wagyu-view";
  let view = initialView === "2d" ? "2d" : "3d";

  let ok = !!(window.THREE && THREE.OrbitControls);
  let renderer = null;
  if (ok) {
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
    catch(e) { ok = false; }
  }
  if (!ok) {
    btn3d.disabled = true; btn3d.title = "這個瀏覽器無法顯示 3D 地圖";
    view = "2d";
  }

  // 座標換算：SVG 平面座標 → 3D 世界
  const X0 = 520, Y0 = 580, S = 0.1, DEPTH = 1.4;
  let scene, camera, controls, group, meshes = {}, outlines = [], raycaster, pointer;
  const lifted = new Set(), wideSet = new Set();
  let hoverId = null, needsRender = true, fitted = false, twMesh = null;

  function cssVar(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || "#cccccc"; }

  function parsePath(d){
    return d.split("M").filter(Boolean).map(sp => {
      const pts = [];
      sp.replace(/Z/g,"").split("L").forEach(pair => {
        const [x,y] = pair.split(",").map(Number);
        if (!isNaN(x) && !isNaN(y)) pts.push(new THREE.Vector2((x - X0) * S, -(y - Y0) * S));
      });
      return pts;
    }).filter(p => p.length >= 3);
  }

  function build(){
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(34, 1, 1, 2000);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    box.appendChild(renderer.domElement);
    renderer.domElement.setAttribute("aria-label", "日本各縣和牛品牌 3D 地圖");
    renderer.domElement.setAttribute("role", "img");

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const sun = new THREE.DirectionalLight(0xffffff, 0.46); sun.position.set(-40, 120, 70); scene.add(sun);
    const fill = new THREE.DirectionalLight(0xffffff, 0.12); fill.position.set(60, 40, -60); scene.add(fill);

    group = new THREE.Group(); group.rotation.x = -Math.PI / 2; scene.add(group);

    Object.entries(PATHS).forEach(([id, d]) => {
      id = +id; if (!d) return;
      const rings = parsePath(d);
      const shapes = rings.map(r => new THREE.Shape(r));
      const geo = new THREE.ExtrudeGeometry(shapes, { depth: DEPTH, bevelEnabled: false, curveSegments: 1 });
      const top = new THREE.MeshLambertMaterial({ color: 0xcccccc });
      const side = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
      const mesh = new THREE.Mesh(geo, [top, side]);
      mesh.userData.id = id;
      // 取景用：只看本島（最大的那塊），離島不影響鏡頭位置
      const area = r => Math.abs(r.reduce((a, p, i) => { const q = r[(i + 1) % r.length]; return a + p.x * q.y - q.x * p.y; }, 0));
      const main = rings.reduce((a, b) => area(b) > area(a) ? b : a, rings[0]);
      const mb = new THREE.Box2().setFromPoints(main);
      mesh.userData.main = [[mb.min.x, mb.min.y], [mb.max.x, mb.min.y], [mb.min.x, mb.max.y], [mb.max.x, mb.max.y]];
      group.add(mesh); meshes[id] = mesh;
      // 縣界線（頂面）
      rings.forEach(r => {
        const g = new THREE.BufferGeometry().setFromPoints(r.map(v => new THREE.Vector3(v.x, v.y, DEPTH + 0.02)));
        const line = new THREE.LineLoop(g, new THREE.LineBasicMaterial({ color: 0x999999, transparent: true, opacity: 0.85 }));
        line.userData.id = id;
        mesh.add(line); outlines.push(line);
      });
    });

    // 彩蛋：台灣（在九州西南方，依真實方位擺放）
    {
      const rings = parsePath(TW_PATH);
      const geo = new THREE.ExtrudeGeometry(rings.map(r => new THREE.Shape(r)), { depth: DEPTH, bevelEnabled: false, curveSegments: 1 });
      twMesh = new THREE.Mesh(geo, [new THREE.MeshLambertMaterial({ color: 0xf2e3a6 }), new THREE.MeshBasicMaterial({ color: 0xd8c27c })]);
      const tb = new THREE.Box2().setFromPoints(rings[0]);
      twMesh.userData.main = [[tb.min.x, tb.min.y], [tb.max.x, tb.min.y], [tb.min.x, tb.max.y], [tb.max.x, tb.max.y]];
      twMesh.userData.id = "tw";
      group.add(twMesh);
    }

    // 沖繩縮圖框
    const r = [[70,272],[510,272],[510,534],[70,534]].map(([x,y]) => new THREE.Vector3((x - X0) * S, -(y - Y0) * S, 0.05));
    const frame = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(r), new THREE.LineDashedMaterial({ color: 0x999999, dashSize: 0.8, gapSize: 0.6 }));
    frame.computeLineDistances(); group.add(frame); outlines.push(frame);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.1;
    controls.minDistance = 25; controls.maxDistance = 260;
    // U1：左鍵拖曳＝移動，右鍵或 Shift＋左鍵＝旋轉；手機單指移動、雙指縮放與旋轉
    controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
    controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE };
    controls.screenSpacePanning = false;          // 沿著地面移動，不會往天空飄
    controls.panSpeed = 1.0; controls.rotateSpeed = 0.6;
    // U3：傾斜角度限制在接近正上方到 60 度，左右旋轉限制在 ±60 度
    controls.minPolarAngle = 0.02; controls.maxPolarAngle = Math.PI / 3;
    controls.minAzimuthAngle = -Math.PI / 3; controls.maxAzimuthAngle = Math.PI / 3;
    controls.enableZoom = false;   // 縮放改由下方 zoomAt 處理，以游標或手指位置為中心
    controls.addEventListener("change", () => { needsRender = true; });
    controls.addEventListener("start", () => { anim = null; hideFirstHint(); });

    raycaster = new THREE.Raycaster(); pointer = new THREE.Vector2();
    bindPointer();
    bindZoom();
    new ResizeObserver(resize).observe(box);
    resize();
    recolor();
    loop();
  }

  // ── 取景：讓一組點剛好填滿畫面（用投影結果反覆修正），不動到目前的鏡頭 ──
  let fitPts = null, fullD = 100, bounds = null;
  const DEFAULT_DIR = new THREE.Vector3(0, Math.sin(Math.PI / 4), Math.cos(Math.PI / 4));
  function meshCorners(m){
    m.geometry.computeBoundingBox();
    const bb = m.geometry.boundingBox; m.updateMatrixWorld(true);
    return [[bb.min.x,bb.min.y],[bb.max.x,bb.min.y],[bb.min.x,bb.max.y],[bb.max.x,bb.max.y]]
      .map(([x,y]) => new THREE.Vector3(x, y, DEPTH).applyMatrix4(m.matrixWorld));
  }
  function collectFitPoints(){
    group.updateMatrixWorld(true);
    fitPts = []; Object.values(meshes).forEach(m => fitPts.push(...meshCorners(m)));
    if (twMesh) fitPts.push(...meshCorners(twMesh));
    const bb = new THREE.Box3().setFromPoints(fitPts);
    const pad = bb.getSize(new THREE.Vector3()).multiplyScalar(0.06);
    bounds = { x0: bb.min.x - pad.x, x1: bb.max.x + pad.x, z0: bb.min.z - pad.z, z1: bb.max.z + pad.z };
  }
  function computeFit(world, dir, fillX, fillY){
    const cam = camera.clone();
    const bb = new THREE.Box3().setFromPoints(world);
    const target = bb.getCenter(new THREE.Vector3()); target.y = DEPTH;
    let d = Math.max(bb.getSize(new THREE.Vector3()).length(), 1);
    const v = new THREE.Vector3();
    for (let i = 0; i < 7; i++) {
      cam.position.copy(target).addScaledVector(dir, d);
      cam.lookAt(target); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      world.forEach(p => { v.copy(p).project(cam); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); });
      const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
      const fwd = new THREE.Vector3(-dir.x, 0, -dir.z);
      if (fwd.lengthSq() < 1e-6) fwd.set(0, 0, -1); fwd.normalize();
      const halfH = Math.tan(cam.fov * Math.PI / 360) * d, halfW = halfH * cam.aspect;
      // 沿地面移動目標點，讓投影中心落在畫面中央
      target.addScaledVector(right, (x0 + x1) / 2 * halfW).addScaledVector(fwd, (y0 + y1) / 2 * halfH / Math.max(dir.y, 0.3));
      d *= Math.max((x1 - x0) / fillX, (y1 - y0) / fillY, 1e-3);
    }
    return { target, pos: target.clone().addScaledVector(dir, d), d };
  }
  function currentDir(){ return camera.position.clone().sub(controls.target).normalize(); }

  // ── U5：平滑過場（以球座標內插，旋轉時距離不會忽大忽小）──
  let anim = null;
  function animateTo(target, pos, ms){
    const from = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    const to = new THREE.Spherical().setFromVector3(pos.clone().sub(target));
    let dt = to.theta - from.theta;
    if (dt > Math.PI) to.theta -= 2 * Math.PI; else if (dt < -Math.PI) to.theta += 2 * Math.PI;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    anim = { t0: performance.now(), ms: reduce ? 1 : (ms || 650), ft: controls.target.clone(), tt: target.clone(), from, to };
    needsRender = true;
  }
  function stepAnim(now){
    if (!anim) return;
    const k = Math.min(1, (now - anim.t0) / anim.ms), e = 1 - Math.pow(1 - k, 3);
    controls.target.lerpVectors(anim.ft, anim.tt, e);
    const sp = new THREE.Spherical(
      anim.from.radius + (anim.to.radius - anim.from.radius) * e,
      anim.from.phi + (anim.to.phi - anim.from.phi) * e,
      anim.from.theta + (anim.to.theta - anim.from.theta) * e);
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(sp));
    if (k >= 1) anim = null;
    needsRender = true;
  }

  function resetView(animated){
    if (!fitPts) collectFitPoints();
    const f = computeFit(fitPts, DEFAULT_DIR, 1.86, 1.80);
    fullD = f.d;
    controls.minDistance = fullD * 0.06; controls.maxDistance = fullD * 1.5;
    if (animated) animateTo(f.target, f.pos);
    else { anim = null; camera.position.copy(f.pos); controls.target.copy(f.target); controls.update(); needsRender = true; }
  }

  // ── U6／U7：飛到某個縣或地區（保留目前的旋轉方向）──
  function mainCorners(m){
    m.updateMatrixWorld(true);
    return m.userData.main.map(([x, y]) => new THREE.Vector3(x, y, DEPTH).applyMatrix4(m.matrixWorld));
  }
  function flyToPrefs(ids){
    const pts = []; ids.forEach(id => { if (meshes[id]) pts.push(...mainCorners(meshes[id])); });
    if (!pts.length) return;
    const single = ids.length === 1;
    const f = computeFit(pts, currentDir(), single ? 1.0 : 1.25, single ? 1.0 : 1.2);
    const d = Math.min(fullD * 0.9, Math.max(fullD * (single ? 0.16 : 0.22), f.d));
    animateTo(f.target, f.target.clone().addScaledVector(currentDir(), d));
  }

  // ── U2：移動範圍限制在日本周圍 ──
  // 除了外框，也讓畫面中心不離陸地太遠：越拉近，能離開陸地的距離越小
  let landPts = null;
  function clampTarget(){
    if (!bounds) return;
    if (!landPts) {
      landPts = Object.entries(CENTER).filter(([id]) => meshes[id]).map(([id, [x, y]]) => { const v = new THREE.Vector3((x - X0) * S, -(y - Y0) * S, DEPTH); group.localToWorld(v); return v; });
      if (twMesh) { const c = new THREE.Box3().setFromObject(twMesh).getCenter(new THREE.Vector3()); landPts.push(c); }
    }
    const t = controls.target;
    let cx = Math.min(bounds.x1, Math.max(bounds.x0, t.x)), cz = Math.min(bounds.z1, Math.max(bounds.z0, t.z));
    const dist = camera.position.distanceTo(t);
    const R = Math.tan(camera.fov * Math.PI / 360) * dist * 0.55;
    let best = null, bd = 1e9;
    landPts.forEach(v => { const dd = Math.hypot(v.x - cx, v.z - cz); if (dd < bd) { bd = dd; best = v; } });
    if (best && bd > R) { const k = R / bd; cx = best.x + (cx - best.x) * k; cz = best.z + (cz - best.z) * k; }
    const dx = cx - t.x, dy = DEPTH - t.y, dz = cz - t.z;
    if (Math.abs(dx) + Math.abs(dy) + Math.abs(dz) > 1e-6) { t.x += dx; t.y += dy; t.z += dz; camera.position.x += dx; camera.position.y += dy; camera.position.z += dz; needsRender = true; }
  }

  function resize(){
    const w = box.clientWidth, h = box.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = "100%"; renderer.domElement.style.height = "100%";
    camera.aspect = w / h; camera.updateProjectionMatrix(); needsRender = true;
    box.classList.toggle("narrow", w < 520);
    if (!fitted) { fitted = true; collectFitPoints(); resetView(false); }
  }

  function levelColor(id){
    const c = mode === "eaten" ? (eatenCount[id] || 0) : (allCount[id] || 0);
    if (!c) return mode === "eaten" && wishCount[id] ? cssVar("--wish") : cssVar("--land");
    const lv = mode === "eaten" ? levelEaten(c) : levelAll(c);
    return cssVar("--g" + lv);
  }

  function recolor(){
    if (!scene) return;
    const edge = new THREE.Color(cssVar("--land-edge"));
    const warm = new THREE.Color(cssVar("--warm"));
    Object.entries(meshes).forEach(([id, m]) => {
      id = +id;
      const base = new THREE.Color(levelColor(id));
      const on = lifted.has(id) || current === id || hoverId === id;
      m.material[0].color.copy(base);
      m.material[1].color.copy(base).multiplyScalar(0.74);
      m.material[0].emissive.set(on ? warm : 0x000000);
      m.material[0].emissiveIntensity = on ? 0.12 : 0;
      const lift = (current === id ? 0.9 : 0) + (lifted.has(id) || wideSet.has(id) ? 0.7 : 0) + (hoverId === id ? 0.35 : 0);
      m.position.z = lift;
      m.children.forEach(l => { l.material.color.copy(on || wideSet.has(id) ? warm : edge); });
    });
    outlines.filter(o => !o.userData.id).forEach(o => o.material.color.copy(edge));
    if (twMesh) {
      const tc = new THREE.Color(cssVar(hoverId === "tw" ? "--tw-hover" : "--tw"));
      twMesh.material[0].color.copy(tc); twMesh.material[1].color.copy(new THREE.Color(cssVar("--tw-edge")));
    }
    needsRender = true;
    placeBadges();
  }

  // 圓章（HTML 疊在畫布上）
  let badgeEls = {};
  function rebuildBadges(){
    overlay.innerHTML = ""; badgeEls = {};
    Object.keys(eatenCount).forEach(k => {
      const id = +k;
      const b = document.createElement("button");
      b.type = "button"; b.className = "b3";
      b.setAttribute("aria-label", `${PN[id]} 吃過 ${eatenCount[id]} 個品牌`);
      b.innerHTML = `<span class="n">${eatenCount[id]}</span>${mode === "eaten" ? `<span class="l">${PN[id]}</span>` : ""}`;
      b.addEventListener("click", e => { e.stopPropagation(); focusPref(id); });
      overlay.appendChild(b); badgeEls[id] = b;
    });
    placeBadges();
  }
  const tmpV = new THREE.Vector3();
  function placeBadges(){
    if (!scene || view !== "3d") return;
    const w = box.clientWidth, h = box.clientHeight;
    Object.entries(badgeEls).forEach(([id, el]) => {
      id = +id; const [cx, cy] = CENTER[id];
      const m = meshes[id];
      tmpV.set((cx - X0) * S, -(cy - Y0) * S, DEPTH + (m ? m.position.z : 0) + 0.3);
      group.localToWorld(tmpV); tmpV.project(camera);
      const vis = tmpV.z < 1 && Math.abs(tmpV.x) < 0.98 && Math.abs(tmpV.y) < 0.98;
      if (el.hidden !== !vis) el.hidden = !vis;
      if (vis) {
        const tr = `translate(${Math.round((tmpV.x * 0.5 + 0.5) * w)}px, ${Math.round((-tmpV.y * 0.5 + 0.5) * h)}px)`;
        if (el.dataset.tr !== tr) { el.dataset.tr = tr; el.style.transform = tr; }
      }
    });
  }

  // 以畫面上某一點為中心縮放：游標下的地圖位置保持不動
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -DEPTH);
  function zoomAt(clientX, clientY, f, animated){
    if (!controls) return;
    if (!animated) anim = null;
    const r = renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const P = new THREE.Vector3();
    if (!raycaster.ray.intersectPlane(groundPlane, P)) P.copy(controls.target);
    const dist = camera.position.distanceTo(controls.target);
    const nd = Math.min(controls.maxDistance, Math.max(controls.minDistance, dist * f));
    f = nd / dist;
    if (Math.abs(f - 1) < 1e-4) return;
    const np = camera.position.clone().sub(P).multiplyScalar(f).add(P);
    const nt = controls.target.clone().sub(P).multiplyScalar(f).add(P);
    if (animated) { animateTo(nt, np, 380); return; }
    camera.position.copy(np); controls.target.copy(nt);
    clampTarget(); controls.update(); needsRender = true;
  }
  function bindZoom(){
    const el = renderer.domElement;
    el.addEventListener("wheel", e => {
      e.preventDefault(); hideFirstHint();
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      zoomAt(e.clientX, e.clientY, Math.exp(Math.max(-200, Math.min(200, dy)) * 0.0018));
    }, { passive: false });
    let pinch = null;
    const span = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    el.addEventListener("touchstart", e => { if (e.touches.length === 2) pinch = span(e.touches); }, { passive: true });
    el.addEventListener("touchmove", e => {
      if (e.touches.length !== 2 || !pinch) return;
      const s = span(e.touches); if (!s) return;
      const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2, my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      zoomAt(mx, my, pinch / s); pinch = s;
    }, { passive: true });
    el.addEventListener("touchend", e => { if (e.touches.length < 2) pinch = null; }, { passive: true });
  }

  function pick(ev){
    const r = renderer.domElement.getBoundingClientRect();
    pointer.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(Object.values(meshes).concat(twMesh ? [twMesh] : []), false)[0];
    return hit ? hit.object.userData.id : null;
  }
  function bindPointer(){
    const el = renderer.domElement;
    let down = null;
    el.addEventListener("pointerdown", e => { down = { x: e.clientX, y: e.clientY }; });
    let clickTimer = null;
    el.addEventListener("pointerup", e => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null;
      if (moved > 6 || e.button !== 0) return;
      const id = pick(e);
      clearTimeout(clickTimer);
      // 等一下確認不是雙擊，再執行單擊（篩選＋飛過去）
      if (id === "tw") { clearTimeout(clickTimer); openEgg(); return; }
      clickTimer = setTimeout(() => { if (id && (eatenCount[id] || wishCount[id] || (mode === "all" && allCount[id]))) focusPref(id); }, 260);
    });
    el.addEventListener("dblclick", e => { e.preventDefault(); clearTimeout(clickTimer); hideFirstHint(); zoomAt(e.clientX, e.clientY, 0.5, true); });
    el.addEventListener("contextmenu", e => e.preventDefault());
    el.addEventListener("pointermove", e => {
      if (e.buttons) { tip.hidden = true; return; }
      const id = pick(e);
      if (id !== hoverId) { hoverId = id; recolor(); }
      const has = id === "tw" || (id && (eatenCount[id] || wishCount[id] || (mode === "all" && allCount[id])));
      el.style.cursor = has ? "pointer" : "grab";
      if (id && id !== "tw") {
        const r = box.getBoundingClientRect();
        tip.textContent = `${PN[id]}：品牌 ${allCount[id] || 0} 個，吃過 ${eatenCount[id] || 0} 個`;
        tip.style.transform = `translate(${e.clientX - r.left + 12}px, ${e.clientY - r.top + 12}px)`;
        tip.hidden = false;
      } else tip.hidden = true;
    });
    el.addEventListener("pointerleave", () => { tip.hidden = true; if (hoverId !== null) { hoverId = null; recolor(); } });
  }

  // ── U4：指北針 ──
  const compass = document.getElementById("compass");
  const needle = compass.querySelector(".needle");
  function updateCompass(){
    const t = controls.target;
    const a = t.clone().project(camera), b = t.clone().add(new THREE.Vector3(0, 0, -10)).project(camera);
    const ang = Math.atan2(b.x - a.x, (b.y - a.y) * (box.clientHeight / box.clientWidth || 1));
    needle.style.transform = `rotate(${ang}rad)`;
    compass.classList.toggle("off-north", Math.abs(controls.getAzimuthalAngle()) > 0.02);
  }
  compass.addEventListener("click", () => {
    const sp = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    sp.theta = 0;
    animateTo(controls.target.clone(), controls.target.clone().add(new THREE.Vector3().setFromSpherical(sp)), 500);
  });

  // 第一次開啟的提示：使用者一操作就淡出
  function hideFirstHint(){ hint.classList.add("used"); }

  function loop(){
    requestAnimationFrame(loop);
    if (view !== "3d" || document.hidden) return;
    stepAnim(performance.now());
    controls.update();
    clampTarget();
    if (needsRender) { renderer.render(scene, camera); placeBadges(); updateCompass(); needsRender = false; }
  }

  function setView(v){
    if (v === "3d" && !ok) v = "2d";
    view = v;
    try { localStorage.setItem(VIEW_KEY, v); } catch(e) {}
    card.classList.toggle("is-3d", v === "3d");
    btn2d.setAttribute("aria-pressed", v === "2d"); btn3d.setAttribute("aria-pressed", v === "3d");
    document.getElementById("view-zoom").hidden = v !== "3d"; hint.hidden = v !== "3d";
    if (v === "3d") { if (!scene) build(); else { resize(); recolor(); } rebuildBadges(); needsRender = true; }
  }

  // 串接平面地圖的更新
  const paint2d = paintMap;
  paintMap = function(){ paint2d(); if (scene) { lifted.clear(); wideSet.clear(); recolor(); rebuildBadges(); } };
  const hl2d = hl;
  hl = function(prefs, on){
    hl2d(prefs, on);
    if (!scene) return;
    const set = prefs.length > 1 ? wideSet : lifted;
    prefs.forEach(id => on ? set.add(id) : set.delete(id));
    recolor();
  };
  // 深淺色改變時重新上色
  document.querySelectorAll(".theme button").forEach(b => b.addEventListener("click", () => setTimeout(recolor, 0)));
  try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => setTimeout(recolor, 0)); } catch(e) {}

  btn2d.onclick = () => setView("2d");
  btn3d.onclick = () => setView("3d");
  btnReset.onclick = () => resetView(true);
  window.__resetView3D = () => { if (scene) resetView(true); };
  const fp2d = focusPref;
  focusPref = function(id){
    fp2d(id);
    if (view !== "3d" || !scene) return;
    if (typeof id === "number") flyToPrefs([id]);
    else if (typeof id === "string" && id[0] === "r") {
      const ids = REGIONS[+id.slice(1)][1];
      flyToPrefs(ids.length > 1 ? ids.filter(x => x !== 47) : ids);   // 沖繩在縮圖框裡，不算進九州的取景
    }
    else resetView(true);
  };
  function dolly(f){
    const r = box.getBoundingClientRect();
    zoomAt(r.left + r.width / 2, r.top + r.height / 2, f);
  }
  document.getElementById("zoom-in").onclick = () => dolly(0.7);
  document.getElementById("zoom-out").onclick = () => dolly(1.4);
  if (matchMedia("(pointer: coarse)").matches) hint.textContent = "單指拖曳移動・雙指縮放與旋轉・點縣市飛過去・指北針轉回正北";
  setView(view);
  if (!ok) { hint.hidden = false; hint.textContent = "這個瀏覽器無法顯示 3D 地圖，已改用平面地圖。"; }
};
