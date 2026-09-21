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

- 不写兼容性代码，除非我主动要求
- 变量命名不缩写，见名知意
- 注释简单明了即可，不堆砌冗余解释
- 生成的代码务必与现有代码风格保持一致
- defineOptions({ name: 'Xxx' }) 必须紧邻 setup 下

## 前端代码

- 界面图标一律用 `SvgIcon` 组件（`src/assets/svg-icons` 下的 svg），禁止 Element Plus 图标、图标字体、图片和 emoji
- localStorage 须经 `src/utils/cache/*.cache.ts` 封装并在 `src/utils/index.ts` 统一导出，禁止裸调
- 列表页的弹窗/抽屉一律拆分为 `components/XxxDialog.vue`、`components/XxxDrawer.vue` 子文件（参照 system/user 等既有范式），禁止内联在 index.vue 中；子组件通过 `defineExpose({ open })` 暴露打开方法，操作成功后 `emits('getList')` 刷新列表
- 模板中 prop 名与变量名相同时使用同名简写（Vue 3.4+），如 `:columns` 而非 `:columns="columns"`；该简写仅适用于属性/prop，指令（v-loading 等）不适用
- ProTable 列配置了 `slot` 就不要再写 `prop`

## 技术规则

- @Column 属性名含大写时，须显式指定 snake_case
  列名（name: 'user_name'），否则生成驼峰列
