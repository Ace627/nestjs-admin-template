import { CommonConstant } from '@/common'
import { Excel } from '@/common/decorator/excel.decorator'
import { ExcelType } from '@/common/constant/excel.constant'
import { BaseEntity } from '../base.entity'
import { RoleEntity } from './role.entity'
import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm'

@Entity('sys_user')
export class UserEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Excel({ name: '用户账号', type: ExcelType.IMPORT })
  @Column({ unique: true, length: 20, comment: '用户账号', nullable: false, type: 'varchar' })
  username: string

  @Column({ length: 100, comment: '密码', nullable: false, type: 'varchar' })
  password: string

  @Excel({ name: '手机号码', type: ExcelType.IMPORT })
  @Column({ length: 20, comment: '手机号', nullable: true, type: 'varchar' })
  phone: string

  @Excel({ name: '用户昵称', type: ExcelType.IMPORT })
  @Column({ length: 20, comment: '昵称', nullable: true, type: 'varchar' })
  nickname: string

  @Excel({ name: '真实姓名', type: ExcelType.IMPORT })
  @Column({ length: 20, comment: '姓名', nullable: true, type: 'varchar' })
  realname: string

  @Excel({ name: '用户邮箱', type: ExcelType.IMPORT })
  @Column({ length: 50, comment: '邮箱', nullable: true, type: 'varchar' })
  email: string

  @Excel({ name: '状态', dictType: 'sys_normal_disable', type: ExcelType.IMPORT })
  @Column({ length: 1, comment: '状态', default: CommonConstant.STATUS_NORMAL, type: 'char' })
  status: string

  @Excel({ name: '性别', dictType: 'sys_user_sex', type: ExcelType.IMPORT })
  @Column({ length: '1', comment: '性别', type: 'char', default: '2' })
  gender: string

  @Excel({ name: '年龄', type: ExcelType.IMPORT })
  @Column({ comment: '年龄', type: 'int', nullable: true })
  age: number

  @Excel({ name: '备注', type: ExcelType.IMPORT })
  @Column({ length: 200, comment: '备注', type: 'varchar', nullable: true })
  remark: string

  @Column({ name: 'dept_id', type: 'varchar', length: 36, comment: '主部门ID（0 表示未分配）', default: CommonConstant.DEFAULT_PARENT_ID })
  deptId: string

  @Column({ type: 'varchar', length: 255, comment: '用户头像', nullable: true, default: null })
  avatar: string

  @Column({ name: 'login_time', comment: '最后登录时间', type: 'varchar', length: 20, nullable: true, default: null })
  loginTime: string

  /** 用户角色（owning side，JoinTable sys_user_role），数据权限与功能权限取全部角色并集 */
  @ManyToMany(() => RoleEntity, (role) => role.users, { cascade: true })
  @JoinTable({ name: 'sys_user_role', joinColumn: { name: 'user_id', referencedColumnName: 'id' }, inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' } })
  roles: RoleEntity[]
}
