import { CacheService } from './cache.service'
import { Controller, Delete, Get, Query } from '@nestjs/common'
import { Operlog, BusinessType, RequirePermissions } from '@/common'

@Controller('monitor/cache')
export class CacheController {
  constructor(private readonly cacheService: CacheService) {}

  /** 缓存监控 */
  @Get()
  @RequirePermissions(['monitor:cache:query'])
  public getInfo() {
    return this.cacheService.getInfo()
  }

  /** 获取所有缓存分类名称 */
  @Get('names')
  @RequirePermissions(['monitor:cache:query'])
  public getNames() {
    return this.cacheService.getNames()
  }

  /** 清除指定分类下的所有缓存 */
  @Delete('names/delete')
  @RequirePermissions(['monitor:cache:clear'])
  @Operlog({ title: '缓存列表', businessType: BusinessType.CLEAR })
  public clearCacheName(@Query('name') name: string) {
    return this.cacheService.clearCacheName(name)
  }

  /** 缓存键名列表 */
  @Get('keys')
  @RequirePermissions(['monitor:cache:query'])
  public getKeys(@Query('name') name: string) {
    return this.cacheService.getKeys(name)
  }

  /** 获取对应 key 的缓存数据 */
  @Get('keys/detail')
  @RequirePermissions(['monitor:cache:query'])
  public getValue(@Query('key') key: string) {
    return this.cacheService.getValue(key)
  }

  /** 删除对应 key 的缓存数据 */
  @Delete('keys/delete')
  @RequirePermissions(['monitor:cache:delete'])
  @Operlog({ title: '缓存列表', businessType: BusinessType.DELETE })
  public clearCacheKey(@Query('key') key: string) {
    return this.cacheService.clearCacheKey(key)
  }
}
