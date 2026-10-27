import { randomUUID } from '@/utils'
import type { AuthType } from '@/types'
import { UserContext } from '../context/user.context'
import { CommonConstant } from '../constant/common.constant'
import { Injectable, Logger, NestMiddleware } from '@nestjs/common'

@Injectable()
export class BeforeEachMiddleware implements NestMiddleware {
  private readonly logger = new Logger(BeforeEachMiddleware.name)

  use(request: ExpressRequest, response: ExpressResponse, next: ExpressNextFunction): void {
    // 生成请求唯一ID：写入 request 对象，供拦截器包装响应体与日志链路追踪使用
    request[CommonConstant.REQUEST_ID] = randomUUID()
    // 透传至响应头：客户端与网关可直接取用，且覆盖跳过统一响应包装的路由
    response.header(CommonConstant.REQUEST_ID_HEADER, request[CommonConstant.REQUEST_ID])

    // 记录请求进入时刻：绑定到请求对象，供响应耗时（duration）统计使用
    request[CommonConstant.REQUEST_START_TIME] = Date.now()

    // 从请求中获取用户信息，设置到当前请求上下文
    const user = request[CommonConstant.JWT_PAYLOAD] ?? ({} as AuthType.JwtPayload)
    UserContext.setCurrentUser(user.username ?? 'admin')

    // 打印请求信息（解决替换 Winston 后开发环境无日志的问题）
    this.printRequestInfo(request)

    // 继续执行后续中间件 / 路由处理
    next()
  }

  private printRequestInfo(request: ExpressRequest) {
    // console.log('request: ', request)
    const query = request.query
    const body = request.body
    const keys = ['authorization', 'user-agent']
    const headers = keys.reduce((acc, key) => ({ ...acc, [key]: request.headers[key] }), {})
    const logInfo: Record<string, any> = {}
    logInfo.url = request.path || ''
    logInfo.method = request.method
    logInfo.requestId = request[CommonConstant.REQUEST_ID]
    if (query && Object.keys(query).length) logInfo.query = query
    if (body && Object.keys(body).length) logInfo.body = body
    this.logger.log(JSON.stringify(Object.assign({}, logInfo, headers)))
  }
}
