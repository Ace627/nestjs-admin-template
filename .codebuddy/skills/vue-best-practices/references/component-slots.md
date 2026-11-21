---
title: Component Slots Best Practices
display_title: 组件插槽
impact: MEDIUM
impactDescription: Poor slot API design causes empty DOM wrappers weak TypeScript safety brittle defaults and unnecessary component overhead
type: best-practice
tags: [vue3, slots, components, typescript]
---

# 组件插槽

**影响：中** — 插槽是组件的核心 API 面。设计得当，模板才可预测、有类型、无冗余节点。

> **本项目口径**：运行时 API 与 `src/hooks/` 的导出自动导入，示例不写 import。详见 `../SKILL.md`。

## 任务清单

- 具名插槽用简写 `#name`，不写 `v-slot:name`
- 可选插槽的外层包裹元素用 `$slots` 判断后再渲染
- TypeScript 组件用 `defineSlots` 声明作用域插槽契约
- 可选插槽提供默认内容
- 纯逻辑复用优先用 hook，不要做无渲染组件

---

## 一、具名插槽用简写

```vue
<!-- 错误 -->
<ProTable>
  <template v-slot:action="{ row }"> ... </template>
</ProTable>
```

```vue
<!-- 正确 -->
<ProTable>
  <template #action="{ row }"> ... </template>
</ProTable>
```

---

## 二、可选插槽的包裹元素按需渲染

当包裹元素带间距、边框或布局约束时，没有插槽内容就不要渲染它，否则会留下空节点撑开布局。

```vue
<!-- 错误：父组件没传 footer，footer 依然占位 -->
<template>
  <article class="card">
    <header class="card-header">
      <slot name="header" />
    </header>

    <section class="card-body">
      <slot />
    </section>

    <footer class="card-footer">
      <slot name="footer" />
    </footer>
  </article>
</template>
```

```vue
<!-- 正确 -->
<template>
  <article class="card">
    <header v-if="$slots.header" class="card-header">
      <slot name="header" />
    </header>

    <section v-if="$slots.default" class="card-body">
      <slot />
    </section>

    <footer v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </footer>
  </article>
</template>
```

模板里用 `$slots`，`script` 里用 `useSlots()`。

---

## 三、用 `defineSlots` 声明作用域插槽类型

```vue
<!-- 错误：消费者拿到的插槽参数是 any -->
<script setup lang="ts">
interface Product {
  id: string
  name: string
}

defineProps<{ products: Product[] }>()
</script>

<template>
  <ul>
    <li v-for="(product, index) in products" :key="product.id">
      <slot :product="product" :index="index" />
    </li>
  </ul>
</template>
```

```vue
<!-- 正确 -->
<script setup lang="ts">
interface Product {
  id: string
  name: string
}

defineProps<{ products: Product[] }>()

defineSlots<{
  default(props: { product: Product; index: number }): unknown
  empty(): unknown
}>()
</script>

<template>
  <ul v-if="products.length">
    <li v-for="(product, index) in products" :key="product.id">
      <slot :product="product" :index="index" />
    </li>
  </ul>
  <slot v-else name="empty" />
</template>
```

项目里的 `ProTable` 是重插槽组件，但它的列插槽名由 `columns[].slot` 动态决定（列配 `slot: 'action'`，页面写 `#action`），**无法用 `defineSlots` 静态声明**。`defineSlots` 只适用于插槽名固定的组件。

---

## 四、可选插槽给默认内容

```vue
<!-- 错误：父组件不传就渲染出空按钮 -->
<template>
  <el-button type="primary" native-type="submit">
    <slot />
  </el-button>
</template>
```

```vue
<!-- 正确 -->
<template>
  <el-button type="primary" native-type="submit">
    <slot>确定</slot>
  </el-button>
</template>
```

---

## 五、纯逻辑复用用 hook，不要做无渲染组件

```vue
<!-- 错误：为复用鼠标坐标做一个无渲染组件 -->
<script setup lang="ts">
const pageX = ref(0)
const pageY = ref(0)

function handleMouseMove(event: MouseEvent) {
  pageX.value = event.pageX
  pageY.value = event.pageY
}

onMounted(() => window.addEventListener('mousemove', handleMouseMove))
onUnmounted(() => window.removeEventListener('mousemove', handleMouseMove))
</script>

<template>
  <slot :page-x="pageX" :page-y="pageY" />
</template>
```

```ts
// 正确：src/hooks/useMouse.ts
export function useMouse() {
  const pageX = ref(0)
  const pageY = ref(0)

  function handleMouseMove(event: MouseEvent) {
    pageX.value = event.pageX
    pageY.value = event.pageY
  }

  onMounted(() => window.addEventListener('mousemove', handleMouseMove))
  onUnmounted(() => window.removeEventListener('mousemove', handleMouseMove))

  return { pageX, pageY }
}
```

```vue
<!-- 使用：把上面这段放进 src/hooks/useMouse.ts 后自动导入，页面里不要写 import -->
<script setup lang="ts">
const { pageX, pageY } = useMouse()
</script>

<template>
  <p>{{ pageX }}, {{ pageY }}</p>
</template>
```

例外：插槽驱动的组合（父组件要控制子组件的结构与布局）仍然适合用组件，`src/components/ProTable` 就是这类。
