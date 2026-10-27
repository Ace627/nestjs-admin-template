import { ExtractJwt, Strategy } from 'passport-jwt'
import { PassportStrategy } from '@nestjs/passport'
import { ConfigService } from '@nestjs/config'
import { HttpStatus, Injectable, Logger } from '@nestjs/common'
import { RedisService } from '@/shared/redis.service'
import { BusinessException, ConfigConstant, RedisConstant } from '@/common'
import { AuthType } from '@/types'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name)

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      passReqToCallback: true,
      secretOrKey: configService.get<string>(ConfigConstant.JWT_SECRET, 'JWT_SECRET'),
    })
  }

  async validate(request: ExpressRequest, payload: AuthType.JwtPayload) {
    // 从 payload 中提取 userId 和 uuid
    const { userId, uuid } = payload
    // 校验 Redis 中的 AccessToken 是否存在（可吊销）
    const redisToken = await this.redisService.get(`${RedisConstant.ACCESS_TOKEN_KEY}:${userId}:${uuid}`)
    if (!redisToken) throw new BusinessException('访问凭证已过期或不存在', HttpStatus.UNAUTHORIZED)
    // 从请求头中提取 AccessToken
    // const accessToken = ExtractJwt.fromAuthHeaderAsBearerToken()(request)
    // 自动续期缓存（best-effort，不阻塞请求，失败仅打日志不影响认证结果）
    this.expire(userId, uuid)
    // 续期成功后返回 payload
    return payload
  }

  /** 续期相关数据 */
  private expire(userId: string, uuid: string) {
    return Promise.all([
      this.redisService.expire(`${RedisConstant.ACCESS_TOKEN_KEY}:${userId}:${uuid}`, this.expiresIn),
      this.redisService.expire(`${RedisConstant.ADMIN_USER_ONLINE_KEY}:${userId}:${uuid}`, this.expiresIn),
      this.redisService.expire(`${RedisConstant.ADMIN_USER_ROLES}:${userId}`, this.expiresIn),
      this.redisService.expire(`${RedisConstant.ADMIN_USER_DEPTS}:${userId}`, this.expiresIn),
    ]).catch((error: unknown) => {
      const errMsg = error instanceof Error ? error.message : '未知错误'
      this.logger.warn(`Token 续期失败（不影响本次请求）: ${errMsg}`)
    })
  }

  /** JWT 过期时间（秒） */
  private get expiresIn(): number {
    return this.configService.get<number>(ConfigConstant.JWT_EXPIRES_IN, 1800)
  }
}
