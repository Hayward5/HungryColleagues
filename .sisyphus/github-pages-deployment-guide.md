# GitHub Pages 部署指南

## 📱 目標
將辦公室訂飲料系統部署到 GitHub Pages，讓你可以用手機直接點菜。

---

## ✅ 前置準備檢查

### 1. 確認已完成項目
- [x] GAS Web App 已部署並取得 URL
- [x] `.env.local` 已設定 API URL
- [x] 本地測試成功（npm run dev）
- [x] 建置成功（npm run build）

### 2. 你的專案資訊
- **GitHub Repository**: `https://github.com/Hayward5/office-order-system`
- **GAS Web App URL**: （從你的 Google Apps Script 部署頁面取得）

---

## 📋 部署步驟

### 步驟 1: 推送程式碼到 GitHub

```bash
# 確認目前狀態
git status

# 推送所有提交到 GitHub
git push origin main
```

**注意**: `.env.local` 不會被推送（已在 .gitignore 排除），這是正確的！

---

### 步驟 2: 在 GitHub 啟用 GitHub Pages

1. **開啟瀏覽器**，前往你的 GitHub repository:
   ```
   https://github.com/Hayward5/office-order-system
   ```

2. **點擊 Settings** (設定) 標籤

3. **左側選單找到 Pages**

4. **設定 Source (來源)**:
   - Source: 選擇 `GitHub Actions`

---

### 步驟 3: 建立 GitHub Actions 部署工作流程

在專案根目錄建立 `.github/workflows/deploy.yml` 檔案：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run build
        env:
          VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

### 步驟 4: 設定 GitHub Secrets (重要！)

1. **前往 GitHub repository** → **Settings** → **Secrets and variables** → **Actions**

2. **點擊 "New repository secret"**

3. **新增 Secret**:
   - Name: `VITE_API_BASE_URL`
   - Value: `你的 GAS Web App URL（從 Google Apps Script 部署頁面取得）`

4. **點擊 "Add secret"**

**為什麼需要這步驟？**
- `.env.local` 不會上傳到 GitHub（安全考量）
- GitHub Actions 需要 API URL 才能建置
- Secrets 是安全儲存敏感資訊的方式

---

### 步驟 5: 提交並推送部署設定

```bash
# 建立 GitHub Actions 工作流程目錄
mkdir -p .github/workflows

# 建立部署設定檔（內容如步驟 3）
# 使用編輯器建立 .github/workflows/deploy.yml

# 提交變更
git add .github/workflows/deploy.yml
git commit -m "chore: add GitHub Pages deployment workflow"
git push origin main
```

---

### 步驟 6: 監控部署進度

1. **前往 GitHub repository** → **Actions** 標籤

2. **查看部署狀態**:
   - 綠色勾勾 ✅ = 部署成功
   - 紅色叉叉 ❌ = 部署失敗（點進去查看錯誤訊息）

3. **部署成功後**，你的網站會在：
   ```
   https://hayward5.github.io/office-order-system/
   ```

---

## 📱 手機使用方式

### 部署成功後

1. **用手機瀏覽器開啟**:
   ```
   https://hayward5.github.io/office-order-system/
   ```

2. **加入主畫面** (iOS Safari):
   - 點擊分享按鈕
   - 選擇「加入主畫面」
   - 設定名稱（例如：訂飲料）
   - 完成後會像 App 一樣出現在主畫面

3. **加入主畫面** (Android Chrome):
   - 點擊右上角選單 (⋮)
   - 選擇「加入主畫面」
   - 設定名稱
   - 完成

4. **開始使用**:
   - 輸入你的姓名
   - 選擇開放中的訂單場次
   - 選擇商品並下單
   - 完成！

---

## 🔧 常見問題排解

### Q1: Actions 顯示錯誤 "VITE_API_BASE_URL is not defined"
**解決方式**: 確認步驟 4 的 Secret 已正確設定

### Q2: 網頁打開是空白的
**解決方式**: 
- 檢查瀏覽器 Console (F12) 是否有錯誤
- 確認 `vite.config.js` 的 `base: './'` 設定正確

### Q3: API 呼叫失敗
**解決方式**:
- 確認 GAS Web App 設定為 "Anyone can access"
- 確認 Secret 中的 API URL 正確無誤

### Q4: 手機無法載入
**解決方式**:
- 確認手機有網路連線
- 嘗試清除瀏覽器快取
- 使用無痕模式測試

---

## 🎯 驗證清單

部署完成後，請確認：

- [ ] GitHub Actions 顯示綠色勾勾
- [ ] 可以用電腦瀏覽器開啟網站
- [ ] 可以用手機瀏覽器開啟網站
- [ ] 首頁顯示「GAS API」（不是「本機示意」）
- [ ] 可以輸入姓名並儲存
- [ ] 可以看到開放中的訂單場次
- [ ] 可以選擇商品並下單
- [ ] 可以查看「我的訂單」
- [ ] 管理者可以登入後台

---

## 📝 後續維護

### 更新程式碼
```bash
# 修改程式碼後
git add .
git commit -m "描述你的變更"
git push origin main

# GitHub Actions 會自動重新部署
```

### 更新 API URL
如果 GAS Web App URL 改變：
1. 前往 GitHub → Settings → Secrets → Actions
2. 編輯 `VITE_API_BASE_URL`
3. 更新為新的 URL
4. 重新觸發部署（push 任何變更）

---

## 🚀 下一步

部署成功後，你可以：
1. 分享網址給同事
2. 請管理者開啟訂單場次
3. 開始使用手機點菜！

**祝你使用愉快！** 🎉
