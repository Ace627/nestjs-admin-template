<template>
  <el-dialog v-model="visible" title="在线会话详情" :width="dialogWidth">
    <el-descriptions v-loading="loading" :column="descriptionsColumn" border>
      <el-descriptions-item label="用户名">{{ sessionDetail.username }}</el-descriptions-item>
      <el-descriptions-item label="姓名">{{ sessionDetail.realname || '-' }}</el-descriptions-item>

      <el-descriptions-item label="所属部门">{{ sessionDetail.deptName || '-' }}</el-descriptions-item>
      <el-descriptions-item label="角色">{{ sessionDetail.roleNames?.join('、') || '-' }}</el-descriptions-item>

      <el-descriptions-item label="会话状态">
        <el-tag type="success">活跃</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="是否当前会话">{{ sessionDetail.isCurrentSession ? '是' : '否' }}</el-descriptions-item>

      <el-descriptions-item label="IP 地址">{{ sessionDetail.ip }}</el-descriptions-item>
      <el-descriptions-item label="浏览器">{{ sessionDetail.browser }}</el-descriptions-item>

      <el-descriptions-item label="操作系统">{{ sessionDetail.os }}</el-descriptions-item>
      <el-descriptions-item label="登录时间">{{ sessionDetail.loginTime }}</el-descriptions-item>

      <el-descriptions-item label="最后活跃">{{ sessionDetail.lastActiveTime || '-' }}</el-descriptions-item>
      <el-descriptions-item label="最近续签">{{ sessionDetail.refreshTime || '-' }}</el-descriptions-item>

      <el-descriptions-item label="会话时长" :span="descriptionsColumn">{{ sessionDuration }}</el-descriptions-item>

      <el-descriptions-item label="User Agent" :span="descriptionsColumn">
        <span class="user-agent">{{ sessionDetail.userAgent || '-' }}</span>
      </el-descriptions-item>
    </el-descriptions>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
defineOptions({ name: 'OnlineDetailDialog' })
import dayjs from 'dayjs'
import type { Online } from '@/types'
import { OnlineRequest } from '@/api/monitor/online.request'

const appStore = useAppStore()

const visible = ref<boolean>(false)
const loading = ref<boolean>(false)
const sessionDetail = ref({} as Online.Detail)
const dialogWidth = computed(() => (appStore.isDesktop ? `760px` : `calc(100% - 32px)`))
const descriptionsColumn = computed(() => (appStore.isDesktop ? 2 : 1))

/** 会话时长按登录时间起算，续签不重置 */
const sessionDuration = computed(() => {
  const loginTime = dayjs(sessionDetail.value.loginTime)
  if (!loginTime.isValid()) return '-'
  const totalMinutes = Math.max(dayjs().diff(loginTime, 'minute'), 0)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours ? `${hours} 小时 ${minutes} 分钟` : `${minutes} 分钟`
})

async function open(record: Online.Item) {
  sessionDetail.value = { ...record } as Online.Detail
  visible.value = true
  loading.value = true
  try {
    sessionDetail.value = await OnlineRequest.findDetail({ userId: record.userId, uuid: record.uuid })
  } catch (error: unknown) {
    console.log('OnlineRequest findDetail error: ', error)
  } finally {
    loading.value = false
  }
}

defineExpose({ open })
</script>

<style lang="scss" scoped>
:deep(.el-descriptions__label) {
  width: 108px;
  font-weight: 600;
}

.user-agent {
  word-break: break-all;
  line-height: 1.6;
}
</style>
