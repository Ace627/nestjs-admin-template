import { router } from '.'
import { getAccessToken, toBoolean } from '@/utils'
import type { RouteLocationNormalized } from 'vue-router'

const whiteList = ['/login'] // 白名单路由：无需登录即可访问

const NProgress = useProgress({ show: toBoolean(import.meta.env.VITE_ROUTER_NPROGRESS, true) })

export async function globalRouterBeforeGuard(to: RouteLocationNormalized, from: RouteLocationNormalized) {
  // 仅在启用进度条且不是同路由跳转时启动（避免重复触发）
  if (from.fullPath !== to.fullPath) NProgress.start()
  // 如果在免登录的白名单中，直接放行
  if (whiteList.includes(to.path)) return true

  const userStore = useUserStore()
  const accessToken = getAccessToken()
  const permissionStore = usePermissionStore()

  // 已登录但要进入登录页 → 重定向到主页（把「已登录访问登录页」的逻辑提到最前面（避免被白名单拦截））
  if (accessToken && to.path.toLowerCase() === '/login') return { path: '/', replace: true }

  // 无 Token + 不在白名单 → 重定向到登录页（携带回跳地址）
  if (!accessToken) return { path: '/login', query: { redirect: to.fullPath } }

  try {
    // 已有角色权限，直接放行
    if (userStore.roles && userStore.roles.length > 0) return
    // 未获取用户信息 → 拉取信息并生成动态路由
    await userStore.getInfo()
    await permissionStore.getRoutes()
    // 添加动态路由
    for (const route of permissionStore.dynamicRouteList) router.addRoute('Layout', route)
    // 动态路由添加后，重新导航到目标路由（replace: true 避免历史记录）
    return { ...to, replace: true }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error('路由守卫异常: ', errMsg)
    // 登录态已不可用：仅本地清理，不调登出接口；错误提示由请求拦截器统一弹出，这里不重复弹
    await userStore.logout()
    return { path: '/login', query: { redirect: to.fullPath }, replace: true }
  }
}

export async function globalRouterAfterGuard() {
  NProgress.done()
}
