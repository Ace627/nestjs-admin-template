---
name: code-generator
description: 生成标准业务 CRUD 模块（实体/DTO/Service/Controller/前端页面/菜单 SQL）的全栈脚手架技能，非标准模块不适用。当需要新增业务模块、实现标准增删改查、搭建模块脚手架时使用。涵盖三要素与逐字段配置确认、七件套生成、对账自检与收尾清单。
---

# 标准 CRUD 模块全栈脚手架（本项目）

一次性生成一套标准业务 CRUD 模块的全部代码与配套数据。接口名硬规则：**纯汉字且最多 8 字**，禁标点/字母/数字/空格（Controller 注释与 @Operlog title 均按此口径，补充语义写在注释第二行）。

**边界声明**：file / job / loginlock / upload 等非标准 CRUD 模块不适用本技能——它们含回收站、任务调度、Redis 自定义结构、分片上传等特殊语义，需单独确认方案后手工实现，禁止套本模板硬凑。

## 硬规则

- **接口名**：Controller 注释一律纯汉字且 ≤8 字，禁标点/字母/数字/空格；补充语义写在注释第二行。
- **权限与日志**：写操作端点必须同时挂 `@RequirePermissions(['system:<模块>:<动作>'])`（查询类权限码用 `:query`）与 `@Operlog({ title: '<功能名>', businessType })`。
- **init.sql 口径**：表结构完全不归本技能管（开发库 `MYSQL_SYNCHRONIZE=true` 自动同步实体列结构），本技能只追加 `sys_menu` 菜单行与逐按钮权限码种子行。
- **确认前置**：字段配置未经用户逐字段确认前，禁止写任何代码。

## 工作流

### 1. 确认三要素并选定模式

- 与用户确认三要素：**模块名**（路由与目录名，英文小写）、**表名**（snake_case）、**功能名**（纯汉字且 ≤8 字，用于 @Operlog title、sys_menu 的 menu_name、文档目录 tag）。
- 按数据形态选定模式，并通读对应 references（只写「引用哪些标本文件 + 差异点清单」，不内嵌代码模板以防模板腐烂，实现细节一律回读标本源码）：
  - 纯分页型 → `references/paged-module.md`，标本 `server/src/modules/system/config/`
  - 树形型 → `references/tree-module.md`，标本 `server/src/modules/system/dept/`
  - 主子表型 → `references/sub-module.md`，事务语义用 TypeORM `dataSource.transaction` 实现

### 2. 逐字段确认配置表

**模块级确认项（先于逐字段确认）**：是否挂载数据权限（`@DataScope`）。

- 适用边界：数据权限仅适用于「有部门归属语义的业务数据」——实体须有部门归属列（默认 `deptId`）。全局配置类（如参数设置）、监控类等无部门归属语义的模块不适用，不得勾选。
- 勾选 → 按既有基建自动接线，写法严格参照唯一现有标本 `server/src/modules/system/user/user.controller.ts:52-57` 与 `user.service.ts:140`，禁止自创新写法：
  - Controller 查询端点（list/detail 等）在 `@RequirePermissions` 旁追加 `@DataScope({ alias: '<qb 主表别名>' })`，方法签名追加 `@DataScopeSql() ds: DataScopeCondition` 参数并透传给 Service。配置语义回读 `server/src/common/decorator/data-scope.decorator.ts`：默认按 `deptId` 匹配部门、按 `createBy` 匹配「仅本人」档位；**alias 默认值是 'user'，其余模块必须显式传实际别名**；用户表须显式传 `userColumn: 'id'`，其余表默认按 `createBy` 匹配。
  - Service 列表查询方法签名追加 `ds?: DataScopeCondition` 普通参数（不是参数装饰器），并消费 `if (ds) queryBuilder.andWhere(ds.sql, ds.params)`；`DataScope`/`DataScopeSql`/`DataScopeCondition` 均从 `@/common` 导入，import type 或普通导入均可，与所在标本文件保持一致。
- 未勾选 → 完全不生成任何数据权限相关代码，保持与现状一致。
- 对账口径：`@DataScope` 不新增端点、不新增按钮权限行，checklist.mjs 两组不变式不受影响。

逐字段与用户确认下表，未确认前禁止写代码：

| 字段名 | 类型 | 是否列表显示 | 是否查询条件 | 查询方式 LIKE\|EQ\|BETWEEN | 控件类型 input\|select\|datetime\|upload | 是否绑定字典编码 | 是否必填 |
|---|---|---|---|---|---|---|---|

- 绑定字典编码的字段记下 dictType，前端用 `useDict` 取项渲染。
- 配置表定稿后向用户复述一遍再进入第 3 步。

### 3. 生成七件套

1. **实体**：`server/src/common/entities/system/<模块>.entity.ts`，继承 BaseEntity（自动带 createTime/updateTime/deleteTime/createBy/updateBy 五个公共字段）；@Column 属性名含大写时显式指定 snake_case 列名。
2. **DTO**：`server/src/modules/system/<模块>/<模块>.dto.ts`，Create/Update/Query 三个 DTO；Query 配 PaginationPipe（`server/src/common/pipe/pagination.pipe.ts`）。
3. **Service**：`server/src/modules/system/<模块>/<模块>.service.ts`，写操作（create/update/delete）须做 Redis 缓存主动失效（键前缀口径见 `server/src/common/constant/redis.constant.ts`，是否新增分类与用户确认）；主子表型写操作用 `dataSource.transaction` 包裹；若第 2 步勾选数据权限，列表查询方法签名追加 `@DataScopeSql() ds: DataScopeCondition` 参数并消费（写法见第 2 步模块级确认项）。
4. **Controller**：路由 `system/<模块>/create|delete|update|list|detail`；写操作同时挂 `@RequirePermissions` 与 `@Operlog`；list/detail 挂 `system:<模块>:query` 码；若第 2 步勾选数据权限，查询端点在 `@RequirePermissions` 旁追加 `@DataScope({ alias })`（写法见第 2 步模块级确认项）。
5. **模块注册**：在 `server/src/modules/system/system.module.ts` 完成 imports/exports 登记。
6. **菜单 SQL**：init.sql 追加 `sys_menu` 菜单行（C）与逐按钮权限码种子行（F：query/create/update/delete，其中 query 一条同时覆盖 list 与 detail），UUID 自生成且互不冲突、parent 指向正确目录。模块若增加这五个动作之外的端点：额外 GET 端点（如 tree、key）默认共用 `:query` 码不追加按钮行，但需独立权限码的 GET 端点除外（如 GET 形态 export 出 `:export` 码），此时须追加对应 F 行并在第 4 步自检时加 `--extra-f-rows=N` 纳入预期；额外写端点（如 changeStatus、export）须同步追加对应按钮 F 行。
7. **前端**：`admin/src/views/<模块>/index.vue` + `components/XxxDialog.vue`（弹窗拆子文件、`defineExpose({ open })` 暴露打开方法、操作成功 `emits('getList')`），API 封装 `admin/src/api/system/<模块>.request.ts`；查询条件按第 2 步配置表落 ProSearch，页面遵守 AGENTS.md 前端全部规范（动态路由页面组件禁止手写 defineOptions name）。

### 4. 对账自检

```bash
node .codebuddy/skills/code-generator/scripts/checklist.mjs
```

脚本校验一组不变式（基于 git diff HEAD 净行数，即新增 − 删除：修改既有条目相抵不计为新增，控制器注释行排除，`@All(` 按写端点计；净值为负属删除侧改动，删除方向对账同样成立，增删相抵净 0 视为无对账对象），不一致时列出明细并以退出码 1 结束：
- **init.sql 新增按钮权限行数 = 写端点数 + 查询码一条**：POST/PUT/DELETE 写端点各出一条按钮行，GET 端点（list/detail 等）共用一条 `:query` 码，标准五端点模块即 3 + 1 = 4 条 F 行；GET 端点持有独立权限码时（如 GET 形态 export 出 `:export` 码），用 `--extra-f-rows=N` 把对应 F 行计入预期。

前置条件：
- 新文件须先 `git add`——未跟踪文件不进 diff，控制器端点会被数成 0 导致误报；脚本检测到未暂存的相关新文件会先行警告。
- 两数全 0（改动已 commit、文件未保存或本次未生成端点）按失败处理（退出码 1），空跑确属预期时加 `--allow-empty` 显式豁免。
- 工作区应只含本次模块改动；若同批次混有其他模块端点或菜单行的修改，差值需人工核对。

### 5. 收尾提醒

- 重启 server 服务（新实体/新模块生效）。
- 若第 2 步勾选了数据权限：重启后用 admin（全量数据范围）与一个非全量数据范围的角色各查一次列表，核对过滤效果；同时验证 Redis 缓存缺失时 fail-closed 返回空集的行为。
- 执行 init.sql 追加的菜单 SQL（或由用户自行转储后重放）。
- 前端验证跑 `pnpm build`（admin 的真实类型检查口径，裸跑 vue-tsc 等于没检查）。
