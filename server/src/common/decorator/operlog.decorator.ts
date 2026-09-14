import { SetMetadata } from '@nestjs/common'
import { BusinessType } from '../constant/business-type.constant'
import { DecoratorConstant } from '../constant/decorator.constant'

export class OperlogOption {
  /* 操作模块 */
  title: string

  /* 操作类型 */
  businessType?: BusinessType = BusinessType.OTHER
}

export function Operlog(logOption: OperlogOption) {
  const option = Object.assign(new OperlogOption(), logOption)
  return SetMetadata(DecoratorConstant.OPERLOG, option)
}
