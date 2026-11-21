---
title: Render Function Patterns and Performance
display_title: 渲染函数（降级选项）
impact: MEDIUM
impactDescription: Render functions require explicit patterns for lists events v-model and performance to stay correct and maintainable
type: best-practice
tags: [vue3, render-function, h, v-model, directives, performance]
---

# 渲染函数（降级选项）

**影响：中** — 渲染函数会放弃模板编译期的优化，且可读性明显下降。

> **本项目定位**：**默认不使用**。只有当模板（含插槽、`v-for`、`v-if`、动态组件、`<component :is>`）确实无法表达需求时才用。
> 常见可用替代：`<component :is="xxx" />`、具名插槽、`v-for` + `v-if`、`<template v-for>`。
> `h`、`withModifiers`、`withKeys`、`withDirectives` 都是自动导入的运行时 API，示例不写 import。

## 任务清单

- 优先模板，渲染函数作为兜底
- `h()` 渲染列表必须给稳定 `key`
- 事件修饰符用 `withModifiers` / `withKeys`
- 渲染函数里的 `v-model` 要显式写 `modelValue` + `onUpdate:modelValue`
- 自定义指令用 `withDirectives`
- 无状态的展示型 UI 可用函数式组件

---

## 一、优先模板

```vue
<!-- 错误：能用模板就不要写渲染函数 -->
<script setup lang="ts">
const count = ref(0)
const renderContent = () => h('div', `数量：${count.value}`)
</script>
```

```vue
<!-- 正确 -->
<script setup lang="ts">
const count = ref(0)
</script>

<template>
  <div>数量：{{ count }}</div>
</template>
```

真正需要 `h()` 的典型场景：

- 需要根据配置动态生成任意层级的结构（如递归菜单、动态表单 schema）
- 需要在函数式组件里做轻量包装，且不想产生 SFC 文件
- 表格列的自定义渲染器

---

## 二、列表必须有 `key`

```ts
// 错误
const renderList = () =>
  h(
    'ul',
    items.value.map((item) => h('li', item.name)),
  )
```

```ts
// 正确
const renderList = () =>
  h(
    'ul',
    items.value.map((item) => h('li', { key: item.id }, item.name)),
  )
```

---

## 三、事件修饰符

```ts
// 错误：手动调 stopPropagation / preventDefault
const handleClick = (event: MouseEvent) => {
  event.stopPropagation()
  event.preventDefault()
}

const renderButton = () => h('button', { onClick: handleClick }, '点击')
```

```ts
// 正确
const handleClick = () => {}
const handleEnter = () => {}

const renderActions = () =>
  h('div', [
    h('button', { onClick: withModifiers(handleClick, ['stop', 'prevent']) }, '点击'),
    h('input', { onKeyup: withKeys(handleEnter, ['enter']) }),
  ])
```

---

## 四、渲染函数里的 `v-model`

模板里的 `v-model` 是语法糖；渲染函数里必须显式写出 prop 与更新回调。这与项目"用 `defineModel`"的规定不冲突——那是**定义组件**时的写法，这里是**使用组件**时的写法。

注意 Element Plus 组件在渲染函数里**必须显式 import**——`unplugin-vue-components` 只处理模板里的 `<el-*>`，管不到 `h(ElInput, ...)`。

```ts
import { ElInput } from 'element-plus'

// 错误：只有 modelValue，输入无法回写
h(ElInput, { modelValue: text.value })

// 正确
h(ElInput, {
  modelValue: text.value,
  'onUpdate:modelValue': (nextValue: string) => {
    text.value = nextValue
  },
})
```

---

## 五、自定义指令

```ts
// 错误：指令名当普通属性传
h('input', { 'v-focus': true })
```

```ts
// 正确
const vFocus = { mounted: (element: HTMLElement) => element.focus() }

withDirectives(h('input'), [[vFocus]])
```

---

## 六、函数式组件

无状态、只做展示的包装可以用函数式组件：

```ts
import type { FunctionalComponent } from 'vue'

/** 无状态徽标：只做展示，不持有状态 */
const Badge: FunctionalComponent<{ variant: string }> = (props, { slots }) =>
  h('span', { class: `badge badge-${props.variant}` }, slots.default?.())

export default Badge
```

需要状态、生命周期或响应式时，写普通 SFC，不要用函数式组件。

---

## 项目提示

- 表格自定义列优先用 `ProTable` 的插槽，不要为每一列写渲染函数
- 需要按配置生成表单时，先确认是否已有可复用的 schema 驱动组件，再考虑 `h()`
- 渲染函数里访问响应式数据同样要用 `.value`
