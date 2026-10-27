import { request } from '@/utils/request'
import type { Loginlog } from '@/types'

export abstract class LoginlogRequest {
  /** 查询登录日志列表 */
  static findList(params: Loginlog.QueryParams): PaginationResult<Loginlog.Item> {
    return request.get(`/monitor/log/loginlog/list`, { params })
  }

  /** 清空登录日志 */
  static clear(): Promise<string> {
    return request.delete(`/monitor/log/loginlog/clear`)
  }

  /** 删除登录日志 */
  static delete(params: { ids: string }): Promise<string> {
    return request.delete('/monitor/log/loginlog/delete', { params })
  }

  /** 导出登录日志（按查询条件全量导出） */
  static export(params: Loginlog.QueryParams) {
    return request.post('/monitor/log/loginlog/export', {}, { params, responseType: 'blob' })
  }
}
