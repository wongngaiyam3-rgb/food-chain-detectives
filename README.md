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

完成狀態、客觀答案及文字紀錄保存在目前瀏覽器 localStorage，不會同步到其他裝置或教師端。教師手冊提供 JSON 匯出、清除紀錄及教材參考；報告可列印。文字解釋由教師評閱。

## 科學模型
箭頭由被吃者指向進食者，表示能量傳遞。太陽是能量來源，不是生產者。生態變化模型只考慮指定四種生物和食物關係，其他條件不變；條形僅表示趨勢，無真實數量單位。真實生態包含更多食物來源與環境因素。

## 圖片
內建 ImageGen 輔助製作水彩插畫，輸出為 WebP。主題提示：Japanese watercolor natural history illustration, accurate natural anatomy, soft natural colors, no text or arrows。生物圖各為單一草叢、草蜢、成年青蛙、蛇、兔或狐，透明背景。進食圖分別呈現草蜢吃草、青蛙捕捉草蜢、蛇捕捉青蛙。背景為草地池塘景觀。最終圖片保存於 assets/。

## 驗證
JavaScript 語法檢查；以瀏覽器完成六關，驗證答錯提示、正確答案、撤回、三至四環節建構、三種錯誤修正、先預測後觀察、報告輸入及重新整理保存紀錄。

## 教材參考
- https://biodiversitysg.nparks.gov.sg/our-ecosystems/food-webs/food-chains-and-food-webs-basics/
- https://www.noaa.gov/education/resource-collections/marine-life/aquatic-food-webs
