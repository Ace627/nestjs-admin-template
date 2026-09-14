/** 缓存监控 - 缓存分类信息 */
export interface Name {
  /** 缓存分类前缀（Redis key 前缀，如 CACHE:CAPTCHA_KEY:） */
  prefix: string
  /** 分类备注（如：验证码 / 用户信息 / 数据字典） */
  remark: string
}

/** 缓存列表 - 缓存内容（getValue 响应） */
export interface Detail {
  /** 缓存分类前缀（如 token:access） */
  name: string
  /** 完整缓存键名 */
  key: string
  /** 缓存值（键不存在时为 null） */
  value: string | null
  /** 剩余过期时间（秒）；-1=永不过期，-2=键不存在 */
  ttl: number
}

/** 缓存监控 - Redis 服务器信息 */
export interface Redis {
  /** 已连接的客户端数量 */
  connected_clients: number
  /** Redis 服务器运行模式：standalone=单机，sentinel=哨兵，cluster=集群 */
  redis_mode: 'standalone' | 'sentinel' | 'cluster'
  /** Redis 服务器版本号 */
  redis_version: string
  /** Redis 监听的 TCP 端口号 */
  tcp_port: number
  /** Redis 服务器已运行的天数 */
  uptime_in_days: number
  /** Redis 当前使用的内存大小，人类可读格式（如：718.46K） */
  used_memory_human: string
  /** AOF（Append Only File）持久化是否启用：0=禁用，1=启用 */
  aof_enabled: number
  /** 实时输入流量（KB/秒） */
  instantaneous_input_kbps: number
  /** 实时输出流量（KB/秒），表示 Redis 服务器当前时刻的输出带宽 */
  instantaneous_output_kbps: number
  /** 用户空间子进程 CPU 使用时间（秒），表示 Redis 子进程在用户模式下消耗的 CPU 时间 */
  used_cpu_user_children: number
  /** RDB 最近一次后台保存状态，可能的值为 "ok" 或 "err" */
  rdb_last_bgsave_status: 'ok' | 'err'
  /** 最大内存限制（字节），0 表示没有内存限制 */
  maxmemory: number
  /** 最大内存限制（人类可读格式） */
  maxmemory_human: string
  /** 系统总内存（字节） */
  total_system_memory: number
  /** 系统总内存（人类可读格式） */
  total_system_memory_human: string
  /** Redis 当前使用的内存大小（字节） */
  used_memory: number
  /** Redis 主进程在用户模式下累计消耗的 CPU 时间（秒） */
  used_cpu_user: number
}

/** 缓存监控 - 聚合信息 */
export interface Info {
  /** 当前 Redis 数据库 key 总数 */
  dbsize: number
  /** Redis 服务器信息 */
  info: Redis
  /** 命令调用统计（name=命令名，value=调用次数） */
  commandstats: { name: string; value: number }[]
}
