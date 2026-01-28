# 辦公室訂飲料/便當系統（GitHub Pages + GAS + Sheets）

## TL;DR

> **Quick Summary**: 用 Vue 3 + Vite + Tailwind 做手機優先的 PWA 風格前端（GitHub Pages），後端用 Google Apps Script Web App + Google Sheets，支援同時開 2 個場次（飲料＋便當）。
>
> **Deliverables**:
> - 前端 SPA（訂購 / 我的訂單 / 統計 / 管理）＋ manifest.json
> - GAS Web App API（使用者端＋管理者端）
> - Google Sheets schema（Stores/Products/CurrentOrder/Orders/Config/…）
>
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: 建專案骨架 → Sheets schema → GAS API（最小可用）→ 前端串接與 UI 落地

---

## Context

### Original Request
- 辦公室同事使用的訂飲料與訂便當系統，類 App 體驗（PWA）。
- 前端 GitHub Pages，後端 Google Apps Script + Google Sheets。

### 設計共識（已定案）
- 前端：Vue 3 + Vite + Tailwind CSS；Hash Router。
- UI 視覺：溫暖菜單（奶油底色 + 暖棕主色；Playfair Display SC + Karla）；底部導覽列；bottom sheet 訂購表單。
- PWA：只做 `manifest.json`，不做 Service Worker；不做深色模式。
- 身分：使用者只輸入姓名（localStorage）。
- 訂單場次：手動開/關；不做自動截止。
- 同時開單：最多同時 2 個 open 場次（drink + meal 各一個）。
- 飲料選項策略：全站預設 + 店家覆寫（不做品項覆寫）。
  - Size：大杯/中杯/小杯
  - Sugar：正常/半糖/三分糖/一分糖/無糖（Orders.Sugar 存中文）
  - Ice：正常冰/少冰/微冰/去冰/溫/熱
- 管理者：
  - 密碼部署時手動設定一次（避免預設值落在文件/前端）
  - 敏感設定放 Apps Script Script Properties（AdminPassword、TokenSecret）
  - `adminToken` 6 小時有效期；前端存在 `sessionStorage`；登出清掉 token；後端不維護額外狀態（token 驗簽即可）
  - 管理 API：`adminToken` 一律放在 POST `application/x-www-form-urlencoded` body（不放 query、不用自訂 header）
- 上傳：CSV 用管線分隔清單（例如 `大杯|中杯|小杯`），JSON 用陣列；行為採 Upsert（同 ID 更新；停用用 `IsActive=FALSE`）。
- 使用者可看歷史：依 `OrderSessionID` 切換查看自己的過往訂單。
- 訂單通知：不做。
- 統計頁可見性：所有人可看統計；只有管理者可做管理操作（上傳/開關/匯出）。

### 研究/依據（權威與限制）
- GitHub Pages + Vite：必須設定 `base`；Hash Router 可避免 refresh/直連 404。
- GAS Web App：`doPost(e)` 可用 `e.parameter` 取得 form-urlencoded 解析後欄位；回 JSON 用 `ContentService.createTextOutput(JSON.stringify(...)).setMimeType(JSON)`。
- Sheets 並發：用 `LockService.getScriptLock()` 包 critical section（流水號 + 寫入）；Spreadsheet calls 要 batch。

**References**:
- `bento.md`（原始規格與 API/資料表初稿）
- `.sisyphus/drafts/office-order-system.md`（本次訪談定案彙整）

---

## Work Objectives

### Core Objective
交付一套可在辦公室實際使用的「雙場次（飲料＋便當）」訂購系統：能開單、選品、下單、改單、取消、統計與匯出，並能在 GitHub Pages + GAS Web App 穩定運作。

### Definition of Done
- 能在本機跑起前端並串到 GAS（或 mock endpoint），完成下列流程：
  - 使用者輸入姓名 → 看到 drink/meal 兩個場次狀態 → 選品下單 → 在「我的訂單」看到自己的訂單 → 可修改/取消（場次 open 時）
  - 管理者登入 → 上傳店家/產品 → 開啟 drink/meal 場次 → 在統計頁看到彙總 → 匯出
- GitHub Pages 部署後：站台可載入、路由可用（hash）、靜態資產不 404。

### Must NOT Have (Guardrails)
- 不做：深色模式、Service Worker、離線快取、通知（Email/Line）、付款、帳號系統、角色矩陣（admin/非 admin 以外）。
- 不用：自訂 headers（避免 preflight）；不把 token 放 query。
- 不做：自動截止與排程關單。

---

## Verification Strategy (MVP = Manual)

### Test Decision
- **Infrastructure exists**: NO（目前 repo 只有規格文件）
- **User wants tests**: Manual-only

### Evidence 規範
- 每個可交付功能至少留下：
  - 1 份 curl（或瀏覽器 console）可重現請求/回應
  - 重要 UI（訂購表單、統計頁、管理登入）截圖
  - 截圖存放：`.sisyphus/evidence/<task-id>-<name>.png`

---

## System Contracts (freeze early)

### Google Sheets Tabs（建議 schema）

> 原則：欄位先「少而穩」，能支援雙場次與歷史即可。

1) `Config`
- `Key` (string) / `Value` (string)
- 建議 keys（非敏感）：
  - `AppName`
  - `MaxNoteLength` (= 15)
  - `DefaultDrinkSizeOptions` (= `大杯|中杯|小杯`)
  - `DefaultDrinkSugarOptions` (= `正常|半糖|三分糖|一分糖|無糖`)
  - `DefaultDrinkIceOptions` (= `正常冰|少冰|微冰|去冰|溫|熱`)
  - `LastOrderId`（流水號）

2) `Stores`
- `StoreID` (string, PK)
- `StoreName` (string)
- `StoreType` (enum: `drink|meal`)
- `IsActive` (boolean)
- 飲料店覆寫（只在 `drink` 有效，CSV 管線分隔，空=不覆寫）：
  - `SizeOptionsOverride` (string)
  - `SugarOptionsOverride` (string)
  - `IceOptionsOverride` (string)
- `CreatedAt` (datetime)

3) `Products`
- `ProductID` (string, PK)
- `StoreID` (string, FK)
- `ProductName` (string)
- `Price` (number)
- `Category` (string)
- `HasSizeOption` (boolean)
- `HasSugarOption` (boolean)
- `HasIceOption` (boolean)
- `AllowNote` (boolean)
- `IsActive` (boolean)

4) `CurrentOrder`
- 允許同時 2 筆 open（drink + meal），每個 `StoreType` 最多 1 筆 open。
- `OrderSessionID` (string)
- `StoreType` (enum: `drink|meal`)
- `StoreID` (string)
- `Status` (enum: `open|closed`)
- `CreatedBy` (string)
- `CreatedAt` (datetime)
- `ClosedAt` (datetime)

5) `Orders`
- `OrderID` (number, PK, auto-increment via Config.LastOrderId within LockService)
- `OrderSessionID` (string)
- `StoreType` (enum: `drink|meal`)  // 方便統計與查詢
- `UserName` (string)
- `ProductID` (string)
- `ProductName` (string, denormalized)
- `Price` (number)
- `Size` (string)
- `Sugar` (string)  // 存中文：正常/半糖/三分糖/一分糖/無糖
- `Ice` (string)
- `Note` (string)
- `CreatedAt` (datetime)
- `UpdatedAt` (datetime)
- `Status` (enum: `active|cancelled`)

**時間/時區約定（預設）**:
- 所有時間戳以 Apps Script 所在專案的時區為準（`Session.getScriptTimeZone()`），存成 ISO 字串或可讀字串（但要一致）。

### API（action-based）

> 原則：GET 讀取；POST 改動。POST 一律 `application/x-www-form-urlencoded`。

使用者端（公開）：
- GET `action=getCurrentOrders`
  - 回：兩個 storeType 的 open/closed 狀態（若無該類型場次，回空）+ storeName + resolved option sets（drink）
- GET `action=getProducts&storeId=...`
- POST `action=submitOrder`（body：userName, orderSessionId, storeType, productId, size/sugar/ice/note）
- POST `action=updateOrder`（body：orderId, userName, size/sugar/ice/note）
- POST `action=cancelOrder`（body：orderId, userName）
- GET `action=getMyOrders&userName=...&orderSessionId=...`
- GET `action=getOrderSessions&userName=...`（列出此 user 的歷史場次清單與摘要，供前端切換）
- GET `action=getStatistics&orderSessionId=...&storeType=...`（storeType 可選；不傳則回兩種）

管理者端（需 token，且 token 放 POST body）：
- POST `action=adminLogin`（body：password）→ 回 `adminToken` + `expiresIn`
- POST `action=uploadData`（body：adminToken, dataType=`store|product`, format=`csv|json`, data=...）
- POST `action=openOrder`（body：adminToken, storeId, storeType, adminName）
- POST `action=closeOrder`（body：adminToken, storeType 或 orderSessionId）
- POST `action=getStores`（body：adminToken, storeType?）
- POST `action=toggleActive`（body：adminToken, type=`store|product`, id, isActive）
- POST `action=exportOrders`（body：adminToken, orderSessionId）

錯誤回應約定（所有 API）：
- `success: false`
- `error: { code: string, message: string }`

**Admin 密碼/TokenSecret 操作政策（MVP）**:
- TokenSecret 變更（旋轉）會使所有既有 `adminToken` 立刻失效；管理者需重新登入。
- AdminPassword 忘記時：在 Apps Script 內重新設定 Script Properties（不提供前台自助重設）。

---

## Execution Strategy

### Parallel Execution Waves

Wave 1（骨架/契約先行）
- 1. 建立前端專案骨架（Vue/Vite/Tailwind + Router + PWA manifest + 字體/主題 tokens）
- 2. 建立 GAS 專案骨架（Web App entrypoint + helpers + token 驗簽 + Sheets 存取層）
- 3. 凍結 Sheets schema（建立 tab/欄位與必要的初始化腳本）

Wave 2（最小可用流程）
- 4. GAS：getCurrentOrders/getProducts/submitOrder（含 LockService + 基本驗證）
- 5. 前端：訂購頁（拉 currentOrders + products，bottom sheet 下單）

Wave 3（完整 MVP）
- 6. GAS：update/cancel/myOrders/statistics + adminLogin/upload/open/close/export
- 7. 前端：我的訂單/統計/管理者（含登出）
- 8. 部署流程（GitHub Pages base、GAS Web App URL、手動驗證證據收集）

---

## TODOs

> 每個 TODO 都要產出可驗證結果（手動步驟 + 證據）。

- [x] 1. 建立前端專案骨架（Vue 3 + Vite + Tailwind + Hash Router + PWA manifest）

  **What to do**:
  - 建立 Vite + Vue 專案；加入 Tailwind；建立 Router（hash）。
  - 設定 GitHub Pages `base`；Router 使用 `createWebHashHistory(import.meta.env.BASE_URL)`。
  - 落地 UI tokens（CSS variables）與字體載入（Playfair Display SC + Karla）。

  **Must NOT do**:
  - 不要加入 Service Worker。

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Skills: `frontend-ui-ux`

  **References**:
  - `bento.md`（前端技術與 UI 方向）
  - Vite 官方 static deploy（GitHub Pages base）

  **Acceptance Criteria (Manual)**:
  - [ ] `npm run dev` 可啟動
  - [ ] `npm run build` 成功產出 `dist/`
  - [ ] `npm run preview` 可正常載入並切換路由（hash）
  - [ ] 截圖：首頁/底部導覽 `.sisyphus/evidence/1-home.png`

- [x] 2. 建立 Google Apps Script 專案骨架（Web App + utilities）

  **What to do**:
  - 建立 `doGet/doPost` entrypoint，統一 action router。
  - 統一回傳 JSON helper（ContentService JSON）。
  - 建立 Script Properties 讀取 helper（AdminPassword、TokenSecret）。

  **Must NOT do**:
  - 不要使用自訂 header 方案（Authorization）。

  **Recommended Agent Profile**:
  - Category: `unspecified-high`
  - Skills: (none required)

  **References**:
  - GAS Web Apps 官方文件（doGet/doPost）
  - GAS ContentService 官方文件

  **Acceptance Criteria (Manual)**:
  - [ ] 部署 Web App（任意人可存取）後，用 curl 呼叫一個最小 action（例如 ping）可回 JSON
  - [ ] curl 證據存 `.sisyphus/evidence/2-gas-ping.txt`

- [x] 3. 建立/初始化 Sheets schema（tabs + headers + 基礎 Config）

  **What to do**:
  - 建立上述 tabs；寫入欄位標題列；寫入 Config 的預設 option sets 與 `MaxNoteLength`。
  - 初始化 `LastOrderId=0`。

  **Recommended Agent Profile**:
  - Category: `unspecified-high`

  **Acceptance Criteria (Manual)**:
  - [ ] 試算表可看到所有 tabs 與欄位
  - [ ] Config 內可看到預設選項（size/sugar/ice）與 LastOrderId
  - [ ] 截圖 `.sisyphus/evidence/3-sheets-schema.png`

- [x] 4. GAS：實作 getCurrentOrders + getProducts（含 drink option resolved）

  **What to do**:
  - `getCurrentOrders` 回傳 drink/meal 兩個場次狀態。
  - drink 場次要回「解析後的 options arrays」（套用 store override 或 global default）。

  **Acceptance Criteria (Manual)**:
  - [ ] curl 呼叫 getCurrentOrders 回 JSON（含兩類型欄位）
  - [ ] curl 呼叫 getProducts 回 JSON（依 storeId）
  - [ ] 證據 `.sisyphus/evidence/4-current-products.txt`

- [x] 5. GAS：submitOrder（含 LockService + 基本驗證）

  **What to do**:
  - 在 lock 內：讀取並遞增 LastOrderId → append Orders。
  - 驗證：
    - storeType 與 orderSessionId 必須對得上 CurrentOrder 且 status=open
    - 飲料：若 Has*Option=true，對應欄位必填且必須在 option set 中
    - 便當：note 長度 <= 15（或 Config.MaxNoteLength）

  **References**:
  - LockService 官方文件

  **Acceptance Criteria (Manual)**:
  - [ ] 連續下單多筆，OrderID 單調遞增且不重複
  - [ ] curl 成功/失敗（驗證錯誤）各至少 1 例
  - [ ] 對 closed 場次下單必須失敗（回 success=false）
  - [ ] 證據 `.sisyphus/evidence/5-submitOrder.txt`

- [x] 6. 前端：訂購頁（雙場次狀態 + 產品列表 + bottom sheet 下單）

  **What to do**:
  - 首次進入要求輸入姓名（localStorage）。
  - 顯示 drink/meal 場次卡（開放/關閉、店家名）。
  - 點產品 → bottom sheet 表單：drink 顯示 size/sugar/ice；meal 顯示 note（字數倒數）。

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Skills: `frontend-ui-ux`

  **Acceptance Criteria (Manual)**:
  - [ ] 能在手機寬度下順暢操作（點卡片開 bottom sheet、送出、關閉）
  - [ ] 截圖 `.sisyphus/evidence/6-order-bottom-sheet.png`

- [x] 7. GAS：updateOrder/cancelOrder/getMyOrders/getOrderSessions（歷史）

  **What to do**:
  - update/cancel 需驗證 userName（只能改自己的）。
  - update/cancel 僅允許在該 orderSession 仍為 open 時（關單後一律拒絕）。
  - getOrderSessions 回傳此 user 有出現過的 OrderSessionID（含 storeType + createdAt）。

  **Acceptance Criteria (Manual)**:
  - [ ] update/cancel 對自己的訂單成功；對別人訂單失敗
  - [ ] myOrders 可依 OrderSessionID 切換
  - [ ] 證據 `.sisyphus/evidence/7-myorders-history.txt`

- [x] 8. GAS：getStatistics + exportOrders

  **What to do**:
  - 統計：按人/按品項；支援 storeType 篩選或同時回兩份。
  - export：回適合複製到 Excel 的結構（JSON 或 CSV 字串）。

  **Acceptance Criteria (Manual)**:
  - [ ] 統計結果與 Orders 實際資料一致（抽查至少 3 筆）
  - [ ] 證據 `.sisyphus/evidence/8-stats-export.txt`

- [x] 9. 管理者後台：登入、開/關單、上傳、登出

  **What to do**:
  - adminLogin → token 存 sessionStorage。
  - 後台頁提供：上傳（CSV/JSON）、開單（drink/meal 選店）、關單、啟用/停用、匯出。
  - 登出按鈕清除 sessionStorage。

  **Acceptance Criteria (Manual)**:
  - [ ] token 過期（可用縮短 expiry 測試）會被拒絕並要求重新登入
  - [ ] 截圖 `.sisyphus/evidence/9-admin.png`

- [ ] 10. 部署流程文件化與最終驗收

  **What to do**:
  - 文件化：GitHub Pages 設定（repo name 與 base）、GAS Web App URL、Script Properties 設定方式。
  - 最終手動驗收清單（使用者流程 + 管理者流程）。

  **Acceptance Criteria (Manual)**:
  - [ ] GitHub Pages 可開啟（資產不 404）
  - [ ] GAS endpoint 可被前端正常呼叫
  - [ ] 最終驗收紀錄 `.sisyphus/evidence/10-final-checklist.txt`

---

## Commit Strategy

> 若此 repo 之後初始化 git：建議小步提交。

- `chore(scaffold): init vue vite tailwind router`
- `feat(gas): add web app router and json helpers`
- `feat(gas): add submitOrder with locking and validation`
- `feat(ui): implement order flow bottom sheet`
- `feat(admin): admin login upload open close export`

---

## Success Criteria

### Final Checklist
- [ ] drink + meal 可同時開單並下單
- [ ] 使用者可查看歷史場次自己的訂單
- [ ] 管理者可上傳/開關/匯出
- [x] 不使用自訂 header、不做通知/SW/深色
