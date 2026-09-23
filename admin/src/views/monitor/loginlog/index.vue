<template>
  <div class="app-content flex flex-col h-full">
    <ProSearch v-show="showSearch" v-permissions="['monitor:loginlog:query']" :items v-model="queryParams" @query="handleQuery" @reset="resetQuery" />

    <div class="mb-16px flex items-center justify-between">
      <div>
        <el-button v-permissions="['monitor:loginlog:delete']" :loading type="danger" plain @click="handleDelete()" :disabled="!isMultiple">
          <template #icon> <SvgIcon name="Delete" /> </template>
          <span>批量删除</span>
        </el-button>
        <el-button v-permissions="['monitor:loginlog:clear']" :loading type="danger" plain @click="handleClear">
          <template #icon> <SvgIcon name="Delete" /> </template>
          <span>清空</span>
        </el-button>
        <el-button v-permissions="['monitor:loginlog:export']" :loading="exportLoading" type="warning" plain @click="handleExport">
          <template #icon> <SvgIcon name="Download" /> </template>
          <span>导出</span>
        </el-button>
      </div>
      <RightToolbar v-model:show-search="showSearch" v-model:hidden-column-keys="hiddenColumnKeys" :columns="columns" storage-key="monitor:loginlog" @refresh="getList" />
    </div>

    <ProTable ref="tableRef" v-loading="loading" :data="list" :columns="columns" :hidden-column-keys="hiddenColumnKeys" @selection-change="handleSelectionChange">
      <template #status="{ row }">
        <DictTag :options="sys_common_status" :value="row.status" />
      </template>
      <template #action="{ row }">
        <el-link v-permissions="['monitor:loginlog:delete']" type="primary" @click="handleDelete(row)">删除</el-link>
      </template>
    </ProTable>

    <ProPagination :total v-model:current-page="queryParams.pageNo" v-model:page-size="queryParams.pageSize" @pagination="getList" />
  </div>
</template>

<script setup lang="ts">
import { linkDownload, TipModal } from '@/utils'
import { LoginlogRequest } from '@/api/monitor/loginlog.request'
import type { ProTableColumn, ProSearchItem, Loginlog } from '@/types'

const { sys_common_status } = useDict('sys_common_status')
const list = ref<Loginlog.Item[]>([])
const multipleSelection = ref<Loginlog.Item[]>([])
const total = ref<number>(0)
const exportLoading = ref<boolean>(false)
const loading = ref<boolean>(true)
const isMultiple = computed(() => multipleSelection.value.length > 0)
const tableRef = useTemplateRef('tableRef')
const queryParams = ref<Loginlog.QueryParams>({ pageNo: 1, pageSize: 10 })

/** 搜索区域显隐（RightToolbar v-model 控制） */
const showSearch = ref(true)
/** 隐藏列 key 数组（RightToolbar v-model 控制） */
const hiddenColumnKeys = ref<string[]>([])

const items = computed<ProSearchItem[]>(() => [
  { type: 'input', prop: 'ip', label: '登录地址' },
  { type: 'input', prop: 'username', label: '登录账号' },
  { type: 'select', prop: 'status', label: '登录状态', options: sys_common_status.value },
])
const columns: ProTableColumn<Loginlog.Item>[] = [
  { align: 'center', type: 'selection' },
  { align: 'center', type: 'index', label: '序号', width: 64 },
  // { align: 'center', prop: 'requestId', label: '访问编号', showOverflowTooltip: true },
  { align: 'center', prop: 'username', label: '用户名称', showOverflowTooltip: true },
  { align: 'center', prop: 'ip', label: '地址', showOverflowTooltip: true, width: 150 },
  { align: 'center', prop: 'location', label: '登录地点', showOverflowTooltip: true, minWidth: 150 },
  { align: 'center', prop: 'os', label: '操作系统', showOverflowTooltip: true, minWidth: 150 },
  { align: 'center', prop: 'browser', label: '浏览器', showOverflowTooltip: true, width: 180 },
  { align: 'center', label: '登录状态', slot: 'status', width: 90 },
  { align: 'center', prop: 'message', label: '描述', showOverflowTooltip: true, width: 220 },
  { align: 'center', prop: 'loginTime', label: '登录时间', width: 170 },
  { align: 'center', slot: 'action', label: '操作', fixed: 'right', width: 80 },
]

async function getList() {
  try {
    loading.value = true
    const data = await LoginlogRequest.findList(queryParams.value)
    list.value = data.records
    total.value = data.total
    loading.value = false
  } catch (error: any) {
    console.log('LoginlogRequest getList error: ', error)
    loading.value = false
    return Promise.reject(error)
  }
}

function handleSelectionChange(row: Loginlog.Item[]) {
  multipleSelection.value = row
}

/** 处理表格数据删除（支持单条删除与批量删除） */
async function handleDelete(record?: Loginlog.Item) {
  try {
    const { cancel } = await TipModal.confirm(`确定要删除选中的数据吗？`)
    if (cancel) return TipModal.msg(`操作取消`)
    const ids = record ? record.id : multipleSelection.value.map((item) => item.id).join(',')
    await LoginlogRequest.delete({ ids })
    // 处理页码回退：当前页只有1条数据时，删除后返回上一页（避免空页）
    if (list.value.length <= 1) queryParams.value.pageNo = queryParams.value.pageNo > 1 ? queryParams.value.pageNo - 1 : 1
    await getList()
    TipModal.msgSuccess(`删除成功`)
    if (!isMultiple.value) return
    multipleSelection.value = []
    tableRef.value?.clearSelection()
  } catch (error: any) {
    console.log('user handleDelete error: ', error)
  }
}

async function handleClear() {
  const { cancel } = await TipModal.confirm(`确定要清空所有的数据吗？`)
  if (cancel) return TipModal.msg(`操作取消`)
  const clearMessage = await LoginlogRequest.clear()
  await getList()
  TipModal.msgSuccess(clearMessage || `数据清空成功`)
}

async function handleExport() {
  try {
    exportLoading.value = true
    const response = await LoginlogRequest.export(queryParams.value)
    const filenameMatch = response.headers['content-disposition'].match(/filename\*=UTF-8''(.*)/i)
    const filename = decodeURIComponent(filenameMatch[1])
    linkDownload(response.data, filename)
    exportLoading.value = false
  } catch (error) {
    console.log('handleExport error: ', error)
    exportLoading.value = false
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
