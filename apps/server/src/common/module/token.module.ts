import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { ConfigConstant } from '../constant/config.constant'

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => {
        // JWT 密钥，从配置中获取，提供默认值保证容错性
        // 有效期是由 Redis 控制的，这里只负责生成 JWT，不负责验证，验证时会检查 Redis 中是否存在对应的 token
        const secret: string = configService.getOrThrow<string>(ConfigConstant.JWT_SECRET)
        return { secret }
      },
      // 设为全局模块，所有业务模块可直接使用 JwtService，无需重复导入
      global: true,
      // 指定注入 ConfigService 作为依赖
      inject: [ConfigService],
    }),
  ],
})
export class TokenModule {}
