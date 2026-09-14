import { RequirePermissions, ResponseCache } from '@/common'
import { Controller, Get } from '@nestjs/common'
import { ServerService } from './server.service'

@Controller('monitor/server')
export class ServerController {
  constructor(private readonly serverService: ServerService) {}

  /* 获取监控数据 */
  @Get()
  @ResponseCache({ ttl: 180 })
  @RequirePermissions(['monitor:server:query'])
  public async getServer() {
    const methods = ['getCpuInfo', 'getMemoryInfo', 'getServerInfo', 'getDiskInfo']
    const promises = methods.map((method) => this.serverService[method]())
    const [cpu, memory, server, disks] = await Promise.all(promises)
    return { cpu, memory, server, disks }
  }

  /* 获取数据库连接池状态 */
  @Get('pool')
  @ResponseCache({ ttl: 180 })
  @RequirePermissions(['monitor:server:query'])
  public async getServerPool() {
    return this.serverService.getPoolInfo()
  }
}
