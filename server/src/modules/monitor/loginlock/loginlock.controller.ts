import { LoginLockService } from '@/shared/login-lock.service'
import { UnlockDto, QueryLoginLockDto } from './loginlock.dto'
import { Controller, Delete, Get, Query } from '@nestjs/common'
import { BusinessType, Operlog, PaginationPipe, RequirePermissions } from '@/common'

@Controller('monitor/loginlock')
export class LoginlockController {
  constructor(private readonly loginLockService: LoginLockService) {}

  /** 分页列表查询 */
  @Get('list')
  @RequirePermissions(['monitor:loginlock:query'])
  public findList(@Query(PaginationPipe) queryParams: QueryLoginLockDto) {
    return this.loginLockService.findLockedList(queryParams)
  }

  /** 解锁指定账号的指定来源 */
  @Delete('unlock')
  @RequirePermissions(['monitor:loginlock:unlock'])
  @Operlog({ title: '登录锁定', businessType: BusinessType.UNLOCK })
  public unlock(@Query() data: UnlockDto) {
    return this.loginLockService.unlock(data.username, data.ip)
  }
}
