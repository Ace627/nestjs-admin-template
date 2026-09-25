# 纯分页型模块（标本：参数管理 system/config）

适用：单表、list 分页、标准增删改查。实现细节一律回读下列标本源码，本文档只列「引用哪些标本文件 + 差异点清单」，禁止内嵌代码模板。

## 标本文件

**后端**

| 文件 | 看什么 |
|---|---|
| `server/src/common/entities/system/config.entity.ts` | 实体写法：继承 BaseEntity、@Column 注释/默认值/列名 |
| `server/src/common/entities/base.entity.ts` | 五个公共字段（createTime/updateTime/deleteTime/createBy/updateBy）的来源，实体里不重复声明 |
| `server/src/modules/system/config/config.dto.ts` | Create/Update/Query 三个 DTO 划分、Query 配 PaginationPipe、查询方式装饰器口径 |
| `server/src/modules/system/config/config.service.ts` | 分页查询、写操作后的 Redis 缓存主动失效、唯一性校验文案 |
| `server/src/modules/system/config/config.controller.ts` | 路由命名（create/delete/update/list/detail）、@RequirePermissions + @Operlog 双挂、权限码拆分（写操作逐动作、查询类 :query） |
| `server/src/modules/system/config/config.module.ts` | 模块文件最小形态 |
| `server/src/modules/system/system.module.ts` | 模块注册位置（imports/exports） |

**前端**

| 文件 | 看什么 |
|---|---|
| `admin/src/views/system/config/index.vue` | ProTable + ProSearch 页面骨架、权限码门控、useDict 取项、弹窗拆分引用方式 |
| `admin/src/api/system/config.request.ts` | API 封装函数命名与返回类型口径 |

**数据**

| 文件 | 看什么 |
|---|---|
| `init.sql` 中 `sys_menu` 的参数设置相关行 | C 菜单行 + query/create/update/delete 四条 F 按钮行的列值形态（menu_sort 依次 1/2/3/4，parent 指向目录） |

## 差异点清单（照标本生成时必须替换的点）

1. 路由前缀 `@Controller('system/<模块>')` 与全部端点路径。
2. 功能名 = 文档目录 tag = @Operlog title = sys_menu 的 menu_name；DEFS 目录 x-sort 续接 `newTags` 现有最大值。
3. 四个权限码：`system:<模块>:query|create|update|delete`，前端按钮门控与后端一一对应。
4. businessType 取值按 `server/src/common/constant/business-type.constant.ts`（create/update/delete 对应新增/修改/删除）。
5. 缓存键前缀：读 `server/src/common/constant/redis.constant.ts`，确认复用既有分类或新增，并与用户确认。
6. 实体字段、DTO 校验装饰器、Query 的查询方式（LIKE/EQ/BETWEEN）严格按第 2 步定稿配置表落，不照抄 config 字段。
7. 前端 columns/slots/搜索项/表单控件按配置表落；slot 列不写 prop；绑定字典的列用 useDict 渲染。
8. init.sql 追加行：1 条 C 菜单行 + 每个按钮 1 条 F 行；UUID 全新且互不冲突。
9. 成功文案对齐既有口径：新增「添加成功」或「新增成功」（同一模块内统一）、更新「修改成功」或「更新成功」（同上）、删除「删除成功」，DEFS 与 service 文案一致。
10. 数据权限（仅当 SKILL.md 第 2 步模块级确认项勾选时生成，未勾选则整条跳过）。挂载示例（标本 `server/src/modules/system/user/user.controller.ts:52-57`、`user.service.ts:140`；alias 必须传本模块 qb 主表别名，默认值 'user' 不适用）：

   ```ts
   // Controller 查询端点：在 @RequirePermissions 旁追加，alias 占位为 <业务表别名>
   @DataScope({ alias: '<业务表别名>' })
   public findList(@Query(PaginationPipe) queryParams: QueryDto, @DataScopeSql() ds: DataScopeCondition) {
     return this.<模块>Service.findList(queryParams, ds)
   }

   // Service 列表方法：签名追加 ds 参数，qb 条件消费（ds 为 undefined 表示无过滤，如超管）
   public async findList(queryParams: QueryDto, ds?: DataScopeCondition) {
     // ...常规 where 条件...
     if (ds) queryBuilder.andWhere(ds.sql, ds.params)
   }
   ```
