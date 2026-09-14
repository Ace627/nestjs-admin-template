import { SetMetadata } from '@nestjs/common'
import { DecoratorConstant } from '../constant/decorator.constant'

/**
 * 跳过接口限流装饰器
 * 用于控制器或接口方法，标记后不受限流保护拦截
 */
export function SkipThrottle() {
  return SetMetadata(DecoratorConstant.SKIP_THROTTLE, true)
}
