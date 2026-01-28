# Manual QA Checklist

## 事前設定（GAS Script Properties）

在 Apps Script 的 Script Properties 設定：

- `SpreadsheetId`: 你的試算表 ID
- `AdminPassword`: 管理者密碼
- `TokenSecret`: 任意長度的密鑰字串

## GAS Web App (ping)

> Replace `{WEB_APP_URL}` with your deployed Apps Script Web App URL.

```bash
curl -X POST "{WEB_APP_URL}" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data "action=ping"
```

Expected (example):
```json
{
  "success": true,
  "data": {
    "message": "pong",
    "method": "POST",
    "timestamp": "2026-01-28T12:34:56+08:00"
  }
}
```

## 取得場次（getCurrentOrders）

```bash
curl "{WEB_APP_URL}?action=getCurrentOrders"
```

## 取得產品（getProducts）

```bash
curl "{WEB_APP_URL}?action=getProducts&storeId=S001"
```

## 送出訂單（submitOrder）

```bash
curl -X POST "{WEB_APP_URL}" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data "action=submitOrder&userName=王小明&orderSessionId=OS20260128001&storeType=drink&productId=P001&size=中杯&sugar=半糖&ice=少冰&note="
```

## 修改訂單（updateOrder）

```bash
curl -X POST "{WEB_APP_URL}" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data "action=updateOrder&orderId=1&userName=王小明&size=大杯&sugar=三分糖&ice=去冰&note="
```

## 取消訂單（cancelOrder）

```bash
curl -X POST "{WEB_APP_URL}" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data "action=cancelOrder&orderId=1&userName=王小明"
```

## 查詢我的訂單（getMyOrders）

```bash
curl "{WEB_APP_URL}?action=getMyOrders&userName=王小明&orderSessionId=OS20260128001"
```

## 查詢歷史場次（getOrderSessions）

```bash
curl "{WEB_APP_URL}?action=getOrderSessions&userName=王小明"
```

## 統計（getStatistics）

```bash
curl "{WEB_APP_URL}?action=getStatistics&orderSessionId=OS20260128001&storeType=drink"
```

## 管理者登入（adminLogin）

```bash
curl -X POST "{WEB_APP_URL}" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data "action=adminLogin&password=YOUR_PASSWORD"
```

> 取得 `adminToken` 後，再使用下列管理 API。

## 開單（openOrder）

```bash
curl -X POST "{WEB_APP_URL}" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data "action=openOrder&adminToken=TOKEN&storeId=S001&storeType=drink&adminName=王管理員"
```

## 關單（closeOrder）

```bash
curl -X POST "{WEB_APP_URL}" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data "action=closeOrder&adminToken=TOKEN&storeType=drink"
```

## 上傳資料（uploadData）

```bash
curl -X POST "{WEB_APP_URL}" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "action=uploadData" \
  --data-urlencode "adminToken=TOKEN" \
  --data-urlencode "dataType=store" \
  --data-urlencode "format=csv" \
  --data-urlencode "data=StoreID,StoreName,StoreType,IsActive\nS001,暖心飲品,drink,TRUE"
```

## 匯出訂單（exportOrders）

```bash
curl -X POST "{WEB_APP_URL}" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data "action=exportOrders&adminToken=TOKEN&orderSessionId=OS20260128001"
```
