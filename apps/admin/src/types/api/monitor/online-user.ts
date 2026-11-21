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

/** 在线会话详情（列表字段 + 详情接口补充字段） */
export interface Detail extends Item {
  /** 真实姓名（用户未填写时为 '-'） */
  realname: string
  /** 所属部门名称（未分配部门时为 '-'） */
  deptName: string
  /** 角色名称组（仅正常状态角色） */
  roleNames: string[]
  /** 最近续签时间（本次会话未续签过则为 null） */
  refreshTime: string | null
  /** 最后活跃时间（按在线键剩余 TTL 反推） */
  lastActiveTime: string
  /** 客户端 UserAgent */
  userAgent: string
  /** 是否当前登录的会话 */
  isCurrentSession: boolean
}
