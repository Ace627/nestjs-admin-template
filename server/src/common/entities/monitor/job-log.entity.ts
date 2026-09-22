import { Excel } from '@/common/decorator/excel.decorator'
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { CommonConstant } from '@/common/constant/common.constant'

@Entity('sys_job_log')
export class JobLogEntity {
  @PrimaryGeneratedColumn('uuid', { comment: '任务日志ID' })
  id: string

  @Column({ name: 'job_id', type: 'varchar', length: 36, comment: '关联任务ID' })
  jobId: string

  @Excel({ name: '任务名称', width: 30 })
  @Column({ name: 'job_name', type: 'varchar', length: 64, comment: '任务名称', default: null })
  jobName: string

  @Excel({ name: '任务组名' })
  @Column({ name: 'job_group', type: 'varchar', length: 64, comment: '任务组名', default: 'DEFAULT' })
  jobGroup: string

  @Excel({ name: '调用目标', width: 30 })
  @Column({ name: 'invoke_target', type: 'varchar', length: 255, comment: '调用目标字符串', default: null })
  invokeTarget: string

  @Excel({ name: '日志信息', width: 40 })
  @Column({ name: 'job_message', type: 'varchar', length: 500, comment: '日志信息', default: null })
  jobMessage: string

  @Excel({ name: '执行状态', dictType: 'sys_common_status' })
  @Column({ type: 'char', length: 1, comment: '执行状态', default: CommonConstant.STATUS_NORMAL })
  status: string

  @Excel({ name: '执行时间', width: 25 })
  @Column({ name: 'create_time', type: 'varchar', length: 20, comment: '执行时间', default: null })
  createTime: string
}
