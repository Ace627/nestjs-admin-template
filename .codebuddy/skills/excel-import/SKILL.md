---
name: excel-import
description: 给本项目（NestJS + Vue3 admin 模板）的任何业务模块添加 Excel 数据导入功能：下载导入模板（字典列自动下拉）+ 上传 .xlsx 导入 + 可选覆盖更新。当用户要求为某模块加导入功能、导入模板、批量导入、importData/importTemplate 接口、导入弹窗时使用。基于 system/user 定稿版抽离，自动适配模块的实体、权限码与关联字段形态。
---

# excel-import：模块 Excel 导入功能

为业务模块添加与 `system/user` 定稿版一致的 Excel 导入能力。完整代码模板（后端实体/DTO/Controller/Service、前端 request/弹窗/列表页）见 `references/implementation.md`（动手前必读，逐段替换 `<模块>` 对应物）。

## 执行流程

1. **探查模块现状**（逐项确认，禁止假设）：
   - 后端三件套路径：`server/src/modules/<分组>/<模块>/{xxx.controller.ts,xxx.service.ts,xxx.dto.ts}` 与实体 `server/src/common/entities/...`；
   - 前端三处：`admin/src/views/<...>/<模块>/index.vue`、`admin/src/api/<...>/<模块>.request.ts`、既有弹窗范式 `components/XxxDialog.vue`；
   - 权限码前缀：看 controller 既有 `@RequirePermissions`（如 `system:user:import`）；
   - 模块是否需要读系统参数（如初始密码）：需要则在 `<模块>.module.ts` 追加 `import ConfigModule`（非全局模块）。
2. **与用户确认四个定稿问题**（用户未提及时按推荐项默认）：
   - 文件格式：仅 `.xlsx`（ExcelJS 不支持旧版 .xls，.xls 给「另存为 xlsx」提示）；
   - 关联/外键字段（部门、角色等）：弹窗统一选择，不进模板列；
   - 覆盖语义：按业务主键匹配，仅更新 Excel 内资料字段，密码/关联/归属字段不变；
   - 权限码：独立 `system:<模块>:import`，由用户手动在菜单管理新增。
3. **输出简短方案**（模板列清单、端点、覆盖语义、涉及文件清单），按 AGENTS.md 流程获用户批准后动手。
4. **按 references/implementation.md 实施后端**：实体 `@Excel` → DTO → Controller 两端点 → Service `importTemplate`/`importData` → Module 登记。
5. **按 references/implementation.md 实施前端**：request 两方法 → `components/XxxImportDialog.vue` → index.vue 按钮 + 挂载弹窗。
6. **验收**：跑通 references/implementation.md 末尾的验收清单（两端构建 + 七项行为）。

## 硬性口径（定稿版，不得偏离）

- **首错即返**：文件解析或业务校验遇到第一个错误立即抛出该条（带 `第 N 行：` 定位），事务回滚，不汇总、不部分成功；模板下载与导入都挂独立权限码 `system:<模块>:import`；
- **仅 .xlsx**：service 校验扩展名（`.xls` →「暂不支持旧版 .xls 格式，请将文件另存为 .xlsx 后重新上传」）+ ZIP 魔数（`0x50 0x4b`）拦截改后缀伪造文件；前端 `accept=".xlsx"` 同步拦截；
- **文件与密码**：`file.buffer` 缺失报「导入文件不能为空」；新记录初始密码等系统参数用 `ConfigService.getStringConfig('<参数键>', '<默认值>')` 读，缺失回退默认值；
- **保护口径**：模块内受保护数据（用户模块 = `roleCode === RbacConstant.SUPER_ROLE_CODE` 的超管账号，判定参照该模块 delete 的保护逻辑）命中导入即整体驳回，不跳过；
- **唯一性**：业务主键与唯一字段（手机/邮箱类）做「文件内去重 + 库内查重」，覆盖模式下排除被更新记录自身（`id: Not(selfId)`）；同名软删墓碑先物理清理（与模块 create 口径一致），防止唯一索引冲突；
- **覆盖更新**：仅 `Object.assign` Excel 内出现的资料字段，密码/关联关系/归属字段不动；未勾覆盖时已存在即报错；
- **入库与缓存**：全程包 `dataSource.transaction`；成功后对全部受影响记录执行模块既有缓存清理方法；
- **模板下拉**：字典列下拉由 `ExcelService.importTemplate` 自动生成（选项 = 字典标签，与导入标签反查一致），业务侧零代码；字典列在实体上配 `dictType` 即可；
- **日志与响应**：导入端点挂 `@Operlog({ title: '<功能名>', businessType: BusinessType.IMPORT })`（枚举已存在勿新增）；模板下载挂 `@SkipTransform()` 并返回 `StreamableFile`（文件名 UTF-8 disposition 写法照抄 implementation.md）；
- **init.sql 禁区**：菜单/按钮权限 SQL 由用户手动新增（AGENTS.md 技术规则），技能不做任何 init.sql 改动；
- **项目规范**：图标只用 SvgIcon；el-link 用 `underline="never"`（禁 `:underline="false"`）；同一来源的 type import 合并一行；动态路由页面组件不手写 `defineOptions name`（弹窗子组件可写）。

## 常见坑

- el-upload 拖拽区默认 360px 宽 + 40px 内边距：宽度用自定义类 + **非 scoped** 样式压满（scoped `:deep()` 在部分环境不生效，勿回退该写法），内边距压到 `12px 16px` 呈单行；
- 前端 `.xls` 拦截与后端拦截并存，前端提示文案与后端保持一致；
- 覆盖模式更新实体时 `row.data` 只含 Excel 列字段，天然不会碰到密码/关联字段，禁止额外合并表单数据；
- Excel 下拉覆盖到第 1000 行即可，超出部分靠导入强校验兜底；
- 字典列下拉选项跟随字典当前数据，字典调整后需重新下载模板。
