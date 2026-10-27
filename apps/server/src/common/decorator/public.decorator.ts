import { SetMetadata } from '@nestjs/common'
import { DecoratorConstant } from '../constant/decorator.constant'

/** 开放接口 */
export function Public() {
  return SetMetadata(DecoratorConstant.PUBLIC, true)
}
