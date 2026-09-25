# 主子表型模块（TypeORM 事务实现）

适用：一对多关联的模块（如单据 + 明细）。本项目无单一现成标本，分页骨架回读 `references/paged-module.md` 的标本，事务语义回读下列文件，本文档只列「引用哪些标本文件 + 差异点清单」，禁止内嵌代码模板。

## 标本文件

| 文件 | 看什么 |
|---|---|
| `server/src/modules/system/role/role.service.ts` | 主子关联写入的事务形态：`dataSource.transaction(async (manager) => {...})`，主表 + 关联表同事务落库 |
| `server/src/modules/system/dict/dict-type.service.ts` | 类型-数据级联删除的事务口径 |
| `server/src/modules/system/dept/dept.service.ts` | 事务内多表联动更新的另一形态（ancestors 链刷新） |
| `server/src/common/entities/system/config.entity.ts` 等分页型实体 | 主表实体骨架（子表实体同样继承 BaseEntity，外键列显式 snake_case 列名） |

## 差异点清单（相对纯分页型 references/paged-module.md 的差异）

1. **事务边界**：主表 + 子表的一切写操作（create/update/delete 及级联）必须整体包在 `dataSource.transaction` 中，禁止主表先写、子表后写的裸序列；事务内统一用 `manager` 操作仓库。
2. **子表进出方式**：与用户确认接口形态——通常 detail 返回子表集合、create/update 一次提交主 + 子全量；子表先删后插或增量更新二选一，确认后全程统一。
3. **删除语义**：删除主表时子表的级联策略（物理删/软删/存在子数据时拒绝删除）必须与用户确认后实现，禁止默认拍板。
4. **外键字段**：子表实体的外键列显式指定 snake_case 列名（@Column 属性名含大写的同一规则）。
5. **前端形态**：主编辑弹窗（XxxDialog.vue）内嵌子表编辑区，子表行操作不单独出权限码（随主表 update 码走）；主页面骨架仍按 paged-module.md。
6. **权限码与 SQL**：init.sql 只按主表出菜单行与按钮行；DEFS 只按 controller 实际端点录，detail 的子表结构写进 data schema。
7. **缓存失效**：主表或子表任一变动都触发该模块的缓存主动失效（口径同 paged-module.md 第 5 条）。
8. **数据权限**（仅当 SKILL.md 第 2 步模块级确认项勾选时生成，未勾选则整条跳过）：仅主表列表查询挂载，写法与 paged-module.md 第 10 条示例一致——Controller list 端点在 `@RequirePermissions` 旁追加 `@DataScope({ alias: '<主表 qb 别名>' })`，Service 列表方法签名追加 `@DataScopeSql() ds: DataScopeCondition` 并消费 `if (ds) queryBuilder.andWhere(ds.sql, ds.params)`；子表明细随主表过滤，不单独挂载；事务内写操作不受数据权限影响。
