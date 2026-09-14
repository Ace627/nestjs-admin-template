import { request } from '@/utils/request'
import type { Dict } from '@/types'

export class DictRequest {
  /* ----------------------------- 字典类型 ----------------------------- */

  /** 新建字典类型 */
  static createType(data: Dict.TypeForm): Promise<string> {
    return request.post('/system/dict/type/create', data)
  }

  /** 删除字典类型（ids 为逗号拼接字符串，后端 ParseArrayPipe 接收） */
  static deleteType(params: { ids: string }): Promise<string> {
    return request.delete('/system/dict/type/delete', { params })
  }

  /** 编辑字典类型（dictType 可改，后端事务内级联同步字典数据与缓存） */
  static updateType(data: Dict.TypeForm): Promise<string> {
    return request.put('/system/dict/type/update', data)
  }

  /** 查询字典类型分页列表 */
  static findTypeList(params: Dict.TypeQuery): PaginationResult<Dict.TypeItem> {
    return request.get('/system/dict/type/list', { params })
  }

  /** 根据 id 查找字典类型详情 */
  static findTypeDetail(params: { id: string }): Promise<Dict.TypeItem> {
    return request.get('/system/dict/type/detail', { params })
  }

  /* ----------------------------- 字典数据 ----------------------------- */

  /** 新建字典数据 */
  static createData(data: Dict.DataForm): Promise<string> {
    return request.post('/system/dict/data/create', data)
  }

  /** 删除字典数据 */
  static deleteData(params: { ids: string }): Promise<string> {
    return request.delete('/system/dict/data/delete', { params })
  }

  /** 编辑字典数据 */
  static updateData(data: Dict.DataForm): Promise<string> {
    return request.put('/system/dict/data/update', data)
  }

  /** 查询字典数据分页列表 */
  static findDataList(params: Dict.DataQuery): PaginationResult<Dict.DataItem> {
    return request.get('/system/dict/data/list', { params })
  }

  /** 根据 id 查找字典数据详情 */
  static findDataDetail(params: { id: string }): Promise<Dict.DataItem> {
    return request.get('/system/dict/data/detail', { params })
  }

  /** 根据字典类型编码获取字典下拉数据（前端 useDict 使用） */
  static findByType(params: { dictType: string }): Promise<Dict.DataItem[]> {
    return request.get('/system/dict/data/type', { params })
  }

  /** 刷新字典缓存（清空服务端全部字典缓存，下次查询回源重建） */
  static clearCache(): Promise<number> {
    return request.delete('/system/dict/cache')
  }
}
