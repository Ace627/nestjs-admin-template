# Apipost 兼容格式规范（2026-09-15 更新：无基线全量生成口径）

## 文件形态

- 紧凑单行 JSON，根字段：`openapi` / `info` / `servers` / `components.schemas` / `tags` / `paths`。
- 无基线生成时 `servers` 取 `http://localhost:3000/api`（全局前缀 `/api` 已含在 server URL，**paths 不再带 /api 前缀**）；`components.schemas` 为空占位，文档以 example 驱动，DTO 校验细节不写进 schema。
- 扩展字段（x-target-id/x-mark-id/x-parent-id）沿用 Apipost 导出格式口径，导入 Apipost 可识别目录与排序。
- 输出统一为项目根 `接口文档_YYYYMMDDHHmmss.json`。

## tags（目录）

```json
{ "name": "目录名", "description": "", "x-type": "folder", "x-url": "", "x-target-id": "<15位hex>", "x-sort": 23000, "x-parent-id": "0" }
```

x-sort 沿用菜单排序递增（2026-09-15 全量口径：鉴权 20000 → 用户 21000 → 角色 22000 → 菜单 23000 → 部门 24000 → 字典 25000 → 文件 26000 → 日志 27000 → 在线 28000 → 缓存 29000 → 服务监控 30000 → 定时任务 31000 → 健康检查 32000 → 文件上传 33000 → 首页统计 34000；2026-09-21 增登录锁定 36000，新目录续接递增）。

## 端点操作字段

| 字段 | 取值 |
|---|---|
| x-target-id | 15 位随机 hex（`crypto.randomBytes(8).toString('hex').slice(0, 15)`） |
| x-protocol | `"http"` |
| x-sort | 目录内 1000 递增 |
| summary | 纯汉字且最多 8 字的接口名（脚本内置正则校验，违例退出）；controller 注释补充语义经 def 的 desc 写入文档 description |
| tags | `[目录名]` |
| x-mark-id | `"2"` |
| x-updated-at | 本地时间 `YYYY-MM-DDTHH:mm:ss+08:00` |
| x-updated-user-name | `"当时只道是寻常"` |

## 200 响应（统一 envelope）

schema `required: [code, message, requestId, data, timestamp, duration]`；example 用 `JSON.stringify(obj, null, '\t')` 生成。

## 404 占位

```json
{ "description": "失败", "content": { "application/json": { "schema": { "type": "object", "properties": {} }, "example": "" } } }
```

## 特殊形态

- **导出接口**（`@SkipTransform` xlsx 流，如 loginlog/operlog/joblog 的 export）：200 → `application/octet-stream` + `format: binary`，不套 envelope；2026-09-12 起三个导出端点接收与列表相同的 query 筛选条件（`@Query(PaginationPipe)`，条件全量导出、分页参数被忽略），文档 params 须同步。
- **multipart 上传**：requestBody 用 `multipart/form-data`，file 字段 `type: string, format: binary`。
- **树形列表**（menu/dept list）：节点含 `children`，schema 用 `items: { type: 'object' }`，example 给一层真实数据。
- **同一路径多方法**：如 `/system/role/dataScope` 同 path 挂 GET+PUT，合并在同一个 path 键下。
- 返回 number/boolean 的端点照实写（清缓存数量、删键是否成功），不要一律写字符串文案。

## 已知特殊返回结构对照表（改动后须回源码复核）

| 端点 | data 结构 |
|---|---|
| GET /system/role/dataScope | `{ dataScope, deptIds[] }` |
| GET /system/role/permission | 菜单 ID 字符串数组 |
| GET /monitor/cache | `{ dbsize, info, commandstats }` |
| GET /monitor/cache/names | `[{ prefix, remark }]`，白名单 7 前缀：captcha:img / token:access / system:dict / repeat:submit / response:cache / throttle:limit / login:fail |
| GET /monitor/cache/keys | 键名字符串数组 |
| GET /monitor/cache/keys/detail | `{ name, key, value, ttl }`（ttl -1 永不过期 -2 不存在） |
| DELETE /monitor/cache/names/delete | 删除键数量 number |
| DELETE /monitor/cache/keys/delete | boolean |
| DELETE /system/dict/cache | 清除键数量 number |
| GET /system/config/key | 参数键值字符串；参数不存在返回 null（nullable） |
| DELETE /system/config/cache | null（reloadCache 为 Promise<void>，清空重建后无返回值） |
| GET /monitor/online/count | number |
| GET /monitor/online/list records | `{ userId, ip, location, username, loginTime, browser, os, uuid }` |
| GET /auth/getInfo | `{ user（剔除 password/deleteTime/roles）, roles[], permissions[] }` |
| GET /auth/getRoutes | 菜单实体扁平数组（无 children，前端建树） |
| GET /system/user/profile | `{ nickname, phone, email, age, gender, avatar, createTime, roleGroup[] }` |
| GET /system/dict/data/type | 精简字段数组 `{ dictLabel, dictValue, listClass, dictSort }` |
| GET /monitor/server/pool | `{ current, running, maxUsed, maxConnections }` |
| GET /monitor/health/*（除 live/ready） | terminus `{ status, info, error, details }` |
| GET /monitor/health/live、ready | 统一 envelope 包 `{ status: 'ok', message }` |
| POST /common/upload/file | 相对路径字符串 `uploads/<sha256><ext>` |
| POST /common/upload/check | `{ isExist, uploadedChunks[] }` |
| GET /dashboard/statistics | `{ userCount, roleCount, onlineCount, todayLoginCount, loginTrend[7], operTrend[7] }` |
| GET /system/file/tree | 目录树数组（children 嵌套，仅 fileType='D'） |
| GET /system/file/list | 分页 records 混含目录（fileHash/filePath/fileSize/fileExt/mimeType 均为 null）与文件 |
| GET /system/file/download | 二进制流（attachment 保留原始文件名），同导出接口 raw200 口径 |
| DELETE /system/file/recycle/delete | 文案含清理物理文件数量：`彻底删除成功，清理物理文件 N 个`（N=0 时无后半句） |
| DELETE /system/file/recycle/clear | 文案含清理物理文件数量：`回收站已清空，清理物理文件 N 个`；回收站为空抛「回收站已为空」 |
| POST /system/file/register | 幂等：同目录同 hash 已登记返回「文件已登记」；物理文件缺失抛「物理文件不存在，请先完成上传」 |
| GET /auth/captcha | `{ enabled, uuid, captcha }`，实时读参数开关，关闭时仅 enabled 有效、uuid/captcha 为空串 |
| GET /monitor/loginlock/list records | Redis 数据非实体：`{ username, ip, failCount, remainingCount, remainingSeconds }`（无 BaseEntity 五字段） |
| DELETE /monitor/loginlock/unlock | 「解锁成功」；参数 username+ip 均必填，行维度与列表一一对应 |

## 成功文案基线（更新与新增常不同）

- menu / dept / role 更新 = 「修改成功」，新增 = 「添加成功」
- dict 新增 = 「新增成功」，更新 = 「更新成功」
- job run = 「执行一次成功」，changeStatus = 「状态修改成功」
- 清空类 = 「清空成功」，删除类 = 「删除成功」
- 在线强退 = 「强退成功」，上传分片 = 「分片上传成功」、合并 = 「文件合并成功」、清理 = 「分片目录已成功清理」
