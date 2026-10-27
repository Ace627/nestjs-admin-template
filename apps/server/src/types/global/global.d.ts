import type { Multer } from 'multer'
import type { CustomProcessEnv } from './process-env'
import type { Request, Response, NextFunction } from 'express'

/**
 * 全局类型定义
 */
declare global {
  namespace NodeJS {
    interface ProcessEnv extends CustomProcessEnv {}
  }
  /**
   * Express 请求对象类型别名
   * - 说明：用于描述 HTTP 请求的完整信息，包含请求路径、请求参数、请求头、请求体、Cookie 等核心内容
   * - 用途：通常用于定义 Express 接口的请求参数类型，约束和解析请求数据
   */
  type ExpressRequest = Request

  /**
   * Express 响应对象类型别名
   * - 说明：用于描述 HTTP 响应的配置信息，包含响应状态码、响应头、响应体、重定向等核心功能
   * - 用途：通常用于定义 Express 接口的响应格式，返回指定结构的数据给客户端
   */
  type ExpressResponse = Response

  /**
   * Express 下一个函数类型别名
   * - 说明：用于描述 Express 中间件的下一个处理函数，用于传递请求到下一个中间件或路由处理函数
   * - 用途：通常用于定义 Express 中间件的参数类型，约束和解析中间件逻辑
   */
  type ExpressNextFunction = NextFunction

  /**
   * Express Multer 文件对象类型别名
   * - 说明：用于描述 Multer 中间件处理的文件对象，包含文件路径、文件名、文件大小、文件类型等核心信息
   * - 用途：通常用于定义 Multer 中间件处理的文件参数类型，约束和解析上传文件数据
   */
  type ExpressMulterFile = Multer.File
}
