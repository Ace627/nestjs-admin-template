---
title: File Upload, Chunked Transfer and Blob Download
display_title: 文件上传与下载
impact: HIGH
impactDescription: Blob responses are not unwrapped by interceptors mishandling them yields corrupt files lost filenames and unreleased object URLs
type: best-practice
tags: [upload, download, blob, chunk, formdata, content-disposition]
---

# 文件上传与下载

**影响：高** — 文件类接口的返回值语义与普通接口不同：`blob` 响应不参与解包，拿到的是完整 `AxiosResponse`。按普通接口写，文件会变成 `undefined` 或乱码。

## 一、先分清三类操作

| 场景 | 接口特征 | 返回值用法 |
|---|---|---|
| 上传 | `FormData` 作为 body | `Promise<string>`，通常是文件路径或提示 |
| 分片上传 | 多次小请求 + 合并 | 链路见第四节 |
| 下载/导出 | `responseType: 'blob'` | `response.data` 是 `Blob`，文件名在 `response.headers` |

## 二、接口层写法（已封装，直接用）

`src/api/common/upload.request.ts` 已提供全部上传能力：

```5:27:apps/admin/src/api/common/upload.request.ts
export abstract class UploadRequest {
  /** 单文件上传（≤10MB） */
  static uploadFile(data: FormData): Promise<string> {
    return request.post('/common/upload/file', data)
  }

  /** 秒传 + 断点续传检查 */
  static checkFile(data: Upload.CheckFileParams): Promise<Upload.CheckFileResponse> {
    return request.post('/common/upload/check', data)
  }

  /** 上传单个分片 */
  static uploadChunk(data: FormData, config: AxiosRequestConfig = {}): Promise<string> {
    return request.post('/common/upload/chunk', data, config)
  }

  /** 合并所有分片 */
  static mergeChunks(data: Upload.MergeChunkParams): Promise<string> {
    return request.post('/common/upload/chunk/merge', data)
  }
```

新增文件类接口时，往对应模块的 Request 类里加，blob 响应**不标返回类型**：

```ts
/** 文件下载（blob 响应，拦截器透传完整 axios response） */
static download(params: { id: string }) {
  return request.get('/system/file/download', { params, responseType: 'blob' })
}
```

## 三、单文件上传

```ts
const formData = new FormData()
formData.append('file', rawFile)

const filePath = await UploadRequest.uploadFile(formData)
```

- 字段名固定 `file`
- 需要指定文件名时给第三个参数：`formData.append('file', blob, 'avatar.png')`
- **不要**手动设置 `Content-Type`，浏览器会自己带 boundary，手写会导致后端解析失败
- 单个文件限制 10MB（接口注释口径），更大的走分片

头像这类"上传后立刻写回业务"的场景：

```ts
const formData = new FormData()
formData.append('file', blob, 'avatar.png')
const avatarPath = await UploadRequest.uploadFile(formData)
await UserRequest.updateProfile({ avatar: avatarPath })
```

## 四、分片上传链路

固定四步，顺序不能换：

```text
计算 Hash → checkFile（秒传/断点检查）→ 并行 uploadChunk → mergeChunks
```

```ts
const fileHash = await computeSha256(file)
const check = await UploadRequest.checkFile({ fileHash })

if (check.isExist) {
  // 秒传：服务端已有该文件，跳过上传
} else if (file.size <= SINGLE_LIMIT) {
  const formData = new FormData()
  formData.append('file', file)
  await UploadRequest.uploadFile(formData)
} else {
  await uploadByChunks(file, fileHash, check.uploadedChunks)
  await UploadRequest.mergeChunks({ fileHash, fileName: file.name })
}
```

分片请求的 `FormData` 字段：

```ts
const formData = new FormData()
formData.append('file', file.slice(start, end))
formData.append('fileHash', fileHash)
formData.append('chunkHash', `${chunkHash}-${index}`)
await UploadRequest.uploadChunk(formData)
```

| 字段 | 含义 |
|---|---|
| `file` | 分片 Blob |
| `fileHash` | 整个文件的 SHA-256，用于定位分片目录 |
| `chunkHash` | `${分片哈希}-${序号}`，`uploadedChunks` 里就是这个名字 |

要点：

- **断点续传**：`check.uploadedChunks` 是已上传的分片文件名，比对 `chunkHash` 跳过，不要重复上传
- **并发**：项目用 3 路并发（`CONCURRENCY = 3`）+ `Promise.race` 协程池，分片大小 5MB（`CHUNK_SIZE`）
- **可中断**：`uploadChunk(formData, { signal })` 的第二个参数就是 `AxiosRequestConfig`，暂停/取消靠 `AbortController`
- **失败清理**：任务彻底失败时调 `UploadRequest.clearChunk({ fileHash })`
- 这些常量的实际值在调用页面里定义（`views/example/upload/index.vue`、`FileUploadDialog.vue`），不要写死到接口层

## 五、下载与导出

### 5.1 一律用 `linkDownload`

```23:34:apps/admin/src/utils/file.ts
/** 一个利用 a 标签下载文件的函数 */
export function linkDownload(fileURL: string | Blob | File, fileName?: string): void {
  let href: string = typeof fileURL === 'string' ? fileURL : URL.createObjectURL(fileURL)
  const a = document.createElement('a')
  a.style.display = 'none'
  a.href = href
  a.download = fileName || Date.now().toString()
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  if (typeof fileURL !== 'string') URL.revokeObjectURL(href)
}
```

它已经处理了 `createObjectURL` + `revokeObjectURL`，**不要自己写 a 标签**，漏掉 `revokeObjectURL` 会持续占用内存。

### 5.2 三种取文件名的方式

**导出类**（文件名由后端 `content-disposition` 给）：

```ts
const response = await OperlogRequest.export(queryParams.value)
const filenameMatch = response.headers['content-disposition'].match(/filename\*=UTF-8''(.*)/i)
const filename = decodeURIComponent(filenameMatch[1])
linkDownload(response.data, filename)
```

**模板下载**（文件名前端固定）：

```ts
const response = await UserRequest.importTemplate()
linkDownload(response.data, '用户导入模板.xlsx')
```

**文件下载**（文件名来自业务数据）：

```ts
const response = await FileRequest.download({ id: row.id })
linkDownload(response.data, row.fileName)
```

### 5.3 为什么必须用 `response.data`

`responseTransformInterceptor` 对 `blob` / `arraybuffer` **直接返回整个 `AxiosResponse`**：

```25:26:apps/admin/src/utils/request/interceptor/response-transform.ts
      // 处理二进制响应
      if (['arraybuffer', 'blob'].includes(responseType)) return response
```

所以：

| 写法 | 结果 |
|---|---|
| `await XxxRequest.export()` → `response.data` | `Blob` ✅ |
| 写成 `const blob = await XxxRequest.export()` 直接用 | 拿到的是 AxiosResponse，不是 Blob ❌ |
| 普通接口却取 `response.data` | 已经是业务数据，再取就是 `undefined` ❌ |

### 5.4 下载失败的提示

二进制接口返回 JSON 错误体时（例如无权限、文件不存在），拦截器已经解析出 `code` / `message` 并走 reject，页面只需要 `catch` 复位状态，**不要**自己对 Blob 做 `JSON.parse`。

## 六、相对路径转可访问 URL

后端返回的图片、附件字段往往是相对路径（`uploads/xxx.png`），展示前用 `resolveFileUrl`：

```3:7:apps/admin/src/utils/file.ts
/** 将后端返回的文件相对路径（uploads/xxx）拼接为可访问的完整 URL，空值返回空串 */
export function resolveFileUrl(path?: string | null): string {
  if (!path) return ''
  return `${import.meta.env.VITE_BASE_API}/${path}`
}
```

- 空值返回空串，模板里可以直接 `:src="resolveFileUrl(row.avatar)"`
- **不要**在业务代码里手拼 `VITE_BASE_API`
- 文件大小展示用 `formatFileSize(size)`，空值返回 `-`

## 七、常见错误

| 错误 | 后果 |
|---|---|
| 手动设置 `Content-Type: multipart/form-data` | 缺少 boundary，后端解析失败 |
| `formData.append('file', file)` 传错字段名 | 后端收不到文件 |
| 把 `blob` 接口返回值当业务数据用 | 拿到 AxiosResponse，导出文件是 `[object Object]` |
| 自己写 a 标签且不 `revokeObjectURL` | 内存持续增长，大文件尤其明显 |
| 后端给了文件名却前端写死 | 导出文件重名、扩展名缺失 |
| 断点续传时忽略 `uploadedChunks` | 重复上传分片，合并后文件损坏 |
| 分片上传前不调 `mergeChunks` | 只有分片文件，没有最终文件 |
| 失败后用 `clearChunk` 之外的接口清理 | 分片目录残留，占用磁盘 |

## 八、自检清单

1. 上传 body 是 `FormData`，字段名 `file`，没有手动设 `Content-Type`
2. 大文件走 `checkFile` → `uploadChunk` → `mergeChunks` 三步，中间没有跳步
3. 断点续传用上了 `uploadedChunks`
4. blob 接口的返回值取自 `response.data`
5. 下载统一用 `linkDownload`，没有手写 a 标签
6. 导出文件名优先从 `content-disposition` 解析，其次业务字段，最后才写死
7. 失败只复位 UI 状态，不重复弹提示
