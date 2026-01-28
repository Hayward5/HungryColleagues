function getSpreadsheet_() {
  const spreadsheetId = getScriptProperty_('SpreadsheetId')
  if (spreadsheetId) {
    return SpreadsheetApp.openById(spreadsheetId)
  }
  const active = SpreadsheetApp.getActiveSpreadsheet()
  if (!active) {
    throw new Error('Missing SpreadsheetId script property.')
  }
  return active
}

function getSheetData_(sheetName) {
  const sheet = getSpreadsheet_().getSheetByName(sheetName)
  if (!sheet) {
    throw new Error('Missing sheet: ' + sheetName)
  }

  const values = sheet.getDataRange().getValues()
  if (values.length === 0) {
    return { headers: [], rows: [] }
  }

  const headers = values[0].map((header) => String(header))
  const rows = values.slice(1)
  return { headers, rows }
}

function rowsToObjects_(headers, rows) {
  const objects = []
  rows.forEach((row) => {
    if (!row || row.length === 0) {
      return
    }

    let hasValue = false
    const obj = {}
    headers.forEach((header, index) => {
      const value = row[index]
      if (value !== '' && value !== null && value !== undefined) {
        hasValue = true
      }
      obj[header] = value
    })

    if (hasValue) {
      objects.push(obj)
    }
  })
  return objects
}

function getConfigMap_() {
  const { headers, rows } = getSheetData_('Config')
  if (headers.length < 2) {
    return {}
  }
  const list = rowsToObjects_(headers, rows)
  const config = {}
  list.forEach((row) => {
    const key = normalizeString_(row.Key)
    if (key) {
      config[key] = row.Value
    }
  })
  return config
}

function getStores_() {
  const { headers, rows } = getSheetData_('Stores')
  return rowsToObjects_(headers, rows)
}

function getProducts_() {
  const { headers, rows } = getSheetData_('Products')
  return rowsToObjects_(headers, rows)
}

function getCurrentOrders_() {
  const { headers, rows } = getSheetData_('CurrentOrder')
  return rowsToObjects_(headers, rows)
}

function getOrdersSheet_() {
  return getSpreadsheet_().getSheetByName('Orders')
}

function getOrders_() {
  const { headers, rows } = getSheetData_('Orders')
  return rowsToObjects_(headers, rows)
}

function normalizeString_(value) {
  if (value === null || value === undefined) {
    return ''
  }
  return String(value).trim()
}

function normalizeStoreType_(value) {
  return normalizeString_(value).toLowerCase()
}

function normalizeStatus_(value) {
  return normalizeString_(value).toLowerCase()
}

function parseBoolean_(value) {
  if (value === true || value === false) {
    return value
  }
  const normalized = normalizeString_(value).toLowerCase()
  return ['true', '1', 'yes', 'y'].includes(normalized)
}

function parseNumber_(value) {
  if (typeof value === 'number') {
    return value
  }
  const normalized = normalizeString_(value)
  if (!normalized) {
    return 0
  }
  const num = Number(normalized)
  return Number.isFinite(num) ? num : 0
}

function splitOptions_(value) {
  const raw = normalizeString_(value)
  if (!raw) {
    return []
  }
  return raw
    .split('|')
    .map((item) => normalizeString_(item))
    .filter((item) => item)
}
