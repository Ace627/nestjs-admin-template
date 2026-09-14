import { ConfigService } from '@nestjs/config'
import { BusinessException } from '../exception/business.exception'
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { ConfigConstant } from '../constant/config.constant'

/**
 * 演示环境操作守卫
 * @description 用于限制演示环境的操作权限：
 * 1. 非演示环境：直接放行所有请求
 * 2. 演示环境：仅允许 GET 请求 + 白名单内的非GET请求，其他请求直接抛出异常
 */
@Injectable()
export class DemoEnvironmentGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  /**
   * 守卫核心方法：判断请求是否允许执行
   * @param context 执行上下文（可获取请求/响应信息）
   * @returns 允许返回true，拒绝则抛出业务异常
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. 从配置中获取是否为演示环境，默认值：非演示环境
    const isDemoEnvironment = this.configService.get(ConfigConstant.SERVER_IS_DEMO, false)

    // 2. 非演示环境 → 直接放行所有请求
    if (!isDemoEnvironment) return true

    // 3. 演示环境 → 获取 HTTP 请求对象
    const request = context.switchToHttp().getRequest<ExpressRequest>()
    const requestMethod = request.method.toUpperCase()

    // 4. 演示环境放行白名单（认证接口，前缀取自全局配置，随 SERVER_GLOBAL_PREFIX 变化）
    const globalPrefix = this.configService.getOrThrow<string>(ConfigConstant.SERVER_GLOBAL_PREFIX)
    const prefix = globalPrefix === '/' ? '' : globalPrefix
    const whiteList = [`${prefix}/auth/login`, `${prefix}/auth/logout`]

    // 5. 判断当前请求路径是否在白名单中
    const isWhite = whiteList.some((item) => request.originalUrl.startsWith(item))

    // 6. 演示环境拦截规则：非 GET 请求 + 不在白名单 → 拒绝访问
    if (requestMethod !== 'GET' && !isWhite) throw new BusinessException('演示环境，不允许操作')

    // 7. 符合规则 → 放行
    return true
  }
}
