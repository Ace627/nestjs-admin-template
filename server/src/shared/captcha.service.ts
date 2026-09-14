import { randomUUID } from '@/utils'
import svgCaptcha from 'svg-captcha'
import { Injectable } from '@nestjs/common'
import { RedisService } from './redis.service'
import { BusinessException, RedisConstant } from '@/common'

@Injectable()
export class CaptchaService {
  /** 验证码过期时间（秒） */
  private readonly CAPTCHA_EXPIRES_IN = 60

  constructor(private readonly redisService: RedisService) {}

  /**
   * 生成图形验证码
   * @description 生成数学表达式验证码并缓存答案，返回 base64 格式图片
   * @returns 验证码唯一标识和 base64 图片数据
   */
  public async create(): Promise<{ uuid: string; captcha: string }> {
    // 1. 生成唯一标识，用于关联验证码答案与图片
    const uuid = randomUUID()
    // 2. 创建数学表达式验证码
    const { data, text } = svgCaptcha.createMathExpr({ background: '#C0C8BE', noise: 4 })
    // 3. 转换为 base64 格式，前端可直接通过 img 标签渲染
    const captcha = this.convertToBase64(data)
    // 4. 缓存验证码答案，有效期 60 秒
    const key = this.getCacheKey(uuid)
    await this.redisService.set(key, text, 'EX', this.CAPTCHA_EXPIRES_IN)
    // 5. 返回验证码数据
    return { uuid, captcha }
  }

  /**
   * 校验图形验证码
   * @description 验证用户输入的验证码是否正确，校验通过后立即删除缓存防止重复使用
   * @param uuid - 验证码唯一标识
   * @param captcha - 用户输入的验证码
   * @throws {BusinessException} 验证码错误时抛出异常
   */
  public async validate(uuid: string, captcha: string): Promise<boolean> {
    // 1. 参数校验
    if (!uuid || !captcha) throw new BusinessException('验证码校验参数不完整')
    // 2. 获取缓存的验证码答案
    const key = this.getCacheKey(uuid)
    const cachedValue = await this.redisService.get(key)
    // 3. 验证码已过期或不存在
    if (!cachedValue) throw new BusinessException('验证码已过期，请刷新后重试')
    // 4. 验证码匹配校验（不区分大小写）
    const isValid = cachedValue.toLowerCase() === captcha.toLowerCase()
    if (!isValid) throw new BusinessException('验证码错误，请刷新后重试')
    // 5. 校验通过，立即删除缓存，防止重复使用
    await this.redisService.del(key)
    // 6. 返回校验成功标识
    return true
  }

  /**
   * 获取 Redis 缓存 Key
   * @param uuid - 验证码唯一标识
   */
  private getCacheKey(uuid: string): string {
    return `${RedisConstant.CAPTCHA_KEY}:${uuid}`
  }

  /**
   * 将 SVG 字符串转换为 base64 格式
   * @param svgData - SVG 原始数据
   * @returns base64 格式的图片数据
   */
  private convertToBase64(svgData: string): string {
    const base64 = Buffer.from(svgData).toString('base64')
    return `data:image/svg+xml;base64,${base64}`
  }
}
