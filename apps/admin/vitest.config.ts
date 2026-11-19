import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

/**
 * 单元测试配置
 * @description 不继承 vite.config.ts：避免为纯逻辑测试加载 UnoCSS、Element Plus 按需导入、svg 精灵等构建期插件
 */
export default defineConfig({
  resolve: {
    alias: {
      /** 与 vite.config.ts 中的别名保持一致 */
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  test: {
    /** 测试文件统一放在 test 目录，按 src 的目录结构镜像组织 */
    include: ['test/**/*.spec.ts'],
    /** 当前测试目标为纯逻辑函数，无需浏览器环境 */
    environment: 'node',
  },
})
