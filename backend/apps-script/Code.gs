function doGet(e) {
  return handleRequest_(e, 'GET')
}

function doPost(e) {
  return handleRequest_(e, 'POST')
}

function handleRequest_(e, method) {
  const params = (e && e.parameter) ? e.parameter : {}
  const action = params.action ? String(params.action).toLowerCase() : ''

  try {
    switch (action) {
      case 'ping':
        return jsonResponse_({
          success: true,
          data: {
            message: 'pong',
            method: method,
            timestamp: isoNow_()
          }
        })
      case 'getcurrentorders':
        return handleGetCurrentOrders_(params)
      case 'getproducts':
        return handleGetProducts_(params)
      case 'submitorder':
        if (method !== 'POST') {
          return jsonResponse_(buildError_('METHOD_NOT_ALLOWED', 'POST required.'))
        }
        return handleSubmitOrder_(params)
      case 'updateorder':
        if (method !== 'POST') {
          return jsonResponse_(buildError_('METHOD_NOT_ALLOWED', 'POST required.'))
        }
        return handleUpdateOrder_(params)
      case 'cancelorder':
        if (method !== 'POST') {
          return jsonResponse_(buildError_('METHOD_NOT_ALLOWED', 'POST required.'))
        }
        return handleCancelOrder_(params)
      case 'getmyorders':
        return handleGetMyOrders_(params)
      case 'getordersessions':
        return handleGetOrderSessions_(params)
      case 'getstatistics':
        return handleGetStatistics_(params)
      case 'exportorders':
        if (method !== 'POST') {
          return jsonResponse_(buildError_('METHOD_NOT_ALLOWED', 'POST required.'))
        }
        return handleExportOrders_(params)
      case 'adminlogin':
        if (method !== 'POST') {
          return jsonResponse_(buildError_('METHOD_NOT_ALLOWED', 'POST required.'))
        }
        return handleAdminLogin_(params)
      case 'uploaddata':
        if (method !== 'POST') {
          return jsonResponse_(buildError_('METHOD_NOT_ALLOWED', 'POST required.'))
        }
        return handleUploadData_(params)
      case 'openorder':
        if (method !== 'POST') {
          return jsonResponse_(buildError_('METHOD_NOT_ALLOWED', 'POST required.'))
        }
        return handleOpenOrder_(params)
      case 'closeorder':
        if (method !== 'POST') {
          return jsonResponse_(buildError_('METHOD_NOT_ALLOWED', 'POST required.'))
        }
        return handleCloseOrder_(params)
      case 'getstores':
        if (method !== 'POST') {
          return jsonResponse_(buildError_('METHOD_NOT_ALLOWED', 'POST required.'))
        }
        return handleGetStores_(params)
      case 'toggleactive':
        if (method !== 'POST') {
          return jsonResponse_(buildError_('METHOD_NOT_ALLOWED', 'POST required.'))
        }
        return handleToggleActive_(params)
      default:
        return jsonResponse_(buildError_('UNKNOWN_ACTION', 'Unknown action.'))
    }
  } catch (error) {
    return jsonResponse_({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: error && error.message ? error.message : 'Unexpected error.'
      }
    })
  }
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON)
}

function buildError_(code, message) {
  return {
    success: false,
    error: {
      code: code,
      message: message
    }
  }
}

function isoNow_() {
  const zone = Session.getScriptTimeZone()
  return Utilities.formatDate(new Date(), zone, "yyyy-MM-dd'T'HH:mm:ss")
}

function getScriptProperty_(key) {
  return PropertiesService.getScriptProperties().getProperty(key)
}

function getAdminPassword_() {
  return getScriptProperty_('AdminPassword')
}

function getTokenSecret_() {
  return getScriptProperty_('TokenSecret')
}
