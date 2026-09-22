/**
 * 批量清理 SVG 冗余属性（fill/class/version/t/p-id/width/height 等）
 * 用法：node scripts/clean-svg-icons.mjs [目录1 目录2 ...]
 * 不传目录时默认清理 admin/src/assets/svg-icons；相对路径基于项目根目录解析
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFile, writeFile, readdir } from 'node:fs/promises'

const projectDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
// 项目内默认 SVG 图标目录
const DEFAULT_ICON_DIRS = ['admin/src/assets/svg-icons']
// 要移除的 SVG 冗余属性
const REMOVE_ATTRS = ['fill', 'class', 'version', 't', 'p-id', 'width', 'height']

// 生成精准匹配 SVG 属性的正则
const REMOVE_REGEX = new RegExp(`\\s+(${REMOVE_ATTRS.join('|')})=(["'])[^"']*?\\2`, 'gi')

/**
 * 清理单个 SVG 文件（无冗余属性则跳过）
 */
async function cleanSvgFile(filePath) {
  try {
    // 1. 读取文件内容
    const originalContent = await readFile(filePath, 'utf8')
    let content = originalContent
    // 2. 移除指定冗余属性
    content = content.replace(REMOVE_REGEX, '')
    // 3. 清理标签内多余空白
    content = content.replace(/\s+/g, ' ').replace(/ >/g, '>').trim()
    // 4. 内容无变化 → 直接跳过，不写入文件
    if (content === originalContent) return
    // 5. 有修改才覆盖写入原文件
    await writeFile(filePath, content, 'utf8')
    // 6. 打印清理结果
    console.log(`✅ 已清理：${filePath}`)
  } catch (error) {
    console.error(`❌ 处理失败：${filePath}`, error instanceof Error ? error.message : error)
  }
}

/**
 * 递归遍历单个目录，处理所有 SVG
 */
async function processDirectory(dir) {
  try {
    console.log(`📂 处理目录：${dir}`)
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.resolve(dir, entry.name)
      // 递归处理子文件夹
      if (entry.isDirectory()) {
        await processDirectory(fullPath)
      }
      // 处理 SVG 文件
      else if (entry.isFile() && entry.name.endsWith('.svg')) {
        await cleanSvgFile(fullPath)
      }
    }
  } catch (error) {
    console.error(`❌ 目录处理失败：${dir}`, error instanceof Error ? error.message : error)
  }
}

/**
 * 启动：解析目录参数（命令行传入优先，否则用默认目录），遍历处理
 */
async function bootstrap() {
  const iconDirs = (process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_ICON_DIRS).map((dir) =>
    path.resolve(projectDir, dir),
  )
  console.log('🚀 开始批量清理 SVG 属性（多目录模式）...\n')

  // 遍历每一个图标目录
  for (const dir of iconDirs) await processDirectory(dir)

  console.log('\n🎉 所有目录的 SVG 清理完成！')
}

bootstrap()
