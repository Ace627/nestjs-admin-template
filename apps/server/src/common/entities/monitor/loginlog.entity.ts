import { Excel } from '@/common/decorator/excel.decorator'
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { CommonConstant } from '@/common/constant/common.constant'

@Entity('sys_login_log')
export class LoginLogEntity {
  @PrimaryGeneratedColumn('uuid', { comment: '访问ID' })
  id: string

  @Excel({ name: '用户账号' })
  @Column({ type: 'varchar', comment: '用户账号', length: 20, default: null })
  username: string

  @Column({ name: 'user_id', type: 'varchar', comment: '用户ID', length: 36, nullable: true, default: null })
  userId: string | null

  @Excel({ name: '登录IP', width: 20 })
  @Column({ type: 'varchar', comment: '登录IP地址', length: 128, default: null })
  ip: string

  @Excel({ name: '登录地点', width: 20 })
  @Column({ type: 'varchar', comment: '登录地点', length: 255, default: null })
  location: string

  @Excel({ name: '浏览器类型', width: 30 })
  @Column({ type: 'varchar', comment: '浏览器类型', length: 50, default: null })
  browser: string

  @Excel({ name: '操作系统' })
  @Column({ type: 'varchar', comment: '操作系统', length: 50, default: null })
  os: string

  @Excel({ name: '登录状态', dictType: 'sys_common_status' })
  @Column({ type: 'char', comment: '登录状态', length: 1, default: CommonConstant.STATUS_NORMAL })
  status: string

  @Excel({ name: '提示消息', width: 32 })
  @Column({ type: 'varchar', comment: '提示消息', length: 255, default: null })
  message: string

  @Excel({ name: '登录日期', width: 25 })
  @Column({ type: 'varchar', length: 20, name: 'login_time', comment: '登录日期', default: null })
  loginTime: string

  @Excel({ name: '请求标识', width: 40 })
  @Column({ comment: '请求唯一标识', type: 'varchar', length: 64, default: null, name: 'request_id' })
  requestId: string
}
