<template>
  <div class="header-search navbar-item hover-effect">
    <ProTooltip content="菜单搜索" placement="bottom">
      <span class="search-trigger" @click="handleOpen">
        <SvgIcon name="Search" size="1.16em" />
      </span>
    </ProTooltip>

    <el-dialog v-model="visible" width="600px" :show-close="false" class="header-search__dialog" @opened="inputRef?.focus()" @closed="handleClosed">
      <el-input ref="inputRef" v-model.trim="keyword" placeholder="搜索菜单 支持标题或路径" clearable @keydown.up.prevent="handleNavigate(-1)" @keydown.down.prevent="handleNavigate(1)" @keydown.enter.prevent="handleEnter" />

      <el-scrollbar max-height="400px" class="header-search__list">
        <template v-if="options.length > 0">
          <template v-for="(item, index) in options" :key="item.path">
            <div v-if="item.isGroup" class="group-title" @mousemove="activeIndex = -1">
              <SvgIcon :name="item.icon ?? 'Menu'" />
              <span>{{ item.title }}</span>
            </div>
            <div v-else :class="['search-item', { 'is-active': index === activeIndex }]" @mousemove="activeIndex = index" @click="handleChange(item)">
              <SvgIcon :name="item.icon ?? 'Menu'" class="search-item__icon" />
              <span class="search-item__title">
                <template v-for="(part, partIndex) in splitHighlight(item.title)" :key="partIndex">
                  <span v-if="part.hit" class="highlight">{{ part.text }}</span>
                  <template v-else>{{ part.text }}</template>
                </template>
              </span>
              <span class="search-item__path">{{ item.path }}</span>
            </div>
          </template>
        </template>
        <el-empty v-else description="未找到相关菜单" :image-size="60" />
      </el-scrollbar>

      <div class="header-search__footer">
        <span><kbd>↑</kbd><kbd>↓</kbd> 切换</span>
        <span><kbd>Enter</kbd> 选择</span>
        <span><kbd>Esc</kbd> 关闭</span>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'HeaderSearch' })
import { isExternal } from '@/utils'
import type { RouteRecordRaw } from 'vue-router'
import { resolvePath } from '@/router/router.helper'

interface SearchItem {
  /** 父级逐层拼接的完整标题，如「系统管理 / 用户管理」 */
  title: string
  /** 完整跳转路径 */
  path: string
  /** 菜单图标（SvgIcon 名） */
  icon?: string
  /** 是否外链 */
  isExternal: boolean
  /** 目录路由仅作为分组标题展示，不可选中跳转 */
  isGroup: boolean
}

const router = useRouter()
const permissionStore = usePermissionStore()

const visible = ref(false)
const keyword = ref('')
const inputRef = useTemplateRef('inputRef')
const activeIndex = ref(-1)

/** 扁平化路由表构建搜索池（跳过 hidden 项，目录作为分组标题保留） */
const searchPool = computed<SearchItem[]>(() => {
  const pool: SearchItem[] = []
  flattenRoutes(permissionStore.sidebarRoutes)
  return pool

  function flattenRoutes(routes: RouteRecordRaw[], basePath = '', prefixTitle: string[] = []) {
    for (const route of routes) {
      if (route.meta?.hidden) continue

      const titleList = [...prefixTitle, route.meta?.title ?? ''].filter(Boolean)
      if (isExternal(route.path)) {
        pool.push({ title: titleList.join(' / '), path: route.path, icon: route.meta?.icon, isExternal: true, isGroup: false })
        continue
      }

      const fullPath = resolvePath(route.path, basePath)
      if (route.children?.length) {
        // 目录路由：仅作为分组标题，不可选中
        if (titleList.length > 0) {
          pool.push({ title: titleList.join(' / '), path: fullPath, icon: route.meta?.icon, isExternal: false, isGroup: true })
        }
        flattenRoutes(route.children, fullPath, titleList)
      } else if (titleList.length > 0) {
        pool.push({ title: titleList.join(' / '), path: fullPath, icon: route.meta?.icon, isExternal: false, isGroup: false })
      }
    }
  }
})

/** 纯 includes 子串过滤：标题或路径任一命中 */
const options = computed<SearchItem[]>(() => {
  const query = keyword.value.trim().toLowerCase()
  if (!query) return searchPool.value
  return searchPool.value.filter((item) => item.title.toLowerCase().includes(query) || item.path.toLowerCase().includes(query))
})

/** 搜索结果变化时默认选中第一个可选项 */
watch(options, () => {
  activeIndex.value = options.value.findIndex((item) => !item.isGroup)
})

function handleOpen() {
  visible.value = true
}

function handleClosed() {
  keyword.value = ''
  activeIndex.value = -1
}

/** ↑↓ 循环切换，跳过分组标题 */
function handleNavigate(direction: -1 | 1) {
  const selectableIndexes = options.value.map((item, index) => (item.isGroup ? -1 : index)).filter((index) => index !== -1)
  if (selectableIndexes.length === 0) return
  const current = selectableIndexes.indexOf(activeIndex.value)
  const next = current === -1 ? 0 : (current + direction + selectableIndexes.length) % selectableIndexes.length
  activeIndex.value = selectableIndexes[next]
}

function handleEnter() {
  const item = options.value[activeIndex.value]
  if (item) handleChange(item)
}

function handleChange(item: SearchItem) {
  if (item.isGroup) return
  visible.value = false
  if (item.isExternal) {
    window.open(item.path, '_blank')
  } else {
    router.push(item.path)
  }
}

/** 关键词高亮分段（正则元字符转义防注入） */
function splitHighlight(text: string): { text: string; hit: boolean }[] {
  const query = keyword.value.trim()
  if (!query) return [{ text, hit: false }]
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text
    .split(new RegExp(`(${escaped})`, 'gi'))
    .filter(Boolean)
    .map((part) => ({ text: part, hit: part.toLowerCase() === query.toLowerCase() }))
}
</script>

<style lang="scss" scoped>
.search-trigger {
  display: flex;
  align-items: center;
  height: 100%;
  cursor: pointer;
}

:deep(.header-search__dialog) {
  .el-dialog__header {
    display: none;
  }
  .el-dialog__body {
    padding: 16px;
  }
}

.header-search__list {
  margin-top: 12px;
}

.group-title {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  cursor: default;
  user-select: none;
}

.search-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color var(--el-transition-duration-fast);

  &.is-active {
    background-color: var(--el-color-primary);
    color: var(--el-color-white);

    .search-item__path {
      color: var(--el-color-white);
    }
    .highlight {
      color: var(--el-color-white);
      opacity: 0.8;
    }
  }

  &__icon {
    flex-shrink: 0;
  }
  &__title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  &__path {
    flex-shrink: 0;
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.highlight {
  color: var(--el-color-primary);
  font-weight: 600;
}

.header-search__footer {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);

  kbd {
    padding: 1px 5px;
    border: 1px solid var(--el-border-color);
    border-radius: 3px;
    background-color: var(--el-fill-color-light);
    font-size: 11px;
    margin-right: 2px;
  }
}
</style>
