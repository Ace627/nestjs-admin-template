import { Excel } from '@/common/decorator/excel.decorator'
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { CommonConstant } from '@/common/constant/common.constant'
import { BusinessType } from '@/common/constant/business-type.constant'

@Entity({ name: 'sys_oper_log' })
export class OperlogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Excel({ name: '模块标题' })
  @Column({ type: 'varchar', length: 50, comment: '模块标题', default: null })
  title: string

  @Excel({ name: '操作人员' })
  @Column({ type: 'varchar', length: 20, comment: '操作人员', default: null })
  username: string

  @Column({ name: 'user_id', type: 'varchar', length: 36, comment: '操作人员ID', nullable: true, default: null })
  userId: string | null

  @Excel({ name: '方法名称', width: 32 })
  @Column({ type: 'varchar', length: 64, comment: '方法名称', default: null })
  method: string

  @Excel({ name: '请求方式' })
  @Column({ type: 'varchar', length: 20, comment: '请求方式', name: 'request_method', default: null })
  requestMethod: string

  @Column({ type: 'text', comment: '请求参数', default: null })
  params: string

  @Excel({ name: '请求接口', width: 40 })
  @Column({ type: 'varchar', comment: '请求接口', default: null })
  url: string

  @Excel({ name: '请求IP' })
  @Column({ type: 'varchar', comment: '请求IP', default: null })
  ip: string

  @Excel({ name: '请求地址' })
  @Column({ type: 'varchar', comment: '请求地址', default: null })
  location: string

  @Excel({ name: '操作类型', dictType: 'sys_oper_type' })
  @Column({ name: 'business_type', type: 'char', length: 2, comment: '操作类型', default: BusinessType.OTHER })
  businessType: BusinessType

  @Excel({ name: '操作状态', dictType: 'sys_common_status' })
  @Column({ type: 'char', comment: '操作状态', default: CommonConstant.STATUS_NORMAL })
  status: string

  @Excel({ name: '请求时间', width: 25 })
  @Column({ type: 'varchar', length: 20, comment: '请求时间', name: 'oper_time' })
  operTime: string

  @Excel({ name: '请求耗时（毫秒）', width: 20 })
  @Column({ type: 'int', comment: '请求耗时', default: null })
  duration: number

  @Excel({ name: '请求标识', width: 40 })
  @Column({ type: 'varchar', length: 64, comment: '请求唯一标识', default: null, name: 'request_id' })
  requestId: string
}
