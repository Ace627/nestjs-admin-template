<template>
  <div class="right-toolbar flex items-center">
    <!-- 隐藏/显示搜索区域 -->
    <ProTooltip v-if="search" :content="showSearch ? '隐藏搜索' : '显示搜索'">
      <el-button circle @click="emit('update:showSearch', !showSearch)">
        <template #icon><SvgIcon name="Search" /></template>
      </el-button>
    </ProTooltip>
    <!-- 刷新列表 -->
    <ProTooltip content="刷新列表">
      <el-button circle @click="emit('refresh')">
        <template #icon><SvgIcon name="Refresh" /></template>
      </el-button>
    </ProTooltip>
    <!-- 配置展示列（ProTooltip 须包在 el-dropdown 外侧：el-dropdown 根节点是单一 div，事件/ref 才能透传） -->
    <ProTooltip v-if="selectableColumns.length" content="各列显隐">
      <el-dropdown trigger="click" :hide-on-click="false">
        <el-button circle>
          <template #icon><SvgIcon name="Menu" /></template>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <div class="column-setting">
              <el-checkbox v-model="checkAll" :indeterminate="isIndeterminate">列展示</el-checkbox>
              <el-divider />
              <el-checkbox-group v-model="checkedColumnKeys" class="flex flex-col" @change="commit">
                <el-checkbox v-for="column in selectableColumns" :key="column.key" :value="column.key">{{ column.label }}</el-checkbox>
              </el-checkbox-group>
            </div>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </ProTooltip>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'RightToolbar' })
import { getColumnHidden, setColumnHidden } from '@/utils'
import type { ProTableColumn, RightToolbarProps } from '@/types'

const props = withDefaults(defineProps<RightToolbarProps>(), {
  search: true,
  showSearch: true,
  columns: () => [],
  hiddenColumnKeys: () => [],
  storageKey: '',
})

const emit = defineEmits<{
  'update:showSearch': [value: boolean]
  'update:hiddenColumnKeys': [value: string[]]
  refresh: []
}>()

/**
 * 生成列的唯一标识（与 ProTable 内同名函数逻辑一致，改动时须两处同步）
 * 优先级：type > prop > slot > column-${index}
 */
function generateColumnKey(column: ProTableColumn, index: number) {
  return column.type || column.prop || column.slot || `column-${index}`
}

/** 可勾选列：排除 selection/index 系统列与操作列（slot 为 action 或固定右侧带插槽的末列） */
const selectableColumns = computed(() => {
  const result: { key: string; label: string }[] = []
  props.columns.forEach((column, index) => {
    if (column.type === 'selection' || column.type === 'index') return
    if (column.slot === 'action') return
    if (column.fixed === 'right' && column.slot) return
    const key = generateColumnKey(column, index)
    result.push({ key, label: column.label || column.prop || key })
  })
  return result
})

const allKeys = computed(() => selectableColumns.value.map((column) => column.key))

/** 读取记忆的隐藏列（未传 storageKey 时回退到父页面状态） */
function loadStoredHiddenKeys(): string[] {
  if (!props.storageKey) return props.hiddenColumnKeys
  const cachedColumnKeys = getColumnHidden(props.storageKey)
  return Array.isArray(cachedColumnKeys) ? cachedColumnKeys : props.hiddenColumnKeys
}

const checkedColumnKeys = ref<string[]>(allKeys.value.filter((key) => !loadStoredHiddenKeys().includes(key)))

// 初始状态同步给父页面（本组件位于 ProTable 之前渲染，先于表格应用显隐，无闪列）
emit(
  'update:hiddenColumnKeys',
  allKeys.value.filter((key) => !checkedColumnKeys.value.includes(key)),
)

// 父页面显隐状态变化时反向同步勾选框
watch(
  () => props.hiddenColumnKeys,
  (hiddenColumnKeys) => {
    checkedColumnKeys.value = allKeys.value.filter((key) => !hiddenColumnKeys.includes(key))
  },
)

const checkAll = computed({
  get: () => allKeys.value.length > 0 && checkedColumnKeys.value.length === allKeys.value.length,
  set: (checked) => {
    checkedColumnKeys.value = checked ? [...allKeys.value] : []
    commit()
  },
})
const isIndeterminate = computed(() => checkedColumnKeys.value.length > 0 && checkedColumnKeys.value.length < allKeys.value.length)

/** 勾选变化 → 计算隐藏列并同步父页面与本地记忆 */
function commit() {
  const hiddenColumnKeys = allKeys.value.filter((key) => !checkedColumnKeys.value.includes(key))
  emit('update:hiddenColumnKeys', hiddenColumnKeys)
  if (props.storageKey) setColumnHidden(props.storageKey, hiddenColumnKeys)
}
</script>

<style lang="scss" scoped>
.right-toolbar {
  --right-toolbar-item-gap: 4px; // 操作按钮间的间距
  gap: var(--right-toolbar-item-gap);
  .el-button + .el-button {
    margin-left: 0;
  }
}

.column-setting {
  padding: 4px 12px 8px;
  min-width: 140px;

  :deep(.el-divider) {
    margin: 4px 0;
  }

  :deep(.el-checkbox) {
    display: flex;
    margin-right: 0;
  }
}
</style>
