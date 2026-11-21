import { BusinessException, CommonConstant, ConfigConstant, RedisConstant } from '@/common'
import { Injectable } from '@nestjs/common'
import { RedisService } from '@/shared/redis.service'
import { QueryOnlineDto, ForceLogoutDto } from './online.dto'
import { DeptService } from '@/modules/system/dept/dept.service'
import { UserService } from '@/modules/system/user/user.service'
import { formatTime } from '@/utils'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class OnlineService {
  constructor(
    private readonly redisService: RedisService,
    private readonly userService: UserService,
    private readonly deptService: DeptService,
    private readonly configService: ConfigService,
  ) {}

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

  /** 在线会话详情（用户/角色/部门实时查库，会话时间线取 Redis 记录 + TTL 反推最后活跃） */
  public async findDetail(userId: string, uuid: string, currentUuid: string) {
    const key = `${RedisConstant.ADMIN_USER_ONLINE_KEY}:${userId}:${uuid}`
    const jsonStr = await this.redisService.get(key)
    if (!jsonStr) throw new BusinessException('该会话已结束')
    const record = JSON.parse(jsonStr)
    const user = await this.userService.findOneById(userId)
    const dept = user.deptId && user.deptId !== CommonConstant.DEFAULT_PARENT_ID ? await this.deptService.findOneById(user.deptId) : null
    // JwtStrategy 每次请求都把在线键 TTL 重置为 JWT_EXPIRES_IN，用剩余 TTL 反推最后活跃时间，无需每请求写 Redis
    const ttl = await this.redisService.ttl(key)
    const expiresIn = this.configService.getOrThrow<number>(ConfigConstant.JWT_EXPIRES_IN)
    const lastActiveTime = ttl > 0 ? formatTime(new Date(Date.now() - (expiresIn - ttl) * 1000)) : record.loginTime
    const roleNames = (user.roles ?? []).filter((role) => role.status === CommonConstant.STATUS_NORMAL).map((role) => role.roleName)
    return { ...record, realname: user.realname || '-', deptName: dept?.deptName || '-', roleNames, isCurrentSession: uuid === currentUuid, lastActiveTime }
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
