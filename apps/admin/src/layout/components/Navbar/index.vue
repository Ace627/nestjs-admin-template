<template>
  <div class="navbar">
    <!-- 侧栏折叠控制 -->
    <Hamburger class="navbar-item hover-effect" @toggleClick="appStore.toggleSidebar" />
    <!-- 面包屑导航 -->
    <Breadcrumb v-if="!appStore.isMobile && settingStore.showBreadcrumb" />

    <div class="navbar__right h-full ml-auto flex-center">
      <!-- 菜单搜索 -->
      <HeaderSearch />

      <!-- 设置入口 -->
      <el-tooltip content="系统设置" effect="dark" placement="bottom">
        <span class="navbar-item hover-effect" @click="settingStore.showSetting = true">
          <SvgIcon name="Setting" size="1.16em" />
        </span>
      </el-tooltip>

      <!-- 全屏控件 -->
      <el-tooltip :content="isFullscreen ? '退出全屏' : '全屏显示'" effect="dark" placement="bottom">
        <Screenfull class="navbar-item hover-effect" />
      </el-tooltip>

      <!-- 主题切换 -->
      <el-tooltip :content="settingStore.isDark ? '浅色主题' : '深色主题'" effect="dark" placement="bottom">
        <ThemeSwitch class="navbar-item hover-effect" />
      </el-tooltip>

      <!-- 个人中心 -->
      <UserDropDown class="navbar-item hover-effect" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'Navbar' })
import HeaderSearch from './HeaderSearch.vue'
import Hamburger from './Hamburger.vue'
import Screenfull from './Screenfull.vue'
import Breadcrumb from './Breadcrumb.vue'
import ThemeSwitch from './ThemeSwitch.vue'
import UserDropDown from './UserDropDown.vue'

const appStore = useAppStore()
const settingStore = useSettingStore()
const { isFullscreen } = useFullscreen()
</script>

<style lang="scss" scoped>
.navbar {
  position: relative;
  display: flex;
  align-items: center;
  height: var(--el-navbar-height);
  background-color: var(--el-navbar-bg-color);
  box-shadow: var(--el-navbar-box-shadow);
}
.navbar-item {
  cursor: pointer;
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 8px;
  transition: background-color var(--el-transition-duration-fast);
}
.hover-effect:hover {
  background-color: var(--el-fill-color);
}
</style>
