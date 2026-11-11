import type { ProTableColumn } from '@/types'

type TableRowData = Record<string, unknown>

/** 打印上下文：ProTable 注册，同页 RightToolbar / 打印弹窗发现并消费（行数据按 unknown 处理，打印时统一转字符串展示） */
export interface TablePrintContext {
  printTitle: string
  columns: ProTableColumn[]
  currentRows: () => unknown[]
  selectedRows: () => unknown[]
  hiddenColumnKeys: () => string[]
  /** 打印配置弹窗显隐状态 */
  dialogVisible: Ref<boolean>
  /** 打开打印配置弹窗（RightToolbar 打印按钮点击入口） */
  openDialog: () => void
}

// 已注册的打印上下文（key 为 ProTable 父组件实例 uid；shallowReactive 避免对上下文对象做深层响应式代理拆 ref）
const printContextRegistry = shallowReactive(new Map<number, TablePrintContext>())

/**
 * ProTable 调用：注册表格打印上下文，页面无须写任何代码
 * 以「ProTable 的父组件实例 uid」为锚点——同页 RightToolbar / 打印弹窗与其互为兄弟，父组件相同；
 * RightToolbar 查找时沿祖先链匹配该 uid。同页多个 ProTable 时后注册者覆盖前者
 */
export function registerTablePrintContext(printContext: Omit<TablePrintContext, 'dialogVisible' | 'openDialog'>): void {
  const instance = getCurrentInstance()
  const anchorUid = instance?.parent?.uid
  if (anchorUid === undefined) return
  const dialogVisible = ref(false)
  printContextRegistry.set(anchorUid, {
    ...printContext,
    dialogVisible,
    openDialog: () => {
      dialogVisible.value = true
    },
  })
  onUnmounted(() => {
    printContextRegistry.delete(anchorUid)
  })
}

/** RightToolbar / 打印弹窗调用：沿组件实例祖先链查找同页 ProTable 注册的打印上下文，无则返回 null（打印按钮随之隐藏） */
export function useTablePrintContext(): ComputedRef<TablePrintContext | null> {
  const startInstance = getCurrentInstance()
  return computed(() => {
    let instance = startInstance
    while (instance) {
      const printContext = printContextRegistry.get(instance.uid)
      if (printContext) return printContext
      instance = instance.parent
    }
    return null
  })
}

/**
 * 生成列的唯一标识（ProTable / RightToolbar / 打印弹窗共用，改动时只改这一处）
 * 优先级：type > prop > slot > column-${index}
 */
export function generateTableColumnKey(column: ProTableColumn, columnIndex: number): string {
  return column.type || column.prop || column.slot || `column-${columnIndex}`
}

/** 打印密度：映射单元格内边距（紧凑/标准/宽松） */
export type TablePrintDensity = 'compact' | 'standard' | 'relaxed'

/** 各打印密度对应的单元格内边距 */
const DENSITY_CELL_PADDING: Record<TablePrintDensity, string> = {
  compact: '2px 4px',
  standard: '4px 6px',
  relaxed: '8px 10px',
}

/** 各打印密度对应的单元格左右内边距合计（列宽实测用） */
const DENSITY_CELL_HORIZONTAL_PADDING_PX: Record<TablePrintDensity, number> = {
  compact: 8,
  standard: 12,
  relaxed: 20,
}

export interface TablePrintOptions<RowData extends object> {
  printTitle?: string
  tableColumns: ProTableColumn[]
  tableRows: RowData[]
  hiddenColumnKeys?: string[]
  /** 字段打印宽度覆盖（key 为 generateTableColumnKey 结果，单位 px） */
  columnWidths?: Record<string, number>
  showRowNumber?: boolean
  isLandscapeOrientation?: boolean
  /** 正文字号（px），默认 12 */
  fontSize?: number
  /** 打印密度，默认 standard */
  density?: TablePrintDensity
  /** 奇偶行斑马纹背景，默认 false */
  showZebra?: boolean
  /** 标题下方的统计信息行（共 N 条 · 打印时间），默认 true */
  showSummary?: boolean
}

/** 参与打印的列：列配置 + 列 key + 归一化后的打印宽度百分比 */
interface PrintableColumn {
  column: ProTableColumn
  columnKey: string
  widthPercent: number
}

/** 打印字段兜底宽度：列配置无 width 时参与剩余空间分配的权重 */
const PRINT_FIELD_FALLBACK_WIDTH = 120

/** 序号列宽度 */
const ROW_NUMBER_COLUMN_WIDTH = 48

/** 最小打印字号：内容再挤也不低于该字号，仍放不下则接受折行 */
const MIN_PRINT_FONT_SIZE = 8

/** 列宽安全余量：抵消浏览器字形度量与边框取整的亚像素误差，避免临界宽度折行 */
const PRINT_WIDTH_SLACK_PX = 4

/** A4 内容区宽度（96dpi 下 mm→px；纸张 210×297mm，页边距 12mm 已扣除） */
function getA4ContentWidthPx(isLandscapeOrientation: boolean): number {
  return ((isLandscapeOrientation ? 277 : 186) * 96) / 25.4
}

/** 字段打印宽度：优先取打印弹窗设置的覆盖宽度，其次取列配置自身的 width，均无则用兜底宽度 */
function resolveColumnWidthPx(printableColumn: PrintableColumn, columnWidths: Record<string, number>): number {
  const overrideWidth = columnWidths[printableColumn.columnKey]
  const rawWidth = overrideWidth ?? printableColumn.column.width
  return typeof rawWidth === 'number' && rawWidth > 0 ? rawWidth : PRINT_FIELD_FALLBACK_WIDTH
}

/** 估算文本渲染宽度（px）：全角字符按 1em、其余按 0.6em */
function estimateTextWidthPx(text: string, fontSize: number): number {
  let widthEm = 0
  for (const char of text) widthEm += char.charCodeAt(0) > 0xff ? 1 : 0.6
  return widthEm * fontSize
}

/** 逐列实测「不折行所需宽度」：取表头与所有单元格文本的较大者，加单元格左右内边距 */
function measureColumnNaturalWidthsPx(printableColumns: PrintableColumn[], tableRows: TableRowData[], fontSize: number, cellPaddingPx: number): number[] {
  return printableColumns.map((printableColumn) => {
    const column = printableColumn.column
    let maxWidthPx = estimateTextWidthPx(String(column.label || column.prop || column.slot || ''), fontSize) + cellPaddingPx
    for (const rowData of tableRows) {
      const cellValue = column.printFormatter ? column.printFormatter(rowData) : rowData[(column.prop ?? column.slot) as string]
      maxWidthPx = Math.max(maxWidthPx, estimateTextWidthPx(formatCellValue(cellValue), fontSize) + cellPaddingPx)
    }
    return maxWidthPx + PRINT_WIDTH_SLACK_PX
  })
}

/**
 * 打印版式自适应：
 * 1. 按内容实测各列「不折行所需宽度」，总宽超出纸面时循环缩小字号逼近（内边距不随字号缩，需逐轮重测）；
 * 2. 有剩余空间时按用户配置的列宽权重分配拉伸（列少时宽度配置仍决定比例）；
 * 3. 字号降到下限仍放不下才等比压缩，此时接受折行。
 */
function resolvePrintLayout(printableColumns: PrintableColumn[], tableRows: TableRowData[], showRowNumber: boolean, columnWidths: Record<string, number>, requestedFontSize: number, cellPaddingPx: number, isLandscapeOrientation: boolean): { fontSize: number; rowNumberWidthPercent: number } {
  const availableWidthPx = getA4ContentWidthPx(isLandscapeOrientation)
  const fieldAvailableWidthPx = availableWidthPx - (showRowNumber ? ROW_NUMBER_COLUMN_WIDTH : 0)

  let fontSize = requestedFontSize
  let naturalWidthPxList = measureColumnNaturalWidthsPx(printableColumns, tableRows, fontSize, cellPaddingPx)
  let naturalTotalPx = naturalWidthPxList.reduce((sum, widthPx) => sum + widthPx, 0)

  while (naturalTotalPx > fieldAvailableWidthPx && fontSize > MIN_PRINT_FONT_SIZE) {
    const fitFontSize = Math.max(MIN_PRINT_FONT_SIZE, Math.floor((fontSize * fieldAvailableWidthPx) / naturalTotalPx))
    if (fitFontSize >= fontSize) break
    fontSize = fitFontSize
    naturalWidthPxList = measureColumnNaturalWidthsPx(printableColumns, tableRows, fontSize, cellPaddingPx)
    naturalTotalPx = naturalWidthPxList.reduce((sum, widthPx) => sum + widthPx, 0)
  }

  const configWeightList = printableColumns.map((printableColumn) => resolveColumnWidthPx(printableColumn, columnWidths))
  const configTotalPx = configWeightList.reduce((sum, weight) => sum + weight, 0) || 1
  const overflowScale = naturalTotalPx > fieldAvailableWidthPx ? fieldAvailableWidthPx / naturalTotalPx : 1
  const finalWidthPxList =
    overflowScale < 1
      ? naturalWidthPxList.map((widthPx) => widthPx * overflowScale)
      : naturalWidthPxList.map((widthPx, index) => widthPx + ((fieldAvailableWidthPx - naturalTotalPx) * configWeightList[index]) / configTotalPx)
  const finalTotalPx = finalWidthPxList.reduce((sum, widthPx) => sum + widthPx, 0) || 1

  printableColumns.forEach((printableColumn, index) => {
    printableColumn.widthPercent = (finalWidthPxList[index] / finalTotalPx) * 100
  })
  return { fontSize, rowNumberWidthPercent: showRowNumber ? (ROW_NUMBER_COLUMN_WIDTH / availableWidthPx) * 100 : 0 }
}

function escapeHtmlText(rawText: unknown): string {
  return String(rawText ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** 树形表格行平铺：children 递归展开为顺序行，保证子孙行全部参与打印与计数 */
function flattenTreeRows<RowData extends object>(tableRows: RowData[]): RowData[] {
  const flattenedRows: RowData[] = []
  function walk(rows: RowData[]): void {
    for (const row of rows) {
      flattenedRows.push(row)
      const childRows = (row as TableRowData)['children']
      if (Array.isArray(childRows) && childRows.length > 0) walk(childRows as RowData[])
    }
  }
  walk(tableRows)
  return flattenedRows
}

function formatCellValue(cellValue: unknown): string {
  if (cellValue === null || cellValue === undefined) return ''
  if (typeof cellValue === 'object') {
    const serializedValue = JSON.stringify(cellValue)
    return serializedValue.length > 200 ? `${serializedValue.slice(0, 200)}…` : serializedValue
  }
  return String(cellValue)
}

function collectPrintableColumns(tableColumns: ProTableColumn[], hiddenColumnKeys: string[]): PrintableColumn[] {
  const printableColumns: PrintableColumn[] = []
  for (let columnIndex = 0; columnIndex < tableColumns.length; columnIndex += 1) {
    const column = tableColumns[columnIndex]
    if (!column.prop && !column.slot) continue // 既无字段名也无插槽名的列无法取值
    if (column.type === 'selection' || column.type === 'index') continue
    if (column.slot === 'action') continue
    if (column.fixed === 'right' && column.slot) continue
    const columnKey = generateTableColumnKey(column, columnIndex)
    if (hiddenColumnKeys.includes(columnKey)) continue
    printableColumns.push({ column, columnKey, widthPercent: 0 })
  }
  return printableColumns
}

/** 表头单元格宽度：写入归一化后的百分比 */
function buildColumnWidthStyle(printableColumn: PrintableColumn): string {
  return ` style="width:${printableColumn.widthPercent.toFixed(2)}%"`
}

function buildTableHeaderHtml(printableColumns: PrintableColumn[], showRowNumber: boolean, rowNumberWidthPercent: number): string {
  const headerCellsHtml: string[] = []
  if (showRowNumber) headerCellsHtml.push(`<th style="width:${rowNumberWidthPercent.toFixed(2)}%">序号</th>`)
  for (const printableColumn of printableColumns) {
    headerCellsHtml.push(`<th${buildColumnWidthStyle(printableColumn)}>${escapeHtmlText(printableColumn.column.label || printableColumn.column.prop || printableColumn.column.slot)}</th>`)
  }
  return headerCellsHtml.join('')
}

function buildTableBodyHtml<RowData extends object>(printableColumns: PrintableColumn[], tableRows: RowData[], showRowNumber: boolean): string {
  const tableRowsHtml: string[] = []
  for (let rowIndex = 0; rowIndex < tableRows.length; rowIndex += 1) {
    const rowData = tableRows[rowIndex] as TableRowData
    const tableCellsHtml: string[] = []
    if (showRowNumber) tableCellsHtml.push(`<td>${rowIndex + 1}</td>`)
    for (const printableColumn of printableColumns) {
      const column = printableColumn.column
      // 取值优先级：printFormatter > prop/slot 名对应的原始字段值（插槽列未配 formatter 时打印原始值）
      const cellValue = column.printFormatter ? column.printFormatter(rowData) : rowData[(column.prop ?? column.slot) as string]
      tableCellsHtml.push(`<td>${escapeHtmlText(formatCellValue(cellValue))}</td>`)
    }
    tableRowsHtml.push(`<tr>${tableCellsHtml.join('')}</tr>`)
  }
  return tableRowsHtml.join('')
}

function buildPrintDocumentHtml<RowData extends object>(options: TablePrintOptions<RowData>, printableColumns: PrintableColumn[]): string {
  const printTitle = options.printTitle ?? '表格数据'
  const showRowNumber = options.showRowNumber ?? true
  const cellPadding = DENSITY_CELL_PADDING[options.density ?? 'standard']
  const showZebra = options.showZebra ?? false
  const showSummary = options.showSummary ?? true
  const pageOrientation = options.isLandscapeOrientation ? 'landscape' : 'portrait'
  const printedAt = new Date().toLocaleString('zh-CN')
  const summaryMetaHtml = showSummary ? `<span class="meta">共 ${options.tableRows.length} 条 · ${printedAt}</span>` : ''
  const zebraStyle = showZebra ? 'tbody tr:nth-child(even) td{background:#f7f7f7}' : ''
  const printDensity = options.density ?? 'standard'
  const printLayout = resolvePrintLayout(printableColumns, options.tableRows as TableRowData[], showRowNumber, options.columnWidths ?? {}, options.fontSize ?? 12, DENSITY_CELL_HORIZONTAL_PADDING_PX[printDensity], options.isLandscapeOrientation ?? false)
  const fontSize = printLayout.fontSize
  const tableHeaderHtml = buildTableHeaderHtml(printableColumns, showRowNumber, printLayout.rowNumberWidthPercent)
  const tableBodyHtml = buildTableBodyHtml(printableColumns, options.tableRows, showRowNumber)
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtmlText(printTitle)}</title><style>
@page{size:A4 ${pageOrientation};margin:12mm}
body{font:${fontSize}px/1.5 "Microsoft YaHei",Arial,sans-serif;color:#000;background:#fff;margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.print-header{display:flex;align-items:baseline;justify-content:space-between;border-bottom:2px solid #000;padding-bottom:6px;margin:0 0 8px}
h1{font-size:${fontSize + 4}px;margin:0}
.meta{font-size:${fontSize - 1}px;color:#555;white-space:nowrap}
table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:${fontSize}px}
th,td{border:1px solid #333;padding:${cellPadding};word-break:break-all;white-space:pre-wrap;text-align:left;vertical-align:top}
th{background:#f2f2f2}thead{display:table-header-group}tr{page-break-inside:avoid}
${zebraStyle}
</style></head><body><div class="print-header"><h1>${escapeHtmlText(printTitle)}</h1>${summaryMetaHtml}</div>
<table><thead><tr>${tableHeaderHtml}</tr></thead><tbody>${tableBodyHtml}</tbody></table></body></html>`
}

function removePrintFrame(printFrame: HTMLIFrameElement): void {
  printFrame.remove()
}

export function printTable<RowData extends object>(options: TablePrintOptions<RowData>): void {
  const printableColumns = collectPrintableColumns(options.tableColumns, options.hiddenColumnKeys ?? [])
  // 树形表格（menu/dept 等以 children 嵌套的行结构）先平铺，保证子孙行全部参与打印与计数
  const printDocumentHtml = buildPrintDocumentHtml({ ...options, tableRows: flattenTreeRows(options.tableRows) }, printableColumns)
  const printFrame = document.createElement('iframe')
  Object.assign(printFrame.style, { position: 'fixed', left: '-10000px', top: '0', width: '0', height: '0', border: '0' })
  document.body.appendChild(printFrame)
  const printWindow = printFrame.contentWindow!
  printWindow.document.open()
  printWindow.document.write(printDocumentHtml)
  printWindow.document.close()
  printWindow.addEventListener('afterprint', function handleAfterPrint() {
    removePrintFrame(printFrame)
  })
  setTimeout(function triggerPrintDialog() {
    printWindow.focus()
    printWindow.print()
  }, 250)
  setTimeout(function removePrintFrameByTimeout() {
    removePrintFrame(printFrame)
  }, 60000)
}
