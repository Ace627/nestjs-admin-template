import { Reflector } from '@nestjs/core'
import type { AuthType } from '@/types'
import { RedisService } from '@/shared/redis.service'
import { CanActivate, ExecutionContext, HttpStatus, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { BusinessException, CommonConstant, ConfigConstant, DecoratorConstant, RedisConstant } from '@/common'

/** user:roles:{userId} 缓存结构（AuthService.getInfo 写入） */
interface UserRoleCacheItem {
  id: string
  roleCode: string
}

@Injectable()
export class PermissionAuthGuard implements CanActivate {
  private readonly logger = new Logger(PermissionAuthGuard.name)

  constructor(
    private readonly reflector: Reflector,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  /** JWT 过期时间（秒），与角色级缓存写入 TTL 同源 */
  private get expiresIn(): number {
    return this.configService.get<number>(ConfigConstant.JWT_EXPIRES_IN, 1800)
  }

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // 获取权限元数据（方法优先于类）
      const targets = [context.getHandler(), context.getClass()]
      const permissions = this.reflector.getAllAndOverride<string[]>(DecoratorConstant.PERMISSIONS, targets)

      // 无需权限 → 直接放行
      if (!permissions?.length) return true

      const request = context.switchToHttp().getRequest<ExpressRequest>()
      const user = request[CommonConstant.JWT_PAYLOAD] as AuthType.JwtPayload | undefined
      if (!user || !user.userId) throw new Error('登录状态已失效，请重新登录')

      // 读取用户角色缓存（缺失 → fail-closed，前端刷新页面触发 getInfo 重建）
      const roles = await this.getUserRoles(user.userId)
      if (!roles) throw new BusinessException('登录状态已失效，请重新登录', HttpStatus.UNAUTHORIZED)

      // 并发读取角色级权限缓存（admin 角色缓存内容为全量权限串；任一缺失 → fail-closed，宁可拒绝不放行）
      const permJsonList = await Promise.all(roles.map((role) => this.redisService.get(`${RedisConstant.ROLE_PERMISSIONS}:${role.id}`)))
      if (permJsonList.some((json) => json === null)) throw new Error('权限数据已失效，请刷新页面重试')

      // 读时续期（best-effort）：角色级缓存与用户级缓存同为滑动 TTL，避免活跃会话中途缓存过期导致 403
      this.touch(roles.map((role) => `${RedisConstant.ROLE_PERMISSIONS}:${role.id}`))

      // 合并全部角色的权限标识并去重
      const granted = [...new Set(permJsonList.map((json) => JSON.parse(json as string) as string[]).flat())]

      // 精确匹配（OR 语义：拥有其中之一即通过；不认任何通配符，权限串必须完整配置在菜单表并被授权）
      if (permissions.some((required) => granted.includes(required))) return true

      throw new Error('暂无权限访问，请联系管理员')
    } catch (error: unknown) {
      if (error instanceof BusinessException) throw error
      const errMsg = error instanceof Error ? error.message : '权限校验失败'
      throw new BusinessException(errMsg, HttpStatus.FORBIDDEN)
    }
  }

  /** 读取用户角色缓存；缺失返回 null，由上层 fail-closed */
  private async getUserRoles(userId: string): Promise<UserRoleCacheItem[] | null> {
    if (!userId) return null
    const jsonStr = await this.redisService.get(`${RedisConstant.ADMIN_USER_ROLES}:${userId}`)
    return jsonStr ? (JSON.parse(jsonStr) as UserRoleCacheItem[]) : null
  }

  /** 滑动续期角色级缓存键（异步 fire-and-forget，失败仅打日志不影响鉴权结果） */
  private touch(cacheKeys: string[]) {
    Promise.all(cacheKeys.map((cacheKey) => this.redisService.expire(cacheKey, this.expiresIn))).catch((error: unknown) => {
      const errMsg = error instanceof Error ? error.message : '未知错误'
      this.logger.warn(`角色权限缓存续期失败（不影响本次请求）: ${errMsg}`)
    })
  }
}
