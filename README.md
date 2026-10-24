# 食物鏈偵探隊：生態島任務

繁體中文小四科學互動網站，採用自然水彩與觀察手帳風格。

## 正式入口

- 學生：https://wongngaiyam3-rgb.github.io/food-chain-detectives/
- 教師：https://wongngaiyam3-rgb.github.io/food-chain-detectives/teacher/

前端由 GitHub Pages 直接提供，雲端紀錄儲存在獨立 Supabase 專案。沒有 ChatGPT、Sites 或 OpenAI API 的執行期依賴。Supabase 仍透過 HTTPS 資料介面通訊。

教師密碼由擁有者在資料庫設定，未寫入此公開倉庫。舊服務紀錄保留原處；轉存需另獲明確授權，新作答直接儲存在 Supabase。

## 六個任務

1. 食性觀察與配對。
2. 三組不同位置的箭頭練習。
3. 三環節、四環節食物鏈建構：點選或拖放、撤回、重排、反轉箭頭。
4. 修正箭頭方向、缺少生產者及次序錯誤。
5. 青蛙減少情境的預測、簡化模型與解釋。
6. 草、兔、狐新情境的獨立報告。

學生須選擇4A–4C及1–25號。每關的客觀操作及必填發現均完成，經資料庫驗證後才可解鎖下一關。教師平台提供三班75位名冊、個別作答、最後更新和 CSV 匯出，每15秒更新。

## 架構

- `index.html`、`teacher/`、`app.js`、`style.css`、`assets/`：GitHub Pages 提供所有前端及圖片，不再自動轉到其他網站。
- `database-config.js`：只保存公開的 Supabase 專案網址及 publishable key。
- `cloud-store.js`：向獨立 Supabase 專案發送進度請求，包含逾時、錯誤提示。
- `classroom.js`：學生登入、排隊保存及提交；登入憑證與舊服務分開。
- `database/001_classroom.sql`：私有資料表、角色驗證、關卡檢查、教師密碼驗證及登出。
- `requirements.js`：前端顯示尚欠項目；資料庫另行獨立檢查。

教師密碼必須在資料庫管理連線中設定 bcrypt 雜湊，不可寫入公開程式。學生沿用班別及學號的簡易身份方式，沒有個人密碼。文字解釋保留給教師評閱，不自動評分。

## 開發與測試

前端純 HTML/CSS/JavaScript，執行時無需安裝套件，不使用外部字體服務。以裝置的繁體中文字體顯示；圖片均在 `assets/`。

測試才需要 Node.js 和開發依賴：

```sh
npm ci
npm test
```

8項測試通過：連接配置及密鑰限制、Supabase 請求格式、中文錯誤、PGlite/PostgreSQL 實際執行完整遷移、禁止跳關與缺項、六關及跨登入讀回、教師／學生權限隔離、匿名不可直接讀取私有表，以及教師登入嘗試限制。PGlite 測試使用假教師密碼，不接觸正式學生資料。

正式 Supabase 已通過匿名角色的逐關驗證、六關完成、重登恢復、教師登入／讀取／登出測試，測試交易已回滾。瀏覽器已成功經獨立 Supabase 網域登入。香港學生網絡仍需實測；資料庫區域本身不保證所有校網均可連接。

## 科學模型

箭頭由被吃的生物指向進食者，表示食物中能量的傳遞。太陽是能量來源，不是生產者。生態變化模型只考慮指定四種生物和食物關係，其他條件不變；條形僅表示趨勢，沒有真實數量單位。真實生態包含更多食物來源與環境因素。

## 圖片與教材

ImageGen 輔助製作水彩插畫，輸出 WebP；生物、進食線索和草地池塘景觀均保存在本倉庫。圖片大小不代表實際生物大小。

- https://biodiversitysg.nparks.gov.sg/our-ecosystems/food-webs/food-chains-and-food-webs-basics/
- https://www.noaa.gov/education/resource-collections/marine-life/aquatic-food-webs
