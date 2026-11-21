import { PaginationDto } from '@/common'
import { IsNotEmpty, IsOptional } from 'class-validator'

export class ForceLogoutDto {
  @IsNotEmpty({ message: '参数 $property 不可为空' })
  userId: string

  @IsNotEmpty({ message: '参数 $property 不可为空' })
  uuid: string
}

/** 在线会话记录（登录创建、续签轮换覆盖重建时写入 Redis） */
export class CreateOnlineDto {
  @IsNotEmpty({ message: '参数 $property 不可为空' })
  userId: string

  @IsNotEmpty({ message: '参数 $property 不可为空' })
  username: string

  /** 登录设备标识（同一次会话续签保持不变） */
  @IsOptional()
  uuid?: string

  /** 是否由刷新令牌触发的覆盖重建 */
  @IsOptional()
  isRefresh?: boolean

  /** 会话首次登录时间（续签轮换时原样续传，不重置会话时长） */
  @IsOptional()
  loginTime?: string
}

export class QueryOnlineDto extends PaginationDto {
  @IsOptional()
  username: string

  @IsOptional()
  location: string

  @IsOptional()
  ip: string
}
