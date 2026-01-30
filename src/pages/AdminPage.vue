<script setup>
import { computed, ref, watch } from 'vue'
import { apiConfigured, apiGet, apiPost, clearAdminCaches } from '../services/api'

const password = ref('')
const adminToken = ref(sessionStorage.getItem('officeOrderAdminToken') || '')
const adminExpiresAt = ref(Number(sessionStorage.getItem('officeOrderAdminTokenExp')) || 0)
const statusMessage = ref('')

const loginLoading = ref(false)

const uploadType = ref('store')
const uploadFormat = ref('csv')
const uploadData = ref('')
const uploadStatus = ref('')
const uploadLoading = ref(false)

const openStoreId = ref('')
const openStoreType = ref('drink')
const openAdminName = ref('')
const openStatus = ref('')
const openLoading = ref(false)

const stores = ref([])
const storeListStatus = ref('')
const storesLoading = ref(false)

const openOrderSessions = ref([])
const openOrderStatus = ref('')
const openOrderLoading = ref(false)

const closeSessionId = ref('')
const closeStoreType = ref('')
const closeStatus = ref('')
const closeLoading = ref(false)

const selectedCloseSession = computed(() => {
  return openOrderSessions.value.find((session) => session.orderSessionId === closeSessionId.value) || null
})

const toggleType = ref('store')
const toggleId = ref('')
const toggleActive = ref('TRUE')
const toggleStatus = ref('')
const toggleLoading = ref(false)

const exportSessionId = ref('')
const exportStatus = ref('')
const exportResult = ref('')
const exportLoading = ref(false)

const isLoggedIn = computed(() => {
  if (!adminToken.value) {
    return false
  }
  if (adminExpiresAt.value && Date.now() > adminExpiresAt.value) {
    return false
  }
  return true
})

function logout() {
  clearAdminCaches()
  adminToken.value = ''
  adminExpiresAt.value = 0
  sessionStorage.removeItem('officeOrderAdminToken')
  sessionStorage.removeItem('officeOrderAdminTokenExp')

  stores.value = []
  storeListStatus.value = ''

  loginLoading.value = false
  storesLoading.value = false
  uploadLoading.value = false
  openLoading.value = false
  closeLoading.value = false
  toggleLoading.value = false
  exportLoading.value = false
}

async function loadStores() {
  if (!apiConfigured) {
    stores.value = []
    storeListStatus.value = '請設定 VITE_API_BASE_URL 環境變數'
    return
  }
  if (!isLoggedIn.value) {
    stores.value = []
    storeListStatus.value = '請先登入以載入店家。'
    return
  }

  storesLoading.value = true
  storeListStatus.value = '載入店家中...'
  try {
    const response = await apiPost('getStores', {
      adminToken: adminToken.value,
      storeType: openStoreType.value
    })

    if (response && response.success) {
      const rawStores = Array.isArray(response.data) ? response.data : []
      stores.value = rawStores.filter((store) => store && store.storeId)

      const activeStores = stores.value.filter((store) => store && store.isActive)
      const selected = stores.value.find((store) => store && store.storeId === openStoreId.value)
      if (!selected || !selected.isActive) {
        openStoreId.value = activeStores[0]?.storeId || ''
      }

      storeListStatus.value = `已載入 ${stores.value.length} 家店` + (activeStores.length ? '' : '（目前無可開單店家）')
      return
    }

    stores.value = []
    storeListStatus.value = response?.error?.message || '載入店家失敗'
  } finally {
    storesLoading.value = false
  }
}

async function loadOpenOrderSessions() {
  if (!apiConfigured) {
    openOrderSessions.value = []
    openOrderStatus.value = '請設定 VITE_API_BASE_URL 環境變數'
    return
  }

  openOrderLoading.value = true
  openOrderStatus.value = '載入場次中...'
  try {
    const response = await apiGet('getCurrentOrders')
    if (response && response.success) {
      const data = response.data || {}
      const sessions = [data.drink, data.meal]
        .filter(Boolean)
        .filter((session) => session.status === 'open')

      openOrderSessions.value = sessions
      openOrderStatus.value = sessions.length ? `尚未關單 ${sessions.length} 筆` : '目前沒有尚未關單的場次'

      const nextSelected = sessions.find((session) => session.orderSessionId === closeSessionId.value) || sessions[0] || null
      closeSessionId.value = nextSelected?.orderSessionId || ''
      closeStoreType.value = nextSelected?.storeType || ''
      return
    }

    openOrderSessions.value = []
    openOrderStatus.value = response?.error?.message || '載入場次失敗'
  } finally {
    openOrderLoading.value = false
  }
}

async function login() {
  if (!apiConfigured) {
    statusMessage.value = '請設定 VITE_API_BASE_URL 環境變數'
    return
  }
  loginLoading.value = true
  statusMessage.value = '登入中...'
  try {
    const response = await apiPost('adminLogin', { password: password.value })
    if (response && response.success) {
      adminToken.value = response.adminToken
      adminExpiresAt.value = Date.now() + Number(response.expiresIn || 0) * 1000
      sessionStorage.setItem('officeOrderAdminToken', adminToken.value)
      sessionStorage.setItem('officeOrderAdminTokenExp', String(adminExpiresAt.value))
      statusMessage.value = '登入成功'
      return
    }
    statusMessage.value = response?.error?.message || '登入失敗'
  } finally {
    loginLoading.value = false
  }
}

async function upload() {
  uploadLoading.value = true
  uploadStatus.value = '上傳中...'
  try {
    const response = await apiPost('uploadData', {
      adminToken: adminToken.value,
      dataType: uploadType.value,
      format: uploadFormat.value,
      data: uploadData.value
    })
    if (response && response.success) {
      uploadStatus.value = `完成：新增 ${response.insertedCount} 筆，更新 ${response.updatedCount} 筆`
      return
    }
    uploadStatus.value = response?.error?.message || '上傳失敗'
  } finally {
    uploadLoading.value = false
  }
}

async function openOrder() {
  openLoading.value = true
  openStatus.value = '開單中...'
  try {
    const response = await apiPost('openOrder', {
      adminToken: adminToken.value,
      storeId: openStoreId.value,
      storeType: openStoreType.value,
      adminName: openAdminName.value
    })
    if (response && response.success) {
      openStatus.value = `已開單：${response.orderSessionId}`
      await loadOpenOrderSessions()
      return
    }
    openStatus.value = response?.error?.message || '開單失敗'
  } finally {
    openLoading.value = false
  }
}

async function closeOrder() {
  closeLoading.value = true
  closeStatus.value = '關單中...'
  try {
    const response = await apiPost('closeOrder', {
      adminToken: adminToken.value,
      orderSessionId: closeSessionId.value,
      storeType: selectedCloseSession.value?.storeType || closeStoreType.value
    })
    if (response && response.success) {
      closeStatus.value = '已關單'
      await loadOpenOrderSessions()
      return
    }
    closeStatus.value = response?.error?.message || '關單失敗'
  } finally {
    closeLoading.value = false
  }
}

async function toggle() {
  toggleLoading.value = true
  toggleStatus.value = '更新中...'
  try {
    const response = await apiPost('toggleActive', {
      adminToken: adminToken.value,
      type: toggleType.value,
      id: toggleId.value,
      isActive: toggleActive.value
    })
    if (response && response.success) {
      toggleStatus.value = '狀態已更新'
      return
    }
    toggleStatus.value = response?.error?.message || '更新失敗'
  } finally {
    toggleLoading.value = false
  }
}

async function exportOrders() {
  exportLoading.value = true
  exportStatus.value = '匯出中...'
  try {
    const response = await apiPost('exportOrders', {
      adminToken: adminToken.value,
      orderSessionId: exportSessionId.value
    })
    if (response && response.success) {
      exportResult.value = JSON.stringify(response.data || [], null, 2)
      exportStatus.value = '匯出完成'
      return
    }
    exportStatus.value = response?.error?.message || '匯出失敗'
  } finally {
    exportLoading.value = false
  }
}

watch(openStoreType, async () => {
  openStoreId.value = ''
  if (isLoggedIn.value) {
    await loadStores()
  }
})

watch(closeSessionId, (next) => {
  const session = openOrderSessions.value.find((item) => item.orderSessionId === next)
  if (session) {
    closeStoreType.value = session.storeType
  }
})

watch(
  isLoggedIn,
  async (next) => {
    if (next) {
      await loadStores()
      await loadOpenOrderSessions()
      return
    }
    stores.value = []
    storeListStatus.value = ''

    openOrderSessions.value = []
    openOrderStatus.value = ''
    openOrderLoading.value = false
  },
  { immediate: true }
)
</script>

<template>
  <section class="space-y-6">
    <div class="rounded-menu border border-cocoa/10 bg-paper/80 p-5 shadow-paper">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="font-display text-2xl text-cocoa">管理</h2>
          <p class="mt-2 text-sm leading-relaxed text-ink/80">
            管理者登入後可進行上傳、開關單與匯出。
          </p>
        </div>
        <div class="text-right text-xs text-ink/60">
          <p>GAS API</p>
          <p>狀態：{{ isLoggedIn ? '已登入' : '未登入' }}</p>
        </div>
      </div>

      <div class="mt-5 rounded-menu border border-cocoa/10 bg-fog/60 p-4">
        <p class="text-xs font-semibold tracking-[0.24em] text-ink/55">ADMIN LOGIN</p>
        <div class="mt-3 flex flex-wrap items-center gap-3">
          <input
            v-model="password"
            type="password"
            placeholder="管理者密碼"
            class="rounded-menu border border-cocoa/15 bg-paper/90 px-3 py-2 text-sm text-ink focus:border-cocoa/50 focus:outline-none"
            :disabled="loginLoading"
          />
          <button
            type="button"
            class="rounded-menu bg-saffron px-4 py-2 text-sm font-bold text-cocoa shadow-paper"
            :class="loginLoading ? 'opacity-70 cursor-not-allowed' : ''"
            :disabled="loginLoading"
            @click="login"
          >
            <span class="inline-flex items-center gap-2">
              <span v-if="loginLoading" class="h-4 w-4 rounded-full border-2 border-cocoa/25 border-t-cocoa animate-spin"></span>
              登入
            </span>
          </button>
          <button
            type="button"
            class="rounded-menu border border-cocoa/20 px-3 py-2 text-sm font-semibold text-cocoa"
            @click="logout"
          >
            登出
          </button>
        </div>
        <p class="mt-2 text-xs text-ink/60">
          <span v-if="loginLoading" class="inline-flex items-center gap-2">
            <span class="h-3.5 w-3.5 rounded-full border-2 border-cocoa/25 border-t-cocoa animate-spin"></span>
            {{ statusMessage }}
          </span>
          <span v-else>{{ statusMessage }}</span>
        </p>
      </div>
    </div>

    <div v-if="isLoggedIn" class="rounded-menu border border-cocoa/10 bg-paper/80 p-5 shadow-paper">
      <h3 class="font-display text-xl text-cocoa">場次管理</h3>
      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <div class="rounded-menu border border-cocoa/10 bg-fog/60 p-4">
          <p class="text-xs font-semibold tracking-[0.24em] text-ink/55">OPEN</p>
          <select v-model="openStoreType" class="mt-2 w-full rounded-menu border border-cocoa/15 bg-paper px-3 py-2 text-sm text-ink">
            <option value="drink">喝</option>
            <option value="meal">吃</option>
          </select>
          <select v-model="openStoreId" class="mt-2 w-full rounded-menu border border-cocoa/15 bg-paper px-3 py-2 text-sm text-ink">
            <option value="" disabled>選擇店家</option>
            <option v-for="store in stores" :key="store.storeId" :value="store.storeId" :disabled="!store.isActive">
              {{ store.storeName || store.storeId }}{{ store.isActive ? '' : '（停用）' }}
            </option>
          </select>
          <p class="mt-2 text-xs text-ink/60">
            <span v-if="storesLoading" class="inline-flex items-center gap-2">
              <span class="h-3.5 w-3.5 rounded-full border-2 border-cocoa/25 border-t-cocoa animate-spin"></span>
              {{ storeListStatus }}
            </span>
            <span v-else>{{ storeListStatus }}</span>
          </p>
          <input
            v-model="openAdminName"
            type="text"
            placeholder="管理者姓名"
            class="mt-2 w-full rounded-menu border border-cocoa/15 bg-paper px-3 py-2 text-sm text-ink"
          />
          <button
            type="button"
            class="mt-3 w-full rounded-menu bg-saffron px-4 py-2 text-sm font-bold text-cocoa"
            :class="openLoading ? 'opacity-70 cursor-not-allowed' : ''"
            :disabled="openLoading"
            @click="openOrder"
          >
            <span class="inline-flex items-center justify-center gap-2">
              <span v-if="openLoading" class="h-4 w-4 rounded-full border-2 border-cocoa/25 border-t-cocoa animate-spin"></span>
              開單
            </span>
          </button>
          <p class="mt-2 text-xs text-ink/60">
            <span v-if="openLoading" class="inline-flex items-center gap-2">
              <span class="h-3.5 w-3.5 rounded-full border-2 border-cocoa/25 border-t-cocoa animate-spin"></span>
              {{ openStatus }}
            </span>
            <span v-else>{{ openStatus }}</span>
          </p>
        </div>

        <div class="rounded-menu border border-cocoa/10 bg-fog/60 p-4">
          <p class="text-xs font-semibold tracking-[0.24em] text-ink/55">CLOSE</p>
          <select
            v-model="closeSessionId"
            class="mt-2 w-full rounded-menu border border-cocoa/15 bg-paper px-3 py-2 text-sm text-ink"
            :disabled="openOrderLoading || openOrderSessions.length === 0"
          >
            <option value="" disabled>選擇尚未關單單號</option>
            <option v-for="session in openOrderSessions" :key="session.orderSessionId" :value="session.orderSessionId">
              {{ session.orderSessionId }}
            </option>
          </select>
          <p class="mt-2 text-xs text-ink/60">
            <span v-if="openOrderLoading" class="inline-flex items-center gap-2">
              <span class="h-3.5 w-3.5 rounded-full border-2 border-cocoa/25 border-t-cocoa animate-spin"></span>
              {{ openOrderStatus }}
            </span>
            <span v-else>{{ openOrderStatus }}</span>
          </p>
          <input
            v-model="closeStoreType"
            type="text"
            placeholder="storeType"
            class="mt-2 w-full rounded-menu border border-cocoa/15 bg-paper px-3 py-2 text-sm text-ink"
            disabled
          />
          <button
            type="button"
            class="mt-3 w-full rounded-menu border border-cocoa/20 px-4 py-2 text-sm font-bold text-cocoa"
            :class="closeLoading ? 'opacity-70 cursor-not-allowed' : ''"
            :disabled="closeLoading"
            @click="closeOrder"
          >
            <span class="inline-flex items-center justify-center gap-2">
              <span v-if="closeLoading" class="h-4 w-4 rounded-full border-2 border-cocoa/25 border-t-cocoa animate-spin"></span>
              關單
            </span>
          </button>
          <p class="mt-2 text-xs text-ink/60">
            <span v-if="closeLoading" class="inline-flex items-center gap-2">
              <span class="h-3.5 w-3.5 rounded-full border-2 border-cocoa/25 border-t-cocoa animate-spin"></span>
              {{ closeStatus }}
            </span>
            <span v-else>{{ closeStatus }}</span>
          </p>
        </div>
      </div>
    </div>

    <div v-if="isLoggedIn" class="rounded-menu border border-cocoa/10 bg-paper/80 p-5 shadow-paper">
      <h3 class="font-display text-xl text-cocoa">訂單匯出</h3>
      <div class="mt-4 flex flex-wrap items-center gap-3">
        <input
          v-model="exportSessionId"
          type="text"
          placeholder="OrderSessionID"
          class="rounded-menu border border-cocoa/15 bg-paper px-3 py-2 text-sm text-ink"
        />
        <button
          type="button"
          class="rounded-menu bg-saffron px-4 py-2 text-sm font-bold text-cocoa"
          :class="exportLoading ? 'opacity-70 cursor-not-allowed' : ''"
          :disabled="exportLoading"
          @click="exportOrders"
        >
          <span class="inline-flex items-center gap-2">
            <span v-if="exportLoading" class="h-4 w-4 rounded-full border-2 border-cocoa/25 border-t-cocoa animate-spin"></span>
            匯出
          </span>
        </button>
      </div>
      <p class="mt-2 text-xs text-ink/60">
        <span v-if="exportLoading" class="inline-flex items-center gap-2">
          <span class="h-3.5 w-3.5 rounded-full border-2 border-cocoa/25 border-t-cocoa animate-spin"></span>
          {{ exportStatus }}
        </span>
        <span v-else>{{ exportStatus }}</span>
      </p>
      <pre v-if="exportResult" class="mt-3 max-h-48 overflow-auto rounded-menu border border-cocoa/10 bg-fog/60 p-3 text-xs text-ink">
{{ exportResult }}
      </pre>
    </div>

    <div v-if="isLoggedIn" class="rounded-menu border border-cocoa/10 bg-paper/80 p-5 shadow-paper">
      <h3 class="font-display text-xl text-cocoa">資料上傳</h3>
      <div class="mt-4 grid gap-3 sm:grid-cols-3">
        <select v-model="uploadType" class="rounded-menu border border-cocoa/15 bg-paper px-3 py-2 text-sm text-ink">
          <option value="store">店家</option>
          <option value="product">產品</option>
        </select>
        <select v-model="uploadFormat" class="rounded-menu border border-cocoa/15 bg-paper px-3 py-2 text-sm text-ink">
          <option value="csv">CSV</option>
          <option value="json">JSON</option>
        </select>
        <button
          type="button"
          class="rounded-menu bg-saffron px-4 py-2 text-sm font-bold text-cocoa shadow-paper"
          :class="uploadLoading ? 'opacity-70 cursor-not-allowed' : ''"
          :disabled="uploadLoading"
          @click="upload"
        >
          <span class="inline-flex items-center gap-2">
            <span v-if="uploadLoading" class="h-4 w-4 rounded-full border-2 border-cocoa/25 border-t-cocoa animate-spin"></span>
            上傳
          </span>
        </button>
      </div>
      <textarea
        v-model="uploadData"
        rows="5"
        placeholder="貼上 CSV 或 JSON"
        class="mt-3 w-full rounded-menu border border-cocoa/15 bg-paper/90 p-3 text-sm text-ink focus:border-cocoa/40 focus:outline-none"
      ></textarea>
      <p class="mt-2 text-xs text-ink/60">
        <span v-if="uploadLoading" class="inline-flex items-center gap-2">
          <span class="h-3.5 w-3.5 rounded-full border-2 border-cocoa/25 border-t-cocoa animate-spin"></span>
          {{ uploadStatus }}
        </span>
        <span v-else>{{ uploadStatus }}</span>
      </p>
    </div>

    <div v-if="isLoggedIn" class="rounded-menu border border-cocoa/10 bg-paper/80 p-5 shadow-paper">
      <h3 class="font-display text-xl text-cocoa">啟用/停用</h3>
      <div class="mt-4 flex flex-wrap items-center gap-3">
        <select v-model="toggleType" class="rounded-menu border border-cocoa/15 bg-paper px-3 py-2 text-sm text-ink">
          <option value="store">店家</option>
          <option value="product">產品</option>
        </select>
        <input
          v-model="toggleId"
          type="text"
          placeholder="ID"
          class="rounded-menu border border-cocoa/15 bg-paper px-3 py-2 text-sm text-ink"
        />
        <select v-model="toggleActive" class="rounded-menu border border-cocoa/15 bg-paper px-3 py-2 text-sm text-ink">
          <option value="TRUE">啟用</option>
          <option value="FALSE">停用</option>
        </select>
        <button
          type="button"
          class="rounded-menu border border-cocoa/20 px-4 py-2 text-sm font-bold text-cocoa"
          :class="toggleLoading ? 'opacity-70 cursor-not-allowed' : ''"
          :disabled="toggleLoading"
          @click="toggle"
        >
          <span class="inline-flex items-center gap-2">
            <span v-if="toggleLoading" class="h-4 w-4 rounded-full border-2 border-cocoa/25 border-t-cocoa animate-spin"></span>
            更新
          </span>
        </button>
      </div>
      <p class="mt-2 text-xs text-ink/60">
        <span v-if="toggleLoading" class="inline-flex items-center gap-2">
          <span class="h-3.5 w-3.5 rounded-full border-2 border-cocoa/25 border-t-cocoa animate-spin"></span>
          {{ toggleStatus }}
        </span>
        <span v-else>{{ toggleStatus }}</span>
      </p>
    </div>
  </section>
</template>
