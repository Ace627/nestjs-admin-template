import type { Dashboard } from '@/types'
import { request } from '@/utils/request'

export abstract class DashboardRequest {
  /** 获取首页统计数据 */
  static getStatistics(): Promise<Dashboard.Statistics> {
    return request.get(`/dashboard/statistics`)
  }
}
