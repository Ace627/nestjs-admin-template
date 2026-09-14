/** 近 7 天登录趋势项 */
export interface LoginTrendItem {
  /** 日期（YYYY-MM-DD） */
  date: string
  /** 登录成功次数 */
  successCount: number
  /** 登录失败次数 */
  failCount: number
}

/** 近 7 天操作日志趋势项 */
export interface OperTrendItem {
  /** 日期（YYYY-MM-DD） */
  date: string
  /** 操作次数 */
  count: number
}

/** 首页统计数据 */
export interface Statistics {
  /** 用户总数 */
  userCount: number
  /** 角色总数 */
  roleCount: number
  /** 在线用户数 */
  onlineCount: number
  /** 今日登录成功次数 */
  todayLoginCount: number
  /** 近 7 天登录趋势 */
  loginTrend: LoginTrendItem[]
  /** 近 7 天操作日志趋势 */
  operTrend: OperTrendItem[]
}
