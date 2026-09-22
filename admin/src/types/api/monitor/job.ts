/** 定时任务分页查询参数 */
export interface QueryParams extends PaginationParams {
  /** 任务名称 */
  jobName?: string
  /** 任务组名 */
  jobGroup?: string
  /** 任务状态 */
  status?: string
}

/** 定时任务信息 */
export interface Item {
  /** 任务编号 */
  id: string
  /** 任务名称 */
  jobName: string
  /** 任务组名 */
  jobGroup: string
  /** 调用目标字符串（格式：Service.method(参数)） */
  invokeTarget: string
  /** cron 执行表达式 */
  cronExpression: string
  /** 计划执行错误策略（1立即执行 2执行一次 3放弃执行） */
  misfirePolicy: string
  /** 是否并发执行（1允许 0禁止） */
  concurrent: string
  /** 任务状态（1正常 0暂停） */
  status: string
  /** 备注 */
  remark?: string
  /** 创建时间 */
  createTime: string
  /** 更新时间 */
  updateTime: string
}

/** 修改任务状态参数 */
export type ChangeStatusParams = Pick<Item, 'id' | 'status'>

/** 执行一次任务参数 */
export interface RunParams {
  /** 任务编号 */
  jobId: string
  /** 任务组名 */
  jobGroup: string
}
