<template>
  <div class="app-content dashboard">
    <!-- 欢迎区 -->
    <el-card shadow="never">
      <div class="dashboard__welcome">
        <SvgIcon name="Sunny" class="dashboard__welcome-icon" />
        <div>
          <div class="dashboard__greeting">{{ greeting }}，{{ displayName }}！</div>
          <div class="dashboard__date">{{ todayText }}</div>
        </div>
      </div>
    </el-card>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="mt-16px">
      <el-col v-for="card in cardList" :key="card.label" :xs="12" :sm="8" :md="6" :lg="4">
        <el-card shadow="hover" class="dashboard__stat-card">
          <div class="stat-card">
            <SvgIcon :name="card.icon" class="stat-card__icon" />
            <div>
              <div class="stat-card__value">{{ card.value ?? '-' }}</div>
              <div class="stat-card__label">{{ card.label }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 趋势图表 -->
    <el-row :gutter="16" class="mt-16px">
      <el-col :xs="24" :lg="12">
        <el-card shadow="never">
          <template #header>
            <span>近 7 天登录趋势</span>
          </template>
          <ProChart class="dashboard__chart" :options="loginTrendOptions" />
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card shadow="never">
          <template #header>
            <span>近 7 天操作日志</span>
          </template>
          <ProChart class="dashboard__chart" :options="operTrendOptions" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 快捷入口 / 我的菜单 -->
    <el-row :gutter="16" class="mt-16px">
      <el-col :xs="24" :lg="12">
        <el-card shadow="never">
          <template #header>
            <span>快捷入口</span>
          </template>
          <div class="dashboard__entries">
            <div v-for="entry in quickEntryList" :key="entry.path" class="dashboard__entry" @click="handleNavigate(entry.path)">
              <SvgIcon :name="entry.icon" class="dashboard__entry-icon" />
              <span>{{ entry.title }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card shadow="never">
          <template #header>
            <span>我的菜单</span>
          </template>
          <div v-if="myMenuList.length" class="dashboard__entries">
            <div v-for="menu in myMenuList" :key="menu.path" class="dashboard__entry" @click="handleNavigate(menu.path, menu)">
              <SvgIcon :name="menu.icon" class="dashboard__entry-icon" />
              <span>{{ menu.title }}</span>
            </div>
          </div>
          <el-empty v-else description="暂无可用菜单" :image-size="80" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'Dashboard' })
import dayjs from 'dayjs'
import type { EChartsOption } from 'echarts'
import type { Dashboard } from '@/types'
import { resolvePath } from '@/router/router.helper'
import { DashboardRequest } from '@/api/dashboard.request'
import { CacheRequest } from '@/api/monitor/cache.request'
import { ServerRequest } from '@/api/monitor/server.request'

const userStore = useUserStore()
const permissionStore = usePermissionStore()
const router = useRouter()

/** 统计卡片项 */
interface StatCard {
  label: string
  icon: string
  value: number | string | null | undefined
}

/** 快捷入口项 */
interface QuickEntry {
  title: string
  icon: string
  path: string
  permission: string
}

/** 首页统计数据 */
const statistics = ref<Dashboard.Statistics | null>(null)
/** Redis 键数量 */
const redisKeyCount = ref<number | null>(null)
/** CPU 使用率 */
const cpuUsage = ref<string | null>(null)

/** 权限校验 */
const hasPermission = (permissionCode: string) => userStore.permissions.includes(permissionCode)

/** 问候语 */
const greeting = computed(() => {
  const hour = dayjs().hour()
  if (hour < 6) return '夜深了'
  if (hour < 9) return '早上好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

/** 当前用户昵称（无昵称时回退账号） */
const displayName = computed(() => userStore.currentUserInfo.nickname || userStore.currentUserInfo.username || '朋友')

/** 今日日期与星期 */
const weekDayList = ['日', '一', '二', '三', '四', '五', '六']
const todayText = `${dayjs().format('YYYY年MM月DD日')} 星期${weekDayList[dayjs().day()]}`

/** 统计卡片列表（Redis/CPU 依赖 monitor 权限码，无权限不渲染） */
const cardList = computed<StatCard[]>(() => {
  const baseCardList: StatCard[] = [
    { label: '用户总数', icon: 'User', value: statistics.value?.userCount },
    { label: '角色总数', icon: 'Role', value: statistics.value?.roleCount },
    { label: '在线用户', icon: 'Online', value: statistics.value?.onlineCount },
    { label: '今日登录', icon: 'Calendar', value: statistics.value?.todayLoginCount },
  ]
  if (hasPermission('monitor:cache:query')) baseCardList.push({ label: 'Redis 键数', icon: 'Redis', value: redisKeyCount.value })
  if (hasPermission('monitor:server:query')) baseCardList.push({ label: 'CPU 使用率', icon: 'Cpu', value: cpuUsage.value })
  return baseCardList
})

/** 近 7 天登录趋势折线图配置 */
const loginTrendOptions = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'axis' },
  legend: { bottom: 0 },
  grid: { left: 48, right: 24, top: 32, bottom: 48 },
  xAxis: { type: 'category', boundaryGap: false, data: statistics.value?.loginTrend.map((item) => item.date.slice(5)) ?? [] },
  yAxis: { type: 'value', minInterval: 1 },
  series: [
    {
      name: '登录成功',
      type: 'line',
      smooth: true,
      symbolSize: 6,
      lineStyle: { width: 2 },
      itemStyle: { color: '#67c23a' },
      areaStyle: { opacity: 0.15 },
      data: statistics.value?.loginTrend.map((item) => item.successCount) ?? [],
    },
    {
      name: '登录失败',
      type: 'line',
      smooth: true,
      symbolSize: 6,
      lineStyle: { width: 2 },
      itemStyle: { color: '#f56c6c' },
      data: statistics.value?.loginTrend.map((item) => item.failCount) ?? [],
    },
  ],
}))

/** 近 7 天操作日志柱状图配置 */
const operTrendOptions = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: 48, right: 24, top: 32, bottom: 32 },
  xAxis: { type: 'category', data: statistics.value?.operTrend.map((item) => item.date.slice(5)) ?? [] },
  yAxis: { type: 'value', minInterval: 1 },
  series: [
    {
      name: '操作次数',
      type: 'bar',
      barWidth: 18,
      itemStyle: { color: '#409eff', borderRadius: [4, 4, 0, 0] },
      data: statistics.value?.operTrend.map((item) => item.count) ?? [],
    },
  ],
}))

/** 快捷入口（静态配置，按权限码过滤） */
const quickEntryList = computed<QuickEntry[]>(() =>
  [
    { title: '用户管理', icon: 'User', path: '/system/user', permission: 'system:user:query' },
    { title: '角色管理', icon: 'Role', path: '/system/role', permission: 'system:role:query' },
    { title: '菜单管理', icon: 'Menu', path: '/system/menu', permission: 'system:menu:query' },
    { title: '部门管理', icon: 'Dept', path: '/system/dept', permission: 'system:dept:query' },
    { title: '字典管理', icon: 'Dict', path: '/system/dict', permission: 'system:dict:query' },
    { title: '操作日志', icon: 'Operation', path: '/monitor/operlog', permission: 'monitor:operlog:query' },
    { title: '登录日志', icon: 'Loginlog', path: '/monitor/loginlog', permission: 'monitor:loginlog:query' },
    { title: '在线用户', icon: 'Online', path: '/monitor/online', permission: 'monitor:online:query' },
  ].filter((entry) => hasPermission(entry.permission)),
)

/** 我的菜单（当前用户可访问的动态路由叶子页） */
const myMenuList = computed<{ title: string; icon?: string; path: string; link?: string; target?: string }[]>(() => {
  const menuList: { title: string; icon?: string; path: string; link?: string; target?: string }[] = []
  for (const route of permissionStore.dynamicRouteList) {
    if (route.children?.length) {
      for (const child of route.children) {
        if (child.meta?.hidden) continue
        menuList.push({ title: child.meta?.title ?? '', icon: child.meta?.icon, path: resolvePath(child.path, route.path), link: child.meta?.link, target: child.meta?.target })
      }
    } else if (!route.meta?.hidden) {
      menuList.push({ title: route.meta?.title ?? '', icon: route.meta?.icon, path: route.path, link: route.meta?.link, target: route.meta?.target })
    }
  }
  return menuList
})

/** 入口跳转（与侧边栏/菜单搜索一致：外链 target=2 新标签直达原地址，其余当前页跳转） */
function handleNavigate(path: string, entry?: { link?: string; target?: string }) {
  if (entry?.link && entry.target === '2') return window.open(entry.link, '_blank', 'noopener')
  router.push(path)
}

/** 获取首页统计数据 */
async function getStatisticsData() {
  try {
    statistics.value = await DashboardRequest.getStatistics()
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('getStatisticsData errMsg: ', errMsg)
    return Promise.reject(error)
  }
}

/** 获取 Redis 键数量 */
async function getCacheData() {
  try {
    const data = await CacheRequest.getInfo()
    redisKeyCount.value = data.dbsize
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('getCacheData errMsg: ', errMsg)
    return Promise.reject(error)
  }
}

/** 获取 CPU 使用率 */
async function getServerData() {
  try {
    const data = await ServerRequest.getServer()
    cpuUsage.value = data.cpu.used
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('getServerData errMsg: ', errMsg)
    return Promise.reject(error)
  }
}

onMounted(async () => {
  const taskList = [getStatisticsData()]
  if (hasPermission('monitor:cache:query')) taskList.push(getCacheData())
  if (hasPermission('monitor:server:query')) taskList.push(getServerData())
  await Promise.allSettled(taskList)
})
</script>

<style lang="scss" scoped>
.dashboard {
  :deep(.el-col) {
    margin-bottom: 16px;
  }

  &__welcome {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  &__welcome-icon {
    font-size: 40px;
    color: var(--el-color-primary);
  }

  &__greeting {
    font-size: 18px;
    font-weight: 600;
  }

  &__date {
    margin-top: 4px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  &__chart {
    height: 320px;
  }

  &__entries {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
  }

  &__entry {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 16px 0;
    font-size: 13px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      color: var(--el-color-primary);
      border-color: var(--el-color-primary);
      transform: translateY(-2px);
      box-shadow: var(--el-box-shadow-light);
    }
  }

  &__entry-icon {
    font-size: 24px;
    color: var(--el-color-primary);
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: 12px;

    &__icon {
      font-size: 36px;
      color: var(--el-color-primary);
    }

    &__value {
      font-size: 22px;
      font-weight: 600;
    }

    &__label {
      margin-top: 2px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }
}
</style>
