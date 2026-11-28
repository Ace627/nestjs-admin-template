# AGENTS.md

给 AI 编码代理看的项目说明书。命令与约定优先于 `README.md`（README 面向人，本文件面向代理；两者冲突时以本文件为准）。

## 0. 协作方式（强制）

- 全部用中文回复，每次回复以「主人」开头。
- 写代码前先描述方案（改哪些文件、每步做什么、影响面），等批准再动手；需求模糊先提问，不猜。
- 不要写兼容性代码，除非我明确要求。
- 收尾必须给出：改动点 → 边缘情况 → 建议补充的测试用例。
- 说「已验证」必须真有命令输出；没跑就写「未验证」。命令失败要如实说明退出码与报错。
- 变量命名见名知意，禁止缩写（不要 `v`、`v: unknown`）；类型不明时用能表达业务含义的名字。
- 注释只写在关键处；一眼看懂的代码不加注释。

## 1. 项目是什么

单仓双工程（**不是 monorepo**）：前端 `apps/admin`、后端 `apps/server` 各自有 `package.json` 与 `pnpm-lock.yaml`，互不引用，各自 install / build / 运行。

- 前端：Vue 3.5 + TypeScript 6.0 + Element Plus 2.14 + Vite 8 + Pinia + UnoCSS + Vue Router，仅 hash/history 二选一，无 i18n、无 mock。
- 后端：NestJS 12 + TypeORM + MySQL 8 + Redis 7 + BullMQ，接口前缀 `/api`，默认账号 `admin / 123456`。
- 运行环境：Node ≥ 24、pnpm 12（版本由各工程 `packageManager` 锁定，需 `corepack enable`）。

```
apps/admin/            # 前端工程
  build/plugins/       # vite 插件（自动导入、组件注册、压缩等）
  src/api/             # 接口请求类，与 src/types/api 一一镜像
  src/components/      # 全局组件（已全局注册，禁止 import）
  src/hooks/           # 自动导入的组合式函数
  src/store/modules/   # 自动导入的 Pinia store
  src/utils/           # 需手动 import（request、cache 等）
  src/views/           # 页面：<模块>/<业务>/index.vue
  test/                # vitest 用例，镜像 src/utils 结构
apps/server/
  src/common/          # 拦截器/过滤器/守卫/装饰器/实体/常量，统一从 '@/common' 导入
  src/modules/         # 业务模块：auth、system、monitor、dashboard、common
  src/shared/          # RedisService、CaptchaService、LoginLockService（@Global）
  src/utils/           # 纯函数工具，从 '@/utils' 导入
  ormconfig.ts         # TypeORM CLI 专用数据源
config/docker/         # Dockerfile.server
scripts/               # 仓库级 .mjs 脚本（初始化库、生成 init.sql、主键转换、镜像构建）
resource/init.sql      # 种子数据来源（建表由迁移负责）
```

## 2. 命令（必须在对应子工程目录执行）

没有根 `package.json`，**不存在**根级 `pnpm -w` / 一次性安装。

```bash
# 前端
cd apps/admin
pnpm install
pnpm dev          # http://localhost:7878（.env.development 的 VITE_SERVER_PORT；README 里写的 5173 已过期）
pnpm build        # vue-tsc -b && vite build —— 类型检查的唯一门禁
pnpm test:run     # vitest run，用例在 test/**/*.spec.ts
pnpm test         # vitest watch

# 后端
cd apps/server
pnpm install
cp .env.example .env
pnpm db:init      # 建库 + 生成/执行迁移 + 灌种子数据
pnpm start:dev    # http://localhost:3000/api
pnpm build        # nest build
pnpm lint         # eslint --fix，配置见 eslint.config.mjs
pnpm test         # vitest watch；用例在 src/**/*.spec.ts（当前 5 个文件 74 个用例）
pnpm test:run     # vitest run，CI 用

# 数据库（改实体后）
pnpm migration:generate   # 生成到 src/database/migrations/
pnpm migration:run
pnpm typeorm migration:show
pnpm migration:revert     # 只回滚最后一条，依赖 down() 写对

# 仓库级脚本（在仓库根执行）
node scripts/clean-svg-icons.mjs
node scripts/generate-init-sql.mjs
node scripts/build-server-image.mjs   # 产物 dist/nest-admin-template-server.tar
```

前端**没有** lint/format 脚本，格式统一以根 `prettier.config.cjs` 为准（`printWidth: 220`、单引号、无分号、`trailingComma: 'all'`）。

## 3. 前端硬规则（apps/admin）

### 自动导入：以下一律禁止手写 import

- `vue` / `pinia` / `vue-router` / `@vueuse/core` 的全部 API。
- `src/store/modules/*`（`useUserStore` 等）、`src/hooks/*`（`useDict`、`useTheme` 等）。
- `src/components/*` 全局组件：模板里直接写标签，禁止 `import` 或局部注册。
- Element Plus 组件（`<el-xxx>`）与 `ElMessage` 等函数式 API。

必须手写 import 的：`@/utils`、`@/utils/request`、`@/api/**.request`、`@/types` 的具名类型、`lodash-es`。配置在 `build/plugins/auto-import-plugin.ts`。

### 全局组件清单（`src/plugins/modules/global-component.ts` 注册）

`SvgIcon`、`ProTable`、`ProSearch`、`ProPagination`、`ProTooltip`、`ProChart`、`DictTag`、`IconSelect`、`RightToolbar`、`CrontabDialog`。

### SFC 与页面

- 固定顺序：`<template>` → `<script setup lang="ts">` → `<style lang="scss" scoped>`（样式为空也保留）。
- 路由页面（`views/**/index.vue`）**不写** `defineOptions({ name })`——`src/router/router.helper.ts` 会按路径覆写组件 name 供 KeepAlive 使用；只有全局组件与页面私有组件写 `name`。
- 列表页骨架：`ProSearch`（`ProSearchItem[]` + `v-model` 查询对象）→ 工具条（`v-permissions` 按钮 + `RightToolbar`）→ `ProTable`（`ProTableColumn<T>[]` + 具名插槽）→ `ProPagination`（`v-model:current-page` + `@pagination`）→ 弹窗组件（`ref` + `defineExpose({ open })`）；脚本内保留 `list / total / loading / queryParams / showSearch / hiddenColumnKeys` 命名，`onMounted` 拉列表。
- 页面私有子组件放同级 `components/XxxDialog.vue`；子页面平铺为 `views/monitor/job/log.vue`。

### 接口与类型

- 每个接口模块一个类 + 全静态方法：`export class UserRequest { static findList(params: User.UserQuery): PaginationResult<User.SysUser> }`，文件 `src/api/<模块>/<实体>.request.ts`。
- `request` 已解包业务数据：普通响应直接拿 `data`，无需再判 `code`；`blob/arraybuffer` 返回完整 response。分页类型直接写 `PaginationResult<T>`（它本身是 Promise），不要包一层 `Promise<...>`。
- 错误提示由拦截器统一 `TipModal.msgError`，**页面禁止重复弹错误**，只 `console.log` + `Promise.reject`。
- 类型：`src/types/api/<模块>/<实体>.ts` 与 `src/api` 镜像，经 `src/types/index.ts` 命名空间导出（`import type { User } from '@/types'` 后 `User.UserQuery`）。命名：实体 `SysUser`、查询 `XxxQuery`、表单 `XxxForm`、其余 `XxxParams`。

### 路由 / 权限 / 状态 / 样式

- 新增页面三步：① 新建 `src/views/<模块>/<业务>/index.vue`；② 补 `src/types/api/...` 与 `src/api/....request.ts`；③ 后台「菜单管理」建菜单，组件路径填 `system/role/index`（不带 `.vue`，错路径控制台会报「动态路由组件不存在」）。前端路由表**不要**改，业务路由由后端菜单动态注入。
- 按钮权限：`v-permissions="['system:role:create']"`、`v-roles="['admin']"`，编码形态 `模块:实体:动作`，来自后端 `getInfo`。
- store：`defineStore('kebab-case-id', () => { ... })` setup 语法，文件 `kebab-case.ts`。
- 样式：布局/间距用 UnoCSS 原子类，复杂样式用 SCSS scoped；主题色一律走 `--el-*` 变量（`src/styles/variables.scss`），禁止硬编码色值，新增样式需同时兼容 `html.dark`。
- 新增环境变量必须同步 `src/types/global/vite-env.d.ts` 声明，否则 `import.meta.env` 取不到类型。

## 4. 后端硬规则（apps/server）

- 模块四件套：`xxx.controller.ts` / `xxx.service.ts` / `xxx.dto.ts` / `xxx.module.ts`，文件名小写；实体统一放 `src/common/entities/<分组>/`，不建 `entity/`、`vo/` 子目录。
- 控制器只做参数绑定 + 装饰器，**直接 return 业务数据**，响应包装由 `ResponseTransformInterceptor` 完成（`{ code: 200, message, data, requestId, timestamp, duration }`），禁止手写 `AjaxResult`。
- 业务错误一律 `throw new BusinessException('提示语', code?)`，不要 `res.status().json()`。
- DTO 用 `class-validator` + `class-transformer`（`@Type(() => Number)`），中文 `message`；命名 `CreateXxxDto`、`UpdateXxxDto extends PartialType(CreateXxxDto)`、`QueryXxxDto extends PaginationDto`，动作型 `ChangeXxxStatusDto`。
- 新接口标配：查询 `@RequirePermissions(['system:xxx:query'])`；写操作再加 `@Operlog({ title: 'xx管理', businessType: BusinessType.INSERT })`；取当前用户统一用 `@CurrentUser('userId')`；只有登录/验证码等才 `@Public()`。
- 分页：入参 `@Query(PaginationPipe) queryParams: QueryXxxDto`（`pageNo/pageSize/skip/take`），返回 `{ total, records }`。
- Redis：注入 `RedisService`，key 前缀统一在 `src/common/constant/redis.constant.ts` 的 `RedisConstant` 中新增；增删改后主动 `del`，按前缀批量用 `scan(prefix + ':*')` 再删，禁止 `keys`。
- 数据库：`MYSQL_SYNCHRONIZE=false`，**禁止手动改表**。改实体 → `pnpm migration:generate` → 人工检查 `up()`/`down()`（数据变更的回滚需手写）→ 提交迁移文件 → `pnpm migration:run`。仓库当前没有迁移文件，首次 `db:init` 生成的 baseline 必须提交。
- 定时任务：方法写在以 `Service` 结尾的类里、必须 `public`，任务管理中原样填 `invokeTarget = "XxxService.method(arg1,arg2)"`（参数为合法 JSON）。
- 日志：`private logger = new Logger(XxxService.name)`；操作日志靠 `@Operlog` 显式开启，不是自动全量记录。
- 公共能力只从统一出口取：`import { ... } from '@/common'`、`@/shared`、`@/utils`，不深挖子路径。
- 后端不配 CORS，跨域由前端 Vite 代理（`/dev-api` → `http://localhost:3000`）解决。

## 5. 三档边界

✅ **总是**：先读后改、按上文目录放文件、改完跑对应校验命令、把边缘情况写进收尾说明。

⚠️ **先问再做**：新增第三方依赖；删除/重命名已有导出、改变接口契约；执行 `pnpm db:init --force`、`migration:revert`、`DROP` 等破坏性数据库操作；跨端联动的字段变更。

🚫 **绝不**：提交 `.env`、密钥、token、连接串；未经明确要求执行 `git commit` / `git push` / 改动 git 配置；手改 `pnpm-lock.yaml`；改库结构时开 `MYSQL_SYNCHRONIZE=true` 或手动改表；未确认就改动 `resource/init.sql` 的种子数据；在 `src/types/auto-generate/` 下手改生成文件；删 `.codebuddy/`（内含 skill 与项目记忆）；在自动化里用 Playwright 自带浏览器（本机走 `agent-browser` + Cent Browser）。

## 6. 完成条件（验收口径）

- 交付必须包含：改了哪些文件、跑了哪条命令、真实输出结论、还有哪些未验证。
- 前端改动至少 `pnpm build` 通过（`vue-tsc` 是唯一类型门禁）；后端改动至少 `pnpm lint` 与 `pnpm build` 通过。
- 纯函数逻辑改动应补用例：前端 `apps/admin/test/**/*.spec.ts`（镜像 `src/utils` 结构），后端 `apps/server/src/**/*.spec.ts`。
- 命令跑不了（缺依赖、缺数据库）时如实报告，不要把"计划执行"写成"已通过"；测试通过也不等于遵守了本文件，diff 才是最终依据。

## 7. 存量约定与存档位

- 详细规范在 `.codebuddy/skills/`：`vue-best-practices`（Vue 规范）、`request-best-practices`（请求层）、`apipost-doc-sync`（接口文档同步）、`dev-expert`（通用工程流程）。涉及对应主题先加载 skill，本文件与其冲突时以本文件为准。
- 项目记忆只写 `.codebuddy/memory/`（含 `MEMORY.md` 索引），按日期迭代；本文件条款变化时同步更新，不在旧条款后追加互相矛盾的新要求。
- 文档与代码要保持单一信息源：需要展开说明的细节放 skill 或文档里用路径引用，不要整段复制进本文件。
