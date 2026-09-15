<template>
  <div class="app-content flex flex-col h-full">
    <ProSearch v-permissions="['monitor:online:query']" :items="items" v-model="queryParams" @query="handleQuery" @reset="resetQuery" />

    <ProTable ref="tableRef" v-loading="loading" :data="list" :columns="columns">
      <template #action="{ row }">
        <el-link v-permissions="['monitor:online:forceLogout']" type="primary" @click="handleForceLogout(row)">强退</el-link>
      </template>
    </ProTable>

    <ProPagination :total v-model:page="queryParams.pageNo" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </div>
</template>

<script setup lang="ts">
import { TipModal } from '@/utils'
import type { Online } from '@/types'
import { OnlineRequest } from '@/api/monitor/online.request'
import type { ProTableColumn, ProSearchItem } from '@/types'

const list = ref<Online.Item[]>([])
const total = ref<number>(0)
const loading = ref<boolean>(true)
const queryParams = ref<Online.QueryParams>({ pageNo: 1, pageSize: 10 })

const items: ProSearchItem[] = [
  { type: 'input', prop: 'ip', label: '登录地址' },
  { type: 'input', prop: 'username', label: '用户名称' },
]
const columns: ProTableColumn<Online.Item>[] = [
  { align: 'center', type: 'index', label: '序号', width: 64 },
  { align: 'center', prop: 'userId', label: '用户ID', showOverflowTooltip: true },
  { align: 'center', prop: 'username', label: '登录名称', showOverflowTooltip: true },
  { align: 'center', prop: 'ip', label: '主机', showOverflowTooltip: true, minWidth: 150 },
  { align: 'center', prop: 'location', label: '登录地点', showOverflowTooltip: true, minWidth: 150 },
  { align: 'center', prop: 'os', label: '操作系统', showOverflowTooltip: true, minWidth: 150 },
  { align: 'center', prop: 'browser', label: '浏览器', showOverflowTooltip: true, minWidth: 180 },
  { align: 'center', prop: 'loginTime', label: '登录时间', width: 170 },
  { align: 'center', slot: 'action', label: '操作', fixed: 'right', width: 80 },
]

async function getList() {
  try {
    loading.value = true
    const data = await OnlineRequest.findList(queryParams.value)
    list.value = data.records
    total.value = data.total
    loading.value = false
  } catch (error: any) {
    console.log('OnlineRequest getList error: ', error)
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

async function handleForceLogout(row: Online.Item) {
  try {
    const { cancel } = await TipModal.confirm(`是否确认强退用户"${row.username}"？`)
    if (cancel) return TipModal.msg(`操作取消`)
    await OnlineRequest.forceLogout({ userId: row.userId, uuid: row.uuid })
    await getList()
    TipModal.msgSuccess(`强退成功`)
  } catch (error: any) {
    console.log('online handleForceLogout error: ', error)
    return Promise.reject(error)
  }
}

onMounted(() => {
  getList()
})
</script>

<style lang="scss" scoped></style>
