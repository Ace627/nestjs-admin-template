import { Job } from 'bullmq'
import { formatTime } from '@/utils'
import { Logger } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { JobService } from './job.service'
import { Processor, OnWorkerEvent, WorkerHost } from '@nestjs/bullmq'
import { BullConstant, BusinessException, CommonConstant, JobEntity, JobLogEntity } from '@/common'

@Processor(BullConstant.QUEUE_NAME)
export class JobProcessor extends WorkerHost {
  private readonly logger = new Logger(JobProcessor.name)

  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly jobService: JobService,
  ) {
    super()
  }

  /** 只负责执行任务，调度日志统一由 onCompleted/onFailed 事件记录，保证一次执行只产生一条日志 */
  public async process(job: Job<JobEntity>) {
    try {
      const task = job.data
      this.logger.log(`执行定时任务：${task.invokeTarget}`)
      const { serviceName, funName, argumentsArray } = await this.jobService.analysisInvokeTarget(task)
      const service = this.getServiceInstance(serviceName)
      if (task.concurrent === CommonConstant.STATUS_NORMAL) {
        // 允许并发：不等待执行完成，失败时主动标记任务失败，由 onFailed 统一记日志
        service[funName](...argumentsArray).catch((error: unknown) => {
          const errorMessage = error instanceof Error ? error.message : '执行定时任务失败'
          this.logger.error(`执行定时任务 ${task.invokeTarget} 失败：${errorMessage}`)
          job.moveToFailed(new Error(errorMessage), job.token || '', true)
        })
      } else {
        // 禁止并发：等待执行完成，失败向上抛出，由 onFailed 统一记日志
        await service[funName](...argumentsArray)
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '执行定时任务失败'
      this.logger.error(`执行定时任务 ${job.data.invokeTarget} 失败：${errorMessage}`)
      throw new BusinessException(errorMessage || '执行定时任务失败')
    }
  }

  @OnWorkerEvent(BullConstant.JOB_COMPLETED)
  async onCompleted(job: Job<JobEntity>) {
    await this.createJobLog(job.data, CommonConstant.STATUS_NORMAL, '执行成功')
  }

  @OnWorkerEvent(BullConstant.JOB_FAILED)
  async onFailed(job: Job<JobEntity>, error: Error) {
    await this.createJobLog(job.data, CommonConstant.STATUS_DISABLE, error?.message || '执行定时任务失败')
  }

  /** 根据 Service 类名从服务发现注册表取实例（strict: false 跨模块获取） */
  private getServiceInstance(serviceName: string) {
    const serviceClass = this.jobService.serviceMap.get(serviceName)
    if (!serviceClass) throw new BusinessException('服务不存在')
    return this.moduleRef.get(serviceClass, { strict: false })
  }

  /** 写入任务调度日志 */
  private async createJobLog(data: JobEntity, status: string, jobMessage: string = '执行成功') {
    const jobLog = new JobLogEntity()
    jobLog.jobId = data.id
    jobLog.jobName = data.jobName
    jobLog.jobGroup = data.jobGroup
    jobLog.invokeTarget = data.invokeTarget
    jobLog.jobMessage = jobMessage
    jobLog.status = status
    jobLog.createTime = formatTime()
    await this.jobService.createJobLog(jobLog)
  }
}
