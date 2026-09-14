import { PaginationDto } from '@/common'
import { Exclude } from 'class-transformer'
import { PartialType } from '@nestjs/mapped-types'
import { IsInt, IsNotEmpty, IsOptional, Length, Matches } from 'class-validator'

/* ----------------------------- 字典类型 ----------------------------- */

export class CreateDictTypeDto {
  @IsNotEmpty({ message: '字典名称不能为空' })
  @Length(0, 100, { message: '字典名称长度不能超过 100 个字符' })
  dictName: string

  @IsNotEmpty({ message: '字典类型不能为空' })
  @Matches(/^[a-zA-Z][a-zA-Z0-9_]*$/, { message: '字典类型须以字母开头，仅含字母、数字与下划线' })
  @Length(0, 100, { message: '字典类型长度不能超过 100 个字符' })
  dictType: string

  @IsOptional()
  status: string

  @IsOptional()
  @Length(0, 200, { message: '备注长度不能超过 200 个字符' })
  remark: string
}

/** 更新字典类型：dictType 允许变更，后端事务内级联同步字典数据与缓存 */
export class UpdateDictTypeDto extends PartialType(CreateDictTypeDto) {
  @IsNotEmpty({ message: '字典类型 ID 不能为空' })
  id: string
}

export class QueryDictTypeDto extends PaginationDto {
  @IsOptional()
  dictName: string

  @IsOptional()
  dictType: string

  @IsOptional()
  status: string
}

/* ----------------------------- 字典数据 ----------------------------- */

export class CreateDictDataDto {
  @IsNotEmpty({ message: '字典标签不能为空' })
  @Length(0, 100, { message: '字典标签长度不能超过 100 个字符' })
  dictLabel: string

  @IsNotEmpty({ message: '字典键值不能为空' })
  @Length(0, 100, { message: '字典键值长度不能超过 100 个字符' })
  dictValue: string

  @IsOptional()
  @IsInt({ message: '字典排序必须是数字' })
  dictSort: number

  @IsNotEmpty({ message: '字典类型不能为空' })
  @Length(0, 100, { message: '字典类型长度不能超过 100 个字符' })
  dictType: string

  @IsOptional()
  @Length(0, 64, { message: '回显样式长度不能超过 64 个字符' })
  listClass: string

  @IsOptional()
  status: string

  @IsOptional()
  @Length(0, 200, { message: '备注长度不能超过 200 个字符' })
  remark: string
}

export class UpdateDictDataDto extends PartialType(CreateDictDataDto) {
  @IsNotEmpty({ message: '字典数据 ID 不能为空' })
  id: string

  /** 数据行归属类型不允许变更，避免产生孤儿数据 */
  @Exclude()
  dictType: string
}

export class QueryDictDataDto extends PaginationDto {
  @IsOptional()
  dictLabel: string

  @IsOptional()
  dictType: string

  @IsOptional()
  status: string
}
