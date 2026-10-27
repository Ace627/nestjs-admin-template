import { getSidebarStatus, setSidebarStatus } from '@/utils'

export const useAppStore = defineStore('app', () => {
  /** 是否折叠菜单 */
  const isCollapse = ref<boolean>(getSidebarStatus())
  /** 是否移除侧栏和主容器的过渡效果 */
  const withoutAnimation = ref<boolean>(false)
  /** 设备类型 */
  const device = ref<'desktop' | 'mobile'>('desktop')

  /** 面包屑开关菜单栏的回调 */
  function toggleSidebar(): void {
    withoutAnimation.value = false
    isCollapse.value = !isCollapse.value
    setSidebarStatus(isCollapse.value)
  }

  /** 关闭侧边栏（主要用于移动端状态下） */
  function closeSidebar(hasAnimation: boolean = false): void {
    isCollapse.value = true
    setSidebarStatus(isCollapse.value)
    withoutAnimation.value = hasAnimation
  }

  /** 展开侧边栏（主要用于从移动端切回桌面端时恢复展开状态） */
  function openSidebar() {
    isCollapse.value = false
    setSidebarStatus(isCollapse.value)
    withoutAnimation.value = true
  }

  const isMobile = computed(() => device.value === 'mobile')
  const isDesktop = computed(() => device.value === 'desktop')

  return { device, isCollapse, isMobile, isDesktop, withoutAnimation, openSidebar, closeSidebar, toggleSidebar }
})
