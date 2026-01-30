# Hungry Colleagues（辦公室訂飲料/便當系統）

本專案提供「飲料 + 便當」的辦公室訂購系統，前端部署在 GitHub Pages，後端使用 Google Apps Script Web App 串接 Google Sheets。

這份 README 目的：
- 讓第一次接觸的 AI/工程師清楚知道「已完成什麼、還剩什麼」
- 提供完整的執行步驟、資料表結構、API 與驗證流程
- 確保後續接手可無痛延續開發

---

## 目前完成狀態（概覽）

已完成：
- 前端骨架（Vue 3 + Vite + Tailwind + Hash Router + PWA manifest）
- 訂購頁 / 我的訂單 / 統計 / 管理者頁 UI（含 mock + API wrapper）
- GAS Web App 基礎架構 + action router
- 使用者端 API：getCurrentOrders / getProducts / submitOrder / updateOrder / cancelOrder / getMyOrders / getOrderSessions / getStatistics
- 管理者 API：adminLogin / uploadData / openOrder / closeOrder / getStores / toggleActive / exportOrders
- Sheets schema 文件 + idempotent 初始化腳本
- 部署與手動 QA 文件
- 前端 UI 端到端手動驗收（已用真實 GAS + Sheets 資料完成，含 UI 截圖證據）
- ✅ GitHub Actions 自動部署（push to main → 自動 build + deploy）
- ✅ GitHub Pages 上線（靜態資產、hash 路由、API 連接皆正常）

尚待完成：
- 若要正式上線：將測試資料替換為正式店家/品項，必要時清理 Orders/CurrentOrder

---

## 最新完成與驗證（2026-01-28）

本次已完成/已驗證（以 curl 對已部署的 GAS Web App 實測）：
- [x] 新建 Google Sheet，並已初始化 schema（tabs + headers + Config defaults）
- [x] GAS Web App 已部署（任何人可存取），`action=ping` 回 JSON
- [x] 管理者登入：`adminLogin` 可取得 `adminToken`（6 小時）
- [x] 管理者上傳：`uploadData` 可 upsert `Stores` / `Products`
- [x] 開/關單：`openOrder` 可同時開 drink + meal；`closeOrder` 後 submit/update 會拒絕（`SESSION_CLOSED`）
- [x] 使用者流程：`getCurrentOrders` / `getProducts` / `submitOrder` / `updateOrder` / `cancelOrder` / `getMyOrders` / `getOrderSessions`
- [x] 統計/匯出：`getStatistics` / `exportOrders` 回傳與 Orders 資料一致
- [x] 失敗案例驗證：飲料選項不在 option set → `INVALID_OPTION`
- [x] 失敗案例驗證：便當備註過長 → `NOTE_TOO_LONG`
- [x] 失敗案例驗證：管理 API 缺 token → `MISSING_TOKEN`

證據檔案（本 repo 內）：
- `.sisyphus/evidence/2-gas-ping.txt`
- `.sisyphus/evidence/4-current-products.txt`
- `.sisyphus/evidence/5-submitOrder.txt`
- `.sisyphus/evidence/7-myorders-history.txt`
- `.sisyphus/evidence/8-stats-export.txt`
- `.sisyphus/evidence/10-final-checklist.txt`

操作注意事項（常見踩雷）：
- GAS Web App 常見 302 redirect；curl 請用 `-L`
- 不要在 `-L` 同時硬指定 `-X POST`（redirect 後可能變 405）；用 `--data` 讓 curl 自行處理即可

---

## 最新完成與驗證（2026-01-29 至 2026-01-30）

### 前端 UI 端到端測試（2026-01-29）

前端 UI 端到端測試已完成（以 localhost:5173 + 真實 GAS Web App 測試）：
- [x] 前端環境設定：`.env.local` 配置 GAS Web App URL
- [x] Dev server 啟動：`npm run dev` 成功運行
- [x] API 連接驗證：頁面顯示「GAS API」（非 mock 模式）
- [x] 使用者註冊：姓名輸入「測試員」存入 localStorage
- [x] 訂單場次顯示：兩個場次（暖心飲品/暖心便當）皆顯示「開放中」
- [x] 商品列表：飲料商品列表成功載入
- [x] 訂購表單（bottom sheet）：尺寸/糖度/冰塊選項顯示正確
- [x] 訂單送出：訂單成功送出（訊息：「訂單送出成功」）
- [x] 我的訂單頁：場次選單與訂單歷史 UI 正常運作
- [x] 統計頁：KPI 顯示與場次選擇 UI 正常運作
- [x] 管理者登入：密碼驗證成功（狀態：「已登入」）
- [x] 管理者介面：所有管理區塊可見（上傳/場次管理/啟用停用/匯出）
- [x] 管理者登出：成功登出（狀態：「未登入」）

UI 截圖證據（本 repo 內）：
- `.sisyphus/evidence/1-home.png` (259KB) - 首頁場次卡片與底部導覽列
- `.sisyphus/evidence/6-order-bottom-sheet.png` (106KB) - 訂購 bottom sheet 與選項配置
- `.sisyphus/evidence/9-admin.png` (274KB) - 管理者介面登入後狀態

完整測試清單詳見：
- `.sisyphus/evidence/10-final-checklist.txt`

### GitHub Pages 部署完成（2026-01-30）

- [x] GitHub Actions 工作流程配置（`.github/workflows/deploy.yml`）
- [x] 自動化部署：push to `main` → 自動執行 `npm install` + `npm run build` + deploy
- [x] 環境變數配置：`VITE_API_BASE_URL` 設定於 GitHub Secrets
- [x] 靜態資產載入正常（CSS/JS/icon 無 404）
- [x] Hash 路由正常運作（可直開 URL、可 refresh）
- [x] API 呼叫正常（已連接至真實 GAS Web App）

部署工作流程：
1. Push 到 `main` 分支觸發 GitHub Actions
2. Actions 執行 `npm install` 安裝依賴
3. 使用 GitHub Secrets 中的 `VITE_API_BASE_URL` 執行 `npm run build`
4. 將 `dist/` 目錄上傳至 GitHub Pages
5. 自動部署並生效

**專案現已完全上線，可透過 GitHub Pages URL 訪問。**

### 最新 UI 改進（2026-01-30）

- [x] 調整管理頁面區塊順序：管理 → 場次管理 → 訂單匯出 → 資料上傳 → 啟用/停用
- [x] 簡化流水號格式：`OS2026-01-29T21:49:36`（移除 storeType 後綴與隨機碼）
- [x] 統計頁面加入管理者登入檢查：未登入時不呼叫 API，顯示提示訊息
- [x] 所有 API 等待狀態加入 spinner 動畫（訂購/我的訂單/統計/管理頁面）

---

## 技術架構

前端（GitHub Pages）：
- Vue 3 + Vite + Tailwind CSS
- Hash Router（避免 GitHub Pages refresh 404）
- PWA 只做 manifest，不做 Service Worker

後端（Google Apps Script Web App）：
- doGet/doPost action router
- POST 使用 `application/x-www-form-urlencoded`
- 回應 JSON（ContentService）
- Script Properties 保存敏感資訊（AdminPassword / TokenSecret / SpreadsheetId）

資料庫：
- Google Sheets（Config / Stores / Products / CurrentOrder / Orders）

---

## 已定案的產品決策

- 使用者身分：只輸入姓名（localStorage）
- 訂單場次：手動開/關
- 同時開單：最多 2 個 open 場次（drink + meal 各一個）
- 飲料選項：全站預設 + 店家覆寫（不做品項覆寫）
  - Size：大杯 / 中杯 / 小杯
  - Sugar：正常 / 半糖 / 三分糖 / 一分糖 / 無糖（存中文）
  - Ice：正常冰 / 少冰 / 微冰 / 去冰 / 溫 / 熱
- 管理者：
  - 密碼在部署時設定一次（不寫進文件/前端）
  - adminToken 有效期 6 小時；存 sessionStorage；登出清除
  - 後續管理 API 一律用 POST body 傳 adminToken
- 上傳：CSV 管線分隔，JSON 陣列；Upsert（同 ID 更新）
- 通知：不做（Email/Line 都不做）
- 深色模式：不做

---

## 專案結構

```
.
├── .github/
│   └── workflows/
│       └── deploy.yml        # GitHub Actions 自動部署配置
├── backend/apps-script/      # GAS 原始碼（Web App）
│   ├── Code.gs               # doGet/doPost + router
│   ├── actions.gs            # 使用者端 API
│   ├── orderActions.gs       # 訂單操作、統計、匯出
│   ├── adminActions.gs       # 管理者登入/開關單/上傳/匯出
│   ├── dataStore.gs          # Sheets 存取與通用工具
│   └── sheetsInit.gs         # Sheets 初始化（可重跑）
├── docs/
│   ├── sheets-schema.md      # Sheets schema + 初始化說明
│   ├── manual-qa.md          # curl 手動驗證指令
│   └── deployment.md         # 部署流程
├── public/
│   ├── icon.svg
│   └── manifest.webmanifest
├── src/
│   ├── pages/                # Order/MyOrders/Stats/Admin
│   ├── services/api.js       # API wrapper
│   ├── styles/               # tokens.css + main.css
│   ├── App.vue
│   └── main.js
├── index.html
├── vite.config.js
├── tailwind.config.cjs
└── package.json
```

---

## 需要的套件與工具

前端依賴（package.json）：
- vue
- vue-router

前端 devDependencies：
- vite
- @vitejs/plugin-vue
- tailwindcss
- postcss
- autoprefixer
- typescript（目前未啟用 ts 專案，但保留）

後端（GAS）：
- 不需 npm 套件，直接在 Apps Script 環境執行

---

## 環境設定

### 本地開發

前端 `.env.local`（根目錄新增，僅用於本地開發）：

```
VITE_API_BASE_URL=https://script.google.com/macros/s/XXXX/exec
```

### GitHub Pages 部署

GitHub Repository Secrets（Settings → Secrets and variables → Actions）：

```
VITE_API_BASE_URL=https://script.google.com/macros/s/XXXX/exec
```

此環境變數會在 GitHub Actions build 時自動注入。

### Google Apps Script

Apps Script Script Properties（後台設定）：
- SpreadsheetId
- AdminPassword
- TokenSecret

---

## 執行方式

### 本地開發

```bash
npm install
npm run dev
```

建置與預覽：

```bash
npm run build
npm run preview
```

### 部署到 GitHub Pages

部署已完全自動化，只需：

```bash
git add .
git commit -m "your commit message"
git push origin main
```

GitHub Actions 會自動執行：
1. 安裝依賴（`npm install`）
2. 建置專案（`npm run build`，使用 GitHub Secrets 中的 `VITE_API_BASE_URL`）
3. 部署到 GitHub Pages

部署狀態可在 GitHub Repository 的 **Actions** 頁籤查看。

---

## Sheets 初始化

請參考 `docs/sheets-schema.md`：
- 可手動建立 tabs + headers
- 或把 `backend/apps-script/sheetsInit.gs` 加進 GAS 專案，執行 `initSpreadsheet('SPREADSHEET_ID')`

---

## 手動驗證（API）

請參考 `docs/manual-qa.md` 的 curl 指令。

亦可使用腳本：

```bash
source scripts/env.sample
bash scripts/manual-qa.sh
```

## 範例資料（可直接上傳）

位於 `docs/sample-data/`：

- `stores.csv` / `stores.json`
- `products.csv` / `products.json`

可用腳本快速上傳：

```bash
bash scripts/seed-data.sh
```

## 管理者輔助腳本

- `scripts/admin-login.sh`
- `scripts/open-sessions.sh`
- `scripts/close-session.sh`
- `scripts/export-orders.sh`

---

## 開發進度清單（計畫同步）

已完成：
- ✅ 1 前端骨架
- ✅ 2 GAS 骨架
- ✅ 3 Sheets schema 初始化
- ✅ 4 getCurrentOrders + getProducts
- ✅ 5 submitOrder（LockService）
- ✅ 6 訂購頁 UI + bottom sheet
- ✅ 7 update/cancel/myOrders/orderSessions
- ✅ 8 getStatistics + exportOrders
- ✅ 9 管理者後台（登入/上傳/開關單/登出）
- ✅ 10 前端 UI 端到端驗收（已用真實 GAS + Sheets 完成）
- ✅ 11 GitHub Actions 自動部署配置
- ✅ 12 GitHub Pages 部署驗證（資產載入、hash 路由、API 連接皆正常）

待完成（可選）：
- 正式上線準備（替換測試資料為正式店家/品項，清理測試訂單）

---

## 接下來要做什麼（給下一個 AI/工程師）

**🎉 核心功能與部署皆已完成！** 專案已上線並可透過 GitHub Pages 訪問。

### 正式上線前準備（可選）

若要將此系統用於正式環境：

1. **替換測試資料**：
   - 在 Google Sheets `Stores` 表格中替換為正式店家資料
   - 在 Google Sheets `Products` 表格中替換為正式商品/品項資料
   - 也可使用管理者後台的「資料上傳」功能批次上傳

2. **清理測試訂單**：
   - 清空 `Orders` 表格中的測試訂單
   - 清空 `CurrentOrder` 表格中的測試場次

3. **確認設定**：
   - 確認 GAS Script Properties 中的 `AdminPassword` 已妥善保管
   - 確認 GitHub Secrets 中的 `VITE_API_BASE_URL` 正確指向正式 GAS Web App

### 長期維護

1. **資料備份**：
   - 定期使用管理者後台的「訂單匯出」功能下載備份
   - 或直接在 Google Sheets 中建立副本

2. **容量監控**：
   - 監控 `Orders` 表格的列數（Google Sheets 單一表格上限 1,000萬 cells）
   - 必要時可歸檔舊訂單至其他 sheet 或檔案

3. **系統更新**：
   - 前端更新：修改程式碼後 push 到 `main`，GitHub Actions 會自動部署
   - 後端更新：在 Apps Script 介面修改程式碼後，重新部署 Web App

### 開發注意事項

- **環境變數**：`.env.local` 包含 GAS Web App URL，請勿 commit（已在 `.gitignore` 排除）
- **部署流程**：所有 push 到 `main` 的 commit 都會觸發自動部署
- **API 測試**：可使用 `docs/manual-qa.md` 中的 curl 指令測試 GAS API

---

## 重要限制（勿違反）

- 不使用自訂 headers（避免 CORS/preflight）
- 不做 Service Worker / 通知 / 深色模式 / 付款 / 帳號系統
- Token 只放 POST body，前端用 sessionStorage

---

## 參考文件

- `docs/sheets-schema.md`
- `docs/manual-qa.md`
- `docs/deployment.md`
- `.sisyphus/plans/office-order-system.md`
