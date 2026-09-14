import { Injectable } from '@nestjs/common'
import { RedisService } from './redis.service'
import { BusinessException, RedisConstant } from '@/common'

@Injectable()
export class LoginLockService {
  /** 最大密码失败次数，达到即锁定 */
  private readonly MAX_FAIL_COUNT = 5
  /** 失败计数窗口与锁定时长（秒）：30 分钟 */
  private readonly LOCK_SECONDS = 30 * 60

  constructor(private readonly redisService: RedisService) {}

  /**
   * 校验账号是否处于锁定状态（单键设计：失败次数达到阈值即视同锁定）
   * @param username - 用户名
   * @throws {BusinessException} 账号锁定中时抛出异常（附剩余分钟数）
   */
  public async assertNotLocked(username: string): Promise<void> {
    const failKey = this.getFailKey(username)
    const count = await this.redisService.get(failKey)
    if (!count || Number(count) < this.MAX_FAIL_COUNT) return
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
    const failKey = this.getFailKey(username)
    const count = await this.redisService.incr(failKey)
    await this.redisService.expire(failKey, this.LOCK_SECONDS)
    if (count < this.MAX_FAIL_COUNT) return this.MAX_FAIL_COUNT - count
    throw new BusinessException(`密码错误次数过多，账号已锁定 ${Math.round(this.LOCK_SECONDS / 60)} 分钟`)
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
