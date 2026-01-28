# Deployment Guide

## 1) Google Sheets

1. 建立一份 Google Sheet。
2. 依 `docs/sheets-schema.md` 建立 tabs 與欄位。
3. 在 Apps Script 執行 `initSpreadsheet('SPREADSHEET_ID')` 以補齊缺漏。

## 2) Apps Script Web App

1. 建立 Apps Script 專案，將 `backend/apps-script/*` 檔案加入。
2. 在 Script Properties 設定：
   - `SpreadsheetId`
   - `AdminPassword`
   - `TokenSecret`
3. 部署為 Web App：
   - Execute as: Me
   - Who has access: Anyone
4. 記下 Web App URL（前端需使用）。

## 3) 前端環境變數

在專案根目錄建立 `.env.local`：

```
VITE_API_BASE_URL=https://script.google.com/macros/s/XXXX/exec
```

## 4) 前端啟動與建置

```bash
npm install
npm run dev
```

建置與預覽：

```bash
npm run build
npm run preview
```

## 5) GitHub Pages

- 目前 `vite.config.js` 使用 `base: './'`，可直接部署到 GitHub Pages（Hash Router）。
- 若改用 project pages，確保資產仍能在 `/<repo>/` 下被載入。

## 6) 手動驗收

參考 `docs/manual-qa.md` 的 curl 指令完成 API 驗證。
