<template>
  <div class="app-content h-full">
    <el-row :gutter="16" class="h-full">
      <el-col :span="8" :xs="24">
        <el-card>
          <template #header>
            <span>缓存列表</span>
            <SvgIcon name="Refresh" @click="refreshCacheName" />
          </template>
          <ProTable :data="names" :columns="nameColumns" @row-click="handleClickNameRow" :loading="nameLoading">
            <template #action="{ row }">
              <el-link type="danger" v-permissions="['monitor:cache:clear']" @click="handleDeleteName(row)">删除</el-link>
            </template>
          </ProTable>
        </el-card>
      </el-col>

      <el-col :span="8" :xs="24">
        <el-card>
          <template #header>
            <span>键名列表</span>
            <SvgIcon name="Refresh" @click="refreshCacheKeys" />
          </template>
          <ProTable :data="keys" :columns="keyColumns" @row-click="handleClickKeyRow" :loading="keyLoading">
            <template #key="{ row }">
              <ProTooltip :content="row.key" :width="420" placement="top">
                <template #content>
                  <div v-for="line in splitCacheKeyLines(row.key)" :key="line">{{ line }}</div>
                </template>
                <span class="line-clamp-1">{{ row.key }}</span>
              </ProTooltip>
            </template>
            <template #action="{ row }">
              <el-link type="danger" v-permissions="['monitor:cache:delete']" @click="handleDeleteKey(row)">删除</el-link>
            </template>
          </ProTable>
        </el-card>
      </el-col>

      <el-col :span="8" :xs="24">
        <el-card>
          <template #header>缓存内容</template>
          <el-form :model="cacheForm">
            <el-form-item label="缓存名称" prop="name">
              <el-input v-model="cacheForm.name" readonly />
            </el-form-item>
            <el-form-item label="缓存键名" prop="key">
              <el-input v-model="cacheForm.key" readonly />
            </el-form-item>
            <el-form-item label="剩余过期" prop="ttl">
              <el-input :model-value="ttlText" readonly />
            </el-form-item>
            <el-form-item label="缓存内容" prop="value">
              <el-input type="textarea" :rows="16" v-model="cacheForm.value" readonly />
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { isNil, TipModal } from '@/utils'
import type { Cache } from '@/types'
import { CacheRequest } from '@/api/monitor/cache.request'
import type { ProTableColumn } from '@/types'

/** 缓存名称列表 */
const names = ref<Cache.Name[]>([])
/** 缓存名称数据加载态 */
const nameLoading = ref<boolean>(false)
/** 缓存键名列表 */
const keys = ref<{ key: string }[]>([])
/** 缓存键名数据加载态 */
const keyLoading = ref<boolean>(false)
/** 当前选中的缓存名称 */
const currentName = ref<string>('')
/** 缓存内容表单 */
const cacheForm = ref({} as { name: string; key: string } & Cache.Detail)

/** 缓存名称列表的展示列配置项 */
const nameColumns: ProTableColumn<Cache.Name>[] = [
  { align: 'center', label: '序号', type: 'index', minWidth: 52 },
  { align: 'center', label: '缓存名称', prop: 'prefix', minWidth: 132, showOverflowTooltip: true },
  { align: 'center', label: '备注', prop: 'remark', minWidth: 120 },
  { align: 'center', label: '操作', slot: 'action', fixed: 'right', minWidth: 52 },
]

/** 缓存键名列表的展示列配置项 */
const keyColumns: ProTableColumn<{ key: string }>[] = [
  { align: 'center', label: '序号', type: 'index', width: 64 },
  { align: 'center', label: '缓存键名', prop: 'key', width: 240, slot: 'key' },
  { align: 'center', label: '操作', slot: 'action' },
]

/** TTL 展示文本 */
const ttlText = computed(() => {
  if (isNil(cacheForm.value.ttl)) return ''
  if (cacheForm.value.ttl === -1) return '永不过期'
  if (cacheForm.value.ttl === -2) return '键不存在'
  return `${cacheForm.value.ttl} 秒`
})

/** 按缓存分类将键拆为多行展示文案；无拆分规则的分类原样单行展示 */
function splitCacheKeyLines(fullKey: string): string[] {
  const separatorIndex = fullKey.indexOf(':')
  if (separatorIndex === -1) return [fullKey]
  switch (currentName.value) {
    /** 对应后端 RedisConstant：token:access / user:online，键结构「用户ID:会话ID」 */
    case 'token:access':
    case 'user:online':
      return [`用户ID：${fullKey.slice(0, separatorIndex)}`, `会话ID：${fullKey.slice(separatorIndex + 1)}`]
    /** 限流键结构「来源IP:接口路径」 */
    case 'throttle:limit':
      return [`来源IP：${fullKey.slice(0, separatorIndex)}`, `接口路径：${fullKey.slice(separatorIndex + 1)}`]
    default:
      return [fullKey]
  }
}

async function getNames() {
  try {
    nameLoading.value = true
    const data = await CacheRequest.getNames()
    names.value = data
    nameLoading.value = false
  } catch (error) {
    nameLoading.value = false
    return Promise.reject(error)
  }
}
/** 刷新缓存名称列表 */
async function refreshCacheName() {
  await getNames()
  TipModal.msgSuccess('刷新缓存列表成功')
}

/** 删除指定分类下的所有缓存（危险操作：清 token 分类会踢掉所有在线用户） */
async function handleDeleteName(row: Cache.Name) {
  const { cancel } = await TipModal.confirm(`确定清空【${row.remark}】下的所有缓存吗？`)
  if (cancel) return TipModal.msg('操作取消')
  await CacheRequest.clearNames({ name: row.prefix })
  if (currentName.value === row.prefix) {
    currentName.value = ''
    keys.value = []
    cacheForm.value = {} as Cache.Detail
  }
  TipModal.msgSuccess(`清理缓存分类 ${row.prefix} 成功`)
}

/** 点击缓存名称表格行的回调 */
async function handleClickNameRow(row: Cache.Name) {
  if (currentName.value !== row.prefix) cacheForm.value = {} as Cache.Detail
  currentName.value = row.prefix
  getKeys()
}

/** 获取缓存键名列表 */
async function getKeys() {
  try {
    keyLoading.value = true
    const data = await CacheRequest.getKeys({ name: currentName.value })
    keys.value = data.map((item) => ({ key: item.replace(`${currentName.value}:`, '') }))
    keyLoading.value = false
  } catch (error) {
    keyLoading.value = false
    return Promise.reject(error)
  }
}
/** 刷新缓存键名列表 */
async function refreshCacheKeys() {
  if (!currentName.value) return TipModal.msgWarning('请先选择一个缓存名称')
  await getKeys()
  TipModal.msgSuccess('刷新键名列表成功')
}
/** 点击缓存键名表格行的回调 */
async function handleClickKeyRow(row: { key: string }) {
  try {
    const key = `${currentName.value}:${row.key}`
    cacheForm.value = await CacheRequest.getValue({ key })
  } catch {
    cacheForm.value = {} as Cache.Detail
  }
}
/** 删除对应 key 的缓存数据 */
async function handleDeleteKey(row: { key: string }) {
  const key = `${currentName.value}:${row.key}`
  await CacheRequest.clearKeys({ key })
  await getKeys()
  TipModal.msgSuccess(`清理缓存键名 ${row.key} 成功`)
}

getNames()
</script>

<style lang="scss" scoped>
.app-content {
  --card-body-height: 0; // 桌面端等高内部滚动
}
html[data-device='mobile'] .app-content {
  --card-body-height: auto; // 移动端高度自适应滚动
}

:deep() .el-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  &__header {
    display: flex;
    justify-content: space-between;
    flex-shrink: 0;
  }
  &__body {
    height: var(--card-body-height);
  }
}
.svg-icon:hover {
  cursor: pointer;
  color: var(--el-color-primary);
}

html[data-device='mobile'] .el-col + .el-col {
  margin-top: 16px;
}
</style>
