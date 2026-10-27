<template>
  <div class="icon-select-container">
    <el-input v-model="name" clearable placeholder="请输入图标名称" @clear="filterIcons" @input="filterIcons" class="mb-10px">
      <template #prefix> <SvgIcon name="Search" /> </template>
    </el-input>

    <div class="icon-list grid gap-4px">
      <div class="icon-item" v-for="(name, i) in iconList" :key="i" @click="selectedIcon(name)" :class="{ active: activeIcon === name }">
        <SvgIcon :name />
        <span class="icon-title">{{ name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'IconSelect' })

/** 接受父组件传递的属性 */
defineProps({ activeIcon: { type: String } })

/** 接受父组件传递的事件 */
const emits = defineEmits(['selected'])

const iconNameList = ref<string[]>([])
/** 选中图标的名称 */
const name = ref<string>('')
/** 阿里字体图标列表 */
const iconList = ref(iconNameList.value)

function getList() {
  const modules: Record<string, any> = import.meta.glob('@/assets/svg-icons/*.svg')
  for (const key in modules) {
    const iconName = key.match(/\/([^\/]+)\.svg$/)?.[1]
    if (!iconName) continue
    iconNameList.value.push(iconName)
  }
}

/** 根据关键字筛选图标 */
function filterIcons() {
  iconList.value = iconNameList.value
  if (name.value) {
    iconList.value = iconList.value.filter((item) => item.includes(name.value))
  }
}

/** 处理选中图标的操作 */
function selectedIcon(name: string) {
  emits('selected', name)
  setTimeout(() => document.body.click(), 0)
}

/** 重置 */
function reset() {
  name.value = ''
  iconList.value = iconNameList.value
}

getList()

/** 暴露组件的方法属性 便于父组件访问 */
defineExpose({ reset })
</script>

<style lang="scss" scoped>
.icon-select-container {
  width: 100%;
  padding: 10px;
  .icon-list {
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    max-height: 200px;
    overflow-x: hidden;
    overflow-y: auto;
    .icon-item {
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 4px 8px;
      border-radius: 4px;
      transition: background-color 0.28s;
      .svg-icon {
        flex-shrink: 0;
        margin-right: 4px;
        font-size: 16px;
      }
      .icon-title {
        font-size: 12px;
      }
      &:hover {
        background-color: var(--el-color-primary-light-9);
      }
      &.active {
        background-color: var(--el-color-primary-light-9);
        border-radius: 5px;
        color: var(--el-color-primary);
      }
    }
  }
}
</style>
