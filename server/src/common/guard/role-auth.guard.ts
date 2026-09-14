import { Reflector } from '@nestjs/core'
import type { AuthType } from '@/types'
import { RedisService } from '@/shared/redis.service'
import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common'
import { BusinessException, CommonConstant, DecoratorConstant, RbacConstant, RedisConstant } from '@/common'

/** user:roles:{userId} 缓存结构（与 PermissionAuthGuard 共用，AuthService.getInfo 写入） */
interface UserRoleCacheItem {
  id: string
  roleCode: string
}

@Injectable()
export class RoleAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly redisService: RedisService,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // 获取角色元数据（方法优先于类）
      const targets = [context.getHandler(), context.getClass()]
      const roles = this.reflector.getAllAndOverride<string[]>(DecoratorConstant.ROLES, targets)

      // 无需角色 → 直接放行
      if (!roles?.length) return true

      const request = context.switchToHttp().getRequest<ExpressRequest>()
      const user = request[CommonConstant.JWT_PAYLOAD] as AuthType.JwtPayload | undefined
      if (!user || !user.userId) throw new Error('登录状态已失效，请重新登录')

      // 读取用户角色缓存（缺失 → fail-closed）
      const cacheRoles = await this.getUserRoles(user.userId)
      if (!cacheRoles) throw new BusinessException('登录状态已失效，请重新登录', HttpStatus.UNAUTHORIZED)

      // 超管短路（基于 roleCode 判定，不依赖用户 ID）
      if (cacheRoles.some((role) => role.roleCode === RbacConstant.SUPER_ROLE_CODE)) return true

      // 角色校验（OR 语义：只要拥有其中一个角色即可通过）
      const roleCodes = cacheRoles.map((role) => role.roleCode)
      if (roles.some((required) => roleCodes.includes(required))) return true

      throw new Error('暂无权限访问，请联系管理员')
    } catch (error: unknown) {
      if (error instanceof BusinessException) throw error
      const errMsg = error instanceof Error ? error.message : '角色校验失败'
      throw new BusinessException(errMsg, HttpStatus.FORBIDDEN)
    }
  }

  /** 读取用户角色缓存；缺失返回 null，由上层 fail-closed */
  private async getUserRoles(userId: string): Promise<UserRoleCacheItem[] | null> {
    if (!userId) return null
    const jsonStr = await this.redisService.get(`${RedisConstant.ADMIN_USER_ROLES}:${userId}`)
    return jsonStr ? (JSON.parse(jsonStr) as UserRoleCacheItem[]) : null
  }
}
