import { ConfigService } from './config.service'
import { CreateConfigDto, QueryConfigDto, UpdateConfigDto } from './config.dto'
import { BusinessType, Operlog, PaginationPipe, RequirePermissions } from '@/common'
import { Body, Controller, Delete, Get, ParseArrayPipe, Post, Put, Query } from '@nestjs/common'

@Controller('system/config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  /** 新增参数 */
  @Post('create')
  @RequirePermissions(['system:config:create'])
  @Operlog({ title: '参数管理', businessType: BusinessType.INSERT })
  create(@Body() createDto: CreateConfigDto) {
    return this.configService.create(createDto)
  }

  /** 删除参数 */
  @Delete('delete')
  @RequirePermissions(['system:config:delete'])
  @Operlog({ title: '参数管理', businessType: BusinessType.DELETE })
  delete(@Query('ids', new ParseArrayPipe()) ids: string[]) {
    return this.configService.delete(ids)
  }

  /** 编辑参数 */
  @Put('update')
  @RequirePermissions(['system:config:update'])
  @Operlog({ title: '参数管理', businessType: BusinessType.UPDATE })
  update(@Body() updateDto: UpdateConfigDto) {
    return this.configService.update(updateDto)
  }

  /** 参数分页列表 */
  @Get('list')
  @RequirePermissions(['system:config:query'])
  findList(@Query(PaginationPipe) queryParams: QueryConfigDto) {
    return this.configService.findList(queryParams)
  }

  /** 参数详情 */
  @Get('detail')
  @RequirePermissions(['system:config:query'])
  findOne(@Query('id') id: string) {
    return this.configService.findOneById(id)
  }

  /** 按键名查询参数值（供前端取默认初始密码等场景，缓存优先；参数不存在时返回 null） */
  @Get('key')
  @RequirePermissions(['system:config:query'])
  findByKey(@Query('configKey') configKey: string) {
    return this.configService.getConfigValue(configKey)
  }

  /** 刷新参数缓存（清空全部参数缓存并回源重建） */
  @Delete('cache')
  @RequirePermissions(['system:config:refresh'])
  @Operlog({ title: '参数管理', businessType: BusinessType.CLEAR })
  refreshCache() {
    return this.configService.reloadCache()
  }
}
