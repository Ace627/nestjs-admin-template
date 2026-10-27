#!/usr/bin/env node
/**
 * 本地数据库初始化
 *
 * 1. 按 .env 的 MYSQL_* 配置连接 MySQL（不指定库，因为库可能还不存在）
 * 2. 目标库不存在则创建，字符集 utf8mb4 / utf8mb4_unicode_ci
 * 3. 导入仓库根目录的 init.sql（建表 + 种子数据）
 *
 * 用法：
 *   node scripts/init-db.js            库不存在或为空时导入；已有表则中止
 *   node scripts/init-db.js --force    忽略已有表直接导入（init.sql 内含 DROP TABLE，会清空同名表）
 *   node scripts/init-db.js --dry-run  只检测并打印将要执行的动作，不写库
 *
 * 注意：init.sql 自带 DROP TABLE IF EXISTS，导入即把同名表清空重建，不可撤销。
 */

const fs = require('fs')
const path = require('path')
const mysql = require('mysql2/promise')

const ENV_PATH = path.resolve(__dirname, '../.env')
const SQL_PATH = path.resolve(__dirname, '../../init.sql')

const commandArgs = process.argv.slice(2)
const isForce = commandArgs.includes('--force')
const isDryRun = commandArgs.includes('--dry-run')

/** 解析 .env，只取 KEY=VALUE 行，忽略注释、空行与成对引号 */
function parseEnvFile(filePath) {
  const result = {}
  const content = fs.readFileSync(filePath, 'utf8')
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const equalIndex = line.indexOf('=')
    if (equalIndex === -1) continue
    const key = line.slice(0, equalIndex).trim()
    let value = line.slice(equalIndex + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    result[key] = value
  }
  return result
}

/** 环境变量优先，其次 .env，最后默认值 */
function createConfigReader(envFile) {
  return (key, fallback) => process.env[key] || envFile[key] || fallback
}

/** 统计 init.sql 里的语句条数，用于结果摘要 */
function countStatements(sqlText) {
  const countBy = (pattern) => (sqlText.match(pattern) || []).length
  return {
    dropTable: countBy(/^DROP TABLE/gim),
    createTable: countBy(/^CREATE TABLE/gim),
    insert: countBy(/^INSERT INTO/gim),
  }
}

async function main() {
  if (!fs.existsSync(SQL_PATH)) {
    throw new Error(`找不到 init.sql：${SQL_PATH}`)
  }

  const envFile = fs.existsSync(ENV_PATH) ? parseEnvFile(ENV_PATH) : {}
  const readConfig = createConfigReader(envFile)

  const host = readConfig('MYSQL_HOST', '127.0.0.1')
  const port = Number(readConfig('MYSQL_PORT', '3306'))
  const user = readConfig('MYSQL_USERNAME', 'root')
  const password = readConfig('MYSQL_PASSWORD', '')
  const databaseName = readConfig('MYSQL_DATABASE', 'nestdemo')

  // 库名要直接拼进 SQL（标识符不支持占位符），先堵掉注入与非法字符
  if (!/^[\w$]+$/.test(databaseName)) {
    throw new Error(`MYSQL_DATABASE 含非法字符：${databaseName}（只允许字母、数字、下划线和 $）`)
  }

  const sqlText = fs.readFileSync(SQL_PATH, 'utf8').replace(/^\uFEFF/, '')
  const statementStat = countStatements(sqlText)

  console.log(`目标库：${databaseName}@${host}:${port}（用户 ${user}）`)
  console.log(`脚本文件：${SQL_PATH}`)

  const connection = await mysql.createConnection({ host, port, user, password, charset: 'utf8mb4_unicode_ci', multipleStatements: true, connectTimeout: 10000 })

  try {
    const [schemaRows] = await connection.query('SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?', [databaseName])
    const databaseExists = schemaRows.length > 0

    let existingTableCount = 0
    if (databaseExists) {
      const [tableRows] = await connection.query('SELECT COUNT(*) AS total FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?', [databaseName])
      existingTableCount = Number(tableRows[0].total)
    }

    if (databaseExists) {
      console.log(`库状态：已存在，当前 ${existingTableCount} 张表`)
    } else {
      console.log('库状态：不存在，将新建')
    }

    // 目标库有表就停下——init.sql 里的 DROP TABLE 会把数据清掉，必须显式授权
    if (existingTableCount > 0 && !isForce) {
      console.error('')
      console.error(`中止：目标库已有 ${existingTableCount} 张表，直接导入会清空同名表的数据。`)
      console.error('确认要重置，请加 --force 重新执行：')
      console.error('  node scripts/init-db.js --force')
      process.exitCode = 1
      return
    }

    const plannedActions = []
    if (existingTableCount > 0) {
      plannedActions.push(`清空并重建 ${statementStat.dropTable} 张表`)
    } else {
      plannedActions.push(`创建数据库 ${databaseName}`)
    }
    plannedActions.push(`建表 ${statementStat.createTable} 张`)
    plannedActions.push(`写入 ${statementStat.insert} 条数据`)

    if (isDryRun) {
      console.log('')
      console.log('--dry-run 模式，仅检测不写库。将要执行：')
      plannedActions.forEach((action, index) => console.log(`  ${index + 1}. ${action}`))
      process.exitCode = 0
      return
    }

    const startedAt = Date.now()

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
    await connection.query(`USE \`${databaseName}\``)
    await connection.query(sqlText)

    const [finalTableRows] = await connection.query('SELECT COUNT(*) AS total FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?', [databaseName])

    console.log('')
    console.log(`导入完成，耗时 ${Date.now() - startedAt}ms`)
    console.log(`  ${databaseExists ? '复用' : '新建'}数据库：${databaseName}`)
    console.log(`  建表 ${statementStat.createTable} 张`)
    console.log(`  写入 ${statementStat.insert} 条数据`)
    console.log(`  库内现有 ${Number(finalTableRows[0].total)} 张表`)
    console.log('')
    console.log('默认账号：admin / 123456')
  } finally {
    await connection.end()
  }
}

main().catch((error) => {
  console.error('')
  console.error('初始化失败：' + (error.sqlMessage || error.message))
  if (error.code) {
    console.error('错误码：' + error.code)
  }
  if (error.code === 'ECONNREFUSED') {
    console.error(`请确认 MySQL 已启动，且 .env 里的 MYSQL_HOST / MYSQL_PORT 正确。`)
  } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
    console.error('请确认 .env 里的 MYSQL_USERNAME / MYSQL_PASSWORD 正确。')
  }
  process.exitCode = 1
})
