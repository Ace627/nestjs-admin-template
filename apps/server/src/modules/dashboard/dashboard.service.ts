import dayjs from 'dayjs'
import { InjectRepository } from '@nestjs/typeorm'
import { Injectable } from '@nestjs/common'
import { Repository } from 'typeorm'
import { RedisService } from '@/shared/redis.service'
import { CommonConstant, LoginLogEntity, OperlogEntity, RedisConstant, RoleEntity, UserEntity } from '@/common'

@Injectable()
export class DashboardService {
  constructor(
    private readonly redisService: RedisService,
    @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity) private readonly roleRepository: Repository<RoleEntity>,
    @InjectRepository(LoginLogEntity) private readonly loginlogRepository: Repository<LoginLogEntity>,
    @InjectRepository(OperlogEntity) private readonly operlogRepository: Repository<OperlogEntity>,
  ) {}

  /** 首页统计数据 */
  public async getStatistics() {
    const startTime = dayjs().subtract(6, 'day').startOf('day').format('YYYY-MM-DD HH:mm:ss')
    const [userCount, roleCount, tokenKeyList, loginGroups, operGroups] = await Promise.all([
      this.userRepository.count(),
      this.roleRepository.count(),
      this.redisService.scan(`${RedisConstant.ACCESS_TOKEN_KEY}:*`),
      this.loginlogRepository
        .createQueryBuilder('loginlog')
        .select(['SUBSTRING(loginlog.loginTime, 1, 10) AS date', 'loginlog.status AS status', 'COUNT(*) AS count'])
        .where('loginlog.loginTime >= :startTime', { startTime })
        .groupBy('date')
        .addGroupBy('loginlog.status')
        .getRawMany<{ date: string; status: string; count: string }>(),
      this.operlogRepository
        .createQueryBuilder('operlog')
        .select(['SUBSTRING(operlog.operTime, 1, 10) AS date', 'COUNT(*) AS count'])
        .where('operlog.operTime >= :startTime', { startTime })
        .groupBy('date')
        .getRawMany<{ date: string; count: string }>(),
    ])

    const loginTrend = this.getRecentDayList().map((day) => {
      const date = day.format('YYYY-MM-DD')
      const countByStatus = (status: string) =>
        Number(loginGroups.find((item) => item.date === date && item.status === status)?.count ?? 0)
      return {
        date,
        successCount: countByStatus(CommonConstant.STATUS_NORMAL),
        failCount: countByStatus(CommonConstant.STATUS_DISABLE),
      }
    })

    const operTrend = this.getRecentDayList().map((day) => {
      const date = day.format('YYYY-MM-DD')
      return { date, count: Number(operGroups.find((item) => item.date === date)?.count ?? 0) }
    })

    return {
      userCount,
      roleCount,
      onlineCount: tokenKeyList.length,
      todayLoginCount: loginTrend.at(-1)!.successCount,
      loginTrend,
      operTrend,
    }
  }

  /** 近 7 天日期列表（含今天，升序） */
  private getRecentDayList() {
    return Array.from({ length: 7 }, (_, index) => dayjs().subtract(6 - index, 'day'))
  }
}
