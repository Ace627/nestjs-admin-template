import 'dotenv/config'
import { DataSource } from 'typeorm'
import { configuration } from './src/configuration'

const config = configuration()

export default new DataSource({
  type: 'mysql',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  timezone: config.database.timezone,
  charset: config.database.charset,

  // 迁移核心配置
  entities: ['src/**/*.entity.ts'], // 自定义实体文件路径
  migrations: ['src/database/migrations/*.ts'], // 自定义迁移文件路径
  migrationsTableName: 'sys_migrations', // 自定义迁移表名
})
