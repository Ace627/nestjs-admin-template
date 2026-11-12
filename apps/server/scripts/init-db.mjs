#!/usr/bin/env node
/**
 * 数据库一键初始化
 *
 * 1. 按四层 env 文件（与 configuration.ts 的 getEnvFilePaths 一致）的 MYSQL_* 配置连接 MySQL（不指定库，因为库可能还不存在）
 * 2. 目标库不存在则创建，字符集 utf8mb4 / utf8mb4_unicode_ci
 * 3. 仓库里还没有迁移文件时，在空库上用 TypeORM 从实体生成 baseline 迁移
 * 4. 执行全部迁移完成建表
 * 5. 把 init.sql 里的 INSERT 提取为种子数据写入（自动补全列名，避免与实体生成的列顺序错位）
 *
 * 用法：
 *   node scripts/init-db.mjs            空库执行全流程；目标库已有表则中止
 *   node scripts/init-db.mjs --force    删库重建后执行全流程（不可撤销）
 *   node scripts/init-db.mjs --dry-run  只检测并打印将要执行的动作，不写库、不生成文件
 *
 * 注意：生成的 baseline 迁移文件必须提交进仓库；之后执行会跳过生成步骤，只跑已有迁移。
 */

import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import mysql from 'mysql2/promise'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const SERVER_DIR = path.resolve(SCRIPT_DIR, '..')
const SQL_PATH = path.resolve(SERVER_DIR, '../../init.sql')
const MIGRATIONS_DIR = path.resolve(SERVER_DIR, 'src/database/migrations')
const BASELINE_MIGRATION_PATH = 'src/database/migrations/baseline'
// 用当前 Node 直接执行 esno 入口加载 TypeScript，绕开 pnpm + shell
const ESNO_ENTRY_PATH = path.resolve(SERVER_DIR, 'node_modules/esno/esno.js')
const TYPEORM_CLI_PATH = './node_modules/typeorm/cli.js'

// 与 configuration.ts 的 getEnvFilePaths 保持同一顺序：靠前优先，外部注入的 process.env 优先级最高
const mode = process.env.NODE_ENV || 'development'
const ENV_FILES = [`.env.${mode}.local`, '.env.local', `.env.${mode}`, '.env'].map((file) => path.resolve(SERVER_DIR, file))
dotenv.config({ path: ENV_FILES, quiet: true })

const commandArgs = process.argv.slice(2)
const isForce = commandArgs.includes('--force')
const isDryRun = commandArgs.includes('--dry-run')

/**
 * 从 init.sql 的 CREATE TABLE 段落提取每张表的列顺序。
 * Navicat 风格导出里，列定义行以反引号开头，索引/约束行以 PRIMARY、KEY、CONSTRAINT 等关键字开头。
 */
function parseCreateTableColumns(sqlText) {
  const columnsByTable = new Map()
  let currentTableName = null
  let currentColumns = []

  for (const line of sqlText.split(/\r?\n/)) {
    const trimmedLine = line.trim()
    const createTableMatch = trimmedLine.match(/^CREATE TABLE `([^`]+)` \(/)
    if (createTableMatch) {
      currentTableName = createTableMatch[1]
      currentColumns = []
      continue
    }
    if (currentTableName === null) continue
    if (trimmedLine.startsWith(')')) {
      columnsByTable.set(currentTableName, currentColumns)
      currentTableName = null
      continue
    }
    const columnMatch = trimmedLine.match(/^`([^`]+)`\s/)
    if (columnMatch) currentColumns.push(columnMatch[1])
  }

  return columnsByTable
}

/**
 * 把 init.sql 里不带列名的 INSERT 改写成显式列名，避免实体生成的建表列顺序与导出快照不一致时数据错位。
 */
function buildSeedStatements(sqlText, columnsByTable) {
  const seedStatements = []
  let insertLineCount = 0

  for (const line of sqlText.split(/\r?\n/)) {
    const trimmedLine = line.trim()
    if (!trimmedLine.startsWith('INSERT INTO')) continue
    insertLineCount += 1

    const insertMatch = trimmedLine.match(/^INSERT INTO `([^`]+)` VALUES (.*);$/)
    if (!insertMatch) throw new Error(`无法解析 init.sql 中的 INSERT 语句：${trimmedLine.slice(0, 80)}`)

    const tableName = insertMatch[1]
    const valuesClause = insertMatch[2]
    const tableColumns = columnsByTable.get(tableName)
    if (!tableColumns?.length) throw new Error(`init.sql 中找不到 ${tableName} 的建表列定义，无法安全写入种子数据`)

    const columnList = tableColumns.map((columnName) => `\`${columnName}\``).join(', ')
    seedStatements.push(`INSERT INTO \`${tableName}\` (${columnList}) VALUES ${valuesClause};`)
  }

  if (seedStatements.length !== insertLineCount) throw new Error('init.sql 中有 INSERT 语句未被解析，中止以免漏灌种子数据')
  return seedStatements
}

function listMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) return []
  return fs.readdirSync(MIGRATIONS_DIR).filter((fileName) => fileName.endsWith('.ts') && !fileName.endsWith('.d.ts'))
}

/** 在 apps/server 目录下执行 TypeORM CLI，保证 ormconfig.ts 的相对路径与 env 加载路径一致 */
function runTypeorm(...commandArguments) {
  if (!fs.existsSync(ESNO_ENTRY_PATH) || !fs.existsSync(path.resolve(SERVER_DIR, TYPEORM_CLI_PATH))) {
    throw new Error('找不到 esno / TypeORM CLI，请先在 workspace 根目录执行 pnpm install')
  }

  return new Promise((resolve, reject) => {
    const childProcess = spawn(process.execPath, [ESNO_ENTRY_PATH, '-r', 'tsconfig-paths/register', TYPEORM_CLI_PATH, '-d', 'ormconfig.ts', ...commandArguments], {
      cwd: SERVER_DIR,
      stdio: 'inherit',
    })
    childProcess.on('error', reject)
    childProcess.on('close', (exitCode) => {
      if (exitCode === 0) resolve()
      else reject(new Error(`TypeORM ${commandArguments.join(' ')} 执行失败，退出码 ${exitCode}`))
    })
  })
}

async function main() {
  if (!fs.existsSync(SQL_PATH)) {
    throw new Error(`找不到 init.sql：${SQL_PATH}`)
  }

  const readConfig = (key, fallback) => process.env[key] || fallback

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
  const columnsByTable = parseCreateTableColumns(sqlText)
  const seedStatements = buildSeedStatements(sqlText, columnsByTable)

  const migrationFiles = listMigrationFiles()
  const shouldGenerateBaseline = migrationFiles.length === 0

  console.log(`目标库：${databaseName}@${host}:${port}（用户 ${user}）`)
  console.log(`种子数据：${SQL_PATH} → ${seedStatements.length} 条 INSERT（覆盖 ${columnsByTable.size} 张表）`)
  console.log(`迁移目录：${MIGRATIONS_DIR}（已有 ${migrationFiles.length} 个迁移文件）`)

  const connection = await mysql.createConnection({ host, port, user, password, charset: 'utf8mb4_unicode_ci', multipleStatements: true, connectTimeout: 10000 })

  try {
    const [schemaRows] = await connection.query('SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?', [databaseName])
    const databaseExists = schemaRows.length > 0

    let existingTableCount = 0
    if (databaseExists) {
      const [tableRows] = await connection.query('SELECT COUNT(*) AS total FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?', [databaseName])
      existingTableCount = Number(tableRows[0].total)
    }

    console.log(databaseExists ? `库状态：已存在，当前 ${existingTableCount} 张表` : '库状态：不存在，将新建')

    const plannedActions = []
    if (existingTableCount > 0) plannedActions.push(`删除并重建数据库 ${databaseName}（--force）`)
    else plannedActions.push(`创建数据库 ${databaseName}`)
    plannedActions.push(shouldGenerateBaseline ? '空库生成 baseline 迁移（从实体 diff 出全部建表语句）' : `跳过 baseline 生成（已有 ${migrationFiles.length} 个迁移文件）`)
    plannedActions.push('执行全部迁移 migration:run')
    plannedActions.push(`写入 ${seedStatements.length} 条种子数据`)

    if (isDryRun) {
      console.log('')
      console.log('--dry-run 模式，仅检测不写库、不生成文件。将要执行：')
      plannedActions.forEach((action, index) => console.log(`  ${index + 1}. ${action}`))
      if (existingTableCount > 0 && !isForce) {
        console.log('')
        console.log(`注意：目标库已有 ${existingTableCount} 张表，实际执行需要加 --force 才会删库重建。`)
      }
      return
    }

    if (existingTableCount > 0 && !isForce) {
      console.error('')
      console.error(`中止：目标库已有 ${existingTableCount} 张表，初始化需要空库。`)
      console.error('确认要删库重建，请加 --force 重新执行（不可撤销）：')
      console.error('  node scripts/init-db.mjs --force')
      process.exitCode = 1
      return
    }

    const startedAt = Date.now()

    if (existingTableCount > 0) {
      await connection.query(`DROP DATABASE \`${databaseName}\``)
    }
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)

    let generatedBaselineName = null
    if (shouldGenerateBaseline) {
      fs.mkdirSync(MIGRATIONS_DIR, { recursive: true })
      await runTypeorm('migration:generate', BASELINE_MIGRATION_PATH)
      const generatedFiles = listMigrationFiles()
      generatedBaselineName = generatedFiles.find((fileName) => !migrationFiles.includes(fileName)) ?? null
      if (!generatedBaselineName) throw new Error('baseline 迁移生成命令成功，但没有找到新迁移文件')
    }

    await runTypeorm('migration:run')

    await connection.query(`USE \`${databaseName}\``)
    await connection.beginTransaction()
    try {
      await connection.query('SET FOREIGN_KEY_CHECKS = 0')
      await connection.query(seedStatements.join('\n'))
      await connection.query('SET FOREIGN_KEY_CHECKS = 1')
      await connection.commit()
    } catch (seedError) {
      await connection.rollback()
      await connection.query('SET FOREIGN_KEY_CHECKS = 1')
      throw seedError
    }

    const [finalTableRows] = await connection.query('SELECT COUNT(*) AS total FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?', [databaseName])

    console.log('')
    console.log(`初始化完成，耗时 ${Date.now() - startedAt}ms`)
    console.log(`  ${existingTableCount > 0 ? '重建' : databaseExists ? '复用' : '新建'}数据库：${databaseName}`)
    console.log(`  baseline 迁移：${generatedBaselineName ? `已生成 ${generatedBaselineName}` : `跳过（已有 ${migrationFiles.length} 个）`}`)
    console.log(`  迁移执行：migration:run 完成`)
    console.log(`  写入种子数据：${seedStatements.length} 条`)
    console.log(`  库内现有 ${Number(finalTableRows[0].total)} 张表（含 sys_migrations）`)
    console.log('')
    console.log('默认账号：admin / 123456')
    if (generatedBaselineName) {
      console.log(`请把 ${path.join('src/database/migrations', generatedBaselineName)} 提交进仓库，之后初始化会跳过生成步骤`)
    }
    console.log('')
    console.log('后续新增表 / 删除表 / 改字段（MYSQL_SYNCHRONIZE=false，不要手工改表）：')
    console.log('  1. 改实体：apps/server/src/**/*.entity.ts')
    console.log('  2. 生成增量迁移：pnpm typeorm migration:generate src/database/migrations/<改动名>')
    console.log('  3. 检查生成的 up() / down() 并提交该迁移文件')
    console.log('  4. 执行迁移：pnpm migration:run')
    console.log('  5. 查看状态：pnpm typeorm migration:show    回滚最后一条：pnpm migration:revert')
    console.log('  换机器初始化：pnpm --filter server db:init（已有 baseline 时跳过生成，只跑迁移）')
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
    console.error('请确认 MySQL 已启动，且 .env 里的 MYSQL_HOST / MYSQL_PORT 正确。')
  } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
    console.error('请确认 .env 里的 MYSQL_USERNAME / MYSQL_PASSWORD 正确。')
  }
  process.exitCode = 1
})
