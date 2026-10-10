<template>
  <main class="app-main">
    <!-- key 采用 route.path 和 route.fullPath 有着不同的效果，大多数时候 path 更通用 -->
    <RouterView v-slot="{ Component, route }">
      <Transition :name="settingStore.transition" mode="out-in">
        <KeepAlive :include="tagsViewStore.cachedViews">
          <component :is="Component" :key="route.path" />
        </KeepAlive>
      </Transition>
    </RouterView>
  </main>
</template>

<script setup lang="ts">
defineOptions({ name: 'AppMain' })

const settingStore = useSettingStore()
const tagsViewStore = useTagsViewStore()
</script>

<style lang="scss" scoped>
.app-main {
  position: relative;
  width: 100%;
  min-height: 0;
  flex: 1;
  overflow-x: clip; // 用 clip 代替 hidden：既裁剪横向溢出，又不产生滚动容器，否则内部 sticky 会失效
  overflow-y: auto;
}

.fixed-header + .app-main {
  margin-top: var(--el-navbar-height);
}

.has-tags-view .fixed-header + .app-main {
  margin-top: calc(var(--el-navbar-height) + var(--el-tags-view-height));
}
</style>
