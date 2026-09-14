/** RBAC 相关共享类型 */

/** user:roles:{userId} 缓存结构（AuthService.getInfo 写入，守卫/拦截器消费） */
export interface UserRoleCache {
  /** 角色 ID */
  id: string
  /** 角色编码（超管判定依据） */
  roleCode: string
}

/** sys:role:perms:{roleId} 缓存结构：string[]（该角色全部按钮权限标识） */

/** sys:role:depts:{roleId} 缓存结构（RoleService 维护，数据权限拦截器消费） */
export interface RoleScopeCache {
  /** 数据范围档位（1全部 2自定义 3本部门 4本部门及以下 5仅本人） */
  dataScope: string
  /** 仅 dataScope = '2'（自定义）时有值，来源 sys_role_dept 配置 */
  deptIds: string[]
}
