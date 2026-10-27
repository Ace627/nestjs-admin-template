/**
 * BullMQ 常量对象
 * @description 统一管理 BullMQ 队列名、Worker 事件名与定时任务错失策略常量，便于维护与排查
 */
export const BullConstant = {
  /**
   * 定时任务队列名
   * @description BullMQ 队列的唯一标识，JobModule 注册队列与 JobProcessor 消费队列时使用
   */
  QUEUE_NAME: 'job',

  /**
   * Worker 事件：任务执行成功
   * @description 对应 BullMQ 的 completed 事件，配合 @OnWorkerEvent 监听
   */
  JOB_COMPLETED: 'completed',

  /**
   * Worker 事件：任务执行失败
   * @description 对应 BullMQ 的 failed 事件，配合 @OnWorkerEvent 监听
   */
  JOB_FAILED: 'failed',

  /**
   * 计划执行错误策略：立即执行（misfirePolicy = '1'）
   * @description 服务启动清理失败任务时，命中该策略的任务立即补执行
   */
  MISFIRE_POLICY_IMMEDIATE: '1',

  /**
   * 计划执行错误策略：执行一次（misfirePolicy = '2'）
   * @description 服务启动清理失败任务时，命中该策略的任务补执行一次（去重后）
   */
  MISFIRE_POLICY_ONCE: '2',

  /**
   * 计划执行错误策略：放弃执行（misfirePolicy = '3'）
   * @description 服务启动清理失败任务时，命中该策略的任务不补执行，仅清理错误记录
   */
  MISFIRE_POLICY_DISCARD: '3',
} as const
