import { PaginationDto } from '@/common'
import { PartialType } from '@nestjs/mapped-types'
import { IsHexadecimal, IsInt, IsNotEmpty, IsOptional, Length, Min } from 'class-validator'

/* ----------------------------- 目录管理 ----------------------------- */

export class CreateFolderDto {
  /** 父目录 ID（0 表示根节点） */
  @IsOptional()
  @Length(1, 36, { message: '父目录 ID 长度须在 1 到 36 个字符之间' })
  parentId: string

  @IsNotEmpty({ message: '目录名称不能为空' })
  @Length(1, 255, { message: '目录名称长度须在 1 到 255 个字符之间' })
  fileName: string
}

export class UpdateFolderDto extends PartialType(CreateFolderDto) {
  @IsNotEmpty({ message: '目录 ID 不能为空' })
  id: string
}

/* ----------------------------- 文件列表 ----------------------------- */

export class QueryFileDto extends PaginationDto {
  /** 目录 ID（0 表示根节点） */
  @IsOptional()
  parentId: string

  @IsOptional()
  fileName: string
}

/* ----------------------------- 上传登记 ----------------------------- */

export class RegisterFileDto {
  /** 父目录 ID（0 表示根节点） */
  @IsOptional()
  @Length(1, 36, { message: '父目录 ID 长度须在 1 到 36 个字符之间' })
  parentId: string

  @IsNotEmpty({ message: '文件哈希不能为空' })
  @IsHexadecimal({ message: '文件哈希格式不正确' })
  @Length(64, 64, { message: '文件哈希长度须为 64 个字符' })
  fileHash: string

  @IsNotEmpty({ message: '文件名不能为空' })
  @Length(1, 255, { message: '文件名长度须在 1 到 255 个字符之间' })
  fileName: string

  /** 文件大小（字节） */
  @IsInt({ message: '文件大小必须是数字' })
  @Min(1, { message: '文件大小必须大于 0' })
  fileSize: number

  @IsOptional()
  @Length(0, 100, { message: 'MIME 类型长度不能超过 100 个字符' })
  mimeType: string
}

/* ----------------------------- 回收站 ----------------------------- */

export class RecycleQueryDto extends PaginationDto {
  @IsOptional()
  fileName: string
}
