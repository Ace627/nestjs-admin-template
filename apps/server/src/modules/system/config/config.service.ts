import { CommonConstant } from '@/common'
import { isNumberString } from '@/utils'
import { InjectRepository } from '@nestjs/typeorm'
import { RedisService } from '@/shared/redis.service'
import { BusinessException, ConfigEntity, RedisConstant } from '@/common'
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { Equal, FindOptionsWhere, In, Like, Not, Repository } from 'typeorm'
import { CreateConfigDto, QueryConfigDto, UpdateConfigDto } from './config.dto'

@Injectable()
export class ConfigService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ConfigService.name)

  constructor(
    private readonly redisService: RedisService,
    @InjectRepository(ConfigEntity) private readonly configRepository: Repository<ConfigEntity>,
  ) {}

  /** 参数键名 -> Redis 缓存键 */
  private getCacheKey(configKey: string): string {
    return `${RedisConstant.SYS_CONFIG_KEY}:${configKey}`
  }

  /**
   * 应用启动时全量预热参数缓存
   * - 失败不阻塞启动（Cache-Aside 惰性加载兜底），仅记录错误日志
   */
  async onApplicationBootstrap() {
    try {
      await this.reloadCache()
      this.logger.log('参数缓存预热完成')
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error)
      this.logger.error(`参数缓存预热失败，已降级为惰性加载，${errMsg}`)
    }
  }

  /** 全量重建参数缓存（清空旧键后回源数据库重载） */
  public async reloadCache(): Promise<void> {
    const entities = await this.configRepository.find()
    const oldKeys = await this.redisService.scan(`${RedisConstant.SYS_CONFIG_KEY}:*`)
    if (oldKeys.length) await this.redisService.del(...oldKeys)
    await Promise.all(entities.map((entity) => this.redisService.set(this.getCacheKey(entity.configKey), entity.configValue)))
  }

  /** 新增参数 */
  public async create(createDto: CreateConfigDto): Promise<string> {
    if (await this.configRepository.existsBy({ configKey: Equal(createDto.configKey) })) throw new BusinessException('参数键名已存在')
    const entity = new ConfigEntity()
    Object.assign(entity, createDto, { configType: createDto.configType ?? CommonConstant.CONFIG_TYPE_CUSTOM })
    await this.configRepository.save(entity)
    await this.redisService.set(this.getCacheKey(entity.configKey), entity.configValue)
    return '新增成功'
  }

  /**
   * 编辑参数
   * - 内置参数禁止变更键名（键名是代码引用锚点，改了即等于断链），值与备注可改
   * - 键名变更时删除旧缓存键，写新缓存键
   */
  public async update(updateDto: UpdateConfigDto): Promise<string> {
    const { id, configKey } = updateDto
    const entity = await this.configRepository.findOneBy({ id: Equal(id) })
    if (!entity) throw new BusinessException('参数不存在')

    const isRename = !!configKey && configKey !== entity.configKey
    if (isRename) {
      if (entity.configType === CommonConstant.CONFIG_TYPE_BUILTIN) throw new BusinessException(`内置参数【${entity.configKey}】不允许修改键名`)
      if (await this.configRepository.existsBy({ configKey: Equal(configKey), id: Not(id) })) throw new BusinessException('参数键名已存在')
    }

    const oldKey = entity.configKey
    Object.assign(entity, updateDto)
    await this.configRepository.save(entity)

    if (isRename) await this.redisService.del(this.getCacheKey(oldKey))
    await this.redisService.set(this.getCacheKey(entity.configKey), entity.configValue)
    return '更新成功'
  }

  /** 删除参数（内置参数拦截；物理删除，与字典模块口径一致） */
  public async delete(ids: string[]): Promise<string> {
    const entities = await this.configRepository.find({ where: { id: In(ids) } })
    if (entities.length !== new Set(ids).size) throw new BusinessException('参数不存在')
    const builtin = entities.find((entity) => entity.configType === CommonConstant.CONFIG_TYPE_BUILTIN)
    if (builtin) throw new BusinessException(`内置参数【${builtin.configKey}】不能删除`)
    await this.configRepository.delete(ids)
    await Promise.all(entities.map((entity) => this.redisService.del(this.getCacheKey(entity.configKey))))
    return '删除成功'
  }

  /** 查询参数分页列表 */
  public async findList(queryParams: QueryConfigDto): Promise<{ total: number; records: ConfigEntity[] }> {
    const { skip, take, configName, configKey, configType } = queryParams
    const queryBuilder = this.configRepository.createQueryBuilder('config')
    const where: FindOptionsWhere<ConfigEntity> = {}
    if (configName) where.configName = Like(`%${configName}%`)
    if (configKey) where.configKey = Like(`%${configKey}%`)
    if (configType) where.configType = Equal(configType)
    queryBuilder.where(where)
    queryBuilder.orderBy('config.createTime', 'ASC')
    queryBuilder.skip(skip).take(take)
    const [records, total] = await queryBuilder.getManyAndCount()
    return { total, records }
  }

  /** 根据 ID 查询参数 */
  public async findOneById(id: string): Promise<ConfigEntity> {
    const entity = await this.configRepository.findOneBy({ id: Equal(id) })
    if (!entity) throw new BusinessException('参数不存在')
    return entity
  }

  /**
   * 按键名读取参数值（Cache-Aside：缓存优先，未命中回源并回写）
   * @returns 参数值；不存在时返回 null
   */
  public async getConfigValue(configKey: string): Promise<string | null> {
    const cacheKey = this.getCacheKey(configKey)
    const cached = await this.redisService.get(cacheKey)
    if (cached !== null) return cached
    const entity = await this.configRepository.findOneBy({ configKey: Equal(configKey) })
    if (!entity) return null
    await this.redisService.set(cacheKey, entity.configValue)
    return entity.configValue
  }

  /* ----------------------------- 通用类型化读取（新参数零成本接入） ----------------------------- */

  /** 读取布尔参数：'true'/'1'（忽略大小写）为 true；缺失/为空/无法识别时取默认值 */
  public async getBooleanConfig(configKey: string, defaultValue: boolean): Promise<boolean> {
    const value = await this.getConfigValue(configKey)
    if (value === null || value.trim() === '') return defaultValue
    return ['true', '1'].includes(value.trim().toLowerCase())
  }

  /** 读取数字参数：无法解析时取默认值 */
  public async getNumberConfig(configKey: string, defaultValue: number): Promise<number> {
    const value = await this.getConfigValue(configKey)
    if (value === null || value.trim() === '' || !isNumberString(value)) return defaultValue
    return Number(value)
  }

  /** 读取字符串参数：缺失时取默认值 */
  public async getStringConfig(configKey: string, defaultValue: string): Promise<string> {
    return (await this.getConfigValue(configKey)) ?? defaultValue
  }
}
