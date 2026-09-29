export interface MenuItem extends BaseEntity {
  /** 主键ID */
  id: string
  /** 上级菜单ID（0 表示根节点） */
  parentId: string
  /** 路由地址（外链为 http(s):// 开头） */
  path?: string
  /** 组件路径（仅菜单类型） */
  component?: string
  /** 菜单类型（M 目录 / C 菜单 / F 按钮） */
  menuType: string
  /** 菜单图标（SvgIcon 名称） */
  icon?: string
  /** 菜单名称 */
  menuName?: string
  /** 是否可见（1 显示 / 0 隐藏） */
  visible: string
  /** 权限字符（如 system:user:create，仅菜单/按钮类型） */
  permission?: string
  /** 状态（1 正常 / 0 停用） */
  status: string
  /** 显示顺序 */
  menuSort: number
  /** 是否缓存组件（1 是 / 0 否，仅菜单类型） */
  isCache: string
  /** 打开方式（1 当前页 / 2 新标签页） */
  target?: string
  /** 子菜单（后端 list 接口返回的树形结构） */
  children?: MenuItem[]
}

export interface MenuQuery {
  menuName?: string
  menuType?: string
  status?: string
}

/** 上级菜单下拉树节点（list/parent 接口返回，根节点为「主类目」） */
export interface ParentItem {
  id: string
  parentId: string
  menuName: string
  children: ParentItem[]
}

export type MenuForm = Partial<MenuItem>

/** 排序保存项 */
export interface SortItem {
  id: string
  menuSort: number
}
