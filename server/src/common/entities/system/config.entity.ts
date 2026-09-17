import { CommonConstant } from '@/common'
import { BaseEntity } from '../base.entity'
import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm'

@Entity({ name: 'sys_config' })
@Index('uk_config_key', ['configKey'], { unique: true })
export class ConfigEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'config_name', type: 'varchar', comment: '参数名称', length: 100, nullable: false })
  configName: string

  @Column({ name: 'config_key', type: 'varchar', comment: '参数键名', length: 100, nullable: false })
  configKey: string

  @Column({ name: 'config_value', type: 'varchar', comment: '参数键值（统一存字符串，业务侧自行转换类型）', length: 500, nullable: false })
  configValue: string

  @Column({ name: 'config_type', type: 'char', comment: '系统内置（Y内置 N非内置，内置参数禁止删除与改键名）', length: 1, default: CommonConstant.CONFIG_TYPE_CUSTOM })
  configType: string

  @Column({ name: 'remark', type: 'varchar', comment: '备注', nullable: true, length: 200 })
  remark: string
}
