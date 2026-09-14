import { CommonConstant } from '@/common'
import { BaseEntity } from '../base.entity'
import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm'

@Entity({ name: 'sys_dict_data' })
@Index('uk_dict_type_value', ['dictType', 'dictValue'], { unique: true })
export class DictDataEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'dict_label', type: 'varchar', comment: '字典标签', length: 100, nullable: false })
  dictLabel: string

  @Column({ name: 'dict_value', type: 'varchar', comment: '字典值', length: 100, nullable: false })
  dictValue: string

  @Column({ name: 'dict_sort', type: 'int', comment: '排序', default: 1 })
  dictSort: number

  @Column({ name: 'dict_type', type: 'varchar', length: 100, comment: '字典类型', nullable: false })
  dictType: string

  @Column({ name: 'list_class', type: 'varchar', length: 64, default: null, comment: '表格回显样式' })
  listClass: string

  @Column({ name: 'status', type: 'char', length: 1, default: CommonConstant.STATUS_NORMAL })
  status: string

  @Column({ name: 'remark', type: 'varchar', comment: '备注', nullable: true, length: 200 })
  remark: string
}
