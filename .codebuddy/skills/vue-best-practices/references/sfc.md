---
title: Single-File Component Structure, Styling, and Template Patterns
display_title: 单文件组件：结构、样式与模板
impact: MEDIUM
type: best-practice
tags: [vue3, sfc, scoped-css, styles, template, v-html, v-for, computed, v-if, v-show]
---

# 单文件组件：结构、样式与模板

**影响：中** — 统一的 SFC 结构与样式策略决定可维护性、工具链支持与渲染开销。

> **重点**：`<template>` 在前，全局组件直接写标签，详见 `../SKILL.md`。

## 任务清单

- 一个组件 = 一个 `.vue` 文件，template / script / style 就近放在一起，不要拆成独立的 `.js` + `.css`
- **顺序固定：`<template>` → `<script setup lang="ts">` → `<style lang="scss" scoped>`**
- `defineOptions({ name })` 按组件身份决定是否写（路由页面不写，见规则一）
- 全局组件（`src/components/`）直接写标签，禁止 import
- 私有子组件（`views/**/components/`）import 时用 PascalCase
- 默认 `<style lang="scss" scoped>`；scoped 内优先类选择器
- Vue 3.5+ 用 `useTemplateRef()` 取 DOM / 组件引用
- `:style` 绑定用 camelCase 键名
- `v-for` 必须有稳定 `:key`；不与 `v-if` 共用同一元素
- 禁止 `v-html`
- 按切换频率选择 `v-if` / `v-show`

---

## 规则一：顺序与前缀（本项目硬规则）

```vue
<!-- src/components/ProBadge/index.vue -->
<template>
  <span class="pro-badge">{{ displayText }}</span>
</template>

<script setup lang="ts">
defineOptions({ name: 'ProBadge' })

const props = defineProps<{ count: number }>()

const displayText = computed(() => (props.count > 99 ? '99+' : String(props.count)))
</script>

<style lang="scss" scoped>
.pro-badge {
  padding: 0 6px;
}
</style>
```

要点：

1. `<template>` 在最前，`<script setup>` 居中，`<style>` 最后
2. 全局组件（`src/components/*/index.vue`）必须是这个结构，并在 `src/plugins/modules/global-component.ts` 注册
3. `defineOptions({ name })` 写在 `<script setup>` 第一行、import 之前，**但后端的动态路由页面不要手写**：

| 组件位置 | 是否写 | 原因 |
|---|---|---|
| `src/views/` 下由后端菜单配置的页面 | **不写** | `src/router/router.helper.ts` 的 `loadView` 会按菜单 `component` 路径算出 name 并**强制覆盖**（`system/user/index` → `SystemUser`），手写无效 |
| `static.route.ts` 里声明的页面 | **必须写，且与路由 `name` 一致** | 静态路由不走 `loadView`；`<KeepAlive :include>` 按组件 name 匹配，对不上就丢缓存 |
| `src/components/`、`src/layout/`、`views/**/components/` | 写，语义化 PascalCase | 不参与 KeepAlive，name 只用于调试与自引用 |

上面的 `ProBadge` 属于第一类之外的全局组件，所以写 `name`。而 `views/system/user/index.vue` 这类后端的动态菜单页面**不要写**。

KeepAlive 匹配链路：`AppMain/index.vue` 的 `:include` 吃的是 `tagsViewStore.cachedViews`，里面存的是**路由 name**；动态路由的组件 name 与路由 name 由同一个 `toPascalCase` 生成，自动对齐。静态路由没有这层自动对齐，必须手工保证一致，否则页签切走再回来会重新挂载、状态丢失。

---

## 规则二：组件引入方式

**全局组件：直接写标签，禁止 import**

```vue
<template>
  <ProTable ref="tableRef" v-loading="loading" :data="list" :columns="columns" :hidden-column-keys="hiddenColumnKeys" @selection-change="handleSelectionChange">
    <template #action="{ row }">
      <el-link v-permissions="['system:user:update']" type="primary" @click="handleEdit(row)">修改</el-link>
    </template>
  </ProTable>

  <ProPagination :total v-model:current-page="queryParams.pageNo" v-model:page-size="queryParams.pageSize" @pagination="getList" />
</template>

<script setup lang="ts">
// 不写 import ProTable / ProPagination，也不写 components: { ... }
// 也不写 defineOptions 的 name，该页面 name 由 loadView 自动生成
</script>
```

可用的全局组件：`SvgIcon` `ProChart` `ProTable` `ProSearch` `ProTooltip` `ProPagination` `DictTag` `IconSelect` `CrontabDialog` `RightToolbar`。

**私有子组件：正常 import，PascalCase**

```vue
<script setup lang="ts">
import UserDialog from './components/UserDialog.vue'
import ResetPwdDialog from './components/ResetPwdDialog.vue'
</script>
```

---

## 规则三：样式

### 3.1 默认 scoped，全局样式集中放

```vue
<!-- 错误：会泄漏成全局样式 -->
<style>
.button { border-radius: 999px; }
</style>
```

```vue
<!-- 正确 -->
<style lang="scss" scoped>
.button {
  border-radius: 999px;
}
</style>
```

全局 reset、设计令牌、Element Plus 主题覆盖放 `src/styles/`；主题变量文件已由 `vite.config.ts` 的 `additionalData` 全局注入（`@use "@/styles/element-plus/el-theme-light.scss"`），组件内不必重复引入。

### 3.2 scoped 内用类选择器

```vue
<!-- 错误：元素选择器，作用域内匹配成本更高，可读性也差 -->
<template>
  <article>
    <h1>{{ title }}</h1>
  </article>
</template>

<style lang="scss" scoped>
article { max-width: 800px; }
h1 { font-size: 2rem; }
</style>
```

```vue
<!-- 正确 -->
<template>
  <article class="article">
    <h1 class="article-title">{{ title }}</h1>
  </article>
</template>

<style lang="scss" scoped>
.article {
  max-width: 800px;
}

.article-title {
  font-size: 2rem;
}
</style>
```

### 3.3 `:deep()` 只在必要时用

覆盖 Element Plus 内部元素时才用 `:deep()`，并且限定在具体的父类下面，不要写成全局覆盖：

```scss
.user-table {
  :deep(.el-table__cell) {
    padding: 8px 0;
  }
}
```

---

## 规则四：用 `useTemplateRef()` 取引用

```vue
<script setup lang="ts">
defineOptions({ name: 'UserDialog' })

const formRef = useTemplateRef('formRef')
const visible = ref(false)

async function open(record?: User.SysUser) {
  visible.value = true
  await formRef.value?.clearValidate()
}

defineExpose({ open })
</script>

<template>
  <el-dialog v-model="visible">
    <el-form ref="formRef" :model="form" :rules="rules">...</el-form>
  </el-dialog>
</template>
```

`script` 里声明的 ref 名必须与模板里 `ref="formRef"` 一致。项目存量代码用的就是这个写法，保持一致。

---

## 规则五：`:style` 用 camelCase

```vue
<!-- 错误 -->
<div :style="{ 'font-size': fontSize + 'px', 'background-color': backgroundColor }">内容</div>

<!-- 正确 -->
<div :style="{ fontSize: fontSize + 'px', backgroundColor: backgroundColor }">内容</div>
```

---

## 规则六：`v-for` 与 `v-if`

### 6.1 始终提供稳定的 `:key`

```vue
<!-- 正确：用主键 -->
<li v-for="item in items" :key="item.id">
  <el-input v-model="item.remark" />
</li>
```

不要用对象本身或数组索引作 key。

### 6.2 不在同一元素上混用

```vue
<!-- 错误 -->
<li v-for="user in users" v-if="user.active" :key="user.id">{{ user.nickname }}</li>
```

```ts
// 正确：过滤用 computed
const activeUsers = computed(() => users.value.filter((user) => user.active))
```

```vue
<!-- 正确：整体显隐用外层容器 -->
<ul v-if="shouldShowUsers">
  <li v-for="user in users" :key="user.id">{{ user.nickname }}</li>
</ul>
```

---

## 规则七：禁止 `v-html`

本项目当前 **0 处** `v-html`，新代码也不要引入。`v-html` 会让用户输入直接变成可执行 HTML，且会绕过 Vue 的作用域样式。

```vue
<!-- 禁止 -->
<article v-html="userProvidedContent"></article>
```

```vue
<!-- 纯文本用插值 -->
<p>{{ userProvidedContent }}</p>
```

确实需要展示富文本时，先由后端净化为安全内容，或在项目里新增专用的富文本渲染组件，不要直接在页面里写 `v-html`。

---

## 规则八：`v-if` 还是 `v-show`

| 条件 | 选择 | 原因 |
|---|---|---|
| 频繁切换（展开收起、tab 切内容） | `v-show` | 保留 DOM，只切 `display` |
| 罕见条件、权限控制 | `v-if` | 不渲染就不承担挂载成本 |
| 内容昂贵（图表、大表格）且需反复切换 | `v-show` | 避免反复 init / destroy |
| 依赖异步数据的初始渲染 | `v-if` | 数据未就绪时不挂载，避免空数据初始化 |

```vue
<!-- 错误：频繁切换却用 v-if，反复挂载卸载 -->
<ComplexPanel v-if="isPanelOpen" />

<!-- 错误：极少显示却用 v-show，首屏白付渲染成本 -->
<AdminPanel v-show="isAdmin" />
```

```vue
<!-- 正确 -->
<ComplexPanel v-show="isPanelOpen" />
<AdminPanel v-if="isAdmin" />
```

---

## 要点速览

1. **顺序**：`<template>` → `<script setup>` → `<style lang="scss" scoped>`；`defineOptions({ name })` 只有全局组件与私有子组件写，路由页面不写
2. **全局组件直写标签**，私有子组件 import 用 PascalCase
3. **样式隔离**：默认 scoped，全局规则进 `src/styles/`，`:deep()` 限定父类
4. **scoped 用类选择器**，不用元素选择器
5. **取引用**用 `useTemplateRef('xxx')`
6. **`:style` 键名** camelCase
7. **列表**：稳定主键；不与 `v-if` 混用
8. **安全**：禁止 `v-html`
9. **渲染策略**：频繁切换 `v-show`，罕见或昂贵 `v-if`
