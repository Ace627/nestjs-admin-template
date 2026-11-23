<template>
  <el-dialog
    v-model="visible"
    title="上传文件"
    :close-on-click-modal="false"
    :show-close="!isUploading"
    :close-on-press-escape="!isUploading"
    :before-close="handleBeforeClose"
    width="640px"
  >
    <el-upload
      class="upload-trigger"
      drag
      multiple
      :auto-upload="false"
      :show-file-list="false"
      :disabled="isUploading"
      :on-change="handleFileChange"
    >
      <div class="flex flex-col items-center gap-8px py-16px">
        <SvgIcon name="Upload" class="text-32px color-[var(--el-color-primary)]" />
        <div class="text-14px">将文件拖到此处，或 <em>点击选择</em></div>
        <div class="text-12px color-[var(--el-text-color-secondary)]">≤10MB 直传；大文件自动分片上传，支持断点续传与秒传</div>
      </div>
    </el-upload>

    <div v-if="uploadItems.length" class="mt-12px max-h-320px overflow-auto">
      <div v-for="(item, index) in uploadItems" :key="index" class="mb-8px rounded-4px bg-[var(--el-fill-color-light)] p-8px">
        <div class="flex items-center justify-between gap-8px">
          <span class="truncate text-13px">{{ item.file.name }}</span>
          <el-tag :type="statusTagType(item.status)" size="small">{{ item.message }}</el-tag>
        </div>
        <el-progress
          v-if="item.status === 'hashing' || item.status === 'uploading'"
          class="mt-4px"
          :percentage="item.progress"
          :stroke-width="6"
          :show-text="false"
        />
      </div>
    </div>

    <template #footer>
      <el-button v-if="isUploading" :disabled="!canCancel" @click="handleCancel">取消上传</el-button>
      <el-button v-else @click="visible = false">关闭</el-button>
      <el-button type="primary" :loading="isUploading" :disabled="isUploading || !hasPending" @click="handleUpload">开始上传</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
defineOptions({ name: 'FileUploadDialog' })
import type { UploadFile, UploadRawFile } from 'element-plus'
import { TipModal } from '@/utils'
import { sha256Hex } from '@/utils/crypto'
import { UploadRequest } from '@/api/common/upload.request'
import { FileRequest } from '@/api/system/file.request'
import type { File as SysFile } from '@/types'

const SINGLE_LIMIT = 10 * 1024 * 1024
const CHUNK_SIZE = 5 * 1024 * 1024
const CHUNK_CONCURRENCY = 3

type UploadStatus = 'pending' | 'hashing' | 'uploading' | 'merging' | 'registering' | 'done' | 'error' | 'canceled'

/** 可（重新）发起上传的状态：取消过的文件允许再次点击开始上传 */
const UPLOADABLE_STATUSES: UploadStatus[] = ['pending', 'error', 'canceled']
/** 可中断的阶段：合并与登记不可中断，避免服务端留下半成品或未登记的物理文件 */
const CANCELABLE_STATUSES: UploadStatus[] = ['hashing', 'uploading']

interface UploadItem {
  file: UploadRawFile
  status: UploadStatus
  progress: number
  message: string
  /** 已算出的整体哈希：取消后清理分片、重试时复用（免二次全文件哈希） */
  fileHash?: string
}

const emit = defineEmits<{ success: [] }>()

const visible = ref(false)
const parentId = ref('0')
const uploadItems = ref<UploadItem[]>([])

const isUploading = ref(false)
/** 当前这一轮上传的取消控制器，null 表示没有进行中的上传 */
const abortController = ref<AbortController | null>(null)
/** 用户已点击取消：等上传循环收尾后统一清理分片，避免与在途分片写入竞争 */
const cancelRequested = ref(false)

const hasPending = computed(() => uploadItems.value.some((item) => UPLOADABLE_STATUSES.includes(item.status)))
const canCancel = computed(() => isUploading.value && uploadItems.value.some((item) => CANCELABLE_STATUSES.includes(item.status)))

const STATUS_TEXT: Record<UploadStatus, string> = {
  pending: '待上传',
  hashing: '计算哈希中',
  uploading: '上传中',
  merging: '合并中',
  registering: '登记中',
  done: '成功',
  error: '失败',
  canceled: '已取消',
}

function statusTagType(status: UploadStatus) {
  if (status === 'done') return 'success'
  if (status === 'error') return 'danger'
  if (status === 'pending' || status === 'canceled') return 'info'
  return 'warning'
}

/** 主动取消产生的错误：axios 取消为 CanceledError，哈希中断为 AbortError */
function isAbortError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  return error.name === 'CanceledError' || error.name === 'AbortError'
}

function open(folderId: string) {
  parentId.value = folderId
  uploadItems.value = []
  visible.value = true
}

/** 收集选择的文件（不去重、不自动上传） */
function handleFileChange(uploadFile: UploadFile) {
  uploadItems.value.push({ file: uploadFile.raw as UploadRawFile, status: 'pending', progress: 0, message: STATUS_TEXT.pending })
}

/** 顺序处理全部待上传文件；单文件失败不中断后续文件，主动取消则中止后续文件 */
async function handleUpload() {
  if (isUploading.value) return
  const controller = new AbortController()
  abortController.value = controller
  cancelRequested.value = false
  isUploading.value = true
  let successCount = 0
  try {
    for (const item of uploadItems.value) {
      if (!UPLOADABLE_STATUSES.includes(item.status)) continue
      if (controller.signal.aborted) {
        item.status = 'canceled'
        item.progress = 0
        item.message = STATUS_TEXT.canceled
        continue
      }
      try {
        await uploadOne(item, controller.signal)
        item.status = 'done'
        item.progress = 100
        item.message = STATUS_TEXT.done
        successCount += 1
      } catch (error: unknown) {
        if (isAbortError(error)) {
          item.status = 'canceled'
          item.progress = 0
          item.message = STATUS_TEXT.canceled
          continue
        }
        const errMsg = error instanceof Error ? error.message : String(error)
        item.status = 'error'
        item.progress = 0
        item.message = errMsg || '上传失败'
        console.log('handleUpload errMsg: ', errMsg)
      }
    }
    if (successCount) emit('success')
  } finally {
    isUploading.value = false
    abortController.value = null
  }
  if (cancelRequested.value) {
    cancelRequested.value = false
    await cleanupCanceledFiles()
    TipModal.msg(`已取消上传${successCount ? `，此前成功 ${successCount} 个文件` : ''}，相关分片已清理`)
  } else if (successCount) {
    TipModal.msgSuccess(`成功上传 ${successCount} 个文件`)
  }
}

/** 取消上传：只中断请求，分片与本地进度等上传循环收尾后统一清理 */
function handleCancel() {
  if (!canCancel.value) return
  cancelRequested.value = true
  abortController.value?.abort()
}

/** 清理被取消文件的服务端分片，并复位本地进度（已完成的文件不受影响） */
async function cleanupCanceledFiles() {
  const canceledItems = uploadItems.value.filter((item) => item.status !== 'done' && item.fileHash)
  for (const fileHash of new Set(canceledItems.map((item) => item.fileHash as string))) {
    await UploadRequest.clearChunk({ fileHash }).catch(() => undefined)
  }
  for (const item of canceledItems) item.progress = 0
}

/** 上传中禁止关闭弹窗：X 与 ESC 已禁用，这里兜底拦截其他关闭入口 */
function handleBeforeClose(done: () => void) {
  if (isUploading.value) {
    TipModal.msgWarning('文件正在上传，请先取消上传')
    return
  }
  done()
}

/** 单文件上传：哈希 → 秒传检查 → 直传/分片 → 合并 → 登记；合并与登记不可中断 */
async function uploadOne(item: UploadItem, signal: AbortSignal) {
  const { file } = item
  item.status = 'hashing'
  item.message = STATUS_TEXT.hashing
  const fileHash = await sha256Hex(await file.arrayBuffer(), signal)
  item.fileHash = fileHash
  const registerParams: SysFile.RegisterParams = { parentId: parentId.value, fileHash, fileName: file.name, fileSize: file.size, mimeType: file.type || undefined }

  item.status = 'uploading'
  item.message = STATUS_TEXT.uploading
  const check = await UploadRequest.checkFile({ fileHash, fileSize: file.size }, { signal })

  if (check.isExist) {
    item.message = '秒传命中'
  } else if (file.size <= SINGLE_LIMIT) {
    const formData = new FormData()
    formData.append('file', file)
    await UploadRequest.uploadFile(formData, { signal })
  } else {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
    await uploadByChunks(item, fileHash, check.uploadedChunks, signal)
    item.status = 'merging'
    item.message = STATUS_TEXT.merging
    await UploadRequest.mergeChunks({ fileHash, fileName: file.name, fileSize: file.size, totalChunks })
  }

  item.status = 'registering'
  item.message = STATUS_TEXT.registering
  await FileRequest.register(registerParams)
}

/** 分片上传：跳过已传分片（断点续传），并发 3；真实失败立即清理分片，主动取消交给收尾统一清理 */
async function uploadByChunks(item: UploadItem, fileHash: string, uploadedChunks: number[], signal: AbortSignal) {
  try {
    const uploadedIndexes = new Set(uploadedChunks)
    const totalChunks = Math.ceil(item.file.size / CHUNK_SIZE)
    const pendingIndexes = Array.from({ length: totalChunks }, (_, index) => index).filter((index) => !uploadedIndexes.has(index))
    let completedCount = totalChunks - pendingIndexes.length
    item.progress = Math.round((completedCount / totalChunks) * 100)

    let cursor = 0
    const workers = Array.from({ length: Math.min(CHUNK_CONCURRENCY, pendingIndexes.length) }, async () => {
      while (cursor < pendingIndexes.length) {
        if (signal.aborted) break
        const index = pendingIndexes[cursor++]
        const start = index * CHUNK_SIZE
        const formData = new FormData()
        formData.append('file', item.file.slice(start, Math.min(start + CHUNK_SIZE, item.file.size)))
        formData.append('fileHash', fileHash)
        formData.append('partNumber', `${index}`)
        await UploadRequest.uploadChunk(formData, { signal })
        completedCount += 1
        item.progress = Math.round((completedCount / totalChunks) * 100)
      }
    })
    await Promise.all(workers)
  } catch (error: unknown) {
    if (!isAbortError(error)) await UploadRequest.clearChunk({ fileHash }).catch(() => undefined)
    return Promise.reject(error)
  }
}

defineExpose({ open })
</script>
