---
title: Request Layer, Interceptors and Return Value Semantics
display_title: 请求封装与拦截器
impact: HIGH
impactDescription: Misunderstanding interceptor order or return value unwrapping leads to duplicated error toasts double-unwrapped data and broken 401 recovery
type: best-practice
tags: [axios, interceptor, response, error-handling, 401, request]
---

# 请求封装与拦截器

**影响：高** — 拦截器已经替你做了鉴权、解包、错误提示、令牌刷新。接口层和页面层再插手一遍，就会出现重复提示、拿不到数据、401 死循环。

## 一、拦截器链与顺序

`src/utils/request/index.ts` 的装配顺序：

```4:24:apps/admin/src/utils/request/index.ts
import { requestProgressInterceptor } from './interceptor/request-progress'
import { responseTransformInterceptor } from './interceptor/response-transform'
import { tokenRefreshInterceptor } from './interceptor/token-refresh'
import { responseErrorInterceptor } from './interceptor/response-error'

// NProgress 进度条拦截器
requestProgressInterceptor(instance)
// JWT 认证拦截器
jwtAuthInterceptor(instance)
// 响应转换拦截器
responseTransformInterceptor(instance)
// 令牌刷新拦截器（须在响应错误拦截器之前，401 清场提示才不会被重复弹出）
tokenRefreshInterceptor(instance)
// 响应错误拦截器
responseErrorInterceptor(instance)
```

顺序有意义，**不要调整**：

| 拦截器 | 位置 | 职责 |
|---|---|---|
| `requestProgressInterceptor` | 请求 + 响应 | 顶部进度条，受 `VITE_REQUEST_NPROGRESS` 控制 |
| `jwtAuthInterceptor` | 请求 | 自动加 `Authorization: Bearer <accessToken>` |
| `responseTransformInterceptor` | 响应成功 | 业务码校验 + 返回值解包 |
| `tokenRefreshInterceptor` | 响应失败 | 401 无感刷新令牌并重放 |
| `responseErrorInterceptor` | 响应失败 | 统一 `TipModal.msgError` 弹提示 |

`tokenRefresh` 必须排在 `responseError` 之前：401 清场时提示由前者弹，后者不再重复弹。

## 二、返回值语义

`responseTransformInterceptor` 的行为决定了调用方拿到什么：

| 场景 | 返回 |
|---|---|
| 普通 JSON，`code === 200` | `response.data.data`（已解包） |
| 普通 JSON，`code !== 200` | `Promise.reject({ response: { status: code, data: { message } } })` |
| `responseType` 为 `blob` / `arraybuffer` | **完整 `AxiosResponse`**（不解包） |
| `responseType === 'stream'` | `response.data` |
| 二进制里其实是 JSON 错误体 | 已解析出 `code` / `message` 并走 reject |

所以：

```ts
// 普通接口：拿到的就是业务数据
const user = await UserRequest.findDetail({ id })
// user 的类型就是 User.SysUser，不是 { code, message, data }

// blob 接口：拿到的是 AxiosResponse
const response = await OperlogRequest.export(queryParams)
// response.data 是 Blob
// response.headers['content-disposition'] 里有文件名
```
**不要**在接口方法或页面里再取 `.data.data`，那是axios 原始响应的形状，已经被吃掉了一层。

## 三、错误提示归拦截器

```32:36:apps/admin/src/utils/request/interceptor/response-error.ts
    // 提取错误信息（优先级：后端返回 > 本地映射）
    message = ErrorMessageMap[status.toString()] || message
    if (error?.response?.data?.message) message = error.response.data.message

    // 统一提示错误信息
    TipModal.msgError(message, { duration: 1.5 * 1000 })
```

规则：

- **页面 `catch` 里不要再 `TipModal.msgError`**，用户会看到两条一样的报错
- 错误信息优先级是「后端返回 > 本地状态码映射」，后端想改文案改后端即可
- 常见状态码映射（400/401/403/404/405/408/415/422/500/502/503/504）已在 `ErrorMessageMap` 里，不要重复定义

### 页面侧 catch 的正确用途

只用来复位 UI 状态：

```ts
const loading = ref(false)

async function handleExport() {
  loading.value = true
  try {
    const response = await OperlogRequest.export(queryParams.value)
    // 项目无 parseFileName 工具函数，文件名从响应头内联解析
    const filenameMatch = response.headers['content-disposition'].match(/filename\*=UTF-8''(.*)/i)
    linkDownload(response.data, decodeURIComponent(filenameMatch[1]))
  } catch (error: unknown) {
    // 提示已由拦截器弹出，这里只记录与复位
    console.error('export failed:', error)
  } finally {
    loading.value = false
  }
}
```

反例：

```ts
// 错误一：重复弹提示
catch (error) {
  TipModal.msgError('导出失败')
}

// 错误二：静默吞掉，调用方以为成功
catch {
  return
}

// 错误三：只复位了成功分支，失败时 loading 永远转圈
const data = await UserRequest.findList(queryParams.value)
loading.value = false
```

## 四、401 与令牌刷新

`tokenRefreshInterceptor` 已经处理完整链路，页面完全不参与：

- 并发多个 401 → **共享同一次刷新请求**，只发一次
- 刷新成功后用 `_isRetry` 标记重放原请求，重放走完整请求拦截器，`jwtAuth` 会实时读取新 token
- 刷新接口自身 401、无 refreshToken、刷新失败、重放仍 401 → 清场：提示 + 清双 token + `window.location.reload()`
- 清场只执行一次（`isHandlingUnauthorized`），并发场景不会弹多次

因此：

- 接口层**不要**写"401 就跳登录页"的逻辑
- 页面**不要**判断 `error.response.status === 401`
- 不要自己调 `AuthRequest.refreshToken`，那是拦截器的职责

## 五、baseURL 与路径

```8:13:apps/admin/src/utils/request/index.ts
const instance = axios.create({
  // baseURL 将自动加在 url 前面，除非 url 是一个绝对 URL
  baseURL: import.meta.env.VITE_BASE_API,
  // timeout 指定请求超时的毫秒数(0 表示无超时时间)，如果请求花费了超过 timeout 的时间，请求将被中断
  timeout: parseInt(import.meta.env.VITE_REQUEST_TIMEOUT || '0') * 1000,
})
```

- 接口里写 `/system/user/list` 这种相对路径，**不要**拼 `VITE_BASE_API`
- 需要把后端返回的相对文件路径变成可访问 URL 时，用 `resolveFileUrl(path)`（`src/utils/file.ts`），它内部会拼 `VITE_BASE_API`
- 超时单位是秒（配置值 × 1000）

## 六、什么时候才需要动拦截器

按需求命中以下情形才改 `src/utils/request/interceptor/`，其余情况不要碰：

| 需求 | 改哪里 |
|---|---|
| 新增全局请求头 | `jwt-auth.ts` 或新建拦截器并在 `index.ts` 装配 |
| 新增状态码文案 | `response-error.ts` 的 `ErrorMessageMap` |
| 换令牌刷新策略 | `token-refresh.ts` |
| 进度条开关/样式 | `request-progress.ts` |

改动拦截器属于全局影响，改完必须检查：登录、退出、刷新令牌、导出下载、文件上传五条链路。

## 七、常见错误对照

| 错误写法 | 后果 |
|---|---|
| 页面 `catch` 里再弹一次错误 | 双份提示 |
| 接口方法返回值写 `Promise<ApiResponse<T>>` | 调用方按 `.data` 取值，实际已是业务数据，取到 `undefined` |
| 分页接口写 `Promise<PaginationResult<T>>` | 双重 Promise，`await` 后 `records` 为 `undefined` |
| blob 接口按普通接口标 `Promise<T>` | 调用处 `response.data` 报类型错，或误当业务数据 |
| 自己处理 401 跳转 | 与刷新拦截器冲突，出现"刷新成功但还是被踢下线" |
| 在页面里裸调 `request.get` | 绕过接口层约定，路径与类型失去统一管理 |
| `catch` 后 `return` 空值 | 上层把失败当成功，`records` 变 `undefined` |
