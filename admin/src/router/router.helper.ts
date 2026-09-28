import { isExternal } from '@/utils'
import type { Menu } from '@/types'
import { camelCase, upperFirst } from 'lodash-es'
import type { Component, DefineComponent } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import IframeView from '@/views/core/iframe/index.vue'

/** 根节点 parentId 约定值 */
const ROOT_PARENT_ID = '0'

/** 状态值约定：1 正常/显示，0 停用/隐藏（与服务端 CommonConstant 对齐） */
const STATUS_NORMAL = '1'
const STATUS_DISABLE = '0'

/** 预收集全部视图组件的懒加载器（vue3 动态路由不能用字符串拼接 import，必须先收集再按 key 匹配） */
const views = import.meta.glob('@/views/**/*.vue')

/**
 * 斜杠路径转大驼峰（system/user/index → SystemUser）
 * @param source 组件路径或路由地址
 */
function toPascalCase(source: string): string {
  return upperFirst(camelCase(source.replace(/index/, '')))
}

/**
 * 动态加载路由组件（组件 name 与路由 name 对齐，保证 tags-view 的 KeepAlive 生效）
 * @param componentPath 菜单表中存储的组件路径（如 system/user/index）
 */
export function loadView(componentPath: string): (() => Promise<DefineComponent>) | undefined {
  for (const path in views) {
    if (path.split('views/')[1].replace(/\.vue$/, '') !== componentPath) continue
    const component = views[path]
    return () =>
      component().then((module) => {
        const comp = (module as { default: DefineComponent }).default
        comp.name = toPascalCase(componentPath)
        return comp
      })
  }
  console.error(`动态路由组件不存在: src/views/${componentPath}.vue`)
}

/** 外链路由的 iframe 包装组件缓存（key 为原始外链地址，同名复用避免重复创建） */
const iframeComponents = new Map<string, Component>()

/** 已占用的 iframe 包装组件 name（保证路由 name 唯一） */
const usedIframeNames = new Set<string>()

let iframeNameSeq = 0

/**
 * 为外链路由生成与路由 name 同名的 iframe 包装组件
 * （KeepAlive 的 include 按组件 name 匹配而 cachedViews 存的是路由 name，两者对齐后
 * 外链页签才能命中缓存，切换页签不重载 iframe）
 * @param url 原始外链地址
 */
function loadIframeView(url: string): { name: string; component: Component } {
  const cached = iframeComponents.get(url)
  if (cached) return { name: (cached as DefineComponent).name!, component: cached }

  let name = `Iframe${toPascalCase(url)}`
  if (usedIframeNames.has(name)) name = `${name}_${++iframeNameSeq}`
  usedIframeNames.add(name)

  const component: Component = defineComponent({ name, setup: () => () => h(IframeView) })
  iframeComponents.set(url, component)
  return { name, component }
}

/**
 * 将后端扁平菜单列表递归生成动态路由表（目录不设 component，由 vue-router 跳过渲染子级）
 * 外链菜单（isExternal 命中，无论一级还是子级）统一转换为内部 iframe 路由：
 * 原始地址入 meta.link，打开方式入 meta.target，点击行为由侧边栏按 target 决定
 * @param menus 后端返回的路由菜单（已排除按钮与停用）
 * @param parentId 从根节点开始建树
 */
export function generateRoutes(menus: Menu.MenuItem[], parentId: string = ROOT_PARENT_ID): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = []
  for (const menu of menus) {
    if (menu.parentId !== parentId) continue

    const route = {} as RouteRecordRaw
    const externalUrl = isExternal(menu.path ?? '') ? menu.path! : undefined
    if (externalUrl) {
      const iframeRoute = loadIframeView(externalUrl)
      route.name = iframeRoute.name
      route.path = `/iframe/${encodeURIComponent(externalUrl)}`
      route.component = iframeRoute.component
    } else {
      route.name = toPascalCase(menu.component || menu.path || menu.id)
      route.path = parentId === ROOT_PARENT_ID ? `/${menu.path}` : menu.path!
    }
    // 顶级目录跳转时重定向到 404（与静态路由惯例一致，正常导航都走子菜单；外链已是实体路由无需重定向）
    route.redirect = parentId === ROOT_PARENT_ID && menu.menuType === 'M' && !externalUrl ? '/404' : undefined
    if (!externalUrl && menu.component) {
      const component = loadView(menu.component)
      if (component) route.component = component
    }
    route.meta = {
      title: menu.menuName ?? '',
      icon: menu.icon ?? undefined,
      hidden: menu.visible === STATUS_DISABLE,
      keepAlive: menu.isCache === STATUS_NORMAL,
      alwaysShow: menu.menuType === 'M' && !externalUrl,
      link: externalUrl,
      target: menu.target,
    }

    const children = generateRoutes(menus, menu.id)
    if (children.length > 0) route.children = children
    routes.push(route)
  }
  return routes
}

export function normalizePath(path: string): string {
  return path ? path.replace(/\/+/g, '/').replace(/\/$/, '') : path
}

export function resolvePath(routePath: string, basePath: string): string {
  // 根绝对路径（外链 iframe 路由）直接返回，避免被 basePath 拼接成错误地址
  if (routePath.startsWith('/')) return routePath
  return normalizePath(basePath + '/' + routePath)
}
