# cache-usage：封装模板与真实范例

以下模板与范例均取自 `admin/src/utils/cache/` 现有定稿代码。新增领域缓存时按最近似形态套用，保持风格一致。

## 1. 基础三函数模板（简单对象/字符串）

范例：`login-params.cache.ts`

```ts
import type { Auth } from '@/types'
import { StorageCache } from './storage-cache'

/** 记住密码时缓存的登录参数 */
export type CachedLoginParams = Pick<Auth.LoginParams, 'username' | 'password'> & { rememberMe: boolean }

/** 缓存登录参数 */
export function setLoginParams(value: CachedLoginParams): void {
  StorageCache.set('loginParams', value)
}

/** 读取登录参数 */
export function getLoginParams(): Partial<CachedLoginParams> {
  return StorageCache.get('loginParams') ?? {}
}

/** 清除登录参数 */
export function removeLoginParams(): void {
  StorageCache.remove('loginParams')
}
```

同形态：`system-setting.cache.ts`（get 返回 `T | null`，不兜默认值的写法）。

## 2. 布尔状态模板（带类型兜底校验）

范例：`sidebar-status.cache.ts`。布尔值读取必须经 `isBoolean` 校验，防止缓存数据被篡改成非布尔：

```ts
import { isBoolean } from '../validate'
import { StorageCache } from './storage-cache'

/** 设置侧边栏状态 */
export function setSidebarStatus(value: boolean): void {
  StorageCache.set('sidebarStatus', value)
}

/** 获取侧边栏状态 */
export function getSidebarStatus(defaultValue = false): boolean {
  const value = StorageCache.get<boolean>('sidebarStatus')
  return isBoolean(value) ? value : defaultValue
}

/** 移除侧边栏状态 */
export function removeSidebarStatus(): void {
  StorageCache.remove('sidebarStatus')
}
```

## 3. 二级前缀模板（按页面/实例多条并存）

范例：`column-hidden.cache.ts`。一个业务域下多条记录时，统一一个领域前缀常量：

```ts
import { StorageCache } from './storage-cache'

const CACHE_KEY_PREFIX = 'columnHidden:'

/** 写入列显隐记忆（隐藏列 key 数组，storageKey 为页面标识） */
export function setColumnHidden(storageKey: string, hiddenColumnKeys: string[]): void {
  StorageCache.set(CACHE_KEY_PREFIX + storageKey, hiddenColumnKeys)
}

/** 读取列显隐记忆，不存在时返回 null */
export function getColumnHidden(storageKey: string): string[] | null {
  return StorageCache.get<string[]>(CACHE_KEY_PREFIX + storageKey)
}

/** 移除列显隐记忆 */
export function removeColumnHidden(storageKey: string): void {
  StorageCache.remove(CACHE_KEY_PREFIX + storageKey)
}
```

## 4. 令牌模板（无 TTL、不透明持久化）

范例：`token.cache.ts`。令牌有效期由服务端 Redis 负责，前端不设 TTL；文件头用注释块写清「约定」：

```ts
/**
 * Token 持久化层（基于 StorageCache 的领域封装）
 *
 * 约定：
 * - token 的过期与有效性由服务端 Redis 负责，前端仅做「不透明持久化」，存字符串、请求时带出。
 * - 此处不设置客户端 TTL，token 在 localStorage 中一直保留，直到被主动清掉。
 * - 清场（登出 / 收到 401）由调用方负责，调用 removeAccessToken / removeRefreshToken。
 * - 存储 key 统一走 StorageCache 的 `app:storage:` 前缀，不会污染同源下的其它 localStorage 数据。
 */

import { StorageCache } from './storage-cache'

/** 写入 accessToken（短时凭证，每次请求通过 Authorization 头携带） */
export function setAccessToken(token: string): boolean {
  return StorageCache.set('accessToken', token)
}

/** 读取 accessToken；未存储时返回 null */
export function getAccessToken(): string | null {
  return StorageCache.get<string>('accessToken')
}

/** 写入令牌对（登录 / 刷新令牌成功后调用） */
export function setTokenPair(data: { accessToken: string; refreshToken: string }): void {
  setAccessToken(data.accessToken)
  setRefreshToken(data.refreshToken)
}

/** 清除令牌对（登出 / 收到 401 清场时调用） */
export function removeTokenPair(): void {
  removeAccessToken()
  removeRefreshToken()
}
```

（成对字段提供 `setXxxPair / removeXxxPair` 组合函数，清场方一次调用清干净。）

## 5. 桶导出注册（`admin/src/utils/index.ts`）

cache 区块固定顺序：`storage-cache` 在最前，其后按现有领域文件顺序追加：

```ts
export * from './cache/storage-cache'

export * from './cache/token.cache'
export * from './cache/tags-view.cache'
export * from './cache/login-params.cache'
export * from './cache/sidebar-status.cache'
export * from './cache/system-setting.cache'
export * from './cache/column-hidden.cache'
// 新增：export * from './cache/xxx.cache'
```

## 6. 使用方式（业务侧）

一律从 `@/utils` 具名导入；读取处必须兜底：

```ts
// store/modules/user.ts
import { removeTokenPair, resolveFileUrl, setTokenPair } from '@/utils'

// core/login.vue
import { getLoginParams, removeLoginParams, setLoginParams, isString } from '@/utils'

// 组件内读取带默认值
const sidebarStatus = getSidebarStatus() // 参数默认值兜底
const views = getVisitedViews() ?? []    // 或 ?? 兜底
```

## 7. StorageCache API 速查（`storage-cache.ts`）

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `set` | `set<T>(key, value, ttl = -1): boolean` | ttl 秒；-1 永不过期；失败返回 false |
| `get` | `get<T>(key): T \| null` | 不存在/过期/解析失败返回 null 并清脏数据 |
| `getWithDefault` | `getWithDefault<T>(key, defaultValue): T` | 同上，但用 defaultValue 兜底 |
| `remove` | `remove(key): void` | 删除指定键 |
| `clear` | `clear(): void` | 只清本前缀 key；仅用于「清空缓存重启」清场场景 |
