import { createRouter, createWebHashHistory } from 'vue-router'

import OrderPage from '../pages/OrderPage.vue'
import MyOrdersPage from '../pages/MyOrdersPage.vue'
import StatsPage from '../pages/StatsPage.vue'
import AdminPage from '../pages/AdminPage.vue'

const routes = [
  {
    path: '/',
    redirect: '/order'
  },
  {
    path: '/order',
    name: 'order',
    component: OrderPage,
    meta: { title: '訂購' }
  },
  {
    path: '/orders',
    name: 'orders',
    component: MyOrdersPage,
    meta: { title: '我的訂單' }
  },
  {
    path: '/stats',
    name: 'stats',
    component: StatsPage,
    meta: { title: '統計' }
  },
  {
    path: '/admin',
    name: 'admin',
    component: AdminPage,
    meta: { title: '管理' }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/order'
  }
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

router.afterEach((to) => {
  const title = to?.meta?.title ? `${to.meta.title} | Office Order` : 'Office Order'
  document.title = title
})

export default router
