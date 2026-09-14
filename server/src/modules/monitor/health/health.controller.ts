import { Public } from '@/common'
import { HealthCheck } from '@nestjs/terminus'
import { Controller, Get } from '@nestjs/common'
import { HealthService } from './health.service'

@Controller('monitor/health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  // ==========================
  // K8s / Docker 探针专用
  // 轻量、无依赖、永不宕机
  // ==========================
  @Public()
  @Get('/live')
  healthLive() {
    return { status: 'ok', message: '服务运行中' }
  }

  @Public()
  @Get('/ready')
  healthReady() {
    return { status: 'ok', message: '服务已就绪' }
  }

  /** 检查所有健康状态 */
  @Get()
  @HealthCheck()
  public async checkAll() {
    return this.healthService.checkAll()
  }

  /** 检查网络健康状态 */
  @Get('network')
  @HealthCheck()
  public checkNetwork() {
    return this.healthService.checkNetwork()
  }

  /** 检查数据库健康状态 */
  @Get('database')
  @HealthCheck()
  public async checkDatabase() {
    return this.healthService.checkDatabase()
  }

  /** 检查内存堆健康状态 */
  @Get('memory')
  @HealthCheck()
  public async checkMemory() {
    return this.healthService.checkMemory()
  }

  /** 检查内存 RSS 健康状态 */
  @Get('rss')
  @HealthCheck()
  public async checkRSS() {
    return this.healthService.checkRSS()
  }

  /** 检查磁盘健康状态 */
  @Get('storage')
  @HealthCheck()
  public async checkStorage() {
    return this.healthService.checkStorage()
  }
}
