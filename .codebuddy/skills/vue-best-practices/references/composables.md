---
title: Composable Organization Patterns
display_title: 组合式函数组织模式
impact: MEDIUM
type: best-practice
tags: [vue3, composables, composition-api, code-organization, api-design, utilities]
---

# 组合式函数组织模式

**影响：中** — 结构良好的组合式函数提升可维护性、复用性与更新性能。

> **本项目口径**：
> - 目录是 **`src/hooks/`**，不是 `composables/`；文件命名 `useXxx.ts`
> - `src/hooks/` 下的导出**自动导入**，页面里不要再写 import
> - 无状态纯函数放 `src/utils/`（`@/utils` 桶导出，需显式 import）
> - 运行时 API 自动导入，示例不写 `import`
> - 详见 `../SKILL.md`

## 任务清单

- 按实质性的有状态职责抽取，**即使只有一个调用方**也值得抽；简单局部状态留在组件内
- 把相关状态、动作、生命周期清理放在同一个 hook 里
- 只暴露消费者需要的状态与动作，内部 ref 与辅助函数保持私有
- 参数超过两个时改用选项对象，但不要用选项对象掩盖无关依赖
- 变更需要走 action 时，内部可写、外部通过 action 改（本项目**不返回** `readonly`，见下文）
- 纯计算函数保持为普通工具函数

---

## 一、什么该抽、什么不该抽

判断标准不是"有没有 ref"，而是「这段逻辑是否有实质性的有状态职责」。

**不该抽：一个开关**

```vue
<script setup lang="ts">
const expanded = ref(false)
</script>

<template>
  <el-button @click="expanded = !expanded">{{ expanded ? '收起' : '展开' }}</el-button>
  <p v-if="expanded">详细信息</p>
</template>
```

**该抽：一个完整的请求生命周期**

请求状态（loading / error / 取消）与 UI 是两件事。即使只有一个页面用，也值得独立成 hook，因为它的不变式（同时只能有一个请求生效、卸载即取消）需要集中维护。

```ts
// src/hooks/useProductSearch.ts
export interface Product {
  id: string
  name: string
}

type SearchProducts = (keyword: string) => Promise<Product[]>

export function useProductSearch(keyword: Readonly<Ref<string>>, searchProducts: SearchProducts) {
  const products = ref<readonly Product[]>([])
  const pending = ref(false)
  const errorMessage = ref<string | null>(null)

  watch(
    keyword,
    async (value, _previousValue, onCleanup) => {
      let isCurrent = true
      onCleanup(() => {
        isCurrent = false
      })

      pending.value = true
      errorMessage.value = null
      try {
        const result = await searchProducts(value)
        if (isCurrent) products.value = result
      } catch (error: unknown) {
        if (isCurrent) errorMessage.value = error instanceof Error ? error.message : String(error)
      } finally {
        if (isCurrent) pending.value = false
      }
    },
    { immediate: true },
  )

  return { products, pending, errorMessage }
}
```

```vue
<!-- src/views/product/components/ProductSearch.vue -->
<script setup lang="ts">
defineOptions({ name: 'ProductSearch' })

// @/api 不参与自动导入，必须显式 import（此处为示例模块）
import { searchProducts } from '@/api/product.request'

const keyword = ref('')
const { products, pending, errorMessage } = useProductSearch(keyword, searchProducts)
const emit = defineEmits<{ select: [id: string] }>()
</script>

<template>
  <el-input v-model="keyword" placeholder="搜索商品" />
  <p v-if="errorMessage" role="alert">{{ errorMessage }}</p>
  <p v-if="pending" role="status">加载中…</p>
  <ul>
    <li v-for="product in products" :key="product.id">
      <el-button link @click="emit('select', product.id)">{{ product.name }}</el-button>
    </li>
  </ul>
</template>
```

补充：

- 更大的功能可以组合多个聚焦的 hook，**顺序编排留在调用方**
- 不要把所有 hook 的私有 ref 收拢回一个"万能控制器"
- 子组件可以自己调 hook，祖先不必层层转发状态

---

## 二、不要写万能控制器

```ts
// 错误：换个文件名并不能把页面的职责分开
export function useProductPage() {
  // 列表加载、请求取消、编辑草稿、指针拖拽、弹窗焦点管理全在这里
  // 然后整体返回给页面
}
```

问题不在命名，在于它把互不相关的职责塞进一个闭包：任何一处变更都要改这个文件，任何页面想复用其中一小块都得连带拖走全部依赖。

拆法：按"改动会一起发生"的粒度拆。

| 职责 | 归属 |
|---|---|
| 列表请求与取消 | `useProductSearch` |
| 表单草稿与校验 | 组件内或 `useProductForm` |
| 拖拽与指针 | 拥有该交互的组件内部 |
| 跨能力的顺序编排 | 调用方（页面或 hook 的使用者） |

---

## 三、API 保持聚焦

- 只返回消费者需要的状态与动作；请求句柄、内部计数、辅助函数留在 hook 内部
- 组合多个 hook 时保留能力边界，不要把每个内部成员再导出一次
- 共享状态只在预期作用域创建一次，然后传递或 provide；让每个消费者各自调用有状态 hook，会得到彼此独立的多个实例
- DOM ref、焦点与指针处理留在拥有它们的组件或 hook 里，只共享协调所需的那一部分

```ts
// 错误：一个 hook 被多处调用，各自产生独立状态
// 组件 A
const { selectedRows } = useTableSelection()
// 组件 B
const { selectedRows } = useTableSelection() // 与 A 不是同一份数据
```

需要共享时，把实例创建在共同祖先，再把实例或 action 传下去。

---

## 四、参数用选项对象

```ts
// 错误：参数一多就难读，而且容易传错顺序
useFetch('/api/users', 'GET', null, 5000, 3, true)
```

```ts
// 正确
interface UseFetchOptions {
  method?: string
  timeout?: number
  retries?: number
  immediate?: boolean
}

export function useFetch(url: string, options: UseFetchOptions = {}) {
  const { method = 'GET', timeout = 30000, retries = 0, immediate = true } = options
  // 实现
}
```

```ts
useFetch('/api/users', { method: 'POST', timeout: 5000, retries: 3 })
```

选项对象不等于"把无关依赖也塞进去"。只暴露调用方真正需要决策的配置。

---

## 五、状态变更走 action（本项目不返回 readonly）

内部状态可写，对外提供显式方法：

```ts
// src/hooks/useSelection.ts
export function useSelection() {
  const selectedIds = ref<string[]>([])

  function toggle(id: string) {
    const index = selectedIds.value.indexOf(id)
    if (index >= 0) selectedIds.value.splice(index, 1)
    else selectedIds.value.push(id)
  }

  function clear() {
    selectedIds.value = []
  }

  return { selectedIds, toggle, clear }
}
```

**不要返回 `readonly(selectedIds)`**。原因：

1. `readonly` 只在开发环境 warn，生产环境静默失败，写不进去也不报错，排查成本极高
2. 与 `v-model` 冲突，El Plus 表单/弹窗大量直接绑定状态
3. 深层只读会误伤 `el-table` 行内编辑这类"外部本来就需要写"的场景
4. Pinia setup store 直接暴露 state 是项目既有约定

替代做法：**把 action 写全**，让所有变更路径都有明确的入口，而不是靠只读代理拦截。详见 `../SKILL.md` 第 7 节。

唯一例外是 provide/inject 的上下文契约（消费者不该写 provider 内部状态），那里用 `readonly` 是表达接口意图，见 `component-data-flow.md`。

---

## 六、纯函数留在 utils

```ts
// 错误：无状态逻辑被包装成 hook
export function useFormatters() {
  const formatDate = (date: Date) => dayjs(date).format('YYYY-MM-DD')
  const formatCurrency = (amount: number) => `¥${amount.toFixed(2)}`
  return { formatDate, formatCurrency }
}
```

```ts
// 正确：src/utils/format.ts
export function formatDate(date: Date): string {
  return dayjs(date).format('YYYY-MM-DD')
}

export function formatCurrency(amount: number): string {
  return `¥${amount.toFixed(2)}`
}
```

`src/utils/index.ts` 已经用 `export *` 桶导出，页面里 `import { formatDate } from '@/utils'` 即可。

hook 只负责响应式部分：

```ts
// src/hooks/useInvoiceSummary.ts
import { formatCurrency } from '@/utils'

export function useInvoiceSummary(invoice: Readonly<Ref<Invoice>>) {
  const totalLabel = computed(() => formatCurrency(invoice.value.total))
  return { totalLabel }
}
```

---

## 七、生命周期与清理成对

```ts
/** 元素宽度小于 750 时切到移动端布局 */
const MAX_MOBILE_WIDTH = 750

export function useWindowResize() {
  const appStore = useAppStore()

  function handleResize() {
    const bodyWidth = document.body.getBoundingClientRect().width
    appStore.device = bodyWidth - 1 < MAX_MOBILE_WIDTH ? 'mobile' : 'desktop'
  }

  onBeforeMount(() => window.addEventListener('resize', handleResize))
  onBeforeUnmount(() => window.removeEventListener('resize', handleResize))
}
```

规矩：注册与注销必须成对，`resize` / `ResizeObserver` / `IntersectionObserver` / 定时器 / `AbortController` 都一样。项目里的 `useResize.ts` 就是按这个模式写的（`onBeforeMount` 注册、`onBeforeUnmount` 注销），另外还用 `watch(() => route.name, ..., { immediate: true })` 处理路由切换时的侧栏收起。

> 注：`useResize.ts` 目前是直接给 `appStore.device` 赋值，因为 `app.ts` 还没有 `setDevice` action。补 action 是目标态，改该文件时顺手补齐，其他时候不要动。

---

## 要点速览

| # | 规则 | 反模式 | 正确做法 |
|---|---|---|---|
| 1 | 抽取边界 | `useProductPage` 万能控制器 | 单一职责的 `useProductSearch` |
| 2 | 判断依据 | "有 ref 就抽" | "有实质性有状态职责才抽" |
| 3 | 参数设计 | 6 个位置参数 | `(source, options = {})` |
| 4 | 状态封装 | 对外直接给可写 ref 却无 action | 内部可写 + 暴露 `toggle` / `clear` |
| 5 | readonly | 对外返回只读代理 | **不用**，用 action 收口 |
| 6 | 内部成员 | 导出全部内部 ref | 只导出消费者所需 |
| 7 | 共享状态 | 每个消费者各调一次 | 创建一次后传递或 provide |
| 8 | 纯函数 | `useFormatters()` | `src/utils/format.ts` |
| 9 | DOM 相关 | 提到上层控制器 | 留在所属 UI 或 hook |
| 10 | 目录 | `composables/` | **`src/hooks/`**，自动导入 |
