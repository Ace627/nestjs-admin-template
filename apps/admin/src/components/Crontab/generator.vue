<template>
  <div class="crontab">
    <el-alert v-if="parseError" :title="parseError" type="warning" :closable="false" class="mb-12px" />
    <div class="quick-row">
      <span class="quick-label">常用：</span>
      <el-tag v-for="template in QUICK_TEMPLATES" :key="template.label" :effect="model === template.cron ? 'dark' : 'plain'" class="quick-tag" @click="applyTemplate(template.cron)">{{ template.label }}</el-tag>
    </div>
    <el-tabs v-model="activeTab">
      <!-- 秒 / 分 / 时：五种模式一致，复用同一套模板 -->
      <el-tab-pane v-for="field in fieldsA" :key="field.key" :label="field.label" :name="field.key">
        <el-radio-group v-model="state[field.key].type">
          <el-radio-button value="fixed">固定值</el-radio-button>
          <el-radio-button value="any">每{{ field.unit }}</el-radio-button>
          <el-radio-button value="range">区间</el-radio-button>
          <el-radio-button value="interval">间隔</el-radio-button>
          <el-radio-button value="specified">指定</el-radio-button>
        </el-radio-group>
        <div v-if="state[field.key].type === 'fixed'" class="field-row">
          <span>在第</span>
          <el-input-number v-model="state[field.key].start" :min="field.min" :max="field.max" />
          <span>{{ field.unit }}</span>
        </div>
        <div v-if="state[field.key].type === 'range'" class="field-row">
          <span>从</span>
          <el-input-number v-model="state[field.key].start" :min="field.min" :max="field.max" />
          <span>至</span>
          <el-input-number v-model="state[field.key].end" :min="field.min" :max="field.max" />
        </div>
        <div v-if="state[field.key].type === 'interval'" class="field-row">
          <span>从</span>
          <el-input-number v-model="state[field.key].start" :min="field.min" :max="field.max" />
          <span>开始，每</span>
          <el-input-number v-model="state[field.key].step" :min="1" :max="field.max - field.min + 1" />
          <span>{{ field.unit }}执行一次</span>
        </div>
        <div v-if="state[field.key].type === 'specified'" class="field-row">
          <el-select v-model="state[field.key].selected" multiple filterable collapse-tags collapse-tags-tooltip :max-collapse-tags="8" placeholder="选择具体值" class="w-100%">
            <el-option v-for="number in field.max - field.min + 1" :key="number" :label="number + field.min - 1" :value="number + field.min - 1" />
          </el-select>
        </div>
      </el-tab-pane>

      <el-tab-pane label="日" name="day">
        <el-radio-group v-model="state.day.type">
          <el-radio-button value="any">每天</el-radio-button>
          <el-radio-button value="unspecified">不指定</el-radio-button>
          <el-radio-button value="range">区间</el-radio-button>
          <el-radio-button value="interval">间隔</el-radio-button>
          <el-radio-button value="last">本月最后一天</el-radio-button>
          <el-radio-button value="workday">最近工作日</el-radio-button>
          <el-radio-button value="specified">指定</el-radio-button>
        </el-radio-group>
        <div v-if="state.day.type === 'range'" class="field-row">
          <span>从</span>
          <el-input-number v-model="state.day.start" :min="1" :max="31" />
          <span>至</span>
          <el-input-number v-model="state.day.end" :min="1" :max="31" />
          <span>号</span>
        </div>
        <div v-if="state.day.type === 'interval'" class="field-row">
          <span>从</span>
          <el-input-number v-model="state.day.start" :min="1" :max="31" />
          <span>号开始，每</span>
          <el-input-number v-model="state.day.step" :min="1" :max="31" />
          <span>天执行一次</span>
        </div>
        <div v-if="state.day.type === 'workday'" class="field-row">
          <span>每月</span>
          <el-input-number v-model="state.day.extra1" :min="1" :max="31" />
          <span>号最近的工作日</span>
        </div>
        <div v-if="state.day.type === 'specified'" class="field-row">
          <el-select v-model="state.day.selected" multiple filterable collapse-tags collapse-tags-tooltip :max-collapse-tags="8" placeholder="选择具体日期" class="w-100%">
            <el-option v-for="number in 31" :key="number" :label="`${number} 号`" :value="number" />
          </el-select>
        </div>
        <div v-if="state.day.type !== 'unspecified'" class="field-tip">日指定后周字段将自动置为「?」</div>
      </el-tab-pane>

      <!-- 月与秒/分/时模式一致，复用同一套模板 -->
      <el-tab-pane v-for="field in fieldsB" :key="field.key" :label="field.label" :name="field.key">
        <el-radio-group v-model="state[field.key].type">
          <el-radio-button value="fixed">固定值</el-radio-button>
          <el-radio-button value="any">每{{ field.unit }}</el-radio-button>
          <el-radio-button value="range">区间</el-radio-button>
          <el-radio-button value="interval">间隔</el-radio-button>
          <el-radio-button value="specified">指定</el-radio-button>
        </el-radio-group>
        <div v-if="state[field.key].type === 'fixed'" class="field-row">
          <span>在第</span>
          <el-input-number v-model="state[field.key].start" :min="field.min" :max="field.max" />
          <span>{{ field.unit }}</span>
        </div>
        <div v-if="state[field.key].type === 'range'" class="field-row">
          <span>从</span>
          <el-input-number v-model="state[field.key].start" :min="field.min" :max="field.max" />
          <span>至</span>
          <el-input-number v-model="state[field.key].end" :min="field.min" :max="field.max" />
        </div>
        <div v-if="state[field.key].type === 'interval'" class="field-row">
          <span>从</span>
          <el-input-number v-model="state[field.key].start" :min="field.min" :max="field.max" />
          <span>开始，每</span>
          <el-input-number v-model="state[field.key].step" :min="1" :max="field.max - field.min + 1" />
          <span>{{ field.unit }}执行一次</span>
        </div>
        <div v-if="state[field.key].type === 'specified'" class="field-row">
          <el-select v-model="state[field.key].selected" multiple filterable collapse-tags collapse-tags-tooltip :max-collapse-tags="8" placeholder="选择具体值" class="w-100%">
            <el-option v-for="number in field.max - field.min + 1" :key="number" :label="number + field.min - 1" :value="number + field.min - 1" />
          </el-select>
        </div>
      </el-tab-pane>

      <el-tab-pane label="周" name="week">
        <el-radio-group v-model="state.week.type">
          <el-radio-button value="unspecified">不指定</el-radio-button>
          <el-radio-button value="range">区间</el-radio-button>
          <el-radio-button value="lastWeek">本月最后一个</el-radio-button>
          <el-radio-button value="nthWeek">第几周</el-radio-button>
          <el-radio-button value="specified">指定</el-radio-button>
        </el-radio-group>
        <div v-if="state.week.type === 'range'" class="field-row">
          <span>从</span>
          <el-select v-model="state.week.start" class="w-120px">
            <el-option v-for="item in WEEK_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <span>至</span>
          <el-select v-model="state.week.end" class="w-120px">
            <el-option v-for="item in WEEK_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>
        <div v-if="state.week.type === 'lastWeek'" class="field-row">
          <span>本月最后一个</span>
          <el-select v-model="state.week.extra1" class="w-120px">
            <el-option v-for="item in WEEK_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>
        <div v-if="state.week.type === 'nthWeek'" class="field-row">
          <span>第</span>
          <el-input-number v-model="state.week.extra2" :min="1" :max="5" />
          <span>周的</span>
          <el-select v-model="state.week.extra1" class="w-120px">
            <el-option v-for="item in WEEK_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>
        <div v-if="state.week.type === 'specified'" class="field-row">
          <el-select v-model="state.week.selected" multiple collapse-tags collapse-tags-tooltip :max-collapse-tags="4" placeholder="选择星期" class="w-100%">
            <el-option v-for="item in WEEK_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>
        <div v-if="state.week.type !== 'unspecified'" class="field-tip">周指定后日字段将自动置为「?」</div>
      </el-tab-pane>

      <el-tab-pane label="年" name="year">
        <el-radio-group v-model="state.year.type">
          <el-radio-button value="none">不指定</el-radio-button>
          <el-radio-button value="specified">指定</el-radio-button>
          <el-radio-button value="range">区间</el-radio-button>
        </el-radio-group>
        <div v-if="state.year.type === 'specified'" class="field-row">
          <el-input-number v-model="state.year.start" :min="yearMin" :max="yearMax" />
        </div>
        <div v-if="state.year.type === 'range'" class="field-row">
          <span>从</span>
          <el-input-number v-model="state.year.start" :min="yearMin" :max="yearMax" />
          <span>至</span>
          <el-input-number v-model="state.year.end" :min="yearMin" :max="yearMax" />
        </div>
        <div class="field-tip">不指定时生成 6 段表达式</div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'Crontab' })

/** 周字段取值遵循标准 cron：0=周日，1-6=周一至周六 */
const WEEK_OPTIONS = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 0, label: '周日' },
]

/** 常用表达式快捷模板（与后端 cron-parser 语法一致） */
const QUICK_TEMPLATES = [
  { label: '每分钟', cron: '0 0/1 * * * ?' },
  { label: '每小时', cron: '0 0 0/1 * * ?' },
  { label: '每天 00:00', cron: '0 0 0 * * ?' },
  { label: '每天 08:00', cron: '0 0 8 * * ?' },
  { label: '每周一 09:00', cron: '0 0 9 ? * 1' },
  { label: '每月 1 号 00:00', cron: '0 0 0 1 * ?' },
]

type FieldKey = 'second' | 'minute' | 'hour' | 'day' | 'month' | 'week' | 'year'

interface FieldState {
  type: string
  start: number
  end: number
  step: number
  selected: number[]
  /** workday 的 n / lastWeek 的星期 / nthWeek 的星期 */
  extra1: number
  /** nthWeek 的第几周 */
  extra2: number
}

interface SimpleFieldConfig {
  key: 'second' | 'minute' | 'hour' | 'month'
  label: string
  unit: string
  min: number
  max: number
}

/** 秒/分/时在前（日之前），月在日之后 */
const fieldsA: SimpleFieldConfig[] = [
  { key: 'second', label: '秒', unit: '秒', min: 0, max: 59 },
  { key: 'minute', label: '分', unit: '分', min: 0, max: 59 },
  { key: 'hour', label: '时', unit: '小时', min: 0, max: 23 },
]
const fieldsB: SimpleFieldConfig[] = [{ key: 'month', label: '月', unit: '月', min: 1, max: 12 }]

const currentYear = new Date().getFullYear()
const yearMin = currentYear
const yearMax = currentYear + 20

function createState(type: string, min: number, max: number): FieldState {
  return { type, start: min, end: max, step: 1, selected: [], extra1: 1, extra2: 1 }
}

/** 企业惯例默认：每分钟整点触发一次（秒固定 0、分从 0 开始每 1 分） */
const state = reactive({
  second: createState('fixed', 0, 59),
  minute: createState('interval', 0, 59),
  hour: createState('any', 0, 23),
  day: createState('any', 1, 31),
  month: createState('any', 1, 12),
  week: createState('unspecified', 1, 6),
  year: createState('none', yearMin, yearMax),
})

const activeTab = ref<FieldKey>('second')
const parseError = ref('')
const model = defineModel<string>('cron', { default: '' })

function applyTemplate(cron: string) {
  model.value = cron
}

/** 日/周互斥（Quartz 规范）：一方指定后另一方必须为 ? */
watch(
  () => state.day.type,
  (type) => {
    if (type !== 'unspecified') state.week.type = 'unspecified'
  }
)
watch(
  () => state.week.type,
  (type) => {
    if (type !== 'unspecified') state.day.type = 'unspecified'
  }
)

function sortJoin(values: number[]): string {
  return [...values].sort((a, b) => a - b).join(',')
}

function buildField(key: FieldKey): string {
  const s = state[key]
  switch (s.type) {
    case 'fixed':
      return String(s.start)
    case 'any':
      return '*'
    case 'unspecified':
      return '?'
    case 'range':
      return `${s.start}-${s.end}`
    case 'interval':
      return `${s.start}/${s.step}`
    case 'last':
      return 'L'
    case 'workday':
      return `${s.extra1}W`
    case 'lastWeek':
      return `${s.extra1}L`
    case 'nthWeek':
      return `${s.extra1}#${s.extra2}`
    case 'specified':
      return s.selected.length ? sortJoin(s.selected) : key === 'week' ? '?' : '*'
    case 'none':
      return ''
    default:
      return '*'
  }
}

const expression = computed(() => {
  const keys: FieldKey[] = ['second', 'minute', 'hour', 'day', 'month', 'week']
  const parts = keys.map(buildField)
  const year = buildField('year')
  if (year) parts.push(year)
  return parts.join(' ')
})

let lastEmitted = ''
watch(expression, (value) => {
  if (value === lastEmitted) return
  lastEmitted = value
  model.value = value
})

/** 解析单段表达式回填 state，不支持返回 false */
function parseSegment(segment: string, key: FieldKey): boolean {
  const s = state[key]
  let matched: RegExpMatchArray | null
  if (segment === '*') {
    s.type = 'any'
  } else if (segment === '?') {
    if (key !== 'day' && key !== 'week') return false
    s.type = 'unspecified'
  } else if ((matched = segment.match(/^(\d+)-(\d+)$/))) {
    s.type = 'range'
    s.start = Number(matched[1])
    s.end = Number(matched[2])
  } else if ((matched = segment.match(/^(\*|\d+)\/(\d+)$/))) {
    s.type = 'interval'
    s.start = matched[1] === '*' ? (key === 'day' ? 1 : 0) : Number(matched[1])
    s.step = Number(matched[2])
  } else if (key !== 'day' && key !== 'week' && key !== 'year' && /^\d+$/.test(segment)) {
    s.type = 'fixed'
    s.start = Number(segment)
  } else if (/^\d+(,\d+)*$/.test(segment)) {
    s.type = 'specified'
    s.selected = segment.split(',').map(Number)
  } else if (key === 'day' && segment === 'L') {
    s.type = 'last'
  } else if (key === 'day' && (matched = segment.match(/^(\d+)W$/))) {
    s.type = 'workday'
    s.extra1 = Number(matched[1])
  } else if (key === 'week' && (matched = segment.match(/^(\d+)L$/))) {
    s.type = 'lastWeek'
    s.extra1 = Number(matched[1])
  } else if (key === 'week' && (matched = segment.match(/^(\d+)#(\d+)$/))) {
    s.type = 'nthWeek'
    s.extra1 = Number(matched[1])
    s.extra2 = Number(matched[2])
  } else if (key === 'year' && /^\d{4}$/.test(segment)) {
    s.type = 'specified'
    s.start = Number(segment)
  } else {
    return false
  }
  return true
}

/** 外部表达式回填 UI；含不支持的语法时提示手动编辑 */
function parseExpression(value: string) {
  const segments = value.trim().split(/\s+/)
  if (segments.length !== 6 && segments.length !== 7) {
    parseError.value = '表达式应为 6 或 7 段，已保留原文，可在各 Tab 手动调整'
    return
  }
  const keys: FieldKey[] = ['second', 'minute', 'hour', 'day', 'month', 'week']
  if (segments.length === 7) keys.push('year')
  const failed = keys.find((key, index) => !parseSegment(segments[index], key))
  if (failed) {
    parseError.value = `表达式含暂不支持自动回显的语法（${failed} 字段），已保留原文，可在各 Tab 手动调整`
    return
  }
  if (segments.length === 6) state.year.type = 'none'
  parseError.value = ''
}

watch(
  model,
  (value) => {
    if (!value || value === lastEmitted) return
    parseExpression(value)
  },
  { immediate: true }
)
</script>

<style lang="scss" scoped>
.crontab {
  .quick-row {
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    .quick-label {
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }
    .quick-tag {
      cursor: pointer;
    }
  }
  :deep(.el-radio-group) {
    margin-bottom: 12px;
    flex-wrap: wrap;
  }
  .field-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    .el-input-number {
      width: 110px;
    }
  }
  .field-tip {
    margin-top: 8px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}
</style>
