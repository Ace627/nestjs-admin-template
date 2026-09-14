import { Module } from '@nestjs/common'
import { JobService } from './job.service'
import { BullModule } from '@nestjs/bullmq'
import { ConfigService } from '@nestjs/config'
import { DiscoveryModule } from '@nestjs/core'
import { JobProcessor } from './job.processor'
import { TypeOrmModule } from '@nestjs/typeorm'
import { JobController } from './job.controller'
import { BullConstant, ConfigConstant, JobEntity, JobLogEntity } from '@/common'

@Module({
  imports: [
    DiscoveryModule,
    TypeOrmModule.forFeature([JobEntity, JobLogEntity]),
    /** 注册定时任务队列（BullMQ 硬性要求 maxRetriesPerRequest 必须为 null） */
    BullModule.registerQueueAsync({
      name: BullConstant.QUEUE_NAME,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          forceDisconnectOnShutdown: true,
          connection: { ...configService.get(ConfigConstant.REDIS), maxRetriesPerRequest: null },
        }
      },
    }),
  ],
  controllers: [JobController],
  providers: [JobService, JobProcessor],
})
export class JobModule {}
