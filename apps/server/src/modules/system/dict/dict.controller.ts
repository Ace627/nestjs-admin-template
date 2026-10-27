import { Body, Controller, Delete, Get, ParseArrayPipe, Post, Put, Query } from '@nestjs/common'
import { BusinessType, Operlog, PaginationPipe, RequirePermissions } from '@/common'
import { DictTypeService } from './dict-type.service'
import { DictDataService } from './dict-data.service'
import { CreateDictDataDto, CreateDictTypeDto, QueryDictDataDto, QueryDictTypeDto, UpdateDictDataDto, UpdateDictTypeDto } from './dict.dto'

@Controller('system/dict')
export class DictController {
  constructor(
    private readonly dictTypeService: DictTypeService,
    private readonly dictDataService: DictDataService,
  ) {}

  /* ----------------------------- 字典类型 ----------------------------- */

  /** 新增字典类型 */
  @Post('type/create')
  @RequirePermissions(['system:dict:create'])
  @Operlog({ title: '字典类型', businessType: BusinessType.INSERT })
  createType(@Body() createDto: CreateDictTypeDto) {
    return this.dictTypeService.create(createDto)
  }

  /** 删除字典类型 */
  @Delete('type/delete')
  @RequirePermissions(['system:dict:delete'])
  @Operlog({ title: '字典类型', businessType: BusinessType.DELETE })
  deleteType(@Query('ids', new ParseArrayPipe()) ids: string[]) {
    return this.dictTypeService.delete(ids)
  }

  /** 编辑字典类型 */
  @Put('type/update')
  @RequirePermissions(['system:dict:update'])
  @Operlog({ title: '字典类型', businessType: BusinessType.UPDATE })
  updateType(@Body() updateDto: UpdateDictTypeDto) {
    return this.dictTypeService.update(updateDto)
  }

  /** 字典类型分页列表 */
  @Get('type/list')
  @RequirePermissions(['system:dict:query'])
  findTypeList(@Query(PaginationPipe) queryParams: QueryDictTypeDto) {
    return this.dictTypeService.findList(queryParams)
  }

  /** 字典类型详情 */
  @Get('type/detail')
  @RequirePermissions(['system:dict:query'])
  findTypeOne(@Query('id') id: string) {
    return this.dictTypeService.findOneById(id)
  }

  /* ----------------------------- 字典数据 ----------------------------- */

  /** 新增字典数据 */
  @Post('data/create')
  @RequirePermissions(['system:dict:create'])
  @Operlog({ title: '字典数据', businessType: BusinessType.INSERT })
  createData(@Body() createDto: CreateDictDataDto) {
    return this.dictDataService.create(createDto)
  }

  /** 删除字典数据 */
  @Delete('data/delete')
  @RequirePermissions(['system:dict:delete'])
  @Operlog({ title: '字典数据', businessType: BusinessType.DELETE })
  deleteData(@Query('ids', new ParseArrayPipe()) ids: string[]) {
    return this.dictDataService.delete(ids)
  }

  /** 编辑字典数据 */
  @Put('data/update')
  @RequirePermissions(['system:dict:update'])
  @Operlog({ title: '字典数据', businessType: BusinessType.UPDATE })
  updateData(@Body() updateDto: UpdateDictDataDto) {
    return this.dictDataService.update(updateDto)
  }

  /** 字典数据分页列表 */
  @Get('data/list')
  @RequirePermissions(['system:dict:query'])
  findDataList(@Query(PaginationPipe) queryParams: QueryDictDataDto) {
    return this.dictDataService.findList(queryParams)
  }

  /** 字典数据详情 */
  @Get('data/detail')
  @RequirePermissions(['system:dict:query'])
  findDataOne(@Query('id') id: string) {
    return this.dictDataService.findOneById(id)
  }

  /** 根据字典类型查询字典数据（前端 useDict 使用，缓存优先） */
  @Get('data/type')
  findByType(@Query('dictType') dictType: string) {
    return this.dictDataService.findByType(dictType)
  }

  /** 刷新字典缓存（清空全部字典缓存，下次查询回源重建） */
  @Delete('cache')
  @RequirePermissions(['system:dict:refresh'])
  @Operlog({ title: '字典数据', businessType: BusinessType.CLEAR })
  refreshCache() {
    return this.dictDataService.clearAllCache()
  }
}
