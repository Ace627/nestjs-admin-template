import { merge } from 'lodash-es'
import NProgress from 'nprogress'
import type { NProgressOptions } from 'nprogress'

interface ProgressConfig extends NProgressOptions {
  show: boolean
}

const DEFAULT_CONFIG: Partial<ProgressConfig> = {
  /** CSS3 缓冲动画字符串 如 ease、linear、ease-in、ease-out、ease-in-out、cubic-bezier 等 */
  easing: 'ease',
  /** 指定进度条的父容器 */
  parent: 'body',
  /** 自定义配置 方便利用环境变量统一控制加载条的显示与否 */
  show: true,
  /** 是否显示右侧的环形进度动画 */
  showSpinner: false,
  /** 是否开启自动递增 */
  trickle: true,
  /** 设置开始时最低百分比 */
  minimum: 0.08,
  /** 动画速度 单位 ms */
  speed: 200,
}

/**
 * 进度条控制工具
 * @param config 自定义配置（会和默认配置合并）
 * @returns 启动/结束进度条方法
 */
export function useProgress(config: Partial<ProgressConfig> = {}) {
  const mergeConfig = merge({}, DEFAULT_CONFIG, config)
  NProgress.configure(mergeConfig)

  function start() {
    if (!mergeConfig.show) return
    NProgress.start()
  }

  function done() {
    if (!mergeConfig.show || !NProgress.isStarted()) return
    NProgress.done()
  }

  return { start, done }
}
