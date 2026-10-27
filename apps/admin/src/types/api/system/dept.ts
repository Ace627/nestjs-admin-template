export interface DeptItem extends BaseEntity {
  /** 主键ID */
  id: string
  /** 父部门ID（0 表示根部门） */
  parentId: string
  /** 祖级列表（如 0,101,102） */
  ancestors: string
  /** 部门名称 */
  deptName: string
  /** 负责人 */
  leader?: string
  /** 联系电话 */
  phone?: string
  /** 邮箱 */
  email?: string
  /** 显示顺序 */
  deptSort: number
  /** 状态（1 正常 / 0 停用） */
  status: string
  /** 子部门（list/tree 接口返回的树形结构） */
  children?: DeptItem[]
}

export interface DeptQuery {
  deptName?: string
  status?: string
}

export type DeptForm = Partial<DeptItem>

/** 排序保存项 */
export interface SortItem {
  id: string
  deptSort: number
}
