import { DataScopeType } from '@/common'
import { PaginationDto } from '@/common'
import { PartialType } from '@nestjs/mapped-types'
import { Type } from 'class-transformer'
import { ArrayNotEmpty, IsArray, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Length, Matches, ValidateIf } from 'class-validator'

export class CreateRoleDto {
  @IsNotEmpty({ message: '参数 $property 不能为空' })
  @IsString()
  @Matches(/^[a-zA-Z][a-zA-Z0-9_]{1,19}$/, { message: '角色编码须以字母开头、仅含字母数字下划线，长度 2~20' })
  roleCode: string

  @IsNotEmpty({ message: '参数 $property 不能为空' })
  @IsString()
  @Length(1, 20, { message: '角色名称长度须在 1~20 之间' })
  roleName: string

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '角色排序必须是整数' })
  roleSort: number

  @IsOptional()
  @Matches(/^[01]$/, { message: '状态取值仅限 0 或 1' })
  status: string

  @IsOptional()
  @IsString()
  @Length(1, 200, { message: '备注长度须在 1~200 之间' })
  remark: string
}

export class UpdateRoleDto extends PartialType(CreateRoleDto) {
  @IsNotEmpty({ message: '参数 $property 不能为空' })
  @IsString()
  id: string
}

export class QueryRoleDto extends PaginationDto {
  @IsOptional()
  @IsString()
  roleName: string

  @IsOptional()
  @IsString()
  roleCode: string

  @IsOptional()
  @Matches(/^[01]$/, { message: '状态取值仅限 0 或 1' })
  status: string
}

export class ChangeRoleStatusDto {
  @IsNotEmpty({ message: '参数 $property 不能为空' })
  @IsString()
  id: string

  @Matches(/^[01]$/, { message: '状态取值仅限 0 或 1' })
  status: string
}

export class AuthRolePermissionDto {
  @IsNotEmpty({ message: '参数 $property 不能为空' })
  @IsString()
  roleId: string

  @IsArray({ message: '菜单 ID 组必须是数组' })
  menuIds: string[]
}

export class UpdateRoleDataScopeDto {
  @IsNotEmpty({ message: '参数 $property 不能为空' })
  @IsString()
  id: string

  @IsIn([DataScopeType.ALL, DataScopeType.CUSTOM, DataScopeType.DEPT, DataScopeType.DEPT_AND_BELOW, DataScopeType.SELF], {
    message: '数据范围取值仅限 1~5',
  })
  dataScope: string

  /** 自定义数据范围的部门 ID 组（仅 dataScope = '2' 时生效并校验，其余档位忽略） */
  @ValidateIf((dto) => dto.dataScope === DataScopeType.CUSTOM)
  @IsArray({ message: '部门 ID 组必须是数组' })
  @ArrayNotEmpty({ message: '自定义数据范围至少选择一个部门' })
  deptIds: string[]
}
