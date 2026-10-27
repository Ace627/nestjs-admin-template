import { Queue, JobsOptions } from 'bullmq'
import { InjectQueue } from '@nestjs/bullmq'
import { InjectRepository } from '@nestjs/typeorm'
import { formatTime, isJsonArrayString } from '@/utils'
import { ModuleRef, DiscoveryService } from '@nestjs/core'
import { Injectable, StreamableFile } from '@nestjs/common'
import { CronExpressionParser } from 'cron-parser'
import { ExcelService } from '@/modules/common/excel/excel.service'
import { Equal, FindOptionsWhere, In, Like, Not, Repository } from 'typeorm'
import { BullConstant, BusinessException, CommonConstant, JobEntity, JobLogEntity } from '@/common'
import { AnalysisInvokeTargetDto, ChangeJobStatusDto, CreateJobDto, QueryJobDto, QueryJobLogDto, RunJobDto, UpdateJobDto } from './job.dto'

@Injectable()
export class JobService {
  /** 服务发现注册表：key 为 Service 类名，value 为 Service 类，供 invokeTarget 动态调用校验与执行使用 */
  public readonly serviceMap = new Map<string, Function>()

  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly discovery: DiscoveryService,
    private readonly excelService: ExcelService,
    @InjectQueue(BullConstant.QUEUE_NAME) private jobQueue: Queue,
    @InjectRepository(JobEntity) private readonly jobRepository: Repository<JobEntity>,
    @InjectRepository(JobLogEntity) private readonly jobLogRepository: Repository<JobLogEntity>,
  ) {}

  async onModuleInit() {
    this.loadBusinessServices()
    await this.initJob()
  }

  // 需要此服务上下文的时候记得用箭头函数（invokeTarget 示例：JobService.test()）
  test = () => {
    console.log('test', process.pid, formatTime())
  }

  /* -------------------------------------------------------------------------- */
  /*                                Schedule Job                                */
  /* -------------------------------------------------------------------------- */

  /** 新增任务 */
  public async createJob(createDto: CreateJobDto) {
    // 1. 名称去重
    const exists = await this.jobRepository.exists({ where: { jobName: createDto.jobName } })
    if (exists) throw new BusinessException(`任务名称 ${createDto.jobName} 已存在`)
    // 2. 校验 cron 表达式
    this.validateCronExpression(createDto.cronExpression)
    // 3. 验证调用格式
    await this.analysisInvokeTarget(createDto)
    // 4. 保存
    const entity = new JobEntity()
    Object.assign(entity, createDto)
    const job = await this.jobRepository.save(entity)
    // 5. 启动
    if (job.status === CommonConstant.STATUS_NORMAL) await this.start(job)
    return '添加成功'
  }

  /** 编辑任务 */
  public async updateJob(updateDto: UpdateJobDto) {
    // 1. 查询任务是否存在
    const job = await this.jobRepository.findOne({ where: { id: updateDto.id } })
    if (!job) throw new BusinessException(`任务不存在`)
    // 2. 名称重复校验（排除自身）
    const exists = await this.jobRepository.existsBy({ jobName: updateDto.jobName, id: Not(updateDto.id) })
    if (exists) throw new BusinessException(`任务名称 ${updateDto.jobName} 已存在`)
    // 3. 校验 cron 表达式
    this.validateCronExpression(updateDto.cronExpression)
    // 4. 重新校验调用格式（非常重要）
    await this.analysisInvokeTarget(updateDto)
    // 5. 停止旧任务（防止编辑后残留旧调度器）
    await this.stop(job.id)
    // 6. 覆盖数据
    Object.assign(job, updateDto)
    // 7. 保存
    await this.jobRepository.save(job)
    // 8. 如果状态正常，重新启动
    if (job.status === CommonConstant.STATUS_NORMAL) await this.start(job)
    return '更新成功'
  }

  /** 执行一次 */
  public async runJob(runDto: RunJobDto) {
    const where: FindOptionsWhere<JobEntity> = {}
    where.id = Equal(runDto.jobId)
    where.jobGroup = Equal(runDto.jobGroup)
    const job = await this.jobRepository.findOne({ where })
    if (!job) throw new BusinessException(`任务不存在`)
    // 校验 cron 表达式与调用格式
    this.validateCronExpression(job.cronExpression)
    await this.analysisInvokeTarget(job)
    await this.once(job)
    return '执行一次成功'
  }

  /** 删除任务 */
  public async deleteJob(jobIds: string[]) {
    if (!jobIds || jobIds.length === 0) throw new BusinessException('请选择要删除的任务')
    const jobList = await this.jobRepository.findBy({ id: In(jobIds) })
    if (jobList.length !== new Set(jobIds).size) throw new BusinessException('任务不存在')
    for (const job of jobList) {
      // 停止 Redis 里的定时任务调度器
      await this.jobQueue.removeJobScheduler(job.id)
      // 清理等待中的「执行一次」任务，防止删除后仍被消费
      await this.jobQueue.remove(job.id)
    }
    // 级联删除该任务的调度日志（job_id 建有索引）
    await this.jobLogRepository.delete({ jobId: In(jobIds) })
    await this.jobRepository.delete(jobIds)
    return '删除成功'
  }

  /** 查询任务列表 */
  public async findJobList(queryParams: QueryJobDto) {
    const { jobName, jobGroup, status, skip, take } = queryParams
    const queryBuilder = this.jobRepository.createQueryBuilder('job')
    const where: FindOptionsWhere<JobEntity> = {}
    if (jobName) where.jobName = Like(`%${jobName}%`)
    if (jobGroup) where.jobGroup = Like(`%${jobGroup}%`)
    if (status) where.status = Equal(status)
    queryBuilder.where(where)
    queryBuilder.orderBy('job.createTime', 'DESC')
    queryBuilder.skip(skip).take(take)
    const [records, total] = await queryBuilder.getManyAndCount()
    return { total, records }
  }

  /** 根据任务 ID 查询任务 */
  public findJobById(jobId: string) {
    return this.jobRepository.findOne({ where: { id: jobId } })
  }

  /** 根据任务 ID 列表查询任务列表 */
  public findManyJobByIds(jobIds: string[]) {
    return this.jobRepository.find({ where: { id: In(jobIds) } })
  }

  /** 修改任务状态 */
  public async changeJobStatus(changeDto: ChangeJobStatusDto) {
    const job = await this.jobRepository.findOne({ where: { id: changeDto.id } })
    if (!job) throw new BusinessException('任务不存在')
    if (job.status === changeDto.status) return '状态未变更'
    await this.stop(job.id)
    await this.jobRepository.update(changeDto.id, { status: changeDto.status })
    if (changeDto.status === CommonConstant.STATUS_NORMAL) await this.start(job)
    return '状态修改成功'
  }

  /* 解析类和方法和参数 "A.cc(22,true,'0')" */
  async analysisInvokeTarget(options: AnalysisInvokeTargetDto) {
    const { invokeTarget } = options
    // 1. 拆分 类名.方法名(参数)
    const splitArr = invokeTarget.split('.')
    if (splitArr.length !== 2) throw new BusinessException('调用方法格式错误')
    const serviceName = splitArr[0]
    const methodPart = splitArr[1]
    // 2. 验证格式是否包含 ()
    if (!methodPart.includes('(') || !methodPart.includes(')')) throw new BusinessException('调用方法格式错误')
    // 3. 提取方法名
    const funNameMatch = methodPart.match(/^([^()]+)\(/)
    if (!funNameMatch || !funNameMatch[1]) throw new BusinessException('调用方法格式错误')
    const funName = funNameMatch[1].trim()
    // 4. 提取参数内容（安全解析，不使用 eval）
    const argsMatch = methodPart.match(/\((.*)\)/)
    if (!argsMatch) throw new BusinessException('调用方法格式错误')
    const argsStr = argsMatch[1].trim()
    let argumentsArray: unknown[] = []
    if (argsStr) {
      // 把单引号转成双引号（支持 'xxx' → "xxx"）
      const formattedArgs = argsStr.replace(/'/g, '"')
      const jsonStr = `[${formattedArgs}]`
      if (!isJsonArrayString(jsonStr)) throw new BusinessException('参数格式错误，请使用合法JSON格式')
      argumentsArray = JSON.parse(jsonStr)
    }
    // 5. 验证服务与方法是否存在
    try {
      const serviceClass = this.serviceMap.get(serviceName)
      if (!serviceClass) throw new Error('服务不存在')
      const service = this.moduleRef.get(serviceClass, { strict: false })
      if (!service || !(funName in service)) throw new Error('方法不存在')
    } catch {
      throw new BusinessException('调用方法未找到')
    }
    // 6. 返回解析结果
    return { serviceName, funName, argumentsArray }
  }

  /* -------------------------------------------------------------------------- */
  /*                              Schedule Job Log                              */
  /* -------------------------------------------------------------------------- */

  /** 添加任务日志记录 */
  public async createJobLog(createDto: JobLogEntity) {
    await this.jobLogRepository.save(createDto)
    return '添加成功'
  }

  /** 分页查询任务调度日志列表 */
  public async findJobLogList(queryParams: QueryJobLogDto) {
    const { skip, take } = queryParams
    const queryBuilder = this.jobLogRepository.createQueryBuilder('jobLog')
    queryBuilder.where(this.buildJobLogWhere(queryParams))
    queryBuilder.orderBy('jobLog.createTime', 'DESC')
    queryBuilder.skip(skip).take(take)
    const [records, total] = await queryBuilder.getManyAndCount()
    return { total, records }
  }

  /** 删除任务日志 */
  public async deleteJobLog(logIds: string[]) {
    if (!logIds || logIds.length === 0) throw new BusinessException('请选择要删除的日志')
    await this.jobLogRepository.delete(logIds)
    return '删除成功'
  }

  /** 清空调度日志 */
  public async clearJobLog() {
    await this.jobLogRepository.createQueryBuilder('jobLog').delete().execute()
    return '清空成功'
  }

  /** 导出任务调度日志（按查询条件全量导出） */
  public async exportJobLog(queryParams: QueryJobLogDto) {
    const queryBuilder = this.jobLogRepository.createQueryBuilder('jobLog')
    queryBuilder.where(this.buildJobLogWhere(queryParams))
    queryBuilder.orderBy('jobLog.createTime', 'DESC')
    const records = await queryBuilder.getMany()
    const fileReadableStream = await this.excelService.export(JobLogEntity, records)
    // 构建规范的下载配置（兼容中文、所有浏览器）
    const filename = encodeURIComponent(`任务调度日志-${formatTime(new Date(), 'YYYYMMDDHHmmss')}.xlsx`)
    const disposition = `attachment; filename="${filename}"; filename*=UTF-8''${filename}`
    const type = `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
    return new StreamableFile(fileReadableStream, { disposition, type })
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Handler                              */
  /* -------------------------------------------------------------------------- */

  /** 构造任务调度日志查询条件（列表与导出共用） */
  private buildJobLogWhere(queryParams: QueryJobLogDto) {
    const { jobName, jobGroup, status } = queryParams
    const where: FindOptionsWhere<JobLogEntity> = {}
    if (jobName) where.jobName = Like(`%${jobName}%`)
    if (jobGroup) where.jobGroup = Like(`%${jobGroup}%`)
    if (status) where.status = Equal(status)
    return where
  }

  /** 校验 cron 表达式（cron-parser 严格校验，与 BullMQ 同源解析器） */
  private validateCronExpression(cronExpression: string) {
    try {
      CronExpressionParser.parse(cronExpression)
    } catch {
      throw new BusinessException(`无效的 cron 表达式：${cronExpression}`)
    }
  }

  /** 初始化定时任务（服务启动时执行） */
  private async initJob() {
    // 1. 清空 Redis 中残留的所有任务调度器（调度器以任务 ID 为键，任务记录删除后可能遗留）
    const jobSchedulerList = await this.jobQueue.getJobSchedulers()
    await Promise.all(jobSchedulerList.map(async (item) => await this.jobQueue.removeJobScheduler(item.key)))
    // 2. 清理等待中的任务
    await this.jobQueue.drain()
    // 3. 清理活跃中的任务
    const activeJobList = await this.jobQueue.getActive()
    for (const job of activeJobList) await job.remove()
    // 4. 查找执行失败的任务，执行错误策略后清空失败记录
    const failedJobList = await this.jobQueue.getFailed()
    await this.misfirePolicy(failedJobList.map((item) => item.data as JobEntity))
    await this.jobQueue.clean(0, 1000, BullConstant.JOB_FAILED)
    // 5. 重启所有正常状态的任务（全量查询，不限制条数）
    const jobList = await this.jobRepository.findBy({ status: CommonConstant.STATUS_NORMAL })
    await Promise.all(jobList.map((job) => this.start(job)))
  }

  /** 任务错误策略（错失补偿） */
  private async misfirePolicy(jobs: JobEntity[]) {
    // 仅保留数据库中仍存在的任务（失败的队列任务可能已被删除）
    const jobList = await this.findManyJobByIds(jobs.map((item) => item.id))
    // 立即执行的任务
    const immediateJobList: JobEntity[] = []
    // 执行一次的任务（去重）
    const onceJobList: JobEntity[] = []
    for (const job of jobList) {
      if (job.misfirePolicy === BullConstant.MISFIRE_POLICY_IMMEDIATE) immediateJobList.push(job)
      if (job.misfirePolicy === BullConstant.MISFIRE_POLICY_ONCE && !onceJobList.some((item) => item.id === job.id)) onceJobList.push(job)
    }
    await Promise.all([...immediateJobList, ...onceJobList].map(async (job) => await this.once(job)))
  }

  /** 启动定时任务 */
  private async start(job: JobEntity) {
    // 确保先移除旧的调度器，防止重复创建
    const existing = await this.jobQueue.getJobScheduler(job.id)
    if (existing) await this.jobQueue.removeJobScheduler(job.id)
    // 添加自动清理选项，防止任务堆积
    await this.jobQueue.upsertJobScheduler(job.id, { pattern: job.cronExpression }, { name: job.jobName, data: job, opts: { removeOnComplete: true, removeOnFail: true } })
  }

  /** 停止定时任务 */
  private async stop(jobId: string) {
    const exists = await this.jobQueue.getJobScheduler(jobId)
    if (exists) await this.jobQueue.removeJobScheduler(jobId)
  }

  /** 直接执行一次 */
  private async once(job: JobEntity) {
    // 先检查是否存在相同 jobId 的任务，避免重复添加
    const existing = await this.jobQueue.getJob(job.id)
    if (existing) await this.jobQueue.remove(job.id)
    const options: JobsOptions = { jobId: job.id, removeOnComplete: true, removeOnFail: false }
    await this.jobQueue.add(job.jobName, job, options)
  }

  /** 加载所有业务 Service（自动过滤非业务类） */
  private loadBusinessServices() {
    const providers = this.discovery.getProviders()
    for (const wrapper of providers) {
      const { metatype } = wrapper
      if (!metatype || !metatype.name.endsWith('Service')) continue
      this.serviceMap.set(metatype.name, metatype)
    }
  }
}
