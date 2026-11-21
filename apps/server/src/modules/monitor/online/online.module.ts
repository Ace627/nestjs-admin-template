import { Module } from '@nestjs/common'
import { OnlineService } from './online.service'
import { OnlineController } from './online.controller'
import { UserModule } from '../../system/user/user.module'
import { DeptModule } from '../../system/dept/dept.module'

@Module({
  imports: [UserModule, DeptModule],
  controllers: [OnlineController],
  providers: [OnlineService],
})
export class OnlineModule {}
