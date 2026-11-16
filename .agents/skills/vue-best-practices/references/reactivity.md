---
title: Reactivity Core Patterns (ref, reactive, shallowRef, computed, watch)
display_title: 响应式核心模式
impact: MEDIUM
type: efficiency
tags: [vue3, reactivity, ref, reactive, shallowRef, computed, watch, watchEffect, best-practice]
---

# 响应式核心模式

**影响：中** — 先选对响应式原语，派生值一律走 `computed`，只有副作用才用 watcher。

> **本项目口径**：运行时 API 全部自动导入，示例中不写 `import`。类型按需 `import type`。详见 `../SKILL.md`。

## 任务清单

- 正确声明响应式状态
  - 对象/数组整体替换为主 → `ref`
  - 单一状态对象就地改属性 → `reactive`
  - 不透明的外部实例、超大嵌套数据 → `shallowRef`
- 遵循 `reactive` 的约束
  - 不要直接从 `reactive()` 解构
  - `watch` 监听 `reactive` 的属性必须传 getter
- 遵循 `computed` 的最佳实践
  - 用 `computed` 而不是"用 watcher 给派生 ref 赋值"
  - 过滤/排序移出模板
  - 可复用的 class/style 逻辑用 `computed`
  - getter 保持纯净，副作用放 `watch`
- 遵循 watcher 的最佳实践
  - `immediate: true` 替代重复的首调
  - 异步副作用必须可清理

---

## 一、状态声明

### 1.1 primitive 沿用 `ref()`

```ts
const count = ref(0)
const keyword = ref('')
const loading = ref(false)
```

> 不要用 `shallowRef` 存 primitive：primitive 不是对象，`ref()` 本来就不会对它做深层代理，换成 `shallowRef()` 没有可测量的收益，只会让写法与项目其余代码不一致。

### 1.2 对象/数组怎么选

**用 `ref()`** —— 经常整体替换值（`state.value = response`），同时希望内部保持深层响应式。

```ts
/** 列表数据：分页查询后整体替换 */
const tableData = ref<User.SysUser[]>([])

async function loadList() {
  tableData.value = (await UserRequest.findPage(queryParams)).rows
}
```

**用 `reactive()`** —— 主要变更属性、很少整体替换（表单、单一状态对象）。

```ts
const form = reactive<User.UserForm>({ status: '1', gender: '2' })

form.nickname = '张三'
form.roleIds.push(roleId)
// 避免：form = reactive({ ... })
```

**用 `shallowRef()`** —— 值是不透明对象、不该被代理，或数据量极大且以更换根引用方式更新。

```ts
/** ECharts 实例：不能交给 Vue 代理，否则内部方法和性能都会出问题 */
const chartInstance = shallowRef<echarts.ECharts>()

chartInstance.value = echarts.init(container)
```

`shallowRef` 的语义：只有替换 `.value` 才触发更新。

```ts
const profile = shallowRef({ nickname: '张三', age: 30 })

profile.value.age = 31 // 不会触发更新
profile.value = { nickname: '李四', age: 25 } // 会触发更新
```

**用 `shallowReactive()`** —— 只需要顶层属性有响应式，嵌套 payload 不需要被管理。

```ts
const state = shallowReactive({
  collapsed: false,
  payload: { /* 外部对象，不需要代理 */ },
})

state.collapsed = true // 响应式
state.payload.anything = 1 // 不响应
```

---

## 二、`reactive` 的两个坑

### 2.1 不要直接解构

```ts
const state = reactive({ count: 0 })
const { count } = state // 断开响应式
```

需要解构时用 `toRefs()`（项目 `useDict` 就是这么做的）：

```ts
const { count } = toRefs(state) // count 是 ref，保持响应式
```

### 2.2 `watch` 必须传 getter

```ts
const state = reactive({ userId: '' })

// 错误：state.userId 是普通值，watch 拿不到
watch(state.userId, () => { /* 不会触发 */ })

// 正确
watch(() => state.userId, (userId) => loadUser(userId))
```

---

## 三、`computed`

### 3.1 派生值用 `computed`，不要用 watcher 回写

```ts
// 错误
const items = ref<CartItem[]>([])
const total = ref(0)
watchEffect(() => {
  total.value = items.value.reduce((sum, item) => sum + item.price, 0)
})

// 正确
const items = ref<CartItem[]>([])
const total = computed(() => items.value.reduce((sum, item) => sum + item.price, 0))
```

### 3.2 过滤/排序移出模板

```vue
<template>
  <!-- 错误：每次渲染都重新过滤排序 -->
  <li v-for="item in items.filter((item) => item.active).sort(byName)" :key="item.id">
    {{ item.name }}
  </li>
</template>
```

```ts
// 正确
const visibleItems = computed(() =>
  items.value.filter((item) => item.active).sort((first, second) => first.name.localeCompare(second.name)),
)
```

```vue
<template>
  <li v-for="item in visibleItems" :key="item.id">{{ item.name }}</li>
</template>
```

### 3.3 复杂 class 用 `computed`

```vue
<template>
  <!-- 错误：模板里堆条件 -->
  <button :class="{ btn: true, 'btn-primary': type === 'primary' && !disabled, 'btn-disabled': disabled }">
    {{ label }}
  </button>
</template>
```

```ts
// 正确
const buttonClasses = computed(() => ({
  btn: true,
  [`btn-${props.type}`]: !props.disabled,
  'btn-disabled': props.disabled,
}))
```

### 3.4 getter 必须纯净

```ts
// 错误：computed 里做副作用
const doubled = computed(() => {
  if (count.value > 10) console.warn('数值过大')
  return count.value * 2
})

// 正确
const doubled = computed(() => count.value * 2)
watch(count, (value) => {
  if (value > 10) console.warn('数值过大')
})
```

---

## 四、watcher

### 4.1 `immediate: true` 代替重复的首调

```ts
// 错误：首屏调一次、之后靠 watch
onMounted(() => loadUser(userId.value))
watch(userId, (id) => loadUser(id))

// 正确
watch(userId, (id) => loadUser(id), { immediate: true })
```

### 4.2 异步副作用必须可清理

搜索框、筛选器这类高频变化场景，要取消上一次请求，否则会出现旧结果覆盖新结果。

```ts
const keyword = ref('')
const results = ref<Product[]>([])

watch(keyword, async (value, _previousValue, onCleanup) => {
  const controller = new AbortController()
  onCleanup(() => controller.abort())

  const response = await fetch(`/api/search?keyword=${encodeURIComponent(value)}`, {
    signal: controller.signal,
  })
  results.value = await response.json()
})
```

本项目基于 axios，等价写法是用 `onCleanup` 标记失效：

```ts
watch(keyword, async (value, _previousValue, onCleanup) => {
  let isCurrent = true
  onCleanup(() => {
    isCurrent = false
  })

  const data = await ProductRequest.search({ keyword: value })
  if (isCurrent) results.value = data
})
```

---

## 要点速览

| 场景 | 做法 |
|---|---|
| primitive（number / string / boolean） | `ref()` |
| 频繁整体替换、需深层响应 | `ref()` |
| 单一状态对象、就地改属性 | `reactive()` |
| 外部实例 / 类 / 超大嵌套数据 | `shallowRef()` |
| 只需顶层属性响应式 | `shallowReactive()` |
| 从 `reactive` 取值 | `toRefs()`，不要直接解构 |
| `watch` 监听 `reactive` 属性 | 必须传 getter |
| 派生值 | `computed`，不要用 watcher 回写 |
| 过滤 / 排序 | `computed`，不要写在模板里 |
| 复杂 class / style | `computed` 返回对象 |
| 副作用 | `watch`，`computed` 保持纯净 |
| 初始化即执行 | `{ immediate: true }` |
| 高频异步请求 | `onCleanup` 取消或标记失效 |
