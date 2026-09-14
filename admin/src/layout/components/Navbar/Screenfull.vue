<template>
  <div @click.stop="toggle">
    <SvgIcon :size="20" :name="isFullscreen ? 'ExitFullScreen' : 'FullScreen'" />
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'Screenfull' })

const { toggle, isFullscreen } = useFullscreen()
</script>

<style lang="scss" scoped></style>
