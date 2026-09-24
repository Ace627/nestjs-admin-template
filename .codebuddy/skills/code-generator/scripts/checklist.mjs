#!/usr/bin/env node
/**
 * 标准 CRUD 模块三数对账自检（code-generator skill 资源）
 *
 * 用法：node checklist.mjs [--allow-empty] [--extra-f-rows=N]
 *
 * 校验两组不变式：
 *   ① 控制器新增端点数 = 文档 DEFS 新增条数（严格一对一）
 *   ② init.sql 新增按钮权限行数 = 写端点数（POST/PUT/DELETE 各一条）+ 查询码一条（GET 端点共用 :query）+ 额外权限码 F 行
 *      （--extra-f-rows=N：GET 端点持有独立权限码（如 GET 形态导出出 :export 码）时，把对应 F 行数计入预期）
 * 数据来源：当前工作区相对 HEAD 的改动（git diff HEAD，含已暂存与未暂存）。
 * 净行数可为负：负值属删除侧改动，删除方向的对账同样成立；增删相抵净 0 视为无对账对象。
 * 不一致或净三数全 0（改动已提交/未保存，或增删相抵）均以退出码 1 结束；
 * 空跑确属预期时加 --allow-empty 显式豁免；一致打印统计后退出码 0。
 *
 * 判定口径（均取净行数：新增 − 删除，修改既有条目 +1/−1 相抵不计为新增；统计对象为去掉 diff 前缀后的行体）：
 *   控制器端点行   —— server/src/modules 下 *.controller.ts 中的 @Get/@Post/@Put/@Delete/@All 装饰器（注释行 // 与块注释排除；@All 按写端点计，需独立按钮行）
 *   DEFS 条数     —— sync-openapi.mjs 中行首 path: 且值以 / 开头（每条 def 恰有一行；排除 example 数据里的 path 字段）
 *   SQL 按钮权限行 —— init.sql 中的 INSERT INTO `sys_menu` 且 menuType='F'
 */
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..')
const ALLOW_EMPTY = process.argv.includes('--allow-empty')
const extraArg = process.argv.find((arg) => arg.startsWith('--extra-f-rows'))
let extraFRows = 0
if (extraArg) {
  const raw = extraArg.includes('=') ? extraArg.split('=')[1] : process.argv[process.argv.indexOf(extraArg) + 1]
  extraFRows = Number(raw)
  if (!Number.isInteger(extraFRows) || extraFRows < 0) {
    console.error('❌ --extra-f-rows 需要非负整数，如 --extra-f-rows=1')
    process.exit(1)
  }
}

const gitDiff = (pathArgs) => {
  try {
    return execFileSync('git', ['-C', PROJECT_ROOT, 'diff', 'HEAD', '--unified=0', ...pathArgs], { encoding: 'utf8' })
  } catch (error) {
    console.error(`❌ git diff 执行失败：${error.message}`)
    process.exit(1)
  }
}

/**
 * 统计 diff 净行数（新增 − 删除）；正则匹配去掉 +/- 前缀后的行体，skipComments 排除注释行（// 或块注释 * 开头）。
 * 返回 { net, raw }：net 为净行数（可为负，负值属删除侧改动）；raw 为新增+删除原始命中行数，用于区分真空跑与增删相抵。
 */
const countNet = (diff, regex, skipComments = false) => {
  const lines = diff.split('\n')
  const hit = (line) => {
    const body = line.slice(1)
    if (skipComments && /^\s*(\/\/|\*|\/\*)/.test(body)) return false
    return regex.test(body)
  }
  const added = lines.filter((line) => line.startsWith('+') && !line.startsWith('+++') && hit(line)).length
  const removed = lines.filter((line) => line.startsWith('-') && !line.startsWith('---') && hit(line)).length
  return { net: added - removed, raw: added + removed }
}

const SYNC_SCRIPT = '.codebuddy/skills/apipost-doc-sync/scripts/sync-openapi.mjs'

/** 未跟踪新文件不进 git diff HEAD，不先暂存会导致控制器端点数被数成 0 */
const listUntracked = () => {
  try {
    return execFileSync('git', ['-C', PROJECT_ROOT, 'ls-files', '--others', '--exclude-standard', '--', 'server/src/modules', SYNC_SCRIPT, 'init.sql'], { encoding: 'utf8' })
      .split('\n')
      .filter(Boolean)
  } catch {
    return []
  }
}
const relevantUntracked = listUntracked().filter(
  (file) => file === SYNC_SCRIPT || file === 'init.sql' || file.endsWith('.controller.ts'),
)
if (relevantUntracked.length) {
  console.warn('⚠️ 以下新增文件尚未 git add，不会计入 git diff HEAD 对账，请先暂存再运行：')
  for (const file of relevantUntracked) console.warn(`   ${file}`)
}

const controllerDiff = gitDiff(['--', 'server/src/modules'])
const controller = countNet(controllerDiff, /@(Get|Post|Put|Delete|All)\s*\(/, true)
const write = countNet(controllerDiff, /@(Post|Put|Delete|All)\s*\(/, true)
const read = countNet(controllerDiff, /@Get\s*\(/, true)
const defs = countNet(gitDiff(['--', SYNC_SCRIPT]), /^\s*path:\s*'\//)
const sql = countNet(gitDiff(['--', 'init.sql']), /^INSERT INTO `sys_menu`.*'F'/)
const controllerCount = controller.net
const writeCount = write.net
const readCount = read.net
const defsCount = defs.net
const sqlCount = sql.net
const rawTouched = controller.raw + defs.raw + sql.raw
const expectedSqlCount = writeCount + (readCount > 0 ? 1 : 0) + extraFRows

if (controllerCount === 0 && defsCount === 0 && sqlCount === 0) {
  if (ALLOW_EMPTY) {
    console.log('净三数全 0，--allow-empty 显式豁免，按通过处理。')
    process.exit(0)
  }
  if (rawTouched > 0) {
    console.error('❌ 存在增删相抵的改动，净变化为 0（如同批次新增又删除了端点），净额口径下无对账对象。')
  } else {
    console.error('❌ 未检测到改动（控制器/DEFS/init.sql 相对 HEAD 均无净变化），对账无对象。')
    console.error('   可能原因：改动已 commit、文件尚未保存，或本次未生成任何端点。')
  }
  console.error('   空跑确属预期时，加 --allow-empty 显式豁免。')
  process.exit(1)
}

console.log(`控制器端点净增数（新增 − 删除）：${controllerCount}（写 ${writeCount} / 读 ${readCount}）`)
console.log(`DEFS 净增条数：${defsCount}`)
console.log(`init.sql 按钮权限行净增数：${sqlCount}（预期 = 写端点 ${writeCount} + 查询码 1${extraFRows ? ` + 额外权限码 ${extraFRows}` : ''} = ${expectedSqlCount}）`)

const mismatch = controllerCount !== defsCount || sqlCount !== expectedSqlCount
if (mismatch) {
  console.error('❌ 对账不一致（净额口径，负值属删除侧改动），明细：')
  if (controllerCount !== defsCount) {
    console.error(`   控制器端点净增(${controllerCount}) ≠ DEFS 净增条数(${defsCount})：DEFS 漏补/多录，或控制器与 DEFS 的增删不对称；漏录端点跑 node .codebuddy/skills/apipost-doc-sync/scripts/sync-openapi.mjs 查看差集清单`)
  }
  if (sqlCount !== expectedSqlCount) {
    console.error(`   init.sql 按钮权限行净增(${sqlCount}) ≠ 预期(${expectedSqlCount})：写端点各一条按钮行（净 ${writeCount} 个），GET 端点共用 :query 码只出一条（净 ${readCount} 个）；若有独立权限码的 GET 端点（如 GET 形态导出），用 --extra-f-rows=N 纳入预期`)
  }
  process.exit(1)
}
console.log('✅ 对账一致（净额口径）：DEFS 与控制器端点净增一对一，按钮权限行与权限码拆分口径吻合。')
if (controllerCount < 0 || defsCount < 0 || sqlCount < 0) {
  console.log('ℹ️ 本次含删除侧改动（净值为负），删除方向的对账同样成立。')
}
