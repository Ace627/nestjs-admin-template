import { CommonConstant } from '@/common'
import { BaseEntity } from '../base.entity'
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

/**
 * 部门实体
 * 树形组织架构，数据权限的锚点表
 */
@Entity('sys_dept')
export class DeptEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'parent_id', type: 'varchar', length: 36, comment: '父部门ID（0 表示根部门）', default: CommonConstant.DEFAULT_PARENT_ID })
  parentId: string

  @Column({ type: 'varchar', length: 500, comment: '祖级列表（如 0,101,102，冗余字段用于子树查询）', default: '' })
  ancestors: string

  @Column({ name: 'dept_name', type: 'varchar', length: 30, comment: '部门名称', nullable: false })
  deptName: string

  @Column({ type: 'varchar', length: 20, comment: '负责人', nullable: true, default: null })
  leader: string

  @Column({ type: 'varchar', length: 11, comment: '联系电话', nullable: true, default: null })
  phone: string

  @Column({ type: 'varchar', length: 50, comment: '邮箱', nullable: true, default: null })
  email: string

  @Column({ name: 'dept_sort', type: 'int', comment: '显示顺序', default: 0 })
  deptSort: number

  @Column({ type: 'char', length: 1, comment: '部门状态', default: CommonConstant.STATUS_NORMAL })
  status: string
}
