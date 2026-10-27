import { Injectable } from '@nestjs/common'
import { RedisService } from './redis.service'
import { ConfigService } from '@/modules/system/config/config.service'
import { BusinessException, CommonConstant, RedisConstant } from '@/common'

@Injectable()
export class LoginLockService {
  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  /** 锁定阈值（参数 sys.account.maxFailCount，缺失或非法时默认 5 次） */
  private async getMaxFailCount(): Promise<number> {
    return this.configService.getNumberConfig(CommonConstant.MAX_FAIL_COUNT_CONFIG_KEY, 5)
  }

  /** 锁定时长秒数（参数 sys.account.lockSeconds，缺失或非法时默认 30 分钟） */
  private async getLockSeconds(): Promise<number> {
    return this.configService.getNumberConfig(CommonConstant.LOCK_SECONDS_CONFIG_KEY, 30 * 60)
  }

  /**
   * 校验账号在当前来源是否处于锁定状态（单键设计：失败次数达到阈值即视同锁定）
   * - 按「账号 + IP」计数：攻击者失败只影响其自身来源，单 IP 无法锁死他人正常登录
   * @param username - 用户名
   * @param ip - 客户端 IP
   * @throws {BusinessException} 处于锁定状态时抛出异常（附剩余分钟数）
   */
  public async assertNotLocked(username: string, ip: string): Promise<void> {
    const failKey = this.getFailKey(username, ip)
    const count = await this.redisService.get(failKey)
    if (!count) return
    const maxFailCount = await this.getMaxFailCount()
    if (Number(count) < maxFailCount) return
    const ttl = await this.redisService.ttl(failKey)
    if (ttl > 0) throw new BusinessException(`密码错误次数过多，请 ${Math.ceil(ttl / 60)} 分钟后重试`)
  }

  /**
   * 记录一次密码错误（滑动窗口：每次失败刷新计数窗口）
   * @param username - 用户名
   * @param ip - 客户端 IP
   * @returns 距锁定的剩余可尝试次数
   * @throws {BusinessException} 失败次数达到阈值时抛出异常（键保留至窗口结束，期间视同锁定）
   */
  public async recordFailure(username: string, ip: string): Promise<number> {
    const [maxFailCount, lockSeconds] = await Promise.all([this.getMaxFailCount(), this.getLockSeconds()])
    const failKey = this.getFailKey(username, ip)
    const count = await this.redisService.incrWithExpire(failKey, lockSeconds)
    if (count < maxFailCount) return maxFailCount - count
    throw new BusinessException(`密码错误次数过多，账号已锁定 ${Math.round(lockSeconds / 60)} 分钟`)
  }

  /** 登录成功后清除失败计数 */
  public async clearFailCount(username: string, ip: string): Promise<void> {
    await this.redisService.del(this.getFailKey(username, ip))
  }

  /**
   * 分页查询失败计数列表（含未达锁定阈值的记录，供监控页展示；按失败次数降序，最接近锁定的优先展示）
   * @param queryParams - 分页与筛选参数（username/ip 支持模糊匹配）
   * @returns total 与 records（账号、来源 IP、失败次数、剩余可尝试次数、剩余窗口秒数）
   */
  public async findLockedList(queryParams: { take?: number; skip?: number; username?: string; ip?: string }) {
    const { take = 10, skip = 0, username = '', ip = '' } = queryParams
    const maxFailCount = await this.getMaxFailCount()
    const prefix = `${RedisConstant.LOGIN_FAIL_COUNT}:`
    const keys = await this.redisService.scan(`${prefix}*`)
    const countList = await Promise.all(keys.map((key) => this.redisService.get(key)))
    let records: { username: string; ip: string; failCount: number }[] = []
    keys.forEach((key, index) => {
      const remainder = key.slice(prefix.length)
      // 账号不含冒号，按首个冒号拆分；IP 段整体保留（IPv6 地址自带冒号）
      const separatorIndex = remainder.indexOf(':')
      if (separatorIndex <= 0) return
      records.push({ username: remainder.slice(0, separatorIndex), ip: remainder.slice(separatorIndex + 1), failCount: Number(countList[index]) })
    })
    records = records.filter((item) => Number.isInteger(item.failCount))
    if (username) records = records.filter((item) => item.username.includes(username))
    if (ip) records = records.filter((item) => item.ip.includes(ip))
    records.sort((a, b) => b.failCount - a.failCount)
    const ttlList = await Promise.all(records.map((item) => this.redisService.ttl(`${prefix}${item.username}:${item.ip}`)))
    const detailedRecords = records.map((item, index) => ({
      ...item,
      remainingCount: Math.max(maxFailCount - item.failCount, 0),
      remainingSeconds: Math.max(ttlList[index], 0),
    }))
    const total = detailedRecords.length
    return { total, records: detailedRecords.slice(skip, skip + take) }
  }

  /**
   * 解锁指定账号的指定来源（删除对应失败计数键，与管理页列表的行维度一一对应）
   * @param username - 登录账号
   * @param ip - 来源 IP
   * @returns 解锁提示文案
   */
  public async unlock(username: string, ip: string): Promise<string> {
    await this.redisService.del(this.getFailKey(username, ip))
    return '解锁成功'
  }

  /** 登录失败计数缓存 Key（键值=失败次数，达到阈值即锁定，TTL 到期自动解锁） */
  private getFailKey(username: string, ip: string): string {
    return `${RedisConstant.LOGIN_FAIL_COUNT}:${username}:${ip}`
  }
}
