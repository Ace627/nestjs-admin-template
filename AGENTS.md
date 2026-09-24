# AGENTS 协作规范

## 基本约定

- 全程使用简体中文回复
- 每次回复前，用固定称呼「主人」开头

## 协作流程

- 写代码前，先描述方案，经我批准后再动手
- 需求模糊时，先提问澄清，再写代码
- 单次修改超过 3 个文件时，先拆分成小任务
- 写完代码后，列出边缘情况并建议测试用例
- 出 bug 时，先写能重现的测试，再修复
- 每次被纠正后，反思原因并制定不再犯的计划

## 编码风格

- 生成任何代码前，先遵循 docs/代码风格.md 的项目风格约定（命名、模块组织、惯用写法、错误处理，取自真实代码归纳）
- 不写兼容性代码，除非我主动要求
- 变量命名不缩写，见名知意
- 注释简单明了即可，不堆砌冗余解释
- 生成的代码务必与现有代码风格保持一致
- defineOptions({ name: 'Xxx' }) 必须紧邻 setup 下

## 前端代码

- Vue、Pinia、Vue Router、VueUse 的 API 及 `src/hooks`、`src/store/modules` 下的导出已由自动导入插件（`build/plugins/auto-import-plugin.ts`）全局注入，代码中直接使用，禁止写显式 import；类型（type）导入不受此限
- 界面图标一律用 `SvgIcon` 组件（`src/assets/svg-icons` 下的 svg），禁止 Element Plus 图标、图标字体、图片和 emoji
- localStorage 须经 `src/utils/cache/*.cache.ts` 封装并在 `src/utils/index.ts` 统一导出，禁止裸调
- 列表页的弹窗/抽屉一律拆分为 `components/XxxDialog.vue`、`components/XxxDrawer.vue` 子文件（参照 system/user 等既有范式），禁止内联在 index.vue 中；子组件通过 `defineExpose({ open })` 暴露打开方法，操作成功后 `emits('getList')` 刷新列表
- 模板中 prop 名与变量名相同时使用同名简写（Vue 3.4+），如 `:columns` 而非 `:columns="columns"`；该简写仅适用于属性/prop，指令（v-loading 等）不适用
- ProTable 列配置了 `slot` 就不要再写 `prop`
- 动态路由页面组件（后端菜单经 `router.helper.ts` 的 `loadView` 加载的 `src/views` 组件）内部禁止手写 `defineOptions({ name: 'xxx' })`：组件 name 由 `loadView` 按组件路径统一生成并与路由 name 对齐（如 `system/user/index` → `SystemUser`），手动命名与之一不一致会导致 tags-view 的 keep-alive 页面缓存失效，且多处手动命名易冲突、形成 name 双源维护。若 `defineOptions` 中还含 `inheritAttrs` 等其他选项，仅删 `name` 保留其余。适用边界：静态路由组件（首页、登录页、404、个人中心）、布局组件、独立弹窗/抽屉子组件不受此限，仍按需命名：

  ```ts
  // 错误：动态路由页面组件手写 name，与 loadView 生成的 SystemUser 不一致，缓存失效
  defineOptions({ name: 'User' })

  // 正确：动态路由组件不写 name，缓存 name 仅由 loadView 统一提供
  ```

## 技术规则

- @Column 属性名含大写时，须显式指定 snake_case
  列名（name: 'user_name'），否则生成驼峰列
