<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { apiConfigured, apiGet, apiPost } from '../services/api'

const userName = ref(localStorage.getItem('officeOrderUser') || '')
const nameInput = ref(userName.value)
const sessions = ref({ drink: null, meal: null })
const activeType = ref('drink')
const products = ref([])
const loadingSessions = ref(false)
const loadingProducts = ref(false)
const errorMessage = ref('')
const sheetOpen = ref(false)
const selectedProduct = ref(null)
const formState = reactive({
  size: '',
  sugar: '',
  ice: '',
  note: ''
})
const submitStatus = ref('')

const hasUserName = computed(() => userName.value.length > 0)
const activeSession = computed(() => sessions.value[activeType.value] || null)
const syncing = computed(() => loadingSessions.value || loadingProducts.value)
const noteLimit = computed(() => 15)
const remainingNote = computed(() => noteLimit.value - formState.note.length)

const mockSessions = {
  drink: {
    orderSessionId: 'OS20260128001',
    storeId: 'S001',
    storeName: '暖心飲品',
    storeType: 'drink',
    status: 'open',
    options: {
      sizeOptions: ['大杯', '中杯', '小杯'],
      sugarOptions: ['正常', '半糖', '三分糖', '一分糖', '無糖'],
      iceOptions: ['正常冰', '少冰', '微冰', '去冰', '溫', '熱']
    }
  },
  meal: {
    orderSessionId: 'OS20260128002',
    storeId: 'M001',
    storeName: '午餐食堂',
    storeType: 'meal',
    status: 'open'
  }
}

const mockProducts = {
  drink: [
    {
      productId: 'P001',
      productName: '焙茶拿鐵',
      price: 65,
      category: '拿鐵',
      hasSizeOption: true,
      hasSugarOption: true,
      hasIceOption: true,
      allowNote: false
    },
    {
      productId: 'P002',
      productName: '桂花青茶',
      price: 55,
      category: '茶類',
      hasSizeOption: true,
      hasSugarOption: true,
      hasIceOption: true,
      allowNote: false
    }
  ],
  meal: [
    {
      productId: 'M001',
      productName: '香煎雞腿便當',
      price: 110,
      category: '便當',
      hasSizeOption: false,
      hasSugarOption: false,
      hasIceOption: false,
      allowNote: true
    }
  ]
}

const displayProducts = computed(() => products.value)

function saveName() {
  const trimmed = nameInput.value.trim()
  if (!trimmed) {
    return
  }
  userName.value = trimmed
  localStorage.setItem('officeOrderUser', trimmed)
}

function selectType(type) {
  if (!sessions.value[type]) {
    return
  }
  activeType.value = type
}

function openSheet(product) {
  selectedProduct.value = product
  formState.size = ''
  formState.sugar = ''
  formState.ice = ''
  formState.note = ''
  submitStatus.value = ''
  sheetOpen.value = true
}

function closeSheet() {
  sheetOpen.value = false
  selectedProduct.value = null
}

function pickOption(key, value) {
  formState[key] = value
}

async function loadSessions() {
  loadingSessions.value = true
  errorMessage.value = ''
  try {
    if (!apiConfigured) {
      sessions.value = mockSessions
      return
    }
    const response = await apiGet('getCurrentOrders')
    if (!response || !response.success) {
      throw new Error(response?.error?.message || 'Failed to load sessions.')
    }
    sessions.value = {
      drink: response.data?.drink || null,
      meal: response.data?.meal || null
    }
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loadingSessions.value = false
  }
}

async function loadProducts() {
  const session = activeSession.value
  if (!session) {
    products.value = []
    return
  }

  if (!apiConfigured) {
    products.value = mockProducts[session.storeType] || []
    return
  }

  loadingProducts.value = true
  products.value = []
  errorMessage.value = ''
  try {
    const response = await apiGet('getProducts', { storeId: session.storeId })
    if (!response || !response.success) {
      throw new Error(response?.error?.message || 'Failed to load products.')
    }
    products.value = response.data || []
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loadingProducts.value = false
  }
}

async function submitOrder() {
  const session = activeSession.value
  const product = selectedProduct.value
  if (!session || !product) {
    return
  }

  if (product.hasSizeOption && !formState.size) {
    submitStatus.value = '請先選擇大小杯'
    return
  }
  if (product.hasSugarOption && !formState.sugar) {
    submitStatus.value = '請先選擇甜度'
    return
  }
  if (product.hasIceOption && !formState.ice) {
    submitStatus.value = '請先選擇冰塊'
    return
  }
  if (product.allowNote && formState.note.length > noteLimit.value) {
    submitStatus.value = '備註字數超過上限'
    return
  }

  if (!apiConfigured) {
    submitStatus.value = '已建立示意訂單（尚未送出）'
    return
  }

  submitStatus.value = '送出中...'
  const response = await apiPost('submitOrder', {
    userName: userName.value,
    orderSessionId: session.orderSessionId,
    storeType: session.storeType,
    productId: product.productId,
    size: formState.size,
    sugar: formState.sugar,
    ice: formState.ice,
    note: formState.note
  })

  if (response && response.success) {
    submitStatus.value = '訂單送出成功'
    closeSheet()
    return
  }

  submitStatus.value = response?.error?.message || '送出失敗，請稍後再試'
}

watch(activeType, () => {
  loadProducts()
})

watch(sessions, () => {
  if (sessions.value.drink) {
    activeType.value = 'drink'
  } else if (sessions.value.meal) {
    activeType.value = 'meal'
  }
  loadProducts()
})

onMounted(async () => {
  await loadSessions()
})
</script>

<template>
  <div class="space-y-6">
    <section class="space-y-6">
    <div class="rounded-menu border border-cocoa/10 bg-paper/80 p-5 shadow-paper">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 class="font-display text-2xl text-cocoa">訂購</h2>
          <p class="mt-2 text-sm leading-relaxed text-ink/80">
            今日場次會顯示飲料與便當，請先選擇你要下單的店家。
          </p>
        </div>
        <div class="rounded-menu border border-cocoa/10 bg-fog/70 px-4 py-3 text-xs text-ink/65">
          <div class="font-semibold tracking-[0.24em] text-ink/60">STATUS</div>
          <p class="mt-2 font-semibold text-ink">
            <span v-if="syncing" class="inline-flex items-center gap-2">
              <span class="h-3.5 w-3.5 rounded-full border-2 border-cocoa/25 border-t-cocoa animate-spin"></span>
              同步中
            </span>
            <span v-else>已同步</span>
          </p>
          <p class="mt-1 text-[11px] text-ink/60">
            {{ apiConfigured ? 'GAS API' : '本機示意' }}
          </p>
        </div>
      </div>

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

      <div class="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          class="rounded-menu border border-cocoa/10 bg-paper/90 p-4 text-left transition"
          :class="[
            sessions.drink ? 'hover:bg-fog/70' : 'opacity-50',
            activeType === 'drink' ? 'ring-2 ring-saffron/70' : ''
          ]"
          @click="selectType('drink')"
        >
          <p class="text-xs font-semibold tracking-[0.24em] text-ink/55">DRINK</p>
          <p class="mt-2 text-sm font-semibold text-ink">
            {{ sessions.drink?.storeName || '未開放' }}
          </p>
          <p class="mt-1 text-xs text-ink/60">
            {{ sessions.drink?.status === 'open' ? '開放中' : '已關閉' }}
          </p>
        </button>
        <button
          type="button"
          class="rounded-menu border border-cocoa/10 bg-paper/90 p-4 text-left transition"
          :class="[
            sessions.meal ? 'hover:bg-fog/70' : 'opacity-50',
            activeType === 'meal' ? 'ring-2 ring-saffron/70' : ''
          ]"
          @click="selectType('meal')"
        >
          <p class="text-xs font-semibold tracking-[0.24em] text-ink/55">MEAL</p>
          <p class="mt-2 text-sm font-semibold text-ink">
            {{ sessions.meal?.storeName || '未開放' }}
          </p>
          <p class="mt-1 text-xs text-ink/60">
            {{ sessions.meal?.status === 'open' ? '開放中' : '已關閉' }}
          </p>
        </button>
      </div>

      <p v-if="errorMessage" class="mt-4 text-sm font-semibold text-cocoa">
        {{ errorMessage }}
      </p>
    </div>

    <div class="rounded-menu border border-cocoa/10 bg-paper/80 p-5 shadow-paper">
      <div class="flex items-center justify-between">
        <h3 class="font-display text-xl text-cocoa">今日菜單</h3>
        <span class="text-xs font-semibold tracking-[0.2em] text-ink/55">
          {{ activeSession?.storeName || '尚未選擇' }}
        </span>
      </div>

      <div v-if="syncing && apiConfigured" class="mt-4 rounded-menu border border-cocoa/10 bg-fog/60 p-4">
        <p class="text-xs font-semibold tracking-[0.24em] text-ink/55">SYNC</p>
        <div class="mt-3 flex items-start gap-3">
          <span class="mt-0.5 h-4 w-4 rounded-full border-2 border-cocoa/25 border-t-cocoa animate-spin"></span>
          <div>
            <p class="text-sm font-semibold text-ink">同步中，菜單載入中</p>
            <p class="mt-1 text-xs text-ink/60">菜單尚未出現通常是因為伺服器還在回應，請稍等一下。</p>
          </div>
        </div>
      </div>

      <div v-else-if="displayProducts.length === 0" class="mt-4 rounded-menu border border-cocoa/10 bg-fog/60 p-4">
        <p class="text-xs font-semibold tracking-[0.24em] text-ink/55">EMPTY</p>
        <p class="mt-2 text-sm font-semibold text-ink">目前沒有菜單</p>
        <p class="mt-1 text-xs text-ink/60">請稍後再查看或切換場次。</p>
      </div>

      <div v-else class="mt-4 grid gap-4 sm:grid-cols-2">
        <button
          v-for="product in displayProducts"
          :key="product.productId"
          type="button"
          class="group rounded-menu border border-cocoa/10 bg-fog/60 p-4 text-left transition hover:-translate-y-0.5 hover:bg-saffron/10"
          @click="openSheet(product)"
        >
          <p class="text-xs font-semibold tracking-[0.24em] text-ink/55">{{ product.category || 'MENU' }}</p>
          <p class="mt-2 text-lg font-semibold text-ink">{{ product.productName }}</p>
          <p class="mt-2 text-sm font-semibold text-cocoa">$ {{ product.price }}</p>
          <p class="mt-2 text-xs text-ink/60">
            {{ product.allowNote ? '可填備註' : '無備註' }}
          </p>
        </button>
      </div>
    </div>
    </section>

    <Transition name="sheet">
      <div v-if="sheetOpen" class="fixed inset-0 z-50">
        <div class="absolute inset-0 bg-ink/30 backdrop-blur-sm" @click="closeSheet"></div>
        <div class="absolute inset-x-0 bottom-0">
          <div class="mx-auto max-w-[980px] rounded-t-[26px] border border-cocoa/10 bg-paper px-5 pb-8 pt-6 shadow-paper">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-xs font-semibold tracking-[0.24em] text-ink/55">ORDER</p>
                <h3 class="mt-2 font-display text-2xl text-cocoa">{{ selectedProduct?.productName }}</h3>
                <p class="mt-2 text-sm text-ink/70">{{ activeSession?.storeName }}</p>
              </div>
              <button
                type="button"
                class="rounded-menu border border-cocoa/20 px-3 py-1 text-xs font-semibold text-cocoa"
                @click="closeSheet"
              >
                關閉
              </button>
            </div>

            <div v-if="selectedProduct?.hasSizeOption" class="mt-5">
              <p class="text-xs font-semibold tracking-[0.24em] text-ink/55">SIZE</p>
              <div class="mt-2 flex flex-wrap gap-2">
                <button
                  v-for="option in activeSession?.options?.sizeOptions || []"
                  :key="option"
                  type="button"
                  class="rounded-menu border border-cocoa/15 px-3 py-1 text-sm"
                  :class="formState.size === option ? 'bg-saffron text-cocoa' : 'bg-paper/90 text-ink'"
                  @click="pickOption('size', option)"
                >
                  {{ option }}
                </button>
              </div>
            </div>

            <div v-if="selectedProduct?.hasSugarOption" class="mt-4">
              <p class="text-xs font-semibold tracking-[0.24em] text-ink/55">SUGAR</p>
              <div class="mt-2 flex flex-wrap gap-2">
                <button
                  v-for="option in activeSession?.options?.sugarOptions || []"
                  :key="option"
                  type="button"
                  class="rounded-menu border border-cocoa/15 px-3 py-1 text-sm"
                  :class="formState.sugar === option ? 'bg-saffron text-cocoa' : 'bg-paper/90 text-ink'"
                  @click="pickOption('sugar', option)"
                >
                  {{ option }}
                </button>
              </div>
            </div>

            <div v-if="selectedProduct?.hasIceOption" class="mt-4">
              <p class="text-xs font-semibold tracking-[0.24em] text-ink/55">ICE</p>
              <div class="mt-2 flex flex-wrap gap-2">
                <button
                  v-for="option in activeSession?.options?.iceOptions || []"
                  :key="option"
                  type="button"
                  class="rounded-menu border border-cocoa/15 px-3 py-1 text-sm"
                  :class="formState.ice === option ? 'bg-saffron text-cocoa' : 'bg-paper/90 text-ink'"
                  @click="pickOption('ice', option)"
                >
                  {{ option }}
                </button>
              </div>
            </div>

            <div v-if="selectedProduct?.allowNote" class="mt-4">
              <p class="text-xs font-semibold tracking-[0.24em] text-ink/55">NOTE</p>
              <textarea
                v-model="formState.note"
                rows="3"
                :maxlength="noteLimit"
                placeholder="備註（可選）"
                class="mt-2 w-full rounded-menu border border-cocoa/15 bg-paper/90 p-3 text-sm text-ink focus:border-cocoa/40 focus:outline-none"
              ></textarea>
              <p class="mt-1 text-xs text-ink/60">剩餘 {{ remainingNote }} 字</p>
            </div>

            <div class="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                class="rounded-menu bg-saffron px-5 py-2 text-sm font-bold text-cocoa shadow-paper"
                @click="submitOrder"
              >
                送出訂單
              </button>
              <span class="text-xs font-semibold text-ink/70">{{ submitStatus }}</span>
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
