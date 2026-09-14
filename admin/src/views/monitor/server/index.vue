<template>
  <div class="app-content">
    <el-row :gutter="16">
      <el-col :span="8" :xs="24">
        <el-card>
          <template #header>
            <span>处理器</span>
            <SvgIcon name="Cpu" />
          </template>
          <ProTable :data="cpus" :columns="commonColumns"></ProTable>
        </el-card>
      </el-col>
      <el-col :span="8" :xs="24">
        <el-card>
          <template #header>
            <span>内存信息</span>
            <SvgIcon name="Cpu" />
          </template>
          <ProTable :data="memorys" :columns="commonColumns"></ProTable>
        </el-card>
      </el-col>
      <el-col :span="8" :xs="24">
        <el-card>
          <template #header>
            <span>服务器信息</span>
            <SvgIcon name="Server" />
          </template>
          <ProTable :data="servers" :columns="commonColumns"></ProTable>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="mt-16px">
      <template #header>
        <span>磁盘状态</span>
        <SvgIcon name="Disk" />
      </template>
      <ProTable :data="disks" :columns="columns">
        <template #usage="{ row }">
          <el-text v-if="row.usage < 80">{{ row.usage }}</el-text>
          <el-text v-else type="danger">{{ row.usage }}</el-text>
        </template>
      </ProTable>
    </el-card>

    <el-card class="mt-16px">
      <template #header>
        <span>连接池状态</span>
        <SvgIcon name="Monitor" />
      </template>
      <ProTable :data="pools" :columns="commonColumns"></ProTable>
      <div class="mt-16px">
        <div class="mb-8px">连接占用率（{{ pool.current }} / {{ pool.maxConnections }}）</div>
        <el-progress :percentage="currentUsagePercent" :color="progressColor" />
        <div class="mt-16px mb-8px">峰值占用率（{{ pool.maxUsed }} / {{ pool.maxConnections }}）</div>
        <el-progress :percentage="peakUsagePercent" :color="progressColor" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { TipModal } from '@/utils'
import type { Server } from '@/types'
import { ServerRequest } from '@/api/monitor/server.request'
import type { ProTableColumn } from '@/components/ProTable/types'

const cpus = ref<{ label: string; value: any }[]>([])
const memorys = ref<{ label: string; value: any }[]>([])
const servers = ref<{ label: string; value: any }[]>([])
const disks = ref<Server.Disk[]>([])
const pools = ref<{ label: string; value: any }[]>([])
const pool = ref<Server.Pool>({ current: 0, running: 0, maxUsed: 0, maxConnections: 0 })

const commonColumns = [
  { align: 'center', label: '属性', prop: 'label' },
  { align: 'center', label: '属性值', prop: 'value' },
]

/** 占用率超过 70% 告警橙色，超过 90% 告警红色 */
function progressColor(percentage: number) {
  if (percentage >= 90) return 'var(--el-color-danger)'
  if (percentage >= 70) return 'var(--el-color-warning)'
  return 'var(--el-color-success)'
}

const columns: ProTableColumn<Server.Disk>[] = [
  { align: 'center', label: '盘符路径', prop: 'fs' },
  { align: 'center', label: '文件系统', prop: 'mount' },
  { align: 'center', label: '盘符类型', prop: 'type' },
  { align: 'center', label: '总大小（GB）', prop: 'total', minWidth: 120 },
  { align: 'center', label: '可用大小（GB）', prop: 'free', minWidth: 140 },
  { align: 'center', label: '已用大小（GB）', prop: 'used', minWidth: 140 },
  { align: 'center', label: '已用百分比', slot: 'usage', minWidth: 120 },
]

const currentUsagePercent = computed(() => (pool.value.maxConnections ? Number(((pool.value.current / pool.value.maxConnections) * 100).toFixed(2)) : 0))
const peakUsagePercent = computed(() => (pool.value.maxConnections ? Number(((pool.value.maxUsed / pool.value.maxConnections) * 100).toFixed(2)) : 0))

async function getServerInfo() {
  try {
    TipModal.showLoading('正在加载服务监控数据，请稍候！')
    const [data, poolData] = await Promise.all([ServerRequest.getServer(), ServerRequest.getPool()])
    cpus.value.push({ label: '核心数', value: data.cpu.cores })
    cpus.value.push({ label: '用户使用率', value: data.cpu.used })
    cpus.value.push({ label: '系统使用率', value: data.cpu.system })
    cpus.value.push({ label: '当前空闲率', value: data.cpu.free })
    memorys.value.push({ label: '总内存', value: data.memory.total })
    memorys.value.push({ label: '已用内存', value: data.memory.used })
    memorys.value.push({ label: '剩余内存', value: data.memory.free })
    memorys.value.push({ label: '使用率', value: data.memory.usage })
    servers.value.push({ label: '服务器名称', value: data.server.hostname })
    servers.value.push({ label: '操作系统', value: data.server.platform })
    servers.value.push({ label: '服务器IP', value: data.server.ip })
    servers.value.push({ label: '系统架构', value: data.server.arch })
    disks.value = data.disks
    pool.value = poolData
    pools.value.push({ label: '当前连接数', value: poolData.current })
    pools.value.push({ label: '运行中连接数', value: poolData.running })
    pools.value.push({ label: '历史峰值连接数', value: poolData.maxUsed })
    pools.value.push({ label: '连接上限', value: poolData.maxConnections })
    TipModal.hideLoading()
  } catch (error: any) {
    console.log('getServerInfo error: ', error)
    TipModal.hideLoading()
  }
}

getServerInfo()
</script>

<style lang="scss" scoped>
:deep() .el-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .svg-icon {
    color: var(--el-color-primary);
  }
}

html[data-device='mobile'] .el-col + .el-col {
  margin-top: 16px;
}
</style>
