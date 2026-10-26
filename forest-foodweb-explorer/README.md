# 森間探險 · 森林食物鏈（原版移植）

原始網站：<https://forest-foodweb-explorer.validkoi14.chatgpt.site/>

GitHub Pages：<https://wongngaiyam3-rgb.github.io/food-chain-detectives/forest-foodweb-explorer/>

本資料夾移植自原始網站提供的 [forest-source.zip](https://forest-foodweb-explorer.validkoi14.chatgpt.site/forest-source.zip)，保留原版 HTML、CSS、物種資料、生態邏輯與互動操作。未使用先前另行重製的森林模擬器。

## 使用方式

直接以 HTTPS 網址開啟；建議用 iPad 橫向 Safari。原始遊戲包括 3D 森林、12 種生物、近距離觀察、圖鑑、食物鏈判定、分解路徑和本機進度保存。無需伺服器或付費 AI API。

## 兩處 GitHub Pages 相容處理

1. 原始 `app.js` 內的 `./vendor/three.module.js` 改為固定版本的 [Three.js r170](https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js) URL，避免在 GitHub 重複存放 1.3 MB 的第三方供應商程式。功能及主版本不變；首次載入需能連線 jsDelivr。
2. 幫助視窗的「下載網站原始檔」連結改為原始網站提供的 ZIP 絕對網址。

其餘 `index.html`、`style.css`、`data.js`、`proximity.js` 與原始 ZIP 一致。此倉庫所提供的完整程式包括 `app.js`，可以進一步修改和擴充。

## 教學提示

本遊戲是溫帶林緣的**簡化教學食物網**，非真實生態系統精確模擬。進度存於瀏覽器的 localStorage，不會自動跨裝置同步。Three.js 使用 MIT 授權，詳見 [THREE-LICENSE.txt](vendor/THREE-LICENSE.txt)。原始 3D 功能需瀏覽器支援 WebGL，裝置不支援時會嘗試原版相容模式。
