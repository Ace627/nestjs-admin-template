import os from 'node:os'
import type { RedisType } from '@/types'
import { isNumberString } from '@/utils'
import { ConfigService } from '@nestjs/config'
import { Redis, type RedisOptions } from 'ioredis'
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { ConfigConstant } from '@/common/constant/config.constant' // 用 @/common 会导致循环依赖

@Injectable()
export class RedisService implements OnModuleDestroy {
  /** Redis 客户端实例 */
  private redisClient: Redis
  private logger = new Logger(RedisService.name)

  constructor(configService: ConfigService) {
    const redisConfig = configService.getOrThrow<RedisOptions>(ConfigConstant.REDIS)
    this.redisClient = new Redis(redisConfig)
    this.redisClient.on('connect', () => this.logger.log(`Redis 连接成功`))
    this.redisClient.on('ready', () => this.logger.log(`Redis 已准备就绪`))
    this.redisClient.on('error', (error) => this.logger.error(`Redis 连接失败，${error.message}，${error.stack}`))
  }

  /** 设置键值对 */
  public get set(): typeof this.redisClient.set {
    return this.redisClient.set.bind(this.redisClient)
  }

  /** 设置键值对，过期时间为秒 */
  public get setex(): typeof this.redisClient.setex {
    return this.redisClient.setex.bind(this.redisClient)
  }

  /** 设置键值对，仅当键不存在时 */
  public get setnx(): typeof this.redisClient.setnx {
    return this.redisClient.setnx.bind(this.redisClient)
  }

  /** 获取键值对 */
  public get get(): typeof this.redisClient.get {
    return this.redisClient.get.bind(this.redisClient)
  }

  /** 获取键值对，设置新值 */
  public get getset(): typeof this.redisClient.getset {
    return this.redisClient.getset.bind(this.redisClient)
  }

  /** 删除键值对 */
  public get del(): typeof this.redisClient.del {
    return this.redisClient.del.bind(this.redisClient)
  }

  /** 设置键值对过期时间，单位：秒 */
  public get expire(): typeof this.redisClient.expire {
    return this.redisClient.expire.bind(this.redisClient)
  }

  /** 获取所有键值对 */
  public get keys(): typeof this.redisClient.keys {
    return this.redisClient.keys.bind(this.redisClient)
  }

  /** 基于 SCAN 增量游标收集匹配键（非阻塞，替代阻塞的 KEYS） */
  public async scan(pattern: string, count = 100): Promise<string[]> {
    const seen = new Set<string>()
    let cursor = '0'
    do {
      const [next, keys] = await this.redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', count)
      cursor = next
      for (const k of keys) seen.add(k) // Set 自动去重
    } while (cursor !== '0')
    return [...seen]
  }

  /** 检查键是否存在 */
  public get exists(): typeof this.redisClient.exists {
    return this.redisClient.exists.bind(this.redisClient)
  }

  /** 增加键值对的整数值 */
  public get incr(): typeof this.redisClient.incr {
    return this.redisClient.incr.bind(this.redisClient)
  }

  /** 减少键值对的整数值 */
  public get decr(): typeof this.redisClient.decr {
    return this.redisClient.decr.bind(this.redisClient)
  }

  /** 增加键值对的整数值，指定步长 */
  public get incrby(): typeof this.redisClient.incrby {
    return this.redisClient.incrby.bind(this.redisClient)
  }

  /** 减少键值对的整数值，指定步长 */
  public get decrby(): typeof this.redisClient.decrby {
    return this.redisClient.decrby.bind(this.redisClient)
  }

  /** 获取键值对的过期时间，单位：秒 */
  public get ttl(): typeof this.redisClient.ttl {
    return this.redisClient.ttl.bind(this.redisClient)
  }

  /** 向列表的左端添加一个元素 */
  public get lpush(): typeof this.redisClient.lpush {
    return this.redisClient.lpush.bind(this.redisClient)
  }

  /** 向列表的右端添加一个元素 */
  public get rpush(): typeof this.redisClient.rpush {
    return this.redisClient.rpush.bind(this.redisClient)
  }

  /** 从列表的左端弹出一个元素 */
  public get lpop(): typeof this.redisClient.lpop {
    return this.redisClient.lpop.bind(this.redisClient)
  }

  /** 从列表的右端弹出一个元素 */
  public get rpop(): typeof this.redisClient.rpop {
    return this.redisClient.rpop.bind(this.redisClient)
  }

  /** 从列表的右端弹出一个元素，同时将其添加到列表的左端 */
  public get rpoplpush(): typeof this.redisClient.rpoplpush {
    return this.redisClient.rpoplpush.bind(this.redisClient)
  }

  /** 从列表的左端获取元素范围 */
  public get lrange(): typeof this.redisClient.lrange {
    return this.redisClient.lrange.bind(this.redisClient)
  }

  /** 清空当前数据库 */
  public get flushdb(): typeof this.redisClient.flushdb {
    return this.redisClient.flushdb.bind(this.redisClient)
  }

  /** 清空所有数据库 */
  public get flushall(): typeof this.redisClient.flushall {
    return this.redisClient.flushall.bind(this.redisClient)
  }

  /** 获取当前数据库的键值对数量 */
  public get dbsize(): typeof this.redisClient.dbsize {
    return this.redisClient.dbsize.bind(this.redisClient)
  }

  /** 获取 Redis 配置参数的值 */
  public async getConfig(key: string): Promise<{ key: string; value: string }> {
    const config = (await this.redisClient.config('GET', key)) as [string, string]
    return { key, value: config[1] } // Redis CONFIG GET 命令返回格式: [参数名, 参数值]
  }

  /** 获取 Redis 命令统计 */
  public async commandstats(): Promise<RedisType.CommandStat[]> {
    try {
      const rawInfo = await this.redisClient.info('commandstats')
      const commands: RedisType.CommandStat[] = []
      // 用 indexOf 手动扫描，避免 split + 大数组开销（更省内存）
      let start = 0
      const len = rawInfo.length
      while (start < len) {
        let end = rawInfo.indexOf('\n', start)
        if (end === -1) end = len
        let line = rawInfo.slice(start, end)
        if (line.endsWith('\r')) line = line.slice(0, -1)
        start = end + 1
        if (!line || line[0] === '#') continue
        // 快速前缀判断（比正则更快）
        if (!line.startsWith('cmdstat_')) continue
        // 手动解析（避免正则）
        const colonIndex = line.indexOf(':')
        if (colonIndex === -1) continue
        const name = line.slice(8, colonIndex) // 'cmdstat_'.length === 8
        const callsIndex = line.indexOf('calls=', colonIndex)
        if (callsIndex === -1) continue
        let i = callsIndex + 6 // 'calls='.length === 6
        let value = 0
        // 手动解析数字（比 parseInt 更可控）
        while (i < line.length) {
          const code = line.charCodeAt(i)
          if (code < 48 || code > 57) break // 非数字
          value = value * 10 + (code - 48)
          i++
        }
        commands.push({ name, value })
      }
      return commands
    } catch (error: any) {
      this.logger.error(`获取 Redis 命令统计失败，${error.message}，${error.stack}`)
      return []
    }
  }

  /** Redis 基本信息 */
  public async getInfo() {
    try {
      const [{ value: maxmemory }, rawInfo] = await Promise.all([this.getConfig('maxmemory'), this.redisClient.info()])
      const parsedInfo = this.parseRedisInfo(rawInfo)
      if (isNumberString(maxmemory)) parsedInfo.maxmemory = parseInt(maxmemory, 10)
      // total_system_memory 是 Redis6.0+ 才有的，此处做兼容处理
      if (!parsedInfo.total_system_memory) parsedInfo.total_system_memory = os.totalmem()
      return parsedInfo
    } catch (error: any) {
      this.logger.error(`获取 Redis 基本信息失败，${error.message}，${error.stack}`)
      return {}
    }
  }

  private parseRedisInfo(raw: string) {
    const result: Record<string, any> = {}
    let start = 0
    const len = raw.length
    while (start < len) {
      let end = raw.indexOf('\n', start)
      if (end === -1) end = len
      let line = raw.slice(start, end)
      start = end + 1
      if (line.endsWith('\r')) line = line.slice(0, -1)
      if (!line || line[0] === '#') continue
      const index = line.indexOf(':')
      if (index === -1) continue
      const key = line.slice(0, index)
      const value = line.slice(index + 1)
      // 数值转 number（Number 而非 parseInt，保留小数如 instantaneous_input_kbps=718.46）
      if (isNumberString(value)) result[key] = Number(value)
      // 保留字符串字段（redis_mode、redis_version、used_memory_human 等）
      else if (value) result[key] = value
    }
    return result
  }

  /** 应用关闭时优雅释放 Redis 连接 */
  async onModuleDestroy() {
    try {
      await this.redisClient.quit()
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error)
      this.logger.error(`Redis 连接关闭失败，${errMsg}`)
    }
  }
}
