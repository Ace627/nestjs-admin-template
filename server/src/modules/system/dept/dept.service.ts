import { BusinessException, CommonConstant, DeptEntity, RedisConstant } from '@/common'
import { RedisService } from '@/shared/redis.service'
import { listToTree } from '@/utils'
import { DataSource, Equal, In, Like } from 'typeorm'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { Injectable } from '@nestjs/common'
import { Repository } from 'typeorm'
import { CreateDeptDto, QueryDeptDto, UpdateDeptDto } from './dept.dto'

@Injectable()
export class DeptService {
  constructor(
    private readonly redisService: RedisService,
    @InjectRepository(DeptEntity) private readonly deptRepository: Repository<DeptEntity>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /** 新增部门 */
  public async create(createDto: CreateDeptDto) {
    const parentId = createDto.parentId || CommonConstant.DEFAULT_PARENT_ID
    const entity = new DeptEntity()
    Object.assign(entity, createDto, { parentId, ancestors: await this.buildAncestors(parentId) })
    await this.deptRepository.save(entity)
    await this.invalidateCache()
    return '添加成功'
  }

  /** 编辑部门（父级变更时事务内级联重算全部子孙的 ancestors） */
  public async update(updateDto: UpdateDeptDto) {
    const { id } = updateDto
    const entity = await this.deptRepository.findOneBy({ id: Equal(id) })
    if (!entity) throw new BusinessException('部门不存在')

    const newParentId = updateDto.parentId || entity.parentId
    if (newParentId === id) throw new BusinessException('上级部门不能为自己')
    // 不能把上级部门设为自己的子孙（防环）
    if ((await this.findDescendants([id])).includes(newParentId)) throw new BusinessException('上级部门不能为自己的下级部门')

    const moved = newParentId !== entity.parentId
    const oldAncestors = entity.ancestors
    const newAncestors = await this.buildAncestors(newParentId)

    await this.dataSource.transaction(async (manager) => {
      Object.assign(entity, updateDto, { parentId: newParentId, ancestors: newAncestors })
      await manager.save(entity)
      if (moved) {
        // 旧链前缀 = 旧祖先链 + 自身；所有子孙的 ancestors 均以该前缀开头，按前缀平移
        const oldPrefix = `${oldAncestors},${id}`
        const descendants = await manager.find(DeptEntity, { where: { ancestors: Like(`${oldPrefix}%`) } })
        const newPrefix = `${newAncestors},${id}`
        for (const dept of descendants) {
          await manager.update(DeptEntity, dept.id, { ancestors: `${newPrefix}${dept.ancestors.slice(oldPrefix.length)}` })
        }
      }
    })
    await this.invalidateCache()
    return '修改成功'
  }

  /** 删除部门（根部门、存在下级部门或挂有用户时拦截） */
  public async delete(ids: string[]) {
    // 校验目标部门全部存在且未删除
    const targets = await this.deptRepository.findBy({ id: In(ids) })
    if (targets.length !== new Set(ids).size) throw new BusinessException('部门不存在')

    const all = await this.findAllCached()
    if (all.some((dept) => ids.includes(dept.id) && dept.parentId === CommonConstant.DEFAULT_PARENT_ID)) throw new BusinessException('根部门不允许删除')
    if (all.some((dept) => ids.includes(dept.parentId))) throw new BusinessException('存在下级部门，不允许删除')

    const placeholders = ids.map(() => '?').join(',')
    const [userRows] = (await Promise.all([
      this.dataSource.query(`SELECT COUNT(*) AS count FROM sys_user WHERE dept_id IN (${placeholders}) AND delete_time IS NULL`, ids),
    ])) as [{ count: number }[]]
    if (Number(userRows[0]?.count) > 0) throw new BusinessException('部门下存在用户，不允许删除')

    await this.deptRepository.softDelete(ids)
    await this.invalidateCache()
    return '删除成功'
  }

  /** 部门树形列表（含停用，管理页用） */
  public async findTree(queryParams: QueryDeptDto) {
    const queryBuilder = this.deptRepository.createQueryBuilder('dept')
    if (queryParams.deptName) queryBuilder.andWhere('dept.deptName LIKE :deptName', { deptName: `%${queryParams.deptName}%` })
    if (queryParams.status) queryBuilder.andWhere('dept.status = :status', { status: queryParams.status })
    queryBuilder.orderBy('dept.deptSort', 'ASC')
    return listToTree<DeptEntity>(await queryBuilder.getMany())
  }

  /** 部门下拉树（仅正常状态） */
  public async findTreeSelect() {
    const list = await this.deptRepository.find({ where: { status: CommonConstant.STATUS_NORMAL }, order: { deptSort: 'ASC' } })
    return listToTree<DeptEntity>(list)
  }

  /** 部门详情 */
  public async findOneById(id: string) {
    const dept = await this.deptRepository.findOneBy({ id: Equal(id) })
    if (!dept) throw new BusinessException('部门不存在')
    return dept
  }

  /* -------------------------------------------------------------------------- */
  /*                        数据权限支撑（供拦截器/角色调用）                       */
  /* -------------------------------------------------------------------------- */

  /** 全量部门（缓存优先，缺失回源并写回），供数据权限内存计算使用 */
  public async findAllCached(): Promise<DeptEntity[]> {
    const jsonStr = await this.redisService.get(RedisConstant.SYS_DEPT_TREE)
    if (jsonStr) return JSON.parse(jsonStr) as DeptEntity[]
    const list = await this.deptRepository.find({ order: { deptSort: 'ASC' } })
    await this.redisService.set(RedisConstant.SYS_DEPT_TREE, JSON.stringify(list))
    return list
  }

  /**
   * 计算部门集合及其全部子孙部门的 ID（含自身），用于「本部门及以下」档位
   * @note 基于 ancestors 冗余链在内存中计算，避免递归 SQL
   */
  public async findDescendants(deptIds: string[]): Promise<string[]> {
    if (!deptIds?.length) return []
    const all = await this.findAllCached()
    const result = new Set<string>()
    for (const dept of all) {
      if (deptIds.includes(dept.id)) {
        result.add(dept.id)
        continue
      }
      const ancestors = dept.ancestors ? dept.ancestors.split(',') : []
      if (deptIds.some((id) => ancestors.includes(id))) result.add(dept.id)
    }
    return [...result]
  }

  /** 失效部门树缓存（部门增删改后调用） */
  private async invalidateCache() {
    await this.redisService.del(RedisConstant.SYS_DEPT_TREE)
  }

  /** 根据父部门 ID 计算 ancestors 链 */
  private async buildAncestors(parentId: string): Promise<string> {
    if (parentId === CommonConstant.DEFAULT_PARENT_ID) return CommonConstant.DEFAULT_PARENT_ID
    const parent = await this.deptRepository.findOneBy({ id: Equal(parentId) })
    if (!parent) throw new BusinessException('上级部门不存在')
    return `${parent.ancestors},${parent.id}`
  }
}
