import { getOrFetch, invalidateByPrefix } from './cache.js'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export const apiConfigured = Boolean(API_BASE_URL)

const CACHE_CONFIG = {
  'getCurrentOrders': { ttl: 5 * 60 * 1000, storage: 'session' },
  'getProducts': { ttl: 24 * 60 * 60 * 1000, storage: 'local' },
  'getOrderSessions': { ttl: 5 * 60 * 1000, storage: 'session' },
  'getStores': { ttl: 24 * 60 * 60 * 1000, storage: 'memory' }
}

const INVALIDATION_MAP = {
  'uploadData': (body) => body.dataType === 'store' ? ['getStores_'] : ['getProducts_'],
  'toggleActive': (body) => body.type === 'store' ? ['getStores_'] : ['getProducts_'],
  'openOrder': () => ['getCurrentOrders'],
  'closeOrder': () => ['getCurrentOrders'],
  'submitOrder': () => ['getOrderSessions_']
}

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

  // Check if this action should use cache
  const cacheConfig = CACHE_CONFIG[action]
  if (cacheConfig) {
    const cacheKey = `${action}_${JSON.stringify(params || {})}`
    return getOrFetch(
      cacheKey,
      async () => {
        const url = buildUrl(action, params)
        const response = await fetch(url)
        return parseResponse(response)
      },
      cacheConfig.ttl,
      cacheConfig.storage
    )
  }

  // No cache - use original logic
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

  const result = await parseResponse(response)

  // Invalidate caches after successful mutations
  if (result?.success === true && INVALIDATION_MAP[action]) {
    const prefixes = INVALIDATION_MAP[action](body)
    prefixes.forEach(prefix => {
      // Determine storage type from prefix pattern
      if (prefix.includes('getStores')) {
        invalidateByPrefix(prefix, 'memory')
      } else if (prefix.includes('getCurrentOrders') || prefix.includes('getOrderSessions')) {
        invalidateByPrefix(prefix, 'session')
      } else {
        invalidateByPrefix(prefix, 'local')
      }
    })
  }

  return result
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

export function clearAdminCaches() {
  invalidateByPrefix('getStores_', 'memory')
}
