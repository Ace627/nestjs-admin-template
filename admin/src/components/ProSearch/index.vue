<template>
  <section class="pro-search" :class="[{ 'is-expanded': isExpanded }, `label-position--${labelPosition}`]">
    <el-form :model v-bind="$attrs" :labelPosition>
      <el-row :gutter class="search-row">
        <el-col v-for="item in visibleFormItems" :key="item.prop" :xs="24" :sm="12" :md="span" :lg="span" :xl="span">
          <el-form-item :label="item.label">
            <slot :name="item.prop" :item="item" :model="model">
              <template v-if="item.type === 'input'">
                <el-input v-model.trim="model[item.prop]" :placeholder="getPlaceholder(item)" clearable />
              </template>
              <template v-else-if="item.type === 'select'">
                <el-select v-model="model[item.prop]" :placeholder="getPlaceholder(item)" clearable>
                  <el-option v-for="option in getItemOptions(item)" :key="option.value" :label="option.label" :value="option.value" />
                </el-select>
              </template>
              <template v-else-if="item.type === 'date'">
                <el-date-picker v-model="model[item.prop]" type="date" value-format="YYYY-MM-DD" :placeholder="getPlaceholder(item)" />
              </template>
            </slot>
          </el-form-item>
        </el-col>
        <el-col class="search-actions-col" :xs="24" :sm="12" :md="actionsSpan" :lg="actionsSpan" :xl="actionsSpan">
          <div class="search-actions">
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
          </div>
        </el-col>
      </el-row>
    </el-form>
  </section>
</template>

<script setup lang="ts">
defineOptions({ name: 'ProSearch' })
import type { ProSearchItem, ProSearchProps } from './types'

const props = withDefaults(defineProps<ProSearchProps>(), {
  span: 6,
  gutter: 8,
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

// 展开态：按钮组占末行剩余跨度并右对齐，末行满员时独占一行
const itemsPerRow = computed(() => Math.floor(24 / props.span))
const actionsSpan = computed(() => {
  const remainder = visibleItems.value.length % itemsPerRow.value
  return remainder === 0 ? 24 : 24 - remainder * props.span
})

// options 可能是数组或 Ref，模板中不直接用 toValue（vue-tsc 无法解析模板里的 auto-import API）
function getItemOptions(item: ProSearchItem) {
  return toValue(item.options) ?? []
}

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
  // 按钮组宽度，收起态在右侧预留，保证按钮与首行输入项同排不折行
  --search-actions-width: 232px;
  position: relative;
}

// 强制统一表单项的默认下边距
:deep() .el-form-item {
  margin-bottom: var(--search-item-gap);
  .el-date-editor {
    --el-date-editor-width: 100%;
  }
}

// el-row 自带 position: relative，会劫持按钮组收起态的绝对定位锚点（锚到被 padding-right 收窄的内容区），
// 强制回 static 让按钮组重新锚定 .pro-search 的最右侧
.search-row {
  position: static;
}

// 操作按钮组：展开态位于末行剩余跨度内右对齐（末行满员则独占一行），收起态绝对定位右上角
.search-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: var(--search-item-gap);
  .el-button {
    margin-left: 0;
  }
  .filter-toggle {
    color: var(--el-color-primary);
    font-size: var(--el-font-size-base);
    transition: color var(--el-transition-duration-fast);
    &:hover {
      color: var(--el-color-primary-light-3);
    }
  }
}

.label-position--top:not(.is-expanded) .search-actions {
  top: 30px;
}

// 收起态：按钮组绝对定位右上角，与第一行输入项同排，右侧预留按钮宽度
.pro-search:not(.is-expanded) {
  padding-right: var(--search-actions-width);
  .search-actions {
    position: absolute;
    top: 0;
    right: 0;
    height: 32px;
    margin-bottom: 0;
  }
}

// 窄屏一律回到文档流
@media (max-width: 991px) {
  .pro-search:not(.is-expanded) {
    padding-right: 0;
    .search-actions {
      position: static;
      height: auto;
      margin-bottom: var(--search-item-gap);
    }
  }
}
</style>
