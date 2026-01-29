<script setup>
import { computed, onMounted, ref } from 'vue'
import { apiConfigured, apiGet } from '../services/api'

const sessions = ref([])
const selectedSessionId = ref('')
const storeType = ref('')
const statsMode = ref('user')
const statsData = ref({ ordersByUser: [], ordersByProduct: [], grandTotal: 0, orderCount: 0 })
const loading = ref(false)
const errorMessage = ref('')

const mockSessions = [
  { orderSessionId: 'OS20260128001', storeType: 'drink' },
  { orderSessionId: 'OS20260128002', storeType: 'meal' }
]

const mockStats = {
  ordersByUser: [
    { userName: '王小明', totalAmount: 120, orders: [{ productName: '焙茶拿鐵', price: 65 }, { productName: '桂花青茶', price: 55 }] }
  ],
  ordersByProduct: [
    { productName: '焙茶拿鐵', count: 2, totalAmount: 130 },
    { productName: '桂花青茶', count: 1, totalAmount: 55 }
  ],
  grandTotal: 185,
  orderCount: 3
}

const activeList = computed(() => {
  return statsMode.value === 'user' ? statsData.value.ordersByUser : statsData.value.ordersByProduct
})

async function loadSessions() {
  if (!apiConfigured) {
    sessions.value = mockSessions
    selectedSessionId.value = sessions.value[0]?.orderSessionId || ''
    statsData.value = mockStats
    return
  }
  const response = await apiGet('getCurrentOrders')
  if (response && response.success) {
    const next = []
    if (response.data?.drink) {
      next.push(response.data.drink)
    }
    if (response.data?.meal) {
      next.push(response.data.meal)
    }
    sessions.value = next
    selectedSessionId.value = next[0]?.orderSessionId || ''
  }
}

async function loadStats() {
  if (!selectedSessionId.value) {
    return
  }
  if (!apiConfigured) {
    statsData.value = mockStats
    return
  }
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await apiGet('getStatistics', {
      orderSessionId: selectedSessionId.value,
      storeType: storeType.value
    })
    if (!response || !response.success) {
      throw new Error(response?.error?.message || 'Failed to load statistics.')
    }
    statsData.value = response.data
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadSessions()
  await loadStats()
})
</script>

<template>
  <section class="space-y-6">
    <div class="rounded-menu border border-cocoa/10 bg-paper/80 p-5 shadow-paper">
      <h2 class="font-display text-2xl text-cocoa">統計</h2>
      <p class="mt-2 text-sm leading-relaxed text-ink/80">
        依場次查看訂單摘要，並切換人員/品項檢視。
      </p>

      <div class="mt-5 flex flex-wrap items-center gap-3">
        <select
          v-model="selectedSessionId"
          class="rounded-menu border border-cocoa/15 bg-paper px-3 py-2 text-sm text-ink"
          @change="loadStats"
        >
          <option value="" disabled>選擇場次</option>
          <option v-for="session in sessions" :key="session.orderSessionId" :value="session.orderSessionId">
            {{ session.orderSessionId }} · {{ session.storeType?.toUpperCase() || 'SESSION' }}
          </option>
        </select>
        <select
          v-model="storeType"
          class="rounded-menu border border-cocoa/15 bg-paper px-3 py-2 text-sm text-ink"
          @change="loadStats"
        >
          <option value="">全部類型</option>
          <option value="drink">飲料</option>
          <option value="meal">便當</option>
        </select>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="rounded-menu border border-cocoa/20 px-3 py-1 text-xs font-semibold"
            :class="statsMode === 'user' ? 'bg-saffron text-cocoa' : 'text-ink'"
            @click="statsMode = 'user'"
          >
            按人員
          </button>
          <button
            type="button"
            class="rounded-menu border border-cocoa/20 px-3 py-1 text-xs font-semibold"
            :class="statsMode === 'product' ? 'bg-saffron text-cocoa' : 'text-ink'"
            @click="statsMode = 'product'"
          >
            按品項
          </button>
        </div>
      </div>

      <p v-if="errorMessage" class="mt-4 text-sm font-semibold text-cocoa">{{ errorMessage }}</p>

        <div class="mt-5 grid gap-3 sm:grid-cols-3">
          <div class="rounded-menu border border-cocoa/10 bg-fog/60 p-4">
            <p class="mt-2 text-lg font-bold text-ink">{{ loading ? '—' : statsData.orderCount }}</p>
            <p class="mt-1 text-xs text-ink/65">訂單數</p>
          </div>
          <div class="rounded-menu border border-cocoa/10 bg-fog/60 p-4">
            <p class="mt-2 text-lg font-bold text-ink">{{ loading ? '—' : `$ ${statsData.grandTotal}` }}</p>
            <p class="mt-1 text-xs text-ink/65">總金額</p>
          </div>
          <div class="rounded-menu border border-cocoa/10 bg-fog/60 p-4">
            <p class="mt-2 text-lg font-bold text-ink">{{ loading ? '—' : activeList.length }}</p>
            <p class="mt-1 text-xs text-ink/65">分類數</p>
          </div>
        </div>
    </div>

    <div class="rounded-menu border border-cocoa/10 bg-paper/80 p-5 shadow-paper">
      <h3 class="font-display text-xl text-cocoa">
        {{ statsMode === 'user' ? '人員統計' : '品項統計' }}
      </h3>
      <div v-if="loading" class="mt-4 rounded-menu border border-cocoa/10 bg-fog/60 p-4">
        <p class="text-xs font-semibold tracking-[0.24em] text-ink/55">LOADING</p>
        <div class="mt-3 flex items-start gap-3">
          <span class="mt-0.5 h-4 w-4 rounded-full border-2 border-cocoa/25 border-t-cocoa animate-spin"></span>
          <div>
            <p class="text-sm font-semibold text-ink">讀取統計中</p>
            <p class="mt-1 text-xs text-ink/60">已選擇場次，正在同步統計資料，請稍等一下。</p>
          </div>
        </div>
      </div>

      <div v-else-if="activeList.length === 0" class="mt-4 rounded-menu border border-cocoa/10 bg-fog/60 p-4">
        <p class="text-xs font-semibold tracking-[0.24em] text-ink/55">EMPTY</p>
        <p class="mt-2 text-sm font-semibold text-ink">目前沒有統計資料</p>
      </div>
      <div v-else class="mt-4 space-y-3">
        <div
          v-for="item in activeList"
          :key="statsMode === 'user' ? item.userName : item.productName"
          class="rounded-menu border border-cocoa/10 bg-fog/60 p-4"
        >
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold text-ink">
              {{ statsMode === 'user' ? item.userName : item.productName }}
            </p>
            <p class="text-sm font-semibold text-cocoa">
              {{ statsMode === 'user' ? `$ ${item.totalAmount}` : `${item.count} 份` }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
