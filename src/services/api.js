const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export const apiConfigured = Boolean(API_BASE_URL)

function buildUrl(action, params) {
  const url = new URL(API_BASE_URL)
  url.searchParams.set('action', action)
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value)
    }
  })
  return url.toString()
}

export async function apiGet(action, params = {}) {
  if (!API_BASE_URL) {
    return null
  }
  const url = buildUrl(action, params)
  const response = await fetch(url)
  return parseResponse(response)
}

export async function apiPost(action, body = {}) {
  if (!API_BASE_URL) {
    return null
  }

  const formData = new URLSearchParams({ action, ...body })
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formData.toString()
  })

  return parseResponse(response)
}

async function parseResponse(response) {
  if (!response.ok) {
    return {
      success: false,
      error: {
        code: 'HTTP_ERROR',
        message: `HTTP ${response.status}`
      }
    }
  }
  try {
    return await response.json()
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Response was not valid JSON.'
      }
    }
  }
}
