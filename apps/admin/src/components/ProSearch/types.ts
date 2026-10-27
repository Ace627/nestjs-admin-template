import type { Ref } from 'vue'

export interface ProSearchProps {
  items: ProSearchItem[]
  /** 每列的宽度（基于 24 格布局） */
  span?: number
  /** 表单控件间隙 */
  gutter?: number
  /** 默认是否展开（仅在 showExpand 为 true 且 isExpand 为 false 时生效） */
  defaultExpanded?: boolean
  /** 表单域标签的位置 */
  labelPosition?: 'left' | 'right' | 'top'
  /** 搜索按钮文本 */
  searchButtonText?: string
  /** 重置按钮文本 */
  resetButtonText?: string
}

type ProSearchOption = { label: string; value: any; [key: string]: any }

export interface ProSearchItem {
  /** 表单项的标签文本或自定义渲染函数 */
  label: string
  /** 传递给表单项组件的属性 */
  prop: string
  /** 表单项类型，支持预定义的组件类型 */
  type: 'input' | 'select' | 'date'
  /** 表单项的占位符文本 */
  placeholder?: string
  /** 选项数据，用于 select、checkbox-group、radio-group 等 */
  options?: ProSearchOption[] | Ref<ProSearchOption[]>
  /** 是否隐藏该表单项 */
  hidden?: boolean
}
