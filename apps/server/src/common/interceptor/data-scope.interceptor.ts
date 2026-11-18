import { Reflector } from '@nestjs/core'
import type { AuthType } from '@/types'
import { RedisService } from '@/shared/redis.service'
import { DeptService } from '@/modules/system/dept/dept.service'
import { RoleService } from '@/modules/system/role/role.service'
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { concat, Observable } from 'rxjs'
import { CommonConstant, DataScopeCondition, DataScopeOptionsResolved, DataScopeType, DecoratorConstant, RedisConstant } from '@/common'

/** user:roles:{userId} 缓存结构（AuthService.getInfo 写入） */
interface UserRoleCacheItem {
  id: string
  roleCode: string
}

/**
 * 数据权限拦截器
 * 读取 @DataScope 元数据 → 按角色数据范围计算参数化 WHERE 条件 → 挂到 request.dataScope
 * 供 @DataScopeSql() 参数装饰器注入 Controller，Service 中 qb.andWhere(ds.sql, ds.params) 消费
 * @note 5 档之间为 OR 合并（多角色取并集，最宽松语义）；任何缓存缺失均 fail-closed（1 = 0），绝不放行全量
 */
@Injectable()
export class DataScopeInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly redisService: RedisService,
    private readonly deptService: DeptService,
    private readonly roleService: RoleService,
  ) {}

  public intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // 获取数据权限元数据（方法优先于类）；未标注 → 直接放行
    const targets = [context.getHandler(), context.getClass()]
    const options = this.reflector.getAllAndOverride<DataScopeOptionsResolved>(DecoratorConstant.DATA_SCOPE, targets)
    if (!options) return next.handle()

    const request = context.switchToHttp().getRequest<ExpressRequest & { dataScope?: DataScopeCondition }>()
    // 先完成条件计算再放行 handler（concat 保证时序：前一个流完成后再订阅 handler）
    return concat(this.setDataScope(request, options), next.handle())
  }

  /** 计算数据范围条件并挂载到 request（异常时 fail-closed） */
  private async setDataScope(request: ExpressRequest & { dataScope?: DataScopeCondition }, options: DataScopeOptionsResolved) {
    try {
      request.dataScope = await this.buildCondition(request, options)
    } catch {
      // 数据权限计算异常时 fail-closed：按「无可见数据」处理，绝不放行全量
      request.dataScope = { sql: '1 = 0', params: {} }
    }
  }

  /** 按角色数据范围构建参数化条件；返回 undefined 表示不过滤（全部数据） */
  private async buildCondition(request: ExpressRequest, options: DataScopeOptionsResolved): Promise<DataScopeCondition | undefined> {
    const user = request[CommonConstant.JWT_PAYLOAD] as AuthType.JwtPayload | undefined
    if (!user?.userId) return { sql: '1 = 0', params: {} }

    // 用户角色缓存缺失 → fail-closed（登录态失效，由 getInfo 重建）
    const roles = await this.getUserRoles(user.userId)
    if (!roles) return { sql: '1 = 0', params: {} }

    const { alias, deptColumn, userColumn } = options
    const parts: string[] = []
    const params: Record<string, unknown> = {}
    let index = 0
    // 用户可见部门：多角色惰性复用，仅遇到部门档位时回源一次，避免循环内重复读 Redis
    let userDepts: string[] | null | undefined

    for (const role of roles) {
      // 读不到先回源重建；角色已删（null）或重建异常才 fail-closed
      const scope = await this.roleService.getRoleScopeCache(role.id)
      if (!scope) return { sql: '1 = 0', params: {} }
      const { dataScope, deptIds } = scope

      if (dataScope === DataScopeType.ALL) return undefined

      if (dataScope === DataScopeType.CUSTOM && deptIds.length) {
        params[`__ds${index}`] = deptIds
        parts.push(`${alias}.${deptColumn} IN (:...__ds${index})`)
        index++
      }

      if (dataScope === DataScopeType.DEPT || dataScope === DataScopeType.DEPT_AND_BELOW) {
        if (userDepts === undefined) userDepts = await this.getUserDepts(user.userId)
        if (!userDepts) return { sql: '1 = 0', params: {} }
        const ids = dataScope === DataScopeType.DEPT ? userDepts : await this.deptService.findDescendants(userDepts)
        if (ids.length) {
          params[`__ds${index}`] = ids
          parts.push(`${alias}.${deptColumn} IN (:...__ds${index})`)
          index++
        }
      }

      if (dataScope === DataScopeType.SELF) {
        params[`__dsu${index}`] = user.userId
        parts.push(`${alias}.${userColumn} = :__dsu${index}`)
        index++
      }
    }

    // 无任何有效可见范围 → 查不到任何数据（绝不兜底放行）
    if (!parts.length) return { sql: '1 = 0', params: {} }

    return { sql: parts.length === 1 ? parts[0] : `(${parts.join(' OR ')})`, params }
  }

  /** 读取用户角色缓存；缺失返回 null */
  private async getUserRoles(userId: string): Promise<UserRoleCacheItem[] | null> {
    const jsonStr = await this.redisService.get(`${RedisConstant.ADMIN_USER_ROLES}:${userId}`)
    return jsonStr ? (JSON.parse(jsonStr) as UserRoleCacheItem[]) : null
  }

  /** 读取用户可见部门缓存（用户主部门 ID，AuthService.getInfo 经 UserService.getVisibleDeptIds 写入）；缺失返回 null */
  private async getUserDepts(userId: string): Promise<string[] | null> {
    const jsonStr = await this.redisService.get(`${RedisConstant.ADMIN_USER_DEPTS}:${userId}`)
    return jsonStr ? (JSON.parse(jsonStr) as string[]) : null
  }
}
