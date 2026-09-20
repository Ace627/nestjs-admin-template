import { CommonConstant } from '@/common'
import { BaseEntity } from '../base.entity'
import { RoleEntity } from './role.entity'
import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm'

@Entity('sys_user')
export class UserEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true, length: 20, comment: '用户账号', nullable: false, type: 'varchar' })
  username: string

  @Column({ length: 100, comment: '密码', nullable: false, type: 'varchar' })
  password: string

  @Column({ length: 20, comment: '手机号', nullable: true, type: 'varchar' })
  phone: string

  @Column({ length: 20, comment: '昵称', nullable: true, type: 'varchar' })
  nickname: string

  @Column({ length: 20, comment: '姓名', nullable: true, type: 'varchar' })
  realname: string

  @Column({ length: 50, comment: '邮箱', nullable: true, type: 'varchar' })
  email: string

  @Column({ length: 1, comment: '状态', default: CommonConstant.STATUS_NORMAL, type: 'char' })
  status: string

  @Column({ length: '1', comment: '性别', type: 'char', default: '2' })
  gender: string

  @Column({ comment: '年龄', type: 'int', nullable: true })
  age: number

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
