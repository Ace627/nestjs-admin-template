import { LogService } from './log.service'
import { QueryLoginlogDto, QueryOperlogDto } from './log.dto'
import { BusinessType, Operlog, PaginationPipe, RequirePermissions, SkipTransform } from '@/common'
import { Controller, Delete, Get, ParseArrayPipe, Post, Query } from '@nestjs/common'

@Controller('monitor/log')
export class LogController {
  constructor(private readonly logService: LogService) {}

  /* -------------------------------------------------------------------------- */
  /*                                  Login Log                                 */
  /* -------------------------------------------------------------------------- */

  /** 查询登录日志列表 */
  @Get('loginlog/list')
  @RequirePermissions(['monitor:loginlog:query'])
  public findLoginlogList(@Query(PaginationPipe) queryParams: QueryLoginlogDto) {
    return this.logService.findLoginlogList(queryParams)
  }

  /** 导出登录日志 */
  @SkipTransform()
  @Post('loginlog/export')
  @RequirePermissions(['monitor:loginlog:export'])
  @Operlog({ title: '登录日志', businessType: BusinessType.EXPORT })
  public exportLogininfo(@Query(PaginationPipe) queryParams: QueryLoginlogDto) {
    return this.logService.exportLogininfo(queryParams)
  }

  /** 删除登录日志 */
  @Delete('loginlog/delete')
  @RequirePermissions(['monitor:loginlog:delete'])
  @Operlog({ title: '登录日志', businessType: BusinessType.DELETE })
  public deleteLoginlog(@Query('ids', new ParseArrayPipe()) ids: string[]) {
    return this.logService.deleteLoginlog(ids)
  }

  /** 清空登录日志 */
  @Delete('loginlog/clear')
  @RequirePermissions(['monitor:loginlog:clear'])
  @Operlog({ title: '登录日志', businessType: BusinessType.CLEAR })
  public clearLoginlog() {
    return this.logService.clearLoginlog()
  }

  /* -------------------------------------------------------------------------- */
  /*                                  Oper Log                                  */
  /* -------------------------------------------------------------------------- */

  /** 查询操作日志列表 */
  @Get('operlog/list')
  @RequirePermissions(['monitor:operlog:query'])
  public findOperLogList(@Query(PaginationPipe) queryParams: QueryOperlogDto) {
    return this.logService.findOperLogList(queryParams)
  }

  /** 导出操作日志 */
  @SkipTransform()
  @Post('operlog/export')
  @RequirePermissions(['monitor:operlog:export'])
  @Operlog({ title: '操作日志', businessType: BusinessType.EXPORT })
  public exportOperLog(@Query(PaginationPipe) queryParams: QueryOperlogDto) {
    return this.logService.exportOperLog(queryParams)
  }

  /** 删除操作日志 */
  @Delete('operlog/delete')
  @RequirePermissions(['monitor:operlog:delete'])
  @Operlog({ title: '操作日志', businessType: BusinessType.DELETE })
  public deleteOperinfo(@Query('ids', new ParseArrayPipe()) ids: string[]) {
    return this.logService.deleteOperinfo(ids)
  }

  /** 清空操作日志 */
  @Delete('operlog/clear')
  @RequirePermissions(['monitor:operlog:clear'])
  @Operlog({ title: '操作日志', businessType: BusinessType.CLEAR })
  public clearOperinfo() {
    return this.logService.clearOperinfo()
  }
}
