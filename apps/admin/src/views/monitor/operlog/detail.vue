<template>
  <el-dialog v-model="visible" title="操作日志详情" align-center :width="dialogWidth">
    <el-descriptions :column="descriptionsColumn" border>
      <el-descriptions-item label="日志编号">{{ operInfo.id }}</el-descriptions-item>
      <el-descriptions-item label="系统模块">{{ operInfo.title }}</el-descriptions-item>

      <el-descriptions-item label="操作类型">
        <DictTag :options="sys_oper_type" :value="String(operInfo.businessType)" />
      </el-descriptions-item>
      <el-descriptions-item label="操作人员">{{ operInfo.username }}</el-descriptions-item>

      <el-descriptions-item label="请求方式">{{ operInfo.requestMethod }}</el-descriptions-item>
      <el-descriptions-item label="请求地址">{{ operInfo.url }}</el-descriptions-item>

      <el-descriptions-item label="操作IP">{{ operInfo.ip }}</el-descriptions-item>
      <el-descriptions-item label="操作地点">{{ operInfo.location }}</el-descriptions-item>

      <el-descriptions-item label="操作方法">{{ operInfo.method }}</el-descriptions-item>
      <el-descriptions-item label="操作时间">{{ operInfo.operTime }}</el-descriptions-item>

      <el-descriptions-item label="操作状态">
        <DictTag :options="sys_common_status" :value="operInfo.status" />
      </el-descriptions-item>
      <el-descriptions-item label="消耗时间">{{ operInfo.duration }} 毫秒</el-descriptions-item>

      <el-descriptions-item label="请求标识">{{ operInfo.requestId }}</el-descriptions-item>
    </el-descriptions>

    <el-row class="param-row mt-16px" :gutter="16">
      <el-col :xs="24" :md="12">
        <div class="param-title">请求参数</div>
        <pre class="param-content">{{ paramsText }}</pre>
      </el-col>
      <el-col :xs="24" :md="12">
        <div class="param-title">返回参数</div>
        <pre class="param-content">{{ resultText }}</pre>
      </el-col>
    </el-row>

    <template #footer>
      <el-button @click="close">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
defineOptions({ name: 'OperateDetailDialog' })
import type { Operlog } from '@/types'

const appStore = useAppStore()
const { sys_common_status, sys_oper_type } = useDict('sys_common_status', 'sys_oper_type')

const visible = ref<boolean>(false)
const operInfo = ref({} as Operlog.Item)
const dialogWidth = computed(() => (appStore.isDesktop ? `960px` : `calc(100% - 32px)`))
const descriptionsColumn = computed(() => (appStore.isDesktop ? 2 : 1))

/** JSON 字符串美化展示，非 JSON 内容原样输出 */
function formatJsonText(rawText?: string) {
  try {
    if (!rawText) return '-'
    return JSON.stringify(JSON.parse(rawText), null, 2)
  } catch {
    return rawText
  }
}

const paramsText = computed(() => formatJsonText(operInfo.value.params))
const resultText = computed(() => formatJsonText(operInfo.value.result))

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
.param-row {
  row-gap: 16px;
}

.param-title {
  margin-bottom: 8px;
  font-weight: 600;
}

.param-content {
  margin: 0;
  padding: 12px;
  height: 340px;
  overflow: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

:deep(.el-descriptions__label) {
  width: 108px;
  font-weight: 600;
}
</style>
