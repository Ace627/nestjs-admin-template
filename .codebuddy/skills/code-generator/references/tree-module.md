# 树形型模块（标本：部门管理 system/dept）

适用：单表自关联树（parentId + ancestors），list 返回树形数组不分页。实现细节一律回读下列标本源码，本文档只列「引用哪些标本文件 + 差异点清单」，禁止内嵌代码模板。

## 标本文件

**后端**

| 文件 | 看什么 |
|---|---|
| `server/src/common/entities/system/dept.entity.ts` | 树形实体写法：parentId、ancestors 祖级链列的声明 |
| `server/src/modules/system/dept/dept.dto.ts` | 树形模块的 Query DTO（无分页参数，不配 PaginationPipe） |
| `server/src/modules/system/dept/dept.service.ts` | 树构建、create/update 事务维护 ancestors、删除前子节点/占用校验口径 |
| `server/src/modules/system/dept/dept.controller.ts` | 树形模块端点形态（list 返回树而非 page）、权限码与 @Operlog 双挂 |
| `server/src/modules/system/dept/dept.module.ts` | 模块文件最小形态 |

**前端**

| 文件 | 看什么 |
|---|---|
| `admin/src/views/system/dept/index.vue` | 树形表格（row-key/children 渲染）页面骨架、权限码门控 |
| `admin/src/views/system/dept/components/DeptDialog.vue` | 弹窗拆分子文件、上级节点树选择的控件形态 |
| `admin/src/api/system/dept.request.ts` | API 封装口径 |

**数据**

| 文件 | 看什么 |
|---|---|
| `init.sql` 中 `sys_menu` 的部门管理相关行 | C 菜单行 + F 按钮行的列值形态 |

## 差异点清单（相对纯分页型 references/paged-module.md 的差异）

1. list 不分页：Query DTO 无分页参数，返回树形数组；树构建方式（前端建树或后端拼 children）与标本保持一致。
2. 实体比分页型多 parentId 与 ancestors；create/update 须维护祖级链（标本用 `dataSource.transaction` 包裹，父级变更时同步刷新全部子孙 ancestors）。
3. 删除前置校验：存在子节点、或被业务数据引用时拒绝删除，拒绝文案回读标本口径。
4. 前端为树形表格而非分页表；编辑弹窗含上级节点树选择，且禁止把自己/自己的子孙选为上级（死循环防护口径回读标本）。
5. 其余口径（四个权限码、@Operlog、DEFS 补录、init.sql 行形态、成功文案）与 paged-module.md 一致。
