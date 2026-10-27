import type { Auth, Menu } from '@/types'
import { request } from '@/utils/request'

export abstract class AuthRequest {
  /** 获取验证码 */
  static getCaptcha(): Promise<Auth.CaptchaResult> {
    return request.get(`/auth/captcha`)
  }

  /** 登录 */
  static login(data: Auth.LoginParams): Promise<Auth.LoginResult> {
    return request.post(`/auth/login`, data)
  }

  /** 刷新令牌 */
  static refreshToken(data: Auth.RefreshTokenParams): Promise<Auth.LoginResult> {
    return request.post(`/auth/refreshToken`, data)
  }

  /** 获取登录者信息 */
  static getInfo(): Promise<Auth.CurrentUserInfo> {
    return request.get(`/auth/getInfo`)
  }

  /** 获取登录用户可访问的路由菜单（扁平列表，前端 generateRoutes 建树） */
  static getRoutes(): Promise<Menu.MenuItem[]> {
    return request.get(`/auth/getRoutes`)
  }

  /** 退出登录 */
  static logout(): Promise<string> {
    return request.post(`/auth/logout`)
  }
}
