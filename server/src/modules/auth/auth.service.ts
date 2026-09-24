import { LoginDto } from './auth.dto'
import type { AuthType } from '@/types'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { RedisService } from '@/shared/redis.service'
import { LogService } from '../monitor/log/log.service'
import { CaptchaService } from '@/shared/captcha.service'
import { LoginLockService } from '@/shared/login-lock.service'
import { UserService } from '../system/user/user.service'
import { MenuService } from '../system/menu/menu.service'
import { RoleService } from '../system/role/role.service'
import { ConfigService as SysConfigService } from '../system/config/config.service'
import { HttpStatus, Injectable, Logger } from '@nestjs/common'
import { verifyPassword, formatTime, randomUUID, getRequestIp } from '@/utils'
import { CommonConstant, BusinessException, RedisConstant, ConfigConstant, RbacConstant } from '@/common'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly logService: LogService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly menuService: MenuService,
    private readonly roleService: RoleService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly captchaService: CaptchaService,
    private readonly loginLockService: LoginLockService,
    private readonly sysConfigService: SysConfigService,
  ) {}

  /** 获取验证码（实时读取参数开关，缺失默认开启；关闭时不生成图片，仅返回 enabled 标识） */
  public async getCaptcha() {
    const enabled = await this.sysConfigService.getBooleanConfig(CommonConstant.CAPTCHA_ENABLED_CONFIG_KEY, true)
    if (!enabled) return { enabled, uuid: '', captcha: '' }
    return { enabled, ...(await this.captchaService.create()) }
  }

  /** 用户登录 */
  public async login(loginDto: LoginDto, request: ExpressRequest) {
    try {
      const { username, password, uuid, captcha } = loginDto
      const ip = getRequestIp(request)
      // 1. 账号锁定校验（锁定中直接拒绝，不再消耗验证码校验）
      await this.loginLockService.assertNotLocked(username, ip)
      // 2. 校验验证码是否正确（参数开关关闭时跳过；开关状态与登录页读同一参数，缺失默认开启）
      const captchaEnabled = await this.sysConfigService.getBooleanConfig(CommonConstant.CAPTCHA_ENABLED_CONFIG_KEY, true)
      if (captchaEnabled) await this.captchaService.validate(uuid, captcha)
      // 3. 查询用户
      const user = await this.userService.getRepository().findOneBy({ username, status: CommonConstant.STATUS_NORMAL })
      if (!user) throw new BusinessException(`该账号不存在或已停用`)
      const { id: userId, password: hashPassword } = user
      // 4. 校验密码是否正确（错误计入失败次数，达阈值锁定账号）
      if (!(await verifyPassword(password, hashPassword))) {
        const remainingCount = await this.loginLockService.recordFailure(username, ip)
        throw new BusinessException(`账号或密码错误，还可尝试 ${remainingCount} 次`)
      }
      await this.loginLockService.clearFailCount(username, ip)
      // 5. 生成令牌对
      const { accessTokenKey, accessToken, refreshToken } = await this.generateTokenPair(user)
      // 6. 更新登录时间
      this.userService.getRepository().update(userId, { loginTime: formatTime() })
      this.logService.createLoginlog(request, '登录成功', userId, accessTokenKey)
      // 7. 记录日志
      return { accessToken, refreshToken, expiresIn: this.expiresIn }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : '登录失败'
      this.logService.createLoginlog(request, errorMsg)
      throw error
    }
  }

  /** 获取登录用户信息（每次调用都重建角色/部门缓存与角色级权限缓存，权限变更刷新即生效） */
  public async getInfo(userId: string) {
    // 1. 查询用户信息（含角色关联）
    const user = await this.userService.findOneById(userId)
    const activeRoles = (user.roles ?? []).filter((role) => role.status === CommonConstant.STATUS_NORMAL)
    const roleCodeList = [...new Set(activeRoles.map((role) => role.roleCode))]
    const adminRole = activeRoles.find((role) => role.roleCode === RbacConstant.SUPER_ROLE_CODE)

    // 2. 写用户级缓存（角色 + 可见部门；角色级权限缓存在第 3 步按需回源）
    await Promise.all([
      this.redisService.set(`${RedisConstant.ADMIN_USER_ROLES}:${userId}`, JSON.stringify(activeRoles.map((role) => ({ id: role.id, roleCode: role.roleCode }))), 'EX', this.expiresIn),
      this.userService.getVisibleDeptIds(userId),
    ])

    // 3. 权限标识：超管读全量权限（内容为菜单表全部启用按钮权限串，权限守卫依赖此缓存做严格匹配）；
    // 普通用户按角色聚合。每次刷新强制回源重算并覆盖写回（force），
    // 新增菜单/按钮后刷新页面即生效，无需重存授权或等缓存过期（守卫高频读仍走缓存，性能设计不变）
    const permissions = adminRole
      ? await this.menuService.getPermsCacheByRoleId(adminRole.id, true, true)
      : [...new Set((await Promise.all(activeRoles.map((role) => this.menuService.getPermsCacheByRoleId(role.id, false, true)))).flat())]

    // 4. 预热角色数据范围缓存（数据权限拦截器只读缓存，缺失时 fail-closed 按 1=0 查空；超管不再短路，同样需要预热）
    await Promise.all(activeRoles.map((role) => this.roleService.getRoleScopeCache(role.id)))

    // 4. 剔除敏感字段后返回
    const safeUser: Record<string, unknown> = { ...user }
    delete safeUser.password
    delete safeUser.deleteTime
    delete safeUser.roles
    if (roleCodeList.length === 0) throw new BusinessException('请先联系管理员分配角色')
    return { user: safeUser, roles: roleCodeList, permissions }
  }

  /** 获取登录用户可访问的路由菜单（扁平列表，前端 generateRoutes 建树） */
  public async getRoutes(userId: string) {
    const roles = await this.userService.getUserRoles(userId)
    if (!roles) throw new BusinessException('登录状态已失效，请重新登录', HttpStatus.UNAUTHORIZED)
    const isAdmin = roles.some((role) => role.roleCode === RbacConstant.SUPER_ROLE_CODE)
    const roleIds = roles.map((role) => role.id)
    return this.menuService.findRoutesByRoleIds(roleIds, isAdmin)
  }

  /** 刷新令牌：校验并轮换 refreshToken，重发 accessToken（滑动续期，每次刷新重置 7 天） */
  public async refreshToken(refreshToken: string, request: ExpressRequest) {
    let payload: AuthType.JwtPayload
    try {
      payload = this.jwtService.verify(refreshToken)
    } catch {
      throw new BusinessException('登录状态已失效，请重新登录', HttpStatus.UNAUTHORIZED)
    }
    const { userId, username, uuid, type } = payload
    if (type !== 'refresh') throw new BusinessException('登录状态已失效，请重新登录', HttpStatus.UNAUTHORIZED)
    // 值比对防「已轮换的旧刷新令牌重放」
    const refreshTokenKey = `${RedisConstant.REFRESH_TOKEN_KEY}:${userId}:${uuid}`
    const storedToken = await this.redisService.get(refreshTokenKey)
    if (storedToken !== refreshToken) throw new BusinessException('登录状态已失效，请重新登录', HttpStatus.UNAUTHORIZED)
    // 轮换：签发新 refreshToken（新 jti）并重置 TTL，旧令牌随之作废
    const newRefreshToken = this.jwtService.sign({ userId, username, uuid, type: 'refresh', jti: randomUUID() })
    await this.redisService.set(refreshTokenKey, newRefreshToken, 'EX', this.refreshExpiresIn)
    // 重发 accessToken（同 uuid，签名结果确定）并重置访问 key TTL
    const accessToken = this.jwtService.sign({ userId, username, uuid })
    await this.redisService.set(`${RedisConstant.ACCESS_TOKEN_KEY}:${userId}:${uuid}`, accessToken, 'EX', this.expiresIn)
    // 在线记录覆盖重建（原记录可能已过期，EXPIRE 对缺失键无效）
    await this.logService.saveOnlineRecord(request, userId, username, uuid)
    return { accessToken, refreshToken: newRefreshToken, expiresIn: this.expiresIn }
  }

  /** 退出登录 */
  public async logout(token: string) {
    try {
      const { userId, uuid }: AuthType.JwtPayload = this.jwtService.verify(token)
      const tokenKey = `${RedisConstant.ACCESS_TOKEN_KEY}:${userId}:${uuid}`
      const refreshTokenKey = `${RedisConstant.REFRESH_TOKEN_KEY}:${userId}:${uuid}`
      const onlineKey = `${RedisConstant.ADMIN_USER_ONLINE_KEY}:${userId}:${uuid}`
      await this.redisService.del(tokenKey, refreshTokenKey, onlineKey)
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : '退出登录失败'
      this.logger.error(errorMsg)
    }
    return `退出登录成功`
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Handler                              */
  /* -------------------------------------------------------------------------- */
  /** 获取 AccessToken 的过期时间 */
  private get expiresIn() {
    return this.configService.getOrThrow<number>(ConfigConstant.JWT_EXPIRES_IN)
  }

  /** 获取 RefreshToken 的过期时间（秒，默认 7 天） */
  private get refreshExpiresIn() {
    return this.configService.get<number>(ConfigConstant.JWT_REFRESH_EXPIRES_IN, 604800)
  }

  /** 生成访问/刷新令牌对并存入 Redis（共用同一 uuid，刷新令牌载荷带 type 与 jti） */
  private async generateTokenPair(user: { id: string; username: string }) {
    const { id: userId, username } = user
    const uuid = randomUUID()
    const accessTokenKey = `${RedisConstant.ACCESS_TOKEN_KEY}:${userId}:${uuid}`
    const refreshTokenKey = `${RedisConstant.REFRESH_TOKEN_KEY}:${userId}:${uuid}`
    const accessToken = this.jwtService.sign({ userId, username, uuid })
    const refreshToken = this.jwtService.sign({ userId, username, uuid, type: 'refresh', jti: randomUUID() })
    await this.redisService.set(accessTokenKey, accessToken, 'EX', this.expiresIn)
    await this.redisService.set(refreshTokenKey, refreshToken, 'EX', this.refreshExpiresIn)
    return { accessToken, accessTokenKey, refreshToken }
  }
}
