import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { Reflector } from '@nestjs/core'
import { getLocationByIP, getRequestIp, formatTime } from '@/utils'
import { LogService } from '@/modules/monitor/log/log.service'
import { OperlogOption } from '../decorator/operlog.decorator'
import { AjaxResult, AllExceptionsFilter, OperlogEntity, DecoratorConstant, CommonConstant } from '..'
import { CallHandler, ExecutionContext, HttpStatus, Injectable, Logger, NestInterceptor, StreamableFile } from '@nestjs/common'
import { AuthType } from '@/types'

@Injectable()
export class OperlogInterceptor implements NestInterceptor {
  private logger = new Logger(OperlogInterceptor.name)
  private readonly allExceptionsFilter = new AllExceptionsFilter()

  constructor(
    private readonly reflector: Reflector,
    private readonly logService: LogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap({
        next: (data) => {
          this.log(context, data)
        },
        error: (error) => {
          const result = this.allExceptionsFilter.analyzeException(error)
          this.log(context, result)
        },
      }),
    )
  }

  /* 记录操作日志 */
  async log(context: ExecutionContext, data: AjaxResult) {
    const logOption = this.reflector.get<OperlogOption>(DecoratorConstant.OPERLOG, context.getHandler())
    if (!logOption) return
    const request = context.switchToHttp().getRequest<ExpressRequest>()
    const paylaod: AuthType.JwtPayload = request[CommonConstant.JWT_PAYLOAD]
    const isSuccess = data && data.code === HttpStatus.OK
    const record = new OperlogEntity()
    record.requestId = request[CommonConstant.REQUEST_ID] // 从请求上下文获取请求 ID
    // 请求耗时
    const requestStartTime = request[CommonConstant.REQUEST_START_TIME]
    record.duration = requestStartTime ? Date.now() - requestStartTime : 0
    // 系统模块
    record.title = logOption.title
    // 操作人员
    if (paylaod.username) record.username = paylaod.username
    if (paylaod.userId) record.userId = paylaod.userId
    // 请求参数
    const params = {}
    if (request.query) params['query'] = request.query
    if (request.body) params['body'] = request.body
    record.params = JSON.stringify(params, null, 2)
    // 操作状态
    record.status = isSuccess || data instanceof StreamableFile ? CommonConstant.STATUS_NORMAL : CommonConstant.STATUS_DISABLE
    // 请求地址
    record.url = request.path
    // 业务类型
    if (logOption.businessType) record.businessType = logOption.businessType
    // 请求方式
    record.requestMethod = request.method.toUpperCase()
    // 方法名称
    record.method = `${context.getClass().name}.${context.getHandler().name}`
    // 请求ip
    record.ip = getRequestIp(request)
    // 请求地址
    record.location = await getLocationByIP(record.ip)
    // 请求时间
    record.operTime = formatTime()
    this.logService.createOperLog(record).catch((error: unknown) => this.logger.error(error instanceof Error ? error.message + ';' + error.stack : String(error)))
  }
}
