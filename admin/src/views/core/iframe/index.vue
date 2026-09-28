<!-- 菜单 component 配置 core/iframe/index 可复用本组件实现站内 iframe 页面 -->
<template>
  <div v-loading="loading" class="iframe-container">
    <iframe :src="link" frameborder="0" class="iframe-view" @load="loading = false" />
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'IframeView' })

const route = useRoute()
/** 外链地址（外链菜单由 router.helper 写入 meta.link） */
const link = computed(() => route.meta.link ?? '')
/** iframe 加载遮罩 */
const loading = ref(true)
</script>

<style lang="scss" scoped>
.iframe-container {
  position: absolute;
  inset: 0;
  /* 建立层叠上下文，把 v-loading 遮罩（z-index:2000）锁在自身内，避免盖过 fixed-header（z-index:999） */
  z-index: 0;
}
.iframe-view {
  width: 100%;
  height: 100%;
  border: 0;
}
</style>
