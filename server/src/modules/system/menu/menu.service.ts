import { BusinessException, CommonConstant, ConfigConstant, MenuEntity, MenuType, RedisConstant } from '@/common'
import { RedisService } from '@/shared/redis.service'
import { isExternal, listToTree } from '@/utils'
import { DataSource, Equal, In } from 'typeorm'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { ConfigService } from '@nestjs/config'
import { Injectable } from '@nestjs/common'
import { Repository } from 'typeorm'
import { CreateMenuDto, QueryMenuDto, UpdateMenuDto, UpdateMenuSortItemDto } from './menu.dto'

@Injectable()
export class MenuService {
  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    @InjectRepository(MenuEntity) private readonly menuRepository: Repository<MenuEntity>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /** JWT 过期时间（秒），角色级缓存 TTL 与用户级缓存保持同源同生命周期 */
  private get expiresIn(): number {
    return this.configService.get<number>(ConfigConstant.JWT_EXPIRES_IN, 1800)
  }

  /** 新增菜单 */
  public async create(createDto: CreateMenuDto): Promise<string> {
    const parentId = createDto.parentId || CommonConstant.DEFAULT_PARENT_ID
    await this.checkParentMenuType(parentId, createDto.menuType)
    if (createDto.menuType === MenuType.BUTTON) await this.checkPermissionExists(createDto.permission)
    else await this.checkPathExists(createDto.path)

    const entity = new MenuEntity()
    Object.assign(entity, createDto, { parentId })
    this.cleanFields(entity, createDto.menuType)
    await this.menuRepository.save(entity)
    return '添加成功'
  }

  /** 编辑菜单 */
  public async update(updateDto: UpdateMenuDto): Promise<string> {
    const { id } = updateDto
    const entity = await this.menuRepository.findOneBy({ id: Equal(id) })
    if (!entity) throw new BusinessException('菜单不存在或已被删除')

    const targetParentId = updateDto.parentId || entity.parentId
    const targetType = updateDto.menuType || entity.menuType
    if (targetParentId === id) throw new BusinessException('上级菜单不能为自己')
    if ((await this.findDescendantIds([id])).includes(targetParentId)) throw new BusinessException('上级菜单不能为自己的下级菜单')
    await this.checkParentMenuType(targetParentId, targetType)
    if (targetType === MenuType.BUTTON) await this.checkPermissionExists(updateDto.permission, id)
    else await this.checkPathExists(updateDto.path ?? entity.path, id)
    // 本菜单已有子菜单时不可改为外链（前端 iframe 包装组件无子路由出口，子菜单会不可达）
    if (targetType !== MenuType.BUTTON && isExternal(updateDto.path ?? entity.path) && (await this.menuRepository.existsBy({ parentId: Equal(id) }))) {
      throw new BusinessException('存在子菜单，无法改为外链')
    }

    Object.assign(entity, updateDto, { parentId: targetParentId })
    this.cleanFields(entity, targetType)
    await this.menuRepository.save(entity)
    // 菜单（权限标识/状态）变更对角色权限缓存的影响延迟至缓存过期或重新登录生效（TTL 惰性重建）
    return '修改成功'
  }

  /** 批量保存菜单排序（事务内逐条更新，任一失败整体回滚） */
  public async updateSort(items: UpdateMenuSortItemDto[]): Promise<string> {
    if (!items.length) throw new BusinessException('未检测到排序修改')
    const ids = items.map((item) => item.id)
    const targets = await this.menuRepository.findBy({ id: In(ids) })
    if (targets.length !== new Set(ids).size) throw new BusinessException('菜单不存在')
    await this.dataSource.transaction(async (manager) => {
      for (const { id, menuSort } of items) {
        await manager.update(MenuEntity, id, { menuSort })
      }
    })
    return '排序成功'
  }

  /** 批量删除菜单（存在子菜单时拦截） */
  public async delete(ids: string[]): Promise<string> {
    // 校验目标菜单全部存在
    const targets = await this.menuRepository.findBy({ id: In(ids) })
    if (targets.length !== new Set(ids).size) throw new BusinessException('菜单不存在')
    if (await this.menuRepository.existsBy({ parentId: In(ids) })) throw new BusinessException('存在子菜单，无法删除')
    await this.menuRepository.delete(ids)
    // 清理角色-菜单中间表残留
    await this.dataSource.createQueryBuilder().delete().from('sys_role_menu').where('menu_id IN (:...ids)', { ids }).execute()
    return '删除成功'
  }

  /** 菜单树形列表（管理页用，含按钮与停用） */
  public async findList(queryParams: QueryMenuDto) {
    const { menuName, menuType, status } = queryParams
    const queryBuilder = this.menuRepository.createQueryBuilder('menu')
    if (menuName) queryBuilder.andWhere('menu.menuName LIKE :menuName', { menuName: `%${menuName}%` })
    if (menuType) queryBuilder.andWhere('menu.menuType = :menuType', { menuType })
    if (status) queryBuilder.andWhere('menu.status = :status', { status })
    queryBuilder.orderBy('menu.menuSort', 'ASC')
    return listToTree<MenuEntity>(await queryBuilder.getMany())
  }

  /** 上级菜单下拉列表（排除按钮） */
  public async findParentList() {
    const queryBuilder = this.menuRepository.createQueryBuilder('menu')
    queryBuilder.where('menu.menuType != :menuType', { menuType: MenuType.BUTTON })
    queryBuilder.andWhere('menu.status = :status', { status: CommonConstant.STATUS_NORMAL })
    queryBuilder.orderBy('menu.menuSort', 'ASC')
    const records = await queryBuilder.getMany()
    return [{ parentId: CommonConstant.DEFAULT_PARENT_ID, id: CommonConstant.DEFAULT_PARENT_ID, menuName: '主类目', children: listToTree(records) }]
  }

  /** 菜单详情 */
  public async findOneById(id: string) {
    const menu = await this.menuRepository.findOneBy({ id: Equal(id) })
    if (!menu) throw new BusinessException('菜单不存在或已被删除')
    return menu
  }

  /** 根据菜单 ID 组查询正常状态的菜单（角色授权用） */
  public async findManyByIds(menuIds: string[]) {
    if (!menuIds?.length) return []
    const queryBuilder = this.menuRepository.createQueryBuilder('menu')
    queryBuilder.where('menu.id IN (:...menuIds)', { menuIds })
    queryBuilder.andWhere('menu.status = :status', { status: CommonConstant.STATUS_NORMAL })
    queryBuilder.orderBy('menu.menuSort', 'ASC')
    return queryBuilder.getMany()
  }

  /**
   * 根据角色 ID 组查询其可见的路由菜单（扁平列表，前端 generateRoutes 建树）
   * @param isAdmin 超管直接返回全部
   */
  public async findRoutesByRoleIds(roleIds: string[], isAdmin: boolean) {
    const queryBuilder = this.menuRepository.createQueryBuilder('menu')
    queryBuilder.where('menu.menuType != :menuType', { menuType: MenuType.BUTTON })
    queryBuilder.andWhere('menu.status = :status', { status: CommonConstant.STATUS_NORMAL })
    if (!isAdmin) {
      queryBuilder.innerJoin('menu.roles', 'role')
      queryBuilder.andWhere('role.id IN (:...roleIds)', { roleIds })
    }
    queryBuilder.distinct(true)
    queryBuilder.orderBy('menu.menuSort', 'ASC')
    return queryBuilder.getMany()
  }

  /**
   * 根据角色 ID 组查询其全部按钮权限标识（去重）
   * @param isAdmin 超管直接返回全部
   */
  public async findPermsByRoleIds(roleIds: string[], isAdmin: boolean): Promise<string[]> {
    const queryBuilder = this.menuRepository.createQueryBuilder('menu')
    queryBuilder.where('menu.menuType = :menuType', { menuType: MenuType.BUTTON })
    queryBuilder.andWhere('menu.status = :status', { status: CommonConstant.STATUS_NORMAL })
    queryBuilder.andWhere('menu.permission IS NOT NULL')
    if (!isAdmin) {
      queryBuilder.innerJoin('menu.roles', 'role')
      queryBuilder.andWhere('role.id IN (:...roleIds)', { roleIds })
    }
    queryBuilder.distinct(true)
    const menus = await queryBuilder.getMany()
    return [...new Set(menus.map((menu) => menu.permission).filter((perm): perm is string => Boolean(perm)))]
  }

  /** 查询全部菜单 ID（超管角色授权回显用） */
  public async findAllIds(): Promise<string[]> {
    const menus = await this.menuRepository.find({ select: { id: true } })
    return menus.map((menu) => menu.id)
  }

  /** 根据角色 ID 查询其已授权的菜单 ID 集合（角色授权回显用） */
  public async findIdsByRoleId(roleId: string, isAdmin: boolean): Promise<string[]> {
    if (isAdmin) return this.findAllIds()
    const queryBuilder = this.menuRepository.createQueryBuilder('menu')
    queryBuilder.select(['menu.id'])
    queryBuilder.innerJoin('menu.roles', 'role')
    queryBuilder.where('role.id = :roleId', { roleId })
    const menus = await queryBuilder.getMany()
    return menus.map((menu) => menu.id)
  }

  /**
   * 读取角色级权限标识缓存（守卫 / AuthService.getInfo 消费）
   * 缓存缺失时回源重建并写回（带 TTL，与用户级缓存同生命周期；getInfo 是缺失场景的自愈入口）
   * @param isAdmin 超管角色传 true，缓存内容为菜单表全部启用按钮权限串（键不变，守卫依赖此缓存做严格匹配）
   * @param force 跳过读缓存直接重算并覆盖写回（单写者场景：角色授权后的立即生效重建用）
   */
  public async getPermsCacheByRoleId(roleId: string, isAdmin = false, force = false): Promise<string[]> {
    const cacheKey = `${RedisConstant.ROLE_PERMISSIONS}:${roleId}`
    if (!force) {
      const jsonStr = await this.redisService.get(cacheKey)
      if (jsonStr) return JSON.parse(jsonStr) as string[]
    }
    const perms = await this.findPermsByRoleIds([roleId], isAdmin)
    await this.redisService.set(cacheKey, JSON.stringify(perms), 'EX', this.expiresIn)
    return perms
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Handler                              */
  /* -------------------------------------------------------------------------- */

  /** 按菜单类型清空无意义字段（显式置 null，类型安全） */
  private cleanFields(entity: MenuEntity, menuType: string): void {
    if (menuType === MenuType.BUTTON) {
      entity.icon = null
      entity.component = null
      entity.path = null
      entity.isCache = CommonConstant.STATUS_DISABLE
    }
    if (menuType === MenuType.DIRECTORY) {
      entity.component = null
      entity.permission = null
    }
    if (menuType === MenuType.MENU) {
      entity.permission = null
    }
    // 外链菜单不存组件路径；内链菜单无「新标签页」打开方式，固定当前页
    if (isExternal(entity.path ?? '')) entity.component = null
    else entity.target = '1'
  }

  /** 校验路由 path 唯一（排除指定 ID） */
  private async checkPathExists(path?: string | null, excludeId?: string): Promise<void> {
    if (!path) throw new BusinessException('路由地址不能为空')
    const queryBuilder = this.menuRepository.createQueryBuilder('menu')
    queryBuilder.andWhere('menu.path = :path', { path: path.trim() })
    if (excludeId) queryBuilder.andWhere('menu.id != :id', { id: excludeId })
    if (await queryBuilder.getExists()) throw new BusinessException(`路由 ${path} 已存在`)
  }

  /** 校验权限标识唯一（排除指定 ID） */
  private async checkPermissionExists(permission?: string | null, excludeId?: string): Promise<void> {
    if (!permission) throw new BusinessException('按钮权限标识不能为空')
    const queryBuilder = this.menuRepository.createQueryBuilder('menu')
    queryBuilder.andWhere('menu.permission = :permission', { permission: permission.trim() })
    if (excludeId) queryBuilder.andWhere('menu.id != :id', { id: excludeId })
    if (await queryBuilder.getExists()) throw new BusinessException(`按钮权限 ${permission} 已存在`)
  }

  /** 校验上级菜单类型（菜单 C 下不能挂子级；外链菜单下不能挂子级；按钮 F 不校验） */
  private async checkParentMenuType(parentId: string, menuType: string): Promise<void> {
    if (parentId === CommonConstant.DEFAULT_PARENT_ID || menuType === MenuType.BUTTON) return
    const parent = await this.menuRepository.findOneBy({ id: Equal(parentId) })
    if (!parent) throw new BusinessException('上级菜单不存在')
    if (parent.menuType === MenuType.MENU) throw new BusinessException('菜单（C）下不能挂载子菜单')
    if (isExternal(parent.path ?? '')) throw new BusinessException('外链菜单下不能挂载子菜单')
  }

  /** 内存计算菜单子孙 ID 集合（含自身，防环校验用） */
  private async findDescendantIds(ids: string[]): Promise<string[]> {
    const all = await this.menuRepository.find()
    const result = new Set<string>()
    let frontier = [...ids]
    while (frontier.length) {
      const next = all.filter((menu) => frontier.includes(menu.parentId) && !result.has(menu.id)).map((menu) => menu.id)
      next.forEach((id) => result.add(id))
      frontier = next
    }
    return [...result]
  }
}
