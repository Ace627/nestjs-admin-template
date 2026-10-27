import { HttpException, HttpStatus } from '@nestjs/common'

/**
 * 自定义 API 异常类，继承自 NestJS 内置的 HttpException
 * 用于统一处理业务逻辑异常，支持自定义错误码和错误消息
 * 与全局异常过滤器配合使用，返回标准化的错误响应
 */
export class BusinessException extends HttpException {
  /**
   * 业务错误码，取值参考 HTTP 状态码。
   * 统一响应中由 code 承载成功/失败语义：
   * 未传 code 时 HTTP 状态默认为 200、code 默认为 500；
   * 传入 code 时 HTTP 状态码与 code 取同一值。
   */
  private code: number

  /**
   * 构造函数：创建自定义异常实例
   * @param message 错误提示消息（将返回给客户端）
   * @param code 业务错误码（默认：500 服务器内部错误）
   */
  constructor(message: string, code?: number) {
    super(message, code ?? HttpStatus.OK)
    this.code = code ?? HttpStatus.INTERNAL_SERVER_ERROR
  }

  getCode(): number {
    return this.code
  }
}
