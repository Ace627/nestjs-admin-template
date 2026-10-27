<template>
  <div class="app-content flex flex-col h-full">
    <ProSearch v-permissions="['monitor:loginlock:query']" :items v-model="queryParams" @query="handleQuery" @reset="resetQuery" />

    <ProTable ref="tableRef" v-loading="loading" :data="list" :columns>
      <template #status="{ row }">
        <el-tag :type="row.remainingCount > 0 ? 'info' : 'danger'">{{ row.remainingCount > 0 ? '未锁定' : '锁定中' }}</el-tag>
      </template>
      <template #remainingTime="{ row }">{{ formatRemaining(row.remainingSeconds) }}</template>
      <template #action="{ row }">
        <el-link v-permissions="['monitor:loginlock:unlock']" type="primary" @click="handleUnlock(row)">解锁</el-link>
      </template>
    </ProTable>

    <ProPagination :total v-model:current-page="queryParams.pageNo" v-model:page-size="queryParams.pageSize" @pagination="getList" />
  </div>
</template>

<script setup lang="ts">
import { TipModal } from '@/utils'
import type { LoginLock } from '@/types'
import { LoginLockRequest } from '@/api/monitor/loginlock.request'
import type { ProTableColumn, ProSearchItem } from '@/types'

const list = ref<LoginLock.Item[]>([])
const total = ref<number>(0)
const loading = ref<boolean>(true)
const queryParams = ref<LoginLock.QueryParams>({ pageNo: 1, pageSize: 10 })

const items: ProSearchItem[] = [
  { type: 'input', prop: 'username', label: '登录账号' },
  { type: 'input', prop: 'ip', label: '来源 IP' },
]
const columns: ProTableColumn<LoginLock.Item>[] = [
  { align: 'center', type: 'index', label: '序号', width: 64 },
  { align: 'center', prop: 'username', label: '登录账号', showOverflowTooltip: true },
  { align: 'center', prop: 'ip', label: '来源 IP', showOverflowTooltip: true, minWidth: 150 },
  { align: 'center', prop: 'failCount', label: '失败次数', width: 100 },
  { align: 'center', slot: 'status', label: '状态', width: 90 },
  { align: 'center', prop: 'remainingCount', label: '剩余可尝试', width: 110 },
  { align: 'center', slot: 'remainingTime', label: '剩余时间', width: 110 },
  { align: 'center', slot: 'action', label: '操作', fixed: 'right', width: 80 },
]

/** 剩余时间展示：不足一分钟按秒展示，锁定中的按分钟展示 */
function formatRemaining(seconds: number) {
  if (seconds < 60) return `${seconds} 秒`
  return `${Math.ceil(seconds / 60)} 分钟`
}

async function getList() {
  try {
    loading.value = true
    const data = await LoginLockRequest.findList(queryParams.value)
    list.value = data.records
    total.value = data.total
    loading.value = false
  } catch (error: any) {
    console.log('LoginLockRequest getList error: ', error)
    loading.value = false
    return Promise.reject(error)
  }
}

function handleQuery() {
  if (loading.value) return TipModal.msgWarning('正在查询中，请勿重复操作')
  queryParams.value.pageNo = 1
  getList()
}

function resetQuery() {
  handleQuery()
}

async function handleUnlock(row: LoginLock.Item) {
  try {
    const { cancel } = await TipModal.confirm(`是否确认解锁账号"${row.username}"（来源：${row.ip}）？`)
    if (cancel) return TipModal.msg(`操作取消`)
    await LoginLockRequest.unlock({ username: row.username, ip: row.ip })
    await getList()
    TipModal.msgSuccess(`解锁成功`)
  } catch (error: any) {
    console.log('loginlock handleUnlock error: ', error)
    return Promise.reject(error)
  }
}

onMounted(() => {
  getList()
})
</script>

<style lang="scss" scoped></style>
