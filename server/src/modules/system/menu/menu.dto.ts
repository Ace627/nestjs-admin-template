import { MenuType } from '@/common'
import { PartialType } from '@nestjs/mapped-types'
import { Type } from 'class-transformer'
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator'

export class CreateMenuDto {
  /** 上级菜单ID（空则挂根节点） */
  @IsOptional()
  @IsString()
  parentId: string

  @IsNotEmpty({ message: '参数 $property 不能为空' })
  @IsString()
  @Length(1, 50, { message: '菜单名称长度须在 1~50 之间' })
  menuName: string

  @IsIn([MenuType.DIRECTORY, MenuType.MENU, MenuType.BUTTON], { message: '菜单类型取值仅限 M/C/F' })
  menuType: string

  @IsOptional()
  @IsString()
  @Length(1, 200, { message: '路由地址长度须在 1~200 之间' })
  path: string

  @IsOptional()
  @IsString()
  @Length(1, 255, { message: '组件路径长度须在 1~255 之间' })
  component: string

  @IsOptional()
  @IsString()
  @Length(1, 64, { message: '菜单图标长度须在 1~64 之间' })
  icon: string

  @IsOptional()
  @IsString()
  @Length(1, 100, { message: '权限字符长度须在 1~100 之间' })
  permission: string

  @IsOptional()
  @Matches(/^[01]$/, { message: '显示状态取值仅限 0 或 1' })
  visible: string

  @IsOptional()
  @Matches(/^[01]$/, { message: '状态取值仅限 0 或 1' })
  status: string

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '显示顺序必须是整数' })
  menuSort: number

  @IsOptional()
  @Matches(/^[01]$/, { message: '是否缓存取值仅限 0 或 1' })
  isCache: string

  @IsOptional()
  @Matches(/^[12]$/, { message: '打开方式取值仅限 1 或 2' })
  target: string
}

export class UpdateMenuDto extends PartialType(CreateMenuDto) {
  @IsNotEmpty({ message: '参数 $property 不能为空' })
  @IsString()
  id: string
}

export class QueryMenuDto {
  @IsOptional()
  @IsString()
  menuName: string

  @IsOptional()
  @IsIn([MenuType.DIRECTORY, MenuType.MENU, MenuType.BUTTON], { message: '菜单类型取值仅限 M/C/F' })
  menuType: string

  @IsOptional()
  @Matches(/^[01]$/, { message: '状态取值仅限 0 或 1' })
  status: string
}
