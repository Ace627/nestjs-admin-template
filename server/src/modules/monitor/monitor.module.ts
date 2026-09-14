import { Module } from '@nestjs/common'
import { LogModule } from './log/log.module'
import { OnlineModule } from './online/online.module'
import { ServerModule } from './server/server.module'
import { CacheModule } from './cache/cache.module'
import { JobModule } from './job/job.module'
import { HealthModule } from './health/health.module';

@Module({
  imports: [LogModule, OnlineModule, ServerModule, CacheModule, JobModule, HealthModule],
  exports: [LogModule],
})
export class MonitorModule {}
