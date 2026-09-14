import { request } from '@/utils/request'
import type { JobLog } from '@/types'

export class JobLogRequest {
  /** 分页查询定时任务日志 */
  static findList(params: JobLog.QueryParams): PaginationResult<JobLog.Item> {
    return request.get('/monitor/job/log/list', { params })
  }

  /** 删除任务日志 */
  static delete(params: { ids: string }): Promise<string> {
    return request.delete('/monitor/job/log/delete', { params })
  }

  /** 清空调度日志 */
  static clear(): Promise<string> {
    return request.delete('/monitor/job/log/clear')
  }

  /** 导出任务调度日志（按查询条件全量导出） */
  static export(params: JobLog.QueryParams) {
    return request.post('/monitor/job/log/export', {}, { params, responseType: 'blob' })
  }
}
