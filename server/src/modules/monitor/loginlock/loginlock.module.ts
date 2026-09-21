import { Module } from '@nestjs/common'
import { LoginlockController } from './loginlock.controller'

@Module({
  controllers: [LoginlockController],
})
export class LoginlockModule {}
