---
title: Teleport Component Best Practices
display_title: Teleport 弹层
impact: MEDIUM
impactDescription: Teleport renders content outside the component's DOM position which is essential for overlays but affects styling and layout
type: best-practice
tags: [vue3, teleport, modal, overlay, positioning]
---

# `<Teleport>`

**影响：中** — `<Teleport>` 把模板的一部分渲染到 DOM 的其他位置，同时保留 Vue 的组件层级。用于需要脱离层叠上下文、overflow 或 `position: fixed` 限制的浮层。

> **本项目口径**：
> - Element Plus 的 `el-dialog`、`el-drawer`、`el-tooltip`、`el-select` 下拉**已经内置 teleport**，不要重复包一层
> - 需要手写 `<Teleport>` 的场景是自绘浮层（自定义下拉、右键菜单、全屏遮罩）
> - `@vueuse/core` 的 API 自动导入，示例不写 import

## 任务清单

- 浮层 teleport 到 `body` 或 app 根节点之外的专用容器
- 同类 UI 共用一个目标容器（如 `#modals`、`#notifications`），用渲染顺序或 z-index 控制层级
- 小屏要渲染回原位的，用 `:disabled`
- 记住 props、emits、provide/inject 在 teleport 后依然有效
- 不要依赖父级的层叠上下文或 transform 定位 teleport 内容

---

## 一、脱离被 transform 的容器

祖先元素有 `transform`、`filter`、`perspective` 时，`position: fixed` 会退化成相对该祖先定位——浮层会错位。`<Teleport>` 能跳出这个上下文。

```vue
<!-- 错误：fixed 定位被 transform 的父级限制 -->
<template>
  <div class="animated-container">
    <el-button @click="isOpen = true">打开</el-button>

    <div v-if="isOpen" class="overlay">内容</div>
  </div>
</template>

<style lang="scss" scoped>
.animated-container {
  transform: translateZ(0);
}

.overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
}
</style>
```

```vue
<!-- 正确 -->
<template>
  <div class="animated-container">
    <el-button @click="isOpen = true">打开</el-button>

    <Teleport to="body">
      <div v-if="isOpen" class="overlay">内容</div>
    </Teleport>
  </div>
</template>
```

---

## 二、小屏渲染回原位：`:disabled`

```vue
<script setup lang="ts">
const isMobile = useMediaQuery('(max-width: 768px)')
</script>

<template>
  <Teleport to="body" :disabled="isMobile">
    <nav class="sidebar">导航</nav>
  </Teleport>
</template>
```

`useMediaQuery` 来自 `@vueuse/core`，自动导入。

---

## 三、组件层级不受影响

Teleport 只改 DOM 位置，不改组件树。props、emits、slots、provide/inject 全部照常工作：

```vue
<template>
  <Teleport to="body">
    <ChildPanel :message="message" @close="isOpen = false" />
  </Teleport>
</template>
```

---

## 四、多个 Teleport 指向同一目标

按声明顺序追加：

```vue
<template>
  <Teleport to="#notifications">
    <div>第一条</div>
  </Teleport>

  <Teleport to="#notifications">
    <div>第二条</div>
  </Teleport>
</template>
```

用一个共享容器保证层级可控，只在需要显式分层时才加 z-index。

---

## 项目实践建议

1. 优先用 `el-dialog` / `el-drawer`，它们自带 teleport、遮罩、焦点管理，不要手写弹窗再加 `<Teleport>`
2. 必须手写浮层时，目标容器统一用 `body`，避免 `#app` 上的 transform / overflow 影响
3. 浮层的样式要么不 scoped，要么用 `:deep()` 配合类名前缀，否则 scoped 属性选择器可能匹配不到 teleport 后的节点
