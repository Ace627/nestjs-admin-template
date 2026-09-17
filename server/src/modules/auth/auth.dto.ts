import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class LoginDto {
  @IsNotEmpty({ message: '参数 $property  不能为空' })
  @IsString({ message: '参数 $property  必须是字符串' })
  username: string

  @IsNotEmpty({ message: '参数 $property  不能为空' })
  @IsString({ message: '参数 $property  必须是字符串' })
  password: string

  /** 验证码与唯一标识：开关关闭时前端不传，服务端按开关决定是否校验 */
  @IsOptional()
  @IsString({ message: '参数 $property  必须是字符串' })
  captcha: string

  @IsOptional()
  @IsString({ message: '参数 $property  必须是字符串' })
  uuid: string
}
