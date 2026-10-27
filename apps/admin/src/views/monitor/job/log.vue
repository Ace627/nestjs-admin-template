<template>
  <div class="app-content flex flex-col h-full">
    <ProSearch v-show="showSearch" v-permissions="['monitor:job:query']" :items="items" v-model="queryParams" @query="handleQuery" @reset="resetQuery" />

    <div class="mb-16px flex items-center justify-between">
      <div>
        <el-button v-permissions="['monitor:job:delete']" plain type="danger" @click="handleDelete()" :disabled="!isMultiple">
          <template #icon><SvgIcon name="Delete" /></template><span>批量删除</span>
        </el-button>
        <el-button v-permissions="['monitor:job:delete']" plain type="danger" @click="handleClear">
          <template #icon><SvgIcon name="Delete" /></template><span>清空</span>
        </el-button>
        <el-button v-permissions="['monitor:job:export']" plain type="warning" :loading="exportLoading" @click="handleExport">
          <template #icon><SvgIcon name="Download" /></template><span>导出</span>
        </el-button>
        <el-button plain type="info" @click="handleClose">
          <span>关闭</span>
          <template #icon><SvgIcon name="Close" /></template>
        </el-button>
      </div>
      <RightToolbar v-model:show-search="showSearch" v-model:hidden-column-keys="hiddenColumnKeys" :columns="columns" storage-key="monitor:job-log" @refresh="getList" />
    </div>

    <ProTable ref="tableRef" v-loading="loading" :data="list" :columns="columns" :hidden-column-keys="hiddenColumnKeys" @selection-change="handleSelectionChange">
      <template #status="{ row }">
        <DictTag :options="sys_common_status" :value="row.status" />
      </template>
      <template #action="{ row }">
        <el-link type="primary" @click="handleView(row)">详细</el-link>
        <el-link v-permissions="['monitor:job:delete']" type="primary" @click="handleDelete(row)">删除</el-link>
      </template>
    </ProTable>

    <ProPagination :total v-model:current-page="queryParams.pageNo" v-model:page-size="queryParams.pageSize" @pagination="getList" />

    <!-- 任务日志明细弹窗 -->
    <JobLogDetailDialog ref="jobLogDetailDialogRef" />
  </div>
</template>

<script setup lang="ts">
import JobLogDetailDialog from './detail.vue'
import { linkDownload, TipModal } from '@/utils'
import { JoblogRequest } from '@/api/monitor/job-log.request'
import type { JobLog, ProSearchItem, ProTableColumn } from '@/types'

const { sys_common_status } = useDict('sys_common_status')
const router = useRouter()
const route = useRoute()

const list = ref<JobLog.Item[]>([])
const multipleSelection = ref<JobLog.Item[]>([])
const total = ref(0)
const loading = ref(true)
const exportLoading = ref(false)
const isMultiple = computed(() => multipleSelection.value.length > 0)
const tableRef = useTemplateRef('tableRef')
const jobLogDetailDialogRef = useTemplateRef('jobLogDetailDialogRef')
const queryParams = ref<JobLog.QueryParams>({ pageNo: 1, pageSize: 10 })

/** 搜索区域显隐（RightToolbar v-model 控制） */
const showSearch = ref(true)
/** 隐藏列 key 数组（RightToolbar v-model 控制） */
const hiddenColumnKeys = ref<string[]>([])

const items: ProSearchItem[] = [
  { type: 'input', prop: 'jobName', label: '任务名称' },
  { type: 'input', prop: 'jobGroup', label: '任务组名' },
  { type: 'select', prop: 'status', label: '执行状态', options: sys_common_status },
]
const columns: ProTableColumn<JobLog.Item>[] = [
  { align: 'center', type: 'selection' },
  { align: 'center', type: 'index', label: '序号', width: 64 },
  { align: 'center', prop: 'jobName', label: '任务名称', showOverflowTooltip: true, minWidth: 120 },
  { align: 'center', prop: 'jobGroup', label: '任务组名', width: 100 },
  { align: 'center', prop: 'invokeTarget', label: '调用目标', showOverflowTooltip: true, minWidth: 200 },
  { align: 'center', prop: 'jobMessage', label: '日志信息', showOverflowTooltip: true, minWidth: 200 },
  { align: 'center', label: '执行状态', slot: 'status', width: 90 },
  { align: 'center', prop: 'createTime', label: '执行时间', width: 170 },
  { align: 'center', slot: 'action', label: '操作', fixed: 'right', width: 120 },
]

async function getList() {
  try {
    loading.value = true
    const data = await JoblogRequest.findList(queryParams.value)
    list.value = data.records
    total.value = data.total
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('getList errMsg: ', errMsg)
    return Promise.reject(error)
  } finally {
    loading.value = false
  }
}

function handleSelectionChange(row: JobLog.Item[]) {
  multipleSelection.value = row
}

function handleClose() {
  router.replace({ path: '/monitor/job' })
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

function handleView(row: JobLog.Item) {
  jobLogDetailDialogRef.value?.open(row)
}

async function handleExport() {
  try {
    exportLoading.value = true
    const response = await JoblogRequest.export(queryParams.value)
    const filenameMatch = response.headers['content-disposition'].match(/filename\*=UTF-8''(.*)/i)
    const filename = decodeURIComponent(filenameMatch[1])
    linkDownload(response.data, filename)
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('handleExport errMsg: ', errMsg)
    return Promise.reject(error)
  } finally {
    exportLoading.value = false
  }
}

/** 处理表格数据删除（支持单条删除与批量删除） */
async function handleDelete(row?: JobLog.Item) {
  try {
    const { cancel } = await TipModal.confirm('确定要删除选中的数据吗？')
    if (cancel) return TipModal.msg('操作取消')
    const ids = row ? row.id : multipleSelection.value.map((item) => item.id).join(',')
    await JoblogRequest.delete({ ids })
    // 处理页码回退：当前页只有1条数据时，删除后返回上一页（避免空页）
    if (list.value.length <= 1) queryParams.value.pageNo = queryParams.value.pageNo > 1 ? queryParams.value.pageNo - 1 : 1
    await getList()
    TipModal.msgSuccess('删除成功')
    if (!row) {
      multipleSelection.value = []
      tableRef.value?.clearSelection()
    }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('handleDelete errMsg: ', errMsg)
    return Promise.reject(error)
  }
}

async function handleClear() {
  try {
    const { cancel } = await TipModal.confirm('确定要清空所有的数据吗？')
    if (cancel) return TipModal.msg('操作取消')
    const message = await JoblogRequest.clear()
    await getList()
    TipModal.msgSuccess(message || '数据清空成功')
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('handleClear errMsg: ', errMsg)
    return Promise.reject(error)
  }
}

onMounted(() => {
  // 从任务列表页跳转过来时，携带任务名称与组名作为默认查询条件
  const { jobName, jobGroup } = route.query
  if (jobName) queryParams.value.jobName = String(jobName)
  if (jobGroup) queryParams.value.jobGroup = String(jobGroup)
  getList()
})
</script>

<style lang="scss" scoped></style>
