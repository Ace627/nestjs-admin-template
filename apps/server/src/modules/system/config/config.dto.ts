import { PaginationDto } from '@/common'
import { PartialType } from '@nestjs/mapped-types'
import { IsIn, IsNotEmpty, IsOptional, Length, Matches } from 'class-validator'
import { CommonConstant } from '@/common'

export class CreateConfigDto {
  @IsNotEmpty({ message: '参数名称不能为空' })
  @Length(0, 100, { message: '参数名称长度不能超过 100 个字符' })
  configName: string

  @IsNotEmpty({ message: '参数键名不能为空' })
  @Matches(/^[a-zA-Z][a-zA-Z0-9_.]*$/, { message: '参数键名须以字母开头，仅含字母、数字、点与下划线' })
  @Length(0, 100, { message: '参数键名长度不能超过 100 个字符' })
  configKey: string

  @IsNotEmpty({ message: '参数键值不能为空' })
  @Length(0, 500, { message: '参数键值长度不能超过 500 个字符' })
  configValue: string

  @IsOptional()
  @IsIn([CommonConstant.CONFIG_TYPE_BUILTIN, CommonConstant.CONFIG_TYPE_CUSTOM], { message: '系统内置取值不合法' })
  configType: string

  @IsOptional()
  @Length(0, 200, { message: '备注长度不能超过 200 个字符' })
  remark: string
}

export class UpdateConfigDto extends PartialType(CreateConfigDto) {
  @IsNotEmpty({ message: '参数 ID 不能为空' })
  id: string
}

export class QueryConfigDto extends PaginationDto {
  @IsOptional()
  configName: string

  @IsOptional()
  configKey: string

  @IsOptional()
  configType: string
}
