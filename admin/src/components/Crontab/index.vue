<template>
  <el-dialog v-model="visible" title="Cron 表达式生成器" :width="dialogWidth" append-to-body destroy-on-close :close-on-click-modal="false">
    <Crontab v-model:cron="cron" />
    <div class="preview">
      <div class="preview-title">
        <span>最近 5 次执行时间</span>
        <el-tooltip v-for="(segment, index) in segments" :key="index" :content="SEGMENT_META[index]?.tooltip" placement="top">
          <el-tag size="small" type="info" class="ml-4px">
            <span class="segment-label">{{ SEGMENT_META[index]?.label }}</span>
            <span class="segment-value">{{ segment }}</span>
          </el-tag>
        </el-tooltip>
      </div>
      <div v-if="description" class="preview-desc">{{ description }}</div>
      <div v-if="preview.times.length" class="preview-list">
        <div v-for="(time, index) in preview.times" :key="index" class="preview-item">{{ time }}</div>
      </div>
      <div v-else-if="preview.error" class="preview-error">{{ preview.error }}</div>
    </div>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="warning" @click="handleReset">重置</el-button>
      <el-button type="primary" :disabled="!!preview.error" @click="handleConfirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
defineOptions({ name: 'CrontabDialog' })
import dayjs from 'dayjs'
import { CronExpressionParser } from 'cron-parser'
import cronstrue from 'cronstrue'
import 'cronstrue/locales/zh_CN.js' // 侧效注册 zh_CN locale（避免 i18n 全量 84 语言打包）
import Crontab from './generator.vue'

/** 表达式各段的展示标签与含义说明 */
const SEGMENT_META = [
  { label: '秒', tooltip: '秒（0-59）' },
  { label: '分', tooltip: '分（0-59）' },
  { label: '时', tooltip: '时（0-23）' },
  { label: '日', tooltip: '日（1-31，? 表示不指定）' },
  { label: '月', tooltip: '月（1-12）' },
  { label: '周', tooltip: '周（0-6，0=周日，? 表示不指定）' },
  { label: '年', tooltip: '年（可选）' },
]

const emits = defineEmits<{ confirm: [cron: string] }>()

const appStore = useAppStore()
const visible = ref(false)
const cron = ref('* * * * * ?')
const dialogWidth = computed(() => (appStore.isDesktop ? '680px' : 'calc(100% - 32px)'))

const preview = computed<{ times: string[]; error: string }>(() => {
  if (!cron.value) return { times: [], error: '' }
  try {
    const interval = CronExpressionParser.parse(cron.value, { currentDate: new Date() })
    const times: string[] = []
    for (let i = 0; i < 5; i++) times.push(dayjs(interval.next().toDate()).format('YYYY-MM-DD HH:mm:ss'))
    return { times, error: '' }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    return { times: [], error: `表达式无效：${errMsg}` }
  }
})

const segments = computed(() => cron.value.trim().split(/\s+/))

/** cronstrue 中文释义，表达式无效时静默隐藏（错误已由 preview 呈现） */
const description = computed(() => {
  if (!cron.value || preview.value.error) return ''
  try {
    return cronstrue.toString(cron.value, { locale: 'zh_CN', use24HourTimeFormat: true })
  } catch {
    return ''
  }
})

function open(initial?: string) {
  cron.value = initial?.trim() || '* * * * * ?'
  visible.value = true
}

/** 重置为全星号，由用户重新选择 */
function handleReset() {
  cron.value = '* * * * * ?'
}

function handleConfirm() {
  emits('confirm', cron.value)
  visible.value = false
}

defineExpose({ open })
</script>

<style lang="scss" scoped>
.preview {
  margin-top: 8px;
  padding: 12px 16px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  .preview-title {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    font-weight: bold;
    .el-tag {
      font-family: monospace;
      .segment-label {
        opacity: 0.7;
        margin-right: 4px;
      }
    }
  }
  .preview-desc {
    margin-top: 8px;
    color: var(--el-color-primary);
  }
  .preview-list {
    margin-top: 8px;
    .preview-item {
      line-height: 22px;
      font-family: monospace;
      color: var(--el-text-color-regular);
    }
  }
  .preview-error {
    margin-top: 8px;
    color: var(--el-color-danger);
  }
}
</style>
