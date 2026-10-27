import { SetMetadata } from '@nestjs/common'
import { DecoratorConstant } from '../constant/decorator.constant'

/** 指定接口需要的角色组 */
export function RequireRoles(roles: string[]) {
  return SetMetadata(DecoratorConstant.ROLES, roles)
}
