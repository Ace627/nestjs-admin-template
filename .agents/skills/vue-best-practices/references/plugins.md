---
title: Vue Plugin Best Practices
display_title: 插件组织
impact: MEDIUM
impactDescription: Incorrect plugin structure or injection key strategy causes install failures collisions and unsafe APIs
type: best-practice
tags: [vue3, plugins, provide-inject, typescript, dependency-injection]
---

# 插件组织

**影响：中** — 插件遵循 `app.use()` 契约，暴露明确能力，`provide/inject` 用不会冲突的 key。

> **本项目口径**：插件放 `src/plugins/modules/`，由 `src/plugins/index.ts` 的 `setupPlugins(app)` 统一装配。新增能力不要再开一套装配入口。

## 当前结构

```text
src/plugins/
├── index.ts              # setupPlugins(app)：统一装配
└── modules/
    └── global-component.ts  # registerGlobalComponent(app)：注册全局组件
```

```ts
// src/plugins/index.ts
import type { App } from 'vue'

import { registerGlobalComponent } from './modules/global-component'

export function setupPlugins(app: App) {
  /** 批量注册全局组件 */
  app.use(registerGlobalComponent)
}
```

注意：`registerGlobalComponent` 的签名是 `(app) => void`，正好符合函数式插件契约，所以能直接 `app.use()`。

---

## 一、插件必须是这两种形式之一

- 带 `install(app, options?)` 的对象
- 签名相同的函数

```ts
// 错误：普通对象不是插件
const notAPlugin = {
  doSomething() {},
}

app.use(notAPlugin)
```

```ts
// 正确：对象式
import type { App, InjectionKey } from 'vue'

interface PluginOptions {
  prefix?: string
  debug?: boolean
}

interface PluginContext {
  prefix: string
}

const pluginContextKey: InjectionKey<PluginContext> = Symbol('myPlugin')

const myPlugin = {
  install(app: App, options: PluginOptions = {}) {
    const { prefix = 'my', debug = false } = options

    if (debug) console.log('安装 myPlugin，前缀：', prefix)

    app.provide(pluginContextKey, { prefix })
  },
}
```

```ts
// 正确：函数式（项目 global-component.ts 用的就是这种）
import type { App } from 'vue'

export function registerGlobalComponent(app: App) {
  app.component('ProTable', ProTable)
}
```

---

## 二、在 `install()` 里显式注册能力

| API | 用途 |
|---|---|
| `app.component()` | 全局组件 |
| `app.directive()` | 全局指令 |
| `app.provide()` | 可注入的服务或配置 |
| `app.config.globalProperties` | 全局属性（少用，优先 provide/inject） |

```ts
// 错误：创建了服务却没交给任何人
const uselessPlugin = {
  install(app, options) {
    const service = createService(options)
  },
}
```

```ts
// 正确
const usefulPlugin = {
  install(app, options) {
    const service = createService(options)
    app.provide(serviceKey, service)
  },
}
```

---

## 三、类型化插件契约

```ts
import type { App, Plugin } from 'vue'

interface MyOptions {
  apiKey: string
}

const myPlugin: Plugin<[MyOptions]> = {
  install(app: App, options: MyOptions) {
    app.provide(apiKeyKey, options.apiKey)
  },
}
```

---

## 四、`provide` 用 Symbol key

字符串 key 会冲突（`'http'`、`'config'`、`'i18n'`），一律用 `InjectionKey<T>`。

```ts
// 错误
export default {
  install(app) {
    app.provide('http', axiosInstance)
    app.provide('config', appConfig)
  },
}
```

```ts
// 正确
import type { InjectionKey } from 'vue'
import type { AxiosInstance } from 'axios'

interface AppConfig {
  baseUrl: string
  timeout: number
}

export const httpKey: InjectionKey<AxiosInstance> = Symbol('http')
export const configKey: InjectionKey<AppConfig> = Symbol('appConfig')

export default {
  install(app) {
    app.provide(httpKey, axiosInstance)
    app.provide(configKey, { baseUrl: '/dev-api', timeout: 30000 })
  },
}
```

---

## 五、给必需注入配一个会报错的辅助函数

```ts
import type { InjectionKey } from 'vue'

interface AuthService {
  hasPermission(code: string): boolean
}

export const authKey: InjectionKey<AuthService> = Symbol('auth')

export function useAuth(): AuthService {
  const auth = inject(authKey)
  if (!auth) throw new Error('未安装 auth 插件，检查是否调用了 app.use(authPlugin)')
  return auth
}
```

把这类辅助函数放进 `src/hooks/`，就能享受自动导入。

---

## 六、什么时候不该写插件

| 需求 | 更合适的做法 |
|---|---|
| 只是若干个页面共用的函数 | `src/utils/` |
| 组件内部的有状态逻辑 | `src/hooks/` |
| 全局共享状态 | Pinia store（`src/store/modules/`） |
| 一次性的初始化动作（如引入样式、设置 router） | 直接在 `setupXxx(app)` 里做 |

只有「必须安装到 app 上才能生效」的能力（全局组件、全局指令、全局 provide）才值得写成插件。
