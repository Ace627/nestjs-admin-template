import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common'
import { DecoratorConstant } from '../constant/decorator.constant'

/** 数据权限配置项 */
export interface DataScopeOptions {
  /** QueryBuilder 主表别名，默认 'user' */
  alias?: string
  /** 部门列名，默认 'deptId' */
  deptColumn?: string
  /** 仅本人（dataScope = '5'）时匹配的列名，默认 'createBy'（用户表请显式传 'id'） */
  userColumn?: string
}

/** 补全默认值后的配置 */
export type DataScopeOptionsResolved = Required<DataScopeOptions>

/** 默认配置 */
export const DEFAULT_DATA_SCOPE_OPTIONS: DataScopeOptionsResolved = {
  alias: 'user',
  deptColumn: 'deptId',
  userColumn: 'createBy',
}

/** 参数化数据权限条件（由 DataScopeInterceptor 计算并挂到 request.dataScope） */
export interface DataScopeCondition {
  /** WHERE 片段，如 "user.deptId IN (:...__ds0)"，多档位之间已用 OR 合并 */
  sql: string
  /** 与 sql 中占位符一一对应的参数 */
  params: Record<string, unknown>
}

/**
 * 数据权限装饰器
 * 标注在 Controller 方法上，配合 DataScopeInterceptor 使用（用法与 @Operlog 一致）
 * @example @DataScope({ alias: 'user', userColumn: 'id' })
 */
export function DataScope(options: DataScopeOptions = {}): MethodDecorator {
  return SetMetadata(DecoratorConstant.DATA_SCOPE, { ...DEFAULT_DATA_SCOPE_OPTIONS, ...options })
}

/**
 * 数据权限条件参数装饰器
 * 注入 DataScopeInterceptor 计算好的条件；未标注 @DataScope 的接口返回 undefined
 * @example findList(@Query(PaginationPipe) dto: QueryDto, @DataScopeSql() ds: DataScopeCondition)
 */
export const DataScopeSql = createParamDecorator((_: unknown, ctx: ExecutionContext): DataScopeCondition | undefined => {
  const request = ctx.switchToHttp().getRequest<ExpressRequest & { dataScope?: DataScopeCondition }>()
  return request.dataScope
})
