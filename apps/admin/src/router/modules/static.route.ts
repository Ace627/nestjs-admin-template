import Layout from '@/layout/index.vue'
import type { RouteRecordRaw } from 'vue-router'
import { RouterConstant } from '../router.constant'

export const STATIC_ROUTE_LIST: RouteRecordRaw[] = [
  {
    name: RouterConstant.LAYOUT_NAME, // 布局路由配置 确保可以显示布局框架
    path: '',
    component: Layout,
    redirect: RouterConstant.HOME_PAGE_URL,
    children: [{ name: RouterConstant.HOME_PAGE_NAME, path: 'dashboard', component: () => import('@/views/dashboard/index.vue'), meta: { title: '首页', icon: 'Home', affix: true } }],
  },

  {
    name: RouterConstant.LOGIN_PAGE_NAME,
    path: RouterConstant.LOGIN_PAGE_URL,
    component: () => import('@/views/core/login.vue'),
    meta: { title: '登录', hidden: true },
  },

  {
    path: '/user/profile',
    component: Layout,
    meta: { hidden: true },
    children: [{ path: '', component: () => import('@/views/system/user/profile/index.vue'), name: 'Profile', meta: { title: '个人中心', icon: 'User' } }],
  },
  {
    path: '/monitor/job/log',
    component: Layout,
    meta: { hidden: true },
    children: [{ path: '', name: 'Joblog', component: () => import('@/views/monitor/job/log.vue'), meta: { title: '调度日志', icon: 'Log', activeMenu: '/monitor/job' } }],
  },

  {
    path: RouterConstant.REDIRECT_PAGE_URL,
    name: RouterConstant.REDIRECT_PAGE_NAME,
    component: Layout,
    meta: { hidden: true },
    children: [{ path: '/redirect/:path(.*)', component: () => import('@/views/core/redirect.vue') }],
  },

  {
    path: '/:pathMatch(.*)*', // 404页面（必须放在最后）
    component: () => import('@/views/core/404.vue'),
    meta: { hidden: true },
  },
]
