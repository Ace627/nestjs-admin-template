import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'
import { DecoratorConstant, BusinessException } from '@/common'
import { Injectable, ExecutionContext, HttpStatus } from '@nestjs/common'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super()
  }

  canActivate(context: ExecutionContext) {
    // 放行公开接口
    const isPublic = this.reflector.getAllAndOverride<boolean>(DecoratorConstant.PUBLIC, [context.getHandler(), context.getClass()]) ?? false
    if (isPublic) return true

    return super.canActivate(context)
  }

  handleRequest(error: any, user: any, info: any) {
    if (error || !user) throw new BusinessException('登录已过期，请重新登录', HttpStatus.UNAUTHORIZED)
    return user
  }
}
