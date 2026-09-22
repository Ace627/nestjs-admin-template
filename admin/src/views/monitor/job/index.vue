<template>
  <div class="app-content flex flex-col h-full">
    <ProSearch v-show="showSearch" v-permissions="['monitor:job:query']" :items="items" v-model="queryParams" @query="handleQuery" @reset="resetQuery" />

    <div class="mb-16px flex items-center justify-between">
      <div>
        <el-button v-permissions="['monitor:job:create']" plain type="primary" @click="handleCreate">
          <template #icon><SvgIcon name="Plus" /></template><span>新增</span>
        </el-button>
        <el-button v-permissions="['monitor:job:delete']" plain type="danger" @click="handleDelete()" :disabled="!isMultiple">
          <template #icon><SvgIcon name="Delete" /></template><span>批量删除</span>
        </el-button>
        <el-button plain type="info" @click="toJobLog()">
          <span>日志查询</span>
          <template #icon><SvgIcon name="Log" /></template>
        </el-button>
      </div>
      <RightToolbar v-model:show-search="showSearch" v-model:hidden-column-keys="hiddenColumnKeys" :columns="columns" storage-key="monitor:job" @refresh="getList" />
    </div>

    <ProTable ref="tableRef" v-loading="loading" :data="list" :columns="columns" :hidden-column-keys="hiddenColumnKeys" @selection-change="handleSelectionChange">
      <template #status="{ row }">
        <!-- 仅对合法状态渲染开关：status 非法时 el-switch 挂载即警告并自动 emit 一次 change -->
        <template v-if="['0', '1'].includes(row.status)">
          <el-switch v-permissions="['monitor:job:update']" v-model="row.status" size="small" inline-prompt active-value="1" inactive-value="0" @click="handleChangeStatus(row)" />
        </template>
        <span v-else>-</span>
      </template>
      <template #concurrent="{ row }">
        <el-tag :type="row.concurrent === '1' ? 'success' : 'warning'">{{ row.concurrent === '1' ? '允许' : '禁止' }}</el-tag>
      </template>
      <template #remark="{ row }">
        <ProTooltip :content="row.remark" placement="top">
          <span class="line-clamp-1">{{ row.remark || '-' }}</span>
        </ProTooltip>
      </template>
      <template #action="{ row }">
        <el-link v-permissions="['monitor:job:update']" type="primary" @click="handleEdit(row)">修改</el-link>
        <el-link v-permissions="['monitor:job:update']" type="primary" @click="handleRun(row)">执行一次</el-link>
        <el-link v-permissions="['monitor:job:delete']" type="primary" @click="handleDelete(row)">删除</el-link>
        <el-link type="primary" @click="toJobLog(row)">日志</el-link>
      </template>
    </ProTable>

    <ProPagination :total v-model:current-page="queryParams.pageNo" v-model:page-size="queryParams.pageSize" @pagination="getList" />

    <!-- 定时任务新增/编辑弹窗 -->
    <JobDialog ref="jobDialogRef" @getList="getList" />
  </div>
</template>

<script setup lang="ts">
import { TipModal } from '@/utils'
import { useDict } from '@/hooks/useDict'
import JobDialog from './components/JobDialog.vue'
import { JobRequest } from '@/api/monitor/job.request'
import type { Job, ProSearchItem, ProTableColumn } from '@/types'

const { sys_common_status, sys_job_group } = useDict('sys_common_status', 'sys_job_group')
const router = useRouter()

const list = ref<Job.Item[]>([])
const multipleSelection = ref<Job.Item[]>([])
const total = ref(0)
const loading = ref(true)
const isMultiple = computed(() => multipleSelection.value.length > 0)
const tableRef = useTemplateRef('tableRef')
const jobDialogRef = useTemplateRef('jobDialogRef')
const queryParams = ref<Job.QueryParams>({ pageNo: 1, pageSize: 10 })

/** 搜索区域显隐（RightToolbar v-model 控制） */
const showSearch = ref(true)
/** 隐藏列 key 数组（RightToolbar v-model 控制） */
const hiddenColumnKeys = ref<string[]>([])

const items: ProSearchItem[] = [
  { type: 'input', prop: 'jobName', label: '任务名称' },
  { type: 'select', prop: 'jobGroup', label: '任务组名', options: sys_job_group },
  { type: 'select', prop: 'status', label: '任务状态', options: sys_common_status },
]
const columns: ProTableColumn<Job.Item>[] = [
  { align: 'center', type: 'selection' },
  { align: 'center', type: 'index', label: '序号', width: 64 },
  { align: 'center', prop: 'jobName', label: '任务名称', showOverflowTooltip: true, minWidth: 120 },
  { align: 'center', prop: 'jobGroup', label: '任务组名', width: 100 },
  { align: 'center', prop: 'invokeTarget', label: '调用目标', showOverflowTooltip: true, minWidth: 200 },
  { align: 'center', prop: 'cronExpression', label: '执行表达式', showOverflowTooltip: true, width: 140 },
  { align: 'center', label: '任务状态', slot: 'status', width: 80 },
  { align: 'center', label: '并发执行', slot: 'concurrent', width: 90 },
  { align: 'center', label: '备注', slot: 'remark', minWidth: 120 },
  { align: 'center', prop: 'createTime', label: '创建时间', width: 170 },
  { align: 'center', slot: 'action', label: '操作', fixed: 'right', width: 220 },
]

async function getList() {
  try {
    loading.value = true
    const data = await JobRequest.findList(queryParams.value)
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

function handleSelectionChange(row: Job.Item[]) {
  multipleSelection.value = row
}

/** 跳转到任务日志页面（可携带当前任务的名称与组名作为查询条件） */
function toJobLog(row?: Job.Item) {
  if (!row) return router.push({ path: '/monitor/job/log' })
  router.push({ path: '/monitor/job/log', query: { jobName: row.jobName, jobGroup: row.jobGroup } })
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

function handleCreate() {
  jobDialogRef.value?.open()
}

function handleEdit(row: Job.Item) {
  jobDialogRef.value?.open(row)
}

/** 切换任务状态（取消或失败时回滚开关） */
async function handleChangeStatus(row: Job.Item) {
  // @click 先于 change 派发，此时 v-model 可能尚未翻转，显式计算目标值，不依赖切换时序
  const targetStatus = row.status === '1' ? '0' : '1'
  const actionText = targetStatus === '1' ? '启动' : '停用'
  try {
    const { cancel } = await TipModal.confirm(`确认要${actionText}「${row.jobName}」任务吗？`)
    if (cancel) throw new Error('cancel')
    await JobRequest.changeStatus({ id: row.id, status: targetStatus })
    row.status = targetStatus
    TipModal.msgSuccess(`${actionText}成功`)
  } catch (error: unknown) {
    row.status = targetStatus === '1' ? '0' : '1' // 回滚（含组件自动翻转与接口失败两种情况）
    if (error instanceof Error && error.message === 'cancel') return TipModal.msg('操作取消')
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('handleChangeStatus errMsg: ', errMsg)
    return Promise.reject(error)
  }
}

/** 执行一次任务 */
async function handleRun(row: Job.Item) {
  try {
    const { cancel } = await TipModal.confirm('确定要执行该任务吗？')
    if (cancel) return TipModal.msg('操作取消')
    await JobRequest.run({ jobId: row.id, jobGroup: row.jobGroup })
    TipModal.msgSuccess('执行成功')
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('handleRun errMsg: ', errMsg)
    return Promise.reject(error)
  }
}

/** 处理表格数据删除（支持单条删除与批量删除） */
async function handleDelete(row?: Job.Item) {
  try {
    const { cancel } = await TipModal.confirm('确定要删除选中的数据及其执行日志吗？')
    if (cancel) return TipModal.msg('操作取消')
    const ids = row ? row.id : multipleSelection.value.map((item) => item.id).join(',')
    await JobRequest.delete({ ids })
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

onMounted(getList)
</script>

<style lang="scss" scoped></style>
