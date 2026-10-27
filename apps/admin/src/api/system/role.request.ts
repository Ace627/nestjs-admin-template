import { request } from '@/utils/request'
import type { Role } from '@/types'

export class RoleRequest {
  /** 新建角色（roleCode 为 admin 系统保留编码） */
  static create(data: Role.RoleForm): Promise<string> {
    return request.post('/system/role/create', data)
  }

  /** 批量删除角色（ids 为逗号拼接字符串，后端 ParseArrayPipe 接收） */
  static delete(params: { ids: string }): Promise<string> {
    return request.delete('/system/role/delete', { params })
  }

  /** 编辑角色（超管角色不可改编码/状态） */
  static update(data: Role.RoleForm): Promise<string> {
    return request.put('/system/role/update', data)
  }

  /** 切换角色状态（超管角色禁止停用） */
  static changeStatus(data: { id: string; status: string }): Promise<string> {
    return request.put('/system/role/changeStatus', data)
  }

  /** 查询角色分页列表 */
  static findList(params: Role.RoleQuery): PaginationResult<Role.RoleItem> {
    return request.get('/system/role/list', { params })
  }

  /** 查询全量正常状态角色（不分页，用户管理分配角色下拉用） */
  static findAll(): Promise<Role.RoleItem[]> {
    return request.get('/system/role/list/all')
  }

  /** 根据 id 查找角色详情 */
  static findDetail(params: { id: string }): Promise<Role.RoleItem> {
    return request.get('/system/role/detail', { params })
  }

  /** 查询角色已授权的菜单 ID 集合（超管角色返回全部菜单 ID） */
  static findPermission(params: { roleId: string }): Promise<string[]> {
    return request.get('/system/role/permission', { params })
  }

  /** 分配角色菜单权限（menuIds 需包含完全勾选与半选的父节点） */
  static authPermission(data: { roleId: string; menuIds: string[] }): Promise<string> {
    return request.post('/system/role/authPermission', data)
  }

  /** 查询角色数据范围及自定义部门 ID 组（数据权限回显用） */
  static findDataScope(params: { roleId: string }): Promise<Role.RoleDataScope> {
    return request.get('/system/role/dataScope', { params })
  }

  /** 设置角色数据范围（dataScope 为 '2' 自定义时 deptIds 必传且非空） */
  static updateDataScope(data: { id: string; dataScope: string; deptIds?: string[] }): Promise<string> {
    return request.put('/system/role/dataScope', data)
  }
}
