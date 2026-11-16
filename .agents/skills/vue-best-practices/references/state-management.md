---
title: State Management Strategy
display_title: 状态管理
impact: HIGH
impactDescription: Choosing the wrong store pattern can cause brittle mutation flows and poor scaling
type: best-practice
tags: [vue3, state-management, pinia, composables]
---

# 状态管理

**影响：高** — 用能满足需求的最轻方案。跨页面共享走 Pinia，功能内部状态留在组件或 `src/hooks/`。

> **本项目口径**：
> - 全局状态一律 Pinia setup store，放 `src/store/modules/`，**自动导入**，页面不要写 import
> - 项目是纯 SPA，**没有 SSR**，不需要考虑请求间状态隔离与单例安全
> - **不采用** `readonly` 只读包装（详见 `../SKILL.md` 第 7 节）

## 任务清单

- 状态先就近放，确认需要跨页面共享后再提升
- 共享状态用 Pinia，不要导出模块级可变 `reactive`
- 变更通过 action 收口，并把 action 写全
- 组件内部状态不要塞进 store
- 不要用 store 保存可以从 state 派生的值

---

## 一、三层归属

| 范围 | 放哪 | 例子 |
|---|---|---|
| 单个组件 | 组件内 `ref` / `reactive` | 弹窗显隐、表单草稿 |
| 单个功能、多个组件 | `src/hooks/` | 列表查询、字典加载、表单校验 |
| 跨页面、跨功能 | `src/store/modules/` | 登录用户、菜单权限、主题设置、标签页 |

判断标准：**这个状态的生命周期是否比一个页面更长，且被多个不相关的功能读？** 是 → Pinia；否则往下退一层。

---

## 二、Pinia setup store 写法

项目统一用 setup store（函数式），不用 options store：

```ts
// src/store/modules/app.ts
import { getSidebarStatus, setSidebarStatus } from '@/utils'

export const useAppStore = defineStore('app', () => {
  /** 是否折叠菜单 */
  const isCollapse = ref<boolean>(getSidebarStatus())
  /** 是否移除侧栏和主容器的过渡效果 */
  const withoutAnimation = ref<boolean>(false)
  /** 设备类型 */
  const device = ref<'desktop' | 'mobile'>('desktop')

  function toggleSidebar(): void {
    withoutAnimation.value = false
    isCollapse.value = !isCollapse.value
    setSidebarStatus(isCollapse.value)
  }

  function setDevice(nextDevice: 'desktop' | 'mobile'): void {
    device.value = nextDevice
  }

  const isMobile = computed(() => device.value === 'mobile')
  const isDesktop = computed(() => device.value === 'desktop')

  return { device, isCollapse, isMobile, isDesktop, withoutAnimation, setDevice, toggleSidebar }
})
```

要点：

1. `defineStore('app', () => { ... })`，第一个参数是唯一 id
2. state 用 `ref`，getter 用 `computed`，action 用普通函数
3. 返回值里把 state、getter、action 一起列出
4. **`defineStore` 自动导入**，不写 import；`ref` / `computed` 同理
5. 组件里 `const appStore = useAppStore()`，同样不写 import

---

## 三、action 必须写全

这是本项目最重要的一条。store 的 state 是直接可写的，如果某个字段的变更需要伴随其他动作（写缓存、同步另一个字段、触发请求），就必须提供 action，否则调用方会绕过它。

```ts
// 反例：isCollapse 变化必须同步 localStorage，但 state 直接对外
// 调用方写 appStore.isCollapse = true 时，缓存就不会更新
```

```ts
// 正例：提供语义化的 action
function toggleSidebar(): void {
  isCollapse.value = !isCollapse.value
  setSidebarStatus(isCollapse.value)
}
```

**存量不一致**：`src/hooks/useResize.ts` 目前直接 `appStore.device = ...`，因为 `app.ts` 没有 `setDevice`。新增这段 action 后，应改为调用 action。除这一处外，不要主动改动其他存量代码。

---

## 四、组件里怎么用

```vue
<script setup lang="ts">
defineOptions({ name: 'LayoutSidebar' })

const appStore = useAppStore()
</script>

<template>
  <aside :class="{ 'is-collapse': appStore.isCollapse }">
    <el-button @click="appStore.toggleSidebar()">切换</el-button>
  </aside>
</template>
```

需要解构时用 `storeToRefs` 保留响应式（`storeToRefs` 自动导入）：

```ts
const appStore = useAppStore()
const { isCollapse, isMobile } = storeToRefs(appStore)
```

action 直接解构没问题，它不是响应式的：`const { toggleSidebar } = appStore`。

---

## 五、不要导出模块级可变状态

```ts
// 错误：谁都能改，改了什么完全不可追踪
// src/store/cart.ts
export const cart = reactive({
  items: [] as CartItem[],
})
```

```ts
// 正确
export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])

  function addItem(item: CartItem): void {
    items.value.push(item)
  }

  function removeItem(itemId: string): void {
    items.value = items.value.filter((item) => item.id !== itemId)
  }

  return { items, addItem, removeItem }
})
```

项目里 `useDict` 使用模块级变量做缓存（`dictCache`），那是**缓存**不是状态，不对外暴露，属于合理用法。

---

## 六、不要存派生值

```ts
// 错误：total 与 items 可能不一致
const items = ref<CartItem[]>([])
const total = ref(0)

function addItem(item: CartItem) {
  items.value.push(item)
  total.value += item.price
}
```

```ts
// 正确
const items = ref<CartItem[]>([])
const total = computed(() => items.value.reduce((sum, item) => sum + item.price * item.quantity, 0))
```

---

## 七、可选：`createGlobalState`

`@vueuse/core` 提供 `createGlobalState`，可以在不引入 Pinia 的情况下做单例。本项目**已经有 Pinia 且约定统一用它**，不要混入第二种方案，避免同一份状态出现两套管理方式。
