import { BusinessException, DictDataEntity, DictTypeEntity } from '@/common'
import { Injectable } from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { DataSource, Equal, FindOptionsWhere, In, Like, Not, Repository } from 'typeorm'
import { CreateDictTypeDto, QueryDictTypeDto, UpdateDictTypeDto } from './dict.dto'
import { DictDataService } from './dict-data.service'

@Injectable()
export class DictTypeService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(DictTypeEntity) private readonly dictTypeRepository: Repository<DictTypeEntity>,
    @InjectRepository(DictDataEntity) private readonly dictDataRepository: Repository<DictDataEntity>,
    private readonly dictDataService: DictDataService,
  ) {}

  /** 新增字典类型 */
  public async create(createDto: CreateDictTypeDto): Promise<string> {
    if (await this.dictTypeRepository.existsBy({ dictType: Equal(createDto.dictType) })) throw new BusinessException('字典类型编码已存在')
    const entity = new DictTypeEntity()
    Object.assign(entity, createDto)
    await this.dictTypeRepository.save(entity)
    return '新增成功'
  }

  /**
   * 编辑字典类型
   * - dictType 允许变更：事务内级联更新字典数据的 dictType，保证数据归属一致
   * - 事务提交后同步处理 Redis 缓存：删除旧类型缓存、重建新类型缓存
   * - 仅改名称/状态/备注时同样重建缓存，避免停用后下拉缓存仍是旧数据
   */
  public async update(updateDto: UpdateDictTypeDto): Promise<string> {
    const { id, dictType } = updateDto
    const entity = await this.dictTypeRepository.findOneBy({ id: Equal(id) })
    if (!entity) throw new BusinessException('字典类型不存在')
    const oldDictType = entity.dictType
    const isRename = !!dictType && dictType !== oldDictType

    if (isRename) {
      await this.assertRenameable(id, oldDictType, dictType)
      await this.dataSource.transaction(async (manager) => {
        const typeRepo = manager.getRepository(DictTypeEntity)
        const dataRepo = manager.getRepository(DictDataEntity)
        await dataRepo.update({ dictType: oldDictType }, { dictType })
        Object.assign(entity, updateDto)
        await typeRepo.save(entity)
      })
      await this.dictDataService.deleteDictCache(oldDictType)
    } else {
      Object.assign(entity, updateDto)
      await this.dictTypeRepository.save(entity)
    }

    await this.dictDataService.refreshDictCache(isRename ? dictType : oldDictType)
    return '更新成功'
  }

  /**
   * 改名前置校验
   * - 新编码唯一性排除自身，避免仅大小写变更时误判为已存在
   * - 目标类型下若已存在与源数据相同的键值/标签，级联更新会撞 uk_dict_type_value，提前给出友好提示
   */
  private async assertRenameable(id: string, oldDictType: string, newDictType: string): Promise<void> {
    if (await this.dictTypeRepository.existsBy({ dictType: Equal(newDictType), id: Not(id) })) throw new BusinessException('字典类型编码已存在')
    const sources = await this.dictDataRepository.find({ where: { dictType: Equal(oldDictType) }, select: { dictValue: true, dictLabel: true } })
    if (!sources.length) return
    const values = sources.map((item) => item.dictValue)
    const labels = sources.map((item) => item.dictLabel)
    if (await this.dictDataRepository.existsBy({ dictType: Equal(newDictType), dictValue: In(values) })) throw new BusinessException('目标字典类型下已存在相同的字典键值，无法变更')
    if (await this.dictDataRepository.existsBy({ dictType: Equal(newDictType), dictLabel: In(labels) })) throw new BusinessException('目标字典类型下已存在相同的字典标签，无法变更')
  }

  /** 删除字典类型（物理删除；若仍挂载字典数据则拦截） */
  public async delete(ids: string[]): Promise<string> {
    const entities = await this.dictTypeRepository.find({ where: { id: In(ids) } })
    if (entities.length !== new Set(ids).size) throw new BusinessException('字典类型不存在')
    const types = entities.map((item) => item.dictType)
    const hasData = await this.dictDataRepository.existsBy({ dictType: In(types) })
    if (hasData) throw new BusinessException('该字典类型下存在字典数据，无法删除')
    await this.dictTypeRepository.delete(ids)
    await Promise.all(types.map((type) => this.dictDataService.deleteDictCache(type)))
    return '删除成功'
  }

  /** 查询字典类型分页列表 */
  public async findList(queryParams: QueryDictTypeDto): Promise<{ total: number; records: DictTypeEntity[] }> {
    const { skip, take, dictName, dictType, status } = queryParams
    const queryBuilder = this.dictTypeRepository.createQueryBuilder('dictType')
    const where: FindOptionsWhere<DictTypeEntity> = {}
    if (dictName) where.dictName = Like(`%${dictName}%`)
    if (dictType) where.dictType = Equal(dictType)
    if (status) where.status = Equal(status)
    queryBuilder.where(where)
    queryBuilder.orderBy('dictType.createTime', 'ASC')
    queryBuilder.skip(skip).take(take)
    const [records, total] = await queryBuilder.getManyAndCount()
    return { total, records }
  }

  /** 根据 ID 查询字典类型 */
  public async findOneById(id: string): Promise<DictTypeEntity> {
    const entity = await this.dictTypeRepository.findOneBy({ id: Equal(id) })
    if (!entity) throw new BusinessException('字典类型不存在')
    return entity
  }
}
