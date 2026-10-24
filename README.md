# 食物鏈偵探隊：生態島任務

繁體中文小四科學互動網站，採用自然水彩與觀察手帳風格。

## 六個任務
1. 食性觀察與配對
2. 三組不同位置的箭頭練習
3. 三環節、四環節食物鏈建構（點選或拖放、撤回、重排、反轉箭頭）
4. 修正方向、缺少生產者及次序錯誤
5. 青蛙減少情境的預測、簡化模型與解釋
6. 草、兔、狐新情境的獨立報告

## 使用與部署
純 HTML/CSS/JavaScript，無需套件安裝。GitHub Pages 設定 main 分支根目錄。所有圖片使用相對路徑並隨倉庫發布。Google Fonts 載入失敗時使用裝置字體。

學生須選擇4A–4C及1–25號才能進入；舊版未署名的本機進度不會匯入。每關的操作與文字發現完成並經伺服器驗證後，才解鎖下一關；三環節練習完成後才可進入四環節。進度、答案與文字同步至專用Sites/D1服務，同一班別學號可接續進度。瀏覽器只保存目前座位的短期登入憑證及作答備份。

教師入口為 teacher/，由伺服器驗證密碼，提供三班75位學生的名冊、六關完成狀態、最後更新、個別作答及CSV匯出；每15秒更新。教師密碼只設定在後端密鑰，不存在此公開倉庫。已登入學生以班別學號識別，未另設學生密碼。學生提交文字不會自動評分，由教師評閱。

API來源：https://food-chain-classroom-api.ilovetsr089.chatgpt.site 。後端原始碼與資料庫由獨立Sites專案管理，GitHub Pages只發布前端。

## 科學模型
箭頭由被吃者指向進食者，表示能量傳遞。太陽是能量來源，不是生產者。生態變化模型只考慮指定四種生物和食物關係，其他條件不變；條形僅表示趨勢，無真實數量單位。真實生態包含更多食物來源與環境因素。

## 圖片
內建 ImageGen 輔助製作水彩插畫，輸出為 WebP。主題提示：Japanese watercolor natural history illustration, accurate natural anatomy, soft natural colors, no text or arrows。生物圖各為單一草叢、草蜢、成年青蛙、蛇、兔或狐，透明背景。進食圖分別呈現草蜢吃草、青蛙捕捉草蜢、蛇捕捉青蛙。背景為草地池塘景觀。最終圖片保存於 assets/。

## 驗證
JavaScript 語法檢查；以瀏覽器完成六關，驗證答錯提示、正確答案、撤回、三至四環節建構、三種錯誤修正、先預測後觀察、報告輸入及重新整理保存紀錄。

## 教材參考
- https://biodiversitysg.nparks.gov.sg/our-ecosystems/food-webs/food-chains-and-food-webs-basics/
- https://www.noaa.gov/education/resource-collections/marine-life/aquatic-food-webs

## 本次驗證
伺服器測試涵蓋班別學號範圍、教師驗證、權限分隔、禁止跳關、必填項目、六關提交、重新登入恢復、學生隔離、教師讀取及登出。瀏覽器在隔離SQLite測試環境實際完成六關並確認教師端同步、個別紀錄和CSV匯出。正式服務健康檢查與D1遷移另行核對。

## 登入連線修正
正式學生及教師介面與API改由同一網站提供，GitHub Pages原入口會轉往修正版，減少跨站預檢及瀏覽器限制導致的Load failed。移除對AbortSignal.timeout的依賴，並加入中文連線逾時提示。完整介面由Sites來源庫frontend/保存，本庫source/保存入口HTML參考。原有D1進度及教師密碼設定保持不變。
