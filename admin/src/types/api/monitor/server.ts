/** 服务器监控 - CPU 信息 */
export interface Cpu {
  /** CPU 核心数 */
  cores: number
  /** 用户使用率 */
  used: string
  /** 系统使用率 */
  system: string
  /** 当前空闲率 */
  free: string
}

/** 服务器监控 - 内存信息 */
export interface Memory {
  /** 总内存 */
  total: string
  /** 已用内存 */
  used: string
  /** 剩余内存 */
  free: string
  /** 使用率 */
  usage: string
}

/** 服务器监控 - 基础信息 */
export interface Base {
  /** 服务器 IP */
  ip: string
  /** 服务器名称 */
  hostname: string
  /** 操作系统 */
  platform: string
  /** 系统架构 */
  arch: string
}

/** 服务器监控 - 磁盘信息 */
export interface Disk {
  /** 盘符路径 */
  fs: string
  /** 挂载点 */
  mount: string
  /** 盘符类型 */
  type: string
  /** 总大小 */
  total: string
  /** 已用大小 */
  used: string
  /** 可用大小 */
  free: string
  /** 已用百分比 */
  usage: string
}

/** 服务器监控 - 数据库连接池状态 */
export interface Pool {
  /** 当前已建立连接数 */
  current: number
  /** 正在执行 SQL 的连接数 */
  running: number
  /** 历史峰值连接数 */
  maxUsed: number
  /** 连接上限 */
  maxConnections: number
}

/** 服务器监控 - 聚合信息 */
export interface Info {
  cpu: Cpu
  memory: Memory
  server: Base
  disks: Disk[]
}
