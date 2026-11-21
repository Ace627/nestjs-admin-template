<template>
  <el-dialog v-model="visible" title="登录日志详情" :width="dialogWidth">
    <el-descriptions :column="descriptionsColumn" border>
      <el-descriptions-item label="访问编号">{{ loginInfo.id }}</el-descriptions-item>
      <el-descriptions-item label="用户名称">{{ loginInfo.username }}</el-descriptions-item>

      <el-descriptions-item label="用户ID">{{ loginInfo.userId ?? '-' }}</el-descriptions-item>
      <el-descriptions-item label="访问地址">{{ loginInfo.ip }}</el-descriptions-item>

      <el-descriptions-item label="登录地点">{{ loginInfo.location }}</el-descriptions-item>
      <el-descriptions-item label="操作系统">{{ loginInfo.os }}</el-descriptions-item>

      <el-descriptions-item label="浏览器">{{ loginInfo.browser }}</el-descriptions-item>
      <el-descriptions-item label="访问状态">
        <DictTag :options="sys_common_status" :value="loginInfo.status" />
      </el-descriptions-item>

      <el-descriptions-item label="访问时间">{{ loginInfo.accessTime }}</el-descriptions-item>
      <el-descriptions-item label="访问描述">{{ loginInfo.message }}</el-descriptions-item>

      <el-descriptions-item label="请求标识" :span="descriptionsColumn">{{ loginInfo.requestId }}</el-descriptions-item>

      <el-descriptions-item label="User Agent" :span="descriptionsColumn">
        <span class="user-agent">{{ loginInfo.userAgent || '-' }}</span>
      </el-descriptions-item>
    </el-descriptions>

    <template #footer>
      <el-button @click="close">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
defineOptions({ name: 'LoginlogDetailDialog' })
import type { Loginlog } from '@/types'

const appStore = useAppStore()
const { sys_common_status } = useDict('sys_common_status')

const visible = ref<boolean>(false)
const loginInfo = ref({} as Loginlog.Item)
const dialogWidth = computed(() => (appStore.isDesktop ? `720px` : `calc(100% - 32px)`))
const descriptionsColumn = computed(() => (appStore.isDesktop ? 2 : 1))

function open(record: Loginlog.Item) {
  loginInfo.value = record
  visible.value = true
}

function close() {
  visible.value = false
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
