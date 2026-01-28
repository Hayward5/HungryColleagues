function handleUpdateOrder_(params) {
  const orderId = normalizeString_(params.orderId)
  const userName = normalizeString_(params.userName)
  const size = normalizeString_(params.size)
  const sugar = normalizeString_(params.sugar)
  const ice = normalizeString_(params.ice)
  const note = normalizeString_(params.note)

  if (!orderId) {
    return jsonResponse_(buildError_('MISSING_ORDER_ID', 'orderId is required.'))
  }
  if (!userName) {
    return jsonResponse_(buildError_('MISSING_USER_NAME', 'userName is required.'))
  }

  const orderRow = findOrderRow_(orderId)
  if (!orderRow) {
    return jsonResponse_(buildError_('ORDER_NOT_FOUND', 'Order not found.'))
  }

  const order = orderRow.order
  if (normalizeString_(order.UserName) !== userName) {
    return jsonResponse_(buildError_('NOT_ORDER_OWNER', 'Order does not belong to user.'))
  }
  if (normalizeStatus_(order.Status) !== 'active') {
    return jsonResponse_(buildError_('ORDER_NOT_ACTIVE', 'Order is not active.'))
  }
  if (!isSessionOpen_(order.OrderSessionID, order.StoreType)) {
    return jsonResponse_(buildError_('SESSION_CLOSED', 'Order session is closed.'))
  }

  const product = findProductById_(order.ProductID)
  if (!product) {
    return jsonResponse_(buildError_('PRODUCT_NOT_FOUND', 'Product not found.'))
  }

  const sessionStoreId = getStoreIdForSession_(order.OrderSessionID, order.StoreType)
  const store = sessionStoreId ? findStoreById_(sessionStoreId) : null
  const config = getConfigMap_()
  const optionSets = normalizeStoreType_(order.StoreType) === 'drink'
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

  const sheet = orderRow.sheet
  const headers = orderRow.headers
  const rowIndex = orderRow.rowIndex
  const updatedAt = isoNow_()
  const updates = {
    Size: size,
    Sugar: sugar,
    Ice: ice,
    Note: note,
    UpdatedAt: updatedAt
  }
  updateRowWithHeaders_(sheet, headers, rowIndex, updates)

  return jsonResponse_({
    success: true,
    message: 'Order updated.'
  })
}

function handleCancelOrder_(params) {
  const orderId = normalizeString_(params.orderId)
  const userName = normalizeString_(params.userName)

  if (!orderId) {
    return jsonResponse_(buildError_('MISSING_ORDER_ID', 'orderId is required.'))
  }
  if (!userName) {
    return jsonResponse_(buildError_('MISSING_USER_NAME', 'userName is required.'))
  }

  const orderRow = findOrderRow_(orderId)
  if (!orderRow) {
    return jsonResponse_(buildError_('ORDER_NOT_FOUND', 'Order not found.'))
  }
  const order = orderRow.order
  if (normalizeString_(order.UserName) !== userName) {
    return jsonResponse_(buildError_('NOT_ORDER_OWNER', 'Order does not belong to user.'))
  }
  if (normalizeStatus_(order.Status) !== 'active') {
    return jsonResponse_(buildError_('ORDER_NOT_ACTIVE', 'Order is not active.'))
  }
  if (!isSessionOpen_(order.OrderSessionID, order.StoreType)) {
    return jsonResponse_(buildError_('SESSION_CLOSED', 'Order session is closed.'))
  }

  const sheet = orderRow.sheet
  const headers = orderRow.headers
  const rowIndex = orderRow.rowIndex
  updateRowWithHeaders_(sheet, headers, rowIndex, {
    Status: 'cancelled',
    UpdatedAt: isoNow_()
  })

  return jsonResponse_({
    success: true,
    message: 'Order cancelled.'
  })
}

function handleGetMyOrders_(params) {
  const userName = normalizeString_(params.userName)
  const orderSessionId = normalizeString_(params.orderSessionId)
  if (!userName) {
    return jsonResponse_(buildError_('MISSING_USER_NAME', 'userName is required.'))
  }
  if (!orderSessionId) {
    return jsonResponse_(buildError_('MISSING_SESSION', 'orderSessionId is required.'))
  }

  const orders = getOrders_()
    .filter((order) => normalizeString_(order.UserName) === userName)
    .filter((order) => normalizeString_(order.OrderSessionID) === orderSessionId)

  let totalAmount = 0
  const data = orders.map((order) => {
    const price = parseNumber_(order.Price)
    if (normalizeStatus_(order.Status) === 'active') {
      totalAmount += price
    }
    return {
      orderId: order.OrderID,
      productName: normalizeString_(order.ProductName),
      size: normalizeString_(order.Size),
      sugar: normalizeString_(order.Sugar),
      ice: normalizeString_(order.Ice),
      note: normalizeString_(order.Note),
      price: price,
      createdAt: order.CreatedAt,
      status: normalizeStatus_(order.Status)
    }
  })

  return jsonResponse_({
    success: true,
    data: data,
    totalAmount: totalAmount
  })
}

function handleGetOrderSessions_(params) {
  const userName = normalizeString_(params.userName)
  if (!userName) {
    return jsonResponse_(buildError_('MISSING_USER_NAME', 'userName is required.'))
  }
  const orders = getOrders_()
    .filter((order) => normalizeString_(order.UserName) === userName)

  const sessions = {}
  orders.forEach((order) => {
    const sessionId = normalizeString_(order.OrderSessionID)
    const storeType = normalizeStoreType_(order.StoreType)
    if (!sessionId || !storeType) {
      return
    }
    const key = sessionId + ':' + storeType
    if (!sessions[key]) {
      sessions[key] = {
        orderSessionId: sessionId,
        storeType: storeType,
        createdAt: order.CreatedAt
      }
    }
  })

  return jsonResponse_({
    success: true,
    data: Object.keys(sessions).map((key) => sessions[key])
  })
}

function handleGetStatistics_(params) {
  const orderSessionId = normalizeString_(params.orderSessionId)
  const storeType = normalizeStoreType_(params.storeType)
  if (!orderSessionId) {
    return jsonResponse_(buildError_('MISSING_SESSION', 'orderSessionId is required.'))
  }

  let orders = getOrders_()
    .filter((order) => normalizeString_(order.OrderSessionID) === orderSessionId)
    .filter((order) => normalizeStatus_(order.Status) === 'active')

  if (storeType) {
    orders = orders.filter((order) => normalizeStoreType_(order.StoreType) === storeType)
  }

  const ordersByUser = {}
  const ordersByProduct = {}
  let grandTotal = 0
  let orderCount = 0

  orders.forEach((order) => {
    const user = normalizeString_(order.UserName)
    const productName = normalizeString_(order.ProductName)
    const price = parseNumber_(order.Price)
    orderCount += 1
    grandTotal += price

    if (!ordersByUser[user]) {
      ordersByUser[user] = { userName: user, orders: [], totalAmount: 0 }
    }
    ordersByUser[user].orders.push({
      productName: productName,
      size: normalizeString_(order.Size),
      sugar: normalizeString_(order.Sugar),
      ice: normalizeString_(order.Ice),
      note: normalizeString_(order.Note),
      price: price
    })
    ordersByUser[user].totalAmount += price

    if (!ordersByProduct[productName]) {
      ordersByProduct[productName] = {
        productName: productName,
        count: 0,
        totalAmount: 0
      }
    }
    ordersByProduct[productName].count += 1
    ordersByProduct[productName].totalAmount += price
  })

  return jsonResponse_({
    success: true,
    data: {
      ordersByUser: Object.keys(ordersByUser).map((key) => ordersByUser[key]),
      ordersByProduct: Object.keys(ordersByProduct).map((key) => ordersByProduct[key]),
      grandTotal: grandTotal,
      orderCount: orderCount
    }
  })
}

function handleExportOrders_(params) {
  const auth = requireAdmin_(params)
  if (!auth.ok) {
    return jsonResponse_(auth.payload)
  }
  const orderSessionId = normalizeString_(params.orderSessionId)
  const storeType = normalizeStoreType_(params.storeType)
  if (!orderSessionId) {
    return jsonResponse_(buildError_('MISSING_SESSION', 'orderSessionId is required.'))
  }

  let orders = getOrders_()
    .filter((order) => normalizeString_(order.OrderSessionID) === orderSessionId)
    .filter((order) => normalizeStatus_(order.Status) === 'active')

  if (storeType) {
    orders = orders.filter((order) => normalizeStoreType_(order.StoreType) === storeType)
  }

  const data = orders.map((order) => {
    const options = buildOptionsLabel_(order)
    return {
      userName: normalizeString_(order.UserName),
      productName: normalizeString_(order.ProductName),
      options: options,
      price: parseNumber_(order.Price)
    }
  })

  return jsonResponse_({
    success: true,
    data: data
  })
}

function buildOptionsLabel_(order) {
  const storeType = normalizeStoreType_(order.StoreType)
  if (storeType === 'drink') {
    return [order.Size, order.Sugar, order.Ice]
      .map((value) => normalizeString_(value))
      .filter((value) => value)
      .join('/')
  }
  const note = normalizeString_(order.Note)
  return note || '-'
}

function findOrderRow_(orderId) {
  const sheet = getOrdersSheet_()
  if (!sheet) {
    throw new Error('Missing Orders sheet.')
  }
  const values = sheet.getDataRange().getValues()
  if (values.length < 2) {
    return null
  }
  const headers = values[0].map((header) => String(header))
  const orderIdIndex = headers.indexOf('OrderID')
  if (orderIdIndex < 0) {
    throw new Error('Orders sheet missing OrderID header.')
  }
  const targetId = normalizeString_(orderId)
  for (let i = 1; i < values.length; i += 1) {
    const row = values[i]
    const currentId = normalizeString_(row[orderIdIndex])
    if (currentId && currentId === targetId) {
      return {
        sheet: sheet,
        headers: headers,
        rowIndex: i + 1,
        order: buildOrderFromRow_(headers, row)
      }
    }
  }
  return null
}

function buildOrderFromRow_(headers, row) {
  const order = {}
  headers.forEach((header, index) => {
    order[header] = row[index]
  })
  return order
}

function updateRowWithHeaders_(sheet, headers, rowIndex, updates) {
  const rowValues = sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0]
  const updatedRow = headers.map((header, index) => {
    const key = normalizeString_(header)
    if (updates.hasOwnProperty(key)) {
      return updates[key]
    }
    return rowValues[index]
  })
  sheet.getRange(rowIndex, 1, 1, headers.length).setValues([updatedRow])
}

function findStoreById_(storeId) {
  const stores = getStores_()
  return stores.find((store) => normalizeString_(store.StoreID) === normalizeString_(storeId))
}

function findProductById_(productId) {
  const products = getProducts_()
  return products.find((product) => normalizeString_(product.ProductID) === normalizeString_(productId))
}

function getStoreIdForSession_(orderSessionId, storeType) {
  const sessions = getCurrentOrders_()
  const match = sessions.find((session) => {
    return normalizeString_(session.OrderSessionID) === normalizeString_(orderSessionId)
      && normalizeStoreType_(session.StoreType) === normalizeStoreType_(storeType)
  })
  return match ? normalizeString_(match.StoreID) : ''
}

function isSessionOpen_(orderSessionId, storeType) {
  const sessions = getCurrentOrders_()
  return sessions.some((session) => {
    return normalizeString_(session.OrderSessionID) === normalizeString_(orderSessionId)
      && normalizeStoreType_(session.StoreType) === normalizeStoreType_(storeType)
      && normalizeStatus_(session.Status) === 'open'
  })
}
