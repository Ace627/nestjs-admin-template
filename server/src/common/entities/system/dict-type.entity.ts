import { CommonConstant } from '@/common'
import { BaseEntity } from '../base.entity'
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity({ name: 'sys_dict_type' })
export class DictTypeEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'dict_name', type: 'varchar', length: 100, comment: '字典名称' })
  dictName: string

  @Column({ name: 'dict_type', type: 'varchar', length: 100, unique: true, nullable: false })
  dictType: string

  @Column({ name: 'status', type: 'char', default: CommonConstant.STATUS_NORMAL, length: 1 })
  status: string

  @Column({ name: 'remark', type: 'varchar', comment: '备注', nullable: true, length: 200 })
  remark: string
}
