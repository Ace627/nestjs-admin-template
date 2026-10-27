import { getRequestIp } from '@/utils'
import { Reflector } from '@nestjs/core'
import { RedisService } from '@/shared/redis.service'
import { RedisConstant } from '../constant/redis.constant'
import { DecoratorConstant } from '../constant/decorator.constant'
import { BusinessException } from '../exception/business.exception'
import { ExecutionContext, Injectable, CanActivate } from '@nestjs/common'

@Injectable()
export class ThrottlerLimitGuard implements CanActivate {
  /** 最大允许请求次数 */
  private readonly MAX_REQUEST_COUNT: number = 10
  /** 限流时间窗口（秒） */
  private readonly LIMIT_WINDOW_SECONDS: number = 10
  /** 触发限流后拉黑时长（秒） */
  private readonly LOCK_DURATION_SECONDS: number = 60 * 1
  /** 限流异常提示信息 */
  private readonly LIMIT_TIP_MESSAGE = '请求过于频繁，请稍后再试'

  constructor(
    private readonly reflector: Reflector,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const handler = context.getHandler()
    const controllerClass = context.getClass()
    const request = context.switchToHttp().getRequest<ExpressRequest>()
    const ip = getRequestIp(request)
    const path = request.route?.path || request.url

    // 判断是否跳过限流
    const skipThrottle = this.reflector.getAllAndOverride<boolean>(DecoratorConstant.SKIP_THROTTLE, [handler, controllerClass])
    if (skipThrottle) return true

    if (!ip) throw new BusinessException('无法获取客户端 IP')

    // 接口维度 + IP 限流（安全隔离）
    const key = `${RedisConstant.THROTTLE_LIMIT}:${ip}:${path}`

    // 检查是否被拉黑
    const data = await this.redisService.get(key)
    if (data === 'locked') throw new BusinessException(this.LIMIT_TIP_MESSAGE)

    // 原子自增（高并发安全）
    const count = await this.redisService.incr(key)

    // 第一次设置过期时间
    if (count === 1) await this.redisService.expire(key, this.LIMIT_WINDOW_SECONDS)

    // 超过限制 → 拉黑 30 分钟
    if (count > this.MAX_REQUEST_COUNT) {
      await this.redisService.set(key, 'locked', 'EX', this.LOCK_DURATION_SECONDS)
      throw new BusinessException(this.LIMIT_TIP_MESSAGE)
    }

    return true
  }
}
