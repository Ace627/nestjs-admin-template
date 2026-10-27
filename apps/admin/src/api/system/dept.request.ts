import { request } from '@/utils/request'
import type { Dept } from '@/types'

export class DeptRequest {
  /** 查询部门树形列表（含停用，管理页用；按名称/状态过滤） */
  static findList(params: Dept.DeptQuery): Promise<Dept.DeptItem[]> {
    return request.get('/system/dept/list', { params })
  }

  /** 查询部门下拉树（仅正常状态，用户主部门/附属部门选择用） */
  static findTree(): Promise<Dept.DeptItem[]> {
    return request.get('/system/dept/tree')
  }

  /** 根据 id 查找部门详情 */
  static findDetail(params: { id: string }): Promise<Dept.DeptItem> {
    return request.get('/system/dept/detail', { params })
  }

  /** 新建部门 */
  static create(data: Dept.DeptForm): Promise<string> {
    return request.post('/system/dept/create', data)
  }

  /** 编辑部门（父级变更时后端事务内级联重算子孙祖级链） */
  static update(data: Dept.DeptForm): Promise<string> {
    return request.put('/system/dept/update', data)
  }

  /** 批量保存部门排序（空数组时后端校验拒绝） */
  static updateSort(data: Dept.SortItem[]): Promise<string> {
    return request.put('/system/dept/update/sort', data)
  }

  /** 批量删除部门（存在下级部门或挂有用户时后端拦截；ids 为逗号拼接字符串，后端 ParseArrayPipe 接收） */
  static delete(params: { ids: string }): Promise<string> {
    return request.delete('/system/dept/delete', { params })
  }
}
