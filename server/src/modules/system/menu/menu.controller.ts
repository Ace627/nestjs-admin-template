import { Body, Controller, Delete, Get, ParseArrayPipe, Post, Put, Query } from '@nestjs/common'
import { BusinessType, Operlog, RequirePermissions } from '@/common'
import { MenuService } from './menu.service'
import { CreateMenuDto, QueryMenuDto, UpdateMenuDto } from './menu.dto'

@Controller('system/menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  /** 新增菜单 */
  @Post('create')
  @RequirePermissions(['system:menu:create'])
  @Operlog({ title: '菜单管理', businessType: BusinessType.INSERT })
  create(@Body() createDto: CreateMenuDto) {
    return this.menuService.create(createDto)
  }

  /** 批量删除菜单 */
  @Delete('delete')
  @RequirePermissions(['system:menu:delete'])
  @Operlog({ title: '菜单管理', businessType: BusinessType.DELETE })
  delete(@Query('ids', new ParseArrayPipe()) ids: string[]) {
    return this.menuService.delete(ids)
  }

  /** 编辑菜单 */
  @Put('update')
  @RequirePermissions(['system:menu:update'])
  @Operlog({ title: '菜单管理', businessType: BusinessType.UPDATE })
  update(@Body() updateDto: UpdateMenuDto) {
    return this.menuService.update(updateDto)
  }

  /** 菜单树形列表 */
  @Get('list')
  @RequirePermissions(['system:menu:query'])
  findList(@Query() queryParams: QueryMenuDto) {
    return this.menuService.findList(queryParams)
  }

  /** 上级菜单下拉列表 */
  @Get('list/parent')
  @RequirePermissions(['system:menu:query'])
  findParentList() {
    return this.menuService.findParentList()
  }

  /** 菜单详情 */
  @Get('detail')
  @RequirePermissions(['system:menu:query'])
  findOneById(@Query('id') id: string) {
    return this.menuService.findOneById(id)
  }
}
