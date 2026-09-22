import { Module } from '@nestjs/common'
import { LogService } from './log.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LogController } from './log.controller'
import { JobLogEntity, LoginLogEntity, OperlogEntity } from '@/common'

@Module({
  imports: [TypeOrmModule.forFeature([LoginLogEntity, OperlogEntity, JobLogEntity])],
  controllers: [LogController],
  providers: [LogService],
  exports: [LogService],
})
export class LogModule {}
