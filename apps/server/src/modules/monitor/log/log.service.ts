import { UAParser } from 'ua-parser-js'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { RedisService } from '@/shared/redis.service'
import { Injectable, StreamableFile } from '@nestjs/common'
import { QueryLoginlogDto, QueryOperlogDto } from './log.dto'
import { formatTime, getLocationByIP, getRequestIp } from '@/utils'
import { Equal, FindOptionsWhere, In, LessThan, Like, Repository } from 'typeorm'
import { ExcelService } from '@/modules/common/excel/excel.service'
import { BusinessException, CommonConstant, ConfigConstant, JobLogEntity, LoginLogEntity, OperlogEntity, RedisConstant } from '@/common'

@Injectable()
export class LogService {
  constructor(
    private readonly redisService: RedisService,
    private readonly excelService: ExcelService,
    private readonly configService: ConfigService,
    @InjectRepository(JobLogEntity) private readonly jobLogRepository: Repository<JobLogEntity>,
    @InjectRepository(OperlogEntity) private readonly operRepository: Repository<OperlogEntity>,
    @InjectRepository(LoginLogEntity) private readonly loginlogRepository: Repository<LoginLogEntity>,
  ) {}

  /* -------------------------------------------------------------------------- */
  /*                                  Login Log                                 */
  /* -------------------------------------------------------------------------- */
  /** 新增登录日志 */
  public async createLoginlog(request: ExpressRequest, message: string, userId?: string, accessTokenKey?: string) {
    const { browser, os } = this.parseUserAgent(request.headers['user-agent'] || '') //获取用户电脑信息
    const loginlog = new LoginLogEntity()
    loginlog.username = request.body.username
    loginlog.userId = userId ?? null
    loginlog.ip = getRequestIp(request)
    loginlog.location = await getLocationByIP(loginlog.ip)
    loginlog.status = userId ? CommonConstant.STATUS_NORMAL : CommonConstant.STATUS_DISABLE
    loginlog.message = message
    loginlog.loginTime = formatTime()
    loginlog.browser = browser
    loginlog.os = os
    loginlog.requestId = request[CommonConstant.REQUEST_ID] // 从请求上下文获取请求 ID
    // 如果登录成功，就记录这个登录信息，方便在线用户查询
    if (userId && accessTokenKey) {
      const uuid = accessTokenKey.split(':').at(-1)
      await this.saveOnlineRecord(request, userId, loginlog.username, uuid)
    }
    await this.loginlogRepository.save(loginlog)
    return '添加成功'
  }

  /** 写在线用户记录（登录时创建；无感刷新时覆盖重建，键缺失后 EXPIRE 无法续期，必须重写） */
  public async saveOnlineRecord(request: ExpressRequest, userId: string, username: string, uuid: string | undefined) {
    const ip = getRequestIp(request)
    const { browser, os } = this.parseUserAgent(request.headers['user-agent'] || '')
    const record = {
      userId,
      ip,
      location: await getLocationByIP(ip),
      username,
      loginTime: formatTime(),
      browser,
      os,
      uuid,
    }
    const key = `${RedisConstant.ADMIN_USER_ONLINE_KEY}:${userId}:${uuid}`
    await this.redisService.set(key, JSON.stringify(record), 'EX', this.configService.getOrThrow(ConfigConstant.JWT_EXPIRES_IN))
  }

  /** 导出登录日志（按查询条件全量导出） */
  public async exportLogininfo(queryParams: QueryLoginlogDto) {
    const queryBuilder = this.loginlogRepository.createQueryBuilder('logininfor')
    queryBuilder.where(this.buildLoginlogWhere(queryParams))
    queryBuilder.orderBy('logininfor.loginTime', 'DESC') // 排序
    const records = await queryBuilder.getMany()
    const fileReadableStream = await this.excelService.export(LoginLogEntity, records)
    const filename = encodeURIComponent(`登录日志-${formatTime(new Date(), 'YYYYMMDDHHmmss')}.xlsx`)
    const disposition = `attachment; filename="${filename}"; filename*=UTF-8''${filename}`
    const type = `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
    return new StreamableFile(fileReadableStream, { disposition, type })
  }

  /** 删除登录日志 */
  public async deleteLoginlog(ids: string[]) {
    // 校验目标日志全部存在
    const targets = await this.loginlogRepository.findBy({ id: In(ids) })
    if (targets.length !== new Set(ids).size) throw new BusinessException('登录日志不存在')
    await this.loginlogRepository.delete(ids)
    return '删除成功'
  }

  /** 清空登录日志 */
  public async clearLoginlog() {
    await this.loginlogRepository.clear()
    return '清空成功'
  }

  /** 分页查询登录日志（userId 存在时仅查询该用户自己的日志，个人中心用） */
  public async findLoginlogList(queryParams: QueryLoginlogDto, userId?: string) {
    const queryBuilder = this.loginlogRepository.createQueryBuilder('loginlog')
    queryBuilder.where(this.buildLoginlogWhere(queryParams, userId))
    queryBuilder.orderBy('loginlog.loginTime', 'DESC') // 排序
    queryBuilder.skip(queryParams.skip).take(queryParams.take) // 分页
    const [records, total] = await queryBuilder.getManyAndCount() //  一次性获取数据和总数
    return { total, records }
  }

  /* -------------------------------------------------------------------------- */
  /*                                  Oper Log                                  */
  /* -------------------------------------------------------------------------- */

  /** 新增操作日志 */
  public createOperLog(createDto: OperlogEntity) {
    return this.operRepository.insert(createDto)
  }

  /** 导出操作日志（按查询条件全量导出） */
  public async exportOperLog(queryParams: QueryOperlogDto) {
    const queryBuilder = this.operRepository.createQueryBuilder('operlog')
    queryBuilder.where(this.buildOperlogWhere(queryParams))
    queryBuilder.orderBy('operlog.operTime', 'DESC') // 排序
    const records = await queryBuilder.getMany()
    const fileReadableStream = await this.excelService.export(OperlogEntity, records)
    // 构建规范的下载配置（兼容中文、所有浏览器）
    const filename = encodeURIComponent(`操作日志-${formatTime(new Date(), 'YYYYMMDDHHmmss')}.xlsx`)
    const disposition = `attachment; filename="${filename}"; filename*=UTF-8''${filename}`
    const type = `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
    return new StreamableFile(fileReadableStream, { disposition, type })
  }

  /** 删除操作日志 */
  public async deleteOperinfo(ids: string[]) {
    // 校验目标日志全部存在
    const targets = await this.operRepository.findBy({ id: In(ids) })
    if (targets.length !== new Set(ids).size) throw new BusinessException('操作日志不存在')
    await this.operRepository.delete(ids)
    return '删除成功'
  }

  /** 清空操作日志 */
  public async clearOperinfo() {
    await this.operRepository.clear()
    return '清空成功'
  }

  /* 分页查询操作日志 */
  public async findOperLogList(queryParams: QueryOperlogDto) {
    const { skip, take } = queryParams
    const queryBuilder = this.operRepository.createQueryBuilder('operlog')
    queryBuilder.where(this.buildOperlogWhere(queryParams))
    queryBuilder.orderBy('operlog.operTime', 'DESC') // 排序
    queryBuilder.skip(skip).take(take) // 分页
    const [records, total] = await queryBuilder.getManyAndCount() //  一次性获取数据和总数
    return { total, records }
  }

  /** 清理 N 天前的三张日志表（定时任务调用） */
  public async cleanExpiredLogs(days: number = 30) {
    const validDays = Number.isInteger(days) && days > 0 ? days : 30
    // varchar 存的 'YYYY-MM-DD HH:mm:ss' 字典序即时间序，字符串比较即可
    const cutoff = formatTime(new Date(Date.now() - validDays * 24 * 60 * 60 * 1000))
    const oper = await this.operRepository.delete({ operTime: LessThan(cutoff) })
    const login = await this.loginlogRepository.delete({ loginTime: LessThan(cutoff) })
    const job = await this.jobLogRepository.delete({ createTime: LessThan(cutoff) })
    return `清理成功：操作日志 ${oper.affected ?? 0} 条、登录日志 ${login.affected ?? 0} 条、调度日志 ${job.affected ?? 0} 条`
  }

  /* -------------------------------------------------------------------------- */
  /*                              Private Property                              */
  /* -------------------------------------------------------------------------- */

  /** 构造登录日志查询条件（列表与导出共用） */
  private buildLoginlogWhere(queryParams: QueryLoginlogDto, userId?: string) {
    const where: FindOptionsWhere<LoginLogEntity> = {}
    if (userId) where.userId = userId
    if (queryParams.ip) where.ip = Like(`%${queryParams.ip}%`)
    if (queryParams.username) where.username = Like(`%${queryParams.username}%`)
    if (queryParams.location) where.location = Like(`%${queryParams.location}%`)
    if (queryParams.status) where.status = Equal(queryParams.status)
    return where
  }

  /** 构造操作日志查询条件（列表与导出共用） */
  private buildOperlogWhere(queryParams: QueryOperlogDto) {
    const where: FindOptionsWhere<OperlogEntity> = {}
    if (queryParams.ip) where.ip = Like(`%${queryParams.ip}%`)
    if (queryParams.title) where.title = Like(`%${queryParams.title}%`)
    if (queryParams.username) where.username = Like(`%${queryParams.username}%`)
    if (queryParams.location) where.location = Like(`%${queryParams.location}%`)
    if (queryParams.status) where.status = Equal(queryParams.status)
    if (queryParams.businessType) where.businessType = Equal(queryParams.businessType)
    return where
  }

  /** 安全解析 UserAgent，兼容所有客户端、测试工具 */
  private parseUserAgent(userAgent: string) {
    if (!userAgent) return { browser: 'unknown', os: 'unknown' }
    const parser = UAParser(userAgent)
    let browser = (parser.browser.name || 'unknown') + (parser.browser.version ?? '')
    const os = (parser.os.name || 'unknown') + (parser.os.version ?? '')
    if (userAgent.includes('ApipostRuntime')) browser = 'ApipostRuntime'
    return { browser, os }
  }
}
