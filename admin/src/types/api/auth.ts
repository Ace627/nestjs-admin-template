import type { SysUser } from '@/types/api/system/user'

/** 验证码响应数据 */
export interface CaptchaResult {
  /** 验证码开关（false 时登录页隐藏验证码输入框） */
  enabled: boolean
  /** 验证码唯一标识（关闭时为空字符串） */
  uuid: string
  /** 验证码图片（关闭时为空字符串） */
  captcha: string
}

export interface LoginParams {
  /** 登录账号 */
  username: string
  /** 登录密码 */
  password: string
  /** 验证码 */
  captcha: string
  /** 验证码唯一标识 */
  uuid: string
}

/** 登录响应数据 */
export interface LoginResult {
  /** 访问令牌 */
  accessToken: string
  /** 过期时间 */
  expiresIn: number
}

/** 获取登录者信息 */
export interface CurrentUserInfo {
  user: SysUser
  roles: string[]
  permissions: string[]
}
