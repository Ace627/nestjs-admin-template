/**
 * 配置常量类
 * - 说明：定义项目中配置文件相关的常量，如服务器、JWT、Redis、OpenAI 等配置路径
 * - 用途：在项目中统一使用，通过 ConfigService 获取配置时避免硬编码字符串
 */
export const ConfigConstant = {
  /**
   * 服务器端口
   * 应用监听的端口号，用于启动 HTTP 服务
   */
  SERVER_PORT: 'server.port',

  /**
   * 全局路由前缀
   * 所有接口路径的统一前缀，如设置为 api 则接口路径为 /api/xxx
   */
  SERVER_GLOBAL_PREFIX: 'server.globalPrefix',

  /**
   * 演示模式开关
   * 对应 .env 中 SERVER_IS_DEMO，默认 false；开启后标识当前为演示环境，可用于拦截增删改等破坏性操作
   */
  SERVER_IS_DEMO: 'server.isDemo',

  /**
   * Redis 配置路径
   * 通过 ConfigService.get(REDIS) 可获取 Redis 连接配置对象（host/port/password/db）
   */
  REDIS: 'redis',

  /**
   * 数据库配置路径
   * 通过 ConfigService.get(DATABASE) 可获取数据库连接配置对象（host/port/username/password 等）
   */
  DATABASE: 'database',

  /**
   * 数据库主机地址
   * MySQL 服务器地址，默认 127.0.0.1
   */
  DATABASE_HOST: 'database.host',

  /**
   * 数据库端口
   * MySQL 端口号，默认 3306
   */
  DATABASE_PORT: 'database.port',

  /**
   * 数据库用户名
   * MySQL 登录用户名，默认 root
   */
  DATABASE_USERNAME: 'database.username',

  /**
   * 数据库密码
   * MySQL 登录密码
   */
  DATABASE_PASSWORD: 'database.password',

  /**
   * 数据库名称
   * 要连接的 MySQL 数据库名，需提前创建
   */
  DATABASE_DATABASE: 'database.database',

  /**
   * 数据库时区
   * 数据库连接时区，如 +08:00 表示北京时间
   */
  DATABASE_TIMEZONE: 'database.timezone',

  /**
   * 是否自动同步表结构
   * TypeORM synchronize 开关，开发环境可开启，生产环境必须关闭
   */
  DATABASE_SYNCHRONIZE: 'database.synchronize',

  /**
   * 数据库字符集与排序规则
   * 值取 MySQL 排序规则名（如 utf8mb4_unicode_ci），该名已含字符集信息；
   * utf8mb4 支持完整 Unicode（含 emoji 和生僻字），unicode_ci 按 Unicode 标准排序
   */
  DATABASE_CHARSET: 'database.charset',

  /**
   * JWT 签名密钥
   * 用于签发与校验访问令牌的密钥，需与 .env 中 JWT_SECRET 一致，生产环境务必使用强随机值
   */
  JWT_SECRET: 'jwt.secret',

  /**
   * JWT 访问令牌有效期
   * 单位：秒，1800 表示 30 分钟，需与 .env 中 JWT_EXPIRES_IN 一致
   */
  JWT_EXPIRES_IN: 'jwt.expiresIn',
}
