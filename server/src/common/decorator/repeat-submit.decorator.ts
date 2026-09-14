import { SetMetadata } from '@nestjs/common'
import { DecoratorConstant } from '../constant/decorator.constant'

export class RepeatSubmitOption {
  interval?: number = 5 // 默认 5s
  message?: string = '数据正在处理中，请勿重复提交'
}

export const RepeatSubmit = (option?: RepeatSubmitOption) => {
  const repeatSubmitOption = Object.assign(new RepeatSubmitOption(), option)
  return SetMetadata(DecoratorConstant.REPEAT_SUBMIT, repeatSubmitOption)
}
