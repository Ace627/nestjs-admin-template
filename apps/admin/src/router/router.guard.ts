import { router } from '.'
import { RouterConstant } from './router.constant'
import { getAccessToken, toBoolean } from '@/utils'
import type { RouteLocationNormalized } from 'vue-router'

const whiteList = RouterConstant.PATH_WHITE_LIST // 白名单路由：无需登录即可访问

const NProgress = useProgress({ show: toBoolean(import.meta.env.VITE_ROUTER_NPROGRESS, true) })

export async function globalRouterBeforeGuard(to: RouteLocationNormalized, from: RouteLocationNormalized) {
  // 仅在启用进度条且不是同路由跳转时启动（避免重复触发）
  if (from.fullPath !== to.fullPath) NProgress.start()

  const accessToken = getAccessToken()
  const { LOGIN_PAGE_URL, LAYOUT_NAME } = RouterConstant

  // 已登录但要进入登录页 → 重定向到主页（必须先于白名单判断，否则会被 whiteList 提前放行）
  if (accessToken && to.path.toLowerCase() === LOGIN_PAGE_URL.toLowerCase()) return { path: '/', replace: true }

  // 如果在免登录的白名单中，直接放行
  if (whiteList.includes(to.path)) return true

  const userStore = useUserStore()
  const permissionStore = usePermissionStore()

  // 无 Token + 不在白名单 → 重定向到登录页（携带回跳地址）
  if (!accessToken) return { path: LOGIN_PAGE_URL, query: { redirect: to.fullPath } }

  try {
    // 已有角色权限，直接放行
    if (userStore.roles && userStore.roles.length > 0) return
    // 未获取用户信息 → 拉取信息并生成动态路由
    await userStore.getInfo()
    await permissionStore.getRoutes()
    // 添加动态路由
    for (const route of permissionStore.dynamicRouteList) router.addRoute(LAYOUT_NAME, route)
    // 动态路由添加后，重新导航到目标路由（replace: true 避免历史记录）
    return { ...to, replace: true }
  } catch (error: unknown) {
    console.error('路由守卫异常: ', error instanceof Error ? error.message : String(error))
    // 登录态已不可用：仅本地清理，不调登出接口；错误提示由请求拦截器统一弹出，这里不重复弹
    await userStore.logout()
    return { path: LOGIN_PAGE_URL, query: { redirect: to.fullPath }, replace: true }
  }
}

export async function globalRouterAfterGuard() {
  NProgress.done()
}
