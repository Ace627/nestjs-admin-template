---
title: Avoid Expensive Operations in Updated Hook
display_title: 不要在 onUpdated 里做重活
impact: MEDIUM
impactDescription: Heavy computations in updated hook cause performance bottlenecks and potential infinite loops
type: capability
tags: [vue3, lifecycle, updated, performance, optimization, reactivity]
---

# 不要在 `onUpdated` 里做重活

**影响：中** — `onUpdated` 在每次导致重渲染的状态变化后都会执行。在里面做请求、改状态或重计算，轻则掉帧，重则死循环。

`onUpdated` 只用于「DOM 更新后必须同步一次」的底层操作。绝大多数响应式逻辑应该用 `watch` 或 `computed`。

> **重点**：项目全部使用 Composition API + `<script setup>`，**禁止** Options API 的 `export default { updated() {} }` 写法。

## 任务清单

- 不要在 `onUpdated` 里发请求
- 不要在 `onUpdated` 里修改响应式状态（会触发下一轮更新，形成死循环）
- 必须执行的动作先做条件判断
- 响应特定数据变化用 `watch`
- `onUpdated` 里确实要做的重活，加节流或防抖
- `onUpdated` 只留给底层 DOM 同步

---

## 一、错误用法

```ts
// 错误：每次重渲染都发请求
onUpdated(() => {
  LogRequest.sync(logList.value)
})
```

```ts
// 错误：改状态 → 触发更新 → 再进 onUpdated，死循环
onUpdated(() => {
  renderCount.value++
})
```

```ts
// 错误：每次击键、每次状态变化都跑重计算
onUpdated(() => {
  processedData.value = heavyCompute(rawData.value)
  analytics.value = calculateMetrics(allData.value)
})
```

---

## 二、正确用法

### 2.1 定向监听用 `watch`

```vue
<script setup lang="ts">
defineOptions({ name: 'LogPanel' })

const logList = ref<Log.LogItem[]>([])

watch(
  logList,
  (newLogList) => {
    LogRequest.sync(newLogList)
  },
  { deep: true },
)
</script>
```

高频场景加防抖（`@vueuse/core` 自动导入）：

```ts
const syncToServer = useDebounceFn((logList: Log.LogItem[]) => {
  LogRequest.sync(logList)
}, 500)

watch(logList, (newLogList) => syncToServer(newLogList), { deep: true })
```

### 2.2 派生数据用 `computed`

```ts
// 错误：在 onUpdated 里算，算出新值又触发一轮更新
onUpdated(() => {
  totalAmount.value = amountList.value.reduce((sum, amount) => sum + amount, 0)
})

// 正确
const totalAmount = computed(() => amountList.value.reduce((sum, amount) => sum + amount, 0))
```

### 2.3 `onUpdated` 只做 DOM 同步

```vue
<script setup lang="ts">
defineOptions({ name: 'LogPanel' })

const scrollContainerRef = useTemplateRef('scrollContainerRef')

onUpdated(() => {
  const container = scrollContainerRef.value
  if (!container) return
  container.scrollTop = container.scrollHeight
})
</script>

<template>
  <div ref="scrollContainerRef" class="log-container">
    <div v-for="log in logList" :key="log.id">{{ log.content }}</div>
  </div>
</template>
```

项目里的等价场景：`ProChart` 需要在容器尺寸变化后重算图表尺寸，用 `ResizeObserver`（见 `useResize`）比 `onUpdated` 更准确。

### 2.4 必须执行时先做条件判断

```ts
let lastSyncedContent = ''

onUpdated(() => {
  if (content.value === lastSyncedContent) return
  syncContent(content.value)
  lastSyncedContent = content.value
})
```

---

## 三、判断该用哪个

| 需求 | 用什么 |
|---|---|
| 某个数据变了要做副作用 | `watch` |
| 由其他状态算出来的值 | `computed` |
| DOM 更新后要同步滚动位置、第三方实例尺寸 | `onUpdated`（配合 `nextTick`） |
| 元素尺寸变化 | `ResizeObserver`（`useResize` / `useElementSize`） |
| 窗口尺寸变化 | `resize` 事件（`useResize`） |

---

## 四、项目里 `onUpdated` 的位置

项目当前**没有任何组件使用 `onUpdated`**（`src/components/` 与 `src/views/` 均为 0 处）。不要因为"写法存在"就顺手引入。

只有出现「DOM 更新后必须立刻校正、`watch` 又抓不到时机」的需求才用：

- 手写虚拟列表时按内容高度校正可视区
- 消息流、日志流插入新内容后滚动到底部
- 第三方实例必须在容器 DOM 尺寸变化后重新测量

后两种优先用 `ResizeObserver`（项目 `useResize` 已封装窗口尺寸，元素尺寸用 `useElementSize`），`onUpdated` 只作为拿不到尺寸事件时的兜底。
