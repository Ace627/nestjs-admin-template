import { Injectable } from '@nestjs/common'
import { RedisService } from './redis.service'
import { BusinessException, CommonConstant, RedisConstant } from '@/common'
import { ConfigService } from '@/modules/system/config/config.service'

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
   * 校验账号是否处于锁定状态（单键设计：失败次数达到阈值即视同锁定）
   * @param username - 用户名
   * @throws {BusinessException} 账号锁定中时抛出异常（附剩余分钟数）
   */
  public async assertNotLocked(username: string): Promise<void> {
    const failKey = this.getFailKey(username)
    const count = await this.redisService.get(failKey)
    if (!count) return
    const maxFailCount = await this.getMaxFailCount()
    if (Number(count) < maxFailCount) return
    const ttl = await this.redisService.ttl(failKey)
    if (ttl > 0) throw new BusinessException(`密码错误次数过多，账号已锁定，请 ${Math.ceil(ttl / 60)} 分钟后重试`)
  }

  /**
   * 记录一次密码错误（滑动窗口：每次失败刷新计数窗口）
   * @param username - 用户名
   * @returns 距锁定的剩余可尝试次数
   * @throws {BusinessException} 失败次数达到阈值时抛出异常（键保留至窗口结束，期间视同锁定）
   */
  public async recordFailure(username: string): Promise<number> {
    const [maxFailCount, lockSeconds] = await Promise.all([this.getMaxFailCount(), this.getLockSeconds()])
    const failKey = this.getFailKey(username)
    const count = await this.redisService.incr(failKey)
    await this.redisService.expire(failKey, lockSeconds)
    if (count < maxFailCount) return maxFailCount - count
    throw new BusinessException(`密码错误次数过多，账号已锁定 ${Math.round(lockSeconds / 60)} 分钟`)
  }

  /** 登录成功后清除失败计数 */
  public async clearFailCount(username: string): Promise<void> {
    await this.redisService.del(this.getFailKey(username))
  }

  /** 登录失败计数缓存 Key（键值=失败次数，达到阈值即锁定，TTL 到期自动解锁） */
  private getFailKey(username: string): string {
    return `${RedisConstant.LOGIN_FAIL_COUNT}:${username}`
  }
}
