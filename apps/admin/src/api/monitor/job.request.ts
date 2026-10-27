import { request } from '@/utils/request'
import type { Job } from '@/types'

export class JobRequest {
  /** 新增定时任务 */
  static create(data: Partial<Job.Item>): Promise<string> {
    return request.post('/monitor/job/create', data)
  }

  /** 修改定时任务 */
  static update(data: Partial<Job.Item>): Promise<string> {
    return request.put('/monitor/job/update', data)
  }

  /** 删除定时任务 */
  static delete(params: { ids: string }): Promise<string> {
    return request.delete('/monitor/job/delete', { params })
  }

  /** 任务状态修改 */
  static changeStatus(data: Job.ChangeStatusParams): Promise<string> {
    return request.put('/monitor/job/changeStatus', data)
  }

  /** 查询定时任务分页列表 */
  static findList(params: Job.QueryParams): PaginationResult<Job.Item> {
    return request.get('/monitor/job/list', { params })
  }

  /** 根据任务编号查询任务详情 */
  static findOneById(params: { id: string }): Promise<Job.Item> {
    return request.get('/monitor/job/detail', { params })
  }

  /** 执行一次定时任务 */
  static run(data: Job.RunParams): Promise<string> {
    return request.put('/monitor/job/run', data)
  }
}
