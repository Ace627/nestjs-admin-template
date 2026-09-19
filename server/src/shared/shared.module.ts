import { Global, Module } from '@nestjs/common'
import { RedisService } from './redis.service'
import { CaptchaService } from './captcha.service'
import { LoginLockService } from './login-lock.service'
import { ConfigModule } from '@/modules/system/config/config.module'

const services = [RedisService, CaptchaService, LoginLockService]

@Global()
@Module({
  imports: [ConfigModule],
  providers: services,
  exports: services,
})
export class SharedModule {}
