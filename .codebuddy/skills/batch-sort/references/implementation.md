# 批量排序参考实现（以 system/menu 定稿版为准）

功能形态：列表「显示排序」列渲染行内 `el-input-number`，用户改动后登记到变更集合，点击「保存排序」按钮批量提交裸数组，后端事务逐条更新。

## 后端（server/src/modules/system/menu，3 个文件）

### dto（menu.dto.ts）

```ts
export class UpdateMenuSortItemDto {
  @IsNotEmpty({ message: '参数 $property 不能为空' })
  @IsString()
  id: string

  @Type(() => Number)
  @IsInt({ message: '显示顺序必须是整数' })
  menuSort: number
}
```

适配点：`menuSort` 换成目标模块实体的排序字段名；`@IsInt` 的 message 保持「显示顺序必须是整数」。

### controller（menu.controller.ts）

```ts
/** 批量保存菜单排序 */
@Put('update/sort')
@RequirePermissions(['system:menu:update']) // 复用模块既有 update 权限码，不新增菜单 SQL
@Operlog({ title: '菜单管理', businessType: BusinessType.UPDATE })
updateSort(@Body(new ParseArrayPipe({ items: UpdateMenuSortItemDto, whitelist: true })) items: UpdateMenuSortItemDto[]) {
  return this.menuService.updateSort(items)
}
```

适配点：注释文案、`@Operlog` title、权限码前缀（system:menu → 目标模块）。

**为什么用 ParseArrayPipe**：全局 ValidationPipe 配置为 `{ whitelist: true, transform: true, stopAtFirstError: true }`，但其 `toValidate` 对 `metatype === Array` 直接跳过——裸数组体挂 `@Body()` 不会被校验。`ParseArrayPipe({ items: XxxDto, whitelist: true })` 内部对每个元素走独立 ValidationPipe（transform: true），逐项校验 + 剔除多余字段。**禁止**再用 `{ items: [...] }` 包装请求体（用户已明确否决）。

**ParseArrayPipe 不拦空数组**，空校验必须在 service 做。

### service（menu.service.ts）

```ts
/** 批量保存菜单排序（事务内逐条更新，任一失败整体回滚） */
public async updateSort(items: UpdateMenuSortItemDto[]): Promise<string> {
  if (!items.length) throw new BusinessException('未检测到排序修改')
  const ids = items.map((item) => item.id)
  const targets = await this.menuRepository.findBy({ id: In(ids) })
  if (targets.length !== new Set(ids).size) throw new BusinessException('菜单不存在')
  await this.dataSource.transaction(async (manager) => {
    for (const { id, menuSort } of items) {
      await manager.update(MenuEntity, id, { menuSort })
    }
  })
  return '排序成功'
}
```

适配点：实体类、排序字段名、「菜单不存在」→ 目标模块名。service 已注入 `dataSource`（若目标 service 未注入，补 `@InjectDataSource() private readonly dataSource: DataSource`）。排序字段若为可选更新（如某些字段已置 null 的行），`manager.update(Entity, id, { xxxSort })` 只更新该列，安全。

## 前端（admin/src，3 个文件）

### 类型（src/types/api/system/menu.ts）

```ts
/** 排序保存项 */
export interface SortItem {
  id: string
  menuSort: number
}
```

适配点：字段名对齐后端；文件放 `src/types/api/<模块分组>/<模块>.ts`。

### API（src/api/system/menu.request.ts）

```ts
/** 批量保存菜单排序（空数组时后端校验拒绝） */
static updateSort(data: Menu.SortItem[]): Promise<string> {
  return request.put('/system/menu/update/sort', data)
}
```

### 页面（src/views/system/menu/index.vue）

按钮区（「保存排序」固定放「新增」之后、其他功能按钮之前，用户定稿顺序）：

```html
<el-button v-permissions="['system:menu:update']" plain type="warning" :disabled="!hasSortChanges" :loading="savingSort" @click="handleSaveSort">
  <template #icon><SvgIcon name="Sort" /></template><span>保存排序</span>
</el-button>
```

排序列（slot 列不写 prop；数字框样式为用户定稿：`size="small"` + `style="width: 72px"`，不要用大尺寸或 class 宽度）：

```html
<template #menuSort="{ row }">
  <el-input-number v-permissions="['system:menu:update']" v-model="row.menuSort" controls-position="right" :min="0" size="small" style="width: 72px" @change="handleSortChange(row)" />
</template>
```

列配置（`{ align: 'center', label: '显示排序', slot: 'menuSort', width: 130 }`）——**slot 配了就不写 prop**，且改数组时严防双逗号（稀疏数组 undefined 项会让 ProTable 的 generateColumnKey 运行时崩溃，vue-tsc 不报错）。

script 逻辑：

```ts
/** 排序变更集合（id -> 最新值，保存成功后清空） */
const sortChanges = ref<Record<string, number>>({})
const hasSortChanges = computed(() => Object.keys(sortChanges.value).length > 0)
const savingSort = ref(false)

/** 记录行排序变更（v-model 已直接改写 row.menuSort，此处仅登记待保存项） */
function handleSortChange(row: Menu.MenuItem) {
  sortChanges.value[row.id] = row.menuSort
}

async function handleSaveSort() {
  const items = Object.entries(sortChanges.value).map(([id, menuSort]) => ({ id, menuSort }))
  if (!items.length) return TipModal.msgWarning('未检测到排序修改')
  try {
    savingSort.value = true
    const message = await MenuRequest.updateSort(items)
    sortChanges.value = {}
    await getList()
    TipModal.msgSuccess(message || '排序成功')
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('handleSaveSort errMsg: ', errMsg)
    return Promise.reject(error)
  } finally {
    savingSort.value = false
  }
}
```

前端不预校验数值格式，交给后端 DTO；`getList` 后行数据整体替换，`sortChanges` 已清空，无悬挂引用。

## 模块差异适配

| 差异点 | 处理 |
| --- | --- |
| 树表（menu/dept） | 列表不分页，保存成功后直接 `getList()`；树表展开状态由 ProTable 自行处理 |
| 分页表（role） | 保存成功后 `getList()` 即可，无需动页码（排序不影响行数） |
| 带外层分组的表（dict-data 按 dictType/dictId 分组） | 变更集合 id 全局唯一，无分组冲突；保存后按该页现有刷新逻辑走 |
| 列已有「显示排序」纯文本列 | 替换该列为 slot 列，宽度 90 → 130 |
| service 未注入 DataSource | 补 `@InjectDataSource() private readonly dataSource: DataSource`（import 自 @nestjs/typeorm） |

## 验收清单

1. 后端 `npx tsc --noEmit -p tsconfig.json`、前端 `npx vue-tsc --noEmit` 全过；
2. 直接调接口传 `[]` → 返回「未检测到排序修改」；
3. 传非法排序值（如字符串）→ 返回「显示顺序必须是整数」；
4. 传含不存在 id → 返回「XX 不存在」，无部分写入；
5. 前端无变更时按钮禁用；改动后按钮点亮，保存成功提示并刷新，按钮复归禁用。
