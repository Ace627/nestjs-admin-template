/** 操作日志分页查询参数 */
export interface QueryParams extends PaginationParams {
  /** 操作地址 */
  ip?: string
  /** 系统模块 */
  title?: string
  /** 操作人员 */
  username?: string
  /** 类型 */
  businessType?: number
  /** 状态 */
  status?: string
}

/** 操作日志信息 */
export interface Item {
  /** 主键ID */
  id: string
  /** 系统模块 */
  title: string
  /** 操作人员 */
  username: string
  /** 方法名称 */
  method: string
  /** 请求方法 */
  requestMethod: string
  /** 请求参数 */
  params: string
  /** 请求URL */
  url: string
  /** 请求IP */
  ip: string
  /** 请求位置 */
  location: string
  /** 类型 */
  businessType: number
  /** 状态 */
  status: string
  /** 操作时间 */
  operTime: string
  /** 操作耗时 */
  duration: number
  /** 请求ID */
  requestId: string
}
