import { tap } from 'rxjs/operators'
import { Observable, of } from 'rxjs'
import { Reflector } from '@nestjs/core'
import { RedisService } from '@/shared/redis.service'
import { DecoratorConstant } from '../constant/decorator.constant'
import { ResponseCacheOptions } from '../decorator/response-cache.decorator'
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'

/**
 * 全局响应缓存拦截器
 * 作用：统一处理接口响应缓存，命中缓存直接返回，未命中则写入缓存
 */
@Injectable()
export class ResponseCacheInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly redisService: RedisService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    // 获取当前请求的路由处理方法
    const handler = context.getHandler()
    // 从方法上获取缓存装饰器配置，无配置则使用空对象
    const options = this.reflector.get<ResponseCacheOptions>(DecoratorConstant.RESPONSE_CACHE, handler) || {}

    // 缓存唯一键
    const cacheKey = options.key

    // 无缓存键 → 不使用缓存，直接放行请求
    if (!cacheKey) return next.handle()

    // 缓存过期时间：默认 60 秒
    const baseTtl = options.ttl || 60
    const jitter = Math.floor(Math.random() * (baseTtl * 0.2))
    const ttl = baseTtl + jitter

    // 从 Redis 读取缓存数据
    const cachedData = await this.redisService.get(cacheKey)

    // 缓存命中 → 直接返回缓存数据，中断后续请求流程
    if (cachedData) return of(JSON.parse(cachedData))

    // 缓存未命中 → 执行接口逻辑，响应后将数据写入 Redis
    return next.handle().pipe(tap((data) => this.redisService.set(cacheKey, JSON.stringify(data), 'EX', ttl)))
  }
}
