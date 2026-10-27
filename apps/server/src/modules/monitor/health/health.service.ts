import axios from 'axios'
import { platform } from 'node:os'
import { Injectable } from '@nestjs/common'
import { HealthCheckService, DiskHealthIndicator, HealthCheckResult, MemoryHealthIndicator, TypeOrmHealthIndicator } from '@nestjs/terminus'

@Injectable()
export class HealthService {
  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly diskHealthIndicator: DiskHealthIndicator,
    private readonly memoryHealthIndicator: MemoryHealthIndicator,
    private readonly typeOrmHealthIndicator: TypeOrmHealthIndicator,
  ) {}

  /** 检查网络 */
  public async checkNetwork(): Promise<HealthCheckResult> {
    try {
      await axios.head('https://gitee.com', { timeout: 3000 })
      return { status: 'ok', info: { network: { status: 'up' } }, error: {}, details: { network: { status: 'up' } } }
    } catch (err) {
      return { status: 'error', info: {}, error: { network: { status: 'down', message: '网络不通' } }, details: { network: { status: 'down' } } }
    }
  }

  /** 检查数据库 */
  public checkDatabase(): Promise<HealthCheckResult> {
    return this.healthCheckService.check([() => this.typeOrmHealthIndicator.pingCheck('database')])
  }

  /** 检查内存 */
  public checkMemory(): Promise<HealthCheckResult> {
    return this.healthCheckService.check([() => this.memoryHealthIndicator.checkHeap('memory_heap', 200 * 1024 * 1024)])
  }

  /** 检查RSS */
  public checkRSS(): Promise<HealthCheckResult> {
    return this.healthCheckService.check([() => this.memoryHealthIndicator.checkRSS('memory_rss', 200 * 1024 * 1024)])
  }

  /** 检查磁盘 */
  public checkStorage(): Promise<HealthCheckResult> {
    return this.healthCheckService.check([() => this.diskHealthIndicator.checkStorage('disk', { path: this.diskPath, thresholdPercent: 0.75 })])
  }

  /** 全量检查（这个会返回完整的 info 信息） */
  public async checkAll(): Promise<HealthCheckResult> {
    const networkResult = await this.checkNetwork()
    const systemResult = await this.healthCheckService.check([
      () => this.typeOrmHealthIndicator.pingCheck('database'),
      () => this.memoryHealthIndicator.checkHeap('memory_heap', 200 * 1024 * 1024),
      () => this.memoryHealthIndicator.checkRSS('memory_rss', 200 * 1024 * 1024),
      () => this.diskHealthIndicator.checkStorage('disk', { path: this.diskPath, thresholdPercent: 0.75 }),
    ])
    return {
      status: networkResult.status === 'ok' && systemResult.status === 'ok' ? 'ok' : 'error',
      info: { ...networkResult.info, ...systemResult.info },
      error: { ...networkResult.error, ...systemResult.error },
      details: { ...networkResult.details, ...systemResult.details },
    }
  }

  /** 跨平台磁盘路径 */
  private get diskPath() {
    return platform() === 'win32' ? 'C:' : '/'
  }
}
