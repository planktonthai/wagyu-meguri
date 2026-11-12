const PATHS = __PATHS__;
const CENTER = __CENTERS__;
const ALL = __ALL__;
const PN = ALL.prefNames;
const REGIONS = [
  ["北海道",[1]], ["東北",[2,3,4,5,6,7]], ["關東",[8,9,10,11,12,13,14]],
  ["中部",[15,16,17,18,19,20,21,22,23]], ["近畿",[24,25,26,27,28,29,30]],
  ["中國・四國",[31,32,33,34,35,36,37,38,39]], ["九州・沖繩",[40,41,42,43,44,45,46,47]]
];
const KYUSHU = [40,41,42,43,44,45,46];
const TOHOKU = [2,3,4,5,6,7];

// ── 品牌知識庫：名稱對得上時，卡片會顯示這段介紹 ──
const KB = __KB__;
const KB_WIDE = __KBWIDE__;

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

// ── 中日文名稱比對：把寫法統一成同一個比對鍵 ──
const VARIANT = {"澤":"沢","驒":"騨","姬":"姫","縣":"県","廣":"広","兒":"児","黑":"黒","豐":"豊","濱":"浜","戶":"戸","來":"来","國":"国","關":"関","會":"会","龜":"亀","藏":"蔵","櫻":"桜","德":"徳","奧":"奥","壹":"壱","氣":"気","讚":"讃","繩":"縄","絲":"糸","帶":"帯","萬":"万","髙":"高","嶋":"島","圓":"円","滿":"満","實":"実","鄉":"郷","丑":"牛","臺":"台","靜":"静","區":"区","岡":"岡"};
const KANA_PLACE = [["かみふらの","上富良野"],["ふらの","富良野"],["びえい","美瑛"],["さろま","佐呂間"],["とかち","十勝"],["しらおい","白老"],["びらとり","平取"],["いわて","岩手"],["あおもり","青森"],["あきた","秋田"],["やまがた","山形"],["ふくしま","福島"],["とちぎ","栃木"],["いばらき","茨城"],["ぐんま","群馬"],["かずさ","上総"],["しずおか","静岡"],["みかわ","三河"],["あいち","愛知"],["みえ","三重"],["おうみ","近江"],["こうべ","神戸"],["たじま","但馬"],["さんだ","三田"],["ひめじ","姫路"],["とっとり","鳥取"],["しまね","島根"],["いずも","出雲"],["おかやま","岡山"],["ひろしま","広島"],["とくしま","徳島"],["さぬき","讃岐"],["とさ","土佐"],["くまもと","熊本"],["おおいた","大分"],["みやざき","宮崎"],["かごしま","鹿児島"],["おきなわ","沖縄"],["いしがき","石垣"],["にいがた","新潟"],["とやま","富山"],["のと","能登"],["わかさ","若狭"],["よこはま","横浜"],["はかた","博多"],["ながさき","長崎"],["ひたち","常陸"],["せんだい","仙台"],["まえざわ","前沢"],["よねざわ","米沢"],["ひだ","飛騨"],["まつさか","松阪"],["ほうらい","鳳来"],["とうはく","東伯"],["かどさき","門崎"],["さつま","薩摩"],["ろっこう","六甲"],["ようざん","鷹山"],["ぎんざん","銀山"],["ゆきみ","雪美"],["とよみ","豊美"],["ぶんご","豊後"],["おだ","小田"],["もとぶ","本部"]];
const MEANING = [["葡萄酒","わいん"],["紅酒","わいん"],["橄欖","おりーぶ"],["褐毛","あか"],["赤","あか"]];
const PREF_JA = ["北海道","青森","岩手","宮城","秋田","山形","福島","茨城","栃木","群馬","埼玉","千葉","東京","神奈川","新潟","富山","石川","福井","山梨","長野","岐阜","静岡","愛知","三重","滋賀","京都","大阪","兵庫","奈良","和歌山","鳥取","島根","岡山","広島","山口","徳島","香川","愛媛","高知","福岡","佐賀","長崎","熊本","大分","宮崎","鹿児島","沖縄"];
const SUFFIX = /(黒毛和牛|和牛肉|牛肉|和牛|わぎゅう|ぎゅう|うし|びーふ|牛|肉)$/;
const unify = s => [...String(s || "").normalize("NFKC").toLowerCase()].map(c => VARIANT[c] || c).join("");
function nameKey(raw){
  let s = String(raw || "").normalize("NFKC").toLowerCase();
  s = s.replace(/（[^）]*）|\([^)]*\)|「[^」]*」/g, "");
  s = s.replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
  s = [...s].map(c => VARIANT[c] || c).join("");
  s = s.replace(/[\s・·、,，.。\-_／\/]/g, "");
  s = s.split("ゆたか").join("");
  KANA_PLACE.forEach(([k,v]) => { s = s.split(k).join(v); });
  MEANING.forEach(([k,v]) => { s = s.split(k).join(v); });
  s = s.replace(/^(.{2,4}?)(県|都|府)/, "$1");
  for (let i = 0; i < 3; i++) { const t = s.replace(SUFFIX, ""); if (t === s || !t) break; s = t; }
  const pre = PREF_JA.find(pr => s.startsWith(pr) && s.length > pr.length + 1);
  if (pre) s = s.slice(pre.length);
  return s;
}
function similarity(a, b){
  const ka = nameKey(a), kb = nameKey(b);
  if (!ka || !kb) return 0;
  if (ka === kb) return 2;
  const [sh, lo] = ka.length <= kb.length ? [ka, kb] : [kb, ka];
  return sh.length >= 2 && lo.includes(sh) ? 1 : 0;
}

// ── 地區名稱對應 47 都道府縣（也接受九州、東北等大區） ──
function regionKey(raw){
  let s = unify(raw).replace(/[\s・·、,，「」『』"'（）()]/g, "");
  s = s.replace(/(地方|地区)$/, "");
  if (s !== "北海道" && s.length > 2) s = s.replace(/(県|都|府)$/, "");
  return s;
}
const PREF_KEYS = {};
for (let i = 1; i <= 47; i++) { PREF_KEYS[regionKey(PREF_JA[i-1])] = i; PREF_KEYS[regionKey(PN[i])] = i; }
PREF_KEYS["北海"] = 1;
const AREAS = { "東北": TOHOKU, "関東": [8,9,10,11,12,13,14], "中部": [15,16,17,18,19,20,21,22,23], "北陸": [15,16,17,18], "甲信越": [15,19,20], "東海": [21,22,23,24],
  "近畿": [24,25,26,27,28,29,30], "関西": [24,25,26,27,28,29,30], "中国": [31,32,33,34,35], "四国": [36,37,38,39], "中国四国": [31,32,33,34,35,36,37,38,39],
  "九州": KYUSHU, "九州沖縄": [40,41,42,43,44,45,46,47] };
const AREA_KEYS = {}; Object.keys(AREAS).forEach(k => { AREA_KEYS[regionKey(k)] = k; });
const WIDE_AREAS = ["九州", "東北"];
function resolveRegion(raw){
  const k = regionKey(raw);
  if (!k) return null;
  if (PREF_KEYS[k]) return { pref: PREF_KEYS[k] };
  if (AREA_KEYS[k]) { const a = AREA_KEYS[k]; return { area: a, ids: AREAS[a] }; }
  return { bad: String(raw).trim() };
}
const areaLabel = a => ({ "関東": "關東", "関西": "關西", "中国": "中國", "四国": "四國", "中国四国": "中國・四國", "九州沖縄": "九州・沖繩" }[a] || a);

// ── 你的清單（存在瀏覽器） ──
const STORE = "wagyu-entries-v2";
const SAMPLE = () => [{ id: "sample-shiraoi", n: "白老牛", p: 1 }];
let seq = 0;
const newId = () => "e" + Date.now().toString(36) + (seq++).toString(36);
let ENTRIES;
(function load(){
  try {
    const v = JSON.parse(localStorage.getItem(STORE));
    if (Array.isArray(v)) {
      ENTRIES = v.filter(e => e && typeof e.n === "string" && e.n.trim());
      // 舊版把「待確認」的原因存在 note，搬到 why
      ENTRIES.forEach(e => { if (e.pending && e.note && !e.why) { e.why = e.note; delete e.note; } });
      return;
    }
    const old = JSON.parse(localStorage.getItem("wagyu-custom") || "null");
    ENTRIES = SAMPLE();
    if (Array.isArray(old)) old.forEach(c => { if (c && c.n && +c.p >= 1 && +c.p <= 47) ENTRIES.push({ id: newId(), n: c.n, p: +c.p, city: c.city || "", b: c.b || "", note: c.note || "" }); });
  } catch(e) { ENTRIES = SAMPLE(); }
})();
function save(){
  if (VIEW) return true;   // 看朋友的地圖時不寫入自己的清單
  try { localStorage.setItem(STORE, JSON.stringify(ENTRIES)); return true; }
  catch(e) { showMsg("這個瀏覽器無法儲存資料，重新整理後清單會消失。請先用「匯出清單」備份。", true); return false; }
}
const placed = () => ENTRIES.filter(e => !e.pending && !e.wish);
const wishes = () => ENTRIES.filter(e => !e.pending && e.wish);
const pendingList = () => ENTRIES.filter(e => e.pending);

// ── 資料庫查詢 ──
function dbRowFor(e){ return e.p ? ALL.rows.find(r => r.p === e.p && similarity(r.n, e.n) === 2) : null; }
function kbFor(e){
  if (e.wide) return KB_WIDE.find(k => similarity(k.n, e.n) === 2) || null;
  return KB.find(k => k.p === e.p && similarity(k.n, e.n) === 2) || null;
}
function wideFor(name){ return ALL.wide.find(w => similarity(w.n, name) === 2) || KB_WIDE.find(k => similarity(k.n, name) === 2) || null; }
// 依品牌名稱找出可能的縣；先找寫法完全對得上的，再找名稱相近的
function lookup(name, ids){
  for (const level of [2, 1]) {
    const hits = [];
    ALL.rows.forEach(r => { if ((!ids || ids.includes(r.p)) && similarity(name, r.n) >= level) hits.push({ p: r.p, n: r.n }); });
    KB.forEach(k => { if ((!ids || ids.includes(k.p)) && similarity(name, k.n) >= level) hits.push({ p: k.p, n: k.n }); });
    const prefs = [...new Set(hits.map(h => h.p))];
    if (prefs.length) return { level, prefs, hits };
  }
  return null;
}

// ── 解析匯入文字 ──
const HEADER = new Set(["地區","地区","地域","縣","県","都道府縣","都道府県","region","prefecture"]);
function splitBrands(s){ return String(s).split(/[、,，;；\/／]+/).map(x => x.trim().replace(/^["'「『]+|["'」』]+$/g, "").trim()).filter(Boolean); }

// 個人欄位：品牌後面用「｜」接，例如「山形：米澤牛｜日期 2026-04｜評分 5｜地點 米澤牛亭」
const FIELD_KEYS = { "日期": "date", "時間": "date", "評分": "rating", "星等": "rating", "地點": "place", "店家": "place", "餐廳": "place", "產地": "city", "品種": "b", "備註": "note" };
const FIELD_RE = /^(日期|時間|評分|星等|地點|店家|餐廳|產地|品種|備註)\s*[：:]?\s*(.*)$/;
const FIELD_NAME = { date: "日期", rating: "評分", place: "地點", city: "產地", b: "品種", note: "備註" };
const FIELD_ORDER = ["date", "rating", "place", "city", "b", "note"];
function normDate(raw){
  const s = String(raw).normalize("NFKC").trim();
  let m = s.match(/^(\d{4})\s*[-\/.年]\s*(\d{1,2})\s*(?:[-\/.月]\s*(\d{1,2})\s*日?|月)?$/);
  if (m) {
    const mo = +m[2]; if (mo < 1 || mo > 12) return null;
    if (m[3]) { const d = +m[3]; if (d < 1 || d > 31) return null; return `${m[1]}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`; }
    return `${m[1]}-${String(mo).padStart(2, "0")}`;
  }
  m = s.match(/^(\d{4})\s*年?$/);
  return m ? m[1] : null;
}
function normRating(raw){
  const s = String(raw).normalize("NFKC");
  const d = s.match(/\d+(\.\d+)?/);
  if (d) { const n = Math.round(parseFloat(d[0])); return n >= 1 && n <= 5 ? n : null; }
  const st = (s.match(/[★⭐]/g) || []).length;
  return st >= 1 && st <= 5 ? st : null;
}
function parseFields(parts){
  const f = {}, bad = [];
  parts.forEach(p => {
    p = p.trim(); if (!p) return;
    const m = p.match(FIELD_RE);
    if (!m) { bad.push(p); return; }
    const k = FIELD_KEYS[m[1]], v = m[2].trim();
    if (!v) return;
    if (k === "date") { const d = normDate(v); if (d) f.date = d; else bad.push(p); }
    else if (k === "rating") { const r = normRating(v); if (r) f.rating = r; else bad.push(p); }
    else f[k] = v.slice(0, k === "note" ? 120 : 40);
  });
  return { f, bad };
}
function parseText(txt){
  const items = [];
  let wish = false;
  String(txt).replace(/^﻿/, "").split(/\r?\n/).forEach((raw, i) => {
    let line = raw.trim();
    if (!line || line.startsWith("//")) return;
    if (line.startsWith("@")) return;                 // 分享連結裡的名字
    if (line.startsWith("#")) {                       // 「# 想吃」以下是想吃清單，「# 吃過」切回來
      const h = line.replace(/^#+/, "").trim();
      if (/想吃|願望|wish/i.test(h)) wish = true; else if (/吃過|eaten/i.test(h)) wish = false;
      return;
    }
    line = line.replace(/^(?:[-*•‧・]\s*|\d+\s*[.、．)）]\s*)/, "").replace(/^"(.*)"$/, "$1").trim();
    const parts = line.split(/[｜|]/);
    line = parts.shift().trim();
    if (!line) return;
    const { f, bad } = parseFields(parts);
    const m = line.match(/^([^：:\t,，]*)([：:\t,，])(.*)$/);
    let regionRaw = "", region = null, brands;
    if (m) {
      const left = m[1].trim(), sep = m[2], right = m[3];
      if (HEADER.has(left.toLowerCase())) return;
      const r = resolveRegion(left);
      if (r && (r.pref || r.area)) { regionRaw = left; region = r; brands = splitBrands(right); }
      else if (sep === "：" || sep === ":") { regionRaw = left; region = r; brands = splitBrands(right); }
      else brands = splitBrands(line);
    } else brands = splitBrands(line);
    brands.forEach(b => items.push({ line: i + 1, raw, regionRaw, region, brand: b, wish, fields: f, badFields: bad }));
  });
  return items;
}

// ── 分析每一筆：要放哪個縣、有沒有重複 ──
function analyze(items, list){
  list = list || ENTRIES;
  const seen = new Set();
  return items.map(it => {
    const name = it.brand.slice(0, 40), R = it.region;
    const res = { line: it.line, name, regionRaw: it.regionRaw, p: 0, wide: null, cands: [], status: "add", note: "", wish: !!it.wish, fields: { ...(it.fields || {}) } };
    const setPending = (cands, note) => { res.status = "pending"; res.cands = cands || []; res.note = note; };
    if (R && R.pref) {
      res.p = R.pref;
      const c = lookup(name);
      if (c && c.level === 2 && !c.prefs.includes(R.pref)) { res.status = "warn"; res.note = `資料庫中的「${c.hits[0].n}」在${PN[c.prefs[0]]}，這裡依你寫的放在${PN[R.pref]}`; }
    } else if (R && R.area) {
      const c = lookup(name, R.ids), w = wideFor(name);
      if (c && c.prefs.length === 1) { res.p = c.prefs[0]; res.note = `「${areaLabel(R.area)}」依資料庫對應到${PN[res.p]}`; }
      else if (w && WIDE_AREAS.includes(R.area)) { res.wide = R.area; res.note = `${areaLabel(R.area)}的跨縣品牌`; }
      else if (c) setPending(c.prefs, `「${areaLabel(R.area)}」有好幾個縣都有相近的品牌，請選縣`);
      else setPending(R.ids, `只寫了「${areaLabel(R.area)}」，資料庫找不到這個品牌，請選縣`);
    } else {
      const w = wideFor(name);
      const c = lookup(name);
      if (c && c.level === 2 && c.prefs.length === 1) { res.p = c.prefs[0]; res.note = (R && R.bad ? `地區「${R.bad}」對不上，` : "") + `依資料庫對應到${PN[res.p]}`; if (R && R.bad) res.status = "warn"; }
      else if (w) { res.wide = w.w ? (w.w.startsWith("東北") ? "東北" : "九州") : (w.area || "九州"); res.note = `${res.wide}的跨縣品牌`; }
      else if (c && c.prefs.length === 1) { res.p = c.prefs[0]; res.status = "warn"; res.note = `依相近名稱「${c.hits[0].n}」對應到${PN[res.p]}，請確認`; }
      else if (c) setPending(c.prefs, `好幾個縣都有相近的品牌（${c.prefs.map(p => PN[p]).join("、")}），請選縣`);
      else setPending([], R && R.bad ? `地區「${R.bad}」對不上，資料庫也找不到這個品牌，請選縣` : "資料庫找不到這個品牌，請選縣");
    }
    if (it.badFields && it.badFields.length) {
      const t = `看不懂的欄位已略過：${it.badFields.join("、")}`;
      res.note = res.note ? res.note + "；" + t : t;
      if (res.status === "add") res.status = "warn";
    }
    // 重複檢查：吃過清單、想吃清單、這次貼上的內容
    const at = e => res.p ? (e.p === res.p && !e.pending) : res.wide ? e.wide === res.wide : !!e.pending;
    const hitE = list.find(e => at(e) && !e.wish && similarity(e.n, name) === 2);
    const hitW = list.find(e => at(e) && e.wish && similarity(e.n, name) === 2);
    if (res.wish) {
      if (hitE) { res.status = "dup"; res.note = "已經吃過了，略過"; }
      else if (hitW) { res.status = "dup"; res.note = "已在想吃清單，略過"; }
    } else if (hitE) {
      const missing = Object.keys(res.fields).filter(k => !hitE[k]);
      if (missing.length) { res.status = "update"; res.target = hitE.id; res.note = "已在清單裡，補上" + missing.map(k => FIELD_NAME[k]).join("、"); }
      else { res.status = "dup"; res.note = "已在你的清單裡，略過"; }
    } else if (hitW) { res.status = "move"; res.target = hitW.id; res.note = "從想吃清單移到吃過"; }
    const key = (res.wish ? "w" : "e") + "|" + (res.p || res.wide || "?") + "|" + nameKey(name);
    if (res.status !== "dup" && seen.has(key)) { res.status = "dup"; res.note = "這次貼上的內容裡重複，略過"; }
    seen.add(key);
    return res;
  });
}
// 把預覽結果寫進清單（匯入、看朋友的地圖都用這個）
function applyPreview(res, list){
  const c = { added: 0, wish: 0, pend: 0, moved: 0, updated: 0 };
  res.forEach(x => {
    if (x.status === "dup") return;
    if (x.status === "move" || x.status === "update") {
      const e = list.find(e => e.id === x.target); if (!e) return;
      if (x.status === "move") { delete e.wish; Object.assign(e, x.fields); c.moved++; }
      else { Object.keys(x.fields).forEach(k => { if (!e[k]) e[k] = x.fields[k]; }); c.updated++; }
      return;
    }
    const base = { id: newId(), n: x.name, ...x.fields };
    if (x.wish) base.wish = true;
    if (x.status === "pending") { list.push({ ...base, p: 0, pending: true, cands: x.cands.slice(0, 8), why: x.note }); c.pend++; return; }
    if (x.wide) list.push({ ...base, p: 0, wide: x.wide }); else list.push({ ...base, p: x.p });
    if (x.wish) c.wish++; else c.added++;
  });
  return c;
}

// ── 計數 ──
let eatenCount = {}, allCount = {}, wishCount = {}, TOTAL_EATEN = 0, DB_EATEN = 0;
function recount(){
  eatenCount = {}; allCount = {}; wishCount = {};
  placed().forEach(e => { if (e.p) eatenCount[e.p] = (eatenCount[e.p] || 0) + 1; });
  wishes().forEach(e => { if (e.p) wishCount[e.p] = (wishCount[e.p] || 0) + 1; });
  ALL.rows.forEach(r => allCount[r.p] = (allCount[r.p] || 0) + 1);
  const extra = new Set();
  placed().concat(wishes()).forEach(e => { if (e.p && !dbRowFor(e)) extra.add(e.p + "|" + nameKey(e.n)); });
  extra.forEach(k => { const p = +k.split("|")[0]; allCount[p] = (allCount[p] || 0) + 1; });
  TOTAL_EATEN = placed().length;
  DB_EATEN = ALL.rows.filter(r => placed().some(e => e.p === r.p && similarity(e.n, r.n) === 2)).length
    + ALL.wide.filter(w => placed().some(e => e.wide && similarity(e.n, w.n) === 2)).length;
}
recount();

let mode = "eaten", current = null, query = "";
try { const m = localStorage.getItem("wagyu-mode"); if (m === "all" || m === "eaten") mode = m; } catch(e) {}

// ── 2D 地圖 ──
const svg = document.getElementById("map");
const NS = "http://www.w3.org/2000/svg";
const el = (tag, attrs={}) => { const e=document.createElementNS(NS,tag); for(const k in attrs) e.setAttribute(k, attrs[k]); return e; };
const g0 = el("g");
g0.append(el("rect",{x:70,y:272,width:440,height:262,rx:8,class:"inset-box"}));
const it0 = el("text",{x:84,y:298,class:"inset-label"}); it0.textContent="沖繩"; g0.append(it0);
svg.append(g0);
const prefEls = {};
const gp = el("g");
Object.entries(PATHS).forEach(([id,d]) => {
  id = +id; if(!d) return;
  const p = el("path",{d, class:"pref", "data-id":id});
  p.append(el("title"));
  p.addEventListener("click", () => { if (p.classList.contains("has")) focusPref(id); });
  prefEls[id] = p; gp.append(p);
});
svg.append(gp);
// ── 彩蛋：日本左下方的小台灣，點了會跳出卡片 ──
const TW_PATH = "M-52.4,1239.7L-53.8,1242.8L-54.9,1246.2L-55.3,1249.4L-55.3,1252.6L-55.6,1255.5L-56.1,1258.4L-58.2,1257.6L-59.4,1255.5L-59.7,1252.1L-61.2,1248.0L-61.8,1246.8L-64.0,1244.5L-66.0,1243.3L-67.6,1241.6L-67.4,1241.8L-68.5,1239.5L-69.4,1237.0L-71.2,1230.1L-71.8,1228.4L-72.6,1226.9L-72.9,1225.4L-72.6,1223.7L-71.8,1221.2L-71.4,1218.7L-71.8,1215.2L-71.6,1211.8L-71.0,1210.3L-60.8,1189.5L-57.9,1185.1L-56.2,1182.9L-54.8,1180.5L-53.4,1177.4L-51.7,1174.5L-50.5,1173.7L-44.6,1171.1L-42.8,1168.7L-41.3,1167.9L-39.7,1168.0L-38.6,1169.2L-37.6,1170.5L-36.6,1171.3L-34.0,1172.6L-32.8,1173.9L-32.4,1176.1L-33.9,1178.2L-34.7,1180.2L-34.9,1182.3L-34.6,1185.1L-34.6,1188.0L-36.5,1194.7L-38.7,1198.9L-39.2,1201.0L-39.9,1206.2L-41.2,1211.4L-42.2,1217.9L-43.9,1224.7L-45.0,1227.6L-46.2,1230.3L-49.1,1235.4L-52.4,1239.7Z";
const twEl = el("path", { d: TW_PATH, class: "tw", tabindex: "0", role: "button", "aria-label": "台灣" });
twEl.addEventListener("click", () => openEgg());
twEl.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openEgg(); } });
svg.append(twEl);
const gl = el("g"); svg.append(gl);
const egg = document.getElementById("egg");
let eggReturn = null;
function openEgg(){
  eggReturn = document.activeElement;
  egg.hidden = false;
  document.getElementById("egg-close").focus({ preventScroll: true });
  // 彈窗固定蓋在地圖中央；地圖不在畫面內時捲過去
  const r = egg.getBoundingClientRect();
  if (r.top < 0 || r.bottom > innerHeight) egg.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}
function closeEgg(){ if (egg.hidden) return; egg.hidden = true; if (eggReturn && eggReturn.focus) eggReturn.focus({ preventScroll: true }); }
document.getElementById("egg-close").onclick = closeEgg;
document.addEventListener("keydown", e => { if (e.key === "Escape") closeEgg(); });
document.addEventListener("pointerdown", e => { if (!egg.hidden && !egg.contains(e.target) && !e.target.closest(".tw") && !e.target.closest("#map3d canvas")) closeEgg(); });

function levelEaten(c){ return c>=4?4 : c>=3?3 : c; }
function levelAll(c){ return c>=10?4 : c>=5?3 : c>=3?2 : 1; }

function paintMap(){
  Object.entries(prefEls).forEach(([id,p]) => {
    id=+id;
    const c = mode==="eaten" ? (eatenCount[id]||0) : (allCount[id]||0);
    const lv = c ? (mode==="eaten" ? levelEaten(c) : levelAll(c)) : 0;
    const w = mode==="eaten" && !c && wishCount[id] ? " has wish" : "";
    p.setAttribute("class", "pref" + (c ? ` has c${lv}` : w) + (current===id ? " on" : ""));
    p.querySelector("title").textContent = `${PN[id]}：品牌 ${allCount[id]||0} 個，吃過 ${eatenCount[id]||0} 個` + (wishCount[id] ? `，想吃 ${wishCount[id]} 個` : "");
  });
  gl.innerHTML = "";
  Object.keys(eatenCount).forEach(k => {
    const id=+k, [x,y]=CENTER[id];
    const b = el("g",{class:"badge",tabindex:"0",role:"button","aria-label":`${PN[id]} 吃過 ${eatenCount[id]} 個品牌`});
    b.append(el("circle",{cx:x,cy:y,r:13}));
    const t=el("text",{x,y}); t.textContent=eatenCount[id]; b.append(t);
    b.addEventListener("click",()=>focusPref(id));
    b.addEventListener("keydown",e=>{ if(e.key==="Enter"||e.key===" "){e.preventDefault();focusPref(id);} });
    if (mode==="eaten") { const lab=el("text",{x:x+17,y:y+5,class:"pref-label"}); lab.textContent=PN[id]; gl.append(lab); }
    gl.append(b);
  });
}

function renderHeader(){
  const who = VIEW ? `${VIEW.name || "朋友"}的和牛地圖` : "我的和牛地圖";
  document.getElementById("page-title").textContent = who;
  document.title = who;
  document.getElementById("sub").textContent = VIEW
    ? "這是朋友分享的地圖，只能看、不能改。想留著的話，按「存到我的清單」。"
    : mode==="eaten"
      ? "把吃過的和牛品牌標在日本地圖上。按「匯入清單」一次貼上整份清單，格式是「地區：品牌」，也可以只寫品牌，網站會自動對應到縣。"
      : "全日本 47 都道府縣的品牌牛參考清單。縣的顏色越深，品牌越多；圓章是吃過的數量。按「吃過」「想吃」可以直接加到清單。";
  const prefs = Object.keys(eatenCount).length;
  const allTotal = ALL.rows.length + ALL.wide.length + placed().concat(wishes()).filter(e => e.p && !dbRowFor(e)).length;
  const got = badgeState().filter(b => b.done).length;
  document.getElementById("stats").innerHTML = mode==="eaten"
    ? `<div class="stat"><b>${TOTAL_EATEN}</b><span>吃過的品牌</span></div><div class="stat"><b>${prefs}<small>／47</small></b><span>縣・道</span></div><div class="stat"><b>${wishes().length}</b><span>想吃</span></div><div class="stat"><b>${got}<small>／${BADGES.length}</small></b><span>成就</span></div>`
    : `<div class="stat"><b>${allTotal}</b><span>收錄品牌</span></div><div class="stat"><b>47</b><span>都道府縣</span></div><div class="stat"><b>${TOTAL_EATEN}</b><span>吃過</span></div>`;
  document.getElementById("legend").innerHTML = mode==="eaten"
    ? `<span><i style="background:var(--g1)"></i>1 個品牌</span><span><i style="background:var(--g2)"></i>2</span><span><i style="background:var(--g3)"></i>3</span><span><i style="background:var(--g4)"></i>4 以上</span><span><i style="background:var(--wish)"></i>只有想吃</span><span><i style="background:var(--land)"></i>尚未吃過</span>`
    : `<span><i style="background:var(--g1)"></i>1–2 個品牌</span><span><i style="background:var(--g2)"></i>3–4</span><span><i style="background:var(--g3)"></i>5–9</span><span><i style="background:var(--g4)"></i>10 以上</span><span><i class="dot"></i>吃過的數量</span>`;
  document.getElementById("foot").textContent = mode==="eaten"
    ? "品牌介紹與產地依品牌官網、日本農政與縣政資料整理。你的清單只存在這個瀏覽器，換裝置請用「匯出清單」和「匯入清單」。"
    : "清單合併維基百科「日本のブランド牛一覧」、brand-meat.com 與 penguin-toyu.net 三份公開整理。日本實際的品牌牛超過這個數量，這份是參考用。品種只在來源有寫明時標示。";
  document.getElementById("mode-eaten").setAttribute("aria-pressed", mode==="eaten");
  document.getElementById("mode-all").setAttribute("aria-pressed", mode==="all");
  document.getElementById("search").hidden = mode!=="all";
}

const toolbar = document.getElementById("toolbar");
function renderToolbar(){
  toolbar.innerHTML = "";
  const mk = (label, id, pressed, fn) => { const c=document.createElement("button"); c.type="button"; c.className="chip"; c.id=id; c.textContent=label; c.setAttribute("aria-pressed", pressed); c.onclick=fn; toolbar.append(c); };
  mk("全部", "chip-all", current===null, ()=>focusPref(null));
  REGIONS.forEach(([r],i)=> mk(r, "chip-r"+i, current==="r"+i, ()=>focusPref("r"+i)));
  if(typeof current==="number"){ const s=document.createElement("span"); s.className="focus-note"; s.textContent=`目前顯示：${PN[current]}`; toolbar.append(s); }
}

function hl(prefs, on){
  prefs.forEach(id => { const p=prefEls[id]; if(!p) return; p.classList.toggle(prefs.length>1?"wide-hl":"on", on); });
  if(!on && typeof current==="number") prefEls[current]?.classList.add("on");
}

function inScope(regionIdx, id){
  if (current===null) return true;
  if (typeof current==="number") return id===current;
  return current==="r"+regionIdx;
}
const ALT_BREEDS = ["交雜種","乳用種","其他／混合","其他","褐毛和種","日本短角種","無角和種"];
const entryPrefs = e => e.wide ? AREAS[e.wide] : [e.p];

// ── 成就徽章 ──
function breedOf(e){ const kb = kbFor(e), row = dbRowFor(e); return e.b || (kb && kb.b) || (row && row.t) || ""; }
function hasBrand(p, names){ return placed().some(e => e.p === p && names.some(n => similarity(e.n, n) === 2)); }
const BADGES = [
  { id: "n1", mark: "初", name: "初嚐和牛", desc: "吃過 1 個品牌", goal: 1, val: s => s.n },
  { id: "n10", mark: "十", name: "和牛通", desc: "吃過 10 個品牌", goal: 10, val: s => s.n },
  { id: "n30", mark: "卅", name: "和牛達人", desc: "吃過 30 個品牌", goal: 30, val: s => s.n },
  { id: "n50", mark: "極", name: "和牛大師", desc: "吃過 50 個品牌", goal: 50, val: s => s.n },
  { id: "big3", mark: "三", name: "日本三大和牛", desc: "松阪牛、神戶牛，加上近江牛或米澤牛", goal: 3, val: () => (hasBrand(24, ["松阪牛"]) ? 1 : 0) + (hasBrand(28, ["神戸ビーフ", "神戸牛"]) ? 1 : 0) + (hasBrand(25, ["近江牛"]) || hasBrand(6, ["米沢牛"]) ? 1 : 0) },
  { id: "hokkaido", mark: "道", name: "北海道巡禮", desc: "吃過 5 個北海道品牌", goal: 5, val: s => s.cnt[1] || 0 },
  { id: "ns", mark: "縱", name: "南北縱貫", desc: "北海道和沖繩都吃過", goal: 2, val: s => (s.cnt[1] ? 1 : 0) + (s.cnt[47] ? 1 : 0) },
  ...REGIONS.slice(1).map(([r, ids]) => ({ id: "r-" + r, mark: r[0], name: `${r}制霸`, desc: `${r}的 ${ids.length} 個縣都吃過`, goal: ids.length, val: s => ids.filter(i => s.cnt[i]).length })),
  { id: "all47", mark: "全", name: "47 縣全制霸", desc: "47 都道府縣都吃過", goal: 47, val: s => Object.keys(s.cnt).length },
  { id: "rare", mark: "褐", name: "不只黑毛", desc: "吃過褐毛和種、日本短角種或無角和種", goal: 1, val: () => placed().some(e => ["褐毛和種", "日本短角種", "無角和種"].includes(breedOf(e))) ? 1 : 0 },
  { id: "critic", mark: "評", name: "美食評論家", desc: "10 個品牌有評分", goal: 10, val: () => placed().filter(e => e.rating).length }
];
function badgeState(){
  const s = { n: TOTAL_EATEN, cnt: eatenCount };
  return BADGES.map(b => { const v = Math.min(b.goal, b.val(s)); return { ...b, v, done: v >= b.goal }; });
}
let badgeNote = "";
function checkBadges(){
  if (VIEW) return;
  const done = badgeState().filter(b => b.done);
  let seen = null;
  try { seen = JSON.parse(localStorage.getItem("wagyu-badges") || "null"); } catch(e) {}
  const ids = done.map(b => b.id);
  if (Array.isArray(seen)) {
    const fresh = done.filter(b => !seen.includes(b.id));
    if (fresh.length) badgeNote = `解鎖成就：${fresh.map(b => b.name).join("、")}`;
  }
  try { localStorage.setItem("wagyu-badges", JSON.stringify(ids)); } catch(e) {}
}

// ── 收集進度 ──
let badgesOpen = false;
function renderProgress(list){
  if (current !== null || !ENTRIES.length) return;
  const prefs = Object.keys(eatenCount).length, dbTotal = ALL.rows.length + ALL.wide.length;
  const bs = badgeState(), got = bs.filter(b => b.done).length;
  const pct = (a, b) => Math.round(a / b * 100);
  const sec = document.createElement("section"); sec.className = "box prog";
  sec.innerHTML = `<div class="prog-item"><div class="prog-row"><span>已解鎖的縣・道</span><b>${prefs}／47</b></div><div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="47" aria-valuenow="${prefs}"><i style="width:${pct(prefs, 47)}%"></i></div></div>
    <div class="prog-item"><div class="prog-row"><span>吃過資料庫裡的品牌</span><b>${DB_EATEN}／${dbTotal}</b></div><div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${dbTotal}" aria-valuenow="${DB_EATEN}"><i style="width:${pct(DB_EATEN, dbTotal)}%"></i></div></div>
    <div class="prog-row"><span>成就 <b>${got}／${bs.length}</b></span><button type="button" class="btn small" id="toggle-badges" aria-expanded="${badgesOpen}">${badgesOpen ? "收起成就" : "看全部成就"}</button></div>
    <div class="badges" id="badges"${badgesOpen ? "" : " hidden"}>${bs.map(b => `<div class="bdg${b.done ? " done" : ""}"><span class="mk" aria-hidden="true">${b.mark}</span><span class="tx"><b>${b.name}</b><small>${b.desc}</small><small class="pg">${b.done ? "已解鎖" : `${b.v}／${b.goal}`}</small></span></div>`).join("")}</div>`;
  sec.querySelector("#toggle-badges").onclick = () => { badgesOpen = !badgesOpen; render(); };
  list.append(sec);
}

// 品牌卡片：你的清單一筆
const stars = r => "★".repeat(r) + "☆".repeat(5 - r);
function entryCard(e){
  const kb = kbFor(e), row = dbRowFor(e);
  const breed = breedOf(e);
  const tagCls = !breed || (kb && kb.t === "unk" && !e.b) ? "unk" : (ALT_BREEDS.includes(breed) || (kb && kb.t === "alt") ? "alt" : "");
  const where = kb ? kb.w : (e.wide ? `${areaLabel(e.wide)}各縣` : PN[e.p] + (e.city ? " " + e.city : (row && row.m ? " " + row.m : "")));
  const mine = [e.date, e.place].filter(Boolean).map(esc).join("・");
  const a = document.createElement("article"); a.className = "brand"; a.tabIndex = 0;
  a.innerHTML = `<h3>${esc(e.n)}</h3><span class="tag ${tagCls}">${esc(breed || "未標示品種")}</span><span class="where">${esc(where)}</span>`
    + (row && row.n !== e.n ? `<span class="from">資料庫名稱：${esc(row.n)}</span>` : "")
    + (mine || e.rating ? `<span class="mine-meta">${e.rating ? `<span class="stars" aria-label="評分 ${e.rating} 顆星">${stars(e.rating)}</span>` : ""}${mine ? `<span>${mine}</span>` : ""}</span>` : "")
    + (kb ? `<p>${esc(kb.d)}</p>` : "")
    + (e.note ? `<span class="note">${esc(e.note)}</span>` : "")
    + `<div class="ops">${e.wide ? "" : `<button type="button" class="btn small" data-act="edit">編輯</button>`}<button type="button" class="btn small danger" data-act="del">刪除</button></div>`;
  const prefs = entryPrefs(e);
  const on = () => { hl(prefs, true); a.classList.add("on"); }, off = () => { hl(prefs, false); a.classList.remove("on"); };
  a.addEventListener("mouseenter", on); a.addEventListener("mouseleave", off);
  a.addEventListener("focus", on); a.addEventListener("blur", off);
  const ed = a.querySelector('[data-act="edit"]'); if (ed) ed.onclick = ev => { ev.stopPropagation(); openForm(e); };
  armDelete(a.querySelector('[data-act="del"]'), e);
  return a;
}
function armDelete(del, e, label){
  label = label || "刪除";
  del.onclick = ev => {
    ev.stopPropagation();
    if (del.dataset.armed) { ENTRIES = ENTRIES.filter(x => x.id !== e.id); save(); refresh(); showMsg(`已刪除「${e.n}」`); }
    else { del.dataset.armed = "1"; del.textContent = "確定？"; setTimeout(() => { if (del.isConnected) { delete del.dataset.armed; del.textContent = label; } }, 4000); }
  };
}

// 待確認：選縣
function prefOptions(cands){
  let html = `<option value="">選擇都道府縣</option>`;
  if (cands && cands.length) html += `<optgroup label="建議">${cands.map(i => `<option value="${i}">${PN[i]}</option>`).join("")}</optgroup>`;
  return html + REGIONS.map(([r, ids]) => `<optgroup label="${r}">${ids.map(i => `<option value="${i}">${PN[i]}</option>`).join("")}</optgroup>`).join("");
}
function renderPending(list){
  const ps = pendingList(); if (!ps.length || current !== null) return;
  const sec = document.createElement("section"); sec.className = "region";
  sec.innerHTML = `<h2>待確認<small>${ps.length} 個品牌・選好縣就會出現在地圖上</small></h2>`;
  const g = document.createElement("div"); g.className = "prefgroup";
  ps.forEach(e => {
    const d = document.createElement("div"); d.className = "pend";
    const sid = "pend-" + e.id;
    d.innerHTML = `<label class="nm" for="${sid}">${esc(e.n)}${e.wish ? ' <span class="ate wish">想吃</span>' : ""}<small>${esc(e.why || "資料庫找不到這個品牌")}</small></label><select id="${sid}">${prefOptions(e.cands)}</select><button type="button" class="btn small primary" data-act="ok">確定</button><button type="button" class="btn small danger" data-act="del">刪除</button>`;
    const sel = d.querySelector("select");
    d.querySelector('[data-act="ok"]').onclick = () => {
      const p = +sel.value;
      if (!p) { showMsg(`請先幫「${e.n}」選一個都道府縣。`, true); sel.focus(); return; }
      if (ENTRIES.some(x => x.id !== e.id && x.p === p && !x.pending && !!x.wish === !!e.wish && similarity(x.n, e.n) === 2)) { ENTRIES = ENTRIES.filter(x => x.id !== e.id); save(); refresh(); showMsg(`${PN[p]}已經有「${e.n}」了，這筆待確認已移除。`); return; }
      e.p = p; delete e.pending; delete e.cands; delete e.why; save(); refresh(); showMsg(`已把「${e.n}」放到${PN[p]}`);
    };
    armDelete(d.querySelector('[data-act="del"]'), e);
    g.append(d);
  });
  sec.append(g); list.append(sec);
}

// 想吃清單
function renderWishes(list){
  const inFilter = e => current === null || (typeof current === "number" ? e.p === current : e.p && REGIONS[+current.slice(1)][1].includes(e.p));
  const ws = wishes().filter(inFilter).sort((a, b) => (a.p || 99) - (b.p || 99));
  if (!ws.length) return;
  const sec = document.createElement("section"); sec.className = "region";
  sec.innerHTML = `<h2>想吃清單<small>${ws.length} 個品牌</small></h2>`;
  const box = document.createElement("div"); box.className = "rows";
  ws.forEach(e => {
    const d = document.createElement("div"); d.className = "row wishrow";
    d.innerHTML = `<span class="nm">${esc(e.n)}</span><span class="meta"><span class="tag unk">${esc(e.wide ? areaLabel(e.wide) : PN[e.p])}</span><span class="row-act"><button type="button" class="btn small primary" data-act="ate">吃過了</button><button type="button" class="btn small danger" data-act="del">移除</button></span></span>${e.note ? `<span class="m">${esc(e.note)}</span>` : ""}`;
    d.querySelector('[data-act="ate"]').onclick = () => { delete e.wish; save(); refresh(); showMsg(`已把「${e.n}」移到吃過，可以補上日期和評分。`); if (!e.wide) openForm(e); };
    armDelete(d.querySelector('[data-act="del"]'), e, "移除");
    d.addEventListener("mouseenter", () => hl(entryPrefs(e), true)); d.addEventListener("mouseleave", () => hl(entryPrefs(e), false));
    box.append(d);
  });
  sec.append(box); list.append(sec);
}

function renderEaten(list){
  if (!ENTRIES.length) {
    const sec = document.createElement("section"); sec.className = "box";
    sec.innerHTML = `<h2>開始建立你的和牛地圖</h2><p class="sub" style="margin:0">還沒有吃過的品牌。把清單貼進「匯入清單」，或一筆一筆新增，地圖會跟著上色。</p><pre class="fmt">北海道：白老牛
山形：米澤牛｜日期 2026-04｜評分 5｜地點 米澤牛亭
宮崎牛
# 想吃
三重：松阪牛</pre><div class="btn-row"><button type="button" class="btn primary" id="empty-import">匯入清單</button><button type="button" class="btn" id="empty-add">新增品牌</button><button type="button" class="btn" id="empty-sample">載入範例</button></div>`;
    list.append(sec);
    sec.querySelector("#empty-import").onclick = openImport;
    sec.querySelector("#empty-add").onclick = () => openForm(null);
    sec.querySelector("#empty-sample").onclick = loadSample;
    return;
  }
  renderProgress(list);
  renderPending(list);
  REGIONS.forEach(([r, ids], ri) => {
    const pids = ids.filter(id => eatenCount[id] && inScope(ri, id));
    const wides = (current === null || current === "r" + ri) ? placed().filter(e => e.wide && AREAS[e.wide].every(i => ids.includes(i))) : [];
    if (!pids.length && !wides.length) return;
    const sec = document.createElement("section"); sec.className = "region";
    const n = pids.reduce((s, id) => s + eatenCount[id], 0) + wides.length;
    sec.innerHTML = `<h2>${r}<small>${n} 個品牌</small></h2>`;
    pids.forEach(id => {
      const g = document.createElement("div"); g.className = "prefgroup";
      g.innerHTML = `<p class="prefname">${PN[id]}<span>吃過 ${eatenCount[id]}／${allCount[id] || eatenCount[id]}</span></p>`;
      placed().filter(e => e.p === id).forEach(e => g.append(entryCard(e)));
      sec.append(g);
    });
    if (wides.length) {
      const g = document.createElement("div"); g.className = "prefgroup";
      g.innerHTML = `<p class="prefname">跨縣品牌</p>`;
      wides.forEach(e => g.append(entryCard(e)));
      sec.append(g);
    }
    list.append(sec);
  });
  renderWishes(list);
}

// 全日本清單的一列；可以直接標「吃過」「想吃」
function quickAdd(r, wish){
  const p = r.p;
  const ex = ENTRIES.find(e => e.p === p && !e.pending && similarity(e.n, r.n) === 2);
  if (ex && !ex.wish) return;
  if (ex && ex.wish && wish) { ENTRIES = ENTRIES.filter(x => x.id !== ex.id); save(); refresh(); showMsg(`已把「${r.n}」從想吃清單移除`); return; }
  if (ex && ex.wish && !wish) { delete ex.wish; save(); refresh(); showMsg(`已把「${r.n}」移到吃過，可以到「我吃過的」補上日期和評分。`); return; }
  ENTRIES.push(wish ? { id: newId(), n: r.n, p, wish: true } : { id: newId(), n: r.n, p });
  save(); refresh();
  showMsg(wish ? `已把「${r.n}」加到想吃清單` : `已把「${r.n}」加到吃過，可以到「我吃過的」補上日期和評分。`);
}
function rowEl(r, prefs){
  const d=document.createElement("div"); d.className="row"+(r.e?" eaten":"")+(r.w?" wished":"");
  const tag = r.t ? `<span class="tag ${ALT_BREEDS.includes(r.t)?"alt":""}">${esc(r.t)}</span>` : `<span class="tag unk">未標示</span>`;
  const ate = r.e ? `<span class="ate">${r.e === true ? "吃過" : "吃過・" + esc(r.e)}</span>` : (r.w ? `<span class="ate wish">想吃</span>` : "");
  const act = r.p && !r.e && !r.extra ? `<span class="row-act"><button type="button" class="btn small" data-act="ate">＋吃過</button><button type="button" class="btn small" data-act="wish" aria-pressed="${!!r.w}">${r.w ? "取消想吃" : "想吃"}</button></span>` : "";
  d.innerHTML = `<span class="nm">${esc(r.n)}</span><span class="meta">${ate}${tag}${act}</span>${r.m?`<span class="m">${r.w2?esc(r.w2)+"・":""}${esc(r.m)}</span>`:(r.w2?`<span class="m">${esc(r.w2)}</span>`:"")}`;
  if (act) {
    d.querySelector('[data-act="ate"]').onclick = () => quickAdd(r, false);
    d.querySelector('[data-act="wish"]').onclick = () => quickAdd(r, true);
  }
  d.addEventListener("mouseenter",()=>hl(prefs,true)); d.addEventListener("mouseleave",()=>hl(prefs,false));
  return d;
}
function renderAll(list){
  const q = query.trim().toLowerCase();
  const match = r => !q || r.n.toLowerCase().includes(q) || (typeof r.e === "string" && r.e.toLowerCase().includes(q)) || (r.m && r.m.toLowerCase().includes(q)) || (q.length >= 2 && similarity(q, r.n) > 0);
  let shown = 0;
  REGIONS.forEach(([r, ids], ri) => {
    const pids = ids.filter(id => inScope(ri, id));
    const groups = pids.map(id => {
      const mine = placed().filter(e => e.p === id), wish = wishes().filter(e => e.p === id);
      const base = ALL.rows.filter(x => x.p === id).map(x => {
        const e = mine.find(e => similarity(e.n, x.n) === 2), w = wish.find(e => similarity(e.n, x.n) === 2);
        return { ...x, e: e ? (e.n === x.n ? true : e.n) : "", w: !!w };
      });
      const extra = mine.filter(e => !dbRowFor(e)).map(e => ({ p: id, n: e.n, t: e.b || "", e: "我新增的", extra: true, m: [e.city, e.note].filter(Boolean).join("・") }))
        .concat(wish.filter(e => !dbRowFor(e)).map(e => ({ p: id, n: e.n, t: e.b || "", w: true, extra: true, m: e.note || "" })));
      return [id, base.concat(extra).filter(match)];
    }).filter(([, rs]) => rs.length);
    const wide = (current === null || current === "r" + ri) ? ALL.wide.filter(w => ((r === "東北" && w.w.startsWith("東北")) || (r.startsWith("九州") && w.w.startsWith("九州")))).map(w => { const e = placed().find(e => e.wide && similarity(e.n, w.n) === 2); return { n: w.n, t: w.t, m: w.m, w2: w.w, e: e ? (e.n === w.n ? true : e.n) : "" }; }).filter(match) : [];
    if (!groups.length && !wide.length) return;
    const sec = document.createElement("section"); sec.className = "region";
    const n = groups.reduce((s, [, rs]) => s + rs.length, 0) + wide.length; shown += n;
    sec.innerHTML = `<h2>${r}<small>${n} 個品牌</small></h2>`;
    groups.forEach(([id, rs]) => {
      const g = document.createElement("div"); g.className = "prefgroup";
      const ate = rs.filter(x => x.e).length;
      g.innerHTML = `<p class="prefname">${PN[id]}<span>${rs.length} 個${ate ? `・吃過 ${ate}` : ""}</span></p>`;
      const box = document.createElement("div"); box.className = "rows";
      rs.forEach(x => box.append(rowEl(x, [id])));
      g.append(box); sec.append(g);
    });
    if (wide.length) {
      const g = document.createElement("div"); g.className = "prefgroup";
      g.innerHTML = `<p class="prefname">跨縣品牌</p>`;
      const box = document.createElement("div"); box.className = "rows";
      wide.forEach(w => box.append(rowEl(w, w.w2.startsWith("九州") ? KYUSHU : TOHOKU)));
      g.append(box); sec.append(g);
    }
    list.append(sec);
  });
  if (!shown) { const p = document.createElement("p"); p.className = "empty"; p.textContent = q ? `找不到「${query}」，試試日文名稱或少打幾個字。` : "這個範圍沒有收錄品牌。"; list.append(p); }
}

let msgTimer;
function showMsg(text, bad){
  const m = document.getElementById("msg");
  if (badgeNote) { text = text ? text + "　" + badgeNote : badgeNote; badgeNote = ""; }
  m.textContent = text; m.classList.toggle("bad", !!bad); m.hidden = false;
  clearTimeout(msgTimer); msgTimer = setTimeout(() => { m.hidden = true; }, bad ? 9000 : 5000);
}
const boxes = ["import-box", "export-box", "add-form", "dup-box", "share-box"].map(id => document.getElementById(id));
function showOnly(b){ boxes.forEach(x => { x.hidden = x !== b; }); if (b) b.scrollIntoView({ block: "nearest" }); }

// ── 新增／編輯單筆 ──
const form = document.getElementById("add-form");
const fName = document.getElementById("f-name"), fPref = document.getElementById("f-pref"), fCity = document.getElementById("f-city"), fBreed = document.getElementById("f-breed"), fNote = document.getElementById("f-note"), fErr = document.getElementById("f-err");
const fStatus = document.getElementById("f-status"), fDate = document.getElementById("f-date"), fRating = document.getElementById("f-rating"), fPlace = document.getElementById("f-place");
fPref.innerHTML = `<option value="">請選擇</option>` + REGIONS.map(([r,ids]) => `<optgroup label="${r}">${ids.map(i=>`<option value="${i}">${PN[i]}</option>`).join("")}</optgroup>`).join("");
let editingId = null;
function syncStatus(){ const w = fStatus.value === "wish"; form.classList.toggle("is-wish", w); }
fStatus.addEventListener("change", syncStatus);
function openForm(e){
  editingId = e ? e.id : null;
  document.getElementById("form-title").textContent = e ? `編輯「${e.n}」` : "新增品牌";
  document.getElementById("f-save").textContent = e ? "儲存修改" : "加入地圖";
  fName.value = e ? e.n : ""; fPref.value = e && e.p ? String(e.p) : ""; fCity.value = e?.city || ""; fBreed.value = e?.b || ""; fNote.value = e?.note || "";
  fStatus.value = e && e.wish ? "wish" : "eaten"; fDate.value = e?.date || ""; fRating.value = e?.rating ? String(e.rating) : ""; fPlace.value = e?.place || "";
  syncStatus();
  fErr.hidden = true; delete form.dataset.override;
  showOnly(form); fName.focus();
}
function closeForm(){ form.hidden = true; editingId = null; }
[fName, fPref, fStatus, fDate].forEach(x => x.addEventListener("input", () => { fErr.hidden = true; delete form.dataset.override; }));
// 自動帶出縣：輸入品牌名稱時，如果資料庫只對到一個縣就先幫忙選好
fName.addEventListener("change", () => { if (fPref.value) return; const c = lookup(fName.value.trim()); if (c && c.level === 2 && c.prefs.length === 1) fPref.value = String(c.prefs[0]); });
form.addEventListener("submit", ev => {
  ev.preventDefault();
  const n = fName.value.trim(), p = +fPref.value, wish = fStatus.value === "wish";
  if (!n) { fErr.textContent = "請輸入品牌名稱。"; fErr.hidden = false; fName.focus(); return; }
  if (!p) { fErr.textContent = "請選擇產地所在的都道府縣。"; fErr.hidden = false; fPref.focus(); return; }
  let date = "";
  if (!wish && fDate.value.trim()) {
    date = normDate(fDate.value);
    if (!date) { fErr.textContent = "日期看不懂，請寫成 2026-04-12 或 2026-04。"; fErr.hidden = false; fDate.focus(); return; }
  }
  const sig = n + "|" + p + "|" + wish;
  if (form.dataset.override !== sig) {
    const d = ENTRIES.filter(x => x.id !== editingId && x.p === p && !x.pending && similarity(x.n, n) > 0);
    if (d.length) {
      fErr.textContent = `可能重複：${PN[p]}已有 ` + d.slice(0, 4).map(x => `「${x.n}」${x.wish ? "（想吃）" : ""}`).join("、") + `。確定是不同品牌的話，再按一次「${document.getElementById("f-save").textContent}」。`;
      fErr.hidden = false; form.dataset.override = sig; return;
    }
  }
  delete form.dataset.override;
  const entry = { id: editingId || newId(), n, p, city: fCity.value.trim(), b: fBreed.value, note: fNote.value.trim() };
  if (wish) entry.wish = true;
  else { if (date) entry.date = date; if (fRating.value) entry.rating = +fRating.value; if (fPlace.value.trim()) entry.place = fPlace.value.trim().slice(0, 40); }
  Object.keys(entry).forEach(k => { if (entry[k] === "") delete entry[k]; });
  const wasEdit = !!editingId;
  if (wasEdit) ENTRIES = ENTRIES.map(x => x.id === editingId ? entry : x); else ENTRIES.push(entry);
  save(); closeForm();
  mode = "eaten"; current = p; refresh();
  const row = dbRowFor(entry);
  showMsg((wasEdit ? `已更新「${n}」` : wish ? `已把「${n}」加到想吃清單` : `已把「${n}」加到${PN[p]}`) + (row && row.n !== n ? `，對應到資料庫的「${row.n}」` : ""));
});
document.getElementById("open-add").onclick = () => openForm(null);
document.getElementById("f-cancel").onclick = closeForm;

// ── 匯入 ──
const imBox = document.getElementById("import-box"), imText = document.getElementById("im-text"), imFile = document.getElementById("im-file"), imErr = document.getElementById("im-err"), imResult = document.getElementById("im-result");
let preview = null;
function openImport(){ imErr.hidden = true; showOnly(imBox); imText.focus(); }
document.getElementById("open-import").onclick = openImport;
document.getElementById("im-close").onclick = () => { imBox.hidden = true; imResult.hidden = true; preview = null; };
document.getElementById("im-back").onclick = () => { imResult.hidden = true; preview = null; imText.focus(); };
imText.addEventListener("input", () => { imErr.hidden = true; if (!imResult.hidden) { imResult.hidden = true; preview = null; } });
imFile.addEventListener("change", () => {
  const f = imFile.files && imFile.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => { imText.value = String(r.result || ""); imErr.hidden = true; imResult.hidden = true; runPreview(); };
  r.onerror = () => { imErr.textContent = "讀不到這個檔案，請改用貼上。"; imErr.hidden = false; };
  r.readAsText(f, "utf-8");
});
const ST_LABEL = { add: "新增", warn: "新增・請確認", pending: "待確認", dup: "略過", move: "移到吃過", update: "補上資料" };
function fieldsBrief(f){ return [f.date, f.rating ? stars(f.rating) : "", f.place].filter(Boolean).join("・"); }
function runPreview(){
  const items = parseText(imText.value);
  if (!items.length) { imErr.textContent = "沒有讀到任何品牌。請一行寫一筆，例如「北海道：白老牛」。"; imErr.hidden = false; return; }
  if (items.length > 500) { imErr.textContent = `一次最多匯入 500 個品牌，這次有 ${items.length} 個，請分批匯入。`; imErr.hidden = false; return; }
  preview = analyze(items);
  const cnt = fn => preview.filter(fn).length;
  const nAdd = cnt(x => (x.status === "add" || x.status === "warn") && !x.wish), nWish = cnt(x => (x.status === "add" || x.status === "warn") && x.wish);
  const nWarn = cnt(x => x.status === "warn"), nPend = cnt(x => x.status === "pending"), nDup = cnt(x => x.status === "dup"), nMove = cnt(x => x.status === "move"), nUpd = cnt(x => x.status === "update");
  document.getElementById("im-sum").innerHTML = `<span>共 <b>${preview.length}</b> 個品牌</span><span>新增吃過 <b>${nAdd}</b></span>${nWish ? `<span>新增想吃 <b>${nWish}</b></span>` : ""}${nWarn ? `<span>其中請確認 <b>${nWarn}</b></span>` : ""}${nMove ? `<span>移到吃過 <b>${nMove}</b></span>` : ""}${nUpd ? `<span>補上資料 <b>${nUpd}</b></span>` : ""}<span>待確認 <b>${nPend}</b></span><span>略過 <b>${nDup}</b></span>`;
  const box = document.getElementById("im-list"); box.innerHTML = "";
  const order = { pending: 0, warn: 1, move: 2, update: 3, add: 4, dup: 5 };
  preview.slice().sort((a, b) => order[a.status] - order[b.status] || a.line - b.line).forEach(x => {
    const d = document.createElement("div"); d.className = "pv-row " + x.status;
    const dest = (x.p ? PN[x.p] : x.wide ? `${areaLabel(x.wide)}（跨縣）` : "未定") + (x.wish ? "・想吃" : "");
    const fb = fieldsBrief(x.fields);
    const stCls = x.status === "move" || x.status === "update" ? "add" : x.status;
    d.innerHTML = `<span class="ln">第 ${x.line} 行</span><span class="nm">${esc(x.name)}<small>→ ${esc(dest)}</small>${fb ? `<small>${esc(fb)}</small>` : ""}</span><span class="st ${stCls}">${x.wish && (x.status === "add" || x.status === "warn") ? "新增到想吃" : ST_LABEL[x.status]}</span>${x.note ? `<span class="note">${esc(x.note)}</span>` : ""}`;
    box.append(d);
  });
  const n = preview.filter(x => x.status !== "dup").length;
  const btn = document.getElementById("im-confirm");
  btn.textContent = n ? `確認匯入 ${n} 個品牌` : "沒有要匯入的品牌";
  btn.disabled = !n;
  imResult.hidden = false; imResult.scrollIntoView({ block: "nearest" });
}
document.getElementById("im-preview").onclick = () => {
  if (!imText.value.trim()) { imErr.textContent = "請先貼上清單，或選擇 .txt／.csv 檔。"; imErr.hidden = false; imText.focus(); return; }
  runPreview();
};
document.getElementById("im-confirm").onclick = () => {
  if (!preview) return;
  const c = applyPreview(preview, ENTRIES);
  save();
  imBox.hidden = true; imResult.hidden = true; preview = null; imText.value = ""; imFile.value = "";
  mode = "eaten"; current = null; refresh();
  const parts = [`已匯入 ${c.added} 個吃過的品牌`];
  if (c.wish) parts.push(`${c.wish} 個想吃`);
  if (c.moved) parts.push(`${c.moved} 個從想吃移到吃過`);
  if (c.updated) parts.push(`${c.updated} 個補上資料`);
  showMsg(parts.join("、") + (c.pend ? `，另有 ${c.pend} 個放在清單上方「待確認」，選好縣就會出現在地圖上。` : "。"));
};

// ── 匯出 ──
const exBox = document.getElementById("export-box"), exText = document.getElementById("ex-text");
function fieldsText(e){ return FIELD_ORDER.filter(k => e[k]).map(k => `｜${FIELD_NAME[k]} ${e[k]}`).join(""); }
function lineOf(e){ return `${e.pending ? "待確認" : e.wide ? areaLabel(e.wide) : PN[e.p]}：${e.n}${fieldsText(e)}`; }
function exportText(list){
  list = list || ENTRIES;
  const order = e => e.pending ? 99 : e.wide ? 98 : e.p;
  const sort = a => a.slice().sort((x, y) => order(x) - order(y));
  const lines = sort(list.filter(e => !e.wish)).map(lineOf);
  const ws = sort(list.filter(e => e.wish));
  if (ws.length) { if (lines.length) lines.push(""); lines.push("# 想吃"); ws.forEach(e => lines.push(lineOf(e))); }
  return lines.join("\n");
}
document.getElementById("open-export").onclick = () => {
  exText.value = exportText();
  showOnly(exBox);
  if (!ENTRIES.length) showMsg("清單是空的，沒有可以匯出的品牌。", true);
};
document.getElementById("ex-close").onclick = () => { exBox.hidden = true; };
document.getElementById("ex-copy").onclick = () => {
  const done = () => showMsg(`已複製 ${ENTRIES.length} 個品牌`);
  const fallback = () => { exText.focus(); exText.select(); showMsg("無法自動複製，內容已選取，請按 Ctrl＋C 或 ⌘＋C。", true); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(exText.value).then(done, fallback); else fallback();
};
document.getElementById("ex-download").onclick = () => {
  try {
    const blob = new Blob(["﻿" + exText.value + "\n"], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "my-wagyu.txt";
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    showMsg("已下載 my-wagyu.txt。如果沒有出現檔案，請改用「複製」。");
  } catch(e) { showMsg("這裡無法下載檔案，請改用「複製」。", true); }
};

// ── 檢查重複 ──
function renderDupes(){
  const box = document.getElementById("dup-list"); box.innerHTML = "";
  const mine = [], near = [], inner = [];
  const ps = placed().filter(e => e.p);
  for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
    if (ps[i].p !== ps[j].p) continue;
    const s = similarity(ps[i].n, ps[j].n); if (s) mine.push({ p: ps[i].p, a: ps[i].n, b: ps[j].n, where: "你的清單", level: s });
  }
  ps.forEach(e => { if (dbRowFor(e)) return; ALL.rows.filter(r => r.p === e.p && similarity(e.n, r.n) === 1).forEach(r => near.push({ p: e.p, a: e.n, b: r.n, where: "全日本清單", level: 1 })); });
  for (let i = 0; i < ALL.rows.length; i++) for (let j = i + 1; j < ALL.rows.length; j++) {
    const x = ALL.rows[i], y = ALL.rows[j]; if (x.p !== y.p) continue;
    const s = similarity(x.n, y.n); if (s) inner.push({ p: x.p, a: x.n, b: y.n, where: "全日本清單", level: s });
  }
  [["你的清單內可能重複", mine, "你的清單裡沒有重複的品牌。"],
   ["你的品牌和全日本清單名稱相近", near, "你的品牌都能直接對應到全日本清單，或確定是不同品牌。"],
   ["全日本清單內名稱相近的品牌", inner, "全日本清單內沒有發現相近的名稱。"]].forEach(([title, items, emptyText]) => {
    const g = document.createElement("div"); g.className = "dup-group";
    g.innerHTML = `<h3>${title}<span class="focus-note">　${items.length} 組</span></h3>`;
    if (!items.length) { const p = document.createElement("p"); p.className = "empty"; p.style.margin = "0"; p.textContent = emptyText; g.append(p); }
    items.sort((a, b) => b.level - a.level || a.p - b.p).forEach(it => {
      const d = document.createElement("div"); d.className = "dup-item";
      d.innerHTML = `<span class="pf">${PN[it.p]}</span><span>${esc(it.a)}</span><span class="vs">↔</span><span>${esc(it.b)}</span><span class="tag ${it.level === 2 ? "" : "unk"}">${it.level === 2 ? "寫法不同" : "名稱相近"}</span><span class="focus-note">${esc(it.where)}</span>`;
      d.addEventListener("mouseenter", () => hl([it.p], true)); d.addEventListener("mouseleave", () => hl([it.p], false));
      g.append(d);
    });
    box.append(g);
  });
}
document.getElementById("open-dup").onclick = () => { renderDupes(); showOnly(document.getElementById("dup-box")); };
document.getElementById("dup-close").onclick = () => { document.getElementById("dup-box").hidden = true; };

// ── 清空與範例 ──
const btnClear = document.getElementById("clear-all"), btnSample = document.getElementById("load-sample");
function syncClearButtons(){ btnClear.hidden = !ENTRIES.length; btnSample.hidden = !!ENTRIES.length; }
let clearTimer;
btnClear.onclick = () => {
  if (!btnClear.dataset.armed) {
    btnClear.dataset.armed = "1"; btnClear.textContent = "確定清空？";
    showMsg(`再按一次「確定清空？」會刪除清單裡的 ${ENTRIES.length} 個品牌，地圖從零開始，刪除後無法還原。需要的話先用「匯出清單」備份。`, true);
    clearTimeout(clearTimer);
    clearTimer = setTimeout(() => { delete btnClear.dataset.armed; btnClear.textContent = "清空資料"; }, 6000);
    return;
  }
  clearTimeout(clearTimer); delete btnClear.dataset.armed; btnClear.textContent = "清空資料";
  ENTRIES = []; save(); showOnly(null);
  mode = "eaten"; current = null; refresh();
  showMsg("已清空。按「匯入清單」貼上你吃過的和牛，或一筆一筆新增。");
};
function loadSample(){ ENTRIES = SAMPLE(); save(); current = null; refresh(); showMsg("已載入範例：北海道的白老牛。"); }
btnSample.onclick = loadSample;

function refresh(){ syncClearButtons(); recount(); checkBadges(); renderHeader(); paintMap(); renderToolbar(); render(); setTimeout(() => { if (badgeNote) showMsg(""); }, 0); }
function render(){
  const list=document.getElementById("list"); list.innerHTML="";
  mode==="eaten" ? renderEaten(list) : renderAll(list);
}
function focusPref(id){
  current = id;
  paintMap(); renderToolbar(); render();
  if(typeof id==="number" && window.matchMedia("(max-width: 860px)").matches){
    toolbar.scrollIntoView({behavior: matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth", block:"start"});
  }
}
function setMode(m){
  mode = m; current = null;
  try { localStorage.setItem("wagyu-mode", m); } catch(e) {}
  renderHeader(); paintMap(); renderToolbar(); render();
}
document.getElementById("mode-eaten").onclick = ()=>setMode("eaten");
document.getElementById("mode-all").onclick = ()=>setMode("all");
document.getElementById("search").addEventListener("input", e => { query = e.target.value; render(); });

// ── 分享連結：把清單壓縮進網址，朋友打開就能看到地圖 ──
function b64u(bytes){ let s = ""; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
function fromB64u(s){ const t = s.replace(/-/g, "+").replace(/_/g, "/"); return Uint8Array.from(atob(t + "===".slice((t.length + 3) % 4)), c => c.charCodeAt(0)); }
async function packShare(text){
  const data = new TextEncoder().encode(text);
  if (window.CompressionStream) {
    try { const s = new Blob([data]).stream().pipeThrough(new CompressionStream("deflate-raw")); return "z" + b64u(new Uint8Array(await new Response(s).arrayBuffer())); } catch(e) {}
  }
  return "u" + b64u(data);
}
async function unpackShare(s){
  const bytes = fromB64u(s.slice(1));
  if (s[0] === "z") { const d = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw")); return new TextDecoder().decode(await new Response(d).arrayBuffer()); }
  if (s[0] === "u") return new TextDecoder().decode(bytes);
  throw new Error("bad");
}
let VIEW = null, OWN = null;
const banner = document.getElementById("view-banner");
function enterView(text){
  const first = text.split(/\r?\n/)[0] || "";
  const name = first.startsWith("@") ? first.slice(1).trim().slice(0, 20) : "";
  const list = [];
  applyPreview(analyze(parseText(text), []), list);
  if (!VIEW) OWN = ENTRIES;
  VIEW = { name, text };
  ENTRIES = list;
  document.body.classList.add("viewing");
  document.getElementById("vb-title").textContent = `${name || "朋友"}的和牛地圖`;
  banner.hidden = false;
  showOnly(null);
  mode = "eaten"; current = null; refresh();
  if (window.__resetView3D) window.__resetView3D();
}
function exitView(){
  if (!VIEW) return;
  ENTRIES = OWN; OWN = null; VIEW = null;
  document.body.classList.remove("viewing"); banner.hidden = true;
  try { history.replaceState(null, "", location.pathname + location.search); } catch(e) {}
  current = null; refresh();
}
document.getElementById("vb-exit").onclick = exitView;
document.getElementById("vb-merge").onclick = () => {
  const t = VIEW.text.split(/\r?\n/).filter(l => !l.startsWith("@")).join("\n");
  exitView(); openImport(); imText.value = t; runPreview();
  showMsg("確認對應結果後按「確認匯入」，朋友的品牌就會加到你的清單。");
};
async function openFromHash(){
  const m = location.hash.match(/^#s=([A-Za-z0-9_-]+)/);
  if (!m) return;
  try { enterView(await unpackShare(m[1])); }
  catch(e) { showMsg("這個分享連結打不開，可能沒有複製完整，請朋友再傳一次。", true); }
}
addEventListener("hashchange", openFromHash);

// ── 分享面板：連結＋圖片 ──
const shBox = document.getElementById("share-box"), shName = document.getElementById("sh-name"), shLink = document.getElementById("sh-link"), shImg = document.getElementById("sh-img");
let shBlob = null, shTimer = null;
try { shName.value = localStorage.getItem("wagyu-name") || ""; } catch(e) {}
async function buildShare(){
  const name = shName.value.trim();
  const text = (name ? "@" + name + "\n" : "") + exportText(placed().concat(wishes(), pendingList()));
  shLink.value = location.origin + location.pathname + "#s=" + await packShare(text);
  const c = await drawShareImage(name);
  shBlob = await new Promise(r => c.toBlob(r, "image/png"));
  if (shImg.dataset.url) URL.revokeObjectURL(shImg.dataset.url);
  if (shBlob) { shImg.dataset.url = URL.createObjectURL(shBlob); shImg.src = shImg.dataset.url; }
  else shImg.src = c.toDataURL("image/png");
}
document.getElementById("open-share").onclick = () => {
  if (!placed().length && !wishes().length) { showMsg("清單是空的，先匯入或新增幾個品牌再分享。", true); return; }
  showOnly(shBox); buildShare();
};
shName.addEventListener("input", () => { try { localStorage.setItem("wagyu-name", shName.value.trim()); } catch(e) {} clearTimeout(shTimer); shTimer = setTimeout(buildShare, 400); });
document.getElementById("sh-close").onclick = () => { shBox.hidden = true; };
document.getElementById("sh-copy").onclick = () => {
  const done = () => showMsg("已複製分享連結，可以貼到 LINE 或訊息給朋友。");
  const fallback = () => { shLink.focus(); shLink.select(); showMsg("無法自動複製，連結已選取，請按 Ctrl＋C 或 ⌘＋C。", true); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(shLink.value).then(done, fallback); else fallback();
};
const nativeLink = document.getElementById("sh-native"), nativeImg = document.getElementById("sh-img-share");
nativeLink.hidden = !navigator.share;
nativeLink.onclick = () => { navigator.share({ title: document.title, text: "來看我的和牛地圖", url: shLink.value }).catch(() => {}); };
nativeImg.hidden = !(navigator.canShare && navigator.canShare({ files: [new File([""], "x.png", { type: "image/png" })] }));
nativeImg.onclick = () => {
  if (!shBlob) return;
  const file = new File([shBlob], "my-wagyu-map.png", { type: "image/png" });
  navigator.share({ files: [file], title: document.title, text: shLink.value }).catch(() => {});
};
document.getElementById("sh-dl").onclick = () => {
  if (!shBlob) { showMsg("圖片還在產生中，請稍等一下再按。", true); return; }
  try {
    const a = document.createElement("a"); a.href = URL.createObjectURL(shBlob); a.download = "my-wagyu-map.png";
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    showMsg("已下載 my-wagyu-map.png");
  } catch(e) { showMsg("這裡無法下載圖片，可以長按預覽圖另存。", true); }
};

// ── 分享圖片（1080×1350，適合 IG、LINE） ──
const IMG = { bg: "#e9ebe3", paper: "#f4f5f0", ink: "#232820", muted: "#5a6153", line: "#cbd3c0", land: "#e3e6dd", edge: "#c3cab8", g: ["", "#e0d9c7", "#c6b18c", "#a2865c", "#745c38"], wish: "#d6e4cf", sage: "#4f6642", tw: "#f2e3a6", twEdge: "#d8c27c" };
async function drawShareImage(name){
  try { await document.fonts.ready; } catch(e) {}
  const W = 1080, H = 1350, c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d");
  const serif = '"Noto Serif TC","Noto Serif CJK TC","Songti TC","PMingLiU",serif', sans = '"Noto Sans TC","Noto Sans CJK TC","PingFang TC","Microsoft JhengHei",sans-serif';
  g.fillStyle = IMG.bg; g.fillRect(0, 0, W, H);
  g.fillStyle = IMG.ink; g.font = `700 74px ${serif}`; g.textBaseline = "alphabetic";
  g.fillText(`${name || "我"}的和牛地圖`, 72, 150, W - 144);
  const bs = badgeState().filter(b => b.done).length;
  const st = [[TOTAL_EATEN, "", "吃過的品牌"], [Object.keys(eatenCount).length, " / 47", "縣・道"], [bs, ` / ${BADGES.length}`, "成就"]];
  st.forEach(([v, suf, l], i) => {
    const x = 72 + i * 310;
    g.fillStyle = IMG.sage; g.font = `700 64px ${sans}`; g.fillText(String(v), x, 250);
    if (suf) { const w = g.measureText(String(v)).width; g.fillStyle = IMG.muted; g.font = `500 30px ${sans}`; g.fillText(suf, x + w + 4, 250); }
    g.fillStyle = IMG.muted; g.font = `400 26px ${sans}`; g.fillText(l, x, 290);
  });
  // 地圖卡
  const cx = 48, cy = 330, cw = 984, ch = 860, rr = 28;
  g.beginPath(); g.moveTo(cx + rr, cy); g.arcTo(cx + cw, cy, cx + cw, cy + ch, rr); g.arcTo(cx + cw, cy + ch, cx, cy + ch, rr); g.arcTo(cx, cy + ch, cx, cy, rr); g.arcTo(cx, cy, cx + cw, cy, rr); g.closePath();
  g.fillStyle = IMG.paper; g.fill(); g.strokeStyle = IMG.line; g.lineWidth = 2; g.stroke();
  const vx = -85, vy = 15, vw = 1115, vh = 1265, pad = 30;
  const s = Math.min((cw - pad * 2) / vw, (ch - pad * 2) / vh);
  g.save(); g.translate(cx + (cw - vw * s) / 2, cy + (ch - vh * s) / 2); g.scale(s, s); g.translate(-vx, -vy);
  g.setLineDash([6, 6]); g.strokeStyle = IMG.edge; g.lineWidth = 1.5; g.strokeRect(70, 272, 440, 262); g.setLineDash([]);
  g.lineJoin = "round";
  Object.entries(PATHS).forEach(([id, d]) => {
    id = +id; if (!d) return;
    const n = eatenCount[id] || 0;
    g.fillStyle = n ? IMG.g[levelEaten(n)] : wishCount[id] ? IMG.wish : IMG.land;
    const p2 = new Path2D(d); g.fill(p2); g.strokeStyle = IMG.edge; g.lineWidth = 1; g.stroke(p2);
  });
  const tw = new Path2D(TW_PATH); g.fillStyle = IMG.tw; g.fill(tw); g.strokeStyle = IMG.twEdge; g.stroke(tw);
  Object.keys(eatenCount).forEach(k => {
    const [x, y] = CENTER[k];
    g.beginPath(); g.arc(x, y, 24, 0, Math.PI * 2); g.fillStyle = IMG.sage; g.fill(); g.lineWidth = 4; g.strokeStyle = IMG.paper; g.stroke();
    g.fillStyle = "#f4f5f0"; g.font = `700 26px ${sans}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(String(eatenCount[k]), x, y + 1);
  });
  g.restore(); g.textAlign = "left"; g.textBaseline = "alphabetic";
  // 吃最多的縣
  const top = Object.entries(eatenCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([p, n]) => `${PN[p]} ${n}`).join("・");
  g.fillStyle = IMG.ink; g.font = `500 30px ${sans}`;
  if (top) g.fillText(`吃最多：${top}`, 72, 1250, W - 144);
  g.fillStyle = IMG.muted; g.font = `400 26px ${sans}`;
  g.fillText("planktonthai.github.io/wagyu-meguri", 72, 1300);
  return c;
}

const THEME_KEY = "wagyu-theme";
function applyTheme(t){
  if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
  else document.documentElement.removeAttribute("data-theme");
  document.querySelectorAll(".theme button").forEach(b => b.setAttribute("aria-pressed", b.dataset.t === t));
}
let theme = "system";
try { const t = localStorage.getItem(THEME_KEY); if (t === "light" || t === "dark") theme = t; } catch(e) {}
applyTheme(theme);
document.querySelectorAll(".theme button").forEach(b => b.onclick = () => { theme = b.dataset.t; applyTheme(theme); try { localStorage.setItem(THEME_KEY, theme); } catch(e) {} });

syncClearButtons(); checkBadges(); renderHeader(); paintMap(); renderToolbar(); render();
openFromHash();
