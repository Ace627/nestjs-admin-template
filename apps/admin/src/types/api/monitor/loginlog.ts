/** 登录日志分页查询参数 */
export interface QueryParams extends PaginationParams {
  /** IP地址 */
  ip?: string
  /** 登录账号 */
  username?: string
  /** 登录地点 */
  location?: string
  /** 登录状态 */
  status?: string
}

/** 登录日志信息 */
export interface Item {
  /** 登录日志编号 */
  id: string
  /** 登录账号 */
  username: string
  /** 用户ID */
  userId: string | null
  /** 登录地点 */
  location: string
  /** 登录状态 */
  status: string
  /** 浏览器 */
  browser: string
  /** 操作系统 */
  os: string
  /** 访问时间 */
  accessTime: string
  /** 登录IP */
  ip: string
  /** 登录消息 */
  message: string
  /** 请求ID */
  requestId: string
  /** 浏览器 User Agent */
  userAgent: string
}
