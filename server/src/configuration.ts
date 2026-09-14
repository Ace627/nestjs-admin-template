import { toInteger, toBoolean } from './utils'

export const configuration = () => {
  return {
    server: {
      port: toInteger(process.env.SERVER_PORT, 3000),
      globalPrefix: process.env.SERVER_GLOBAL_PREFIX || '/',
      isDemo: toBoolean(process.env.SERVER_IS_DEMO, false),
    },

    redis: {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: toInteger(process.env.REDIS_PORT, 6379),
      password: process.env.REDIS_PASSWORD,
      db: toInteger(process.env.REDIS_DB, 0),
      enableOfflineQueue: true, // 断线期间命令入队，恢复后补发
      enableReadyCheck: true, // 等 Redis ready 后再执行命令
      maxRetriesPerRequest: 20, // 单条命令离线重试上限，超了才 reject
      retryStrategy: (times: number) => (times > 10 ? null : Math.min(times * 200, 3000)), // 指数退避封顶 3s，10 次后仍失败则停止重连
      reconnectOnError: (error: Error) => error.message.includes('READONLY'), // 可恢复错误自动重连
    },

    database: {
      host: process.env.MYSQL_HOST || '127.0.0.1',
      port: toInteger(process.env.MYSQL_PORT, 3306),
      username: process.env.MYSQL_USERNAME || 'root',
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE || 'nestdemo',
      timezone: '+08:00',
      synchronize: toBoolean(process.env.MYSQL_SYNCHRONIZE, false),
      charset: 'utf8mb4_unicode_ci', // mysql2 的 charset 在 SQL 层即排序规则名，写 utf8mb4 会退化成 utf8mb4_general_ci
    },

    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: toInteger(process.env.JWT_EXPIRES_IN, 1800),
    },
  }
}
