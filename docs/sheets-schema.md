# Sheets Schema

本文件定義 Google Sheets tabs 與 header 欄位，並提供「手動建立」與「用 GAS 初始化」兩種流程。

## Tabs + Headers

### Config
- `Key`
- `Value`

### Stores
- `StoreID`
- `StoreName`
- `StoreType`
- `IsActive`
- `SizeOptionsOverride`
- `SugarOptionsOverride`
- `IceOptionsOverride`
- `CreatedAt`

### Products
- `ProductID`
- `StoreID`
- `ProductName`
- `Price`
- `Category`
- `HasSizeOption`
- `HasSugarOption`
- `HasIceOption`
- `AllowNote`
- `IsActive`

### CurrentOrder
- `OrderSessionID`
- `StoreType`
- `StoreID`
- `Status`
- `CreatedBy`
- `CreatedAt`
- `ClosedAt`

### Orders
- `OrderID`
- `OrderSessionID`
- `StoreType`
- `UserName`
- `ProductID`
- `ProductName`
- `Price`
- `Size`
- `Sugar`
- `Ice`
- `Note`
- `CreatedAt`
- `UpdatedAt`
- `Status`

## Config Defaults

初始化時僅寫入以下 keys（不含敏感資訊）：

- `MaxNoteLength` = `15`
- `DefaultDrinkSizeOptions` = `大杯|中杯|小杯`
- `DefaultDrinkSugarOptions` = `正常|半糖|三分糖|一分糖|無糖`
- `DefaultDrinkIceOptions` = `正常冰|少冰|微冰|去冰|溫|熱`
- `LastOrderId` = `0`

## 手動建立流程

1. 建立一份 Google Sheet。
2. 依序新增 tabs：`Config`, `Stores`, `Products`, `CurrentOrder`, `Orders`。
3. 在每個 tab 的第 1 列填入對應的 header 欄位。
4. 在 `Config` 填入 Config Defaults（第 2 列起，兩欄 Key/Value）。

## 用 GAS 初始化流程

1. 在 Apps Script 專案中加入 `backend/apps-script/sheetsInit.gs` 的 `initSpreadsheet`。
2. 以 Spreadsheet ID 執行：

```javascript
function runInit() {
  initSpreadsheet('YOUR_SPREADSHEET_ID');
}
```

3. 執行後確認 tabs 與 headers 已建立，`Config` 補齊缺少的 keys。

## 注意事項

- `Orders.Sugar` 存中文：`正常/半糖/三分糖/一分糖/無糖`。
- `Stores` 覆寫欄位為管線分隔字串，空字串代表不覆寫。
- 初始化函式可重跑，不會清空既有資料，只補缺少的 sheet/header/config。
- `AdminPassword`/`TokenSecret` 請放 Script Properties，不放 `Config`。
