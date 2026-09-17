import type { Config } from '@/types'
import { request } from '@/utils/request'

export class ConfigRequest {
  /** 新建参数 */
  static create(data: Config.Form): Promise<string> {
    return request.post('/system/config/create', data)
  }

  /** 删除参数（ids 为逗号拼接字符串，后端 ParseArrayPipe 接收） */
  static delete(params: { ids: string }): Promise<string> {
    return request.delete('/system/config/delete', { params })
  }

  /** 编辑参数（内置参数的键名后端拒绝修改） */
  static update(data: Config.Form): Promise<string> {
    return request.put('/system/config/update', data)
  }

  /** 查询参数分页列表 */
  static findList(params: Config.Query): PaginationResult<Config.Item> {
    return request.get('/system/config/list', { params })
  }

  /** 根据 id 查找参数详情 */
  static findDetail(params: { id: string }): Promise<Config.Item> {
    return request.get('/system/config/detail', { params })
  }

  /** 按键名查询参数值（如新增用户的默认初始密码；参数不存在时返回 null） */
  static findValueByKey(params: { configKey: string }): Promise<string | null> {
    return request.get('/system/config/key', { params })
  }

  /** 刷新参数缓存（清空服务端全部参数缓存并回源重建） */
  static clearCache(): Promise<number> {
    return request.delete('/system/config/cache')
  }
}
