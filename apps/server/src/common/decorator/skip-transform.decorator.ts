import { SetMetadata } from '@nestjs/common'
import { DecoratorConstant } from '../constant/decorator.constant'

/** 响应数据不包装直接返回 */
export function SkipTransform() {
  return SetMetadata(DecoratorConstant.SKIP_TRANSFORM, true)
}
