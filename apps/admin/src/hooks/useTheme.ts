/**
 * 主题切换 hook
 * 统一导航栏 ThemeSwitch 与设置页的主题切换逻辑：
 * - 命令式同步 <html>.dark 类（不在 store 加 watch，避免与多入口竞争）
 * - View Transition 圆形扩散动效，与 Element Plus 官网同款：JS 仅注入圆心与半径的百分比 CSS 变量并用
 *   data-theme-transition 标记方向，动画本体由全局样式的 keyframes 纯 CSS 驱动，跨浏览器表现稳定
 * - 非 Chromium 浏览器（无 startViewTransition）或系统偏好减少动效时，自动降级为直接切换
 */
export function useTheme() {
  const settingStore = useSettingStore()

  // 防 FOUC：首次进入若已是 dark，确保 html 有 dark 类（幂等，调用多次无害）
  if (settingStore.isDark) document.documentElement.classList.add('dark')

  /** 最近一次切换动效的序号：快速连续切换时仅让最后一次 transition 的清理生效，避免旧动画清掉新动画的变量 */
  let latestTransitionId = 0

  /**
   * 应用主题：同步切换 dark 类、数据层与持久化，并从触发点播放圆形扩散
   *
   * @param theme 目标主题
   * @param event 触发切换的鼠标事件，用于确定扩散圆心；缺省时从屏幕中心扩散
   */
  function apply(theme: 'light' | 'dark', event?: MouseEvent) {
    const root = document.documentElement
    const nextDark = theme === 'dark'
    if (root.classList.contains('dark') === nextDark) return

    // 降级：不支持 View Transitions 或用户偏好减少动效时直接切换，不动画
    const isAppearanceTransition =
      typeof document.startViewTransition === 'function' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!isAppearanceTransition) {
      settingStore.theme = theme
      root.classList.toggle('dark', nextDark)
      settingStore.saveSetting({ showTip: false })
      return
    }

    const x = event?.clientX ?? window.innerWidth / 2
    const y = event?.clientY ?? window.innerHeight / 2
    const endRadius = Math.hypot(Math.max(x, 0, window.innerWidth - x), Math.max(y, 0, window.innerHeight - y))

    // 与 Element Plus 官网一致：圆心与半径均归一化为百分比，动画 keyframes 依赖这三个变量与方向标记
    const ratioX = (100 * x) / window.innerWidth
    const ratioY = (100 * y) / window.innerHeight
    const ratioR = (100 * endRadius) / (Math.hypot(window.innerWidth, window.innerHeight) / Math.SQRT2)

    const transitionId = ++latestTransitionId
    root.dataset.themeTransition = nextDark ? 'to-dark' : 'to-light'
    root.style.setProperty('--theme-transition-x', `${ratioX}%`)
    root.style.setProperty('--theme-transition-y', `${ratioY}%`)
    root.style.setProperty('--theme-transition-radius', `${ratioR}%`)

    // 先更新数据层再切视觉类；且必须在主题值已更新后持久化，否则会保存成旧主题
    const transition = document.startViewTransition(() => {
      settingStore.theme = theme
      root.classList.toggle('dark', nextDark)
      settingStore.saveSetting({ showTip: false })
    })

    transition.finished.finally(() => {
      if (transitionId !== latestTransitionId) return
      delete root.dataset.themeTransition
      root.style.removeProperty('--theme-transition-x')
      root.style.removeProperty('--theme-transition-y')
      root.style.removeProperty('--theme-transition-radius')
    })
  }

  /** 取反切换（导航栏 ThemeSwitch 用，传 event 做从点击点扩散） */
  function toggle(event?: MouseEvent) {
    apply(settingStore.isDark ? 'light' : 'dark', event)
  }

  return { apply, toggle }
}
