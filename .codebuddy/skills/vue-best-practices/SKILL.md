---
name: vue-best-practices
description: Vue 3 前端开发规范（apps/admin）。凡涉及 Vue、.vue 文件、Vue Router、Pinia、Vite 的任务都应使用。默认 Composition API + script setup + TypeScript；SFC 顺序、全局组件、自动导入等硬性规矩见本文件第一节，优先级高于所有 references。
---

# Vue 最佳实践工作流

本技能是一份**指令集**，按顺序执行。

- **第一节是项目硬规则**，优先级高于 `references/` 中任何一条，开工前必须读完。
- **第二节是执行流程**，按步骤走。
- 动画、KeepAlive、Suspense、SSR 等主题本项目不使用，相关 reference 未收录。

---

# 第一节 项目硬规则

## 项目事实

- 前端应用：`apps/admin`
- Vue `^3.5.44`、TypeScript、Element Plus `^2.14`、Pinia `^4`、Vue Router `^5`、UnoCSS、SCSS、Vite
- 代码风格：无分号、单引号、2 空格缩进、`printWidth: 220`、`trailingComma: "all"`
- 无 ESLint，类型检查靠 `vue-tsc -b`
- **纯 SPA，无 SSR、无 Nuxt**

## 1. SFC 结构

顺序**固定**为：

```vue
<template>
  ...
</template>

<script setup lang="ts">
// 是否需要 defineOptions({ name })，见下表
...
</script>

<style lang="scss" scoped>
...
</style>
```

- `<template>` 在前，`<script setup>` 居中，`<style>` 在最后。**不要写 `<script>` 在前的结构。**
- 样式一律 `<style lang="scss" scoped>`，用类选择器不用元素选择器；类名 kebab-case，有层级关系时用 BEM 的 `&__element` 嵌套（写法参考 `views/dashboard/index.vue`）。
- `defineOptions({ name })` 写在 `<script setup>` 第一行、import 语句之前，**但要不要写取决于组件身份**：

| 组件位置 | 是否写 | 原因 |
|---|---|---|
| `src/views/` 下由后端菜单配置的页面 | **不写** | name 由 `src/router/router.helper.ts` 的 `loadView` 按菜单 `component` 路径算出并**强制覆盖**（`system/user/index` → `SystemUser`）。手写会被覆盖，是误导性死代码 |
| `src/router/modules/static.route.ts` 里声明的页面 | **必须写，且与路由 `name` 完全一致** | 静态路由不走 `loadView`。`<KeepAlive :include>` 按组件 name 匹配，名字对不上就匹配不到，切页签回来会重新挂载、表单与滚动状态全部丢失 |
| `src/components/`、`src/layout/`、`views/**/components/` | 写，语义化 PascalCase | 全局组件与私有子组件，不参与 KeepAlive |

KeepAlive 链路：`layout/components/AppMain/index.vue` 的 `:include="tagsViewStore.cachedViews"` → `cachedViews` 存的是**路由 name** → 动态路由的组件 name 由同一个 `toPascalCase` 生成、天然对齐；静态路由必须手工对齐。

## 2. 自动导入（禁止手写 import）

由 `build/plugins/auto-import-plugin.ts` 配置，以下内容**直接使用，不写 import 语句**：

| 来源 | 可直接使用 |
|---|---|
| `vue` | `ref` `reactive` `shallowRef` `computed` `watch` `watchEffect` `nextTick` `onMounted` `onUnmounted` `onUpdated` `useTemplateRef` `useAttrs` `defineAsyncComponent` `h` `withModifiers` `withKeys` `withDirectives` 等全部运行时 API |
| `pinia` | `defineStore` `storeToRefs` `acceptHMRUpdate` |
| `vue-router` | `useRoute` `useRouter` `onBeforeRouteLeave` 等 |
| `@vueuse/core` | `useDebounceFn` `useMediaQuery` `useEventListener` 等 |
| `src/hooks/` | 该目录下所有导出（如 `useDict`、`useConfig`、`useTheme`） |
| `src/store/modules/` | 该目录下所有导出（如 `useAppStore`、`useUserStore`） |
| `element-plus` | 所有 `<el-* />` 组件，由 `unplugin-vue-components` + `ElementPlusResolver` 按需引入 |

**必须显式 import 的：**

- `@/utils`、`@/api`、`@/types` 三者的导出（不参与自动导入）
- 第三方库（`dayjs`、`lodash-es`、`echarts`、`cronstrue` 等）
- Element Plus 的**类型**（如 `FormRules`，需 `import type { FormRules } from 'element-plus'`）
- Element Plus 的**组件在非模板场景**（渲染函数 `h(ElInput, ...)`、命令式 `ElMessage.success()`、`ref<InstanceType<typeof ElTree>>()`）——`unplugin-vue-components` 只处理模板里的 `<el-*>`，这些必须手动 import

**关于 Vue 类型：** 运行时 API 一律省略 import；类型按需 `import type { Xxx } from 'vue'`（如 `CSSProperties`、`InjectionKey`、`Directive`、`App`）。这两者不冲突——项目既有代码就是这么写的。

## 3. 全局组件

`src/components/` 下的组件**全部是全局组件**，已在 `src/plugins/modules/global-component.ts` 注册：

`SvgIcon` `ProChart` `ProTable` `ProSearch` `ProTooltip` `ProPagination` `DictTag` `IconSelect` `CrontabDialog` `RightToolbar`

规矩：

- 模板中**直接写标签**：`<ProTable />`、`<DictTag />`、`<SvgIcon />`
- **禁止 import，禁止局部注册，禁止 `components: {}`**
- 新增全局组件必须同步改 `src/plugins/modules/global-component.ts`
- 首屏不需要的组件用 `defineAsyncComponent` 异步注册（参考 `ProChart`、`CrontabDialog`、`IconSelect` 的既有写法）
- 业务页面内的私有子组件放 `views/**/components/`，这类**需要**正常 import

权限控制用现有指令：`v-permissions`（按权限编码）、`v-roles`（按角色标识），定义在 `src/directives/modules/`，无权限时直接移除元素。

## 4. 不写版本兼容代码

基线是 Vue 3.5，以下旧写法**禁止出现**（除非改存量代码时保持原样）：

| 禁止 | 应当使用 |
|---|---|
| `modelValue` + `update:modelValue` 手写双向绑定 | `defineModel()` |
| `ref<InstanceType<typeof X>>(null)` 取组件实例 | `useTemplateRef('xxx')` + 子组件 `defineExpose` |
| `import { ref } from 'vue'` | 直接使用（自动导入） |
| `this.$xxx` / Options API 的 `data` / `methods` | `<script setup>` |
| 为兼容旧浏览器写的 polyfill / 降级分支 | 不写 |

响应式 props 解构（`const { title = '默认值' } = defineProps<...>()`）**可用**；但存量代码里的 `withDefaults(defineProps<...>(), {...})` 写法**不要主动改**。

## 5. 命名与注释

- 变量、函数、类型必须见名知意，**禁止缩写**。
  - 反例：`v`、`e`、`q`、`u`、`i`、`d`、`res`
  - 正例：`event`、`query`、`user`、`index`、`department`、`response`
  - 循环变量用 `item`、`index`，不要用 `i`、`j`
- 禁止 `_` 前缀表示私有。需要私有语义时用闭包内的完整命名（如 `internalItems`），不靠下划线。
- 注释只加在关键处；一眼看懂的代码不加注释。函数用途用 `/** ... */` 单行说明。

## 6. 组合式函数归属

- 目录是 **`src/hooks/`**，不是 `composables/`；文件命名 `useXxx.ts`
- 位于 `src/hooks/` 的导出自动导入，**页面里不要再 import**
- 无状态的纯计算函数放 `src/utils/`（`@/utils` 桶导出），不要在 hook 里包一层
- hook 内的 DOM 操作与清理逻辑必须成对出现（`onMounted` 配 `onUnmounted`）

## 7. 状态管理

- 跨页面/跨功能共享状态 → Pinia setup store，放 `src/store/modules/`
- 单个功能内部状态 → 留在组件里；功能级有状态流程 → 放 `src/hooks/`
- **不要**为了"共享"而导出模块级可变 `reactive` 对象

```ts
// src/store/modules/app.ts 的既有写法
export const useAppStore = defineStore('app', () => {
  const isCollapse = ref<boolean>(getSidebarStatus())

  function toggleSidebar(): void {
    isCollapse.value = !isCollapse.value
    setSidebarStatus(isCollapse.value)
  }

  return { isCollapse, toggleSidebar }
})
```

**关于 `readonly` 状态（明确结论：不使用）**

不对外返回 `readonly` 状态。"变更只走 action"的思路保留，但不靠只读代理实现。原因：

1. `readonly` 在生产环境**静默失败**，写不进去也不报错，比直接报错更难排查
2. 与 `v-model` 冲突，El Plus 表单/弹窗大量直接绑定状态
3. 深层只读会误伤 ProTable 行内编辑这类"外部本来就需要写"的场景
4. Pinia setup store 直接暴露 state 是既有约定，也符合 Pinia 自身的做法

替代做法：**把 action 写全**。例如 `app.ts` 缺少 `setDevice`，导致 `useResize.ts` 直接给 `appStore.device` 赋值——正确修法是补 action，而不是加只读护栏。

```ts
function setDevice(nextDevice: 'desktop' | 'mobile'): void {
  device.value = nextDevice
}
```

## 8. 已知的历史不一致

以下为存量代码现状，**新代码按本文件执行，不要去改动存量**：

- `src/hooks/useResize.ts` 直接给 `appStore.device` 赋值（缺 `setDevice` action）
- 存量组件用 `withDefaults(defineProps<...>(), {...})`，新代码可用响应式解构

---

# 第二节 执行流程

## 第一步：确认任务范围，不要过度设计

- 改动范围限定在需求描述内。局部修复不要顺手重构周边代码。
- 先读相关现有实现，跟随项目既有写法，不要因为是"最佳实践"就推翻已有结构。
- 需要拆分组件或抽 hook 时，判断标准是「这段职责是否有独立的不变式」，不是「文件行数」或「有没有 ref」。

## 第二步：按任务类型读 reference

**不要全读**，按需选择：

| 任务类型 | 必读 |
|---|---|
| 任何 `.vue` 改动 | `references/reactivity.md`、`references/sfc.md` |
| 组件间传值、props/emit、v-model、provide/inject | 追加 `references/component-data-flow.md` |
| 新增或修改 `src/hooks/` 下的组合式函数 | 追加 `references/composables.md` |
| 改 Pinia store | 追加 `references/state-management.md` |

## 第三步：应用核心基础

### 响应式

- 源头状态最少化：能用 `computed` 派生的，绝不另开 `ref` 并靠 `watch` 回写。
- 对象/数组整体替换为主 → `ref`；单一状态对象就地改属性 → `reactive`（配合 `toRefs`）。
- 不要直接从 `reactive()` 解构；`watch` 监听 `reactive` 属性必须传 getter。
- `computed` getter 保持纯净，副作用（请求、存储写入、`console`）放 `watch`。
- 竞态请求用 `onCleanup` + `AbortController`。
- primitive 用 `ref`，不要用 `shallowRef`（见 `references/reactivity.md` 说明）。

### SFC 与模板

- 顺序见第一节第 1 条。
- 模板保持声明式：过滤、排序、拼接放 `computed`，不要在模板里调用方法或写复杂表达式。
- `v-for` 必须有稳定的原始类型 `:key`（`id`），不要用对象或索引。
- `v-for` 不与 `v-if` 共用同一元素：过滤用 `computed`，整体显隐用外层容器。
- 频繁切换用 `v-show`，罕见且昂贵的内容用 `v-if`。
- **项目禁止 `v-html`**（当前全站 0 处）。确需富文本，先由后端净化为安全内容或改用组件渲染。

### 组件边界与数据流

- 默认 props 向下、事件向上。
- `v-model` 一律用 `defineModel()`。
- 子组件不得修改 props；需要变就 emit 或本地副本。
- 组件事件不冒泡，包装组件要显式 re-emit。
- 跨层级共享且中间层只做转发的，才用 provide/inject，并且必须 `InjectionKey` + 类型化。
- 父组件命令式调用子组件方法：子组件 `defineExpose`，父组件 `useTemplateRef`。
- 全局组件直接写标签，私有子组件才 import。

### 组合式函数

- 放 `src/hooks/useXxx.ts`，自动导入。
- 参数超过两个就改选项对象：`useXxx(source, { option1, option2 })`。
- 只返回消费者需要的状态与动作，内部辅助函数保持私有。
- 无状态纯函数放 `src/utils/`，不要包装成 hook。
- 不要写「一个页面对应一个 useXxxPage」的万能控制器。

## 第四步：可选能力按需求开启（默认不加）

下表是按实际需求筛选出的可选能力。**需求没有对应的就跳过，不要主动引入。**

| 需求 | 参考 |
|---|---|
| 父组件需要控制子组件的内容或布局 | `references/component-slots.md` |
| 封装 el-* 基础组件，需要透传 attrs / 事件 | `references/component-fallthrough-attrs.md` |
| 弹层需要脱离父级 overflow / transform 限制 | `references/component-teleport.md` |
| 重型组件首屏不需要加载 | `references/component-async.md` |
| 需要注册全局能力（组件、指令、provide） | `references/plugins.md` |
| 跨页面共享状态 | `references/state-management.md` |
| 模板确实无法表达的结构 | `references/render-functions.md`（降级选项） |
| DOM 层行为无法用组件或 hook 表达 | `references/directives.md` |

以下主题本项目**不使用**，不要主动引入：`<KeepAlive>`、`<Suspense>`、`<Transition>`/`<TransitionGroup>` 动画方案、SSR 懒水合（`hydrateOnVisible` 等）、组件数超限时的列表去抽象。

## 第五步：性能优化放在功能正确之后

先跑通行为并验证，再做性能。不要在功能未完成时提前优化。

| 瓶颈 | 参考 |
|---|---|
| 长列表（50+ 行且内容复杂） | `references/perf-virtualize-large-lists.md` |
| 静态子树反复重渲染 | `references/perf-v-once-v-memo-directives.md` |
| `onUpdated` 中有重活 | `references/updated-hook-performance.md` |

注意：El Plus 的 `el-table` 已有自身的渲染机制，**不要**给 `el-table` 套虚拟滚动库；虚拟化只用于自绘的长列表。

## 第六步：收尾自检

逐条确认，任一条不满足就修：

1. **SFC 顺序**：`<template>` → `<script setup>` → `<style>`；`defineOptions({ name })` 按第 1 节表格判断——动态路由页面不写，静态路由页面写且与路由 `name` 一致。
2. **无多余 import**：Vue / Pinia / Router / VueUse 的 API、`src/hooks`、`src/store/modules` 的导出都没有手写 import；`@/utils`、`@/api`、`@/types` 是显式 import。
3. **全局组件未 import**：模板里 `<ProTable />`、`<DictTag />`、`<SvgIcon />` 等直接使用；新增的已同步到 `global-component.ts`。
4. **无兼容分支**：没有 `modelValue` 手写双向绑定、没有 `ref<InstanceType<typeof X>>`。
5. **命名无缩写**，无 `_` 前缀私有约定。
6. **响应式最小化**：派生值走 `computed`，副作用走 `watch`，`computed` 内无副作用。
7. **清理成对**：监听器、定时器、`ResizeObserver`、`AbortController` 都在卸载或 `onCleanup` 中释放。
8. **未引入以下主题**：KeepAlive、Suspense、Transition 动画、SSR 水合。
9. 行为符合需求，`vue-tsc -b` 无新增类型错误。
