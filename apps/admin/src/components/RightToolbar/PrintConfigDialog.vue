<template>
  <el-dialog v-model="dialogVisible" width="640px" align-center :append-to-body="true" class="print-config-dialog" @open="resetPrintForm">
    <template #header>
      <div class="print-dialog-header">
        <div class="print-dialog-header-icon"><SvgIcon name="Print" /></div>
        <div class="print-dialog-header-title">列表打印配置面板</div>
      </div>
    </template>

    <el-form label-width="80px">
      <el-form-item label="打印标题">
        <el-input v-model="printTitleInput" :maxlength="80" show-word-limit placeholder="请输入打印标题" />
      </el-form-item>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="选择数据">
            <el-select v-model="dataScope" class="w-full">
              <el-option label="当前页数据" value="currentPage" />
              <el-option label="勾选数据" value="selectedRows" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="打印方向">
            <el-select v-model="printOrientation" class="w-full">
              <el-option label="纵向" value="portrait" />
              <el-option label="横向" value="landscape" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="打印密度">
            <el-select v-model="printDensity" class="w-full">
              <el-option label="紧凑" value="compact" />
              <el-option label="标准" value="standard" />
              <el-option label="宽松" value="relaxed" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="打印字号">
            <el-input-number v-model="printFontSize" :min="10" :max="16" :step="1" controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <div class="print-dialog-options-panel">
      <el-checkbox v-model="showRowNumber">增加序号列</el-checkbox>
      <el-checkbox v-model="showSummary">打印统计信息</el-checkbox>
      <el-checkbox v-model="showZebra">打印斑马纹</el-checkbox>
    </div>

    <div class="print-dialog-fields-panel">
      <div class="print-dialog-fields-toolbar">
        <el-checkbox v-model="checkAllFields" :indeterminate="isFieldsIndeterminate">全选字段</el-checkbox>
        <div class="print-dialog-fields-toolbar-actions">
          <el-button link type="primary" @click="toggleOnlyShowChecked">{{ onlyShowCheckedFields ? '显示全部' : '仅显示列' }}</el-button>
          <el-button link type="primary" @click="resetFieldStates">恢复默认</el-button>
        </div>
      </div>
      <div class="print-dialog-fields-list">
        <div v-for="field in displayedFields" :key="field.fieldKey" class="print-dialog-field-row">
          <el-checkbox v-model="field.checked">{{ field.fieldLabel }}</el-checkbox>
          <el-input-number v-model="field.printWidth" :min="40" :max="500" :step="10" controls-position="right" class="print-dialog-field-width" />
        </div>
        <div v-if="!displayedFields.length" class="print-dialog-fields-empty">暂无可打印字段</div>
      </div>
    </div>

    <template #footer>
      <div class="print-dialog-footer">
        <span class="print-dialog-footer-tip"><i class="print-dialog-footer-tip-icon">i</i>纸面宽度不足时字号将自动压缩，以保证所有列完整显示</span>
        <div>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleConfirmPrint">确认打印</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { generateTableColumnKey, printTable, TipModal, useTablePrintContext } from '@/utils'
import type { TablePrintContext, TablePrintDensity } from '@/utils'

defineOptions({ name: 'PrintConfigDialog' })

/** 字段未配置 width 时的默认打印宽度 */
const FALLBACK_FIELD_WIDTH = 120

/** 打印字段状态：勾选 + 打印宽度 */
interface PrintFieldState {
  fieldKey: string
  fieldLabel: string
  checked: boolean
  printWidth: number
}

// 仅由 RightToolbar 在打印上下文存在时渲染，setup 阶段必能找到同页 ProTable 注册的上下文
const printContext = useTablePrintContext().value as TablePrintContext

const dialogVisible = computed({
  get: () => printContext.dialogVisible.value,
  set: (visible: boolean) => {
    printContext.dialogVisible.value = visible
  },
})

const printTitleInput = ref('')
const dataScope = ref<'currentPage' | 'selectedRows'>('currentPage')
const printOrientation = ref<'portrait' | 'landscape'>('landscape')
const printDensity = ref<TablePrintDensity>('standard')
const printFontSize = ref(12)
const showRowNumber = ref(false)
const showSummary = ref(true)
const showZebra = ref(true)
const onlyShowCheckedFields = ref(false)
const fieldStates = ref<PrintFieldState[]>([])

/** 字段默认状态：与列配置一致（排除系统列/操作列），默认勾选当前未隐藏的列；插槽列以 slot 名取值 */
function buildDefaultFieldStates(): PrintFieldState[] {
  const hiddenColumnKeys = printContext.hiddenColumnKeys?.() ?? []
  const defaultFieldStates: PrintFieldState[] = []
  printContext.columns.forEach((column, columnIndex) => {
    if (!column.prop && !column.slot) return
    if (column.type === 'selection' || column.type === 'index') return
    if (column.slot === 'action') return
    if (column.fixed === 'right' && column.slot) return
    const fieldKey = generateTableColumnKey(column, columnIndex)
    defaultFieldStates.push({
      fieldKey,
      fieldLabel: column.label || column.prop || column.slot || fieldKey,
      checked: !hiddenColumnKeys.includes(fieldKey),
      printWidth: typeof column.width === 'number' ? column.width : FALLBACK_FIELD_WIDTH,
    })
  })
  return defaultFieldStates
}

/** 弹窗每次打开时重置为默认配置 */
function resetPrintForm() {
  printTitleInput.value = printContext.printTitle
  dataScope.value = 'currentPage'
  printOrientation.value = 'landscape'
  printDensity.value = 'standard'
  printFontSize.value = 12
  showRowNumber.value = false
  showSummary.value = true
  showZebra.value = true
  onlyShowCheckedFields.value = false
  fieldStates.value = buildDefaultFieldStates()
}

const displayedFields = computed(() => (onlyShowCheckedFields.value ? fieldStates.value.filter((field) => field.checked) : fieldStates.value))

const checkAllFields = computed({
  get: () => fieldStates.value.length > 0 && fieldStates.value.every((field) => field.checked),
  set: (checked: boolean) => {
    fieldStates.value.forEach((field) => {
      field.checked = checked
    })
  },
})

const isFieldsIndeterminate = computed(() => {
  const checkedCount = fieldStates.value.filter((field) => field.checked).length
  return checkedCount > 0 && checkedCount < fieldStates.value.length
})

function toggleOnlyShowChecked() {
  onlyShowCheckedFields.value = !onlyShowCheckedFields.value
}

function resetFieldStates() {
  fieldStates.value = buildDefaultFieldStates()
}

/** 确认打印：按配置生成浏览器打印任务并关闭弹窗 */
function handleConfirmPrint() {
  const checkedFields = fieldStates.value.filter((field) => field.checked)
  if (!checkedFields.length) return TipModal.msgWarning('请至少勾选一个打印字段')
  const isSelectionScope = dataScope.value === 'selectedRows'
  const selectedRows = printContext.selectedRows?.() ?? []
  if (isSelectionScope && !selectedRows.length) return TipModal.msgWarning('当前未勾选任何数据，请先在表格中勾选后再打印')
  const columnWidths: Record<string, number> = {}
  for (const field of checkedFields) columnWidths[field.fieldKey] = field.printWidth
  printTable({
    printTitle: printTitleInput.value,
    tableColumns: printContext.columns,
    tableRows: (isSelectionScope ? selectedRows : printContext.currentRows()) as Record<string, unknown>[],
    hiddenColumnKeys: fieldStates.value.filter((field) => !field.checked).map((field) => field.fieldKey),
    columnWidths,
    showRowNumber: showRowNumber.value,
    isLandscapeOrientation: printOrientation.value === 'landscape',
    fontSize: printFontSize.value,
    density: printDensity.value,
    showZebra: showZebra.value,
    showSummary: showSummary.value,
  })
  dialogVisible.value = false
}
</script>

<style lang="scss" scoped>
.print-dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;

  .print-dialog-header-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 10px;
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    font-size: 20px;
  }

  .print-dialog-header-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

// 表单项默认 18px 下边距统一为 16px，与面板间距保持一致
.el-form :deep(.el-form-item) {
  margin-bottom: 16px;
}

.print-dialog-options-panel {
  display: flex;
  gap: 32px;
  margin-top: 0;
  padding: 12px 16px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
}

.print-dialog-fields-panel {
  margin-top: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  overflow: hidden;

  .print-dialog-fields-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    background: var(--el-fill-color-light);

    .print-dialog-fields-toolbar-actions .el-button + .el-button {
      margin-left: 16px;
    }
  }

  .print-dialog-fields-list {
    max-height: 260px;
    overflow-y: auto;
    padding: 4px 12px;
  }

  .print-dialog-field-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 0;

    .el-checkbox {
      flex: 1;
      margin-right: 12px;
    }
  }

  .print-dialog-field-width {
    width: 110px;
  }

  .print-dialog-fields-empty {
    padding: 16px 0;
    text-align: center;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
}

.print-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;

  .print-dialog-footer-tip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .print-dialog-footer-tip-icon {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 1px solid currentColor;
    border-radius: 50%;
    font-size: 10px;
    font-style: normal;
    line-height: 12px;
    text-align: center;
  }
}
</style>
