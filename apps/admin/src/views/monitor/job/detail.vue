<template>
  <el-dialog v-model="visible" title="任务日志明细" :close-on-click-modal="false" :width="dialogWidth">
    <el-row>
      <el-col :span="2" class="label">任务名称</el-col>
      <el-col :span="4" class="value">{{ jobLogInfo.jobName }}</el-col>
      <el-col :span="2" class="label">任务组名</el-col>
      <el-col :span="4" class="value">{{ jobLogInfo.jobGroup }}</el-col>
      <el-col :span="2" class="label">执行状态</el-col>
      <el-col :span="4" class="value">{{ jobLogInfo.status === '1' ? '正常' : '失败' }}</el-col>
    </el-row>
    <el-row>
      <el-col :span="2" class="label">调用目标</el-col>
      <el-col :span="22" class="value">{{ jobLogInfo.invokeTarget }}</el-col>
    </el-row>
    <el-row>
      <el-col :span="2" class="label">日志信息</el-col>
      <el-col :span="22" class="value">{{ jobLogInfo.jobMessage || '-' }}</el-col>
    </el-row>
    <el-row>
      <el-col :span="2" class="label">执行时间</el-col>
      <el-col :span="22" class="value">{{ jobLogInfo.createTime }}</el-col>
    </el-row>
    <template #footer>
      <el-button @click="close">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
defineOptions({ name: 'JobLogDetailDialog' })
import type { JobLog } from '@/types'

const appStore = useAppStore()

const visible = ref(false)
const jobLogInfo = ref({} as JobLog.Item)
const dialogWidth = computed(() => (appStore.isDesktop ? '800px' : 'calc(100% - 32px)'))

function open(record: JobLog.Item) {
  jobLogInfo.value = record
  visible.value = true
}

function close() {
  visible.value = false
}

defineExpose({ open })
</script>

<style lang="scss" scoped>
.el-row + .el-row {
  margin-top: 32px;
}

.label {
  font-weight: bold;
}
</style>
