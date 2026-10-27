import { isEmpty } from '@/utils'
import { HttpStatus } from '@nestjs/common'

/**
 * 全局统一响应结果封装类
 * @description 标准化接口返回格式，包含状态码、提示信息、自定义数据，适配前后端交互的统一规范
 * @example
 * // 成功响应（带数据）
 * return AjaxResult.success({ list: [1,2,3] }, '查询成功');
 * // 成功响应（无数据）
 * return AjaxResult.success(null, '操作成功');
 * // 失败响应（默认500）
 * return AjaxResult.error('服务器内部错误');
 * // 失败响应（自定义状态码）
 * return AjaxResult.error('参数错误', 400);
 */
export class AjaxResult {
  /**
   * 响应状态码
   * @description 遵循HTTP状态码规范：200=成功，4xx=客户端错误，5xx=服务端错误
   * @example 200 | 400 | 401 | 500
   */
  readonly code: number

  /**
   * 响应提示信息
   * @description 前端可直接展示给用户的友好提示文本
   * @example "请求成功" | "参数格式错误" | "登录过期，请重新登录"
   */
  readonly message: string;

  /**
   * 自定义扩展字段
   * @description 支持动态添加任意键值对数据（如业务数据、分页信息等）
   * @example { list: [], total: 100 } | { id: 1, name: "测试" }
   */
  [key: string]: any

  /**
   * 构造函数（私有化，建议通过静态方法 success/error 创建实例）
   * @param code 响应状态码
   * @param message 响应提示信息
   * @param data 自定义业务数据（会合并为实例的扩展字段）
   */
  private constructor(code: number, message: string, data: any) {
    this.code = code
    this.message = message
    // 仅当数据不为空时合并，避免空数据导致多余的空字段
    // 将自定义数据合并到实例中，支持多字段扩展
    if (!isEmpty(data)) Object.assign(this, data)
  }

  /**
   * 创建成功响应实例
   * @param data 自定义业务数据（可选，默认null）
   * @param message 成功提示信息（可选，默认"请求成功"）
   * @returns AjaxResult 成功响应实例
   */
  static success(data?: any, message = '请求成功') {
    return new AjaxResult(HttpStatus.OK, message, data)
  }

  /**
   * 创建失败响应实例
   * @param message 失败提示信息（可选，默认"请求失败"）
   * @param code 失败状态码（可选，默认500）
   * @returns AjaxResult 失败响应实例
   */
  static error(message = '请求失败', code = HttpStatus.INTERNAL_SERVER_ERROR) {
    return new AjaxResult(code, message, null)
  }
}
