import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DashboardController } from './dashboard.controller'
import { DashboardService } from './dashboard.service'
import { LoginLogEntity, OperlogEntity, RoleEntity, UserEntity } from '@/common'

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, RoleEntity, LoginLogEntity, OperlogEntity])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
