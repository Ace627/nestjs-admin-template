import type { ProTableColumn } from '@/components/ProTable/types'

export interface RightToolbarProps {
  /** 是否显示「隐藏搜索」按钮，默认 true */
  search?: boolean
  /** 搜索区域显隐状态（v-model:showSearch，状态由父页面持有） */
  showSearch?: boolean
  /** 列配置（只读，用于渲染下拉勾选列表）；空数组则不显示「显隐列」按钮 */
  columns?: ProTableColumn[]
  /** 列显隐状态（v-model:hiddenColumnKeys，元素为 generateColumnKey 生成的列 key） */
  hiddenColumnKeys?: string[]
  /** 显隐状态 localStorage 记忆 key；不传则不记忆 */
  storageKey?: string
}
