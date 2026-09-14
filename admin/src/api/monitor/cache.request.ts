import type { Cache } from '@/types'
import { request } from '@/utils/request'

export class CacheRequest {
  /** 缓存监控（dbsize + Redis 信息 + 命令统计） */
  static getInfo(): Promise<Cache.Info> {
    return request.get(`/monitor/cache`)
  }

  /** 获取所有缓存分类名称 */
  static getNames(): Promise<Cache.Name[]> {
    return request.get(`/monitor/cache/names`)
  }

  /** 删除指定分类下的所有缓存，返回删除的键数量 */
  static clearNames(params: { name: string }): Promise<number> {
    return request.delete(`/monitor/cache/names/delete`, { params })
  }
  /** 缓存键名列表（指定分类下） */
  static getKeys(params: { name: string }): Promise<string[]> {
    return request.get(`/monitor/cache/keys`, { params })
  }

  /** 获取对应 key 的缓存数据（附带 TTL） */
  static getValue(params: { key: string }): Promise<Cache.Detail> {
    return request.get(`/monitor/cache/keys/detail`, { params })
  }

  /** 删除对应 key 的缓存数据，返回是否删除成功 */
  static clearKeys(params: { key: string }): Promise<boolean> {
    return request.delete(`/monitor/cache/keys/delete`, { params })
  }
}
