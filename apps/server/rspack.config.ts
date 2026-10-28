import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { defineConfig } from '@rspack/cli'
import nodeExternals from 'webpack-node-externals'

export default defineConfig({
  // 打包出来的代码在 Node 里运行，不是给浏览器用的
  target: 'node',
  // Node 内置模块（fs/path 等）不打包；target 设为 node 时已默认开启，这里写明是为了直观
  // Node 内置模块（fs/path/crypto 等）不打包，交给 Node 运行时；注释掉会报 Reading from "node:fs" is not handled
  externalsPresets: { node: true },
  // node_modules 里的依赖不打包进产物，运行时再由 Node 去加载
  externals: [nodeExternals({ importType: 'module' })],
  resolve: {
    // import 时省略后缀也能找到 .ts 文件（'...' 表示保留默认后缀）
    extensions: ['...', '.ts'],
    tsConfig: {
      // 让打包时读取项目的 tsconfig.json，路径别名（@/xxx 这类）才有效
      configFile: resolve(dirname(fileURLToPath(import.meta.url)), 'tsconfig.json'),
    },
  },
  output: {
    module: true, // 产物用 ESM（import/export）格式
    chunkFormat: 'module', // 分包出来的代码块也用 ESM 格式
    chunkLoading: 'import', // 按需加载代码块时用 import() 实现
    filename: '[name].js', // 输出文件名用 .js 后缀（如 main.js），不用 .mjs
  },
  module: {
    rules: [
      {
        // 所有 .ts 文件用 Rspack 内置的 swc-loader 编译，比 ts-loader 快很多
        test: /\.ts$/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            detectSyntax: 'auto', // 根据运行环境自动决定哪些新语法需要转译成旧写法
            jsc: {
              parser: {
                decorators: true, // 支持 @Module、@Injectable 这类装饰器写法
              },
              transform: {
                legacyDecorator: true, // 用旧版装饰器规范编译，NestJS 只认这一种
                decoratorMetadata: true, // 编译时保留装饰器的元数据，NestJS 依赖注入靠它工作
              },
            },
          },
        },
      },
    ],
  },
})
