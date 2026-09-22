import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { CommonConstant } from '@/common/constant/common.constant'
import { BaseEntity } from '../base.entity'

@Entity('sys_job')
export class JobEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { comment: '任务ID' })
  id: string

  @Column({ name: 'job_name', type: 'varchar', length: 64, comment: '任务名称', default: null })
  jobName: string

  @Column({ name: 'job_group', type: 'varchar', length: 64, comment: '任务组名', default: 'DEFAULT' })
  jobGroup: string

  @Column({ name: 'invoke_target', type: 'varchar', length: 255, comment: '调用目标字符串（格式：Service.method(参数)）', default: null })
  invokeTarget: string

  @Column({ name: 'cron_expression', type: 'varchar', length: 255, comment: 'cron执行表达式', default: null })
  cronExpression: string

  @Column({ name: 'misfire_policy', type: 'varchar', length: 1, comment: '计划执行错误策略（1立即执行 2执行一次 3放弃执行）', default: '3' })
  misfirePolicy: string

  @Column({ type: 'char', length: 1, comment: '是否并发执行（1允许 0禁止）', default: CommonConstant.STATUS_DISABLE })
  concurrent: string

  @Column({ type: 'char', length: 1, comment: '任务状态（1正常 0暂停）', default: CommonConstant.STATUS_NORMAL })
  status: string

  @Column({ name: 'remark', type: 'varchar', comment: '备注', nullable: true, length: 200 })
  remark: string
}
