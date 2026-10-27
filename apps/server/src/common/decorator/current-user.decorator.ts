import type { AuthType } from '@/types'
import { CommonConstant } from '../constant/common.constant'
import { createParamDecorator, ExecutionContext } from '@nestjs/common'

/**
 * 获取当前登录用户信息
 * @example
 * 1. 获取全部用户信息：@CurrentUser() user: AuthType.JwtPayload
 * 2. 获取指定字段：@CurrentUser('userId') userId: number
 */
export const CurrentUser = createParamDecorator(<K extends keyof AuthType.JwtPayload>(field: K, context: ExecutionContext) => {
  // 获取 HTTP 请求对象
  const request = context.switchToHttp().getRequest<ExpressRequest>()

  // 安全获取已认证的用户信息
  const user = Reflect.get(request, CommonConstant.JWT_PAYLOAD) ?? {}

  // 支持传入字段名获取指定属性
  return field ? user[field] : user
})
