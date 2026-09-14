import type { RbacType } from '@/types'
import { Injectable } from '@nestjs/common'
import { MenuService } from '../menu/menu.service'
import { RedisService } from '@/shared/redis.service'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { DataSource, Equal, FindOptionsWhere, In, Like, Not, Repository } from 'typeorm'
import { BusinessException, CommonConstant, ConfigConstant, DataScopeType, RedisConstant, RoleDeptEntity, RoleEntity, RbacConstant } from '@/common'
import { ConfigService } from '@nestjs/config'
import { AuthRolePermissionDto, ChangeRoleStatusDto, CreateRoleDto, QueryRoleDto, UpdateRoleDataScopeDto, UpdateRoleDto } from './role.dto'

@Injectable()
export class RoleService {
  constructor(
    private readonly redisService: RedisService,
    private readonly menuService: MenuService,
    private readonly configService: ConfigService,
    @InjectRepository(RoleEntity) private readonly roleRepository: Repository<RoleEntity>,
    @InjectRepository(RoleDeptEntity) private readonly roleDeptRepository: Repository<RoleDeptEntity>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /** JWT 过期时间（秒），角色级缓存 TTL 与用户级缓存保持同源同生命周期 */
  private get expiresIn(): number {
    return this.configService.get<number>(ConfigConstant.JWT_EXPIRES_IN, 1800)
  }

  /** 创建角色 */
  public async create(createDto: CreateRoleDto) {
    if (createDto.roleCode === RbacConstant.SUPER_ROLE_CODE) throw new BusinessException('该角色编码为系统保留编码')
    if (await this.roleRepository.existsBy({ roleCode: Equal(createDto.roleCode) })) throw new BusinessException('角色编码已存在')
    const entity = new RoleEntity()
    Object.assign(entity, createDto)
    await this.roleRepository.save(entity)
    return '添加成功'
  }

  /** 编辑角色（系统管理员角色禁止改编码与状态） */
  public async update(updateDto: UpdateRoleDto) {
    const { id, roleCode, status } = updateDto
    const record = await this.roleRepository.findOneBy({ id: Equal(id) })
    if (!record) throw new BusinessException('角色不存在')
    if (roleCode && roleCode !== record.roleCode && (await this.roleRepository.existsBy({ roleCode: Equal(roleCode), id: Not(id) }))) {
      throw new BusinessException('角色编码已存在')
    }
    if (record.roleCode === RbacConstant.SUPER_ROLE_CODE) {
      if (roleCode && roleCode !== record.roleCode) throw new BusinessException('系统管理员角色编码禁止修改')
      if (status && status !== record.status) throw new BusinessException('系统管理员角色状态禁止修改')
    }
    Object.assign(record, updateDto)
    await this.roleRepository.save(record)
    // 角色状态/编码变更对角色级缓存的影响延迟至缓存过期或重新登录生效（TTL 惰性重建，对齐若依语义）
    return '修改成功'
  }

  /** 批量删除角色（系统管理员角色禁止删除） */
  public async delete(ids: string[]) {
    const roleList = await this.roleRepository.findBy({ id: In(ids) })
    if (roleList.length !== new Set(ids).size) throw new BusinessException('角色不存在')
    if (roleList.some((role) => role.roleCode === RbacConstant.SUPER_ROLE_CODE)) throw new BusinessException('系统管理员角色禁止删除')

    // 清理用户-角色、角色-菜单中间表残留
    await this.dataSource.createQueryBuilder().delete().from('sys_user_role').where('role_id IN (:...ids)', { ids }).execute()
    await this.dataSource.createQueryBuilder().delete().from('sys_role_menu').where('role_id IN (:...ids)', { ids }).execute()
    await this.roleRepository.delete(ids)
    // 角色已删：权限缓存覆盖为空数组并带 TTL（持有该角色的存量会话不触发 403，键随 TTL 自然消亡，无孤儿键）；
    // 数据范围缓存直接删除（拦截器对缺失键 fail-closed 按 1=0 处理）
    await Promise.all(ids.map((roleId) => this.redisService.setex(`${RedisConstant.ROLE_PERMISSIONS}:${roleId}`, this.expiresIn, '[]')))
    await this.redisService.del(...ids.map((roleId) => `${RedisConstant.ROLE_DATA_SCOPE}:${roleId}`))
    return '删除成功'
  }

  /** 角色分页列表 */
  public async findList(queryParams: QueryRoleDto) {
    const { skip, take, roleName, roleCode, status } = queryParams
    const where: FindOptionsWhere<RoleEntity> = {}
    if (roleName) where.roleName = Like(`%${roleName}%`)
    if (roleCode) where.roleCode = Equal(roleCode)
    if (status) where.status = Equal(status)
    const queryBuilder = this.roleRepository.createQueryBuilder('role')
    queryBuilder.where(where)
    queryBuilder.orderBy('role.roleSort', 'ASC')
    queryBuilder.skip(skip).take(take)
    const [records, total] = await queryBuilder.getManyAndCount()
    return { total, records }
  }

  /** 角色不分页列表（仅正常状态，用户管理分配角色下拉用） */
  public async findAll() {
    return this.roleRepository.find({ where: { status: CommonConstant.STATUS_NORMAL }, order: { roleSort: 'ASC' } })
  }

  /** 角色详情 */
  public async findOneById(id: string) {
    const role = await this.roleRepository.findOneBy({ id: Equal(id) })
    if (!role) throw new BusinessException('角色不存在')
    return role
  }

  /** 修改角色状态（系统管理员角色禁止修改） */
  public async changeStatus(changeDto: ChangeRoleStatusDto) {
    const record = await this.roleRepository.findOneBy({ id: Equal(changeDto.id) })
    if (!record) throw new BusinessException('角色不存在')
    if (record.roleCode === RbacConstant.SUPER_ROLE_CODE) throw new BusinessException('系统管理员角色状态禁止修改')
    await this.roleRepository.update(record.id, { status: changeDto.status })
    return '状态修改成功'
  }

  /** 授权角色菜单权限 */
  public async authPermission(authDto: AuthRolePermissionDto) {
    const role = await this.findOneById(authDto.roleId)
    role.menus = await this.menuService.findManyByIds(authDto.menuIds)
    await this.roleRepository.save(role)
    // 覆盖重建该角色权限缓存（单写者场景无竞态，授权立即生效且无失效空窗）
    await this.menuService.getPermsCacheByRoleId(role.id, role.roleCode === RbacConstant.SUPER_ROLE_CODE, true)
    return '授权成功'
  }

  /** 查询角色已授权的菜单 ID 集合（授权树回显用） */
  public async findRoleMenuIds(roleId: string) {
    const role = await this.findOneById(roleId)
    const isAdmin = role.roleCode === RbacConstant.SUPER_ROLE_CODE
    return this.menuService.findIdsByRoleId(roleId, isAdmin)
  }

  /** 设置角色数据范围（自定义时全量替换 sys_role_dept） */
  public async updateDataScope(scopeDto: UpdateRoleDataScopeDto) {
    const { id, dataScope, deptIds } = scopeDto
    const role = await this.findOneById(id)
    if (role.roleCode === RbacConstant.SUPER_ROLE_CODE && dataScope !== DataScopeType.ALL) {
      throw new BusinessException('系统管理员角色数据范围固定为全部数据')
    }
    await this.roleRepository.update(id, { dataScope })
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(RoleDeptEntity, { roleId: Equal(id) })
      if (dataScope === DataScopeType.CUSTOM && deptIds?.length) {
        await manager.insert(
          RoleDeptEntity,
          deptIds.map((deptId) => ({ roleId: id, deptId })),
        )
      }
    })
    // 覆盖重建该角色数据范围缓存（立即生效且无失效空窗）
    await this.getRoleScopeCache(id, true)
    return '数据权限设置成功'
  }

  /**
   * 读取角色数据范围缓存（数据权限拦截器消费）
   * 缓存缺失时回源重建并写回（带 TTL，与用户级缓存同生命周期；角色被删返回 null，由调用方 fail-closed）
   * @param force 跳过读缓存直接重算并覆盖写回（单写者场景：数据范围设置后的立即生效重建用）
   */
  public async getRoleScopeCache(roleId: string, force = false): Promise<RbacType.RoleScopeCache | null> {
    const cacheKey = `${RedisConstant.ROLE_DATA_SCOPE}:${roleId}`
    if (!force) {
      const jsonStr = await this.redisService.get(cacheKey)
      if (jsonStr) return JSON.parse(jsonStr) as RbacType.RoleScopeCache
    }

    const role = await this.roleRepository.findOneBy({ id: Equal(roleId) })
    if (!role) return null
    const roleDepts = await this.roleDeptRepository.findBy({ roleId: Equal(roleId) })
    const cache: RbacType.RoleScopeCache = { dataScope: role.dataScope, deptIds: roleDepts.map((item) => item.deptId) }
    await this.redisService.set(cacheKey, JSON.stringify(cache), 'EX', this.expiresIn)
    return cache
  }
}
