import { request } from '@/utils/request'
import type { Operlog } from '@/types'

export class OperlogRequest {
  /** 查询操作日志列表 */
  static findList(params: Operlog.QueryParams): PaginationResult<Operlog.Item> {
    return request.get(`/monitor/log/operlog/list`, { params })
  }

  /** 清空操作日志 */
  static clear(): Promise<string> {
    return request.delete(`/monitor/log/operlog/clear`)
  }

  /** 删除操作日志 */
  static delete(params: { ids: string }): Promise<string> {
    return request.delete('/monitor/log/operlog/delete', { params })
  }

  /** 导出操作日志（按查询条件全量导出） */
  static export(params: Operlog.QueryParams) {
    return request.post('/monitor/log/operlog/export', {}, { params, responseType: 'blob' })
  }
}
