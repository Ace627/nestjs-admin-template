import { PaginationDto } from '@/common'
import { IsNotEmpty, IsOptional } from 'class-validator'

export class UnlockDto {
  @IsNotEmpty({ message: '参数 $property 不可为空' })
  username: string

  @IsNotEmpty({ message: '参数 $property 不可为空' })
  ip: string
}

export class QueryLoginLockDto extends PaginationDto {
  @IsOptional()
  username: string

  @IsOptional()
  ip: string
}
