import { request } from '@/utils/request'
import type { LoginLock } from '@/types'

export abstract class LoginLockRequest {
  /** 查询登录失败锁定列表 */
  static findList(params: LoginLock.QueryParams): PaginationResult<LoginLock.Item> {
    return request.get(`/monitor/loginlock/list`, { params })
  }

  /** 解锁指定账号的指定来源 */
  static unlock(params: { username: string; ip: string }): Promise<string> {
    return request.delete(`/monitor/loginlock/unlock`, { params })
  }
}
