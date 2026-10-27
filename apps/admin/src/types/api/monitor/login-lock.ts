/** 登录锁定分页查询参数 */
export interface QueryParams extends PaginationParams {
  /** 登录账号 */
  username?: string
  /** 来源 IP */
  ip?: string
}

/** 登录锁定记录 */
export interface Item {
  /** 登录账号 */
  username: string
  /** 来源 IP */
  ip: string
  /** 窗口期内失败次数 */
  failCount: number
  /** 剩余可尝试次数 */
  remainingCount: number
  /** 剩余窗口秒数 */
  remainingSeconds: number
}
