---
title: Component Fallthrough Attributes Best Practices
display_title: 透传属性
impact: MEDIUM
impactDescription: Incorrect $attrs access and reactivity assumptions can cause undefined values and watchers that never run
type: best-practice
tags: [vue3, attrs, fallthrough-attributes, composition-api, reactivity]
---

# 透传属性（Fallthrough Attrs）

**影响：中** — 规则很简单：带连字符的属性用方括号取值，事件监听是 camelCase 的 `onXxx`，`useAttrs()` 拿的是最新值但**不是响应式的**。

> **本项目口径**：运行时 API 自动导入，示例不写 import。封装 `el-*` 基础组件时最常用到本文件。

## 任务清单

- 带连字符的属性名用方括号：`attrs['data-testid']`
- 事件监听用 camelCase `onXxx`：`attrs.onClick`
- 不要 `watch` `useAttrs()` 的返回值，它不会触发
- 属性变化驱动的副作用用 `onUpdated()`
- 需要响应式观察的常用属性，提升为 props

---

## 一、属性名与事件名的取值方式

```vue
<!-- 错误 -->
<script setup lang="ts">
const attrs = useAttrs()

console.log(attrs.data-testid) // 语法错误
console.log(attrs.dataTestid) // undefined
console.log(attrs['on-click']) // undefined
console.log(attrs['@click']) // undefined
</script>
```

```vue
<!-- 正确 -->
<script setup lang="ts">
const attrs = useAttrs()

console.log(attrs['data-testid'])
console.log(attrs['aria-label'])
console.log(attrs['foo-bar'])

console.log(attrs.onClick)
console.log(attrs.onCustomEvent)
console.log(attrs.onMouseEnter)
</script>
```

### 对照表

| 父组件写法 | `attrs` 中的取值 |
|---|---|
| `class="foo"` | `attrs.class` |
| `data-id="123"` | `attrs['data-id']` |
| `aria-label="..."` | `attrs['aria-label']` |
| `foo-bar="baz"` | `attrs['foo-bar']` |
| `@click="fn"` | `attrs.onClick` |
| `@custom-event="fn"` | `attrs.onCustomEvent` |
| `@update:modelValue="fn"` | `attrs['onUpdate:modelValue']` |

---

## 二、`useAttrs()` 不是响应式的

```vue
<!-- 错误：这两个监听都不会因属性变化触发 -->
<script setup lang="ts">
const attrs = useAttrs()

watch(
  () => attrs.someAttr,
  (newValue) => {
    console.log('变化：', newValue) // 不会执行
  },
)

watchEffect(() => {
  console.log(attrs.class) // 只在 setup 时跑一次
})
</script>
```

```vue
<!-- 正确：属性驱动的副作用放 onUpdated -->
<script setup lang="ts">
const attrs = useAttrs()

onUpdated(() => {
  console.log('最新 attrs：', attrs)
})
</script>
```

```vue
<!-- 正确：需要真正响应式观察，就提升为 prop -->
<script setup lang="ts">
const props = defineProps<{ someAttr: string }>()

watch(
  () => props.someAttr,
  (newValue) => {
    console.log('变化：', newValue)
  },
)
</script>
```

---

## 三、常用写法

### 安全判断可选属性

```vue
<script setup lang="ts">
const attrs = useAttrs()

const hasTestId = computed(() => 'data-testid' in attrs)
const ariaLabel = computed(() => attrs['aria-label'] ?? '默认标签')
</script>
```

### 内部控制后再转发事件

```vue
<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const attrs = useAttrs()

function handleClick(event: MouseEvent) {
  // 先走内部逻辑，再交给父组件
  attrs.onClick?.(event)
}
</script>

<template>
  <button @click="handleClick">
    <slot />
  </button>
</template>
```

项目里的 `ProTable`、`ProSearch` 这类封装组件如果想在内部拦截事件，就用这个模式。

---

## 四、TypeScript 提示

`useAttrs()` 的类型是 `Record<string, unknown>`，取值时按需断言：

```vue
<script setup lang="ts">
const attrs = useAttrs()

const testId = attrs['data-testid'] as string | undefined
const onClick = attrs.onClick as ((event: MouseEvent) => void) | undefined
</script>
```
