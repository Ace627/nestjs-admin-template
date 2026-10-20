---
name: cache-usage
description: 本项目（NestJS + Vue3 admin 模板）前端本地缓存的使用与封装规范：禁止裸调 localStorage/sessionStorage，一切持久化经 StorageCache（自动前缀、TTL、JSON 序列化）+ 领域 xxx.cache.ts 两层封装。当用户要求缓存/持久化数据、新增 xxx.cache 封装、token/登录参数/标签页/列显隐等本地存储相关任务，或询问缓存封装方式时使用。
---

# cache-usage：本地缓存使用与封装规范

## 架构（两层封装，位于 `admin/src/utils/cache/`）

1. **通用层 `storage-cache.ts`**：`StorageCache` 类（纯静态方法），localStorage 包装器。
   - 所有 key 自动拼接 `VITE_STORAGE_PREFIX`（`.env` 中为 `app:storage:`），调用方传入的 key **不带前缀**；
   - 值任意 JSON 可序列化类型，内部包一层 `{ value, ttl }`；
   - `set(key, value, ttl = -1)`：ttl 单位**秒**，`-1` 表示永不过期，序列化失败/超配额返回 `false`；
   - `get(key)`：不存在、已过期、JSON 解析失败三种情况统一返回 `null`，并顺手 `removeItem` 清除脏数据；
   - `getWithDefault(key, defaultValue)`：在 get 基础上用默认值兜底，返回类型为 T；
   - `clear()`：只清本前缀的 key，不误删同源其它 localStorage 数据。
2. **领域层 `xxx.cache.ts`**：按业务域拆分文件，导出 `setXxx / getXxx / removeXxx` 纯函数，内部调用 `StorageCache`。现有文件：`token.cache.ts`、`tags-view.cache.ts`、`login-params.cache.ts`、`sidebar-status.cache.ts`、`system-setting.cache.ts`、`column-hidden.cache.ts`。

## 硬性规范（不得偏离）

- **禁止裸调 `localStorage` / `sessionStorage`**。唯一例外：`layout/components/Navbar/UserDropDown.vue` 的「清空缓存重启」（`StorageCache.clear()` + `sessionStorage.clear()` + reload），属清场场景，新增代码不得照抄。
- 使用侧一律从 `@/utils` 桶导入（如 `import { getAccessToken } from '@/utils'`），禁止深路径导入（`import ... from '@/utils/cache/token.cache'`）。
- 新增领域缓存必须：
  1. 在 `admin/src/utils/cache/` 新建 `xxx.cache.ts`（禁止往已有 cache 文件里塞别的领域，禁止直接在业务组件里现调 `StorageCache`）；
  2. 在 `admin/src/utils/index.ts` 的 cache 区块追加 `export * from './cache/xxx.cache'`（`storage-cache` 在前、各领域文件按现有顺序排列）。
- 不做兼容性代码；注释简单明了；领域缓存之间不互相引用（各自只依赖 `storage-cache` 与 `@/types` 等类型）。

## 执行流程（新增一项持久化）

1. **判断形态**，选模板（完整代码见 `references/patterns.md`，动手前必读）：
   - 简单对象/字符串/数组 → 基础三函数模板（login-params / system-setting 式）；
   - 布尔状态 → 必须加 `isBoolean` 兜底校验（sidebar-status 式，`src/utils/validate` 相对导入）；
   - 按页面/实例多条并存 → key 二级前缀 `'xxx:' + businessKey`（column-hidden 式）；
   - 需要过期失效 → 显式传 ttl 秒数；令牌类凭证**不设 TTL**（token 式：有效期由服务端 Redis 负责，前端只做不透明持久化，登出/401 由调用方 remove）。
2. **写 `xxx.cache.ts`**：相对导入 `StorageCache`；类型定义（type）跟随文件导出；每个函数一行 JSDoc。
3. **注册桶导出**：`admin/src/utils/index.ts` 追加一行。
4. **使用处**：从 `@/utils` 具名导入；读取时用 `??` 或参数默认值兜底，不假设缓存一定存在（用户可能清空缓存）。

## 常见坑

- key 不要自带 `app:storage:` 前缀，`StorageCache` 内部已拼接；二级前缀用 `冒号:` 结尾风格（如 `columnHidden:`）。
- `get` 的返回类型是 `T | null`，直接当 `T` 用会过不了 tsc；有合理默认值就用 `getWithDefault(key, defaultValue)` 或调用处 `??`。
- ttl 是**秒**不是毫秒；不要传 0（立即过期），永不过期用默认值 -1 而非省略后另传参数。
- 往缓存里写响应式对象/路由对象前先转纯数据（tags-view 用删除属性的方式处理 `matched`、`redirectedFrom`），否则 JSON.stringify 可能崩。
- 登出、401 清场必须调 `removeTokenPair()`（`store/modules/user.ts`），不要只清单一 token。
- 存含循环引用风险的对象（如路由对象）前，先删除不可序列化属性再 set，参考 `tags-view.cache.ts` 的 `setVisitedViews`（删除 `matched`、`redirectedFrom` 后再存）。
