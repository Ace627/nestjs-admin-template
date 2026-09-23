<template>
  <el-dialog v-model="visible" title="操作日志明细" :close-on-click-modal="false" :width="dialogWidth">
    <el-row class="mx-auto">
      <el-col :span="2" class="label">操作模块</el-col>
      <el-col :span="4" class="value">{{ operInfo.title }}</el-col>

      <el-col :span="2" class="label">请求方式</el-col>
      <el-col :span="4" class="value">{{ operInfo.requestMethod }}</el-col>

      <el-col :span="2" class="label">操作状态</el-col>
      <el-col :span="4" class="value">
        <DictTag :options="sys_common_status" :value="operInfo.status" />
      </el-col>

      <el-col :span="2" class="label">操作人员</el-col>
      <el-col :span="4" class="value">{{ operInfo.username }}</el-col>
    </el-row>

    <el-row>
      <el-col :span="2" class="label">主机地址</el-col>
      <el-col :span="4" class="value">{{ operInfo.ip }}</el-col>

      <el-col :span="2" class="label">操作地点</el-col>
      <el-col :span="4" class="value">{{ operInfo.location }}</el-col>

      <el-col :span="2" class="label">操作方法</el-col>
      <el-col :span="10" class="value">{{ operInfo.method }}</el-col>
    </el-row>

    <el-row>
      <el-col :span="2" class="label">消耗时间</el-col>
      <el-col :span="4" class="value">{{ operInfo.duration }}毫秒</el-col>

      <el-col :span="2" class="label">操作时间</el-col>
      <el-col :span="16" class="value">{{ operInfo.operTime }}</el-col>
    </el-row>

    <el-row>
      <el-col :span="2" class="label">操作接口</el-col>
      <el-col :span="22" class="value">{{ operInfo.url }}</el-col>
    </el-row>

    <el-divider>请求参数</el-divider>

    <el-input type="textarea" :value="operInfo.params" disabled :rows="12"></el-input>

    <template #footer>
      <el-button @click="close">取消</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
defineOptions({ name: 'OperateDetailDialog' })
import type { Operlog } from '@/types'

const appStore = useAppStore()
const { sys_common_status } = useDict('sys_common_status')

const visible = ref<boolean>(false)
const operInfo = ref({} as Operlog.Item)
const dialogWidth = computed(() => (appStore.isDesktop ? `800px` : `calc(100% - 32px)`))

function open(record: Operlog.Item) {
  operInfo.value = record
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
