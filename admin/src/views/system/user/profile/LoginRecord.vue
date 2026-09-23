<template>
  <div>
    <el-table v-loading="loading" :data="list">
      <el-table-column type="index" label="序号" align="center" width="64" />
      <el-table-column label="登录IP" prop="ip" align="center" width="150" show-overflow-tooltip />
      <el-table-column label="登录地点" prop="location" align="center" min-width="150" show-overflow-tooltip />
      <el-table-column label="浏览器" prop="browser" align="center" width="180" show-overflow-tooltip />
      <el-table-column label="操作系统" prop="os" align="center" min-width="150" show-overflow-tooltip />
      <el-table-column label="登录时间" prop="loginTime" align="center" width="170" />
      <el-table-column label="状态" align="center" width="90">
        <template #default="{ row }">
          <DictTag :options="sys_common_status" :value="row.status" />
        </template>
      </el-table-column>
    </el-table>

    <ProPagination :total v-model:current-page="queryParams.pageNo" v-model:page-size="queryParams.pageSize" @pagination="getList" />
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'LoginRecord' })
import type { Loginlog } from '@/types'
import { UserRequest } from '@/api/system/user.request'

const { sys_common_status } = useDict('sys_common_status')
const list = ref<Loginlog.Item[]>([])
const total = ref(0)
const loading = ref(false)
const queryParams = ref<Loginlog.QueryParams>({ pageNo: 1, pageSize: 10 })

/** 查询当前用户的登录日志 */
async function getList() {
  try {
    loading.value = true
    const data = await UserRequest.findMyLoginlogs(queryParams.value)
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

defineExpose({ getList })

onMounted(() => {
  getList()
})
</script>

<style lang="scss" scoped></style>
