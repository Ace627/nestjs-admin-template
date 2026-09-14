import { PaginationDto } from '@/common'
import { IsNotEmpty, IsOptional } from 'class-validator'

export class ForceLogoutDto {
  @IsNotEmpty({ message: '参数 $property 不可为空' })
  userId: string

  @IsNotEmpty({ message: '参数 $property 不可为空' })
  uuid: string
}

export class QueryOnlineDto extends PaginationDto {
  @IsOptional()
  username: string

  @IsOptional()
  location: string

  @IsOptional()
  ip: string
}
