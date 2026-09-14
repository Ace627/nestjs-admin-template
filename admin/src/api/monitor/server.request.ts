import type { Server } from '@/types'
import { request } from '@/utils/request'

export class ServerRequest {
  /** 获取服务器监控信息 */
  static getServer(): Promise<Server.Info> {
    return request.get('/monitor/server')
  }

  /** 获取数据库连接池状态 */
  static getPool(): Promise<Server.Pool> {
    return request.get('/monitor/server/pool')
  }
}
