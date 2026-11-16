---
title: API Module Structure, Naming and Type Contracts
display_title: 接口模块与类型契约
impact: HIGH
impactDescription: Inconsistent module shape naming and type contracts make interfaces undiscoverable and break pagination typing
type: best-practice
tags: [api, module, typescript, pagination, naming, contract]
---

# 接口模块与类型契约

**影响：高** — 接口层是前后端的唯一契约面。模块形状、命名、类型三者不统一，调用方就要靠猜，出错后也难以定位。

## 一、目录与文件命名

```text
src/api/
├── common/
│   └── upload.request.ts          # 跨模块能力
├── monitor/
│   ├── operlog.request.ts
│   ├── loginlog.request.ts
│   └── job-log.request.ts
├── system/
│   ├── user.request.ts
│   ├── role.request.ts
│   └── dict.request.ts
├── auth.request.ts                # 认证：不加模块子目录
└── dashboard.request.ts           # 首页：不加模块子目录
```

- 文件名固定 `<实体>.request.ts`，实体名用 kebab-case（`job-log.request.ts`）
- 目录与后端模块对齐（`system` / `monitor` / `common`）
- 属于认证、首页这类全局能力的，放 `src/api/` 根目录

## 二、类 + 静态方法

```ts
import { request } from '@/utils/request'
import type { User } from '@/types'

export class UserRequest {
  /** 新建用户 */
  static create(data: User.UserForm): Promise<string> {
    return request.post('/system/user/create', data)
  }
}
```

- 一律 `export class XxxRequest` + `static` 方法
- 存量 `auth.request.ts`、`common/upload.request.ts` 用的是 `export abstract class`，属于历史写法；**新文件统一用 `export class`**，不要再扩散 `abstract`
- 类名 = 实体名 + `Request`，与文件名对应
- 方法内只有一行 `return request.xxx(...)`，不放业务逻辑；需要编排多个接口时，编排放页面或 hook

## 三、方法名族

| 语义 | 命名 | 示例 |
|---|---|---|
| 新增 | `create` | `create(data)` |
| 编辑 | `update` | `update(data)` |
| 删除 | `delete` | `delete({ ids })` |
| 分页列表 | `findList` | `findList(params)` |
| 全量列表 | `findAll` | 仅在后端确有全量接口时用 |
| 详情 | `findDetail` | `findDetail({ id })` |
| 当前用户相关 | `getXxx` | `getProfile`、`getInfo`、`getCaptcha` |
| 特殊动作 | 动词 + 名词 | `resetPassword`、`updatePassword`、`clearCache`、`export` |

一个文件对应多个实体时，用实体名做后缀并在注释里分区（`dict.request.ts` 的 `createType` / `createData`）。

## 四、URL 与参数位置

- 相对路径，全小写单段式：`/system/user/resetPassword`、`/monitor/log/operlog/export`
- 不做驼峰转 kebab（后端路由就是驼峰，照抄）
- 查询条件走 `params`，请求体走第二个参数，两者都要时 `request.post(url, data, { params })`

```ts
// 带 query 的 POST：第二个参数给空对象，query 放 config
static export(params: Operlog.QueryParams) {
  return request.post('/monitor/log/operlog/export', {}, { params, responseType: 'blob' })
}
```

批量删除固定形态：

```ts
/** 批量删除用户（ids 为逗号拼接字符串，后端 ParseArrayPipe 接收） */
static delete(params: { ids: string }): Promise<string> {
  return request.delete('/system/user/delete', { params })
}
```

调用方负责拼接：`UserRequest.delete({ ids: selectedIds.join(',') })`。

## 五、类型契约

### 5.1 声明位置

```ts
// src/types/api/system/user.ts
export interface SysUser extends BaseEntity {
  id: string
  username: string
  nickname?: string
  status?: string
}

export interface UserForm {
  id?: string
  username: string
  password?: string
  roleIds?: string[]
}

export interface UserQuery {
  pageNo: number
  pageSize: number
  username?: string
}
```

### 5.2 注册命名空间

```1:8:apps/admin/src/types/index.ts
// 此处统一暴露接口请求的命名空间类型
export * as Auth from './api/auth'
export * as Upload from './api/common/upload'
export * as Dashboard from './api/dashboard'
export * as User from './api/system/user'
export * as Dict from './api/system/dict'
export * as Role from './api/system/role'
export * as Menu from './api/system/menu'
```

新增业务域必须在这里加一行，否则调用方没法用 `Xxx.SomeType` 的形式引用。

### 5.3 使用方式

```ts
import type { User } from '@/types'

function handleSubmit(form: User.UserForm) {}
```

- **只 import 业务域命名空间**，不 import 具体类型（`import type { SysUser } from '@/types/api/system/user'` 是错的）
- `@/types` **不参与自动导入**，必须显式 import

### 5.4 三件套约定

| 类型 | 用途 | 命名 |
|---|---|---|
| 实体 | 详情、列表项 | `SysUser`、`File.Item`、`Dict.TypeItem` |
| 表单 | 新增/编辑提交 | `UserForm`、`Dict.TypeForm` |
| 查询 | 分页与筛选条件 | `UserQuery`、`Dict.TypeQuery`、`Loginlog.QueryParams` |

命名在项目里并不完全统一（`SysUser` / `Item` / `TypeItem`，`UserQuery` / `QueryParams`），**新增时跟随所在文件已有风格**，不要在同一文件里混用两套。

## 六、分页

```ts
/** 查询用户分页列表 */
static findList(params: User.UserQuery): PaginationResult<User.SysUser> {
  return request.get('/system/user/list', { params })
}
```

- 请求字段：`pageNo` / `pageSize`（全局类型 `PaginationParams`）
- 响应字段：`total` / `records`
- 返回类型 `PaginationResult<T>` **已包含 Promise**，签名不要再包 `Promise<>`
- `PaginationResult`、`PaginationParams`、`ApiResponse`、`BaseEntity` 是 `.d.ts` 里的全局类型，**不需要 import**

## 七、注释规范

注释要写"后端怎么处理"，这是项目现有的统一风格，也是新人最容易踩的坑：

```ts
/** 编辑用户（username/password 由后端 @Exclude 拦截，不会生效） */
/** 批量删除用户（ids 为逗号拼接字符串，后端 ParseArrayPipe 接收） */
/** 编辑字典类型（dictType 可改，后端事务内级联同步字典数据与缓存） */
/** 重置密码（按用户名定位，重置成功后强制该用户重新登录） */
/** 复制文本（allowWhitespace 控制是否允许复制空白内容） */
/** 刷新令牌（该请求自身的 401 不再触发刷新，直接清场） */
```

必须写清的四类信息：级联影响、被后端忽略的字段、是否强制重登、缓存失效范围。

## 八、完整示例

```ts
import { request } from '@/utils/request'
import type { Loginlog, User } from '@/types'

export class UserRequest {
  /** 新建用户 */
  static create(data: User.UserForm): Promise<string> {
    return request.post('/system/user/create', data)
  }

  /** 批量删除用户（ids 为逗号拼接字符串，后端 ParseArrayPipe 接收） */
  static delete(params: { ids: string }): Promise<string> {
    return request.delete('/system/user/delete', { params })
  }

  /** 编辑用户（username/password 由后端 @Exclude 拦截，不会生效） */
  static update(data: User.UserForm): Promise<string> {
    return request.put('/system/user/update', data)
  }

  /** 查询用户分页列表 */
  static findList(params: User.UserQuery): PaginationResult<User.SysUser> {
    return request.get('/system/user/list', { params })
  }

  /** 根据 id 查找用户详情（含关联角色，用于回填 roleIds） */
  static findDetail(params: { id: string }): Promise<User.SysUser> {
    return request.get('/system/user/detail', { params })
  }

  /** 重置密码（按用户名定位，重置成功后强制该用户重新登录） */
  static resetPassword(data: { username: string; password: string }): Promise<string> {
    return request.put('/system/user/resetPassword', data)
  }
}
```

## 九、反例

```ts
// 错误：函数式导出，与项目约定不一致
export const getUserList = (params) => request.get('/system/user/list', { params })

// 错误：默认导出对象
export default {
  getUserList: (params) => request.get('/system/user/list', { params }),
}

// 错误：分页签名双重 Promise
static findList(params): Promise<PaginationResult<User.SysUser>> {}

// 错误：把解包后的数据当原始响应
static findList(params) {
  return request.get('/system/user/list', { params }).then((res) => res.data.data)
}

// 错误：ids 传数组
static delete(params: { ids: string[] }) {
  return request.delete('/system/user/delete', { params })
}

// 错误：在不该有逻辑的地方写业务
static createUser(data) {
  if (!data.username) TipModal.msgError('用户名必填') // 校验放表单，不下沉到接口层
  return request.post('/system/user/create', data)
}
```

## 十、速查表

| 维度 | 约定 |
|---|---|
| 文件 | `src/api/<模块>/<实体>.request.ts` |
| 导出 | `export class XxxRequest` + `static` |
| 路径 | 相对路径、全小写单段、与后端路由一致 |
| 参数 | query → `params`；body → 第二参数 |
| 删除 | `{ ids: '1,2,3' }` 字符串 |
| 普通返回 | `Promise<T>` |
| 分页返回 | `PaginationResult<T>` |
| blob 返回 | 不标类型，调用处用 `response.data` |
| 分页字段 | `pageNo` / `pageSize` → `total` / `records` |
| 类型 | `@/types` + `export * as Xxx` 命名空间 |
| 全局类型 | `PaginationResult` 等无需 import |
| 注释 | 必写后端级联、忽略字段、强制重登、缓存影响 |
