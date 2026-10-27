import { request } from '@/utils/request'
import type { Menu } from '@/types'

export class MenuRequest {
  /** 新建菜单（C 菜单下不能挂子级，path/permission 由后端做唯一校验） */
  static create(data: Menu.MenuForm): Promise<string> {
    return request.post('/system/menu/create', data)
  }

  /** 批量删除菜单（存在子菜单时后端拦截；ids 为逗号拼接字符串，后端 ParseArrayPipe 接收） */
  static delete(params: { ids: string }): Promise<string> {
    return request.delete('/system/menu/delete', { params })
  }

  /** 编辑菜单（上级不能为自己或自己的子孙） */
  static update(data: Menu.MenuForm): Promise<string> {
    return request.put('/system/menu/update', data)
  }

  /** 批量保存菜单排序（空数组时后端校验拒绝） */
  static updateSort(data: Menu.SortItem[]): Promise<string> {
    return request.put('/system/menu/update/sort', data)
  }

  /** 查询菜单树形列表（后端返回树形结构，含按钮与停用） */
  static findList(params: Menu.MenuQuery): Promise<Menu.MenuItem[]> {
    return request.get('/system/menu/list', { params })
  }

  /** 查询上级菜单下拉树（排除按钮与停用，根节点为「主类目」） */
  static findParentList(): Promise<Menu.ParentItem[]> {
    return request.get('/system/menu/list/parent')
  }

  /** 根据 id 查找菜单详情 */
  static findDetail(params: { id: string }): Promise<Menu.MenuItem> {
    return request.get('/system/menu/detail', { params })
  }
}
