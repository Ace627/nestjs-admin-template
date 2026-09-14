import { SetMetadata } from '@nestjs/common'
import { RedisConstant } from '../constant/redis.constant'
import { DecoratorConstant } from '../constant/decorator.constant'

/**
 * 缓存装饰器配置项类型
 */
export interface ResponseCacheOptions {
  /** 缓存键 */
  key?: string
  /** 过期时间（秒） */
  ttl?: number
}

/**
 * 响应缓存装饰器
 * 给接口方法添加缓存标记，配合拦截器实现自动缓存
 */
export function ResponseCache(options: ResponseCacheOptions = {}): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    const className = target.constructor.name
    const methodName = propertyKey.toString()

    // 生成缓存 key：不传则用 类名:方法名
    const key: string = `${RedisConstant.RESPONSE_CACHE}:` + (options.key || `${className}:${methodName}`)

    // 缓存过期时间：不传默认 60 秒
    const ttl: number = options?.ttl || 60

    // 将缓存配置设置为方法元数据
    SetMetadata(DecoratorConstant.RESPONSE_CACHE, { key, ttl })(target, propertyKey, descriptor)
  }
}
