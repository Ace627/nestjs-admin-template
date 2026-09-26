/**
 * 连接开发库，自动生成最新的 init.sql（覆盖仓库根目录同名文件）
 *
 * 连接参数读取 server/.env（进程环境变量优先），复用 server 的 mysql2 依赖
 * 用法：node scripts/generate-init-sql.mjs
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'

const projectDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const envFilePath = path.join(projectDir, 'server', '.env')
const outputFilePath = path.join(projectDir, 'init.sql')
const EOL = '\r\n'

/**
 * 解析 .env 文件为键值对象（仅支持 KEY=VALUE 行与 # 注释）
 */
async function parseEnvFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf8')
    const envConfig = {}
    for (const line of content.split(/\r?\n/)) {
      const trimmedLine = line.trim()
      if (!trimmedLine || trimmedLine.startsWith('#')) continue
      const separatorIndex = trimmedLine.indexOf('=')
      if (separatorIndex === -1) continue
      const key = trimmedLine.slice(0, separatorIndex).trim()
      const value = trimmedLine.slice(separatorIndex + 1).trim()
      envConfig[key] = value
    }
    return envConfig
  } catch {
    return {}
  }
}

/**
 * 组装数据库连接配置（环境变量优先，其次 server/.env）
 */
async function resolveConnectionConfig() {
  const envConfig = await parseEnvFile(envFilePath)
  const readConfig = (key) => process.env[key] ?? envConfig[key]
  const config = {
    host: readConfig('MYSQL_HOST') || '127.0.0.1',
    port: Number(readConfig('MYSQL_PORT') || 3306),
    user: readConfig('MYSQL_USERNAME') || 'root',
    password: readConfig('MYSQL_PASSWORD') || '',
    database: readConfig('MYSQL_DATABASE') || 'nestdemo',
  }
  if (!config.password) throw new Error('数据库密码为空，请检查 server/.env 的 MYSQL_PASSWORD')
  return config
}

/**
 * 生成文件头注释（对齐现有 init.sql 的 Navicat 风格）
 */
function buildHeader(config, tableCount) {
  const now = new Date()
  const pad = (num) => String(num).padStart(2, '0')
  const dateText = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
  return [
    '/*',
    ' 导出脚本自动生成（scripts/generate-init-sql.mjs）',
    '',
    ` Source Server         : ${config.host}:${config.port}`,
    ' Source Server Type    : MySQL',
    ` Source Schema         : ${config.database}`,
    '',
    ' Target Server Type    : MySQL',
    ' File Encoding         : 65001',
    '',
    ` Date: ${dateText}`,
    ` Tables: ${tableCount}`,
    '*/',
    '',
    'SET NAMES utf8mb4;',
    'SET FOREIGN_KEY_CHECKS = 0;',
    '',
  ].join(EOL)
}

/**
 * 启动：连接数据库，逐表导出结构与数据，覆盖写入 init.sql
 */
async function bootstrap() {
  const config = await resolveConnectionConfig()
  // mysql2 依赖在 server 包内，从 server 目录解析加载
  const requireFromServer = createRequire(path.join(projectDir, 'server', 'package.json'))
  const mysql = requireFromServer('mysql2/promise')

  console.log(`🚀 连接数据库 ${config.host}:${config.port}/${config.database} ...`)
  const connection = await mysql.createConnection({ ...config, dateStrings: true })

  try {
    // 1. 取全量表名（SHOW TABLES 本身按名称排序，与现有文件一致）
    const [tableRows] = await connection.query('SHOW TABLES')
    const tableNames = tableRows.map((row) => Object.values(row)[0])
    if (tableNames.length === 0) throw new Error('数据库中没有任何表，请确认连接的是开发库')

    // 2. 逐表导出建表语句与数据行
    const sections = []
    for (const tableName of tableNames) {
      const [createRows] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``)
      const createSql = createRows[0]['Create Table']
      const [dataRows] = await connection.query(`SELECT * FROM \`${tableName}\``)

      const sectionLines = [
        `-- ----------------------------`,
        `-- Table structure for ${tableName}`,
        `-- ----------------------------`,
        `DROP TABLE IF EXISTS \`${tableName}\`;`,
        `${createSql.replace(/\n/g, EOL)};`,
        '',
        `-- ----------------------------`,
        `-- Records of ${tableName}`,
        `-- ----------------------------`,
      ]
      for (const dataRow of dataRows) {
        const valuesText = Object.values(dataRow).map((value) => connection.escape(value)).join(', ')
        sectionLines.push(`INSERT INTO \`${tableName}\` VALUES (${valuesText});`)
      }
      sections.push(sectionLines.join(EOL))
      console.log(`✅ 已导出：${tableName}（${dataRows.length} 行）`)
    }

    // 3. 拼装并覆盖写入 init.sql
    const content = buildHeader(config, tableNames.length) + sections.join(EOL) + `${EOL}SET FOREIGN_KEY_CHECKS = 1;${EOL}`
    await writeFile(outputFilePath, content, 'utf8')
    console.log(`\n🎉 已生成 ${outputFilePath}（共 ${tableNames.length} 张表）`)
  } finally {
    await connection.end()
  }
}

bootstrap().catch((error) => {
  console.error(`❌ 生成失败：${error instanceof Error ? error.message : error}`)
  process.exit(1)
})
