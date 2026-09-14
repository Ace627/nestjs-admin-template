import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { Reflector } from '@nestjs/core'
import { AjaxResult } from '../class/ajax-result.class'
import { CommonConstant, DecoratorConstant } from '@/common'
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpStatus } from '@nestjs/common'

/**
 * 全局响应格式转换拦截器
 * @description 自动将接口返回数据包装为标准化的 AjaxResult 格式，支持通过 @SkipTransform() 装饰器跳过包装
 */
@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
    const request = context.switchToHttp().getRequest<ExpressRequest>() // 获取请求上下文中的 request 对象
    const response = context.switchToHttp().getResponse<ExpressResponse>() // 获取请求上下文中的 response 对象

    const handler = context.getHandler()
    const controllerClass = context.getClass()

    // 若允许返回原始数据，直接返回，不做包装
    // 读取元数据：判断是否允许返回原始数据（优先级：方法级 > 类级）
    const skipTransform = this.reflector.getAllAndOverride<boolean>(DecoratorConstant.SKIP_TRANSFORM, [handler, controllerClass])
    if (skipTransform) return next.handle()

    return next.handle().pipe(
      map((data) => {
        // 标准化响应数据包装
        // 构建统一响应体（包含状态码、成功标识、提示信息、数据、时间戳）
        const currentTimestamp = Date.now()
        const requestId = request[CommonConstant.REQUEST_ID] // 从请求上下文获取请求 ID
        const requestStartTime = request[CommonConstant.REQUEST_START_TIME] ?? currentTimestamp
        const result = { code: HttpStatus.OK, message: '请求成功', requestId, data, timestamp: currentTimestamp, duration: currentTimestamp - requestStartTime }
        if (!response.headersSent) response.header('Content-Type', 'application/json; charset=utf-8')

        // 使用 AjaxResult 封装最终响应
        return AjaxResult.success(result)
      }),
    )
  }
}
