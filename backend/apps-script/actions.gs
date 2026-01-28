function handleGetCurrentOrders_(params) {
  const config = getConfigMap_()
  const stores = getStores_()
  const storeMap = {}
  stores.forEach((store) => {
    const id = normalizeString_(store.StoreID)
    if (id) {
      storeMap[id] = store
    }
  })

  const sessions = getCurrentOrders_()
  const byType = { drink: null, meal: null }

  sessions.forEach((session) => {
    const storeType = normalizeStoreType_(session.StoreType)
    if (!storeType || !byType.hasOwnProperty(storeType)) {
      return
    }
    const status = normalizeStatus_(session.Status)
    const existing = byType[storeType]
    const existingStatus = existing ? normalizeStatus_(existing.Status) : ''

    if (!existing) {
      byType[storeType] = session
      return
    }
    if (status === 'open') {
      byType[storeType] = session
      return
    }
    if (existingStatus !== 'open') {
      byType[storeType] = session
    }
  })

  return jsonResponse_({
    success: true,
    data: {
      drink: buildSessionPayload_(byType.drink, storeMap, config),
      meal: buildSessionPayload_(byType.meal, storeMap, config)
    }
  })
}

function buildSessionPayload_(session, storeMap, config) {
  if (!session) {
    return null
  }

  const storeId = normalizeString_(session.StoreID)
  const storeType = normalizeStoreType_(session.StoreType)
  const store = storeMap[storeId] || null

  const payload = {
    orderSessionId: normalizeString_(session.OrderSessionID),
    storeId: storeId,
    storeName: store ? normalizeString_(store.StoreName) : '',
    storeType: storeType,
    status: normalizeStatus_(session.Status) || 'closed',
    createdAt: session.CreatedAt || '',
    closedAt: session.ClosedAt || ''
  }

  if (storeType === 'drink') {
    payload.options = {
      sizeOptions: resolveOptionSet_(store, config, 'SizeOptionsOverride', 'DefaultDrinkSizeOptions'),
      sugarOptions: resolveOptionSet_(store, config, 'SugarOptionsOverride', 'DefaultDrinkSugarOptions'),
      iceOptions: resolveOptionSet_(store, config, 'IceOptionsOverride', 'DefaultDrinkIceOptions')
    }
  }

  return payload
}

function resolveOptionSet_(store, config, overrideKey, defaultKey) {
  const overrideValue = store ? normalizeString_(store[overrideKey]) : ''
  const rawValue = overrideValue || (config ? config[defaultKey] : '')
  return splitOptions_(rawValue)
}

function handleGetProducts_(params) {
  const storeId = normalizeString_(params.storeId)
  if (!storeId) {
    return jsonResponse_(buildError_('MISSING_STORE_ID', 'storeId is required.'))
  }

  const products = getProducts_()
    .filter((product) => normalizeString_(product.StoreID) === storeId)
    .filter((product) => parseBoolean_(product.IsActive))

  const data = products.map((product) => ({
    productId: normalizeString_(product.ProductID),
    productName: normalizeString_(product.ProductName),
    price: parseNumber_(product.Price),
    category: normalizeString_(product.Category),
    hasSizeOption: parseBoolean_(product.HasSizeOption),
    hasSugarOption: parseBoolean_(product.HasSugarOption),
    hasIceOption: parseBoolean_(product.HasIceOption),
    allowNote: parseBoolean_(product.AllowNote)
  }))

  return jsonResponse_({
    success: true,
    data: data
  })
}

function handleSubmitOrder_(params) {
  const userName = normalizeString_(params.userName)
  const orderSessionId = normalizeString_(params.orderSessionId)
  const storeType = normalizeStoreType_(params.storeType)
  const productId = normalizeString_(params.productId)
  const size = normalizeString_(params.size)
  const sugar = normalizeString_(params.sugar)
  const ice = normalizeString_(params.ice)
  const note = normalizeString_(params.note)

  if (!userName) {
    return jsonResponse_(buildError_('MISSING_USER_NAME', 'userName is required.'))
  }
  if (!orderSessionId) {
    return jsonResponse_(buildError_('MISSING_SESSION', 'orderSessionId is required.'))
  }
  if (!storeType || (storeType !== 'drink' && storeType !== 'meal')) {
    return jsonResponse_(buildError_('INVALID_STORE_TYPE', 'storeType must be drink or meal.'))
  }
  if (!productId) {
    return jsonResponse_(buildError_('MISSING_PRODUCT', 'productId is required.'))
  }

  const currentSessions = getCurrentOrders_()
  const session = currentSessions.find((item) => {
    return normalizeStoreType_(item.StoreType) === storeType
      && normalizeString_(item.OrderSessionID) === orderSessionId
  })

  if (!session) {
    return jsonResponse_(buildError_('SESSION_NOT_FOUND', 'Order session not found.'))
  }

  if (normalizeStatus_(session.Status) !== 'open') {
    return jsonResponse_(buildError_('SESSION_CLOSED', 'Order session is closed.'))
  }

  const storeId = normalizeString_(session.StoreID)
  const products = getProducts_()
  const product = products.find((item) => normalizeString_(item.ProductID) === productId)
  if (!product) {
    return jsonResponse_(buildError_('PRODUCT_NOT_FOUND', 'Product not found.'))
  }

  if (normalizeString_(product.StoreID) !== storeId) {
    return jsonResponse_(buildError_('PRODUCT_STORE_MISMATCH', 'Product does not match session store.'))
  }

  if (!parseBoolean_(product.IsActive)) {
    return jsonResponse_(buildError_('PRODUCT_INACTIVE', 'Product is inactive.'))
  }

  const config = getConfigMap_()
  const storeMap = {}
  getStores_().forEach((store) => {
    const id = normalizeString_(store.StoreID)
    if (id) {
      storeMap[id] = store
    }
  })

  const store = storeMap[storeId] || null
  const optionSets = storeType === 'drink'
    ? {
        size: resolveOptionSet_(store, config, 'SizeOptionsOverride', 'DefaultDrinkSizeOptions'),
        sugar: resolveOptionSet_(store, config, 'SugarOptionsOverride', 'DefaultDrinkSugarOptions'),
        ice: resolveOptionSet_(store, config, 'IceOptionsOverride', 'DefaultDrinkIceOptions')
      }
    : { size: [], sugar: [], ice: [] }

  if (parseBoolean_(product.HasSizeOption)) {
    const validation = validateOption_(size, optionSets.size, 'size')
    if (!validation.ok) {
      return jsonResponse_(validation.payload)
    }
  }
  if (parseBoolean_(product.HasSugarOption)) {
    const validation = validateOption_(sugar, optionSets.sugar, 'sugar')
    if (!validation.ok) {
      return jsonResponse_(validation.payload)
    }
  }
  if (parseBoolean_(product.HasIceOption)) {
    const validation = validateOption_(ice, optionSets.ice, 'ice')
    if (!validation.ok) {
      return jsonResponse_(validation.payload)
    }
  }

  if (note && !parseBoolean_(product.AllowNote)) {
    return jsonResponse_(buildError_('NOTE_NOT_ALLOWED', 'Note is not allowed for this product.'))
  }

  const maxNoteLength = parseNumber_(config.MaxNoteLength || 15)
  if (note && note.length > maxNoteLength) {
    return jsonResponse_(buildError_('NOTE_TOO_LONG', 'Note exceeds max length.'))
  }

  const lock = LockService.getScriptLock()
  if (!lock.tryLock(30000)) {
    return jsonResponse_(buildError_('LOCK_TIMEOUT', 'System busy, please retry.'))
  }

  try {
    const spreadsheet = getSpreadsheet_()
    const configSheet = spreadsheet.getSheetByName('Config')
    const ordersSheet = spreadsheet.getSheetByName('Orders')
    const nextOrderId = incrementOrderId_(configSheet)
    const timestamp = isoNow_()

    appendRowWithHeaders_(ordersSheet, {
      OrderID: nextOrderId,
      OrderSessionID: orderSessionId,
      StoreType: storeType,
      UserName: userName,
      ProductID: productId,
      ProductName: normalizeString_(product.ProductName),
      Price: parseNumber_(product.Price),
      Size: size,
      Sugar: sugar,
      Ice: ice,
      Note: note,
      CreatedAt: timestamp,
      UpdatedAt: timestamp,
      Status: 'active'
    })

    return jsonResponse_({
      success: true,
      orderId: nextOrderId,
      message: 'Order submitted.'
    })
  } finally {
    lock.releaseLock()
  }
}

function validateOption_(value, options, fieldName) {
  if (!value) {
    return {
      ok: false,
      payload: buildError_('MISSING_OPTION', fieldName + ' is required.')
    }
  }
  if (options.length === 0) {
    return { ok: true }
  }
  if (!options.includes(value)) {
    return {
      ok: false,
      payload: buildError_('INVALID_OPTION', fieldName + ' is invalid.')
    }
  }
  return { ok: true }
}

function incrementOrderId_(configSheet) {
  if (!configSheet) {
    throw new Error('Missing Config sheet.')
  }

  const lastRow = configSheet.getLastRow()
  const rows = lastRow > 1
    ? configSheet.getRange(2, 1, lastRow - 1, 2).getValues()
    : []

  let rowIndex = -1
  let currentValue = 0
  rows.forEach((row, index) => {
    if (normalizeString_(row[0]) === 'LastOrderId') {
      rowIndex = index
      currentValue = parseNumber_(row[1])
    }
  })

  const nextValue = currentValue + 1

  if (rowIndex >= 0) {
    configSheet.getRange(rowIndex + 2, 2, 1, 1).setValue(nextValue)
  } else {
    configSheet.getRange(lastRow + 1, 1, 1, 2).setValues([['LastOrderId', String(nextValue)]])
  }

  return nextValue
}

function appendRowWithHeaders_(sheet, data) {
  if (!sheet) {
    throw new Error('Missing Orders sheet.')
  }
  const lastColumn = sheet.getLastColumn()
  if (lastColumn === 0) {
    throw new Error('Orders sheet is missing headers.')
  }
  const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0]
  const row = headers.map((header) => {
    const key = normalizeString_(header)
    return data.hasOwnProperty(key) ? data[key] : ''
  })
  const nextRow = sheet.getLastRow() + 1
  sheet.getRange(nextRow, 1, 1, headers.length).setValues([row])
}
