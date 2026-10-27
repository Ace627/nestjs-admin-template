import { DashboardService } from './dashboard.service'
import { Controller, Get } from '@nestjs/common'

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /** 首页统计数据（仅登录态，不挂权限码） */
  @Get('statistics')
  public getStatistics() {
    return this.dashboardService.getStatistics()
  }
}
