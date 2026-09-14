import helmet from 'helmet'
import { resolve } from 'node:path'
import { AppModule } from './app.module'
import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { WinstonModule, ConfigConstant } from '@/common'
import { NestExpressApplication } from '@nestjs/platform-express'

async function bootstrap() {
  // 创建 NestJS 应用实例，传入根模块 AppModule，NestFactory.create() 会初始化依赖注入系统并加载所有模块
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger: WinstonModule.createLogger() })

  // 从配置服务中获取服务器端口和全局路由前缀
  const configService = app.get(ConfigService)
  const serverPort = configService.getOrThrow<number>(ConfigConstant.SERVER_PORT)
  const globalPrefix = configService.getOrThrow<string>(ConfigConstant.SERVER_GLOBAL_PREFIX)

  // 配置 Helmet 中间件，用于设置 HTTP 头，增强应用的安全性
  app.use(helmet())

  // 设置全局路由前缀，所有接口都必须在该前缀下访问
  app.setGlobalPrefix(globalPrefix)

  // 将 uploads 目录挂载为静态资源目录（如用户头像），访问路径为 {globalPrefix}/uploads/文件名
  app.useStaticAssets(resolve(process.cwd(), 'uploads'), { prefix: `${globalPrefix}/uploads` })

  // 启用优雅关闭，退出时触发各模块 onModuleDestroy
  app.enableShutdownHooks()

  // 启动应用并监听配置中指定的端口，这一步会启动 HTTP 服务器，使应用开始接收外部请求
  await app.listen(serverPort)

  console.log('\n--------------------------------------------------')
  console.log(`🚀 Local:    http://localhost:${serverPort}${globalPrefix}`)
  console.log('--------------------------------------------------')
}
bootstrap()
