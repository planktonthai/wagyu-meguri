# 和牛巡禮 wagyu-meguri

我吃過的和牛品牌，依產地標在 3D 日本地圖上；也收錄全日本 226 個品牌牛供參考。

**網站：** https://planktonthai.github.io/wagyu-meguri/

## 功能

- **兩種檢視**：「我吃過的」與「全日本品牌」，縣的顏色越深代表品牌越多
- **3D／2D 地圖**
  - 3D：拖曳移動、滾輪或雙指縮放（以游標位置為中心）、雙擊放大、右鍵或 Shift＋拖曳旋轉
  - 指北針一鍵轉回正北；點縣市或地區按鈕，鏡頭會平滑飛過去
- **新增品牌**：輸入品牌名稱與都道府縣即可加入地圖，可以編輯或刪除
- **重複比對**：把中文與日文寫法統一後比對，例如米澤牛與米沢牛、橄欖牛與オリーブ牛
- **匯出／匯入**：新增的品牌存在瀏覽器裡，換裝置時用匯出、匯入搬過去
- **深淺色切換**：淺色、深色、跟隨系統

## 檔案

| 檔案 | 內容 |
|---|---|
| `index.html` | 整個網站（單一檔案，含地圖與資料） |
| `data/japan-wagyu-brands.json` | 全日本品牌牛清單（縣代碼、品牌名、品種、是否吃過） |
| `data/日本和牛品牌清單.xlsx` | 同一份清單的試算表版，可篩選並自己勾選吃過的品牌 |

## 更新內容

- **新增吃過的品牌**：可以直接在網站上按「新增品牌」，但只存在當下的瀏覽器。要讓所有裝置都看得到，請把匯出的內容交給 Claude，或手動加進 `index.html` 裡的 `BRANDS` 清單。
- **網站更新時間**：推送到 `main` 分支後，GitHub Pages 約 1 分鐘內會更新。

## 資料來源

- [日本のブランド牛一覧（Wikipedia）](https://ja.wikipedia.org/wiki/%E6%97%A5%E6%9C%AC%E3%81%AE%E3%83%96%E3%83%A9%E3%83%B3%E3%83%89%E7%89%9B%E4%B8%80%E8%A6%A7)
- [日本全国のブランド牛肉・銘柄牛一覧（brand-meat.com）](https://brand-meat.com/brand-beef-index/)
- [和牛／銘柄牛 都道府県別一覧（penguin-toyu.net）](https://www.penguin-toyu.net/otoriyose/wagyu.html)
- 縣界地圖：[dataofjapan/land](https://github.com/dataofjapan/land)，以 mapshaper 簡化
- 3D 繪圖：[three.js](https://threejs.org/) r128

日本實際的品牌牛超過本清單收錄的數量，品種只在來源寫明時標示。
