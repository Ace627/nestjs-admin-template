import { SetMetadata } from '@nestjs/common'
import { DecoratorConstant } from '../constant/decorator.constant'

/** 指定接口需要的权限组 */
export function RequirePermissions(permissions: string[]) {
  return SetMetadata(DecoratorConstant.PERMISSIONS, permissions)
}
