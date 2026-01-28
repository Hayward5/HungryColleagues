# 辦公室訂飲料與訂便當系統設計文件

**建立日期**: 2026-01-26  
**專案名稱**: Office Order System (辦公室訂餐系統)  
**文件狀態**: 設計階段 - 進行中

---

## 目錄

1. [專案概述](#專案概述)
2. [技術架構](#技術架構)
3. [已確認的設計決策](#已確認的設計決策)
4. [資料庫結構設計](#資料庫結構設計)
5. [API 設計](#api-設計)
6. [前端頁面結構](#前端頁面結構)
7. [待確認事項](#待確認事項)
8. [下一步驟](#下一步驟)
9. [進度更新（2026-01-28）](#進度更新2026-01-28)

---

## 專案概述

### 目標
開發一個供辦公室同事使用的訂飲料與訂便當網頁系統，提供類似 App 的使用體驗。

### 核心需求
- **前端**: 使用 GitHub Pages 部署，採用 HTML/CSS/JavaScript + PWA (manifest.json)
- **後端**: Google Apps Script + Google Sheets
- **管理者功能**: 
  - 以 CSV 或 JSON 格式上傳飲料/便當資訊
  - 選擇開放特定店家供使用者訂購
  - 統計頁面管理訂單與總金額
- **使用者功能**:
  - 點選方式選擇飲料或便當
  - 飲料可選擇大小杯、甜度、冰塊
  - 便當可輸入備註（限制 15 字內）

---

## 技術架構

### 整體架構

```
┌─────────────────────────────────────┐
│      前端 (GitHub Pages)            │
│  - HTML/CSS/JavaScript              │
│  - PWA (manifest.json)              │
│  - 響應式設計 (手機優先)            │
│  - localStorage (使用者資料)        │
└──────────────┬──────────────────────┘
               │ AJAX (fetch API)
               │ JSON 格式
┌──────────────┴──────────────────────┐
│   後端 (Google Apps Script)         │
│  - RESTful API (doGet/doPost)       │
│  - 業務邏輯處理                     │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│   資料庫 (Google Sheets)            │
│  - Stores (店家)                    │
│  - Products (產品)                  │
│  - CurrentOrder (當前訂單場次)      │
│  - Orders (訂單)                    │
│  - Config (系統配置)                │
└─────────────────────────────────────┘
```

### 前端技術棧
- **純 HTML/CSS/JavaScript** 或使用輕量框架（如 Alpine.js）
- **單頁應用 (SPA)** 架構
- **PWA** 支援（manifest.json、service worker 可選）
- **響應式設計**，優先考慮手機體驗

### 後端技術棧
- **Google Apps Script** 提供 Web App API
- **Google Sheets** 作為資料庫

---

## 已確認的設計決策

### 1. 使用者身份驗證
✅ **決策**: 簡單的名字輸入即可
- 使用者第一次使用時輸入姓名
- 儲存在 localStorage
- 不需要複雜的登入機制

### 2. 訂單管理流程
✅ **決策**: 管理者手動開關訂單
- 管理者手動開啟訂單場次
- 使用者可在開放期間訂購
- 管理者手動關閉訂單

### 3. 資料儲存架構
✅ **決策**: 使用單一 Google Sheet 檔案
- 所有資料儲存在一個 Google Sheet
- 使用不同分頁區分資料類型

### 4. 管理者操作方式
✅ **決策**: 在網頁中集成管理後台
- 提供網頁管理界面
- 需要管理者密碼登入
- 所有管理功能透過網頁操作

### 5. 使用者訂單修改權限
✅ **決策**: 可以修改和取消訂單
- 在訂單場次關閉前可隨時修改
- 可以取消訂單

### 6. 統計頁面訪問權限
✅ **決策**: 所有人可見，管理者可編輯
- 所有使用者都可以看到統計資料
- 只有管理者可以進行管理操作

### 7. 前端技術選型
✅ **決策**: Vue 3 + Vite + Tailwind CSS
- 採用 Vue 3 SPA（Hash Router）
- 使用 Vite 建置後部署到 GitHub Pages
- UI 使用 Tailwind CSS（可搭配少量自訂 CSS 變數做主題）

### 8. UI 視覺風格（網頁端 / PWA）
✅ **決策**: 「溫暖菜單」風格（適合飲料/便當情境）
- 色彩：奶油底色 + 暖棕主色；重點 CTA 使用高對比色
- 字體：標題用 Playfair Display SC（招牌感），內文/表單用 Karla（易讀）
- 互動：底部導覽列、產品卡片、底部抽屜式 Modal（bottom sheet）作為訂購表單

### 9. 深色模式
✅ **決策**: 不做深色模式（先把亮色主題打磨到精緻）

### 10. PWA 離線/快取（Service Worker）
✅ **決策**: 不需要 Service Worker（僅保留 manifest.json）

### 11. 前後端傳輸策略（避免 CORS / preflight）
✅ **決策**: POST 採用表單編碼（application/x-www-form-urlencoded）
- 前端概念上仍以 JSON 結構組資料，但傳輸層用表單編碼，降低跨網域 preflight 風險
- 回傳維持 JSON 格式（字串化 JSON）

---

## 資料庫結構設計

### Google Sheets 分頁規劃

#### 1. Stores 分頁（店家資訊）

| 欄位名稱 | 資料類型 | 說明 | 範例 |
|---------|---------|------|------|
| StoreID | String | 唯一識別碼 | S001 |
| StoreName | String | 店家名稱 | 50嵐 |
| StoreType | String | 類型 | drink / meal |
| IsActive | Boolean | 是否啟用 | TRUE / FALSE |
| CreatedAt | DateTime | 建立時間 | 2026-01-26 10:00:00 |

#### 2. Products 分頁（產品資訊）

| 欄位名稱 | 資料類型 | 說明 | 範例 |
|---------|---------|------|------|
| ProductID | String | 唯一識別碼 | P001 |
| StoreID | String | 所屬店家 | S001 |
| ProductName | String | 產品名稱 | 珍珠奶茶 |
| Price | Number | 價格 | 50 |
| Category | String | 分類 | 茶類 / 飯類 |
| HasSizeOption | Boolean | 是否有大小杯 | TRUE / FALSE |
| HasSugarOption | Boolean | 是否有甜度 | TRUE / FALSE |
| HasIceOption | Boolean | 是否有冰塊 | TRUE / FALSE |
| AllowNote | Boolean | 是否允許備註 | TRUE / FALSE |
| IsActive | Boolean | 是否啟用 | TRUE / FALSE |

#### 3. CurrentOrder 分頁（當前訂單配置）

| 欄位名稱 | 資料類型 | 說明 | 範例 |
|---------|---------|------|------|
| OrderSessionID | String | 訂單場次 ID | OS20260126001 |
| StoreID | String | 本次開放的店家 | S001 |
| Status | String | 狀態 | open / closed |
| CreatedBy | String | 管理者名稱 | 王管理員 |
| CreatedAt | DateTime | 開始時間 | 2026-01-26 10:00:00 |
| ClosedAt | DateTime | 結束時間 | 2026-01-26 11:30:00 |

#### 4. Orders 分頁（使用者訂單）

| 欄位名稱 | 資料類型 | 說明 | 範例 |
|---------|---------|------|------|
| OrderID | Number | 訂單 ID（自動遞增） | 1 |
| OrderSessionID | String | 對應的訂單場次 | OS20260126001 |
| UserName | String | 訂購人姓名 | 王小明 |
| ProductID | String | 產品 ID | P001 |
| ProductName | String | 產品名稱（冗餘） | 珍珠奶茶 |
| Price | Number | 價格 | 50 |
| Size | String | 大小杯 | 大杯 / 中杯 / 小杯 |
| Sugar | String | 甜度 | 正常 / 少糖 / 半糖 / 微糖 / 無糖 |
| Ice | String | 冰塊 | 正常冰 / 少冰 / 微冰 / 去冰 / 溫 / 熱 |
| Note | String | 備註（最多15字） | 不要香菜 |
| CreatedAt | DateTime | 訂單建立時間 | 2026-01-26 10:15:00 |
| UpdatedAt | DateTime | 最後修改時間 | 2026-01-26 10:20:00 |
| Status | String | 狀態 | active / cancelled |

#### 5. Config 分頁（系統配置）

| 欄位名稱 | 資料類型 | 說明 | 範例 |
|---------|---------|------|------|
| Key | String | 配置鍵 | AdminPassword |
| Value | String | 配置值 | admin123 |

**預設配置項目**:
- `AdminPassword`: `admin123`（管理者密碼）
- `AppName`: `辦公室訂餐系統`
- `MaxNoteLength`: `15`

---

## API 設計

### 使用者端 API

#### 1. 獲取當前訂單場次
- **方法**: GET
- **參數**: `action=getCurrentOrder`
- **回傳**: 
  ```json
  {
    "success": true,
    "data": {
      "orderSessionId": "OS20260126001",
      "storeId": "S001",
      "storeName": "50嵐",
      "storeType": "drink",
      "status": "open",
      "createdAt": "2026-01-26 10:00:00"
    }
  }
  ```

#### 2. 獲取產品列表
- **方法**: GET
- **參數**: `action=getProducts&storeId=S001`
- **回傳**:
  ```json
  {
    "success": true,
    "data": [
      {
        "productId": "P001",
        "productName": "珍珠奶茶",
        "price": 50,
        "category": "茶類",
        "hasSizeOption": true,
        "hasSugarOption": true,
        "hasIceOption": true,
        "allowNote": false
      }
    ]
  }
  ```

#### 3. 提交訂單
- **方法**: POST
- **參數**: `action=submitOrder`
- **Body**:
  ```json
  {
    "userName": "王小明",
    "productId": "P001",
    "size": "大杯",
    "sugar": "半糖",
    "ice": "少冰",
    "note": ""
  }
  ```
- **回傳**:
  ```json
  {
    "success": true,
    "orderId": 123,
    "message": "訂單提交成功"
  }
  ```

#### 4. 修改訂單
- **方法**: POST
- **參數**: `action=updateOrder`
- **Body**:
  ```json
  {
    "orderId": 123,
    "size": "中杯",
    "sugar": "微糖",
    "ice": "去冰",
    "note": ""
  }
  ```
- **回傳**:
  ```json
  {
    "success": true,
    "message": "訂單修改成功"
  }
  ```

#### 5. 取消訂單
- **方法**: POST
- **參數**: `action=cancelOrder`
- **Body**:
  ```json
  {
    "orderId": 123,
    "userName": "王小明"
  }
  ```
- **回傳**:
  ```json
  {
    "success": true,
    "message": "訂單取消成功"
  }
  ```

#### 6. 查詢我的訂單
- **方法**: GET
- **參數**: `action=getMyOrders&userName=王小明`
- **回傳**:
  ```json
  {
    "success": true,
    "data": [
      {
        "orderId": 123,
        "productName": "珍珠奶茶",
        "size": "大杯",
        "sugar": "半糖",
        "ice": "少冰",
        "price": 50,
        "createdAt": "2026-01-26 10:15:00"
      }
    ],
    "totalAmount": 50
  }
  ```

#### 7. 獲取統計資料
- **方法**: GET
- **參數**: `action=getStatistics&orderSessionId=OS20260126001`
- **回傳**:
  ```json
  {
    "success": true,
    "data": {
      "ordersByUser": [
        {
          "userName": "王小明",
          "orders": [...],
          "totalAmount": 100
        }
      ],
      "ordersByProduct": [...],
      "grandTotal": 500,
      "orderCount": 10
    }
  }
  ```

### 管理者端 API

#### 1. 管理者登入
- **方法**: POST
- **參數**: `action=adminLogin`
- **Body**:
  ```json
  {
    "password": "admin123"
  }
  ```
- **回傳**:
  ```json
  {
    "success": true,
    "adminToken": "token_abc123xyz",
    "expiresIn": 3600
  }
  ```

#### 2. 上傳店家和產品資料
- **方法**: POST
- **參數**: `action=uploadData&adminToken=xxx`
- **Body**:
  ```json
  {
    "dataType": "store",
    "format": "json",
    "data": [...]
  }
  ```
- **回傳**:
  ```json
  {
    "success": true,
    "message": "資料上傳成功",
    "insertedCount": 5
  }
  ```

#### 3. 開啟訂單場次
- **方法**: POST
- **參數**: `action=openOrder&adminToken=xxx`
- **Body**:
  ```json
  {
    "storeId": "S001",
    "adminName": "王管理員"
  }
  ```
- **回傳**:
  ```json
  {
    "success": true,
    "orderSessionId": "OS20260126001",
    "message": "訂單場次開啟成功"
  }
  ```

#### 4. 關閉訂單場次
- **方法**: POST
- **參數**: `action=closeOrder&adminToken=xxx`
- **Body**:
  ```json
  {
    "orderSessionId": "OS20260126001"
  }
  ```
- **回傳**:
  ```json
  {
    "success": true,
    "message": "訂單場次關閉成功"
  }
  ```

#### 5. 獲取所有店家列表
- **方法**: GET
- **參數**: `action=getStores&adminToken=xxx`
- **回傳**:
  ```json
  {
    "success": true,
    "data": [
      {
        "storeId": "S001",
        "storeName": "50嵐",
        "storeType": "drink",
        "isActive": true
      }
    ]
  }
  ```

#### 6. 啟用/停用店家或產品
- **方法**: POST
- **參數**: `action=toggleActive&adminToken=xxx`
- **Body**:
  ```json
  {
    "type": "store",
    "id": "S001",
    "isActive": false
  }
  ```
- **回傳**:
  ```json
  {
    "success": true,
    "message": "狀態更新成功"
  }
  ```

#### 7. 匯出訂單資料
- **方法**: GET
- **參數**: `action=exportOrders&adminToken=xxx&orderSessionId=OS20260126001`
- **回傳**:
  ```json
  {
    "success": true,
    "data": [
      {
        "userName": "王小明",
        "productName": "珍珠奶茶",
        "options": "大杯/半糖/少冰",
        "price": 50
      }
    ]
  }
  ```

---

## 前端頁面結構

### 頁面架構（單頁應用）

#### 1. 首頁 / 使用者訂購頁面
- **路由**: `/` 或 `/#/order`
- **功能**:
  - 初次進入要求輸入姓名（儲存到 localStorage）
  - 顯示當前開放的店家名稱
  - 顯示訂單狀態（開放中 / 已關閉）
  - 產品列表（卡片式設計）
  - 每個產品顯示：名稱、價格、分類
  - 點擊產品開啟訂購表單
- **UI 元素**:
  - 頂部：店家名稱 + 狀態徽章
  - 中間：產品卡片網格
  - 底部：導航列（訂購、我的訂單、統計）

#### 2. 訂購表單頁面（Modal 彈窗）
- **觸發**: 點擊產品卡片
- **功能**:
  - 顯示產品名稱和價格
  - **飲料選項**:
    - 大小杯（單選按鈕）
    - 甜度（單選按鈕）
    - 冰塊（單選按鈕）
  - **便當選項**:
    - 備註輸入框（限制 15 字，即時顯示剩餘字數）
  - 確認送出按鈕
- **驗證**:
  - 飲料必須選擇大小杯、甜度、冰塊
  - 便當備註不可超過 15 字

#### 3. 我的訂單頁面
- **路由**: `/#/my-orders`
- **功能**:
  - 顯示當前場次我的所有訂單
  - 訂單卡片顯示：
    - 產品名稱
    - 選項（大小杯/甜度/冰塊 或 備註）
    - 價格
    - 訂購時間
  - 每筆訂單提供修改和取消按鈕
  - 顯示我的訂單總金額
- **互動**:
  - 點擊修改：開啟修改表單（類似訂購表單）
  - 點擊取消：確認後取消訂單

#### 4. 統計頁面（所有人可見）
- **路由**: `/#/statistics`
- **功能**:
  - 檢視模式切換：按人員分組 / 按產品分組
  - **按人員分組**:
    - 每個人的訂單列表
    - 個人小計
  - **按產品分組**:
    - 每個產品的訂購數量
    - 產品小計
  - 總金額統計
  - 訂單總數統計

#### 5. 管理者後台頁面
- **路由**: `/#/admin`
- **功能**:
  - **登入畫面**: 密碼輸入
  - **登入後功能選單**:
    - 上傳資料
    - 開啟訂單
    - 關閉訂單
    - 店家管理
    - 訂單歷史
- **上傳資料介面**:
  - 選擇檔案（CSV / JSON）
  - 選擇類型（店家 / 產品）
  - 上傳按鈕
  - 預覽已上傳資料
- **開啟訂單介面**:
  - 店家下拉選單
  - 管理者姓名輸入
  - 開啟按鈕
- **店家管理介面**:
  - 店家列表
  - 啟用 / 停用開關
  - 編輯 / 刪除按鈕

### 導航結構

```
底部導航列
├── 訂購（首頁）
├── 我的訂單
├── 統計
└── 管理（需密碼）
```

### PWA 配置

**manifest.json** 範例:
```json
{
  "name": "辦公室訂餐系統",
  "short_name": "訂餐",
  "description": "辦公室訂飲料與訂便當系統",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4CAF50",
  "icons": [
    {
      "src": "/images/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/images/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 待確認事項

### 前端實作細節

- [ ] **前端框架選擇**
  - 純 JavaScript
  - Alpine.js（輕量級）
  - Vue.js（功能完整）
  - React（較重量級）

- [ ] **UI 框架選擇**
  - 純 CSS 手寫
  - Tailwind CSS
  - Bootstrap
  - Material Design

- [ ] **是否需要 Service Worker**（離線功能）
  - 完整離線支援
  - 僅快取靜態資源
  - 不需要

> 以上三項已於 2026-01-28 確認：Vue 3 + Vite + Tailwind CSS；不需要 Service Worker。

### 資料上傳格式

- [ ] **CSV 格式定義**
  - 店家 CSV 欄位順序
  - 產品 CSV 欄位順序
  - 範例檔案

- [ ] **JSON 格式定義**
  - 店家 JSON 結構
  - 產品 JSON 結構
  - 範例檔案

### 訂單選項細節

- [ ] **飲料大小杯選項**
  - 大杯 / 中杯 / 小杯
  - 或其他自訂選項

- [ ] **甜度選項**
  - 正常 / 少糖 / 半糖 / 微糖 / 無糖
  - 或其他自訂選項

- [ ] **冰塊選項**
  - 正常冰 / 少冰 / 微冰 / 去冰 / 溫 / 熱
  - 或其他自訂選項

> 尚待決策：選項採「全站固定一套」或「依店家/品項可自訂」。

### 其他功能

- [ ] **訂單通知機制**
  - Email 通知
  - Line Notify
  - 不需要

- [ ] **訂單截止時間設定**
  - 固定時間自動關閉
  - 僅手動關閉

- [ ] **歷史訂單查詢**
  - 使用者可查看過往訂單
  - 僅管理者可查看
  - 不需要

- [ ] **多幣別支援**
  - 僅台幣
  - 支援多幣別

---

## 下一步驟

### 待討論項目（優先順序）

1. **確認前端技術選型**（框架、UI 框架）
2. **定義資料上傳格式**（CSV/JSON 範例）
3. **確認訂單選項細節**（大小杯、甜度、冰塊的具體選項）
4. **討論其他擴充功能需求**（通知、自動關閉等）

> 2026-01-28 已完成：第 1 項（Vue 3 + Vite + Tailwind CSS）、Service Worker 不需要、UI 風格確定（溫暖菜單）。

### 設計完成後

1. 建立專案目錄結構
2. 初始化 Git 儲存庫
3. 建立 GitHub 儲存庫並啟用 GitHub Pages
4. 設定 Google Sheets 和 Apps Script
5. 開發前端頁面
6. 開發後端 API
7. 整合測試
8. 部署上線

---

## 附註

### 技術限制與注意事項

1. **Google Apps Script 限制**:
   - 執行時間限制：6 分鐘（單次請求）
   - 每日 URL Fetch 配額限制
   - 同時請求數限制

2. **GitHub Pages 限制**:
   - 僅支援靜態檔案
   - 檔案大小限制：單檔 100MB
   - 儲存庫大小建議 < 1GB

3. **localStorage 限制**:
   - 儲存空間約 5-10MB
   - 資料可能被使用者清除
   - 僅限同源存取

### 安全性考量

1. **管理者認證**:
   - 初期使用簡單密碼（儲存在 Config）
   - Token 有效期限制（建議 1 小時）
   - 考慮未來升級為更安全的認證方式

2. **API 安全**:
   - Google Apps Script 部署為「任何人都可存取」
   - 依賴 adminToken 進行管理者權限驗證
   - 考慮加入 CORS 限制

4. **跨網域相容性（GitHub Pages → Apps Script Web App）**
   - 為降低瀏覽器 CORS/preflight 的不確定性：POST 以 `application/x-www-form-urlencoded` 送出
   - 避免自訂 header（例如 Authorization）造成額外 preflight；管理者 token 儘量以 query 或表單欄位傳遞（並搭配短時效）

---

## 進度更新（2026-01-28）

### 本次確認結果（可直接接續開發）
- 技術選型：Vue 3 + Vite + Tailwind CSS（GitHub Pages 部署）
- UI：溫暖菜單風格（奶油底色 + 暖棕主色；Playfair Display SC + Karla）
- 深色模式：不做
- PWA：僅 manifest.json，不做 Service Worker
- API 傳輸：POST 使用表單編碼（`application/x-www-form-urlencoded`）以降低 CORS/preflight 風險

### 下一個阻塞決策（先決定這個再往下寫）
- 飲料選項（大小/甜度/冰塊）：全站固定一套，或依店家/品項可自訂

### 建議的接續工作順序
1. 定案：飲料選項策略（固定 vs 可自訂）
2. 補齊：上傳格式定義（CSV 欄位順序、JSON schema、範例檔）
3. 建立：專案目錄結構（前端 Vue 專案 + Apps Script 專案）
4. 實作：GAS API（先最小可用的 getCurrentOrder/getProducts/submitOrder）
5. 實作：前端 4 個主要頁（訂購/我的訂單/統計/管理者），並用「溫暖菜單」設計系統落地

3. **資料驗證**:
   - 前端和後端都需進行輸入驗證
   - 防止 SQL Injection（雖然用 Sheets，但仍需注意）
   - 限制資料長度和格式

---

**文件結束**

如有任何問題或需要調整的地方，請隨時提出討論。
