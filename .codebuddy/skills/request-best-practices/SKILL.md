---
name: request-best-practices
display_title: 接口请求规范
description: 接口请求层开发规范（apps/admin）。凡涉及 axios、@/utils/request、src/api 下的接口模块、接口类型定义、文件上传下载导出的任务都应使用。类 + 静态方法、返回值解包、分页类型、错误提示归属等硬性规矩见本文件第一节，优先级高于所有 references。
---

# 接口请求规范

本技能是一份**指令集**，按顺序执行。

- **第一节是硬规则**，优先级高于 `references/` 中任何一条，开工前必须读完。
- **第二节是执行流程**，按步骤走。
- 本技能只管接口层。组件如何消费数据（`ProTable`、`ProPagination` 等）不在范围内。

---

# 第一节 硬规则

## 项目事实

- 请求库：axios，实例封装在 `src/utils/request/index.ts`，导出 `request`
- 基础地址：`import.meta.env.VITE_BASE_API`，超时 `VITE_REQUEST_TIMEOUT`（秒）
- 接口模块：`src/api/**/`，文件名 `<实体>.request.ts`
- 接口类型：`src/types/api/**/`，通过 `src/types/index.ts` 的 `export * as Xxx` 聚合
- 全局类型 `ApiResponse`、`BaseEntity`、`PaginationParams`、`PaginationResult` 定义在 `src/types/api/api.d.ts`，**不需要 import**
- 无 ESLint，类型检查靠 `vue-tsc -b`；`noUnusedLocals`、`noUnusedParameters` 已开启

## 1. 模块写法：类 + 静态方法

```ts
import { request } from '@/utils/request'
import type { User } from '@/types'

export class UserRequest {
  /** 查询用户分页列表 */
  static findList(params: User.UserQuery): PaginationResult<User.SysUser> {
    return request.get('/system/user/list', { params })
  }
}
```

- 一律 `export class XxxRequest` + `static` 方法，**不用** `export function`、`export const xxx = () => {}`
- 类是**纯静态方法容器**，不实例化、不写 constructor；类名与文件名对应（`user.request.ts` → `UserRequest`）
- 无实体语义的工具类用 `export abstract class`（如 `UploadRequest`），阻止 `new`；**不要**把已有的 `abstract` 改回普通 `class`
- 按业务域分文件：`src/api/system/user.request.ts`、`src/api/monitor/operlog.request.ts`、跨域的放 `src/api/common/`
- 一个文件对应一个后端模块，方法用注释分隔区块（字典类型 / 字典数据这样）

## 2. URL 与参数位置

- 只写**相对路径**，不以 `/api` 或域名开头（`baseURL` 已配置）
- 路径全小写单段式：`/system/user/resetPassword`、`/monitor/log/operlog/export`
- 查询条件走 `params`，请求体走第二个参数：

| 方法 | 写法 |
|---|---|
| GET | `request.get('/system/user/list', { params })` |
| POST 带 body | `request.post('/system/user/create', data)` |
| POST 带 query | `request.post('/monitor/job/log/export', {}, { params, responseType: 'blob' })` |
| PUT | `request.put('/system/user/update', data)` |
| DELETE 带 query | `request.delete('/system/user/delete', { params })` |

- 上传接口 body 是 `FormData`，直接作为第二个参数；**只有需要外部控制请求**（暂停/取消分片）时才加第三个 `config` 透传 `signal`：

```ts
import type { AxiosRequestConfig } from 'axios'

/** 上传单个分片（config 用于传 AbortController.signal，支持暂停/取消） */
static uploadChunk(data: FormData, config: AxiosRequestConfig = {}): Promise<string> {
  return request.post('/common/upload/chunk', data, config)
}
```

- 上传进度由调用方按「已完成分片数 / 总片数」计算，**不要**在接口层传 `onUploadProgress`

- 批量删除的参数是**逗号拼接的字符串**，不是数组：

```ts
/** 批量删除用户（ids 为逗号拼接字符串，后端 ParseArrayPipe 接收） */
static delete(params: { ids: string }): Promise<string> {
  return request.delete('/system/user/delete', { params })
}
```

## 3. 返回值已经解包，签名必须按实际值写

`responseTransformInterceptor` 成功时返回 `response.data.data`，所以：

| 接口类型 | 签名 | 调用处拿到的 |
|---|---|---|
| 普通数据 | `Promise<T>` | 直接是 `T` |
| 分页 | `PaginationResult<T>` | `{ total, records }` |
| 无返回内容 | `Promise<string>` | 后端返回的提示字符串 |
| `responseType: 'blob'` | **不标返回类型** | 完整 `AxiosResponse`，数据在 `response.data` |

**`PaginationResult<T>` 本身已经是 `Promise<{ total, records }>`，不能再包一层 `Promise<>`。**

```ts
// 错误：双重 Promise，await 之后仍是 Promise，records 是 undefined
static findList(params: User.UserQuery): Promise<PaginationResult<User.SysUser>> {}

// 错误：调用方会以为要取 .data.data
static findList(params: User.UserQuery): Promise<ApiResponse<User.SysUser[]>> {}

// 正确
static findList(params: User.UserQuery): PaginationResult<User.SysUser> {
  return request.get('/system/user/list', { params })
}
```

blob 接口沿用现状**不标返回类型**（标了反而与拦截器的透传行为不符）：

```ts
/** 导出操作日志（按查询条件全量导出） */
static export(params: Operlog.QueryParams) {
  return request.post('/monitor/log/operlog/export', {}, { params, responseType: 'blob' })
}
```

页面侧消费固定两步：`response.data`（Blob）→ `linkDownload(response.data, fileName)`（`linkDownload` 来自 `@/utils`，实体是 `src/utils/file.ts`）。文件名只有两种来源：

| 场景 | 文件名 |
|---|---|
| 后端返回（导出、下载） | 解析 `response.headers['content-disposition']` |
| 前端定死（模板下载） | 直接传固定名，如 `'用户导入模板.xlsx'` |

**项目没有 `parseFileName` 之类的工具函数**，现有 4 处页面都是内联这几行，照抄即可，不要臆造 API：

```ts
const filenameMatch = response.headers['content-disposition'].match(/filename\*=UTF-8''(.*)/i)
const filename = decodeURIComponent(filenameMatch[1])
linkDownload(response.data, filename)
```

## 4. 分页约定

- 请求参数继承 `PaginationParams`：字段是 `pageNo` / `pageSize`，**不是 `pageNum` / `limit`**
- 响应取 `total` 与 `records`，**不是 `rows` / `list` / `data.list`**
- 查询类型在 `@/types` 里自己声明，把 `pageNo`、`pageSize` 写在最前面，其余是可选筛选项

```ts
export interface UserQuery {
  pageNo: number
  pageSize: number
  username?: string
  nickname?: string
}
```

## 5. 错误提示归拦截器，页面不要重复弹

`responseErrorInterceptor` 已经统一 `TipModal.msgError(...)`。业务错误、HTTP 错误、超时、网络异常都在那里提示过了。

- 页面里 `catch` **只用于复位状态**（`loading = false`、关弹窗），**不要再弹一次错误**
- 401 由 `tokenRefreshInterceptor` 处理（无感刷新或清场回登录页），页面**完全不处理**
- 不要把错误 `catch` 掉后静默返回，会让调用方误以为成功

## 6. 类型定义放 `@/types`

- 文件：`src/types/api/<模块>/<实体>.ts`，用 `export interface` 声明
- 聚合：在 `src/types/index.ts` 追加 `export * as Xxx from './api/system/xxx'`
- 使用：`import type { User } from '@/types'`，然后 `User.SysUser`
- 命名沿用现有风格：详情/列表项 `Xxx` 或 `XxxItem`，表单 `XxxForm`，查询 `XxxQuery`

```ts
// src/types/api/system/user.ts
export interface SysUser extends BaseEntity {
  id: string
  username: string
  nickname?: string
}
```

## 7. 注释必须说明后端特殊行为

现有接口文件的一致风格是：**注释不只是描述"做什么"，还要写"后端怎么处理"**。这些信息不看代码根本猜不到：

```ts
/** 批量删除用户（ids 为逗号拼接字符串，后端 ParseArrayPipe 接收） */
/** 编辑用户（username/password 由后端 @Exclude 拦截，不会生效） */
/** 编辑字典类型（dictType 可改，后端事务内级联同步字典数据与缓存） */
/** 刷新令牌（该请求自身的 401 不再触发刷新，直接清场） */
```

新增接口时同样要写清楚：后端是否级联、哪些字段被忽略、是否需要强制重登、是否有缓存影响。

## 8. 值不值得单独抽接口方法

| 场景 | 做法 |
|---|---|
| 页面里直接 `request.get(...)` | **禁止**，必须走 `src/api` 的 Request 类 |
| 一次性调试用的请求 | 也不留在业务代码里 |
| 同一接口被两个页面使用 | 必须抽到 Request 类 |
| 纯前端计算、无网络请求 | 不属于本技能范围 |

---

# 第二节 执行流程

## 第一步：先找同类接口，照现有写法抄结构

新增接口前先读 `src/api/` 下同模块的文件，跟随最近邻的写法（方法名族、注释风格、参数形态）。不要重新发明一套。

## 第二步：补类型

在 `src/types/api/<模块>/<实体>.ts` 里加 `interface`，再到 `src/types/index.ts` 注册命名空间（如果该业务域还没有）。

类型来源优先级：后端 DTO > 现有同名字段 > 自行推断。不确定的字段标可选并加注释说明。

## 第三步：写 Request 类方法

按第一节 1~3 条：类 + static、相对路径、正确的返回签名、`params` / `data` 放对位置。

## 第四步：页面调用

```ts
const loading = ref(false)

async function getList() {
  loading.value = true
  try {
    const data = await UserRequest.findList(queryParams.value)
    list.value = data.records
    total.value = data.total
  } finally {
    loading.value = false
  }
}
```

`try/finally` 复位 `loading`，不要 `catch` 后弹错误提示（拦截器已弹）。

## 第五步：自检

1. **类 + static**，没有 `export function` 形式的接口方法
2. **路径是相对路径**，全小写，与后端约定一致
3. **返回签名**：普通接口 `Promise<T>`，分页 `PaginationResult<T>`（无外层 `Promise`），blob 不标
4. **分页字段**是 `pageNo` / `pageSize`，取值是 `records` / `total`
5. **删除**用 `{ ids: '1,2,3' }` 字符串，不是数组
6. **没有重复弹错误提示**，`catch` 只做状态复位
7. **类型放在 `@/types`** 并已注册命名空间
8. **注释写清后端特殊行为**
9. 页面里没有裸 `request.get(...)`
10. `vue-tsc -b` 无新增类型错误
