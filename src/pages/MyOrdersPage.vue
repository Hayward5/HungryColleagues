<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { apiConfigured, apiGet, apiPost } from '../services/api'

const userName = ref(localStorage.getItem('officeOrderUser') || '')
const nameInput = ref(userName.value)
const sessions = ref([])
const selectedSessionId = ref('')
const orders = ref([])
const totalAmount = ref(0)
const loading = ref(false)
const errorMessage = ref('')
const editOpen = ref(false)
const editOrder = ref(null)
const editState = reactive({
  size: '',
  sugar: '',
  ice: '',
  note: ''
})
const editStatus = ref('')
const currentSessions = ref({ drink: null, meal: null })

const hasUserName = computed(() => userName.value.length > 0)
const noteLimit = computed(() => 15)
const remainingNote = computed(() => noteLimit.value - editState.note.length)
const selectedSession = computed(() => sessions.value.find((s) => s.orderSessionId === selectedSessionId.value))

const mockSessions = [
  { orderSessionId: 'OS20260128001', storeType: 'drink', createdAt: '2026-01-28 10:00' },
  { orderSessionId: 'OS20260127001', storeType: 'meal', createdAt: '2026-01-27 12:00' }
]

const mockOrders = {
  OS20260128001: [
    {
      orderId: 1,
      productName: '焙茶拿鐵',
      size: '中杯',
      sugar: '半糖',
      ice: '少冰',
      note: '',
      price: 65,
      createdAt: '2026-01-28 10:20',
      status: 'active'
    }
  ],
  OS20260127001: [
    {
      orderId: 2,
      productName: '香煎雞腿便當',
      size: '',
      sugar: '',
      ice: '',
      note: '不要辣',
      price: 110,
      createdAt: '2026-01-27 12:10',
      status: 'active'
    }
  ]
}

function saveName() {
  const trimmed = nameInput.value.trim()
  if (!trimmed) {
    return
  }
  userName.value = trimmed
  localStorage.setItem('officeOrderUser', trimmed)
  loadSessions()
}

async function loadSessions() {
  if (!hasUserName.value) {
    return
  }
  loading.value = true
  errorMessage.value = ''
  try {
    if (!apiConfigured) {
      sessions.value = mockSessions
      selectedSessionId.value = sessions.value[0]?.orderSessionId || ''
      return
    }
    const response = await apiGet('getOrderSessions', { userName: userName.value })
    if (!response || !response.success) {
      throw new Error(response?.error?.message || 'Failed to load sessions.')
    }
    sessions.value = response.data || []
    selectedSessionId.value = sessions.value[0]?.orderSessionId || ''
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
}

async function loadOrders() {
  if (!selectedSessionId.value || !hasUserName.value) {
    orders.value = []
    totalAmount.value = 0
    return
  }
  loading.value = true
  errorMessage.value = ''
  try {
    if (!apiConfigured) {
      orders.value = mockOrders[selectedSessionId.value] || []
      totalAmount.value = orders.value.reduce((sum, order) => sum + order.price, 0)
      return
    }
    const response = await apiGet('getMyOrders', {
      userName: userName.value,
      orderSessionId: selectedSessionId.value
    })
    if (!response || !response.success) {
      throw new Error(response?.error?.message || 'Failed to load orders.')
    }
    orders.value = response.data || []
    totalAmount.value = response.totalAmount || 0
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
}

async function loadCurrentSessions() {
  if (!apiConfigured) {
    return
  }
  const response = await apiGet('getCurrentOrders')
  if (response && response.success) {
    currentSessions.value = {
      drink: response.data?.drink || null,
      meal: response.data?.meal || null
    }
  }
}

function openEdit(order) {
  editOrder.value = order
  editState.size = order.size || ''
  editState.sugar = order.sugar || ''
  editState.ice = order.ice || ''
  editState.note = order.note || ''
  editStatus.value = ''
  editOpen.value = true
}

function closeEdit() {
  editOpen.value = false
  editOrder.value = null
}

async function submitEdit() {
  if (!editOrder.value) {
    return
  }
  if (!apiConfigured) {
    editStatus.value = '示意更新完成'
    return
  }
  editStatus.value = '更新中...'
  const response = await apiPost('updateOrder', {
    orderId: editOrder.value.orderId,
    userName: userName.value,
    size: editState.size,
    sugar: editState.sugar,
    ice: editState.ice,
    note: editState.note
  })
  if (response && response.success) {
    editStatus.value = '更新成功'
    await loadOrders()
    return
  }
  editStatus.value = response?.error?.message || '更新失敗'
}

async function cancelOrder(orderId) {
  if (!apiConfigured) {
    orders.value = orders.value.filter((order) => order.orderId !== orderId)
    totalAmount.value = orders.value.reduce((sum, order) => sum + order.price, 0)
    return
  }
  const response = await apiPost('cancelOrder', {
    orderId: orderId,
    userName: userName.value
  })
  if (response && response.success) {
    await loadOrders()
  } else {
    errorMessage.value = response?.error?.message || '取消失敗'
  }
}

const optionSets = computed(() => {
  const session = selectedSession.value
  if (!session || session.storeType !== 'drink') {
    return { size: [], sugar: [], ice: [] }
  }
  const current = currentSessions.value.drink
  return {
    size: current?.options?.sizeOptions || [],
    sugar: current?.options?.sugarOptions || [],
    ice: current?.options?.iceOptions || []
  }
})

onMounted(async () => {
  await loadSessions()
  await loadCurrentSessions()
})
</script>

<template>
  <div class="space-y-6">
    <section class="space-y-6">
    <div class="rounded-menu border border-cocoa/10 bg-paper/80 p-5 shadow-paper">
      <h2 class="font-display text-2xl text-cocoa">我的訂單</h2>
      <p class="mt-2 text-sm leading-relaxed text-ink/80">
        選擇場次即可查看歷史訂單，並可在開單期間修改或取消。
      </p>

      <div class="mt-5 rounded-menu border border-cocoa/10 bg-fog/60 p-4">
        <p class="text-xs font-semibold tracking-[0.24em] text-ink/55">USER</p>
        <div class="mt-3 flex flex-wrap items-center gap-3">
          <div class="text-sm font-semibold text-ink">
            {{ hasUserName ? `你好，${userName}` : '尚未設定姓名' }}
          </div>
          <div v-if="!hasUserName" class="flex flex-wrap items-center gap-2">
            <input
              v-model="nameInput"
              type="text"
              placeholder="輸入姓名"
              class="rounded-menu border border-cocoa/15 bg-paper/90 px-3 py-2 text-sm text-ink focus:border-cocoa/50 focus:outline-none"
            />
            <button
              type="button"
              class="rounded-menu bg-saffron px-4 py-2 text-sm font-bold text-cocoa shadow-paper"
              @click="saveName"
            >
              儲存
            </button>
          </div>
        </div>
      </div>

      <div class="mt-5 rounded-menu border border-cocoa/10 bg-paper/90 p-4">
        <p class="text-xs font-semibold tracking-[0.24em] text-ink/55">SESSION</p>
        <div class="mt-3 flex flex-wrap items-center gap-3">
          <select
            v-model="selectedSessionId"
            class="rounded-menu border border-cocoa/15 bg-paper px-3 py-2 text-sm text-ink"
            @change="loadOrders"
          >
            <option value="" disabled>選擇場次</option>
            <option v-for="session in sessions" :key="session.orderSessionId" :value="session.orderSessionId">
              {{ session.orderSessionId }} · {{ session.storeType.toUpperCase() }}
            </option>
          </select>
          <span class="text-xs text-ink/60">共 {{ sessions.length }} 個場次</span>
        </div>
      </div>

      <p v-if="errorMessage" class="mt-4 text-sm font-semibold text-cocoa">
        {{ errorMessage }}
      </p>
    </div>

    <div class="rounded-menu border border-cocoa/10 bg-paper/80 p-5 shadow-paper">
      <div class="flex items-center justify-between">
        <h3 class="font-display text-xl text-cocoa">訂單列表</h3>
        <span class="text-xs font-semibold tracking-[0.2em] text-ink/55">TOTAL</span>
      </div>
      <p class="mt-2 text-sm font-semibold text-cocoa">$ {{ totalAmount }}</p>

      <div v-if="orders.length === 0" class="mt-4 rounded-menu border border-cocoa/10 bg-fog/60 p-4">
        <p class="text-xs font-semibold tracking-[0.24em] text-ink/55">EMPTY</p>
        <p class="mt-2 text-sm font-semibold text-ink">尚無訂單</p>
      </div>

      <div v-else class="mt-4 space-y-3">
        <div
          v-for="order in orders"
          :key="order.orderId"
          class="rounded-menu border border-cocoa/10 bg-fog/60 p-4"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-sm font-semibold text-ink">{{ order.productName }}</p>
              <p class="mt-1 text-xs text-ink/60">
                {{ [order.size, order.sugar, order.ice].filter(Boolean).join(' / ') || order.note || '—' }}
              </p>
              <p class="mt-2 text-xs text-ink/60">{{ order.createdAt }}</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-semibold text-cocoa">$ {{ order.price }}</p>
              <p class="mt-1 text-xs text-ink/60">{{ order.status }}</p>
            </div>
          </div>
          <div class="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="rounded-menu border border-cocoa/20 px-3 py-1 text-xs font-semibold text-cocoa"
              @click="openEdit(order)"
            >
              修改
            </button>
            <button
              type="button"
              class="rounded-menu bg-cocoa px-3 py-1 text-xs font-semibold text-paper"
              @click="cancelOrder(order.orderId)"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
    </section>

    <Transition name="sheet">
      <div v-if="editOpen" class="fixed inset-0 z-50">
        <div class="absolute inset-0 bg-ink/30 backdrop-blur-sm" @click="closeEdit"></div>
        <div class="absolute inset-x-0 bottom-0">
          <div class="mx-auto max-w-[980px] rounded-t-[26px] border border-cocoa/10 bg-paper px-5 pb-8 pt-6 shadow-paper">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-xs font-semibold tracking-[0.24em] text-ink/55">EDIT</p>
                <h3 class="mt-2 font-display text-2xl text-cocoa">修改訂單</h3>
              </div>
              <button
                type="button"
                class="rounded-menu border border-cocoa/20 px-3 py-1 text-xs font-semibold text-cocoa"
                @click="closeEdit"
              >
                關閉
              </button>
            </div>

            <div v-if="selectedSession?.storeType === 'drink'" class="mt-5 space-y-4">
              <div>
                <p class="text-xs font-semibold tracking-[0.24em] text-ink/55">SIZE</p>
                <div class="mt-2 flex flex-wrap gap-2">
                  <button
                    v-for="option in optionSets.size"
                    :key="option"
                    type="button"
                    class="rounded-menu border border-cocoa/15 px-3 py-1 text-sm"
                    :class="editState.size === option ? 'bg-saffron text-cocoa' : 'bg-paper/90 text-ink'"
                    @click="editState.size = option"
                  >
                    {{ option }}
                  </button>
                </div>
              </div>
              <div>
                <p class="text-xs font-semibold tracking-[0.24em] text-ink/55">SUGAR</p>
                <div class="mt-2 flex flex-wrap gap-2">
                  <button
                    v-for="option in optionSets.sugar"
                    :key="option"
                    type="button"
                    class="rounded-menu border border-cocoa/15 px-3 py-1 text-sm"
                    :class="editState.sugar === option ? 'bg-saffron text-cocoa' : 'bg-paper/90 text-ink'"
                    @click="editState.sugar = option"
                  >
                    {{ option }}
                  </button>
                </div>
              </div>
              <div>
                <p class="text-xs font-semibold tracking-[0.24em] text-ink/55">ICE</p>
                <div class="mt-2 flex flex-wrap gap-2">
                  <button
                    v-for="option in optionSets.ice"
                    :key="option"
                    type="button"
                    class="rounded-menu border border-cocoa/15 px-3 py-1 text-sm"
                    :class="editState.ice === option ? 'bg-saffron text-cocoa' : 'bg-paper/90 text-ink'"
                    @click="editState.ice = option"
                  >
                    {{ option }}
                  </button>
                </div>
              </div>
            </div>

            <div class="mt-4">
              <p class="text-xs font-semibold tracking-[0.24em] text-ink/55">NOTE</p>
              <textarea
                v-model="editState.note"
                rows="3"
                :maxlength="noteLimit"
                class="mt-2 w-full rounded-menu border border-cocoa/15 bg-paper/90 p-3 text-sm text-ink focus:border-cocoa/40 focus:outline-none"
              ></textarea>
              <p class="mt-1 text-xs text-ink/60">剩餘 {{ remainingNote }} 字</p>
            </div>

            <div class="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                class="rounded-menu bg-saffron px-5 py-2 text-sm font-bold text-cocoa shadow-paper"
                @click="submitEdit"
              >
                更新訂單
              </button>
              <span class="text-xs font-semibold text-ink/70">{{ editStatus }}</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 220ms ease;
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}
</style>
