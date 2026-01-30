function handleAdminLogin_(params) {
  const password = normalizeString_(params.password)
  if (!password) {
    return jsonResponse_(buildError_('MISSING_PASSWORD', 'password is required.'))
  }

  const storedPassword = getScriptProperty_('AdminPassword')
  if (!storedPassword) {
    return jsonResponse_(buildError_('ADMIN_NOT_CONFIGURED', 'Admin password not configured.'))
  }

  if (password !== storedPassword) {
    return jsonResponse_(buildError_('INVALID_PASSWORD', 'Password is incorrect.'))
  }

  const tokenData = createAdminToken_()
  return jsonResponse_({
    success: true,
    adminToken: tokenData.token,
    expiresIn: tokenData.expiresIn
  })
}

function handleUploadData_(params) {
  const auth = requireAdmin_(params)
  if (!auth.ok) {
    return jsonResponse_(auth.payload)
  }

  const dataType = normalizeString_(params.dataType).toLowerCase()
  const format = normalizeString_(params.format).toLowerCase()
  const rawData = params.data

  if (!dataType || (dataType !== 'store' && dataType !== 'product')) {
    return jsonResponse_(buildError_('INVALID_DATA_TYPE', 'dataType must be store or product.'))
  }
  if (!format || (format !== 'csv' && format !== 'json')) {
    return jsonResponse_(buildError_('INVALID_FORMAT', 'format must be csv or json.'))
  }
  if (!rawData) {
    return jsonResponse_(buildError_('MISSING_DATA', 'data is required.'))
  }

  const sheetName = dataType === 'store' ? 'Stores' : 'Products'
  const idKey = dataType === 'store' ? 'StoreID' : 'ProductID'
  const expectedHeaders = dataType === 'store'
    ? ['StoreID', 'StoreName', 'StoreType', 'IsActive', 'SizeOptionsOverride', 'SugarOptionsOverride', 'IceOptionsOverride', 'CreatedAt']
    : ['ProductID', 'StoreID', 'ProductName', 'Price', 'Category', 'HasSizeOption', 'HasSugarOption', 'HasIceOption', 'AllowNote', 'IsActive']

  let records = []
  if (format === 'json') {
    records = parseJsonRecords_(rawData, idKey)
  } else {
    records = parseCsvRecords_(rawData, expectedHeaders, idKey)
  }

  if (records.length === 0) {
    return jsonResponse_(buildError_('NO_RECORDS', 'No valid records found.'))
  }

  const sheet = getSpreadsheet_().getSheetByName(sheetName)
  if (!sheet) {
    return jsonResponse_(buildError_('MISSING_SHEET', 'Sheet not found: ' + sheetName))
  }

  const result = upsertRecords_(sheet, idKey, expectedHeaders, records)
  return jsonResponse_({
    success: true,
    message: 'Data uploaded.',
    insertedCount: result.inserted,
    updatedCount: result.updated
  })
}

function handleOpenOrder_(params) {
  const auth = requireAdmin_(params)
  if (!auth.ok) {
    return jsonResponse_(auth.payload)
  }

  const storeId = normalizeString_(params.storeId)
  const adminName = normalizeString_(params.adminName)
  const requestedType = normalizeStoreType_(params.storeType)

  if (!storeId) {
    return jsonResponse_(buildError_('MISSING_STORE_ID', 'storeId is required.'))
  }
  if (!adminName) {
    return jsonResponse_(buildError_('MISSING_ADMIN_NAME', 'adminName is required.'))
  }

  const store = findStoreById_(storeId)
  if (!store) {
    return jsonResponse_(buildError_('STORE_NOT_FOUND', 'Store not found.'))
  }
  if (!parseBoolean_(store.IsActive)) {
    return jsonResponse_(buildError_('STORE_INACTIVE', 'Store is inactive.'))
  }

  const storeType = requestedType || normalizeStoreType_(store.StoreType)
  if (storeType !== normalizeStoreType_(store.StoreType)) {
    return jsonResponse_(buildError_('STORE_TYPE_MISMATCH', 'storeType does not match store.'))
  }

  if (isStoreTypeOpen_(storeType)) {
    return jsonResponse_(buildError_('SESSION_ALREADY_OPEN', 'An order session is already open.'))
  }

  const orderSessionId = generateOrderSessionId_(storeType)
  const currentSheet = getSpreadsheet_().getSheetByName('CurrentOrder')
  appendRowWithHeaders_(currentSheet, {
    OrderSessionID: orderSessionId,
    StoreType: storeType,
    StoreID: storeId,
    Status: 'open',
    CreatedBy: adminName,
    CreatedAt: isoNow_(),
    ClosedAt: ''
  })

  return jsonResponse_({
    success: true,
    orderSessionId: orderSessionId,
    message: 'Order session opened.'
  })
}

function handleCloseOrder_(params) {
  const auth = requireAdmin_(params)
  if (!auth.ok) {
    return jsonResponse_(auth.payload)
  }

  const orderSessionId = normalizeString_(params.orderSessionId)
  const storeType = normalizeStoreType_(params.storeType)

  if (!orderSessionId && !storeType) {
    return jsonResponse_(buildError_('MISSING_SESSION', 'orderSessionId or storeType is required.'))
  }

  const sheet = getSpreadsheet_().getSheetByName('CurrentOrder')
  const values = sheet.getDataRange().getValues()
  if (values.length < 2) {
    return jsonResponse_(buildError_('SESSION_NOT_FOUND', 'No sessions found.'))
  }

  const headers = values[0].map((header) => String(header))
  const sessionIndex = headers.indexOf('OrderSessionID')
  const typeIndex = headers.indexOf('StoreType')
  const statusIndex = headers.indexOf('Status')
  const closedIndex = headers.indexOf('ClosedAt')

  let rowIndex = -1
  for (let i = 1; i < values.length; i += 1) {
    const row = values[i]
    const currentSessionId = normalizeString_(row[sessionIndex])
    const currentType = normalizeStoreType_(row[typeIndex])
    const status = normalizeStatus_(row[statusIndex])
    const matchSession = orderSessionId ? currentSessionId === orderSessionId : false
    const matchType = storeType ? currentType === storeType : false
    if ((matchSession || matchType) && status === 'open') {
      rowIndex = i + 1
      break
    }
  }

  if (rowIndex < 0) {
    return jsonResponse_(buildError_('SESSION_NOT_FOUND', 'Open session not found.'))
  }

  const updateValues = values[rowIndex - 1]
  updateValues[statusIndex] = 'closed'
  if (closedIndex >= 0) {
    updateValues[closedIndex] = isoNow_()
  }
  sheet.getRange(rowIndex, 1, 1, headers.length).setValues([updateValues])

  return jsonResponse_({
    success: true,
    message: 'Order session closed.'
  })
}

function handleGetStores_(params) {
  const auth = requireAdmin_(params)
  if (!auth.ok) {
    return jsonResponse_(auth.payload)
  }

  const storeType = normalizeStoreType_(params.storeType)
  let stores = getStores_()
  if (storeType) {
    stores = stores.filter((store) => normalizeStoreType_(store.StoreType) === storeType)
  }

  const data = stores.map((store) => ({
    storeId: normalizeString_(store.StoreID),
    storeName: normalizeString_(store.StoreName),
    storeType: normalizeStoreType_(store.StoreType),
    isActive: parseBoolean_(store.IsActive)
  }))

  return jsonResponse_({
    success: true,
    data: data
  })
}

function handleToggleActive_(params) {
  const auth = requireAdmin_(params)
  if (!auth.ok) {
    return jsonResponse_(auth.payload)
  }

  const type = normalizeString_(params.type).toLowerCase()
  const id = normalizeString_(params.id)
  const isActive = normalizeString_(params.isActive)

  if (!type || (type !== 'store' && type !== 'product')) {
    return jsonResponse_(buildError_('INVALID_TYPE', 'type must be store or product.'))
  }
  if (!id) {
    return jsonResponse_(buildError_('MISSING_ID', 'id is required.'))
  }
  if (!isActive) {
    return jsonResponse_(buildError_('MISSING_ACTIVE', 'isActive is required.'))
  }

  const sheetName = type === 'store' ? 'Stores' : 'Products'
  const idKey = type === 'store' ? 'StoreID' : 'ProductID'
  const sheet = getSpreadsheet_().getSheetByName(sheetName)
  const row = findRowById_(sheet, idKey, id)
  if (!row) {
    return jsonResponse_(buildError_('NOT_FOUND', 'Record not found.'))
  }

  updateRowWithHeaders_(sheet, row.headers, row.rowIndex, {
    IsActive: isActive
  })

  return jsonResponse_({
    success: true,
    message: 'Status updated.'
  })
}

function requireAdmin_(params) {
  const token = normalizeString_(params.adminToken)
  if (!token) {
    return { ok: false, payload: buildError_('MISSING_TOKEN', 'adminToken is required.') }
  }
  const verified = verifyAdminToken_(token)
  if (!verified.ok) {
    return { ok: false, payload: buildError_(verified.code, verified.message) }
  }
  return { ok: true }
}

function createAdminToken_() {
  const secret = getScriptProperty_('TokenSecret')
  if (!secret) {
    throw new Error('TokenSecret is not configured.')
  }
  const issuedAt = Date.now()
  const expiresAt = issuedAt + 6 * 60 * 60 * 1000
  const payload = JSON.stringify({ iat: issuedAt, exp: expiresAt })
  const signature = Utilities.computeHmacSha256Signature(payload, secret)
  const token = Utilities.base64EncodeWebSafe(payload) + '.' + Utilities.base64EncodeWebSafe(signature)
  return { token: token, expiresIn: 6 * 60 * 60 }
}

function verifyAdminToken_(token) {
  const secret = getScriptProperty_('TokenSecret')
  if (!secret) {
    return { ok: false, code: 'TOKEN_SECRET_MISSING', message: 'Token secret not configured.' }
  }
  const parts = token.split('.')
  if (parts.length !== 2) {
    return { ok: false, code: 'TOKEN_INVALID', message: 'Invalid token.' }
  }
  const payload = Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString()
  const signature = Utilities.computeHmacSha256Signature(payload, secret)
  const expected = Utilities.base64EncodeWebSafe(signature)
  if (expected !== parts[1]) {
    return { ok: false, code: 'TOKEN_INVALID', message: 'Invalid token.' }
  }
  const data = JSON.parse(payload)
  if (!data.exp || Date.now() > data.exp) {
    return { ok: false, code: 'TOKEN_EXPIRED', message: 'Token expired.' }
  }
  return { ok: true }
}

function parseJsonRecords_(rawData, idKey) {
  let parsed
  try {
    parsed = JSON.parse(rawData)
  } catch (error) {
    throw new Error('Invalid JSON format.')
  }
  if (!Array.isArray(parsed)) {
    throw new Error('JSON data must be an array.')
  }
  return parsed.filter((record) => normalizeString_(record[idKey]))
}

function parseCsvRecords_(rawData, expectedHeaders, idKey) {
  const rows = Utilities.parseCsv(rawData)
  if (!rows || rows.length === 0) {
    return []
  }
  const firstRow = rows[0].map((cell) => normalizeString_(cell))
  const hasHeader = firstRow.includes(idKey)
  const headers = hasHeader ? firstRow : expectedHeaders
  const dataRows = hasHeader ? rows.slice(1) : rows

  return dataRows
    .map((row) => {
      const record = {}
      headers.forEach((header, index) => {
        if (header) {
          record[header] = row[index]
        }
      })
      return record
    })
    .filter((record) => normalizeString_(record[idKey]))
}

function upsertRecords_(sheet, idKey, expectedHeaders, records) {
  const values = sheet.getDataRange().getValues()
  if (values.length === 0) {
    sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders])
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
  const headerIndex = {}
  headers.forEach((header, index) => {
    headerIndex[String(header)] = index
  })
  const idIndex = headerIndex[idKey]

  const existing = {}
  const dataRows = sheet.getLastRow() > 1
    ? sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues()
    : []

  dataRows.forEach((row, index) => {
    const value = normalizeString_(row[idIndex])
    if (value) {
      existing[value] = { rowIndex: index + 2, rowValues: row }
    }
  })

  let inserted = 0
  let updated = 0

  records.forEach((record) => {
    const idValue = normalizeString_(record[idKey])
    if (!idValue) {
      return
    }

    const match = existing[idValue]
    if (match) {
      const updatedRow = headers.map((header, index) => {
        const key = String(header)
        const nextValue = record.hasOwnProperty(key) ? record[key] : ''
        if (nextValue !== '' && nextValue !== null && nextValue !== undefined) {
          return nextValue
        }
        return match.rowValues[index]
      })
      sheet.getRange(match.rowIndex, 1, 1, headers.length).setValues([updatedRow])
      updated += 1
    } else {
      const newRow = headers.map((header) => {
        const key = String(header)
        if (record.hasOwnProperty(key) && record[key] !== undefined) {
          return record[key]
        }
        if (key === 'IsActive') {
          return 'TRUE'
        }
        if (key === 'CreatedAt') {
          return isoNow_()
        }
        return ''
      })
      sheet.appendRow(newRow)
      inserted += 1
    }
  })

  return { inserted: inserted, updated: updated }
}

function generateOrderSessionId_(storeType) {
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss")
  return 'OS' + stamp
}

function isStoreTypeOpen_(storeType) {
  const sessions = getCurrentOrders_()
  return sessions.some((session) => {
    return normalizeStoreType_(session.StoreType) === storeType
      && normalizeStatus_(session.Status) === 'open'
  })
}

function findRowById_(sheet, idKey, idValue) {
  if (!sheet) {
    return null
  }
  const values = sheet.getDataRange().getValues()
  if (values.length < 2) {
    return null
  }
  const headers = values[0].map((header) => String(header))
  const idIndex = headers.indexOf(idKey)
  if (idIndex < 0) {
    return null
  }
  for (let i = 1; i < values.length; i += 1) {
    const row = values[i]
    if (normalizeString_(row[idIndex]) === normalizeString_(idValue)) {
      return {
        sheet: sheet,
        headers: headers,
        rowIndex: i + 1
      }
    }
  }
  return null
}
