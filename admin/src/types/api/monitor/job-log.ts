/** 定时任务日志分页查询参数 */
export interface QueryParams extends PaginationParams {
  /** 任务名称 */
  jobName?: string
  /** 任务组名 */
  jobGroup?: string
  /** 执行状态 */
  status?: string
}

/** 定时任务日志信息 */
export interface Item {
  /** 任务日志编号 */
  id: string
  /** 任务名称 */
  jobName: string
  /** 任务组名 */
  jobGroup: string
  /** 调用目标字符串 */
  invokeTarget: string
  /** 日志信息 */
  jobMessage: string
  /** 执行状态（1正常 0失败） */
  status: string
  /** 执行时间 */
  createTime: string
}
