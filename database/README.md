# Supabase 資料庫維護

網站前端由 GitHub Pages 直接提供，圖片、CSS、JavaScript 都隨倉庫發布。進度連線只使用獨立 Supabase 網域，不使用 ChatGPT、Sites 或 OpenAI API。Supabase 本身仍透過 HTTPS 資料介面通訊。

## 重新建立或復原服務

1. 連接擁有者的 Supabase 帳戶，選擇或建立專用專案；優先使用新加坡區域。建立涉及費用時須先確認實際方案。
2. 執行 `001_classroom.sql`，建立私有表及公開的 invoker 包裝函數與私有驗證函數。它不包含教師密碼。
3. 在擁有者的資料庫連線中，把既定教師密碼以 `extensions.crypt(密碼, extensions.gen_salt('bf'))` 寫入 `eco_private.teacher_settings` 的 id=1。密碼不可寫入 GitHub、瀏覽器配置或部署日誌。
4. 將專案 HTTPS 網址與 **publishable key** 填入 `database-config.js`。禁止使用 secret / service-role key。
5. 實測學生登入、逐關解鎖、跨瀏覽器恢復、教師登入及個別答案；確認公開角色不能直接讀取資料表。舊紀錄轉存須另獲擁有者明確授權。尚未授權時保留舊服務資料，新作答在新資料庫記錄，不可把舊紀錄提交 GitHub。
6. 完成檢查才把本分支合併到 main 並發布 GitHub Pages，並用香港的學生網絡測試登入和提交。無法只憑伺服器所在地保證每一個學校網絡都可使用。

## 私隱與功能

- 資料表置於未對外公開的 `eco_private` schema，撤銷匿名及學生角色的直接表權限並啟用 RLS。
- 瀏覽器只用 publishable key 呼叫 `eco_classroom`；函數檢查隨機短期登入憑證、角色、學號、關卡和作答。
- 教師密碼使用 bcrypt 雜湊；教師登入失敗達8次後暫停15分鐘。登入成功8小時內可查看全班，登出立即撤銷憑證。
- 學生沿用班別學號的簡易身份方式，未增設學生密碼；請學生核對自己的座位。
- 首次移轉至 Supabase 時不沿用舊服務的登入憑證。
- 尚未設定資料庫時明確顯示「新資料庫尚未接通」，不會悄悄連回舊服務或假裝已同步。
- 已移除 Google Fonts 遠端載入，以裝置上的繁體中文字體顯示。

## 本機測試

`npm ci`，然後 `npm test`

SQL 測試已在支援 pgcrypto 的 PGlite 中執行，涵蓋未登入、越權、缺項、禁止跳關、六關完成、重登恢復及教師登出。
