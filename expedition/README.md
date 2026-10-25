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

## 3D grassland experiment island
`island/` unlocks after the first four meadow missions. It uses local bundled Three.js 0.180.0 (MIT) with a CPU triangle-projection fallback when WebGL is unavailable; no CDN/runtime ChatGPT dependency. Drag/orbit, zoom, reset view, comparison island, energy arrows, reduced decorative motion. Scene animals represent groups; their walking is decorative rather than individual predator agents.

Model `island/model.mjs` is a deterministic four-population ODE using RK4 with dt=0.1. Normalised equilibrium [1,1,1,1], logistic producer growth, trophic consumption/growth and density dependence. Baseline [100,40,16,6] is pedagogical, not field data. Time units are arbitrary. Simulation allows one 25/50/80% removal at t=0, runs to 60, pauses at 20 for prediction comparison (within ±2% labelled approximately unchanged), and can exhibit recovery/reversals rather than a fixed cascade. UI explicitly states these assumptions. Compare starts from identical conditions. Control remains at analytical equilibrium.

At t>=20 students explain and submit, storing the last six reports under existing stage 4 `data.simulations` via the protected Supabase RPC. First four mission gate is checked before opening; server existing stage gate also applies. Teacher stage4 detail reads predictions, explanation and sampled trajectory. Existing stage4 answers preserved when saving. Device drafts are separate per seat and recover on reload; explicit submission required. Reports are observations for teacher review, not automatic grades. One report is updated on resubmit, new runs have new IDs. Supports CSV time-series export. No schema/permission changes.

Build local bundle: `node_modules/.bin/esbuild expedition/island/scene-src.js --bundle --format=esm --minify --outfile=expedition/island/scene.js --legal-comments=linked`. Ship scene.js, its legal comments and THREE-LICENSE.txt together. Model tests: `node --test tests/island.test.mjs`.

## 2026-10-25 artwork and no-writing update
All student text-response questions were removed from the expedition missions, museum, simulation and original six-mission course. Learners complete observations, matching, chains, arrows, predictions and self-check choices. Server validation no longer checks note/explanation lengths; sequential locking and role restrictions remain. Existing written submissions stay stored and readable as historical records. Teacher feedback remains editable. The simulation now saves predictions, intervention settings and sampled trajectories without requesting prose. Function-only deployment snapshot: `database/no-writing-functions.sql`.

Island assets: `island/assets/grass.webp`, `grasshopper.webp`, `frog.webp`, `snake.webp`. New built-in ImageGen illustrations, converted to WebP preserving alpha. Actual transparent cutouts are placed as camera-facing sprites in the 3D scene and on species cards; they are illustrated planes, not fully modelled 3D animals. CPU fallback now projects sprites and terrain together in depth order. Assets are decorative species representations, not a precise species-identification guide.

Generation prompt set (built-in tool): single isolated transparent sprite for a Hong Kong primary school ecology game; exquisite Japanese storybook gouache/watercolor, fine painterly details, soft dimensional shading, warm natural palette, readable silhouette; full subject, three-quarter view slightly above; no words, frame, scenery or clothes. Subjects: tuft of narrow meadow grass with seed heads; green grasshopper with antennae and jumping hind legs; adult green pond frog with folded hind limbs and webbed toes; olive-brown meadow snake in loose S-shaped coil tapering to a single tail. Grasshopper and snake received a cutout edit asking to preserve animal details while removing background/halo. Final generated PNG originals remain in generation output; project consumes WebP.

Verification: full local database suite including no-text completion of all 6 original and all 16 expedition tasks; production RPC transaction completed 16 tasks with no note/explanation fields and rolled back the test. No learner progress reset or historical answer deletion.
