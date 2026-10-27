export interface SysUser extends BaseEntity {
  /** 主键ID */
  id: string
  /** 用户账号（唯一，编辑时不可改） */
  username: string
  /** 登录密码（仅新增时提交） */
  password?: string
  /** 归属部门ID（必填） */
  deptId?: string
  /** 角色 ID 组（必填） */
  roleIds?: string[]
  /** 关联角色（详情接口返回，用于回填 roleIds） */
  roles?: { id: string; roleCode: string; roleName: string }[]
  /** 用户昵称 */
  nickname?: string
  /** 真实姓名 */
  realname?: string
  /** 年龄 */
  age?: number
  /** 用户邮箱 */
  email?: string
  /** 手机号码（唯一） */
  phone?: string
  /** 性别（0 男 / 1 女 / 2 未知） */
  gender?: string
  /** 状态（1 正常 / 0 停用） */
  status?: string
  /** 用户头像 */
  avatar?: string
  /** 备注 */
  remark?: string
  /** 最后登录时间 */
  loginTime?: string
}

export interface UserQuery {
  pageNo: number
  pageSize: number
  username?: string
  nickname?: string
  phone?: string
  status?: string
  /** 归属部门ID（过滤该部门及其子孙部门） */
  deptId?: string
}

export type UserForm = Partial<SysUser>

export interface UpdatePasswordParams {
  /** 旧密码 */
  oldPassword: string
  /** 新密码 */
  newPassword: string
  /** 确认新密码 */
  repeatPassword: string
}

export interface UserProfile {
  /** 用户昵称 */
  nickname?: string
  /** 真实姓名 */
  realname?: string
  /** 年龄 */
  age?: number
  /** 手机号码 */
  phone?: string
  /** 用户邮箱 */
  email?: string
  /** 性别（0 男 / 1 女 / 2 未知） */
  gender?: string
  /** 用户头像 */
  avatar?: string
  /** 创建时间 */
  createTime?: string
  /** 所属角色名组 */
  roleGroup?: string[]
}
