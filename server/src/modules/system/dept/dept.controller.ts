import { Body, Controller, Delete, Get, ParseArrayPipe, Post, Put, Query } from '@nestjs/common'
import { BusinessType, Operlog, RequirePermissions } from '@/common'
import { DeptService } from './dept.service'
import { CreateDeptDto, QueryDeptDto, UpdateDeptDto } from './dept.dto'

@Controller('system/dept')
export class DeptController {
  constructor(private readonly deptService: DeptService) {}

  /** 部门树形列表（含停用） */
  @Get('list')
  @RequirePermissions(['system:dept:query'])
  findTree(@Query() queryParams: QueryDeptDto) {
    return this.deptService.findTree(queryParams)
  }

  /** 部门下拉树（仅正常状态） */
  @Get('tree')
  @RequirePermissions(['system:dept:query'])
  findTreeSelect() {
    return this.deptService.findTreeSelect()
  }

  /** 部门详情 */
  @Get('detail')
  @RequirePermissions(['system:dept:query'])
  findOneById(@Query('id') id: string) {
    return this.deptService.findOneById(id)
  }

  /** 新增部门 */
  @Post('create')
  @RequirePermissions(['system:dept:create'])
  @Operlog({ title: '部门管理', businessType: BusinessType.INSERT })
  create(@Body() createDto: CreateDeptDto) {
    return this.deptService.create(createDto)
  }

  /** 编辑部门 */
  @Put('update')
  @RequirePermissions(['system:dept:update'])
  @Operlog({ title: '部门管理', businessType: BusinessType.UPDATE })
  update(@Body() updateDto: UpdateDeptDto) {
    return this.deptService.update(updateDto)
  }

  /** 删除部门 */
  @Delete('delete')
  @RequirePermissions(['system:dept:delete'])
  @Operlog({ title: '部门管理', businessType: BusinessType.DELETE })
  delete(@Query('ids', new ParseArrayPipe()) ids: string[]) {
    return this.deptService.delete(ids)
  }
}
