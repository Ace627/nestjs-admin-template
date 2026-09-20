import { PaginationDto } from '@/common'
import { Exclude } from 'class-transformer'
import { PartialType, PickType } from '@nestjs/mapped-types'
import { IsArray, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator'

export class CreateUserDto {
  @IsNotEmpty({ message: '参数 $property  不能为空' })
  @Matches(/^[a-zA-Z][a-zA-Z0-9]*$/, { message: '用户账号须以字母开头、仅含字母与数字' })
  username: string

  @IsNotEmpty({ message: '参数 $property  不能为空' })
  password: string

  @IsArray()
  @IsNotEmpty({ message: '参数 $property 不可为空' })
  roleIds: string[]

  /** 归属部门ID */
  @IsNotEmpty({ message: '参数 $property  不能为空' })
  @IsString()
  deptId: string

  @IsOptional()
  nickname: string

  @IsOptional()
  realname: string

  @IsOptional()
  age: number

  @IsOptional()
  status: string

  @IsOptional()
  email: string

  @IsOptional()
  phone: string

  @IsOptional()
  gender: string

  @IsOptional()
  remark: string
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsNotEmpty({ message: '参数 $property  不能为空' })
  id: string

  @IsNotEmpty({ message: '参数 $property 不可为空' })
  roleIds: string[]

  @Exclude()
  username: string

  @Exclude()
  password: string

  @Exclude()
  createBy: string
}

export class QueryUserDto extends PaginationDto {
  @IsOptional()
  username: string

  @IsOptional()
  nickname: string

  @IsOptional()
  email: string

  @IsOptional()
  phone: string

  @IsOptional()
  status: string

  /** 归属部门ID（过滤该部门及其全部子孙部门） */
  @IsOptional()
  @IsString()
  deptId: string
}

export class UpdateUserPwdDto {
  @IsNotEmpty({ message: '参数 $property 不可为空' })
  oldPassword: string

  @IsNotEmpty({ message: '参数 $property 不可为空' })
  newPassword: string

  @IsNotEmpty({ message: '参数 $property 不可为空' })
  repeatPassword: string
}

export class ResetUserPwdDto extends PickType(CreateUserDto, ['username', 'password']) {}

export class UpdateProfileDto {
  @IsOptional()
  nickname: string

  @IsOptional()
  realname: string

  @IsOptional()
  phone: string

  @IsOptional()
  age: number

  @IsOptional()
  email: string

  @IsOptional()
  gender: string

  /** 用户头像（相对路径 uploads/哈希.后缀） */
  @IsOptional()
  @Matches(/^uploads\/[\w-]+\.(jpe?g|png|webp|gif)$/, { message: '头像地址不合法' })
  avatar: string
}
