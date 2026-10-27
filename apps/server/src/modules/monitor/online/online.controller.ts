import { OnlineService } from './online.service'
import { QueryOnlineDto, ForceLogoutDto } from './online.dto'
import { Controller, Delete, Get, Query } from '@nestjs/common'
import { BusinessType, Operlog, PaginationPipe, RequirePermissions } from '@/common'

@Controller('monitor/online')
export class OnlineController {
  constructor(private readonly onlineService: OnlineService) {}

  /** 分页列表查询 */
  @Get('list')
  @RequirePermissions(['monitor:online:query'])
  public findList(@Query(PaginationPipe) queryParams: QueryOnlineDto) {
    return this.onlineService.findList(queryParams)
  }

  /** 查询在线用户数量 */
  @Get('count')
  @RequirePermissions(['monitor:online:query'])
  public findCount() {
    return this.onlineService.findCount()
  }

  /** 强制用户退出登录，清除与该用户相关的所有 Redis 缓存 */
  @Delete('forceLogout')
  @RequirePermissions(['monitor:online:forceLogout'])
  @Operlog({ title: '在线用户', businessType: BusinessType.FORCE_LOGOUT })
  public forceLogout(@Query() data: ForceLogoutDto) {
    return this.onlineService.forceLogout(data)
  }
}
