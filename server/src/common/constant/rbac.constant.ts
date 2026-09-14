/**
 * RBAC 权限常量
 * @description 统一管理菜单类型、数据权限范围、超级管理员判定等 RBAC 相关常量
 * @note 取值语义与 CommonConstant 保持同一心智模型：'1' = 是/正常，'0' = 否/停用
 */

/** 菜单类型 */
export const MenuType = {
  /** 目录：一级分组，无 component，仅用于侧边栏分组 */
  DIRECTORY: 'M',
  /** 菜单：真实路由页面，有 component，可挂权限标识 */
  MENU: 'C',
  /** 按钮：页面内操作，仅挂权限标识，无路由 */
  BUTTON: 'F',
} as const

/** 数据权限范围取值 */
export const DataScopeType = {
  /** 1 全部数据 */
  ALL: '1',
  /** 2 自定义数据（读 sys_role_dept 配置） */
  CUSTOM: '2',
  /** 3 仅本部门（主部门 + 附属部门，不含子部门） */
  DEPT: '3',
  /** 4 本部门及以下（含所有子孙部门） */
  DEPT_AND_BELOW: '4',
  /** 5 仅本人 */
  SELF: '5',
} as const

/** RBAC 判定常量 */
export const RbacConstant = {
  /**
   * 超级管理员角色编码
   * 唯一的超管判定依据（roleCode === 'admin'），禁止依赖用户 ID 判定
   */
  SUPER_ROLE_CODE: 'admin',
} as const
