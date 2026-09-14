import { Reflector } from '@nestjs/core'
import { createMd5Hash } from '@/utils'
import { RedisService } from '@/shared/redis.service'
import { CommonConstant } from '../constant/common.constant'
import { DecoratorConstant } from '../constant/decorator.constant'
import { BusinessException } from '../exception/business.exception'
import { RepeatSubmitOption } from '../decorator/repeat-submit.decorator'
import { Injectable, CanActivate, ExecutionContext, HttpStatus } from '@nestjs/common'
import { RedisConstant } from '../constant/redis.constant'

/**
 * 防止重复提交守卫
 *
 * 工作流程：
 * 1. 从控制器方法上读取 @RepeatSubmit() 装饰器传入的选项
 * 2. 根据「HTTP方法 + 请求路径(path) + 稳定序列化的 params/query/body」生成唯一 key
 * 3. 检查 Redis 中是否已存在该 key：
 *    - 若存在：说明重复提交，抛出 BusinessException
 *    - 若不存在：在 Redis 中设置该 key（value 为请求 ID），有效期 = interval 秒，然后放行
 */
@Injectable()
export class RepeatSubmitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 获取装饰器配置（若无 @RepeatSubmit 装饰器则直接放行）
    const options: RepeatSubmitOption = this.reflector.get(DecoratorConstant.REPEAT_SUBMIT, context.getHandler())
    if (!options) return true

    const request = context.switchToHttp().getRequest<ExpressRequest>()
    const requestId = request[CommonConstant.REQUEST_ID]

    // 生成防重唯一键
    const key = `${RedisConstant.REPEAT_SUBMIT_KEY}:${request.path}:${createMd5Hash(this.getPendingKey(request))}`

    // 检查是否已存在（重复提交）
    // 使用装饰器内配置的错误消息（默认：数据正在处理中，请勿重复提交）
    const exist = await this.redisService.exists(key)
    if (exist) throw new BusinessException(options.message ?? '数据正在处理中，请勿重复提交', HttpStatus.BAD_REQUEST)

    // 首次提交：写入 Redis 并设置过期时间
    const interval = options.interval ?? 5
    await this.redisService.setex(key, interval, requestId ?? 'unknown') // 值随意，仅做标识

    return true
  }

  /**
   * 稳定 JSON 序列化函数
   * 特性：
   * - 对象键按字母排序，保证输出确定
   * - null / undefined → "null"
   * - BigInt → 字符串
   * - Date → ISO 格式
   * - FormData → 递归转普通对象（包含 File 元数据）
   * - 函数 / Symbol → "null"
   * - 循环引用 → "[Circular]"
   * - 对象中值为 undefined 的属性自动跳过
   */
  private stableStringify(value: any, seen = new WeakSet()): string {
    // 1. 处理 null 和 undefined（保证输出合法 JSON）
    if (value === null || value === undefined) return 'null'
    // 2. 处理 BigInt（因为原生 JSON.stringify 不支持）
    if (typeof value === 'bigint') return JSON.stringify(value.toString())
    // 3. 处理 Date，加上 JSON.stringify 以获得双引号字符串
    if (value instanceof Date) return JSON.stringify(value.toISOString())
    // 4. 处理 FormData
    if (value instanceof FormData) {
      const obj: Record<string, any> = {}
      value.forEach((v, k) => {
        const currentValue = v instanceof File ? { name: v.name, size: v.size, type: v.type, lastModified: v.lastModified } : v
        obj[k] = k in obj ? (Array.isArray(obj[k]) ? [...obj[k], currentValue] : [obj[k], currentValue]) : currentValue
      })
      return this.stableStringify(obj, seen)
    }
    // 5. 基础类型（除了 object 和 bigint）
    if (typeof value === 'function' || typeof value === 'symbol') return 'null'
    // 6. 所有非 object 类型（确保不会再往下走到 WeakSet）
    if (typeof value !== 'object' || value === null) return JSON.stringify(value)
    // 7. 防止 seen 参数被外部篡改
    if (!(seen instanceof WeakSet)) seen = new WeakSet()
    // 8. 循环引用检测（此时 value 必然是对象）
    if (seen.has(value)) return '"[Circular]"'
    seen.add(value)
    // 9. 数组
    if (Array.isArray(value)) return `[${value.map((item) => this.stableStringify(item, seen)).join(',')}]`
    // 10. 普通对象（按键排序）
    const keys = Object.keys(value).sort()
    return `{${keys
      .filter((key) => value[key] !== undefined)
      .map((key) => `"${key}":${this.stableStringify(value[key], seen)}`)
      .join(',')}}`
  }

  /**
   * 生成防重请求的唯一 key
   * 组合：方法 + 路径(不含查询字符串) + 稳定序列化的 params/query/body
   * 使用 path 而非 url，避免查询参数重复参与 key 计算
   */
  private getPendingKey(request: ExpressRequest) {
    const { path, method, params = {}, body = {}, query = {} } = request
    return [method, path, this.stableStringify(params), this.stableStringify(query), this.stableStringify(body)].join('&')
  }
}
