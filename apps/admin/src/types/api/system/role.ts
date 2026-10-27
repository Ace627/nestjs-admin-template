export interface RoleItem extends BaseEntity {
  /** 主键ID */
  id: string
  /** 角色编码（唯一，admin 为系统保留；编辑时不可改） */
  roleCode: string
  /** 角色名称 */
  roleName: string
  /** 角色排序 */
  roleSort: number
  /** 数据范围（1 全部 2 自定义 3 本部门 4 本部门及以下 5 仅本人） */
  dataScope: string
  /** 状态（1 正常 / 0 停用） */
  status: string
  /** 备注 */
  remark?: string
}

export interface RoleQuery {
  pageNo: number
  pageSize: number
  roleCode?: string
  roleName?: string
  status?: string
}

export type RoleForm = Partial<RoleItem>

/** 角色数据范围及自定义部门 ID 组（GET /system/role/dataScope 返回） */
export interface RoleDataScope {
  /** 数据范围档位（1 全部 2 自定义 3 本部门 4 本部门及以下 5 仅本人） */
  dataScope: string
  /** 仅 dataScope = '2'（自定义）时有值，其余档位为空数组 */
  deptIds: string[]
}
