<template>
  <div @click="toggle">
    <SvgIcon :name="settingStore.isDark ? 'Moon' : 'Sunny'" size="1.16em" />
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'ThemeSwitch' })

const { toggle } = useTheme()
const settingStore = useSettingStore()
</script>

<style lang="scss" scoped></style>
