import { request } from '@/utils/request'
import type { Online } from '@/types'

export abstract class OnlineRequest {
  /** 查询在线用户列表 */
  static findList(params: Online.QueryParams): PaginationResult<Online.Item> {
    return request.get(`/monitor/online/list`, { params })
  }

  /** 查询在线用户数量 */
  static findCount(): Promise<number> {
    return request.get(`/monitor/online/count`)
  }

  /** 查询在线会话详情（用户名/部门/角色实时查库，会话时间线取 Redis 在线记录） */
  static findDetail(params: { userId: string; uuid: string }): Promise<Online.Detail> {
    return request.get(`/monitor/online/detail`, { params })
  }

  /** 强退用户 */
  static forceLogout(params: { userId: string; uuid: string }): Promise<string> {
    return request.delete(`/monitor/online/forceLogout`, { params })
  }
}
