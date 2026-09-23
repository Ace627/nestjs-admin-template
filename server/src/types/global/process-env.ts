export interface CustomProcessEnv {
  // ===== 服务器 =====
  SERVER_PORT: string
  SERVER_GLOBAL_PREFIX: string
  SERVER_IS_DEMO: string

  // ===== Redis =====
  REDIS_HOST: string
  REDIS_PORT: string
  REDIS_PASSWORD: string
  REDIS_DB: string

  // ===== MySQL =====
  MYSQL_HOST: string
  MYSQL_PORT: string
  MYSQL_USERNAME: string
  MYSQL_PASSWORD: string
  MYSQL_DATABASE: string
  MYSQL_TIMEZONE: string
  MYSQL_SYNCHRONIZE: string
  MYSQL_CHARSET: string

  // ===== JWT =====
  JWT_SECRET: string
  JWT_EXPIRES_IN: string
  JWT_REFRESH_EXPIRES_IN: string
}
