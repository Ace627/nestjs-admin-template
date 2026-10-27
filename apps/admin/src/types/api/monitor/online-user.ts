/** 在线用户分页查询参数 */
export interface QueryParams extends PaginationParams {
  /** 登录地址 */
  ip?: string
  /** 登录账号 */
  username?: string
}

/** 在线用户信息 */
export interface Item {
  /** 用户ID */
  userId: string
  /** 登录IP */
  ip: string
  /** 登录位置 */
  location: string
  /** 登录账号 */
  username: string
  /** 登录浏览器 */
  browser: string
  /** 登录操作系统 */
  os: string
  /** 登录时间 */
  loginTime: string
  /** 登录设备标识 */
  uuid: string
}
