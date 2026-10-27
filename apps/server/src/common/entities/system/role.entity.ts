import { CommonConstant, DataScopeType } from '@/common'
import { BaseEntity } from '../base.entity'
import { MenuEntity } from './menu.entity'
import { UserEntity } from './user.entity'
import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm'

/**
 * 角色实体
 * 管理系统角色信息、权限分配核心载体
 */
@Entity('sys_role')
export class RoleEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'role_code', type: 'varchar', length: 20, comment: '角色编码', unique: true })
  roleCode: string

  @Column({ name: 'role_name', type: 'varchar', length: 20, comment: '角色名称', nullable: false })
  roleName: string

  @Column({ name: 'role_sort', type: 'int', comment: '角色排序', default: 1 })
  roleSort: number

  @Column({ name: 'data_scope', type: 'char', length: 1, comment: '数据范围（1全部 2自定义 3本部门 4本部门及以下 5仅本人）', default: DataScopeType.DEPT_AND_BELOW })
  dataScope: string

  @Column({ type: 'char', length: 1, comment: '状态', default: CommonConstant.STATUS_NORMAL })
  status: string

  @Column({ length: 200, comment: '备注', type: 'varchar', nullable: true })
  remark: string

  /** 反向关联：持有该角色的用户（owning side 在 UserEntity.roles，JoinTable sys_user_role） */
  @ManyToMany(() => UserEntity, (user) => user.roles)
  users: UserEntity[]

  /** 角色授权的菜单（owning side，JoinTable sys_role_menu），删除角色时数据库级联清理中间表 */
  @ManyToMany(() => MenuEntity, (menu) => menu.roles, { onDelete: 'CASCADE' })
  @JoinTable({ name: 'sys_role_menu', joinColumns: [{ name: 'role_id', referencedColumnName: 'id' }], inverseJoinColumns: [{ name: 'menu_id', referencedColumnName: 'id' }] })
  menus: MenuEntity[]
}
