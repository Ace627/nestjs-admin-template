import { CommonConstant } from '@/common/constant/common.constant'
import { BaseEntity } from '../base.entity'
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

/** 文件类型：D 目录 / F 文件 */
export const FileType = {
  FOLDER: 'D',
  FILE: 'F',
} as const

/**
 * 文件实体
 * 目录与文件同表入库，parent_id 自关联 + ancestors 冗余链支撑子树级联（借鉴 sys_dept）
 * 物理文件按 uploads/{sha256}{ext} 平铺存储，file_path 存相对路径（如 uploads/xxx.png）
 */
@Entity('sys_file')
export class FileEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'parent_id', type: 'varchar', length: 36, comment: '父节点ID（0 表示根节点）', default: CommonConstant.DEFAULT_PARENT_ID })
  parentId: string

  @Column({ type: 'varchar', length: 500, comment: '祖级列表（如 0,{uuid}，冗余字段用于子树级联查询）', default: '' })
  ancestors: string

  @Column({ name: 'file_type', type: 'char', length: 1, comment: '类型（D目录 F文件）' })
  fileType: string

  @Column({ name: 'file_name', type: 'varchar', length: 255, comment: '名称（目录名或文件原始名）' })
  fileName: string

  @Column({ name: 'file_hash', type: 'varchar', length: 64, comment: '文件 SHA-256（目录为 null）', nullable: true, default: null })
  fileHash: string

  @Column({ name: 'file_path', type: 'varchar', length: 255, comment: '相对存储路径（目录为 null）', nullable: true, default: null })
  filePath: string

  @Column({ name: 'file_size', type: 'int', comment: '文件大小（字节，目录为 null）', nullable: true, default: null })
  fileSize: number

  @Column({ name: 'file_ext', type: 'varchar', length: 32, comment: '扩展名（含点，如 .png，目录为 null）', nullable: true, default: null })
  fileExt: string

  @Column({ name: 'mime_type', type: 'varchar', length: 100, comment: 'MIME 类型（目录为 null）', nullable: true, default: null })
  mimeType: string
}
