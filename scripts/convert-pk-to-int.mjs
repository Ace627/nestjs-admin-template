#!/usr/bin/env node
/**
 * 将模板的 UUID 主键一次性转换为 int 自增主键
 *
 * 用法：
 *   node scripts/convert-pk-to-int.mjs --dry-run           预览改动，不写文件（默认）
 *   node scripts/convert-pk-to-int.mjs --apply             执行转换
 *   node scripts/convert-pk-to-int.mjs --apply --verify    转换后执行前后端构建验证
 *
 * 仅适用于新克隆且尚未执行 pnpm db:init 的项目；已有 UUID 数据或已生成 UUID baseline 的库不支持。
 */

import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_ROOT = path.resolve(SCRIPT_DIR, '..')
const args = process.argv.slice(2)
const rootIndex = args.indexOf('--root')
const ROOT = rootIndex >= 0 ? path.resolve(args[rootIndex + 1]) : DEFAULT_ROOT
const isApply = args.includes('--apply')
const isVerify = args.includes('--verify')
const isDryRun = !isApply

const SERVER_SRC = 'apps/server/src'
const ADMIN_SRC = 'apps/admin/src'
const INIT_SQL = 'resource/init.sql'

const ID_NAMES = ['id', 'userId', 'roleId', 'menuId', 'deptId', 'parentId', 'targetParentId', 'jobId', 'jobIds', 'logIds', 'fileId', 'folderId', 'deptIds', 'roleIds', 'menuIds', 'userIds', 'targetIds', 'affectedIds', 'excludeId', 'ids']
const ID_NAME_SET = new Set(ID_NAMES)

const FK_COLUMNS = {
  sys_dept: { parent_id: 'sys_dept' },
  sys_menu: { parent_id: 'sys_menu' },
  sys_file: { parent_id: 'sys_file' },
  sys_user: { dept_id: 'sys_dept' },
  sys_user_role: { user_id: 'sys_user', role_id: 'sys_role' },
  sys_role_menu: { role_id: 'sys_role', menu_id: 'sys_menu' },
  sys_role_dept: { role_id: 'sys_role', dept_id: 'sys_dept' },
  sys_oper_log: { user_id: 'sys_user' },
  sys_login_log: { user_id: 'sys_user' },
  sys_job_log: { job_id: 'sys_job' },
}

const documents = new Map()
const failures = []

function fail(message) {
  failures.push(message)
}

function assertFailures() {
  if (!failures.length) return
  console.error('\n转换中止，未写入任何文件：')
  failures.forEach((message) => console.error(`  - ${message}`))
  process.exit(1)
}

function absPath(relativePath) {
  return path.join(ROOT, relativePath)
}

function readDocument(relativePath) {
  if (documents.has(relativePath)) return documents.get(relativePath)
  const absolutePath = absPath(relativePath)
  if (!fs.existsSync(absolutePath)) {
    fail(`找不到文件：${relativePath}`)
    return null
  }
  const rawText = fs.readFileSync(absolutePath, 'utf8')
  const eol = rawText.includes('\r\n') ? '\r\n' : '\n'
  const document = { relativePath, absolutePath, eol, originalText: rawText, text: rawText.replace(/\r\n/g, '\n') }
  documents.set(relativePath, document)
  return document
}

function getText(relativePath) {
  return readDocument(relativePath)?.text ?? ''
}

function setText(relativePath, text) {
  const document = readDocument(relativePath)
  if (!document) return
  document.text = text
}

function replaceExact(relativePath, searchText, replacementText, expectedCount = 1) {
  const text = getText(relativePath)
  const count = text.split(searchText).length - 1
  if (count !== expectedCount) {
    fail(`${relativePath} 命中次数不符：期望 ${expectedCount} 处，实际 ${count} 处；片段：${searchText.slice(0, 80)}`)
    return
  }
  setText(relativePath, text.split(searchText).join(replacementText))
}

function replaceRegex(relativePath, pattern, replacement, expectedCount = null) {
  const text = getText(relativePath)
  let count = 0
  const nextText = text.replace(pattern, (...matchArgs) => {
    count += 1
    if (typeof replacement === 'function') return replacement(...matchArgs)
    return replacement.replace(/\$(\d+)/g, (placeholder, groupIndex) => matchArgs[Number(groupIndex)] ?? placeholder)
  })
  if (expectedCount !== null && count !== expectedCount) {
    fail(`${relativePath} 正则命中次数不符：期望 ${expectedCount} 处，实际 ${count} 处；规则：${String(pattern)}`)
    return
  }
  setText(relativePath, nextText)
}

function walkFiles(directory, extensions, result = []) {
  const absoluteDirectory = absPath(directory)
  if (!fs.existsSync(absoluteDirectory)) return result
  for (const entry of fs.readdirSync(absoluteDirectory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'logs') continue
    const relativePath = path.posix.join(directory, entry.name)
    if (entry.isDirectory()) walkFiles(relativePath, extensions, result)
    else if (extensions.some((extension) => entry.name.endsWith(extension))) result.push(relativePath)
  }
  return result
}

function ensureNamedImport(relativePath, moduleName, importedName) {
  const text = getText(relativePath)
  const importPattern = new RegExp(`import\\s*\\{([^}]*)\\}\\s*from\\s*'${moduleName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`)
  const match = text.match(importPattern)
  if (match) {
    const names = match[1].split(',').map((name) => name.trim()).filter(Boolean)
    if (names.includes(importedName)) return
    const nextNames = [...names, importedName].join(', ')
    setText(relativePath, text.replace(importPattern, `import { ${nextNames} } from '${moduleName}'`))
    return
  }
  const lines = text.split('\n')
  let lastImportIndex = -1
  lines.forEach((line, index) => {
    if (/^import\s/.test(line)) lastImportIndex = index
  })
  lines.splice(lastImportIndex + 1, 0, `import { ${importedName} } from '${moduleName}'`)
  setText(relativePath, lines.join('\n'))
}

function unquoteSqlValue(token) {
  const trimmed = token.trim()
  if (trimmed === 'NULL' || trimmed === 'null') return null
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) return trimmed.slice(1, -1).replace(/''/g, "'")
  return trimmed
}

function quoteSqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`
}

/** 按 SQL 单引号规则拆分 VALUES(...) 内的字段，保留原始 token 形式 */
function splitSqlValues(valuesText) {
  const values = []
  let current = ''
  let inQuote = false
  let escaped = false
  for (const character of valuesText) {
    if (escaped) {
      current += character
      escaped = false
      continue
    }
    if (character === '\\' && inQuote) {
      current += character
      escaped = true
      continue
    }
    if (character === "'") {
      current += character
      inQuote = !inQuote
      continue
    }
    if (character === ',' && !inQuote) {
      values.push(current.trim())
      current = ''
      continue
    }
    current += character
  }
  values.push(current.trim())
  return values
}

/** 解析 init.sql 的建表列顺序与 INSERT 行 */
function parseInitSql(sqlText) {
  const lines = sqlText.split('\n')
  const tables = new Map()
  const rowsByTable = new Map()
  let currentTable = null

  for (const line of lines) {
    const createMatch = line.match(/^CREATE TABLE `([^`]+)` \(/)
    if (createMatch) {
      currentTable = { name: createMatch[1], columns: [], lineIndexes: [] }
      tables.set(currentTable.name, currentTable)
      continue
    }
    if (currentTable) {
      if (/^\)/.test(line)) {
        currentTable = null
        continue
      }
      const columnMatch = line.match(/^  `([^`]+)` /)
      if (columnMatch) currentTable.columns.push(columnMatch[1])
      continue
    }
    const insertMatch = line.match(/^INSERT INTO `([^`]+)` VALUES \((.*)\);$/)
    if (insertMatch) {
      const tableName = insertMatch[1]
      const rows = rowsByTable.get(tableName) ?? []
      rows.push({ line, values: splitSqlValues(insertMatch[2]) })
      rowsByTable.set(tableName, rows)
    }
  }

  return { lines, tables, rowsByTable }
}

/**
 * 将 init.sql 的 UUID 主键、外键与 ancestors 重映射为 int。
 * 映射按每张表 INSERT 出现顺序分配 1..N，保证多次执行结果一致。
 */
function convertInitSql() {
  const document = readDocument(INIT_SQL)
  if (!document) return null
  const parsed = parseInitSql(document.text)
  const { lines, tables, rowsByTable } = parsed

  if (rowsByTable.size === 0) {
    fail(`${INIT_SQL} 中没有解析到 INSERT 数据`)
    return null
  }

  const idMaps = new Map()
  for (const [tableName, rows] of rowsByTable) {
    const table = tables.get(tableName)
    if (!table) {
      fail(`${INIT_SQL} 中找不到表 ${tableName} 的建表定义`)
      continue
    }
    if (!table.columns.includes('id')) continue
    const idIndex = table.columns.indexOf('id')
    const idMap = new Map()
    let nextId = 1
    for (const row of rows) {
      const uuid = unquoteSqlValue(row.values[idIndex])
      if (!uuid || uuid === '0') continue
      if (idMap.has(uuid)) {
        fail(`${INIT_SQL} 中 ${tableName}.id 存在重复值：${uuid}`)
        continue
      }
      idMap.set(uuid, nextId)
      nextId += 1
    }
    idMaps.set(tableName, idMap)
  }

  const adminId = (() => {
    const userRows = rowsByTable.get('sys_user') ?? []
    const userTable = tables.get('sys_user')
    if (!userTable) return null
    const usernameIndex = userTable.columns.indexOf('username')
    const idIndex = userTable.columns.indexOf('id')
    const adminRow = userRows.find((row) => unquoteSqlValue(row.values[usernameIndex]) === 'admin')
    return adminRow ? idMaps.get('sys_user')?.get(unquoteSqlValue(adminRow.values[idIndex])) ?? null : null
  })()

  if (adminId === null) fail(`${INIT_SQL} 中找不到 admin 用户，无法同步 ADMIN_USER_ID`)

  let insertIndex = 0
  const rewrittenLines = lines.map((line) => {
    const createMatch = line.match(/^CREATE TABLE `([^`]+)` \(/)
    if (createMatch) {
      currentDdlTable = createMatch[1]
      return line
    }
    if (/^\)/.test(line)) {
      currentDdlTable = null
      return line
    }
    if (currentDdlTable) {
      const columnMatch = line.match(/^  `([^`]+)` /)
      if (!columnMatch) return line
      const columnName = columnMatch[1]
      const tableName = currentDdlTable
      const isPrimaryKey = columnName === 'id'
      const isForeignKey = Boolean(FK_COLUMNS[tableName]?.[columnName])
      if (!isPrimaryKey && !isForeignKey) return line
      let nextLine = line.replace(/varchar\(36\)(?:\s+(?:CHARACTER SET|COLLATE)\s+\w+)*/i, 'int')
      if (isPrimaryKey && !/AUTO_INCREMENT/i.test(nextLine)) {
        nextLine = nextLine.replace(/\bint\b(\s+NOT NULL)/, 'int$1 AUTO_INCREMENT')
      }
      return nextLine
    }

    const insertMatch = line.match(/^INSERT INTO `([^`]+)` VALUES \((.*)\);$/)
    if (!insertMatch) return line
    insertIndex += 1
    const tableName = insertMatch[1]
    const table = tables.get(tableName)
    if (!table) {
      fail(`${INIT_SQL} 第 ${insertIndex} 条 INSERT 找不到建表定义：${tableName}`)
      return line
    }
    const values = splitSqlValues(insertMatch[2])
    if (values.length !== table.columns.length) {
      fail(`${INIT_SQL} 中 ${tableName} 列数不一致：建表 ${table.columns.length} 列，INSERT ${values.length} 列`)
      return line
    }

    const nextValues = values.map((token, index) => {
      const columnName = table.columns[index]
      const rawValue = unquoteSqlValue(token)
      if (rawValue === null || rawValue === '0') return token
      if (columnName === 'id') {
        const mappedId = idMaps.get(tableName)?.get(rawValue)
        if (!mappedId) {
          fail(`${INIT_SQL} 中 ${tableName}.id 无法映射：${rawValue}`)
          return token
        }
        return String(mappedId)
      }
      const referencedTable = FK_COLUMNS[tableName]?.[columnName]
      if (referencedTable) {
        const mappedId = idMaps.get(referencedTable)?.get(rawValue)
        if (!mappedId) {
          fail(`${INIT_SQL} 中 ${tableName}.${columnName} 引用 ${referencedTable} 失败：${rawValue}`)
          return token
        }
        return String(mappedId)
      }
      if (columnName === 'ancestors') {
        const segments = rawValue.split(',').map((segment) => {
          if (!segment || segment === '0') return segment
          const mappedId = idMaps.get(tableName)?.get(segment)
          if (!mappedId) {
            fail(`${INIT_SQL} 中 ${tableName}.ancestors 存在无法映射的节点：${segment}`)
            return segment
          }
          return String(mappedId)
        })
        return quoteSqlString(segments.join(','))
      }
      return token
    })

    return `INSERT INTO \`${tableName}\` VALUES (${nextValues.join(', ')});`
  })

  const mappingSummary = [...idMaps.entries()]
    .filter(([, idMap]) => idMap.size > 0)
    .map(([tableName, idMap]) => `${tableName}: ${idMap.size} 条 → 1..${idMap.size}`)

  setText(INIT_SQL, rewrittenLines.join('\n'))
  return { mappingSummary, adminId, insertCount: insertIndex }
}

let currentDdlTable = null

function keepStringTransport(name, isArray, relativePath) {
  if (isArray) return false
  // 复数 ids 的非数组形式都是逗号拼接的传输字段，不是单个主键
  if (name === 'ids') return true
  if (name === 'roleIds' && relativePath.endsWith('/user.dto.ts')) return true
  return false
}

function convertIdTypeAnnotations(relativePath, text) {
  const pattern = new RegExp(`(\\b(?:${ID_NAMES.join('|')})\\??\\s*:\\s*)string(\\[\\])?`, 'g')
  return text.replace(pattern, (match, prefix, arraySuffix, offset) => {
    const nameMatch = match.match(new RegExp(`(${ID_NAMES.join('|')})\\??\\s*:`))
    const name = nameMatch?.[1]
    if (!name) return match
    if (keepStringTransport(name, Boolean(arraySuffix), relativePath)) return match
    return `${prefix}number${arraySuffix ?? ''}`
  })
}

function convertEntityFile(relativePath, text) {
  let nextText = text
  nextText = nextText.replace(/@PrimaryGeneratedColumn\('uuid'\)/g, "@PrimaryGeneratedColumn({ type: 'int' })")
  nextText = nextText.replace(/@PrimaryGeneratedColumn\('uuid',\s*\{/g, "@PrimaryGeneratedColumn({ type: 'int',")

  const idColumns = new Set(['parent_id', 'dept_id', 'role_id', 'menu_id', 'user_id', 'job_id'])
  nextText = nextText
    .split('\n')
    .map((line) => {
      const columnMatch = line.match(/name: '([^']+)'/)
      if (!columnMatch || !idColumns.has(columnMatch[1])) return line
      let nextLine = line.replace(/type: 'varchar',\s*(comment: '[^']*',\s*)?length: 36/, (match, comment) => {
        if (!comment) return "type: 'int'"
        return `type: 'int', ${comment.replace(/,\s*$/, '')}`
      })
      nextLine = nextLine.replace(/type: 'varchar',\s*length: 36/, "type: 'int'")
      return nextLine
    })
    .join('\n')

  return nextText
}

/** 处理 DTO 中的 ID 校验装饰器：@IsString → @Type(Number) + @IsInt，移除 UUID 长度限制 */
function convertDtoDecorators(relativePath, text) {
  const lines = text.split('\n')
  const output = []
  for (const line of lines) {
    const propertyMatch = line.match(/^(\s*)([A-Za-z_$][\w$]*)(\??):\s*(?:string|number)(\[\])?(.*)$/)
    if (!propertyMatch) {
      output.push(line)
      continue
    }
    const [, indent, propertyName, , arraySuffix, tail] = propertyMatch
    const isArray = Boolean(arraySuffix)
    if (!ID_NAME_SET.has(propertyName) || keepStringTransport(propertyName, isArray, relativePath)) {
      output.push(line)
      continue
    }

    let decoratorStart = output.length
    while (decoratorStart > 0 && output[decoratorStart - 1].trim().startsWith('@')) decoratorStart -= 1
    const decoratorBlock = output.splice(decoratorStart)
    let nextBlock = decoratorBlock.filter((decoratorLine) => !/^\s*@Length\(1,\s*36\b/.test(decoratorLine))

    const hasIsString = nextBlock.some((decoratorLine) => /^\s*@IsString\(\)\s*$/.test(decoratorLine))
    const hasType = nextBlock.some((decoratorLine) => /^\s*@Type\(/.test(decoratorLine))
    const hasIsInt = nextBlock.some((decoratorLine) => /^\s*@IsInt\(/.test(decoratorLine))
    const hasIsArray = nextBlock.some((decoratorLine) => /^\s*@IsArray\(/.test(decoratorLine))

    if (hasIsString) {
      nextBlock = nextBlock.map((decoratorLine) =>
        /^\s*@IsString\(\)\s*$/.test(decoratorLine) ? `${indent}@Type(() => Number)\n${indent}@IsInt({ message: '参数 $property 必须是整数' })` : decoratorLine,
      )
    } else {
      const additions = []
      if (!hasType) additions.push(`${indent}@Type(() => Number)`)
      if (isArray && !hasIsArray) additions.push(`${indent}@IsArray({ message: '参数 $property 必须是数组' })`)
      if (!hasIsInt) additions.push(isArray ? `${indent}@IsInt({ each: true, message: '参数 $property 必须是整数数组' })` : `${indent}@IsInt({ message: '参数 $property 必须是整数' })`)
      nextBlock = [...nextBlock, ...additions]
    }

    output.push(...nextBlock, line.replace(/:\s*(?:string|number)(\[\])?/, ': number$1'))
  }
  return output.join('\n')
}

function runPreflight() {
  for (const requiredFile of ['apps/server/package.json', 'apps/admin/package.json', INIT_SQL, `${SERVER_SRC}/common/entities/base.entity.ts`]) {
    if (!fs.existsSync(absPath(requiredFile))) fail(`缺少模板文件：${requiredFile}`)
  }
  assertFailures()

  const migrationDirectory = absPath(`${SERVER_SRC}/database/migrations`)
  if (fs.existsSync(migrationDirectory)) {
    const migrationFiles = fs.readdirSync(migrationDirectory).filter((fileName) => fileName.endsWith('.ts'))
    if (migrationFiles.length > 0) {
      fail(`检测到已有迁移文件（${migrationFiles.length} 个），说明数据库可能已经按 UUID 初始化。请先恢复干净仓库并删除旧库后再转换。`)
    }
  }

  if (fs.existsSync(absPath('.git'))) {
    try {
      execSync('git diff --quiet && git diff --cached --quiet', { cwd: ROOT, stdio: 'ignore' })
    } catch {
      fail('工作区存在未提交的已跟踪改动，请先提交或恢复后再执行转换，确保可用 git 回滚。')
    }
  }

  const entityFiles = walkFiles(`${SERVER_SRC}/common/entities`, ['.entity.ts'])
  const uuidColumnCount = entityFiles.reduce((total, relativePath) => total + (getText(relativePath).match(/@PrimaryGeneratedColumn\('uuid'/g)?.length ?? 0), 0)
  if (uuidColumnCount === 0) {
    console.log('当前模板已经是 int 主键，无需转换。')
    process.exit(0)
  }
  if (uuidColumnCount !== 12) fail(`UUID 主键实体数量不符：期望 12 个，实际 ${uuidColumnCount} 个。模板可能已变更，请先更新转换脚本。`)
  const insertCount = (getText(INIT_SQL).match(/^INSERT INTO /gm) ?? []).length
  if (insertCount !== 198) fail(`${INIT_SQL} 的 INSERT 数量不符：期望 198 条，实际 ${insertCount} 条。模板可能已变更，请先更新转换脚本。`)
}

function convertBackend() {
  const serverFiles = walkFiles(SERVER_SRC, ['.ts'])
  const excludedFiles = new Set([`${SERVER_SRC}/utils/tree-helper.ts`])

  // 先应用需要同时修改返回值/函数签名的精确规则，再做通用类型替换
  const exactPatches = [
    ['common/constant/common.constant.ts', "DEFAULT_PARENT_ID: '0',", 'DEFAULT_PARENT_ID: 0,', 1],
    ['modules/system/dept/dept.service.ts', 'const parentId = createDto.parentId || CommonConstant.DEFAULT_PARENT_ID', 'const parentId = createDto.parentId ?? CommonConstant.DEFAULT_PARENT_ID', 1],
    ['modules/system/dept/dept.service.ts', 'const newParentId = updateDto.parentId || entity.parentId', 'const newParentId = updateDto.parentId ?? entity.parentId', 1],
    ['modules/system/dept/dept.service.ts', 'public async findDescendants(deptIds: string[]): Promise<string[]>', 'public async findDescendants(deptIds: number[]): Promise<number[]>', 1],
    ['modules/system/dept/dept.service.ts', 'const result = new Set<string>()', 'const result = new Set<number>()', 1],
    ['modules/system/dept/dept.service.ts', "const ancestors = dept.ancestors ? dept.ancestors.split(',') : []", "const ancestors = dept.ancestors ? dept.ancestors.split(',').map(Number) : []", 1],
    ['modules/system/dept/dept.service.ts', 'private async buildAncestors(parentId: string): Promise<string>', 'private async buildAncestors(parentId: number): Promise<string>', 1],
    ['modules/system/dept/dept.service.ts', 'if (parentId === CommonConstant.DEFAULT_PARENT_ID) return CommonConstant.DEFAULT_PARENT_ID', 'if (parentId === CommonConstant.DEFAULT_PARENT_ID) return String(CommonConstant.DEFAULT_PARENT_ID)', 1],
    ['modules/system/menu/menu.service.ts', 'const parentId = createDto.parentId || CommonConstant.DEFAULT_PARENT_ID', 'const parentId = createDto.parentId ?? CommonConstant.DEFAULT_PARENT_ID', 1],
    ['modules/system/menu/menu.service.ts', 'const targetParentId = updateDto.parentId || entity.parentId', 'const targetParentId = updateDto.parentId ?? entity.parentId', 1],
    ['modules/system/menu/menu.service.ts', 'public async findIdsByRoleId(roleId: string, isAdmin: boolean): Promise<string[]>', 'public async findIdsByRoleId(roleId: number, isAdmin: boolean): Promise<number[]>', 1],
    ['modules/system/menu/menu.service.ts', 'public async findAllIds(): Promise<string[]>', 'public async findAllIds(): Promise<number[]>', 1],
    ['modules/system/menu/menu.service.ts', 'private async findDescendantIds(ids: string[]): Promise<string[]>', 'private async findDescendantIds(ids: number[]): Promise<number[]>', 1],
    ['modules/system/menu/menu.service.ts', 'const result = new Set<string>()', 'const result = new Set<number>()', 1],
    ['modules/system/file/file.service.ts', 'const parentId = createDto.parentId || CommonConstant.DEFAULT_PARENT_ID', 'const parentId = createDto.parentId ?? CommonConstant.DEFAULT_PARENT_ID', 1],
    ['modules/system/file/file.service.ts', 'const targetParentId = moveDto.targetParentId || CommonConstant.DEFAULT_PARENT_ID', 'const targetParentId = moveDto.targetParentId ?? CommonConstant.DEFAULT_PARENT_ID', 1],
    ['modules/system/file/file.service.ts', 'const parentId = registerDto.parentId || CommonConstant.DEFAULT_PARENT_ID', 'const parentId = registerDto.parentId ?? CommonConstant.DEFAULT_PARENT_ID', 1],
    ['modules/system/file/file.service.ts', "const ids = [...new Set(moveDto.ids.split(',').filter(Boolean))]", "const ids = [...new Set(moveDto.ids.split(',').map(Number).filter(Number.isInteger))]", 1],
    ['modules/system/file/file.service.ts', 'private findIncludingDeleted(ids: string[]): Promise<FileEntity[]>', 'private findIncludingDeleted(ids: number[]): Promise<FileEntity[]>', 1],
    ['modules/system/file/file.service.ts', 'private async expandWithDescendants(targets: FileEntity[]): Promise<string[]>', 'private async expandWithDescendants(targets: FileEntity[]): Promise<number[]>', 1],
    ['modules/system/file/file.service.ts', 'private async resolvePurgeIds(ids: string[]): Promise<string[]>', 'private async resolvePurgeIds(ids: number[]): Promise<number[]>', 1],
    ['modules/system/file/file.service.ts', 'private async purge(allIds: string[]): Promise<number>', 'private async purge(allIds: number[]): Promise<number>', 1],
    ['modules/system/file/file.service.ts', 'private async buildAncestors(parentId: string): Promise<string>', 'private async buildAncestors(parentId: number): Promise<string>', 1],
    ['modules/system/file/file.service.ts', 'if (parentId === CommonConstant.DEFAULT_PARENT_ID) return CommonConstant.DEFAULT_PARENT_ID', 'if (parentId === CommonConstant.DEFAULT_PARENT_ID) return String(CommonConstant.DEFAULT_PARENT_ID)', 1],
    ['modules/system/user/user.service.ts', 'private cleanupStaleAvatar(userId: string, oldAvatar: string | undefined | null, newAvatar: string): void', 'private cleanupStaleAvatar(userId: number, oldAvatar: string | undefined | null, newAvatar: string): void', 1],
    ['modules/system/user/user.service.ts', 'private async cleanupStaleAvatarAsync(userId: string, oldAvatar: string): Promise<void>', 'private async cleanupStaleAvatarAsync(userId: number, oldAvatar: string): Promise<void>', 1],
    ['modules/system/user/user.service.ts', 'public async getVisibleDeptIds(userId: string): Promise<string[] | null>', 'public async getVisibleDeptIds(userId: number): Promise<number[] | null>', 1],
    ['modules/system/user/user.service.ts', 'if (jsonStr) return JSON.parse(jsonStr) as string[]', 'if (jsonStr) return JSON.parse(jsonStr) as number[]', 1],
    ['modules/system/user/user.service.ts', 'if (!userId?.trim()) return', 'if (!userId) return', 1],
    ['modules/system/user/user.service.ts', "const roleIds = importDto.roleIds.split(',').map((id) => id.trim()).filter(Boolean)", "const roleIds = importDto.roleIds.split(',').map((id) => Number(id.trim())).filter(Number.isInteger)", 1],
    ['modules/system/role/role.service.ts', 'private async clearHolderRoleCache(roleIds: string[])', 'private async clearHolderRoleCache(roleIds: number[])', 1],
    ['modules/system/role/role.service.ts', 'getRawMany<{ userId: string }>()', 'getRawMany<{ userId: number }>()', 1],
    ['modules/monitor/job/job.service.ts', 'private async stop(jobId: string)', 'private async stop(jobId: number)', 1],
    ['modules/monitor/job/job.service.ts', 'this.jobQueue.removeJobScheduler(job.id)', 'this.jobQueue.removeJobScheduler(String(job.id))', 2],
    ['modules/monitor/job/job.service.ts', 'this.jobQueue.remove(job.id)', 'this.jobQueue.remove(String(job.id))', 2],
    ['modules/monitor/job/job.service.ts', 'this.jobQueue.getJobScheduler(job.id)', 'this.jobQueue.getJobScheduler(String(job.id))', 1],
    ['modules/monitor/job/job.service.ts', 'this.jobQueue.upsertJobScheduler(job.id,', 'this.jobQueue.upsertJobScheduler(String(job.id),', 1],
    ['modules/monitor/job/job.service.ts', 'this.jobQueue.getJobScheduler(jobId)', 'this.jobQueue.getJobScheduler(String(jobId))', 1],
    ['modules/monitor/job/job.service.ts', 'this.jobQueue.removeJobScheduler(jobId)', 'this.jobQueue.removeJobScheduler(String(jobId))', 1],
    ['modules/monitor/job/job.service.ts', 'this.jobQueue.getJob(job.id)', 'this.jobQueue.getJob(String(job.id))', 1],
    ['modules/monitor/job/job.service.ts', 'jobId: job.id,', 'jobId: String(job.id),', 1],
    ['modules/auth/auth.service.ts', 'private async generateTokenPair(user: { id: string; username: string })', 'private async generateTokenPair(user: { id: number; username: string })', 1],
    ['common/interceptor/data-scope.interceptor.ts', 'private async getUserDepts(userId: string): Promise<string[] | null>', 'private async getUserDepts(userId: number): Promise<number[] | null>', 1],
    ['common/interceptor/data-scope.interceptor.ts', 'let userDepts: string[] | null | undefined', 'let userDepts: number[] | null | undefined', 1],
    ['common/interceptor/data-scope.interceptor.ts', 'return jsonStr ? (JSON.parse(jsonStr) as string[]) : null', 'return jsonStr ? (JSON.parse(jsonStr) as number[]) : null', 1],
    ['common/entities/system/file.entity.ts', '0,{uuid}', '0,1,2', 1],
  ]

  for (const [relativePath, searchText, replacementText, expectedCount] of exactPatches) {
    replaceExact(`${SERVER_SRC}/${relativePath}`, searchText, replacementText, expectedCount)
  }

  // 控制器：query ID 显式转数字
  for (const relativePath of serverFiles.filter((file) => file.endsWith('.controller.ts'))) {
    replaceRegex(relativePath, /@Query\('id'\)\s+(\w+): string/g, "@Query('id', ParseIntPipe) $1: number")
    replaceRegex(relativePath, /@Query\('roleId'\)\s+(\w+): string/g, "@Query('roleId', ParseIntPipe) $1: number")
    replaceRegex(relativePath, /new ParseArrayPipe\(\)\)\s+ids: string\[\]/g, 'new ParseArrayPipe({ items: Number })) ids: number[]')
    if (getText(relativePath).includes('ParseIntPipe')) ensureNamedImport(relativePath, '@nestjs/common', 'ParseIntPipe')
  }

  for (const relativePath of serverFiles) {
    if (excludedFiles.has(relativePath)) continue
    let text = getText(relativePath)
    if (relativePath.endsWith('.entity.ts')) text = convertEntityFile(relativePath, text)
    text = convertIdTypeAnnotations(relativePath, text)
    setText(relativePath, text)
  }

  // DTO 校验装饰器（在类型替换之后执行，兼容已经是 number 的属性）
  for (const relativePath of serverFiles.filter((file) => file.endsWith('.dto.ts'))) {
    let text = convertDtoDecorators(relativePath, getText(relativePath))
    setText(relativePath, text)
    text = getText(relativePath)
    if (text.includes('@Type(')) ensureNamedImport(relativePath, 'class-transformer', 'Type')
    if (text.includes('@IsInt(')) ensureNamedImport(relativePath, 'class-validator', 'IsInt')
  }
}

function convertFrontend() {
  const frontendFiles = [
    ...walkFiles(`${ADMIN_SRC}/api`, ['.ts']),
    ...walkFiles(`${ADMIN_SRC}/types/api`, ['.ts']),
    ...walkFiles(`${ADMIN_SRC}/views`, ['.ts', '.vue']),
    `${ADMIN_SRC}/router/router.helper.ts`,
  ]
  const excludedFiles = new Set([`${ADMIN_SRC}/views/example/upload/index.vue`])

  const exactPatches = [
    [`${ADMIN_SRC}/router/router.helper.ts`, "const ROOT_PARENT_ID = '0'", 'const ROOT_PARENT_ID = 0', 1],
    [`${ADMIN_SRC}/router/router.helper.ts`, 'export function generateRoutes(menus: Menu.MenuItem[], parentId: string = ROOT_PARENT_ID)', 'export function generateRoutes(menus: Menu.MenuItem[], parentId: number = ROOT_PARENT_ID)', 1],
    [`${ADMIN_SRC}/router/router.helper.ts`, 'toPascalCase(menu.component || menu.path || menu.id)', 'toPascalCase(menu.component || menu.path || String(menu.id))', 1],
    [`${ADMIN_SRC}/views/system/dept/index.vue`, "row.parentId !== '0'", 'row.parentId !== 0', 1],
    [`${ADMIN_SRC}/views/system/dept/index.vue`, 'DeptRequest.delete({ ids: row.id })', 'DeptRequest.delete({ ids: String(row.id) })', 1],
    [`${ADMIN_SRC}/views/system/menu/index.vue`, 'MenuRequest.delete({ ids: row.id })', 'MenuRequest.delete({ ids: String(row.id) })', 1],
    [`${ADMIN_SRC}/views/system/menu/components/MenuDialog.vue`, "parentId: menu ? (menu.menuType === 'F' ? menu.parentId : menu.id) : '0',", 'parentId: menu ? (menu.menuType === \'F\' ? menu.parentId : menu.id) : 0,', 1],
    [`${ADMIN_SRC}/views/system/user/index.vue`, 'function handleDeptClick(deptId: string)', 'function handleDeptClick(deptId: number)', 1],
    [`${ADMIN_SRC}/views/system/user/components/DeptTree.vue`, 'const emit = defineEmits<{ nodeClick: [deptId: string] }>()', 'const emit = defineEmits<{ nodeClick: [deptId: number] }>()', 1],
    [`${ADMIN_SRC}/views/system/user/components/UserDialog.vue`, 'async function resetForm(userId?: string, defaultDeptId?: string)', 'async function resetForm(userId?: number, defaultDeptId?: number)', 1],
    [`${ADMIN_SRC}/views/system/user/components/UserDialog.vue`, 'async function open(record?: User.SysUser, defaultDeptId?: string)', 'async function open(record?: User.SysUser, defaultDeptId?: number)', 1],
    [`${ADMIN_SRC}/views/system/user/components/UserDialog.vue`, "data.deptId && data.deptId !== '0'", 'data.deptId && data.deptId !== 0', 1],
    [`${ADMIN_SRC}/views/system/user/components/UserImportDialog.vue`, 'const form = ref<{ deptId?: string; roleIds: string[]; file?: File }>({ roleIds: [] })', 'const form = ref<{ deptId?: number; roleIds: number[]; file?: File }>({ roleIds: [] })', 1],
    [`${ADMIN_SRC}/views/system/user/components/UserImportDialog.vue`, 'const rules: FormRules<{ deptId: string; roleIds: string[]; file: File }> = {', 'const rules: FormRules<{ deptId: number; roleIds: number[]; file: File }> = {', 1],
    [`${ADMIN_SRC}/views/system/user/components/UserImportDialog.vue`, "formData.append('deptId', form.value.deptId as string)", "formData.append('deptId', String(form.value.deptId))", 1],
    [`${ADMIN_SRC}/views/system/role/components/RoleDialog.vue`, 'async function resetForm(roleId?: string)', 'async function resetForm(roleId?: number)', 1],
    [`${ADMIN_SRC}/views/system/role/components/AuthPermission.vue`, 'const defaultCheckedKeys = ref<string[]>([])', 'const defaultCheckedKeys = ref<number[]>([])', 1],
    [`${ADMIN_SRC}/views/system/role/components/AuthPermission.vue`, 'function findMissingParentNames(ids: string[]): string[]', 'function findMissingParentNames(ids: number[]): string[]', 1],
    [`${ADMIN_SRC}/views/system/role/components/AuthPermission.vue`, 'const parentMap = new Map<string, string>()', 'const parentMap = new Map<number, number>()', 1],
    [`${ADMIN_SRC}/views/system/role/components/AuthPermission.vue`, 'const nameMap = new Map<string, string>()', 'const nameMap = new Map<number, string>()', 1],
    [`${ADMIN_SRC}/views/system/role/components/AuthPermission.vue`, 'const missingIds = new Set<string>()', 'const missingIds = new Set<number>()', 1],
    [`${ADMIN_SRC}/views/system/role/components/AuthPermission.vue`, 'return [...missingIds].map((id) => nameMap.get(id) ?? id)', 'return [...missingIds].map((id) => nameMap.get(id) ?? String(id))', 1],
    [`${ADMIN_SRC}/views/system/role/components/AuthPermission.vue`, 'as string[]', 'as number[]', 2],
    [`${ADMIN_SRC}/views/system/role/components/DataScopeDialog.vue`, 'const defaultCheckedKeys = ref<string[]>([])', 'const defaultCheckedKeys = ref<number[]>([])', 1],
    [`${ADMIN_SRC}/views/system/role/components/DataScopeDialog.vue`, 'as string[]', 'as number[]', 2],
    [`${ADMIN_SRC}/views/system/role/components/DataScopeDialog.vue`, 'function collectAllDeptIds(list: Dept.DeptItem[]): string[]', 'function collectAllDeptIds(list: Dept.DeptItem[]): number[]', 1],
    [`${ADMIN_SRC}/views/system/file/components/FolderTree.vue`, "const ROOT_ID = '0'", 'const ROOT_ID = 0', 1],
    [`${ADMIN_SRC}/views/system/file/components/FolderTree.vue`, 'const emit = defineEmits<{ nodeClick: [folderId: string]; create: [parentId: string]; rename: [node: File.TreeItem]; remove: [node: File.TreeItem] }>()', 'const emit = defineEmits<{ nodeClick: [folderId: number]; create: [parentId: number]; rename: [node: File.TreeItem]; remove: [node: File.TreeItem] }>()', 1],
    [`${ADMIN_SRC}/views/system/file/components/FolderTree.vue`, '@click="emit(\'create\', \'0\')"', '@click="emit(\'create\', 0)"', 1],
    [`${ADMIN_SRC}/views/system/file/components/FolderTree.vue`, "let lastClickedId = ''", 'let lastClickedId: number | null = null', 1],
    [`${ADMIN_SRC}/views/system/file/components/FolderTree.vue`, "lastClickedId = ''", 'lastClickedId = null', 2],
    [`${ADMIN_SRC}/views/system/file/components/FolderTree.vue`, 'function setSelected(folderId: string)', 'function setSelected(folderId: number)', 1],
    [`${ADMIN_SRC}/views/system/file/components/FileMoveDialog.vue`, "const ROOT_ID = '0'", 'const ROOT_ID = 0', 1],
    [`${ADMIN_SRC}/views/system/file/components/FileMoveDialog.vue`, 'async function open(ids: string, currentParentId?: string)', 'async function open(ids: string, currentParentId?: number)', 1],
    [`${ADMIN_SRC}/views/system/file/components/FileMoveDialog.vue`, 'targetParentId.value = currentParentId || ROOT_ID', 'targetParentId.value = currentParentId ?? ROOT_ID', 1],
    [`${ADMIN_SRC}/views/system/file/components/FileUploadDialog.vue`, "const parentId = ref('0')", 'const parentId = ref(0)', 1],
    [`${ADMIN_SRC}/views/system/file/components/FileUploadDialog.vue`, 'function open(folderId: string)', 'function open(folderId: number)', 1],
    [`${ADMIN_SRC}/views/system/file/components/FolderDialog.vue`, "function open(mode: 'create' | 'rename', parentId?: string, node?: File.TreeItem)", "function open(mode: 'create' | 'rename', parentId?: number, node?: File.TreeItem)", 1],
    [`${ADMIN_SRC}/views/system/file/index.vue`, "const queryParams = ref<File.Query>({ pageNo: 1, pageSize: 10, parentId: '0' })", 'const queryParams = ref<File.Query>({ pageNo: 1, pageSize: 10, parentId: 0 })', 1],
    [`${ADMIN_SRC}/views/system/file/index.vue`, 'function handleFolderCreate(parentId: string)', 'function handleFolderCreate(parentId: number)', 1],
    [`${ADMIN_SRC}/views/system/file/index.vue`, "queryParams.value.parentId = '0'", 'queryParams.value.parentId = 0', 1],
    [`${ADMIN_SRC}/views/system/file/index.vue`, "fileUploadDialogRef.value?.open(queryParams.value.parentId ?? '0')", 'fileUploadDialogRef.value?.open(queryParams.value.parentId ?? 0)', 1],
    [`${ADMIN_SRC}/views/system/file/index.vue`, 'FileRequest.delete({ ids: node.id })', 'FileRequest.delete({ ids: String(node.id) })', 1],
    [`${ADMIN_SRC}/views/monitor/job/components/JobDialog.vue`, 'async function resetForm(id?: string)', 'async function resetForm(id?: number)', 1],
    [`${ADMIN_SRC}/views/system/dept/index.vue`, 'const items = Object.entries(sortChanges.value).map(([id, deptSort]) => ({ id, deptSort }))', 'const items = Object.entries(sortChanges.value).map(([id, deptSort]) => ({ id: Number(id), deptSort }))', 1],
    [`${ADMIN_SRC}/views/system/menu/index.vue`, 'const items = Object.entries(sortChanges.value).map(([id, menuSort]) => ({ id, menuSort }))', 'const items = Object.entries(sortChanges.value).map(([id, menuSort]) => ({ id: Number(id), menuSort }))', 1],
    [`${ADMIN_SRC}/views/system/dict/components/TypePanel.vue`, 'const props = defineProps<{ selectedId: string }>()', 'const props = defineProps<{ selectedId?: number }>()', 1],
    [`${ADMIN_SRC}/views/system/dict/components/TypePanel.vue`, 'DictRequest.deleteType({ ids: target.id })', 'DictRequest.deleteType({ ids: String(target.id) })', 1],
    [`${ADMIN_SRC}/views/system/dict/index.vue`, ':selected-id="selectedType?.id ?? \'\'"', ':selected-id="selectedType?.id"', 1],
    [`${ADMIN_SRC}/views/system/user/components/DeptTree.vue`, "let lastClickedId = ''", 'let lastClickedId: number | null = null', 1],
    [`${ADMIN_SRC}/views/system/user/components/DeptTree.vue`, "lastClickedId = ''", 'lastClickedId = null', 2],
    [`${ADMIN_SRC}/views/system/user/components/DeptTree.vue`, "emit('nodeClick', '')", "emit('nodeClick', 0)", 1],
    [`${ADMIN_SRC}/api/system/role.request.ts`, 'static findPermission(params: { roleId: string }): Promise<string[]>', 'static findPermission(params: { roleId: number }): Promise<number[]>', 1],
    [`${ADMIN_SRC}/types/api/system/file.ts`, '0,{uuid}', '0,1,2', 1],
  ]

  for (const [relativePath, searchText, replacementText, expectedCount] of exactPatches) {
    replaceExact(relativePath, searchText, replacementText, expectedCount)
  }

  // 单条删除/移动的 ids 查询参数仍按逗号字符串传输
  for (const relativePath of frontendFiles.filter((file) => file.includes('/views/'))) {
    replaceRegex(relativePath, /\b(row|record) \? \1\.id : /g, (match, variableName) => `${variableName} ? String(${variableName}.id) : `)
  }

  for (const relativePath of frontendFiles) {
    if (excludedFiles.has(relativePath)) continue
    setText(relativePath, convertIdTypeAnnotations(relativePath, getText(relativePath)))
  }
}

function validateConvertedFiles() {
  const entityFiles = walkFiles(`${SERVER_SRC}/common/entities`, ['.entity.ts'])
  const remainingUuidColumns = entityFiles.reduce((total, relativePath) => total + (getText(relativePath).match(/@PrimaryGeneratedColumn\('uuid'/g)?.length ?? 0), 0)
  if (remainingUuidColumns !== 0) fail(`实体中仍存在 ${remainingUuidColumns} 个 UUID 主键装饰器`)

  for (const relativePath of entityFiles) {
    const text = getText(relativePath)
    const idProperty = text.match(/^\s+(id|parentId|deptId|roleId|jobId|userId):\s*string/m)
    if (idProperty) fail(`${relativePath} 仍有字符串 ID 属性：${idProperty[0].trim()}`)
  }

  const initText = getText(INIT_SQL)
  const insertCount = (initText.match(/^INSERT INTO /gm) ?? []).length
  if (insertCount !== 198) fail(`${INIT_SQL} 转换后 INSERT 数量异常：${insertCount}`)
  if (/^\s+`id`\s+varchar\(36\)/m.test(initText)) fail(`${INIT_SQL} 中仍有 varchar(36) 主键列`)
  if (/"uuid"/.test(getText(`${SERVER_SRC}/common/entities/system/user.entity.ts`))) fail('user.entity.ts 仍存在 uuid 主键配置')
}

function printDiffSummary() {
  const changed = [...documents.values()].filter((document) => document.originalText.replace(/\r\n/g, '\n') !== document.text)
  console.log(`\n将修改 ${changed.length} 个文件：`)
  changed.forEach((document) => console.log(`  - ${document.relativePath}`))
  return changed
}

function writeDocuments(changedDocuments) {
  for (const document of changedDocuments) {
    const nextText = document.eol === '\r\n' ? document.text.replace(/\n/g, '\r\n') : document.text
    const tempPath = `${document.absolutePath}.int-pk.tmp`
    fs.writeFileSync(tempPath, nextText, 'utf8')
    fs.renameSync(tempPath, document.absolutePath)
  }
}

function runVerify() {
  for (const command of ['pnpm -C apps/server exec tsc --noEmit', 'pnpm -C apps/server build', 'pnpm -C apps/admin build']) {
    console.log(`\n$ ${command}`)
    execSync(command, { cwd: ROOT, stdio: 'inherit' })
  }
}

function main() {
  if (isVerify && !isApply) {
    console.log('--verify 需要与 --apply 一起使用，例如：node scripts/convert-pk-to-int.mjs --apply --verify')
    return
  }
  console.log(`目标目录：${ROOT}`)
  runPreflight()
  assertFailures()

  const seedResult = convertInitSql()
  assertFailures()

  const constantPath = `${SERVER_SRC}/common/constant/common.constant.ts`
  const constantText = getText(constantPath)
  const adminIdMatch = constantText.match(/ADMIN_USER_ID:\s*'([0-9a-fA-F-]{36})'/)
  if (!adminIdMatch) fail('common.constant.ts 中找不到 ADMIN_USER_ID 的 UUID 字面量')
  else if (seedResult?.adminId !== null && seedResult?.adminId !== undefined) {
    replaceExact(constantPath, `ADMIN_USER_ID: '${adminIdMatch[1]}'`, `ADMIN_USER_ID: ${seedResult.adminId}`, 1)
  }

  convertBackend()
  convertFrontend()
  validateConvertedFiles()
  assertFailures()

  const changedDocuments = printDiffSummary()
  if (seedResult) {
    console.log('\n种子主键映射：')
    seedResult.mappingSummary.forEach((line) => console.log(`  - ${line}`))
    console.log(`  - 共重写 ${seedResult.insertCount} 条 INSERT`)
  }

  if (isDryRun) {
    console.log('\n--dry-run 模式，未写入文件。确认无误后加 --apply 执行。')
    return
  }

  writeDocuments(changedDocuments)
  console.log(`\n转换完成，已写入 ${changedDocuments.length} 个文件。`)
  console.log('下一步：')
  console.log('  1. cd apps/server && pnpm install && cp .env.example .env')
  console.log('  2. pnpm db:init（必须使用空库；若旧库已存在，先删除或使用 --force）')
  console.log('  3. 分别启动前后端完成冒烟测试')

  if (isVerify) runVerify()
}

main()
