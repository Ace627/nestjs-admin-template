<template>
  <div class="app-content">
    <el-card>
      <template #header>基本信息</template>
      <el-descriptions :column="appStore.isDesktop ? 4 : 1" border v-if="cacheInfo.info" label-width="120px">
        <el-descriptions-item label="Redis 版本">{{ cacheInfo.info.redis_version }}</el-descriptions-item>
        <el-descriptions-item label="运行模式">{{ formatRedisMode }}</el-descriptions-item>
        <el-descriptions-item label="端口">{{ cacheInfo.info.tcp_port }}</el-descriptions-item>
        <el-descriptions-item label="客户端数">{{ cacheInfo.info.connected_clients }}</el-descriptions-item>
        <el-descriptions-item label="运行时间">{{ cacheInfo.info.uptime_in_days }}天</el-descriptions-item>
        <el-descriptions-item label="使用内存">{{ cacheInfo.info.used_memory_human }}</el-descriptions-item>
        <el-descriptions-item label="使用 CPU">{{ cacheInfo.info.used_cpu_user }}</el-descriptions-item>
        <el-descriptions-item label="内存配置">{{ formatMaxmemoryText }}</el-descriptions-item>
        <el-descriptions-item label="AOF 开启">{{ cacheInfo.info.aof_enabled === 1 ? '是' : '否' }}</el-descriptions-item>
        <el-descriptions-item label="RDB 状态">{{ cacheInfo.info.rdb_last_bgsave_status }}</el-descriptions-item>
        <el-descriptions-item label="Key 数量">{{ cacheInfo.dbsize }}</el-descriptions-item>
        <el-descriptions-item label="网络入口/出口">{{ formatInstantaneous }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-row :gutter="16" class="mt-16px">
      <el-col :span="12" :xs="24">
        <el-card>
          <template #header>命令统计</template>
          <ProChart :options="commandChartOption" customClass="h-360px" />
        </el-card>
      </el-col>

      <el-col :span="12" :xs="24">
        <el-card>
          <template #header>内存信息</template>
          <ProChart :options="memoryChartOption" customClass="h-360px" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { isEmpty } from 'lodash-es'
import { TipModal } from '@/utils'
import type { Cache } from '@/types'
import type { EChartsOption } from 'echarts'
import { CacheRequest } from '@/api/monitor/cache.request'

const appStore = useAppStore()
const cacheInfo = ref({} as Cache.Info)

const RedisModeMap = { standalone: '单机', sentinel: '哨兵', cluster: '集群' }

async function getInfo() {
  try {
    TipModal.showLoading('数据加载中，请稍后')
    cacheInfo.value = await CacheRequest.getInfo()
    TipModal.hideLoading()
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error(`服务监控 getInfo ${errMsg}`)
    TipModal.hideLoading()
  }
}

/** 格式化最大内存配置文本 */
const formatMaxmemoryText = computed(() => {
  if (cacheInfo.value.info.maxmemory === 0) return '无限制'
  return cacheInfo.value.info.maxmemory_human
})

/** 格式化 Redis 运行模式 */
const formatRedisMode = computed(() => {
  return (RedisModeMap[cacheInfo.value.info.redis_mode] || '未知') + '模式'
})

/** 格式化网络入口/出口 */
const formatInstantaneous = computed(() => {
  const { instantaneous_input_kbps, instantaneous_output_kbps } = cacheInfo.value.info
  return `${instantaneous_input_kbps}KB/s / ${instantaneous_output_kbps}KB/s`
})

getInfo()

const TOP_COMMAND_COUNT = 15

/** 只展示前 15 条命令，剩余的合并为 other，共 16 条 */
const buildCommandStats = computed(() => {
  const stats = [...(cacheInfo.value.commandstats || [])].sort((a, b) => b.value - a.value)
  if (stats.length <= TOP_COMMAND_COUNT + 1) return stats
  const top = stats.slice(0, TOP_COMMAND_COUNT)
  const otherValue = stats.slice(TOP_COMMAND_COUNT).reduce((sum, item) => sum + item.value, 0)
  return [...top, { name: 'other', value: otherValue }]
})

const commandChartOption = computed<EChartsOption>(() => ({
  legend: { orient: 'vertical', left: 'right', type: 'scroll' },
  tooltip: {
    trigger: 'item',
    formatter(params: any) {
      const name = params.name || '未知命令'
      const value = params.value ?? 0
      const percent = params.percent ?? 0
      return (
        `<div style="font-weight:bold;margin-bottom:5px;font-size:14px;">${name}</div>` +
        `<div>执行次数: <span style="font-weight:bold;float:right;">${value.toLocaleString()}</span></div>` +
        `<div>占比: <span style="font-weight:bold;float:right;">${percent.toFixed(2)}%</span></div>`
      )
    },
  },
  series: [{ type: 'pie', radius: '50%', data: buildCommandStats.value }],
}))

const memoryChartOption = computed<EChartsOption>(() => {
  if (isEmpty(cacheInfo.value.info)) return {}
  const { used_memory: usedBytes = 0, maxmemory: maxBytes = 0, total_system_memory: sysBytes = 0 } = cacheInfo.value.info
  // 优先用 maxmemory 作分母，未限制时退化用系统总内存；两者都没有则显示 50%（无参考基准）
  const refBytes = maxBytes || sysBytes
  const usagePercent = refBytes > 0 ? Math.min(100, Math.round((usedBytes / refBytes) * 100)) : 50
  const hasLimit = maxBytes > 0

  return {
    tooltip: {
      formatter: hasLimit ? `内存使用: ${formatBytes(usedBytes)}<br/>最大内存: ${formatBytes(maxBytes)}<br/>使用率: ${usagePercent}%` : `内存使用: ${formatBytes(usedBytes)}<br/>最大内存: 未设置限制`,
    },
    series: [
      {
        name: '内存',
        type: 'gauge',
        min: 0,
        max: 100,
        data: [{ value: usagePercent, name: hasLimit ? '内存使用率' : '内存使用量' }],
        detail: {
          formatter: hasLimit ? '{value}%' : formatBytes(usedBytes),
          fontSize: 16,
          fontWeight: 'bold' as const,
          offsetCenter: [0, '70%'],
        },
      },
    ],
  }
})

/** 字节数转人类可读文本，如 848256 -> 828.38KB */
function formatBytes(bytes: number): string {
  if (!bytes) return '0B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  return `${(bytes / 1024 ** i).toFixed(2)}${units[i]}`
}
</script>

<style lang="scss" scoped>
html[data-device='mobile'] .el-col + .el-col {
  margin-top: 16px;
}
</style>
