import { Injectable } from '@nestjs/common'
import { RedisService } from '@/shared/redis.service'
import { BusinessException, RedisConstant } from '@/common'

@Injectable()
export class CacheService {
  constructor(private readonly redisService: RedisService) {}

  /** 缓存分类白名单：仅暴露可运维缓存；user:roles/user:depts/sys:role:* 等会话衍生键刻意不暴露（清除即破坏登录态） */
  private readonly caches = [
    { prefix: RedisConstant.CAPTCHA_KEY, remark: '验证码' },
    { prefix: RedisConstant.ACCESS_TOKEN_KEY, remark: '用户令牌' },
    { prefix: RedisConstant.DICTTYPE_KEY, remark: '数据字典' },
    { prefix: RedisConstant.REPEAT_SUBMIT_KEY, remark: '防重提交' },
    { prefix: RedisConstant.RESPONSE_CACHE, remark: '响应缓存' },
    { prefix: RedisConstant.THROTTLE_LIMIT, remark: '限流处理' },
    { prefix: RedisConstant.LOGIN_FAIL_COUNT, remark: '登录失败锁定' },
  ]

  /** 按前缀取白名单项，不在白名单内直接拒绝（防止 name=* 变相 flushdb） */
  private getCacheOrThrow(name: string) {
    const cache = this.caches.find((item) => item.prefix === name)
    if (!cache) throw new BusinessException('缓存分类不在白名单内')
    return cache
  }

  /** 获取所有缓存分类名称 */
  public getNames() {
    return this.caches.map((item) => ({ ...item }))
  }

  /** 清除指定分类下的所有缓存，返回删除的键数量 */
  public async clearCacheName(name: string): Promise<number> {
    const { prefix } = this.getCacheOrThrow(name)
    const keys = await this.redisService.scan(`${prefix}:*`)
    if (keys.length) await this.redisService.del(...keys)
    return keys.length
  }

  /** 获取缓存键名列表 */
  public async getKeys(name: string): Promise<string[]> {
    this.getCacheOrThrow(name)
    return this.redisService.scan(`${name}:*`)
  }

  /** 删除对应 key 的缓存数据，返回是否删除成功 */
  public async clearCacheKey(key: string): Promise<boolean> {
    if (!key) throw new BusinessException('缓存键名不能为空')
    this.assertKeyInWhitelist(key)
    const count = await this.redisService.del(key)
    return count > 0
  }

  /** 获取对应 key 的缓存数据（附带剩余过期时间） */
  public async getValue(key: string) {
    if (!key) throw new BusinessException('缓存键名不能为空')
    this.assertKeyInWhitelist(key)
    const [value, ttl] = await Promise.all([this.redisService.get(key), this.redisService.ttl(key)])
    const name = this.caches.find((item) => key.startsWith(`${item.prefix}:`))!.prefix
    return { name, key, value, ttl } // ttl：-1=永不过期，-2=键不存在，>=0=剩余秒数
  }

  /** 缓存监控 */
  public async getInfo() {
    const [dbsize, info, commandstats] = await Promise.all([this.redisService.dbsize(), this.redisService.getInfo(), this.redisService.commandstats()])
    if (!info || Object.keys(info).length === 0) throw new BusinessException('Redis 信息获取失败')
    return { dbsize, info, commandstats }
  }

  /** 校验 key 是否属于白名单前缀，防止越权读取/删除任意 Redis 键 */
  private assertKeyInWhitelist(key: string) {
    const match = this.caches.find((item) => key.startsWith(`${item.prefix}:`))
    if (!match) throw new BusinessException('缓存键不在白名单分类内')
    return match
  }
}
