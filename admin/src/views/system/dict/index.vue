<template>
  <div class="app-content flex h-full gap-16px" :class="{ 'flex-col': appStore.isMobile }">
    <!-- 左侧字典类型 -->
    <TypePanel :selected-id="selectedType?.id ?? ''" @select="handleSelectType" @edited="handleTypeEdited" @deleted="handleTypeDeleted" />

    <!-- 右侧字典数据 -->
    <div class="flex flex-col flex-1 min-w-0">
      <el-empty v-if="!selectedType" description="请选择左侧字典类型后查看数据" class="flex-1" />

      <template v-else>
        <ProSearch v-show="showSearch" v-permissions="['system:dict:query']" :items="items" v-model="dataQuery" @query="handleQuery" @reset="resetQuery" />

        <div class="mb-16px flex items-center justify-between">
          <div>
            <el-button v-permissions="['system:dict:create']" plain type="primary" @click="dataDialogRef?.open()">
              <template #icon><SvgIcon name="Plus" /></template><span>新增</span>
            </el-button>
            <el-button v-permissions="['system:dict:delete']" plain type="danger" @click="handleDeleteData()" :disabled="!isMultiple">
              <template #icon><SvgIcon name="Delete" /></template><span>批量删除</span>
            </el-button>
            <el-button v-permissions="['system:dict:refresh']" plain type="warning" :loading="refreshLoading" @click="handleClearCache">
              <template #icon><SvgIcon name="Refresh" /></template><span>刷新缓存</span>
            </el-button>
          </div>
          <RightToolbar v-model:show-search="showSearch" v-model:hidden-column-keys="hiddenColumnKeys" :columns="columns" storage-key="system:dict-data" @refresh="getDataList" />
        </div>

        <ProTable ref="tableRef" v-loading="loading" :data="list" :columns="columns" :hidden-column-keys="hiddenColumnKeys" @selection-change="handleSelectionChange">
          <template #dictLabel="{ row }">
            <el-tag v-if="row.listClass" :type="row.listClass">{{ row.dictLabel }}</el-tag>
            <span v-else>{{ row.dictLabel }}</span>
          </template>
          <template #status="{ row }">
            <DictTag :options="sys_normal_disable" :value="row.status" />
          </template>
          <template #action="{ row }">
            <el-link v-permissions="['system:dict:update']" type="primary" @click="dataDialogRef?.open(row)">修改</el-link>
            <el-link v-permissions="['system:dict:delete']" type="primary" @click="handleDeleteData(row)">删除</el-link>
          </template>
        </ProTable>

        <ProPagination :total v-model:page="dataQuery.pageNo" v-model:limit="dataQuery.pageSize" @pagination="getDataList" />
      </template>
    </div>

    <!-- 字典数据新增/编辑弹窗 -->
    <DataDialog ref="dataDialogRef" :dict-type="selectedType?.dictType" @success="getDataList" />
  </div>
</template>

<script setup lang="ts">
import { TipModal } from '@/utils'
import { DictRequest } from '@/api/system/dict.request'
import { resetDictCache, useDict } from '@/hooks/useDict'
import TypePanel from './components/TypePanel.vue'
import DataDialog from './components/DataDialog.vue'
import type { Dict, ProSearchItem, ProTableColumn } from '@/types'

const appStore = useAppStore()

/* ----------------------------- 左侧类型选中联动 ----------------------------- */

/** 选中类型独立存储，翻页/搜索后右侧数据区不受当前页影响 */
const selectedType = ref<Dict.TypeItem | null>(null)

/** 选中类型（再次点击取消选中） */
function handleSelectType(target: Dict.TypeItem) {
  if (selectedType.value?.id === target.id) {
    clearSelected()
    return
  }
  selectedType.value = target
  resetDataState()
  getDataList()
}

/** 选中类型被编辑：同步最新信息（名称/编码可能已变），并刷新右侧数据 */
function handleTypeEdited(target: Dict.TypeItem) {
  selectedType.value = target
  getDataList()
}

/** 类型被删除：删的是选中类型时清空右侧 */
function handleTypeDeleted(target: Dict.TypeItem) {
  if (target.id === selectedType.value?.id) clearSelected()
}

/** 清空选中并复位右侧列表 */
function clearSelected() {
  selectedType.value = null
  list.value = []
  total.value = 0
  dataQuery.value = { pageNo: 1, pageSize: 10 }
}

/* ----------------------------- 右侧字典数据 ----------------------------- */

const list = ref<Dict.DataItem[]>([])
const multipleSelection = ref<Dict.DataItem[]>([])
const total = ref(0)
const loading = ref(false)
const isMultiple = computed(() => multipleSelection.value.length > 0)
const tableRef = useTemplateRef('tableRef')
const dataQuery = ref<Dict.DataQuery>({ pageNo: 1, pageSize: 10 })
const dataDialogRef = useTemplateRef('dataDialogRef')
const refreshLoading = ref(false)

/** 搜索区域显隐（RightToolbar v-model 控制） */
const showSearch = ref(true)
/** 隐藏列 key 数组（RightToolbar v-model 控制） */
const hiddenColumnKeys = ref<string[]>([])

const { sys_normal_disable } = useDict('sys_normal_disable')

const items = computed<ProSearchItem[]>(() => [
  { type: 'input', prop: 'dictLabel', label: '字典标签' },
  { type: 'select', prop: 'status', label: '状态', options: sys_normal_disable.value },
])

const columns: ProTableColumn<Dict.DataItem>[] = [
  { align: 'center', type: 'selection' },
  { align: 'center', type: 'index', label: '序号', width: 64 },
  { align: 'center', slot: 'dictLabel', label: '字典标签', showOverflowTooltip: true },
  { align: 'center', prop: 'dictValue', label: '字典键值', showOverflowTooltip: true },
  { align: 'center', prop: 'dictSort', label: '排序' },
  { align: 'center', prop: 'status', label: '状态', slot: 'status' },
  { align: 'center', prop: 'remark', label: '备注', showOverflowTooltip: true, width: 120 },
  { align: 'center', prop: 'createTime', label: '创建时间', width: 170 },
  { align: 'center', slot: 'action', label: '操作', fixed: 'right', minWidth: 120 },
]

/** 复位查询条件并清空勾选 */
function resetDataState() {
  dataQuery.value = { pageNo: 1, pageSize: 10 }
  multipleSelection.value = []
  tableRef.value?.clearSelection()
}

async function getDataList() {
  if (!selectedType.value) {
    list.value = []
    total.value = 0
    return
  }
  try {
    loading.value = true
    const data = await DictRequest.findDataList({ ...dataQuery.value, dictType: selectedType.value.dictType })
    list.value = data.records
    total.value = data.total
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('getDataList errMsg: ', errMsg)
    return Promise.reject(error)
  } finally {
    loading.value = false
  }
}

function handleSelectionChange(row: Dict.DataItem[]) {
  multipleSelection.value = row
}

function handleQuery() {
  if (loading.value) return TipModal.msgWarning('正在查询中，请勿重复操作')
  dataQuery.value.pageNo = 1
  multipleSelection.value = []
  tableRef.value?.clearSelection()
  getDataList()
}

function resetQuery() {
  handleQuery()
}

async function handleDeleteData(row?: Dict.DataItem) {
  try {
    const { cancel } = await TipModal.confirm('确定要删除选中的数据吗？')
    if (cancel) return TipModal.msg('操作取消')
    const ids = row ? row.id : multipleSelection.value.map((item) => item.id).join(',')
    await DictRequest.deleteData({ ids })
    if (list.value.length <= 1) dataQuery.value.pageNo = dataQuery.value.pageNo > 1 ? dataQuery.value.pageNo - 1 : 1
    await getDataList()
    TipModal.msgSuccess('删除成功')
    if (!row) {
      multipleSelection.value = []
      tableRef.value?.clearSelection()
    }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('handleDeleteData errMsg: ', errMsg)
    return Promise.reject(error)
  }
}

async function handleClearCache() {
  try {
    refreshLoading.value = true
    await DictRequest.clearCache()
    resetDictCache()
    TipModal.msgSuccess('字典缓存刷新成功')
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('handleClearCache errMsg: ', errMsg)
    return Promise.reject(error)
  } finally {
    refreshLoading.value = false
  }
}
</script>
