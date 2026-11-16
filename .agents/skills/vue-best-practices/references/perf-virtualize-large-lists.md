---
title: Virtualize Large Lists to Avoid DOM Overload
display_title: 长列表虚拟化
impact: HIGH
impactDescription: Rendering thousands of list items creates excessive DOM nodes causing slow renders and high memory usage
type: efficiency
tags: [vue3, performance, virtual-list, large-data, dom, optimization]
---

# 长列表虚拟化

**影响：高** — 几百上千条数据一次性渲染会产生海量 DOM 节点，每个节点都占内存、拖慢首屏、让更新变贵。虚拟化只渲染可见项。

> **本项目口径**：
> - 项目**未安装**虚拟滚动库。确实需要时先评估，优先看是否能用后端分页解决
> - **不要给 `el-table` 套虚拟滚动库**。`el-table` 有自己的渲染机制，强行包一层会出现行高错乱、固定列失效。数据量大就走分页
> - 自绘的长列表（日志流、消息流、大量卡片的瀑布流）才考虑虚拟化

## 任务清单

- 先确认列表是否真的超过 50~100 条，且内容复杂
- 优先方案：后端分页 + `el-pagination`（项目 `ProPagination` 已封装）
- 确实需要虚拟化时，选库并评估包体积
- 列表项高度要固定或可估算
- 用接近真实的数据量测试

---

## 可选库

| 库 | 适用 | 说明 |
|---|---|---|
| `vue-virtual-scroller` | 通用场景 | 开箱即用，配置少 |
| `@tanstack/vue-virtual` | 复杂布局、headless | 灵活，需要自己写渲染逻辑 |
| `vue-virtual-scroll-grid` | 网格布局 | 二维虚拟化 |

引入前确认：项目当前没有这些依赖，需要新增安装。

---

## 反例：一次性渲染全部

```vue
<script setup lang="ts">
import LogItem from './components/LogItem.vue'

const logs = ref<Log.LogItem[]>([])

onMounted(async () => {
  // 10000 条同时挂载，浏览器直接卡死
  logs.value = await LogRequest.findAll()
})
</script>

<template>
  <div class="log-list">
    <LogItem v-for="log in logs" :key="log.id" :log="log" />
  </div>
</template>
```

## 正例：分页（项目首选）

```vue
<script setup lang="ts">
import LogItem from './components/LogItem.vue'

const logList = ref<Log.LogItem[]>([])
const total = ref(0)
const queryParams = ref({ pageNo: 1, pageSize: 10 })

async function loadList() {
  const data = await LogRequest.findList(queryParams.value)
  logList.value = data.records
  total.value = data.total
}
</script>

<template>
  <div class="log-list">
    <LogItem v-for="log in logList" :key="log.id" :log="log" />
  </div>
  <ProPagination :total v-model:current-page="queryParams.pageNo" v-model:page-size="queryParams.pageSize" @pagination="loadList" />
</template>
```

## 正例：虚拟化（自绘长列表）

```vue
<script setup lang="ts">
import { RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import LogItem from './components/LogItem.vue'

const logs = ref<Log.LogItem[]>([])
</script>

<template>
  <!-- 容器必须有固定高度 -->
  <RecycleScroller class="log-list" :items="logs" :item-size="80" key-field="id" v-slot="{ item }">
    <LogItem :log="item" />
  </RecycleScroller>
</template>

<style lang="scss" scoped>
.log-list {
  height: 600px;
}
</style>
```

---

## 不该虚拟化的场景

- 少于 50 条且内容简单
- 需要屏幕阅读器一次访问全部内容
- 打印布局，必须全部渲染
- SEO 关键、必须出现在初始 HTML 的内容

本项目是后台管理系统，以上限制主要看第一条。

---

## 性能对比

| 方案 | 100 条 | 1000 条 | 10000 条 |
|---|---|---|---|
| 普通 `v-for` | ~100 节点 | ~1000 节点 | ~10000 节点 |
| 虚拟化 | ~20 节点 | ~20 节点 | ~20 节点 |

节点数只是表象，真正的差别在首次渲染时间和更新时的 diff 成本。
