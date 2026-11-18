<template>
  <div class="loading-page">
    <div v-for="item in loadingItems" :key="item.title" class="loading-page__card">
      <div class="loading-page__card-header">{{ item.title }}</div>
      <div class="loading-page__stage">
        <component :is="item.component" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Loading01 from './components/Loading01.vue'
import Loading02 from './components/Loading02.vue'
import Loading03 from './components/Loading03.vue'
import Loading04 from './components/Loading04.vue'
import Loading05 from './components/Loading05.vue'
import Loading06 from './components/Loading06.vue'

// 新增效果：在 components 下建组件，并在此数组追加一项即可
const loadingItems = [
  { title: '加载效果01', component: Loading01 },
  { title: '加载效果02', component: Loading02 },
  { title: '加载效果03', component: Loading03 },
  { title: '加载效果04', component: Loading04 },
  { title: '加载效果05', component: Loading05 },
  { title: '加载效果06', component: Loading06 },
]
</script>

<style lang="scss" scoped>
.loading-page {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: calc((100% - 8px) / 2);
  gap: 8px;
  padding: 16px;
  overflow-y: auto;

  &__card {
    position: relative;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    background: var(--el-bg-color-overlay);
    border: 2px solid var(--el-border-color);
    box-shadow: var(--el-box-shadow);
    border-radius: 8px;
  }

  &__card-header {
    position: absolute;
    top: 12px;
    left: 16px;
    z-index: 10;
    color: var(--el-text-color-primary);
    font-size: 14px;
    font-weight: 500;
    pointer-events: none;
  }

  &__stage {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }
}

html[data-device='mobile'] {
  .loading-page {
    position: relative;
    inset: auto;
    grid-template-columns: 1fr;
    grid-auto-rows: 220px;
    height: auto;
    padding: 12px;
  }
}
</style>
