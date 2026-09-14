import { Global, Module } from '@nestjs/common'
import { RedisService } from './redis.service'
import { CaptchaService } from './captcha.service'
import { LoginLockService } from './login-lock.service'

const services = [RedisService, CaptchaService, LoginLockService]

@Global()
@Module({
  providers: services,
  exports: services,
})
export class SharedModule {}
