import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

/**
 * 单元测试配置
 * @description 不继承 rspack.config.ts：单测只需要 TS 转译与路径别名，不走打包流程
 */
export default defineConfig({
  resolve: {
    alias: {
      /** 与 tsconfig.json 的 paths 保持一致 */
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    /** 用例与被测代码同目录，与 Nest 默认约定一致 */
    include: ['src/**/*.spec.ts'],
    environment: 'node',
  },
})
