import { RedisConstant } from '@/common'
import { Injectable } from '@nestjs/common'
import { RedisService } from '@/shared/redis.service'
import { QueryOnlineDto, ForceLogoutDto } from './online.dto'

@Injectable()
export class OnlineService {
  constructor(private readonly redisService: RedisService) {}

  /**分页列表查询（先按条件过滤，total 与 records 同口径，再切页） */
  public async findList(queryParams: QueryOnlineDto) {
    const { take = 10, skip = 0, username = '', location = '', ip = '' } = queryParams
    // 获取所有在线 token 键并读取对应的在线数据（键可能因过期不同步而缺失，须过滤 null 防解析崩溃）
    const tokenKeyList = await this.redisService.scan(`${RedisConstant.ACCESS_TOKEN_KEY}:*`)
    const onlineKeyList = tokenKeyList.map((key) => key.replace(`${RedisConstant.ACCESS_TOKEN_KEY}:`, `${RedisConstant.ADMIN_USER_ONLINE_KEY}:`))
    const onlineJsonList = await Promise.all(onlineKeyList.map((key) => this.redisService.get(key)))
    let records: Record<string, any>[] = onlineJsonList.filter((item): item is string => item !== null).map((item) => JSON.parse(item))
    if (username) records = records.filter((item) => item.username.includes(username))
    if (location) records = records.filter((item) => item.location.includes(location))
    if (ip) records = records.filter((item) => item.ip.includes(ip))
    const total = records.length
    return { total, records: records.slice(skip, skip + take) }
  }

  /** 查询在线用户数量 */
  public async findCount() {
    const tokenKeyList = await this.redisService.scan(`${RedisConstant.ACCESS_TOKEN_KEY}:*`)
    return tokenKeyList.length
  }

  /** 强制用户退出登录，清除与该用户相关的所有 Redis 缓存 */
  public async forceLogout(data: ForceLogoutDto) {
    const { userId, uuid } = data
    const tokenPattern = `${RedisConstant.ACCESS_TOKEN_KEY}:${userId}:${uuid}` // 登录token
    const refreshTokenPattern = `${RedisConstant.REFRESH_TOKEN_KEY}:${userId}:${uuid}` // 刷新token（不删则被踢用户可刷新复活会话）
    const onlinePattern = `${RedisConstant.ADMIN_USER_ONLINE_KEY}:${userId}:${uuid}` // 在线状态
    await this.redisService.del(tokenPattern, refreshTokenPattern, onlinePattern)
    return '强退成功'
  }
}
