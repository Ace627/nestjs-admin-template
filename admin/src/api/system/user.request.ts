import { request } from '@/utils/request'
import type { Loginlog, User } from '@/types'

export class UserRequest {
  /** 新建用户 */
  static create(data: User.UserForm): Promise<string> {
    return request.post('/system/user/create', data)
  }

  /** 批量删除用户（ids 为逗号拼接字符串，后端 ParseArrayPipe 接收） */
  static delete(params: { ids: string }): Promise<string> {
    return request.delete('/system/user/delete', { params })
  }

  /** 编辑用户（username/password 由后端 @Exclude 拦截，不会生效） */
  static update(data: User.UserForm): Promise<string> {
    return request.put('/system/user/update', data)
  }

  /** 重置密码（按用户名定位，重置成功后强制该用户重新登录） */
  static resetPassword(data: { username: string; password: string }): Promise<string> {
    return request.put('/system/user/resetPassword', data)
  }

  /** 查询用户分页列表 */
  static findList(params: User.UserQuery): PaginationResult<User.SysUser> {
    return request.get('/system/user/list', { params })
  }

  /** 根据 id 查找用户详情（含关联角色，用于回填 roleIds） */
  static findDetail(params: { id: string }): Promise<User.SysUser> {
    return request.get('/system/user/detail', { params })
  }

  /** 修改密码 */
  static updatePassword(data: User.UpdatePasswordParams): Promise<string> {
    return request.put('/system/user/updatePassword', data)
  }

  /** 查询用户个人信息 */
  static getProfile(): Promise<User.UserProfile> {
    return request.get('/system/user/profile')
  }

  /** 修改用户个人信息 */
  static updateProfile(data: User.UserProfile): Promise<string> {
    return request.put('/system/user/profile/update', data)
  }

  /** 查询当前登录用户的登录日志（个人中心用） */
  static findMyLoginlogs(params: Loginlog.QueryParams): PaginationResult<Loginlog.Item> {
    return request.get('/monitor/log/loginlog/self', { params })
  }
}
