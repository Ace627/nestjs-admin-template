import { CommonConstant } from '@/common'
import { BaseEntity } from '../base.entity'
import { RoleEntity } from './role.entity'
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm'

/**
 * 菜单实体
 * 目录（M）/ 菜单（C）/ 按钮（F）三级粒度，按钮级权限标识存储于此表
 */
@Entity('sys_menu')
export class MenuEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'parent_id', type: 'varchar', length: 36, comment: '上级菜单', default: CommonConstant.DEFAULT_PARENT_ID })
  parentId: string

  @Column({ type: 'varchar', length: 200, comment: '路由地址', default: null })
  path: string | null

  @Column({ type: 'varchar', length: 255, comment: '组件路径', default: null })
  component: string | null

  @Column({ name: 'menu_type', type: 'char', length: 1, comment: '类型（M目录 C菜单 F按钮）', default: 'M' })
  menuType: string

  @Column({ type: 'varchar', length: 64, comment: '菜单图标', default: null })
  icon: string | null

  @Column({ name: 'menu_name', type: 'varchar', length: 50, comment: '菜单名称', default: null })
  menuName: string | null

  @Column({ type: 'char', length: 1, comment: '菜单是否可见', default: CommonConstant.STATUS_NORMAL })
  visible: string

  @Column({ type: 'varchar', length: 100, comment: '权限字符（如 system:user:create，仅 C/F 类型）', default: null })
  permission: string | null

  @Column({ type: 'char', length: 1, comment: '数据状态', default: CommonConstant.STATUS_NORMAL })
  status: string

  @Column({ name: 'menu_sort', type: 'int', comment: '显示顺序', default: 1 })
  menuSort: number

  @Column({ name: 'is_cache', type: 'char', length: 1, comment: '是否缓存组件', default: CommonConstant.STATUS_DISABLE })
  isCache: string

  /** 反向关联：授权该菜单的角色（owning side 在 RoleEntity.menus，JoinTable sys_role_menu） */
  @ManyToMany(() => RoleEntity, (role) => role.menus)
  roles: RoleEntity[]
}
