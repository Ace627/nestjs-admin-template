---
name: batch-sort
description: 给本项目（NestJS + Vue3 admin 模板）中任何带排序字段（实体字段名为 xxxSort，如 deptSort/roleSort/dictSort）的业务模块添加「行内排序 + 批量保存排序」功能。当用户要求为某模块加排序功能、批量排序、保存排序、update/sort 接口时使用。自动探测模块的排序字段名、权限码前缀、树表/分页表形态并适配。
---

# batch-sort：模块批量排序功能

为带排序字段的模块添加与 `system/menu` 定稿版一致的批量排序能力。完整代码模板与适配差异表见 `references/implementation.md`（动手前必读）。

## 执行流程

1. **探查模块现状**（禁止假设字段名，逐项确认）：
   - 实体排序字段：grep 目标模块 `*.entity.ts` 中的 `sort`，确认字段名（如 `deptSort`、`roleSort`、`dictSort`）及列名；
   - 后端三件套路径：`server/src/modules/<分组>/<模块>/{xxx.controller.ts,xxx.service.ts,xxx.dto.ts}`；
   - 前端三处：`admin/src/views/<...>/<模块>/index.vue`、`admin/src/api/<...>/<模块>.request.ts`、`admin/src/types/api/<...>/<模块>.ts`；
   - 权限码前缀：看 controller 既有 `@RequirePermissions`（如 `system:dept:update`）；
   - 表形态：树表不分页（menu/dept）、分页表（role）、外层分组表（dict-data），以及 index.vue 是否已有「显示排序」纯文本列。
2. **输出简短方案**（目标模块、排序字段名、端点、按钮位置、涉及文件清单），按 AGENTS.md 流程获用户批准后再动手。
3. **按 references/implementation.md 的模板实施后端**（DTO + `@Put('update/sort')` + service 事务更新），所有 `menuSort`/菜单字样替换为目标模块对应物。
4. **按模板实施前端**（SortItem 类型 + request 方法 + index.vue 按钮/插槽/变更登记/保存逻辑）。
5. **验收**：跑通 references/implementation.md 末尾的验收清单（两端 tsc + 四项接口行为）。

## 硬性口径（用户已定稿，不得偏离）

- 请求体为**裸数组** `[{ id, menuSort }]`，禁止 `{ items: [...] }` 包装；逐项校验用 `ParseArrayPipe({ items: XxxSortItemDto, whitelist: true })`（全局 ValidationPipe 会跳过裸数组体）；
- 空数组校验在 service 抛 `BusinessException('未检测到排序修改')`；前端保存前置判断同样提示 `TipModal.msgWarning('未检测到排序修改')`；
- 权限码复用模块既有 update 码，前后端按钮/输入框均挂 `v-permissions`，不新增 sys_menu 记录；
- 排序输入框：`size="small"` + `style="width: 72px"` + `controls-position="right"` + `:min="0"`；
- 「保存排序」按钮放「新增」之后、其他功能按钮之前，warning 色、无变更禁用；
- 项目规范：图标只用 SvgIcon；动态路由页面组件不手写 `defineOptions name`；注释/文案不得出现「若依」字样。

## 常见坑

- ProTable columns 数组改动后严防双逗号——稀疏数组 undefined 项导致运行时 `generateColumnKey` 崩溃且 vue-tsc 不报错；
- slot 列不写 `prop`；
- 树表列宽「显示排序」90 → 130 容纳数字框。
