<template>
  <section class="pro-search" :class="[{ 'is-expanded': isExpanded }, `label-position--${labelPosition}`]">
    <el-form :model v-bind="$attrs" :labelPosition>
      <el-row :gutter>
        <el-col v-for="item in visibleFormItems" :key="item.prop" :xs="24" :sm="12" :md="span" :lg="span" :xl="span">
          <el-form-item :label="item.label">
            <slot :name="item.prop" :item="item" :model="model">
              <template v-if="item.type === 'input'">
                <el-input v-model.trim="model[item.prop]" :placeholder="getPlaceholder(item)" clearable />
              </template>
              <template v-else-if="item.type === 'select'">
                <el-select v-model="model[item.prop]" :placeholder="getPlaceholder(item)" clearable>
                  <el-option v-for="opt in toValue(item.options)" :key="opt.value" :label="opt.label" :value="opt.value" />
                </el-select>
              </template>
              <template v-else-if="item.type === 'date'">
                <el-date-picker v-model="model[item.prop]" type="date" value-format="YYYY-MM-DD" :placeholder="getPlaceholder(item)" />
              </template>
            </slot>
          </el-form-item>
        </el-col>

        <el-col :xs="24" :sm="24" :md="span" :lg="span" :xl="span" class="action-column">
          <el-form-item class="el-form-item--action">
            <el-button plain type="primary" @click="handleQuery">
              <template #icon> <SvgIcon name="Search" /> </template>
              <span>{{ searchButtonText }}</span>
            </el-button>
            <el-button plain type="danger" @click="resetQuery">
              <template #icon> <SvgIcon name="Refresh" /> </template>
              <span>{{ resetButtonText }}</span>
            </el-button>
            <div @click="toggleExpand" class="filter-toggle cursor-pointer select-none" v-if="shouldShowExpandToggle">
              <span>{{ isExpanded ? '收起' : '展开' }}</span>
              <SvgIcon :name="isExpanded ? 'ArrowUp' : 'ArrowDown'" />
            </div>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </section>
</template>

<script setup lang="ts">
defineOptions({ name: 'ProSearch' })
import { toValue } from 'vue'
import type { ProSearchItem, ProSearchProps } from './types'

const props = withDefaults(defineProps<ProSearchProps>(), {
  span: 6,
  gutter: 16,
  defaultExpanded: false,
  searchButtonText: '查询',
  resetButtonText: '重置',
  labelPosition: 'left',
})

const emit = defineEmits<{
  query: []
  reset: []
}>()

const model = defineModel<Record<string, any>>({ default: () => ({}) })
const isExpanded = ref<boolean>(props.defaultExpanded)

// 核心：计算收起时显示的输入项数量（每行3个）
const maxItemsPerRow = computed(() => Math.floor(24 / props.span) - 1)
const visibleItems = computed(() => props.items.filter((item) => !item.hidden))
const visibleFormItems = computed(() => (isExpanded.value ? visibleItems.value : visibleItems.value.slice(0, maxItemsPerRow.value)))
const shouldShowExpandToggle = computed(() => visibleItems.value.length > maxItemsPerRow.value)

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

function handleQuery() {
  emit('query')
}

function resetQuery() {
  props.items.forEach((item) => (model.value[item.prop] = undefined))
  emit('reset')
}

function getPlaceholder(item: ProSearchItem) {
  const prefix = item.type === 'input' ? '请输入' : '请选择'
  return prefix + (item.placeholder || item.label)
}
</script>

<style lang="scss" scoped>
.pro-search {
  --search-item-gap: 16px;
}

// 强制统一表单项的默认下边距
:deep() .el-form-item {
  margin-bottom: var(--search-item-gap);
  .el-date-editor {
    --el-date-editor-width: 100%;
  }
}

// 操作表单项
.el-form-item--action {
  display: flex;
  align-items: center;
  &.el-form-item--label-top {
    height: 100%;
    margin-top: 6px;
  }
}

:deep() .action-column {
  flex: 1;
  max-width: 100%;
  .el-form-item--action .el-form-item__content {
    display: flex;
    flex-wrap: nowrap; // 查询/重置/展开始终同行，容器再窄也不折行
    align-items: center;
    justify-content: flex-end;
    margin-left: auto !important; // 防止 label-width 影响对齐
    white-space: nowrap;
    gap: 8px;
    .el-button {
      margin-left: 0;
    }
    .filter-toggle {
      color: var(--el-color-primary);
      transition: color var(--el-transition-duration-fast);
    }
    .filter-toggle:hover {
      color: var(--el-color-primary-light-3);
    }
  }
}
</style>
