# 森間探險 · 森林食物鏈（原版移植）

原始網站：<https://forest-foodweb-explorer.validkoi14.chatgpt.site/>

GitHub Pages：<https://wongngaiyam3-rgb.github.io/food-chain-detectives/forest-foodweb-explorer/>

本資料夾移植自原始網站提供的 [forest-source.zip](https://forest-foodweb-explorer.validkoi14.chatgpt.site/forest-source.zip)，以原版 HTML、CSS、探索與互動操作為基礎，按教學要求修改物種資料及食物鏈。並非先前另行重製的森林模擬器。

## 使用方式

直接以 HTTPS 網址開啟；建議用 iPad 橫向 Safari。目前包括 3D 森林、2 種植物（橡樹、禾草）、8 種動物（毛毛蟲、蚱蜢、青蛙、草蛇、林鼠、兔子、知更鳥、赤狐）、近距離觀察、圖鑑、食物鏈判定與本機進度保存。已移除分解者與分解路徑。無需伺服器或付費 AI API。

## 兩處 GitHub Pages 相容處理

1. 原始 `app.js` 內的 `./vendor/three.module.js` 改為固定版本的 [Three.js r170](https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js) URL，避免在 GitHub 重複存放 1.3 MB 的第三方供應商程式。功能及主版本不變；首次載入需能連線 jsDelivr。
2. 幫助視窗的「下載網站原始檔」連結改為原始網站提供的 ZIP 絕對網址。

此外，因教學範圍調整，`index.html` 更新物種數量，`data.js` 調整物種及取食連結，`app.js` 新增青蛙及草蛇 3D 模型、移除分解活動並使圖鑑進度依實際物種總數計算；`style.css` 與 `proximity.js` 保持原版。此倉庫所提供的完整程式包括 `app.js`，可以進一步修改和擴充。

## 教學提示

本遊戲是溫帶林緣的**簡化教學食物網**，非真實生態系統精確模擬。進度存於瀏覽器的 localStorage，不會自動跨裝置同步。Three.js 使用 MIT 授權，詳見 [THREE-LICENSE.txt](vendor/THREE-LICENSE.txt)。原始 3D 功能需瀏覽器支援 WebGL，裝置不支援時會嘗試原版相容模式。

## 本次調整（小四食物鏈）

- **生產者（2）**：橡樹、禾草。
- **消費者（8）**：毛毛蟲、蚱蜢、青蛙、草蛇、林鼠、兔子、知更鳥、赤狐。
- **刪除**：黑莓灌木、灰林鴞、蚯蚓、腐生真菌，以及分解路徑和相關過濾按鈕。
- **食物鏈示例**：禾草 → 蚱蜢 → 青蛙 → 草蛇；禾草 → 兔子 → 赤狐；橡樹 → 毛毛蟲 → 知更鳥；橡樹 → 林鼠 → 赤狐。
- **舊資料**：保存的探索紀錄只保留仍存在的物種；已不存在或不符合新食物關係的食物鏈不會載入。

本模型為課堂簡化食物網，箭頭從食物指向取食者。青蛙／草蛇是示意林緣近水環境的教學物種。
