<script setup>
import { computed, ref } from 'vue'
import { apiConfigured, apiPost } from '../services/api'

const password = ref('')
const adminToken = ref(sessionStorage.getItem('officeOrderAdminToken') || '')
const adminExpiresAt = ref(Number(sessionStorage.getItem('officeOrderAdminTokenExp')) || 0)
const statusMessage = ref('')

const uploadType = ref('store')
const uploadFormat = ref('csv')
const uploadData = ref('')
const uploadStatus = ref('')

const openStoreId = ref('')
const openStoreType = ref('drink')
const openAdminName = ref('')
const openStatus = ref('')

const closeSessionId = ref('')
const closeStoreType = ref('')
const closeStatus = ref('')

const toggleType = ref('store')
const toggleId = ref('')
const toggleActive = ref('TRUE')
const toggleStatus = ref('')

const exportSessionId = ref('')
const exportStatus = ref('')
const exportResult = ref('')

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
  adminToken.value = ''
  adminExpiresAt.value = 0
  sessionStorage.removeItem('officeOrderAdminToken')
  sessionStorage.removeItem('officeOrderAdminTokenExp')
}

async function login() {
  if (!apiConfigured) {
    statusMessage.value = 'API 尚未設定，無法登入。'
    return
  }
  statusMessage.value = '登入中...'
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
}

async function upload() {
  uploadStatus.value = '上傳中...'
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
}

async function openOrder() {
  openStatus.value = '開單中...'
  const response = await apiPost('openOrder', {
    adminToken: adminToken.value,
    storeId: openStoreId.value,
    storeType: openStoreType.value,
    adminName: openAdminName.value
  })
  if (response && response.success) {
    openStatus.value = `已開單：${response.orderSessionId}`
    return
  }
  openStatus.value = response?.error?.message || '開單失敗'
}

async function closeOrder() {
  closeStatus.value = '關單中...'
  const response = await apiPost('closeOrder', {
    adminToken: adminToken.value,
    orderSessionId: closeSessionId.value,
    storeType: closeStoreType.value
  })
  if (response && response.success) {
    closeStatus.value = '已關單'
    return
  }
  closeStatus.value = response?.error?.message || '關單失敗'
}

async function toggle() {
  toggleStatus.value = '更新中...'
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
}

async function exportOrders() {
  exportStatus.value = '匯出中...'
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
}
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
          <p>{{ apiConfigured ? 'GAS API' : '未設定 API' }}</p>
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
          />
          <button
            type="button"
            class="rounded-menu bg-saffron px-4 py-2 text-sm font-bold text-cocoa shadow-paper"
            @click="login"
          >
            登入
          </button>
          <button
            type="button"
            class="rounded-menu border border-cocoa/20 px-3 py-2 text-sm font-semibold text-cocoa"
            @click="logout"
          >
            登出
          </button>
        </div>
        <p class="mt-2 text-xs text-ink/60">{{ statusMessage }}</p>
      </div>
    </div>

    <div class="rounded-menu border border-cocoa/10 bg-paper/80 p-5 shadow-paper">
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
          @click="upload"
        >
          上傳
        </button>
      </div>
      <textarea
        v-model="uploadData"
        rows="5"
        placeholder="貼上 CSV 或 JSON"
        class="mt-3 w-full rounded-menu border border-cocoa/15 bg-paper/90 p-3 text-sm text-ink focus:border-cocoa/40 focus:outline-none"
      ></textarea>
      <p class="mt-2 text-xs text-ink/60">{{ uploadStatus }}</p>
    </div>

    <div class="rounded-menu border border-cocoa/10 bg-paper/80 p-5 shadow-paper">
      <h3 class="font-display text-xl text-cocoa">場次管理</h3>
      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <div class="rounded-menu border border-cocoa/10 bg-fog/60 p-4">
          <p class="text-xs font-semibold tracking-[0.24em] text-ink/55">OPEN</p>
          <input
            v-model="openStoreId"
            type="text"
            placeholder="StoreID"
            class="mt-2 w-full rounded-menu border border-cocoa/15 bg-paper px-3 py-2 text-sm text-ink"
          />
          <select v-model="openStoreType" class="mt-2 w-full rounded-menu border border-cocoa/15 bg-paper px-3 py-2 text-sm text-ink">
            <option value="drink">drink</option>
            <option value="meal">meal</option>
          </select>
          <input
            v-model="openAdminName"
            type="text"
            placeholder="管理者姓名"
            class="mt-2 w-full rounded-menu border border-cocoa/15 bg-paper px-3 py-2 text-sm text-ink"
          />
          <button
            type="button"
            class="mt-3 w-full rounded-menu bg-saffron px-4 py-2 text-sm font-bold text-cocoa"
            @click="openOrder"
          >
            開單
          </button>
          <p class="mt-2 text-xs text-ink/60">{{ openStatus }}</p>
        </div>

        <div class="rounded-menu border border-cocoa/10 bg-fog/60 p-4">
          <p class="text-xs font-semibold tracking-[0.24em] text-ink/55">CLOSE</p>
          <input
            v-model="closeSessionId"
            type="text"
            placeholder="OrderSessionID"
            class="mt-2 w-full rounded-menu border border-cocoa/15 bg-paper px-3 py-2 text-sm text-ink"
          />
          <input
            v-model="closeStoreType"
            type="text"
            placeholder="或輸入 storeType（drink/meal）"
            class="mt-2 w-full rounded-menu border border-cocoa/15 bg-paper px-3 py-2 text-sm text-ink"
          />
          <button
            type="button"
            class="mt-3 w-full rounded-menu border border-cocoa/20 px-4 py-2 text-sm font-bold text-cocoa"
            @click="closeOrder"
          >
            關單
          </button>
          <p class="mt-2 text-xs text-ink/60">{{ closeStatus }}</p>
        </div>
      </div>
    </div>

    <div class="rounded-menu border border-cocoa/10 bg-paper/80 p-5 shadow-paper">
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
          @click="toggle"
        >
          更新
        </button>
      </div>
      <p class="mt-2 text-xs text-ink/60">{{ toggleStatus }}</p>
    </div>

    <div class="rounded-menu border border-cocoa/10 bg-paper/80 p-5 shadow-paper">
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
          @click="exportOrders"
        >
          匯出
        </button>
      </div>
      <p class="mt-2 text-xs text-ink/60">{{ exportStatus }}</p>
      <pre v-if="exportResult" class="mt-3 max-h-48 overflow-auto rounded-menu border border-cocoa/10 bg-fog/60 p-3 text-xs text-ink">
{{ exportResult }}
      </pre>
    </div>
  </section>
</template>
