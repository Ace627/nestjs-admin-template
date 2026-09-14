import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { RedisService } from '@/shared/redis.service'
import { Equal, FindOptionsWhere, In, Like, Not, Repository } from 'typeorm'
import { CreateDictDataDto, QueryDictDataDto, UpdateDictDataDto } from './dict.dto'
import { BusinessException, CommonConstant, DictDataEntity, DictTypeEntity, RedisConstant } from '@/common'

@Injectable()
export class DictDataService {
  constructor(
    private readonly redisService: RedisService,
    @InjectRepository(DictDataEntity) private readonly dictDataRepository: Repository<DictDataEntity>,
    @InjectRepository(DictTypeEntity) private readonly dictTypeRepository: Repository<DictTypeEntity>,
  ) {}

  /** 字典缓存 Key：system:dict:{dictType} */
  private buildCacheKey(dictType: string): string {
    return `${RedisConstant.DICTTYPE_KEY}:${dictType}`
  }

  /** 从库读取指定类型的下拉字典数据（仅启用状态、精简字段、按排序升序） */
  private async loadByType(dictType: string): Promise<DictDataEntity[]> {
    return this.dictDataRepository
      .createQueryBuilder('dictData')
      .where('dictData.dictType = :dictType', { dictType })
      .andWhere('dictData.status = :status', { status: CommonConstant.STATUS_NORMAL })
      .orderBy('dictData.dictSort', 'ASC')
      .select(['dictData.dictLabel', 'dictData.dictValue', 'dictData.listClass', 'dictData.dictSort'])
      .getMany()
  }

  /** 重建指定类型字典缓存（无数据时清缓存而非写空） */
  public async refreshDictCache(dictType: string): Promise<void> {
    const list = await this.loadByType(dictType)
    if (list.length) await this.redisService.set(this.buildCacheKey(dictType), JSON.stringify(list))
    else await this.deleteDictCache(dictType)
  }

  /** 删除指定类型字典缓存 */
  public async deleteDictCache(dictType: string): Promise<void> {
    await this.redisService.del(this.buildCacheKey(dictType))
  }

  /** 清空全部字典缓存（scan 收集后删除，下次查询自动回源重建） */
  public async clearAllCache(): Promise<number> {
    const keys = await this.redisService.scan(`${RedisConstant.DICTTYPE_KEY}:*`)
    if (!keys.length) return 0
    return await this.redisService.del(...keys)
  }

  /** 根据字典类型查询下拉字典数据（缓存优先，未命中回源；无数据则清缓存，供前端 useDict 使用） */
  public async findByType(dictType: string): Promise<DictDataEntity[]> {
    if (!dictType) throw new BusinessException('字典类型不能为空')
    const cache = await this.redisService.get(this.buildCacheKey(dictType))
    if (cache) {
      try {
        return JSON.parse(cache) as DictDataEntity[]
      } catch {
        // 缓存损坏则回源重建
      }
    }
    const list = await this.loadByType(dictType)
    if (list.length) await this.redisService.set(this.buildCacheKey(dictType), JSON.stringify(list))
    else await this.deleteDictCache(dictType)
    return list
  }

  /** 校验同一字典类型下键值/标签唯一（编辑时排除自身，避免与 uk_dict_type_value 硬撞 DB 报错） */
  private async assertUnique(dictType: string, dictValue: string, dictLabel: string, excludeId?: string): Promise<void> {
    const whereValue: FindOptionsWhere<DictDataEntity> = { dictType: Equal(dictType), dictValue: Equal(dictValue) }
    const whereLabel: FindOptionsWhere<DictDataEntity> = { dictType: Equal(dictType), dictLabel: Equal(dictLabel) }
    if (excludeId) {
      whereValue.id = Not(excludeId)
      whereLabel.id = Not(excludeId)
    }
    if (await this.dictDataRepository.existsBy(whereValue)) throw new BusinessException('同一字典类型下键值不能重复')
    if (await this.dictDataRepository.existsBy(whereLabel)) throw new BusinessException('同一字典类型下标签不能重复')
  }

  /** 新增字典数据 */
  public async create(createDto: CreateDictDataDto): Promise<string> {
    if (!(await this.dictTypeRepository.existsBy({ dictType: Equal(createDto.dictType) }))) throw new BusinessException('字典类型不存在')
    await this.assertUnique(createDto.dictType, createDto.dictValue, createDto.dictLabel)
    const entity = new DictDataEntity()
    Object.assign(entity, createDto)
    await this.dictDataRepository.save(entity)
    await this.refreshDictCache(createDto.dictType)
    return '新增成功'
  }

  /** 删除字典数据（物理删除，避免 uk_dict_type_value 与软删除冲突） */
  public async delete(ids: string[]): Promise<string> {
    const entities = await this.dictDataRepository.find({ where: { id: In(ids) } })
    if (entities.length !== new Set(ids).size) throw new BusinessException('字典数据不存在')
    const types = [...new Set(entities.map((item) => item.dictType))]
    await this.dictDataRepository.delete(ids)
    await Promise.all(types.map((type) => this.refreshDictCache(type)))
    return '删除成功'
  }

  /** 编辑字典数据 */
  public async update(updateDto: UpdateDictDataDto): Promise<string> {
    const { id } = updateDto
    const entity = await this.dictDataRepository.findOneBy({ id: Equal(id) })
    if (!entity) throw new BusinessException('字典数据不存在')
    // 键值/标签变更时复检同类型下唯一性（编辑时排除自身）
    if (updateDto.dictValue !== undefined || updateDto.dictLabel !== undefined) {
      await this.assertUnique(entity.dictType, updateDto.dictValue ?? entity.dictValue, updateDto.dictLabel ?? entity.dictLabel, id)
    }
    Object.assign(entity, updateDto)
    await this.dictDataRepository.save(entity)
    await this.refreshDictCache(entity.dictType)
    return '更新成功'
  }

  /** 查询字典数据分页列表 */
  public async findList(queryParams: QueryDictDataDto): Promise<{ total: number; records: DictDataEntity[] }> {
    const { skip, take, dictLabel, dictType, status } = queryParams
    const queryBuilder = this.dictDataRepository.createQueryBuilder('dictData')
    const where: FindOptionsWhere<DictDataEntity> = {}
    if (dictLabel) where.dictLabel = Like(`%${dictLabel}%`)
    if (dictType) where.dictType = Equal(dictType)
    if (status) where.status = Equal(status)
    queryBuilder.where(where)
    queryBuilder.orderBy('dictData.dictSort', 'ASC')
    queryBuilder.skip(skip).take(take)
    const [records, total] = await queryBuilder.getManyAndCount()
    return { total, records }
  }

  /** 根据 ID 查询字典数据 */
  public async findOneById(id: string): Promise<DictDataEntity> {
    const entity = await this.dictDataRepository.findOneBy({ id: Equal(id) })
    if (!entity) throw new BusinessException('字典数据不存在')
    return entity
  }
}
