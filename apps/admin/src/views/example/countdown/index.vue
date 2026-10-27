<template>
  <div class="countup-page">
    <el-row :gutter="16" class="countup-page__grid">
      <el-col :xs="24" :md="12" class="countup-page__col">
        <el-card class="countup-page__card">
          <template #header>
            <div class="countup-page__card-header">基础统计数值</div>
          </template>
          <div class="countup-page__demo-row">
            <el-statistic title="日活跃用户" :value="animatedValues.users" />
            <el-statistic title="总交易量" :value="animatedValues.transactions" prefix="¥" />
            <el-statistic title="用户反馈" :value="animatedValues.feedback" suffix="条" />
          </div>
          <div class="countup-page__controls">
            <el-button type="primary" size="small" @click="randomizeValues">随机切换数值</el-button>
            <span class="countup-page__tip">数值平滑过渡，基于 @vueuse/core useTransition</span>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="12" class="countup-page__col">
        <el-card class="countup-page__card">
          <template #header>
            <div class="countup-page__card-header">带格式的统计数值</div>
          </template>
          <div class="countup-page__demo-row">
            <el-statistic title="系统可用率" :value="animatedValues.uptime" suffix="%" :precision="2" />
            <el-statistic title="男女比例" :value="animatedValues.ratio" :precision="1" />
            <el-statistic title="内存使用" :value="animatedValues.memory" :precision="2" suffix="GB" />
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="12" class="countup-page__col">
        <el-card class="countup-page__card">
          <template #header>
            <div class="countup-page__card-header">倒计时</div>
          </template>
          <div class="countup-page__demo-row">
            <el-countdown title="距下次数据采集" :value="countdownTarget" format="HH:mm:ss">
              <template #prefix>
                <SvgIcon name="Schedule" class="countup-page__inline-icon" />
              </template>
            </el-countdown>
            <el-countdown title="VIP 剩余时长" :value="vipEndTime" @finish="onVipFinish" />
          </div>
          <div class="countup-page__controls">
            <el-button type="primary" size="small" @click="addMinute">延长 1 分钟</el-button>
            <el-button type="warning" size="small" @click="reduceMinute">缩短 1 分钟</el-button>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="12" class="countup-page__col">
        <el-card class="countup-page__card">
          <template #header>
            <div class="countup-page__card-header">统计卡片（业务场景）</div>
          </template>
          <el-row :gutter="12">
            <el-col :xs="12" :sm="6">
              <el-statistic :value="animatedValues.cards.activeUsers" :value-style="{ color: 'var(--el-color-primary)', fontSize: '28px', fontWeight: 600 }">
                <template #title>
                  <div class="countup-page__card-stat-title">
                    <SvgIcon name="Online" class="countup-page__inline-icon" />
                    <span>在线用户</span>
                  </div>
                </template>
              </el-statistic>
            </el-col>
            <el-col :xs="12" :sm="6">
              <el-statistic :value="animatedValues.cards.tasks" :value-style="{ color: 'var(--el-color-success)', fontSize: '28px', fontWeight: 600 }" suffix="个">
                <template #title>
                  <div class="countup-page__card-stat-title">
                    <SvgIcon name="Schedule" class="countup-page__inline-icon" />
                    <span>今日任务</span>
                  </div>
                </template>
              </el-statistic>
            </el-col>
            <el-col :xs="12" :sm="6">
              <el-statistic :value="animatedValues.cards.diskUsage" :value-style="{ color: 'var(--el-color-warning)', fontSize: '28px', fontWeight: 600 }" suffix="%">
                <template #title>
                  <div class="countup-page__card-stat-title">
                    <SvgIcon name="Disk" class="countup-page__inline-icon" />
                    <span>磁盘使用</span>
                  </div>
                </template>
              </el-statistic>
            </el-col>
            <el-col :xs="12" :sm="6">
              <el-statistic :value="animatedValues.cards.errorRate" :precision="2" :value-style="{ color: 'var(--el-color-danger)', fontSize: '28px', fontWeight: 600 }" suffix="%">
                <template #title>
                  <div class="countup-page__card-stat-title">
                    <SvgIcon name="Monitor" class="countup-page__inline-icon" />
                    <span>错误率</span>
                  </div>
                </template>
              </el-statistic>
            </el-col>
          </el-row>
        </el-card>
      </el-col>

      <el-col :xs="24" class="countup-page__col">
        <el-card class="countup-page__card">
          <template #header>
            <div class="countup-page__card-header">技术说明</div>
          </template>
          <el-descriptions :column="appStore.isDesktop ? 3 : 1" border size="small">
            <el-descriptions-item label="数值动画">@vueuse/core useTransition（贝塞尔缓动）</el-descriptions-item>
            <el-descriptions-item label="倒计时">Element Plus el-countdown 组件</el-descriptions-item>
            <el-descriptions-item label="格式化">千分位分隔 / 小数精度 / 前后缀</el-descriptions-item>
            <el-descriptions-item label="交互模式">随机切换 / 增减时长 / 倒计时结束回调</el-descriptions-item>
            <el-descriptions-item label="适用场景">Dashboard 大盘 / 监控面板 / 活动倒计时</el-descriptions-item>
            <el-descriptions-item label="零依赖新增">完全基于项目已有依赖实现</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { TransitionPresets } from '@vueuse/core'

const appStore = useAppStore()

const rawValues = ref({
  users: 0,
  transactions: 0,
  feedback: 0,
  uptime: 0,
  ratio: 0,
  memory: 0,
  cards: {
    activeUsers: 0,
    tasks: 0,
    diskUsage: 0,
    errorRate: 0,
  },
})

const targetValues = {
  users: 68500,
  transactions: 172000,
  feedback: 562,
  uptime: 99.96,
  ratio: 1.38,
  memory: 12.48,
  cards: {
    activeUsers: 1286,
    tasks: 42,
    diskUsage: 67.5,
    errorRate: 0.08,
  },
}

const animatedValues = reactive({
  users: useTransition(() => rawValues.value.users, { duration: 800, transition: TransitionPresets.easeOutCubic }),
  transactions: useTransition(() => rawValues.value.transactions, { duration: 800, transition: TransitionPresets.easeOutCubic }),
  feedback: useTransition(() => rawValues.value.feedback, { duration: 800, transition: TransitionPresets.easeOutCubic }),
  uptime: useTransition(() => rawValues.value.uptime, { duration: 1000, transition: TransitionPresets.easeOutCubic }),
  ratio: useTransition(() => rawValues.value.ratio, { duration: 1000, transition: TransitionPresets.easeOutCubic }),
  memory: useTransition(() => rawValues.value.memory, { duration: 1000, transition: TransitionPresets.easeOutCubic }),
  cards: {
    activeUsers: useTransition(() => rawValues.value.cards.activeUsers, { duration: 1000, transition: TransitionPresets.easeOutCubic }),
    tasks: useTransition(() => rawValues.value.cards.tasks, { duration: 1000, transition: TransitionPresets.easeOutCubic }),
    diskUsage: useTransition(() => rawValues.value.cards.diskUsage, { duration: 1000, transition: TransitionPresets.easeOutCubic }),
    errorRate: useTransition(() => rawValues.value.cards.errorRate, { duration: 1000, transition: TransitionPresets.easeOutCubic }),
  },
})

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min: number, max: number, decimals: number): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

function randomizeValues() {
  rawValues.value.users = randomInt(50000, 100000)
  rawValues.value.transactions = randomInt(100000, 300000)
  rawValues.value.feedback = randomInt(100, 999)
  rawValues.value.uptime = randomFloat(99.5, 99.99, 2)
  rawValues.value.ratio = randomFloat(0.8, 2.0, 1)
  rawValues.value.memory = randomFloat(8, 32, 2)
  rawValues.value.cards.activeUsers = randomInt(500, 2000)
  rawValues.value.cards.tasks = randomInt(10, 80)
  rawValues.value.cards.diskUsage = randomFloat(30, 95, 1)
  rawValues.value.cards.errorRate = randomFloat(0, 5.0, 2)
}

const countdownTarget = ref(Date.now() + 8 * 60 * 60 * 1000)
const vipEndTime = ref(Date.now() + 48 * 60 * 60 * 1000)

function addMinute() {
  countdownTarget.value = countdownTarget.value + 60 * 1000
  vipEndTime.value = vipEndTime.value + 60 * 1000
}

function reduceMinute() {
  const now = Date.now()
  countdownTarget.value = Math.max(now + 60 * 1000, countdownTarget.value - 60 * 1000)
  vipEndTime.value = Math.max(now + 60 * 1000, vipEndTime.value - 60 * 1000)
}

function onVipFinish() {
  vipEndTime.value = Date.now() + 24 * 60 * 60 * 1000
}

onMounted(() => {
  setTimeout(() => {
    rawValues.value.users = targetValues.users
    rawValues.value.transactions = targetValues.transactions
    rawValues.value.feedback = targetValues.feedback
    rawValues.value.uptime = targetValues.uptime
    rawValues.value.ratio = targetValues.ratio
    rawValues.value.memory = targetValues.memory
    rawValues.value.cards.activeUsers = targetValues.cards.activeUsers
    rawValues.value.cards.tasks = targetValues.cards.tasks
    rawValues.value.cards.diskUsage = targetValues.cards.diskUsage
    rawValues.value.cards.errorRate = targetValues.cards.errorRate
  }, 300)
})
</script>

<style lang="scss" scoped>
.countup-page {
  padding: 16px;

  &__grid {
    display: flex;
    flex-wrap: wrap;
  }

  &__col {
    margin-bottom: 16px;
  }

  &__card {
    height: 100%;
  }

  &__card-header {
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  &__demo-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
    gap: 24px;
    padding: 16px 0;
    min-height: 100px;
    align-items: center;
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 16px;
    background: var(--el-fill-color-lighter);
    border-radius: 8px;
  }

  &__tip {
    font-size: 13px;
    color: var(--el-text-color-placeholder);
  }

  &__inline-icon {
    width: 1em;
    height: 1em;
    vertical-align: -0.125em;
  }

  &__card-stat-title {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }
}

html[data-device='mobile'] {
  .countup-page {
    padding: 12px;

    &__col {
      margin-bottom: 12px;
    }

    &__demo-row {
      justify-content: center;
      gap: 16px;
      padding: 12px 0;
    }

    &__controls {
      flex-wrap: wrap;
    }
  }
}
</style>
