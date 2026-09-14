import { PaginationDto } from '@/common'
import { PartialType } from '@nestjs/mapped-types'
import { Type } from 'class-transformer'
import { IsInt, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator'

export class CreateDeptDto {
  /** 上级部门ID（空则挂根节点） */
  @IsOptional()
  @IsString()
  parentId: string

  @IsNotEmpty({ message: '参数 $property 不能为空' })
  @IsString()
  @Length(1, 30, { message: '部门名称长度须在 1~30 之间' })
  deptName: string

  @IsOptional()
  @IsString()
  @Length(1, 20, { message: '负责人长度须在 1~20 之间' })
  leader: string

  @IsOptional()
  @IsString()
  @Length(1, 11, { message: '联系电话长度须在 1~11 之间' })
  phone: string

  @IsOptional()
  @IsString()
  @Length(1, 50, { message: '邮箱长度须在 1~50 之间' })
  email: string

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '显示顺序必须是整数' })
  deptSort: number

  @IsOptional()
  @Matches(/^[01]$/, { message: '状态取值仅限 0 或 1' })
  status: string
}

export class UpdateDeptDto extends PartialType(CreateDeptDto) {
  @IsNotEmpty({ message: '参数 $property 不能为空' })
  @IsString()
  id: string
}

export class QueryDeptDto extends PaginationDto {
  @IsOptional()
  @IsString()
  deptName: string

  @IsOptional()
  @Matches(/^[01]$/, { message: '状态取值仅限 0 或 1' })
  status: string
}
