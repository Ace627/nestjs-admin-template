---
title: Async Component Best Practices
display_title: 异步组件
impact: MEDIUM
impactDescription: Poor async component strategy can delay interactivity and create loading UI flicker
type: best-practice
tags: [vue3, async-components, performance, ux]
---

# 异步组件

**影响：中** — 异步组件用来把首屏不需要的代码切出主包，但不能牺牲交互体感和加载体验。

> **本项目口径**：
> - 全局组件的异步注册统一定义在 `src/plugins/modules/global-component.ts`，不要在页面里临时声明
> - 项目是纯 SPA，**没有 SSR**，不做懒水合（`hydrateOnVisible` / `hydrateOnIdle` 一类）
> - `defineAsyncComponent` 是自动导入的运行时 API，不需要 import

## 任务清单

- 只对「首屏不需要 + 体积较大」的组件做异步
- 全局异步组件注册到 `global-component.ts`
- `loadingComponent` 的 `delay` 保持 200ms 左右，避免一闪而过的 loading
- `delay` 与 `timeout` 一起配，行为才可预测

---

## 一、何时该异步

| 场景 | 是否异步 |
|---|---|
| 首屏可见的布局、表格、表单 | 否 |
| 由按钮触发的弹窗、抽屉 | 是 |
| 图表（ECharts 体积大） | 是 |
| 低频页面（定时任务生成器、图标选择器） | 是 |
| 已经按路由懒加载的页面组件 | 页面内部不必再拆 |

项目现状：`ProChart`、`CrontabDialog`、`IconSelect` 已按异步注册。

---

## 二、注册方式

```ts
// src/plugins/modules/global-component.ts
import type { App } from 'vue'
import SvgIcon from '@/components/SvgIcon/index.vue'
import ProTable from '@/components/ProTable/index.vue'

/** 异步注册：不占首屏主包，渲染时才加载对应 chunk */
const ProChart = defineAsyncComponent(() => import('@/components/ProChart/index.vue'))
const CrontabDialog = defineAsyncComponent(() => import('@/components/Crontab/index.vue'))
const IconSelect = defineAsyncComponent(() => import('@/components/IconSelect/index.vue'))

export function registerGlobalComponent(app: App) {
  app.component('SvgIcon', SvgIcon)
  app.component('ProTable', ProTable)
  app.component('ProChart', ProChart)
  app.component('CrontabDialog', CrontabDialog)
  app.component('IconSelect', IconSelect)
}
```

---

## 三、加 loading 与错误态

```ts
const AsyncLogDetail = defineAsyncComponent({
  loader: () => import('@/views/monitor/operlog/components/LogDetail.vue'),
  loadingComponent: LogDetailSkeleton,
  errorComponent: LoadError,
  delay: 200,
  timeout: 30000,
})
```

- `delay`：多少毫秒后才显示 loading。设成 `0` 会让快速加载的模块闪一下骨架屏，反而更差。
- `timeout`：超过就切到 `errorComponent`，避免永远转圈。
- `loadingComponent` 用骨架屏比用转圈更稳，不会引起布局跳动。

`delay` 参考值：

| 场景 | `delay` |
|---|---|
| 小组件、网络正常 | `200`（默认） |
| 已知较重的组件 | `100` |
| 后台任务、非关键 UI | `300` ~ `500` |

---

## 四、路由级懒加载优先

页面本身应通过路由懒加载切分：

```ts
{
  path: '/system/user',
  component: () => import('@/views/system/user/index.vue'),
}
```

路由已经懒加载的页面，内部再拆异步组件收益很小，除非页面里嵌了 ECharts、富文本编辑器这类重依赖。
