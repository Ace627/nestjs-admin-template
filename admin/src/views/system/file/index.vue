<template>
  <div class="app-content flex h-full gap-16px" :class="{ 'flex-col': appStore.isMobile }">
    <!-- 左侧目录树 -->
    <el-card shadow="never" class="folder-tree-card w-250px shrink-0" :class="{ 'is-mobile': appStore.isMobile }" body-class="h-full">
      <FolderTree ref="folderTreeRef" @node-click="handleFolderClick" @create="handleFolderCreate" @rename="handleFolderRename" @remove="handleFolderRemove" />
    </el-card>

    <!-- 右侧文件列表 -->
    <div class="flex flex-col flex-1 min-w-0">
      <ProSearch v-permissions="['system:file:query']" :items v-model="queryParams" @query="handleQuery" @reset="resetQuery" />

      <div class="mb-16px">
        <el-button v-permissions="['system:file:create']" plain type="primary" @click="handleUpload">
          <template #icon><SvgIcon name="Upload" /></template><span>上传文件</span>
        </el-button>
        <el-button v-permissions="['system:file:delete']" plain type="danger" @click="handleDelete()" :disabled="!isMultiple">
          <template #icon><SvgIcon name="Delete" /></template><span>批量删除</span>
        </el-button>
        <el-button v-permissions="['system:file:recycle']" plain type="warning" @click="handleOpenRecycle">
          <template #icon><SvgIcon name="Clear" /></template><span>回收站</span>
        </el-button>
      </div>

      <ProTable ref="tableRef" v-loading="loading" :data="list" :columns="columns" @selection-change="handleSelectionChange">
        <template #fileName="{ row }">
          <div class="flex items-center justify-center gap-4px">
            <SvgIcon :name="row.fileType === FILE_TYPE.FOLDER ? 'Resource' : 'Markdown'" class="shrink-0" />
            <span v-if="row.fileType === FILE_TYPE.FOLDER" class="cursor-pointer" @click="handleEnterFolder(row)">{{ row.fileName }}</span>
            <span v-else class="cursor-pointer" @click="handleDownload(row)">{{ row.fileName }}</span>
          </div>
        </template>
        <template #fileType="{ row }">
          <el-tag :type="row.fileType === FILE_TYPE.FOLDER ? 'warning' : 'info'" size="small">
            {{ row.fileType === FILE_TYPE.FOLDER ? '目录' : '文件' }}
          </el-tag>
        </template>
        <template #fileSize="{ row }">{{ formatFileSize(row.fileSize) }}</template>
        <template #action="{ row }">
          <el-link v-if="row.fileType === FILE_TYPE.FILE" type="primary" @click="handleDownload(row)">下载</el-link>
          <el-link v-else type="primary" @click="handleEnterFolder(row)">进入</el-link>
          <el-link v-permissions="['system:file:delete']" type="primary" @click="handleDelete(row)">删除</el-link>
        </template>
      </ProTable>

      <ProPagination :total v-model:page="queryParams.pageNo" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </div>

    <FolderDialog ref="folderDialogRef" @success="handleFolderChanged" />
    <FileUploadDialog ref="fileUploadDialogRef" @success="getList" />
    <RecycleDrawer ref="recycleDrawerRef" @changed="handleRecycleChanged" />
  </div>
</template>

<script setup lang="ts">
import { TipModal } from '@/utils'
import { FILE_TYPE } from '@/types/api/system/file'
import FolderTree from './components/FolderTree.vue'
import { FileRequest } from '@/api/system/file.request'
import FolderDialog from './components/FolderDialog.vue'
import RecycleDrawer from './components/RecycleDrawer.vue'
import { formatFileSize, linkDownload } from '@/utils/file'
import FileUploadDialog from './components/FileUploadDialog.vue'
import type { File, ProSearchItem, ProTableColumn } from '@/types'

const list = ref<File.Item[]>([])
const multipleSelection = ref<File.Item[]>([])
const total = ref(0)
const loading = ref(true)
const isMultiple = computed(() => multipleSelection.value.length > 0)
const tableRef = useTemplateRef('tableRef')
const folderTreeRef = useTemplateRef('folderTreeRef')
const folderDialogRef = useTemplateRef('folderDialogRef')
const fileUploadDialogRef = useTemplateRef('fileUploadDialogRef')
const recycleDrawerRef = useTemplateRef('recycleDrawerRef')
const queryParams = ref<File.Query>({ pageNo: 1, pageSize: 10, parentId: '0' })
const appStore = useAppStore()

const items = computed<ProSearchItem[]>(() => [{ type: 'input', prop: 'fileName', label: '文件名称' }])

const columns: ProTableColumn<File.Item>[] = [
  { align: 'center', type: 'selection' },
  { align: 'center', type: 'index', label: '序号', width: 64 },
  { align: 'center', prop: 'fileName', label: '名称', slot: 'fileName', showOverflowTooltip: true, minWidth: 220 },
  { align: 'center', prop: 'fileType', label: '类型', slot: 'fileType', width: 90 },
  { align: 'center', prop: 'fileSize', label: '大小', slot: 'fileSize', width: 110 },
  { align: 'center', prop: 'createBy', label: '创建人', width: 120 },
  { align: 'center', prop: 'createTime', label: '创建时间', minWidth: 170 },
  { align: 'center', slot: 'action', label: '操作', fixed: 'right', width: 130 },
]

async function getList() {
  try {
    loading.value = true
    const data = await FileRequest.findList(queryParams.value)
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

function handleSelectionChange(rows: File.Item[]) {
  multipleSelection.value = rows
}

function handleQuery() {
  if (loading.value) return TipModal.msgWarning('正在查询中，请勿重复操作')
  queryParams.value.pageNo = 1
  multipleSelection.value = []
  tableRef.value?.clearSelection()
  getList()
}

function resetQuery() {
  handleQuery()
}

/** 点击目录树节点：切换当前目录；点击根节点查全部根级内容 */
function handleFolderClick(folderId: string) {
  queryParams.value.parentId = folderId
  handleQuery()
}

/** 从列表进入子目录（左树选中项同步高亮） */
function handleEnterFolder(row: File.Item) {
  folderTreeRef.value?.setSelected(row.id)
  handleFolderClick(row.id)
}

/** 目录新建/重命名入口（rename 由树节点触发） */
function handleFolderCreate(parentId: string) {
  folderDialogRef.value?.open('create', parentId)
}

function handleFolderRename(node: File.TreeItem) {
  folderDialogRef.value?.open('rename', undefined, node)
}

/** 删除目录（后端级联软删子孙） */
async function handleFolderRemove(node: File.TreeItem) {
  try {
    const { cancel } = await TipModal.confirm(`确定要删除目录「${node.fileName}」吗？目录下全部内容将移入回收站`)
    if (cancel) return TipModal.msg('操作取消')
    await FileRequest.delete({ ids: node.id })
    await folderTreeRef.value?.getTree()
    // 当前目录被删时退回根目录
    if (queryParams.value.parentId === node.id) {
      folderTreeRef.value?.clearSelected()
      queryParams.value.parentId = '0'
    }
    await getList()
    TipModal.msgSuccess('删除成功，已移入回收站')
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('handleFolderRemove errMsg: ', errMsg)
    return Promise.reject(error)
  }
}

/** 目录新建/重命名成功后刷新树；新建后切到目标目录会由用户自行点击 */
function handleFolderChanged() {
  folderTreeRef.value?.getTree()
}

/** 删除文件/目录（软删进入回收站） */
async function handleDelete(row?: File.Item) {
  try {
    const { cancel } = await TipModal.confirm('确定要删除选中的数据吗？删除后可在回收站还原')
    if (cancel) return TipModal.msg('操作取消')
    const ids = row ? row.id : multipleSelection.value.map((item) => item.id).join(',')
    await FileRequest.delete({ ids })
    if (list.value.length <= 1) queryParams.value.pageNo = queryParams.value.pageNo > 1 ? queryParams.value.pageNo - 1 : 1
    await getList()
    folderTreeRef.value?.getTree()
    TipModal.msgSuccess('删除成功，已移入回收站')
    if (!row) {
      multipleSelection.value = []
      tableRef.value?.clearSelection()
    }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('handleDelete errMsg: ', errMsg)
    return Promise.reject(error)
  }
}

/** 文件下载（流式接口，保留原始文件名） */
async function handleDownload(row: File.Item) {
  try {
    const response = await FileRequest.download({ id: row.id })
    linkDownload(response.data, row.fileName)
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('handleDownload errMsg: ', errMsg)
    return Promise.reject(error)
  }
}

function handleUpload() {
  fileUploadDialogRef.value?.open(queryParams.value.parentId ?? '0')
}

function handleOpenRecycle() {
  recycleDrawerRef.value?.open()
}

/** 回收站还原后可能影响当前列表与目录树 */
function handleRecycleChanged() {
  folderTreeRef.value?.getTree()
  getList()
}

onMounted(getList)
</script>

<style lang="scss" scoped>
.folder-tree-card {
  display: flex;
  flex-direction: column;
  :deep(.el-card__body) {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
  &.is-mobile {
    width: 100%;
    max-height: 240px;
  }
}
</style>
