---
title: Use v-once and v-memo to Skip Unnecessary Updates
display_title: v-once 与 v-memo
impact: MEDIUM
impactDescription: v-once skips all future updates for runtime-bound content that never changes v-memo conditionally memoizes subtrees
type: efficiency
tags: [vue3, performance, v-once, v-memo, optimization, directives]
---

# `v-once` 与 `v-memo`

**影响：中** — 组件重渲染时会为模板中的动态部分重新创建 VNode。内容永不变化或极少变化的子树，可以用 `v-once` / `v-memo` 复用上一次的 VNode，跳过创建与 diff。

用于「用到运行时数据但永不更新」的内容，或**经性能分析确认**是瓶颈的列表渲染。依赖写不全会导致数据不更新。

> **本项目口径**：这两个是兜底优化手段，功能完成后才考虑。不要预防性地加。

## 任务清单

- 用到运行时数据但永不更新的块用 `v-once`
- `v-memo` 只在 profiling 确认列表渲染昂贵时使用
- 依赖必须覆盖「输出会随之变化」的所有值：整体替换要带 `item`，就地改字段要带 `item.xxx`
- 加完必须验证更新仍然正确，再用 DevTools 确认有实际收益

---

## 一、`v-once`：渲染一次，永不更新

```vue
<!-- 错误：这些内容不会变，但每次重渲染都在重建 VNode -->
<template>
  <div class="terms-content">
    <h1>服务条款</h1>
    <p>版本：{{ termsVersion }}</p>
  </div>

  <footer>
    <p>Copyright {{ copyrightYear }} {{ companyName }}</p>
  </footer>
</template>
```

```vue
<!-- 正确 -->
<script setup lang="ts">
const termsVersion = '2.1'
const copyrightYear = 2026
const companyName = 'Acme Corp'
</script>

<template>
  <div v-once class="terms-content">
    <h1>服务条款</h1>
    <p>版本：{{ termsVersion }}</p>
  </div>

  <footer v-once>
    <p>Copyright {{ copyrightYear }} {{ companyName }}</p>
  </footer>
</template>
```

---

## 二、`v-memo`：列表的条件记忆

```vue
<!-- 错误：选中状态变了，所有行的 VNode 全部重建 -->
<template>
  <div v-for="item in list" :key="item.id">
    <div :class="{ selected: item.id === selectedId }">
      <ExpensiveRow :data="item" />
    </div>
  </div>
</template>
```

```vue
<!-- 正确：只有选中状态变化的那两行重建 -->
<script setup lang="ts">
const list = ref<RowItem[]>([])
const selectedId = ref<string | null>(null)
</script>

<template>
  <div v-for="item in list" :key="item.id" v-memo="[item, item.id === selectedId]">
    <div :class="{ selected: item.id === selectedId }">
      <ExpensiveRow :data="item" />
    </div>
  </div>
</template>
```

依赖里带 `item` 是为了整体替换时能刷新子组件的 prop；只带 `item.id === selectedId` 的话，列表数据被替换但选中态没变时，行内容不会更新。

---

## 三、多个依赖

```vue
<script setup lang="ts">
const selectedId = ref<string | null>(null)
const editingId = ref<string | null>(null)
const items = ref<RowItem[]>([])
</script>

<template>
  <div
    v-for="item in items"
    :key="item.id"
    v-memo="[item, item.id === selectedId, item.id === editingId]"
  >
    <RowCard :item="item" :selected="item.id === selectedId" :editing="item.id === editingId" />
  </div>
</template>
```

---

## 四、`v-memo="[]"` 等价于 `v-once`

```vue
<template>
  <div v-for="item in staticList" :key="item.id" v-memo="[]">
    {{ item.name }}
  </div>
</template>
```

---

## 五、不要用的场景

```vue
<template>
  <!-- 错误：内容本来就需要更新 -->
  <div v-once>
    <span>数量：{{ count }}</span> <!-- 永远不会变 -->
  </div>

  <!-- 错误：依赖漏了子树传给子组件的值 -->
  <div v-memo="[selected]">
    <el-input v-model="item.remark" /> <!-- remark 变了这里不刷新 -->
  </div>

  <!-- 错误：收益可以忽略，只增加理解成本 -->
  <span v-once>{{ simpleText }}</span>
</template>
```

---

## 六、调试记忆化子树

在**被记忆化的子组件**里加 `onUpdated`，不要加在拥有 `v-memo` 的组件上（后者的 `onUpdated` 每次父级重渲染都会触发，无法判断 memo 是否命中）。

```vue
<!-- RowCard.vue 内部 -->
<script setup lang="ts">
onUpdated(() => {
  console.log('RowCard 更新')
})
</script>
```

如果子组件显示的数据陈旧、而这个日志没有输出，说明 `v-memo` 的依赖数组漏了字段。

---

## 对比

| 场景 | 不加指令 | 加 `v-once` / `v-memo` |
|---|---|---|
| 永不变化的运行时内容，组件重渲染 100 次 | VNode 重建 100 次 | 只创建一次 |
| 1000 行列表，切换选中 | 1000 行全部重建并 diff | 最多 2 行重建 |
| 父级重渲染、子组件 props 与插槽未变 | 子组件不重渲染 | 子组件不重渲染 |
