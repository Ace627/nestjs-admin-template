import { isArray, isString } from '@/utils'
import { BusinessException, CommonConstant } from '..'
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common'

/**
 * 全局异常过滤器
 * 功能：统一捕获所有类型异常，格式化响应输出，区分开发/生产环境日志，屏蔽敏感信息
 * 适用：HTTP 上下文（Express/Fastify），支持内置异常、自定义异常、系统异常
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private logger = new Logger(AllExceptionsFilter.name)
  // 缓存环境标识，避免重复读取环境变量
  private isDev = process.env.NODE_ENV === CommonConstant.DEVELOPMENT

  /**
   * 异常捕获与处理的核心方法
   * @param exception 捕获到的异常实例
   * @param host 上下文对象，用于获取请求/响应对象
   */
  catch(exception: any, host: ArgumentsHost) {
    // 切换到 HTTP 上下文，获取 Express 风格的请求和响应对象
    const context = host.switchToHttp()
    const request = context.getRequest<ExpressRequest>()
    const response = context.getResponse<ExpressResponse>()

    // 检查响应是否已结束，避免重复处理
    if (response.writableEnded) return

    // favicon.ico 找不到：不打日志，直接结束响应
    if (exception.name === 'NotFoundException' && request.path === '/favicon.ico') return response.status(HttpStatus.NO_CONTENT).end()

    const currentTimestamp = Date.now()
    const requestId = request[CommonConstant.REQUEST_ID] // 从请求上下文获取请求 ID
    const requestStartTime = request[CommonConstant.REQUEST_START_TIME] ?? currentTimestamp
    const { code, status, message } = this.analyzeException(exception)
    const { query, body } = request
    const rawContent = { query, body, message }
    const printContent = this.isDev ? JSON.stringify(rawContent) : rawContent
    this.logger.error(`${request.method} ${request.path} ${requestId}`)
    this.logger.error(printContent, exception.stack, AllExceptionsFilter.name)

    response.status(status)
    response.header('Content-Type', 'application/json; charset=utf-8')
    response.json({ code, message, requestId, data: null, timestamp: currentTimestamp, duration: currentTimestamp - requestStartTime })
  }

  /* 解析错误类型，获取状态码和返回值 */
  public analyzeException(exception: any) {
    // 获取 HTTP 状态码
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR
    // 获取 Business 状态码
    const code = exception instanceof BusinessException ? exception.getCode() : status
    const message = this.formatErrMsg(exception)
    return { status, code, message }
  }

  private formatErrMsg(exception: any) {
    let message = this.getExceptionMessage(exception)
    // 处理数据验证异常（DTO 管道校验失败）
    if (exception.name === 'BadRequestException') message = isArray(exception.response.message) ? exception.response.message[0] : exception.response.message
    // 处理请求频率限制异常（Throttler 模块）
    if (exception.name === 'ThrottlerException' || message.includes('status code 429')) message = '您的操作过于频繁，请稍后再试'
    // NotFoundException 处理资源未找到异常
    if (exception.name === 'NotFoundException') message = '请求的接口不存在，请检查接口地址或请求方法'
    // 数据库连接异常
    if (exception.code === 'ECONNRESET' && exception.driverError) message = '数据库连接异常，请联系管理员'
    // 处理数据库外键约束异常
    // if (message.includes('foreign key constraint fails')) message = '数据库存在外键约束，导致操作失败'
    if (message.includes('foreign key constraint fails')) message = '当前数据关联其它资源，无法执行该操作'
    // 兜底提示（避免空信息）
    return message || '服务器内部错误，请稍后重试'
  }

  /**
   * 获取原始异常信息
   * @param exception 异常实例
   * @returns string 原始异常信息
   */
  private getExceptionMessage(exception: unknown): string {
    if (exception instanceof Error) return exception.message
    if (isString(exception)) return exception
    return JSON.stringify(exception)
  }
}
