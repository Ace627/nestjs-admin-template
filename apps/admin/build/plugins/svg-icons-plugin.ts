import { readdirSync, readFileSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import type { Plugin, ResolvedConfig } from 'vite'

const REGISTER_ID = 'virtual:svg-icons-register'
const NAMES_ID = 'virtual:svg-icons-names'
const SVG_DOM_ID = '__svg__icons__dom__'
const ICON_DIRECTORY = fileURLToPath(new URL('../../src/assets/svg-icons', import.meta.url))

interface SvgSprite {
  registerCode: string
  namesCode: string
}

/** 递归收集图标目录下的全部 svg 文件 */
function collectSvgFiles(directory: string): string[] {
  const svgFiles: string[] = []
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name)
    if (entry.isDirectory()) {
      svgFiles.push(...collectSvgFiles(entryPath))
    } else if (extname(entry.name).toLowerCase() === '.svg') {
      svgFiles.push(entryPath)
    }
  }
  return svgFiles
}

/** 生成 symbolId，规则：icon-<文件名>，子目录层级用 - 连接 */
function createSymbolId(filePath: string): string {
  const relativePath = relative(ICON_DIRECTORY, filePath).replace(/\\/g, '/')
  return `icon-${relativePath.replace(/\.svg$/i, '').replace(/\//g, '-')}`
}

/** 把单个 svg 文件转换成可插入 sprite 的 symbol 标签 */
function compileSymbol(filePath: string): string {
  const fileContent = readFileSync(filePath, 'utf-8')
  const viewBox = fileContent.match(/viewBox="([^"]+)"/)?.[1]
  const innerContent = fileContent
    .replace(/<\?xml[\s\S]*?\?>/, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/stroke="[a-zA-Z#0-9]*"/, 'stroke="currentColor"')
    .trim()

  return `<symbol id="${createSymbolId(filePath)}"${viewBox ? ` viewBox="${viewBox}"` : ''}>${innerContent}</symbol>`
}

/** 编译整个图标目录，生成运行时注入代码与图标名列表 */
function compileSvgSprite(): SvgSprite {
  const symbolEntries = collectSvgFiles(ICON_DIRECTORY).map((filePath) => ({
    id: createSymbolId(filePath),
    symbol: compileSymbol(filePath),
  }))
  const spriteContent = symbolEntries.map((entry) => entry.symbol).join('')

  const registerCode = `
if (typeof window !== 'undefined') {
  const spriteContent = ${JSON.stringify(spriteContent)}
  const injectSvgSprite = () => {
    const body = document.body
    let spriteDom = document.getElementById('${SVG_DOM_ID}')
    if (!spriteDom) {
      spriteDom = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      spriteDom.style.position = 'absolute'
      spriteDom.style.width = '0'
      spriteDom.style.height = '0'
      spriteDom.id = '${SVG_DOM_ID}'
      spriteDom.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    }
    spriteDom.innerHTML = spriteContent
    body.insertBefore(spriteDom, body.lastChild)
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectSvgSprite)
  } else {
    injectSvgSprite()
  }
}
export default {}
`

  return {
    registerCode,
    namesCode: `export default ${JSON.stringify(symbolEntries.map((entry) => entry.id))}`,
  }
}

/**
 * 轻量 svg 图标插件：仅在命中虚拟模块时编译一次图标目录。
 * 原 vite-plugin-svg-icons 在 build 模式下对每个模块都重新执行全量 glob 与字符串拼接，会拖慢构建。
 */
export function registerSvgIcons(): Plugin {
  let isBuild = false
  let cachedSprite: SvgSprite | null = null

  const getSprite = (): SvgSprite => {
    if (!isBuild || !cachedSprite) cachedSprite = compileSvgSprite()
    return cachedSprite
  }

  return {
    name: 'vite:svg-icons',
    configResolved(resolvedConfig: ResolvedConfig) {
      isBuild = resolvedConfig.command === 'build'
    },
    resolveId(id) {
      if (id === REGISTER_ID || id === NAMES_ID) return id
    },
    load(id) {
      if (id !== REGISTER_ID && id !== NAMES_ID) return null
      const sprite = getSprite()
      return id === REGISTER_ID ? sprite.registerCode : sprite.namesCode
    },
    configureServer(server) {
      const invalidateSpriteModule = () => {
        cachedSprite = null
        const spriteModule = server.moduleGraph.getModuleById(REGISTER_ID)
        if (spriteModule) server.moduleGraph.invalidateModule(spriteModule)
      }

      server.watcher.add(ICON_DIRECTORY)
      server.watcher.on('all', (_, filePath) => {
        if (filePath.startsWith(ICON_DIRECTORY) && filePath.toLowerCase().endsWith('.svg')) {
          invalidateSpriteModule()
        }
      })
    },
  }
}
