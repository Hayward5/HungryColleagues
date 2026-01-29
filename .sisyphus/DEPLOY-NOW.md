# 🚀 GitHub Pages 部署 - 立即執行步驟

**狀態**：程式碼已準備完成，等待你執行 3 個步驟即可完成部署

---

## ✅ 已完成（由 AI 完成）

- [x] 建立 GitHub Actions workflow 檔案
- [x] 建立部署指南文件
- [x] 提交所有變更到 git
- [x] 清理臨時檔案

**目前有 4 個 commits 等待推送**：
```
973ec20 - chore: add GitHub Pages deployment workflow and guide
2ecb66b - Update boulder.json for Kebuke store data
f3b9d9f - Replace Hugan store data with Kebuke store data
f99f0bc - docs: add sample data for Kebuke store with 34 products
```

---

## 📋 你需要執行的 3 個步驟

### 步驟 1️⃣：推送程式碼到 GitHub

**在終端機執行**：

```bash
cd /home/lubuntu/app/office-order-system
git push origin main
```

**預期結果**：
```
Enumerating objects: XX, done.
Counting objects: 100% (XX/XX), done.
...
To https://github.com/Hayward5/office-order-system.git
   8e76f85..973ec20  main -> main
```

**如果遇到錯誤**：
- SSL 錯誤：`GIT_SSL_NO_VERIFY=true git push origin main`
- 認證錯誤：確認你的 GitHub 帳號已登入

✅ **完成後打勾**：[ ]

---

### 步驟 2️⃣：設定 GitHub Secret

**操作步驟**：

1. **開啟瀏覽器**，前往：
   ```
   https://github.com/Hayward5/office-order-system/settings/secrets/actions
   ```

2. **點擊右上角 "New repository secret" 按鈕**

3. **填寫表單**：
   
   **Name** (名稱欄位)：
   ```
   VITE_API_BASE_URL
   ```
   
   **Secret** (值欄位)：
   ```
   你的 GAS Web App URL（從 Google Apps Script 部署頁面取得）
   ```

4. **點擊 "Add secret" 按鈕**

5. **確認成功**：應該會看到 `VITE_API_BASE_URL` 出現在 Secrets 列表中

**為什麼需要這步驟？**
- `.env.local` 不會上傳到 GitHub（已在 .gitignore 排除）
- GitHub Actions 建置時需要知道 API URL
- Secrets 是 GitHub 提供的安全儲存方式

✅ **完成後打勾**：[ ]

---

### 步驟 3️⃣：啟用 GitHub Pages

**操作步驟**：

1. **開啟瀏覽器**，前往：
   ```
   https://github.com/Hayward5/office-order-system/settings/pages
   ```

2. **在 "Build and deployment" 區塊**：
   - **Source** 下拉選單：選擇 **GitHub Actions**
   - （不需要選擇 branch，因為我們用 Actions 自動部署）

3. **儲存設定**（如果有 Save 按鈕就點擊）

4. **觸發部署**：
   - 前往 **Actions** 標籤：
     ```
     https://github.com/Hayward5/office-order-system/actions
     ```
   - 應該會看到一個新的 workflow run 正在執行（黃色圓圈 🟡）
   - 等待約 1-2 分鐘，直到變成綠色勾勾 ✅

5. **確認部署成功**：
   - 回到 Pages 設定頁面
   - 應該會看到一個綠色框框顯示：
     ```
     Your site is live at https://hayward5.github.io/office-order-system/
     ```

✅ **完成後打勾**：[ ]

---

## 🎯 部署成功驗證清單

部署完成後，請確認以下項目：

### 電腦端驗證

1. **開啟網站**：
   ```
   https://hayward5.github.io/office-order-system/
   ```

2. **確認以下項目**：
   - [ ] 頁面正常載入（不是 404）
   - [ ] 首頁顯示「**GAS API**」（不是「本機示意」）
   - [ ] 可以輸入姓名並儲存
   - [ ] 可以看到開放中的訂單場次（暖心飲品/暖心便當）
   - [ ] 點擊場次可以看到商品列表
   - [ ] 可以選擇商品並開啟訂購表單

### 手機端驗證

1. **用手機瀏覽器開啟**：
   ```
   https://hayward5.github.io/office-order-system/
   ```

2. **加入主畫面**：
   
   **iOS Safari**：
   - 點擊底部分享按鈕 (⬆️)
   - 滑動找到「加入主畫面」
   - 設定名稱（例如：訂飲料）
   - 點擊「加入」
   
   **Android Chrome**：
   - 點擊右上角選單 (⋮)
   - 選擇「加入主畫面」
   - 設定名稱
   - 點擊「加入」

3. **測試功能**：
   - [ ] 從主畫面開啟 App
   - [ ] 可以正常瀏覽和下單
   - [ ] 介面在手機上顯示正常（響應式設計）

---

## 🔧 常見問題排解

### Q1: Actions 執行失敗，顯示 "VITE_API_BASE_URL is not defined"

**原因**：步驟 2 的 Secret 沒有設定成功

**解決方式**：
1. 回到步驟 2，重新設定 Secret
2. 確認名稱完全一致：`VITE_API_BASE_URL`（大小寫要一樣）
3. 確認值沒有多餘的空格
4. 重新觸發部署：在 Actions 頁面點擊 "Re-run all jobs"

---

### Q2: 網頁打開是空白的

**可能原因**：
1. 建置失敗
2. 路徑設定錯誤

**解決方式**：
1. 按 F12 開啟瀏覽器開發者工具
2. 查看 Console 標籤是否有錯誤訊息
3. 查看 Network 標籤，確認 JS/CSS 檔案是否載入成功（200 狀態碼）
4. 如果看到 404 錯誤，檢查 `vite.config.js` 的 `base` 設定是否為 `'./'`

---

### Q3: API 呼叫失敗，無法載入訂單場次

**可能原因**：
1. Secret 設定錯誤
2. GAS Web App 權限設定錯誤

**解決方式**：
1. 確認步驟 2 的 Secret 值正確（完整的 GAS URL）
2. 確認 GAS Web App 設定為 "Anyone can access"
3. 在瀏覽器 Console 查看實際的錯誤訊息

---

### Q4: 手機無法載入網站

**解決方式**：
1. 確認手機有網路連線
2. 嘗試清除瀏覽器快取
3. 使用無痕模式測試
4. 確認網址輸入正確（沒有多餘的空格）

---

## 📊 部署完成後的狀態

### 你的網站資訊

- **網站 URL**：`https://hayward5.github.io/office-order-system/`
- **GitHub Repository**：`https://github.com/Hayward5/office-order-system`
- **GAS Web App URL**：（已設定在 GitHub Secrets 中）
- **管理者密碼**：（已設定在 GAS Script Properties 中）

### 自動部署機制

**每次你推送程式碼到 GitHub**：
```bash
git add .
git commit -m "你的變更說明"
git push origin main
```

**GitHub Actions 會自動**：
1. 檢查程式碼
2. 安裝依賴套件
3. 執行建置（使用 Secret 中的 API URL）
4. 部署到 GitHub Pages

**你不需要手動建置或上傳**，一切都是自動的！

---

## 🎉 下一步

部署成功後，你可以：

1. **分享網址給同事**：
   ```
   https://hayward5.github.io/office-order-system/
   ```

2. **開啟訂單場次**：
   - 用管理者身分登入
   - 開啟飲料或便當訂單場次
   - 同事就可以開始點餐

3. **開始使用**：
   - 用手機加入主畫面
   - 像使用 App 一樣點飲料/便當
   - 查看訂單統計

4. **持續開發**：
   - 修改程式碼
   - 推送到 GitHub
   - 自動部署更新

---

## 📚 相關文件

- **完整部署指南**：`.sisyphus/github-pages-deployment-guide.md`
- **專案 README**：`README.md`
- **Sheets Schema**：`docs/sheets-schema.md`
- **API 測試指令**：`docs/manual-qa.md`

---

**準備好了嗎？開始執行步驟 1 吧！** 🚀

**有任何問題，隨時回來查看這份文件。**
