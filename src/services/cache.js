// In-memory storage for in-flight promises (deduplication)
const inFlightRequests = new Map()

// In-memory cache storage wrapper that implements Storage API
const memoryCache = new Map()
const memoryStorageAdapter = {
  getItem(key) {
    return memoryCache.get(key) ?? null
  },
  setItem(key, value) {
    memoryCache.set(key, value)
  },
  removeItem(key) {
    memoryCache.delete(key)
  },
  clear() {
    memoryCache.clear()
  },
  get length() {
    return memoryCache.size
  },
  key(index) {
    let i = 0
    for (const k of memoryCache.keys()) {
      if (i === index) return k
      i++
    }
    return null
  }
}

/**
 * Get cached data if not expired
 * @param {string} key - Cache key
 * @param {string} storage - Storage type: 'local', 'session', or 'memory'
 * @returns {any} Cached data or undefined if expired/missing
 */
export function getCached(key, storage = 'local') {
  try {
    const storageObj = getStorageObject(storage)
    if (!storageObj) return undefined

    const fullKey = `hc_${key}`
    const cached = storageObj.getItem(fullKey)
    
    if (!cached) return undefined

    const { data, expiresAt } = JSON.parse(cached)
    
    // Check if expired
    if (expiresAt && Date.now() > expiresAt) {
      storageObj.removeItem(fullKey)
      return undefined
    }

    return data
  } catch (error) {
    console.warn(`[cache] Error getting cached data for key: ${key}`, error)
    return undefined
  }
}

/**
 * Store data with TTL
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} ttlMs - Time to live in milliseconds
 * @param {string} storage - Storage type: 'local', 'session', or 'memory'
 * @returns {boolean} Success or failure
 */
export function setCached(key, data, ttlMs = 5 * 60 * 1000, storage = 'local') {
  try {
    const storageObj = getStorageObject(storage)
    if (!storageObj) return false

    const fullKey = `hc_${key}`
    const expiresAt = ttlMs ? Date.now() + ttlMs : null
    const cacheEntry = JSON.stringify({ data, expiresAt })

    storageObj.setItem(fullKey, cacheEntry)
    return true
  } catch (error) {
    // Handle quota exceeded errors gracefully
    if (error.name === 'QuotaExceededError' || error.code === 22) {
      console.warn(`[cache] Storage quota exceeded for key: ${key}`, error)
      return false
    }
    console.warn(`[cache] Error setting cache for key: ${key}`, error)
    return false
  }
}

/**
 * Remove all cache entries matching a prefix
 * @param {string} prefix - Prefix to match (will be prepended with 'hc_')
 * @param {string} storage - Storage type: 'local', 'session', or 'memory'
 */
export function invalidateByPrefix(prefix, storage = 'local') {
  try {
    const storageObj = getStorageObject(storage)
    if (!storageObj) return

    const fullPrefix = `hc_${prefix}`
    const keysToRemove = []

    if (storage === 'memory') {
      for (const key of memoryCache.keys()) {
        if (key.startsWith(fullPrefix)) {
          keysToRemove.push(key)
        }
      }
    } else {
      for (let i = 0; i < storageObj.length; i++) {
        const key = storageObj.key(i)
        if (key && key.startsWith(fullPrefix)) {
          keysToRemove.push(key)
        }
      }
    }

    keysToRemove.forEach(key => storageObj.removeItem(key))
  } catch (error) {
    console.warn(`[cache] Error invalidating prefix: ${prefix}`, error)
  }
}

/**
 * Remove all cache entries
 * @param {string} storage - Storage type: 'local', 'session', or 'memory'
 */
export function clearAllCache(storage = 'local') {
  try {
    const storageObj = getStorageObject(storage)
    if (!storageObj) return

    const keysToRemove = []

    if (storage === 'memory') {
      for (const key of memoryCache.keys()) {
        if (key.startsWith('hc_')) {
          keysToRemove.push(key)
        }
      }
    } else {
      for (let i = 0; i < storageObj.length; i++) {
        const key = storageObj.key(i)
        if (key && key.startsWith('hc_')) {
          keysToRemove.push(key)
        }
      }
    }

    keysToRemove.forEach(key => storageObj.removeItem(key))
  } catch (error) {
    console.warn(`[cache] Error clearing all cache`, error)
  }
}

/**
 * Get or fetch data with in-flight deduplication and caching
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Async function to fetch data
 * @param {number} ttlMs - TTL in milliseconds (default: 5 minutes)
 * @param {string} storage - Storage type: 'local', 'session', or 'memory'
 * @returns {Promise<any>} Cached or fetched data
 */
export async function getOrFetch(
  key,
  fetchFn,
  ttlMs = 5 * 60 * 1000,
  storage = 'local'
) {
  // Check cache first
  const cached = getCached(key, storage)
  if (cached !== undefined) {
    return cached
  }

  // Check if request is already in flight (deduplication)
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key)
  }

  // Create promise for in-flight tracking
  const promise = (async () => {
    try {
      const data = await fetchFn()
      setCached(key, data, ttlMs, storage)
      return data
    } finally {
      // Remove from in-flight tracking
      inFlightRequests.delete(key)
    }
  })()

  // Store in-flight promise
  inFlightRequests.set(key, promise)

  return promise
}

/**
 * Get storage object based on type
 * @param {string} storage - Storage type: 'local', 'session', or 'memory'
 * @returns {Storage|Map|null} Storage object or null if not available
 */
function getStorageObject(storage) {
  if (storage === 'memory') {
    return memoryStorageAdapter
  }
  if (storage === 'session') {
    return typeof sessionStorage !== 'undefined' ? sessionStorage : null
  }
  return typeof localStorage !== 'undefined' ? localStorage : null
}
