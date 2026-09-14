/**
 * Redis 命令统计信息接口
 * 用于约束【Redis命令执行统计数据】的格式（监控、统计场景使用）
 */
export interface CommandStat {
  /** Redis 指令名称（例如：get、set、del、setnx 等你缓存锁用到的命令） */
  name: string
  /** 命令对应的统计数值（例如：执行次数、耗时、调用量等数字指标） */
  value: number
}
