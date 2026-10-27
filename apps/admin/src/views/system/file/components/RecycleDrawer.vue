<template>
  <el-drawer v-model="visible" title="回收站" size="60%">
    <div class="h-full flex flex-col">
      <div class="mb-12px flex items-center justify-between gap-8px">
        <el-input v-model="fileName" placeholder="按文件名搜索" clearable class="w-220px" @keyup.enter="handleQuery">
          <template #prefix><SvgIcon name="Search" /></template>
        </el-input>
        <div class="flex items-center gap-8px">
          <el-button plain type="success" :disabled="!isMultiple" @click="handleRestore()">
            <template #icon><SvgIcon name="RefreshLeft" /></template><span>批量还原</span>
          </el-button>
          <el-button plain type="warning" :disabled="!isMultiple" @click="handleDeletePermanent()">
            <template #icon><SvgIcon name="Delete" /></template><span>批量彻底删除</span>
          </el-button>
          <el-button plain type="danger" :loading="clearLoading" @click="handleClear">
            <template #icon><SvgIcon name="Clear" /></template><span>清空回收站</span>
          </el-button>
        </div>
      </div>

      <el-table ref="tableRef" v-loading="loading" :data="list" @selection-change="handleSelectionChange">
        <el-table-column type="selection" align="center" width="50" />
        <el-table-column label="文件名" prop="fileName" show-overflow-tooltip min-width="200" />
        <el-table-column label="类型" align="center" width="90">
          <template #default="{ row }">
            <el-tag :type="row.fileType === FILE_TYPE.FOLDER ? 'warning' : 'info'" size="small">
              {{ row.fileType === FILE_TYPE.FOLDER ? '目录' : '文件' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="大小" align="center" width="110">
          <template #default="{ row }">{{ formatFileSize(row.fileSize) }}</template>
        </el-table-column>
        <el-table-column label="创建人" prop="createBy" align="center" width="120" />
        <el-table-column label="删除时间" prop="deleteTime" align="center" min-width="170" />
        <el-table-column label="操作" align="center" fixed="right" width="150">
          <template #default="{ row }">
            <el-link type="primary" @click="handleRestore(row as File.Item)">还原</el-link>
            <el-link type="warning" @click="handleDeletePermanent(row as File.Item)">彻底删除</el-link>
          </template>
        </el-table-column>
      </el-table>

      <ProPagination :total v-model:current-page="queryParams.pageNo" v-model:page-size="queryParams.pageSize" @pagination="getList" />
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
defineOptions({ name: 'RecycleDrawer' })
import { TipModal } from '@/utils'
import type { File } from '@/types'
import { FileRequest } from '@/api/system/file.request'
import { FILE_TYPE } from '@/types/api/system/file'
import { formatFileSize } from '@/utils/file'

const emit = defineEmits<{ changed: [] }>()

const visible = ref(false)
const list = ref<File.Item[]>([])
const multipleSelection = ref<File.Item[]>([])
const total = ref(0)
const loading = ref(false)
const clearLoading = ref(false)
const isMultiple = computed(() => multipleSelection.value.length > 0)
const tableRef = useTemplateRef('tableRef')
const fileName = ref('')
const queryParams = ref<File.RecycleQuery>({ pageNo: 1, pageSize: 10 })

async function getList() {
  try {
    loading.value = true
    const data = await FileRequest.findRecycleList(queryParams.value)
    list.value = data.records
    total.value = data.total
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('getList errMsg: ', errMsg)
    return Promise.reject(error)
  } finally {
    loading.value = false
  }
}

function handleQuery() {
  queryParams.value.fileName = fileName.value || undefined
  queryParams.value.pageNo = 1
  getList()
}

function handleSelectionChange(rows: File.Item[]) {
  multipleSelection.value = rows
}

/** 还原（目录级联还原整棵子树） */
async function handleRestore(row?: File.Item) {
  try {
    const { cancel } = await TipModal.confirm('确定要还原选中的数据吗？')
    if (cancel) return TipModal.msg('操作取消')
    const ids = row ? row.id : multipleSelection.value.map((item) => item.id).join(',')
    await FileRequest.restore({ ids })
    await getList()
    emit('changed')
    TipModal.msgSuccess('还原成功')
    if (!row) tableRef.value?.clearSelection()
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('handleRestore errMsg: ', errMsg)
    return Promise.reject(error)
  }
}

/** 彻底删除（引用计数后清理磁盘物理文件） */
async function handleDeletePermanent(row?: File.Item) {
  try {
    const { cancel } = await TipModal.confirm('彻底删除后数据与对应物理文件不可恢复，确定继续吗？')
    if (cancel) return TipModal.msg('操作取消')
    const ids = row ? row.id : multipleSelection.value.map((item) => item.id).join(',')
    const message = await FileRequest.deletePermanent({ ids })
    await getList()
    emit('changed')
    TipModal.msgSuccess(message)
    if (!row) tableRef.value?.clearSelection()
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('handleDeletePermanent errMsg: ', errMsg)
    return Promise.reject(error)
  }
}

/** 清空回收站 */
async function handleClear() {
  try {
    const { cancel } = await TipModal.confirm('清空后回收站全部数据与对应物理文件均不可恢复，确定继续吗？')
    if (cancel) return TipModal.msg('操作取消')
    clearLoading.value = true
    const message = await FileRequest.clearRecycle()
    await getList()
    emit('changed')
    TipModal.msgSuccess(message)
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('handleClear errMsg: ', errMsg)
    return Promise.reject(error)
  } finally {
    clearLoading.value = false
  }
}

function open() {
  visible.value = true
  handleQuery()
}

defineExpose({ open })
</script>
