import { LoginDto, RefreshTokenDto } from './auth.dto'
import { AuthService } from './auth.service'
import { Body, Controller, Get, Post, Req, Headers } from '@nestjs/common'
import { CommonConstant, CurrentUser, Public, RepeatSubmit, SkipThrottle } from '@/common'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** 获取图片验证码 */
  @Public()
  @SkipThrottle()
  @Get('captcha')
  public getCaptcha() {
    return this.authService.getCaptcha()
  }

  /** 用户登录 */
  @Public()
  @RepeatSubmit()
  @Post('login')
  public login(@Body() loginDto: LoginDto, @Req() request: ExpressRequest) {
    return this.authService.login(loginDto, request)
  }

  /** 刷新令牌（无感续期，不挂防重复提交：并发 401 排队重放时 body 相同会被误拦） */
  @Public()
  @SkipThrottle()
  @Post('refreshToken')
  public refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken)
  }

  /* 获取登录用户信息 */
  @Get('getInfo')
  @SkipThrottle()
  public getInfo(@CurrentUser('userId') userId: string) {
    return this.authService.getInfo(userId)
  }

  /* 获取登录用户可访问的路由菜单 */
  @Get('getRoutes')
  public getRoutes(@CurrentUser('userId') userId: string) {
    return this.authService.getRoutes(userId)
  }

  /* 退出登录 */
  @Public()
  @Post('logout')
  public logout(@Headers(CommonConstant.AUTHORIZATION) authorization: string) {
    if (!authorization) return '退出成功'
    const token = authorization.split(' ')[1]
    return this.authService.logout(token)
  }
}
