# 食物鏈探險隊

學生入口 `expedition/`；教師入口 `expedition/teacher/`。純靜態 GitHub Pages 前端，使用既有 Supabase 專案的獨立 `expeditions` 表和 `eco_expedition` RPC；不改動原六關課程進度、不轉移舊平台資料。

第一冊完整包含草地、森林、海洋3區×5任務，以及獨立研究館，共16個任務。依序完成後解鎖下一任務。沙漠、濕地是後續擴充，尚未製作。每區關係依食性卡限定；海洋採食性類群，森林以溫帶林地為情境，不表示香港所有環境都有這些生物。

操作：觀察卡、食物配對、點選／拖放排列、箭頭反轉、修正理由、先預測再看簡化模型、文字解釋、自我檢視、研究作品及JSON下載／列印。保留首次提交及是否通過任務條件、重試次數、提示次數。事件預測不必猜中；文字須由教師評閱，不自動評分。圖示不是物種鑑定照片。

教師沿用既有後端密碼，登入憑證與學生隔離；提供三班75位名冊、分區進度、任務答案、首次提交、提示使用、個別回饋及CSV下載，每15秒更新。公開程式不包含教師密碼或管理密鑰。

裝置暫存按班別學號及任務分開；網絡恢復可重試排隊保存。顯示雲端已保存才代表伺服器已收到。首次載入與登入仍需要網絡。

## 驗證

`node --test tests/expedition.test.mjs` 在隔離PGlite驗證16任務、跨登入讀回、教師／學生權限、禁止跳關、首次答案、提示及回饋。正式Supabase以回滾交易驗證16任務。瀏覽器隔離QA完成草地五種玩法、研究館海洋作品、教師個別紀錄與回饋。正式網站另測登入與地圖。香港實際校網與實體iPad尚需課堂試用。

`scripts.dev` 使用 `tests/expedition-preview.mjs` 啟動**只在記憶體中的QA資料庫**。教師頁在此隔離環境自動取得測試會話，測試生4C-24預先完成15項任務；正式HTML不包含這些測試會話，也不使用此伺服器。GitHub Pages只提供靜態檔案。

## 插畫

`assets/world-map.webp` 由內建 ImageGen 製作，再作網頁格式壓縮。提示：Japanese watercolor and gouache ecological exploration island on ivory paper; sunny meadow, temperate woodland observation hut, turquoise seashore, small research sailboat and winding path; moss green, teal and ochre; no text, labels, arrows or diagrams。生態地圖只作裝飾；箭頭與任務由程式繪製。

食性參考：NOAA Aquatic Food Webs、NParks Food Chains and Food Webs Basics、RSPB藍山雀及雀鷹資料、Woodland Trust Blue Tit。完整連結見學生遊戲手冊。
