import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/FlowChartView/index.vue')
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/FlowChartView/index.vue')
    },
    {
      path: '/earth',
      name: 'earch',
      component: () => import('../views/Earth/index.vue')
    },
    {
      path: '/map',
      name: 'map',
      component: () => import('../views/Map/index.vue')
    },
  ]
})

export default router
