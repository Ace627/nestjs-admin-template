---
name: apipost-doc-sync
description: 本项目接口文档同步技能。当需要生成或更新项目接口文档 JSON（Apipost 兼容 OpenAPI 3.0 + x-* 扩展）、把 server 后端控制器端点同步进文档、或核对接口文档与实际代码差异时使用。涵盖端点清单盘点、真实返回数据取材（实体字段/成功文案/特殊返回结构）、Apipost x-* 扩展字段格式规范、脚本全量生成/基线合并与执行后校验。
---

# Apipost 接口文档同步（本项目）

将 `server/src/modules/**` 全部控制器端点按 Apipost 兼容格式（OpenAPI 3.0 + x-* 扩展）生成接口文档 JSON。端点定义全部承载于脚本 `DEFS` 区，可无基线独立生成完整文档；也可传 Apipost 导出 JSON 作基线做幂等合并（增量同步用）。**端点总数不用记忆也不用写在文档里**：脚本内置控制器自动对账，DEFS 与控制器端点有差集即报错退出并列出清单。

**输出位置（固定）**：项目根目录 `接口文档_YYYYMMDDHHmmss.json`（脚本自动命名，不改动基线文件本身）。

## 工作流

### 1. 盘点差集

- 差集由脚本自动报告：直接执行脚本（见第 4 步），`❌ 以下控制器端点未录入 DEFS` 即待补清单，`❌ 以下 DEFS 端点在控制器中不存在` 即疑似已删除或路径变更需回改 DEFS 的条目；另有返回体变更（service 改返回值/实体加字段）脚本无法感知，需人工留意近期改动。
- 读涉及的 `*.controller.ts` 与同目录 `*.dto.ts`，准备补录素材：path、method、summary（**改写为纯汉字且最多 8 字的接口名**，禁标点/字母/数字/空格；controller 注释原文中的补充语义移入 def 的 `desc` 字段，写入文档 description）、query 参数、DTO 字段。

### 2. 取材真实数据（硬性要求，禁止凭空编造）

schema 与 example 中的每个字段、每个文案都必须回源码核实：

| 数据 | 来源 |
|---|---|
| 实体字段/类型 | `server/src/common/entities/**`（BaseEntity 含 createTime/updateTime/deleteTime/createBy/updateBy 五个公共字段） |
| 成功/失败文案 | grep 各 service 的 `return '...'` |
| 分页参数 | `PaginationDto`（pageNo/pageSize，query 传字符串形式数字，DTO 内 `@Type` 转换；**文档口径恒标必填**——前端明传，后端缺省默认值属兼容行为不写入文档） |
| 特殊返回结构 | 对应 service 方法体（对照表见 `references/apipost-format.md`） |
| 缓存分类前缀 | `server/src/common/constant/redis.constant.ts` |
| 状态/枚举取值 | 各 `*.constant.ts`，0/1 语义以常量注释为准 |

### 3. 编辑 DEFS

打开 `scripts/sync-openapi.mjs`，仅在 `DEFS` 区按文件内示例追加/修改端点定义，**不要改 helper 区**。每个 def 需要：path、method、tag、sort、summary（纯汉字且最多 8 字，脚本内置正则 `/^[\u4e00-\u9fa5]{1,8}$/` 校验，违例即退出）、可选 desc（补充语义，进文档 description）、params/body、data（schema）、example（真实示例对象）或 raw200（二进制流）。新目录追加进 `newTags`（x-sort 续接现有最大值）。

### 4. 执行与校验

```bash
node .codebuddy/skills/apipost-doc-sync/scripts/sync-openapi.mjs            # 无基线：全量生成
node .codebuddy/skills/apipost-doc-sync/scripts/sync-openapi.mjs <基线json> # 有基线：幂等合并（--force 覆盖）
```

- 两种模式均输出到项目根 `接口文档_YYYYMMDDHHmmss.json`，基线文件保持不动。
- 合并模式幂等：基线中已存在的 path+method 自动跳过，加 `--force` 才覆盖。
- 校验四项（前两项不一致即退出码 1 并列出明细）：控制器端点对账（DEFS 与 controller 端点集完全一致）；接口名 summary 纯汉字且 ≤8 字；tags 无缺；JSON 可解析。
- **禁止整文件手写重写，一律脚本生成/合并**。

### 5. 收尾

- 提醒用户在 Apipost 重新导入生成的 JSON，抽查 2~3 个新增条目（目录层级 + 请求/响应示例）。
- 实体加字段、service 改返回值后，回到第 1 步做增量同步；`references/apipost-format.md` 的对照表须同步更新。
