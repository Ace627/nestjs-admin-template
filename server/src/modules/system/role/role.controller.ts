import { Body, Controller, Delete, Get, ParseArrayPipe, Post, Put, Query } from '@nestjs/common'
import { BusinessException, BusinessType, Operlog, PaginationPipe, RequirePermissions } from '@/common'
import { RoleService } from './role.service'
import { AuthRolePermissionDto, ChangeRoleStatusDto, CreateRoleDto, QueryRoleDto, UpdateRoleDataScopeDto, UpdateRoleDto } from './role.dto'

@Controller('system/role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  /** 创建角色 */
  @Post('create')
  @RequirePermissions(['system:role:create'])
  @Operlog({ title: '角色管理', businessType: BusinessType.INSERT })
  create(@Body() createDto: CreateRoleDto) {
    return this.roleService.create(createDto)
  }

  /** 批量删除角色 */
  @Delete('delete')
  @RequirePermissions(['system:role:delete'])
  @Operlog({ title: '角色管理', businessType: BusinessType.DELETE })
  delete(@Query('ids', new ParseArrayPipe()) ids: string[]) {
    return this.roleService.delete(ids)
  }

  /** 编辑角色 */
  @Put('update')
  @RequirePermissions(['system:role:update'])
  @Operlog({ title: '角色管理', businessType: BusinessType.UPDATE })
  update(@Body() updateDto: UpdateRoleDto) {
    return this.roleService.update(updateDto)
  }

  /** 修改角色状态 */
  @Put('changeStatus')
  @RequirePermissions(['system:role:update'])
  @Operlog({ title: '角色管理', businessType: BusinessType.UPDATE })
  changeStatus(@Body() changeDto: ChangeRoleStatusDto) {
    return this.roleService.changeStatus(changeDto)
  }

  /** 授权角色菜单权限 */
  @Post('authPermission')
  @RequirePermissions(['system:role:update'])
  @Operlog({ title: '角色管理', businessType: BusinessType.UPDATE })
  authPermission(@Body() authDto: AuthRolePermissionDto) {
    return this.roleService.authPermission(authDto)
  }

  /** 设置角色数据范围 */
  @Put('dataScope')
  @RequirePermissions(['system:role:update'])
  @Operlog({ title: '角色管理', businessType: BusinessType.UPDATE })
  updateDataScope(@Body() scopeDto: UpdateRoleDataScopeDto) {
    return this.roleService.updateDataScope(scopeDto)
  }

  /** 角色分页列表 */
  @Get('list')
  @RequirePermissions(['system:role:query'])
  findList(@Query(PaginationPipe) queryParams: QueryRoleDto) {
    return this.roleService.findList(queryParams)
  }

  /** 角色不分页列表（分配角色下拉用） */
  @Get('list/all')
  @RequirePermissions(['system:role:query'])
  findAll() {
    return this.roleService.findAll()
  }

  /** 角色详情 */
  @Get('detail')
  @RequirePermissions(['system:role:query'])
  findOneById(@Query('id') id: string) {
    return this.roleService.findOneById(id)
  }

  /** 查询角色已授权的菜单 ID 集合（授权树回显用） */
  @Get('permission')
  @RequirePermissions(['system:role:query'])
  findRoleMenuIds(@Query('roleId') roleId: string) {
    return this.roleService.findRoleMenuIds(roleId)
  }

  /** 查询角色数据范围及自定义部门 ID 组（数据权限 Tab 回显用，顺带预热缓存） */
  @Get('dataScope')
  @RequirePermissions(['system:role:query'])
  async findRoleDataScope(@Query('roleId') roleId: string) {
    const cache = await this.roleService.getRoleScopeCache(roleId)
    if (!cache) throw new BusinessException('角色不存在')
    return cache
  }
}
