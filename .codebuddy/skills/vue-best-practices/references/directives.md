---
title: Directive Best Practices
display_title: 自定义指令
impact: MEDIUM
impactDescription: Custom directives are powerful but easy to misuse following patterns prevents leaks invalid usage and unclear abstractions
type: best-practice
tags: [vue3, directives, custom-directives, composition, typescript]
---

# 自定义指令

**影响：中** — 指令用于底层 DOM 访问。少用、保证副作用安全，能用组件或 hook 表达的就不要写指令。

> **本项目口径**：
> - 指令统一放 `src/directives/modules/`，在 `src/directives/index.ts` 的 `setupDirectives(app)` 中注册
> - 已有校验指令 `v-permissions`、`v-roles`（`src/directives/modules/permissions.ts`、`roles.ts`），无权限时移除元素
> - 项目是纯 SPA，**没有 SSR**，本文件末尾的 `getSSRProps` 一节不适用
> - 运行时 API 自动导入，示例不写 import

## 任务清单

- 只有需要直接操作 DOM 时才用指令
- 不要修改指令的 `binding` 对象或参数
- 定时器、监听器、观察器必须在 `unmounted` 清理
- `<script setup>` 内的局部指令用 `v` 前缀命名
- TypeScript 项目给指令值加类型
- 复杂行为优先用组件或 hook

---

## 一、`binding` 只读

指令的 `binding` 不是响应式存储，不要往里写。

```ts
const vFocus = {
  mounted(element: HTMLElement) {
    element.focus()
  },
}
```

---

## 二、不要在组件上用指令

指令作用于 DOM 元素。用在组件上会挂到组件根元素，根元素一换就失效。

```vue
<!-- 错误 -->
<MyInput v-focus />
```

```vue
<!-- 正确：指令写在组件内部的真实元素上 -->
<script setup lang="ts">
const vFocus = (element: HTMLInputElement) => element.focus()
</script>

<template>
  <el-input ref="inputRef" />
</template>
```

对 Element Plus 组件，更稳的做法是通过组件 ref 调 `focus()`：`inputRef.value?.focus()`。

---

## 三、副作用在 `unmounted` 清理

```ts
import type { Directive } from 'vue'

/** 元素与 observer 的关联，避免往 DOM 对象上挂属性 */
const elementResizeObserverMap = new WeakMap<HTMLElement, ResizeObserver>()

export const vResize: Directive<HTMLElement, void> = {
  mounted(element: HTMLElement) {
    const observer = new ResizeObserver(() => {
      // 处理尺寸变化
    })
    observer.observe(element)
    elementResizeObserverMap.set(element, observer)
  },
  unmounted(element: HTMLElement) {
    elementResizeObserverMap.get(element)?.disconnect()
    elementResizeObserverMap.delete(element)
  },
}
```

不要往 `element` 上挂自定义属性（`element._observer = ...`），用 `WeakMap` 存关联数据，避免污染 DOM 对象、也避免内存泄漏。

---

## 四、只有 `mounted` 时用函数简写

```ts
const vAutofocus = (element: HTMLElement) => element.focus()
```

---

## 五、`<script setup>` 内用 `v` 前缀

```vue
<script setup lang="ts">
const vFocus = (element: HTMLElement) => element.focus()
</script>

<template>
  <input v-focus />
</template>
```

全局指令则在 `src/directives/modules/` 里导出 `mounted` / `updated` / `unmounted` 对象，并在 `src/directives/index.ts` 注册。

---

## 六、TypeScript 类型

```ts
import type { Directive } from 'vue'

/** 指令值类型：高亮色值 */
type HighlightValue = string

export const vHighlight: Directive<HTMLElement, HighlightValue> = {
  mounted(element: HTMLElement, binding) {
    element.style.backgroundColor = binding.value
  },
}
```

需要模板里有类型提示时，补充模块声明：

```ts
declare module 'vue' {
  interface ComponentCustomProperties {
    vHighlight: typeof vHighlight
  }
}

export {}
```

---

## 七、能不用就不用

标准属性或绑定能解决就用绑定：

```vue
<!-- 不需要写指令 -->
<el-input :disabled="isReadonly" />
```

判断标准：

| 需求 | 用什么 |
|---|---|
| 只影响 DOM 行为（聚焦、拖拽、权限隐藏节点） | 指令 |
| 影响结构、状态或渲染结果 | 组件 |
| 只是复用有状态的逻辑 | `src/hooks/` |
| 只是样式或属性 | 模板绑定 / class |

---

## 项目现状

已有两个校验指令，无对应权限/角色时**直接移除元素**（不是 `display: none`）：

```vue
<!-- 按权限编码 -->
<el-button v-permissions="['system:user:add']" type="primary">新增</el-button>

<!-- 按角色标识 -->
<el-button v-roles="['editor']">编辑</el-button>
```

要点：

- 绑定值必须是**字符串数组**。写成字符串只会 `console.warn` 然后跳过校验，元素照常显示（fail-soft）
- 空数组 `[]` 同样跳过校验
- 指令同时挂在 `mounted` 与 `updated` 上，权限数据异步到达后仍能生效

新增指令时保持同样的组织方式：`src/directives/modules/xxx.ts` 导出指令对象，`src/directives/index.ts` 里 `app.directive('xxx', 指令对象)` 注册（注册名不带 `v-` 前缀）。
