---
title: Component Data Flow Best Practices
display_title: 组件数据流
impact: HIGH
type: best-practice
tags: [vue3, props, emits, v-model, provide-inject, data-flow, typescript]
---

# 组件数据流

**影响：高** — 数据流显式，组件才可靠：props 向下、事件向上、`v-model` 处理真正的双向契约、provide/inject 只用于跨层级的共享依赖。边界模糊会带来状态陈旧、隐性耦合和难排查的 UI 问题。

> **本项目口径**：运行时 API 自动导入，示例不写 `import`；不写 Vue 3.4 / 3.5 的兼容分支（见 `../SKILL.md`）。

## 任务清单

- props 视为只读输入，子组件绝不修改
- Vue 3.5+ 可用响应式 props 解构；传给 `watch` 时必须用 getter
- 组件通信优先 props/emits，组件 ref 只留给命令式操作
- 需要命令式 API 时用 `useTemplateRef` + `defineExpose`
- 用事件代替直接改父级状态
- `v-model` 用 `defineModel()`
- 中间层只做转发时，用 `InjectionKey` 做限定作用域的共享
- 类型式 `defineProps` / `defineEmits` 描述组件契约

---

## 一、Props 单向向下

```vue
<!-- 错误：子组件改 props -->
<script setup lang="ts">
const props = defineProps<{ count: number }>()

function increment() {
  props.count++ // 运行时报错，且破坏单向数据流
}
</script>
```

```vue
<!-- 正确：需要变化就 emit，或建本地副本 -->
<script setup lang="ts">
const props = defineProps<{ count: number }>()
const emit = defineEmits<{ change: [nextCount: number] }>()

function increment() {
  emit('change', props.count + 1)
}
</script>
```

需要本地可编辑副本时（表单回填），用 `ref` 承接并在提交时 emit：

```ts
const form = ref<User.UserForm>({ ...props.record })
```

---

## 二、响应式 props 解构

Vue 3.5+ 支持直接解构 `defineProps()` 并使用原生默认值：

```ts
const { title = '未命名', count } = defineProps<{
  title?: string
  count: number
}>()
```

**坑：解构后的值传给 `watch` 或 hook 时要传 getter。**

```ts
// 错误：count 是普通值快照，watch 不会响应
watch(count, (value) => console.log(value))

// 正确
watch(() => count, (value) => console.log(value))
```

存量代码里的 `withDefaults(defineProps<...>(), { ... })` 写法**不要主动改**，新代码可用上面的解构形式。

---

## 三、优先 props/emit，而不是组件 ref

```vue
<!-- 错误：父组件伸手进子组件内部 -->
<script setup lang="ts">
const formRef = useTemplateRef('formRef')

function submitForm() {
  if (formRef.value?.isValid) formRef.value?.submit()
}
</script>

<template>
  <UserForm ref="formRef" />
  <el-button @click="submitForm">提交</el-button>
</template>
```

```vue
<!-- 正确：子组件自己负责校验与提交，通过事件把结果交出去 -->
<script setup lang="ts">
function handleSubmit(formData: User.UserForm) {
  UserRequest.create(formData)
}
</script>

<template>
  <UserForm @submit="handleSubmit" />
</template>
```

---

## 四、必须命令式调用时：`defineExpose` + `useTemplateRef`

弹窗、表格这类"父组件要主动打开/刷新"的组件，本项目统一用这个模式（存量 `UserDialog.vue` 就是范例）：

```vue
<!-- src/views/system/user/components/UserDialog.vue -->
<script setup lang="ts">
defineOptions({ name: 'UserDialog' })

const visible = ref(false)

/** 打开弹窗；传 record 为编辑模式，不传为新增模式 */
async function open(record?: User.SysUser) {
  visible.value = true
  await resetForm(record?.id)
}

defineExpose({ open })
</script>
```

```vue
<!-- 父组件 -->
<script setup lang="ts">
import UserDialog from './components/UserDialog.vue'

const userDialogRef = useTemplateRef('userDialogRef')

function handleCreate() {
  userDialogRef.value?.open()
}
</script>

<template>
  <el-button type="primary" @click="handleCreate">新增</el-button>
  <UserDialog ref="userDialogRef" @get-list="loadList" />
</template>
```

规矩：`defineExpose` 只暴露真正需要的 API（通常是 `open`、`refresh`），不要把内部 ref 全暴露出去。

---

## 五、Emits：显式向上

**Vue 的组件事件不会冒泡。** 包装组件想把子组件事件透出，必须显式 re-emit：

```vue
<!-- 错误：祖先监听不到孙组件的事件 -->
<Child @saved="onSaved" />
```

```vue
<!-- 正确：Child 里显式转发 -->
<script setup lang="ts">
const emit = defineEmits<{ saved: [payload: User.SysUser] }>()

function handleGrandchildSaved(payload: User.SysUser) {
  emit('saved', payload)
}
</script>

<template>
  <Grandchild @saved="handleGrandchildSaved" />
</template>
```

事件命名：`defineEmits` 里用 camelCase，**模板监听也用 camelCase**，两边保持一致。项目全站没有 kebab-case 的监听写法（`@get-list` 为 0 处，全部是 `@getList`）。

```ts
const emit = defineEmits<{ getList: [] }>()
```

```vue
<UserDialog ref="userDialogRef" @getList="getList" />
```

事件名习惯用 `getList`、`refresh`、`success` 这类"动作结果"命名。

---

## 六、`v-model` 用 `defineModel()`

```vue
<!-- 错误：手写 modelValue -->
<script setup lang="ts">
const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <el-input :model-value="props.modelValue" @input="emit('update:modelValue', $event)" />
</template>
```

```vue
<!-- 正确 -->
<script setup lang="ts">
const model = defineModel<string>({ default: '' })
</script>

<template>
  <el-input v-model="model" />
</template>
```

带修饰符或多个 `v-model` 时：

```ts
const visible = defineModel<boolean>('visible', { default: false })
```

提示：本项目大部分弹窗是"父组件通过 `useTemplateRef` 调 `open()`"的模式，内部用私有 `visible = ref(false)` 即可，**不需要** `defineModel`。`defineModel` 用于真正需要父组件双向绑定的表单类组件。

---

## 七、先判断"转发"，再决定传输方式

中间组件如果大部分代码都在转发后代的事件与状态，先看归属是否错了：

- UI 局部状态、DOM ref、监听器及其清理，应该属于真正拥有该交互的组件或 hook
- 多个消费者都要的数据，放在生命周期匹配的拥有者处，跨功能动作走该拥有者的公开契约
- 直接契约用 props/emits，共享的后代依赖用 provide/inject
- 只有包装组件不提供任何 UI、策略或封装价值时，才考虑合并组件

```vue
<!-- 错误：祖先知道列表项的私有指针交互细节 -->
<ItemList :dragging-id="draggingId" @pointer-move="moveItem" @pointer-up="finishDrag" />
```

```vue
<!-- 正确：交互组件内部把 DOM 事件翻译成业务操作 -->
<ItemList :items="items" @reorder="reorderItems" />
```

列表自己管指针追踪与清理，消费者只管排序策略。

---

## 八、Provide / Inject

只在"相关后代共享状态或操作、而中间层纯转发"时使用。引入前先确认组件边界本身是否该拆。

规则：

- Provider 放在**最近的、拥有该依赖的共同祖先**
- Provider 拥有的状态**每个实例独立创建**，消费者只注入、不创建回退副本
- 必须用 `InjectionKey`，对外暴露只读状态 + 显式动作
- 在 setup 中调用，缺失必需 provider 时**明确抛错**，默认值只用于有意可选的依赖

```ts
// src/views/system/user/selection-context.ts
import type { InjectionKey, Ref } from 'vue'

interface SelectionContext {
  selectedId: Readonly<Ref<string | null>>
  select: (id: string | null) => void
}

const selectionKey: InjectionKey<SelectionContext> = Symbol('selection')

export function provideSelection() {
  const selectedId = ref<string | null>(null)

  const context: SelectionContext = {
    selectedId: readonly(selectedId),
    select: (id) => {
      selectedId.value = id
    },
  }

  provide(selectionKey, context)
  return context
}

export function useSelectionContext(): SelectionContext {
  const context = inject(selectionKey)
  if (!context) throw new Error('useSelectionContext 必须在 provideSelection 的后代组件中使用')
  return context
}
```

> 说明：这里的 `readonly` 是 provide/inject 契约的一部分（消费者不该直接写 provider 的状态），与"组合式函数返回值要不要 readonly"是两件事。后者本项目不采用，见 `../SKILL.md` 第 7 节。

---

## 九、用 TypeScript 描述组件契约

```vue
<!-- 错误：无类型，载荷写错编译器不报 -->
<script setup lang="ts">
const emit = defineEmits(['save'])
emit('save', 123)
</script>
```

```vue
<!-- 正确 -->
<script setup lang="ts">
const props = defineProps<{ userId: string }>()
const emit = defineEmits<{
  save: [payload: { id: string; draft: boolean }]
}>()

function saveDraft() {
  emit('save', { id: props.userId, draft: true })
}
</script>
```

---

## 要点速览

| 场景 | 做法 |
|---|---|
| 子组件需要改数据 | emit / `defineModel` / 本地副本，**绝不改 props** |
| 解构 props | 3.5+ 可直接解构并给原生默认值 |
| 监听解构后的 prop | `watch(() => count, ...)` |
| 父调子方法 | `useTemplateRef` + 子组件 `defineExpose` |
| 跨层级事件 | 显式逐层 re-emit，不要假设冒泡 |
| 双向绑定 | `defineModel()` |
| 弹窗打开 | `defineExpose({ open })` + 父级 `useTemplateRef` |
| 跨树共享 | `InjectionKey` + 只读状态 + 显式 action |
| 编译期校验 | 类型式 `defineProps` / `defineEmits` |
