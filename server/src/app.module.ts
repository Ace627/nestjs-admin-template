import { MiddlewareConsumer, Module, NestModule, ValidationPipe } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config' // 环境变量配置
import { configuration } from './configuration'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import { AllExceptionsFilter, BeforeEachMiddleware, DatabaseModule, TokenModule } from '@/common'
import { ResponseCacheInterceptor, OperlogInterceptor, ResponseTransformInterceptor, DataScopeInterceptor } from '@/common'
import { JwtAuthGuard, ThrottlerLimitGuard, PermissionAuthGuard, RoleAuthGuard, DemoEnvironmentGuard, RepeatSubmitGuard } from '@/common'
import { SharedModule } from './shared/shared.module'
import { AuthModule } from './modules/auth/auth.module'
import { SystemModule } from './modules/system/system.module'
import { MonitorModule } from './modules/monitor/monitor.module'
import { DashboardModule } from './modules/dashboard/dashboard.module'
import { CommonModule } from './modules/common/common.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    SharedModule, // 共享模块
    DatabaseModule, // 数据库模块
    TokenModule, // 令牌模块
    CommonModule, // 公共模块（Upload、Excel 等通用功能）
    AuthModule, // 鉴权管理
    SystemModule, // 系统管理
    MonitorModule, // 系统监控模块
    DashboardModule, // 首页统计
  ],

  providers: [
    // 限制接口请求频率，防止滥用
    { provide: APP_GUARD, useClass: ThrottlerLimitGuard },
    // 资源访问 Token 凭证权限校验守卫
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // 角色守卫 | 检查用户是否有指定角色访问当前接口
    { provide: APP_GUARD, useClass: RoleAuthGuard },
    // 接口访问权限守卫 | 检查用户是否有权限访问当前接口
    { provide: APP_GUARD, useClass: PermissionAuthGuard },
    // 防止重复提交守卫
    { provide: APP_GUARD, useClass: RepeatSubmitGuard },
    // 演示环境操作守卫
    { provide: APP_GUARD, useClass: DemoEnvironmentGuard },
    // 配置全局验证管道，用于验证请求参数和响应数据
    { provide: APP_PIPE, useValue: new ValidationPipe({ whitelist: true, transform: true, stopAtFirstError: true }) },
    // 全局异常过滤器，用于处理所有未捕获的异常
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    // 数据权限拦截器：解析 @DataScope 元数据，计算部门数据范围条件挂到请求上下文（供 @DataScopeSql 注入）
    { provide: APP_INTERCEPTOR, useClass: DataScopeInterceptor },
    // 操作日志拦截器，用于记录所有接口请求和响应
    { provide: APP_INTERCEPTOR, useClass: OperlogInterceptor },
    // 该拦截器会对应用中指定接口的响应进行缓存处理（如命中缓存直接返回、未命中则写入缓存）
    { provide: APP_INTERCEPTOR, useClass: ResponseCacheInterceptor },
    // 该拦截器会对应用中所有接口的响应进行统一处理（如包装响应格式、添加耗时统计）
    { provide: APP_INTERCEPTOR, useClass: ResponseTransformInterceptor },
  ],
})
export class AppModule implements NestModule {
  async configure(consumer: MiddlewareConsumer): Promise<void> {
    // 为每个请求生成 requestId，写入 X-Request-Id 响应头，用于日志链路追踪
    consumer.apply(BeforeEachMiddleware).forRoutes('')
  }
}
