<template>
  <div class="app-content flex flex-col h-full">
    <ProSearch v-show="showSearch" v-permissions="['monitor:operlog:query']" :items="items" v-model="queryParams" @query="handleQuery" @reset="resetQuery" />

    <div class="mb-16px flex items-center justify-between">
      <div>
        <el-button v-permissions="['monitor:operlog:delete']" :loading type="danger" plain @click="handleDelete()" :disabled="!isMultiple">
          <template #icon> <SvgIcon name="Delete" /> </template>
          <span>批量删除</span>
        </el-button>
        <el-button v-permissions="['monitor:operlog:clear']" :loading type="danger" plain @click="handleClear">
          <template #icon> <SvgIcon name="Delete" /> </template>
          <span>清空</span>
        </el-button>
        <el-button v-permissions="['monitor:operlog:export']" :loading="exportLoading" type="warning" plain @click="handleExport">
          <template #icon> <SvgIcon name="Download" /> </template>
          <span>导出</span>
        </el-button>
      </div>
      <RightToolbar v-model:show-search="showSearch" v-model:hidden-column-keys="hiddenColumnKeys" :columns="columns" storage-key="monitor:operlog" @refresh="getList" />
    </div>

    <ProTable ref="tableRef" v-loading="loading" :data="list" :columns="columns" :hidden-column-keys="hiddenColumnKeys" @selection-change="handleSelectionChange">
      <template #businessType="{ row }">
        <DictTag :options="sys_oper_type" :value="row.businessType" />
      </template>
      <template #status="{ row }">
        <DictTag :options="sys_common_status" :value="row.status" />
      </template>
      <template #duration="{ row }">
        <span>{{ row.duration }}毫秒</span>
      </template>
      <template #action="{ row }">
        <el-link type="primary" @click="handleView(row)">详细</el-link>
        <el-link v-permissions="['monitor:operlog:delete']" type="primary" @click="handleDelete(row)">删除</el-link>
      </template>
    </ProTable>

    <ProPagination :total v-model:current-page="queryParams.pageNo" v-model:page-size="queryParams.pageSize" @pagination="getList" />

    <OperateDetailDialog ref="operateDetailDialogRef" />
  </div>
</template>

<script setup lang="ts">
import OperateDetailDialog from './detail.vue'
import { linkDownload, TipModal } from '@/utils'
import { OperlogRequest } from '@/api/monitor/operlog.request'
import type { Operlog, ProTableColumn, ProSearchItem } from '@/types'

const { sys_common_status, sys_oper_type } = useDict('sys_common_status', 'sys_oper_type')

const list = ref<Operlog.Item[]>([])
const multipleSelection = ref<Operlog.Item[]>([])
const total = ref<number>(0)
const exportLoading = ref<boolean>(false)
const loading = ref<boolean>(true)
const isMultiple = computed(() => multipleSelection.value.length > 0)
const tableRef = useTemplateRef('tableRef')
const queryParams = ref<Operlog.QueryParams>({ pageNo: 1, pageSize: 10 })
const operateDetailDialogRef = useTemplateRef('operateDetailDialogRef')

/** 搜索区域显隐（RightToolbar v-model 控制） */
const showSearch = ref(true)
/** 隐藏列 key 数组（RightToolbar v-model 控制） */
const hiddenColumnKeys = ref<string[]>([])

const items = computed<ProSearchItem[]>(() => [
  { type: 'input', prop: 'title', label: '系统模块' },
  { type: 'input', prop: 'username', label: '操作人员' },
  { type: 'input', prop: 'ip', label: '操作地址' },
  { type: 'select', prop: 'businessType', label: '操作类型', options: sys_oper_type.value },
  { type: 'select', prop: 'status', label: '操作状态', options: sys_common_status.value },
])
const columns: ProTableColumn<Operlog.Item>[] = [
  { align: 'center', type: 'selection' },
  { align: 'center', type: 'index', label: '序号', width: 64 },
  { align: 'center', prop: 'requestId', label: '请求ID', showOverflowTooltip: true, width: 100 },
  { align: 'center', prop: 'title', label: '系统模块', showOverflowTooltip: true, width: 120 },
  { align: 'center', label: '操作类型', slot: 'businessType', width: 90 },
  { align: 'center', prop: 'username', label: '操作人员', showOverflowTooltip: true },
  { align: 'center', prop: 'ip', label: '操作地址', showOverflowTooltip: true, width: 150 },
  { align: 'center', prop: 'location', label: '操作地点', showOverflowTooltip: true },
  { align: 'center', prop: 'requestMethod', label: '请求方法', width: 90 },
  { align: 'center', label: '操作状态', slot: 'status', width: 90 },
  { align: 'center', prop: 'operTime', label: '操作时间', width: 170 },
  { align: 'center', label: '消耗时间', slot: 'duration', width: 100 },
  { align: 'center', slot: 'action', label: '操作', fixed: 'right', minWidth: 120 },
]

async function getList() {
  try {
    loading.value = true
    const data = await OperlogRequest.findList(queryParams.value)
    list.value = data.records
    total.value = data.total
    loading.value = false
  } catch (error: any) {
    console.log('OperlogRequest getList error: ', error)
    loading.value = false
    return Promise.reject(error)
  }
}

function handleSelectionChange(row: Operlog.Item[]) {
  multipleSelection.value = row
}

async function handleDelete(record?: Operlog.Item) {
  try {
    const { cancel } = await TipModal.confirm(`确定要删除选中的数据吗？`)
    if (cancel) return TipModal.msg(`操作取消`)
    const ids = record ? record.id : multipleSelection.value.map((item) => item.id).join(',')
    await OperlogRequest.delete({ ids })
    if (list.value.length <= 1) queryParams.value.pageNo = queryParams.value.pageNo > 1 ? queryParams.value.pageNo - 1 : 1
    await getList()
    TipModal.msgSuccess(`删除成功`)
    if (!isMultiple.value) return
    multipleSelection.value = []
    tableRef.value?.clearSelection()
  } catch (error: any) {
    console.log('operlog handleDelete error: ', error)
    return Promise.reject(error)
  }
}

function handleView(record: Operlog.Item) {
  operateDetailDialogRef.value?.open(record)
}

async function handleClear() {
  const { cancel } = await TipModal.confirm(`确定要清空所有的数据吗？`)
  if (cancel) return TipModal.msg(`操作取消`)
  const clearMessage = await OperlogRequest.clear()
  await getList()
  TipModal.msgSuccess(clearMessage || `数据清空成功`)
}

async function handleExport() {
  try {
    exportLoading.value = true
    const response = await OperlogRequest.export(queryParams.value)
    const filenameMatch = response.headers['content-disposition'].match(/filename\*=UTF-8''(.*)/i)
    const filename = decodeURIComponent(filenameMatch[1])
    linkDownload(response.data, filename)
    exportLoading.value = false
  } catch (error) {
    console.log('handleExport error: ', error)
    exportLoading.value = false
    return Promise.reject(error)
  }
}

function handleQuery() {
  if (loading.value) return TipModal.msgWarning('正在查询中，请勿重复操作')
  queryParams.value.pageNo = 1
  multipleSelection.value = []
  tableRef.value?.clearSelection()
  getList()
}

function resetQuery() {
  handleQuery()
}

onMounted(() => {
  getList()
})
</script>

<style lang="scss" scoped></style>
