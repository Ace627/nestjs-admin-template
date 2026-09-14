<template>
  <el-dialog v-model="visible" title="上传文件" :close-on-click-modal="false" width="640px">
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
      <el-button @click="visible = false">关闭</el-button>
      <el-button type="primary" :loading="isUploading" :disabled="!hasPending" @click="handleUpload">开始上传</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { UploadFile, UploadRawFile } from 'element-plus'
import { TipModal } from '@/utils'
import { UploadRequest } from '@/api/common/upload.request'
import { FileRequest } from '@/api/system/file.request'
import type { File as SysFile } from '@/types'

defineOptions({ name: 'FileUploadDialog' })

const SINGLE_LIMIT = 10 * 1024 * 1024
const CHUNK_SIZE = 5 * 1024 * 1024
const CHUNK_CONCURRENCY = 3

type UploadStatus = 'pending' | 'hashing' | 'uploading' | 'merging' | 'registering' | 'done' | 'error'

interface UploadItem {
  file: UploadRawFile
  status: UploadStatus
  progress: number
  message: string
}

const emit = defineEmits<{ success: [] }>()

const visible = ref(false)
const parentId = ref('0')
const uploadItems = ref<UploadItem[]>([])

const isUploading = ref(false)
const hasPending = computed(() => uploadItems.value.some((item) => ['pending', 'error'].includes(item.status)))

const STATUS_TEXT: Record<UploadStatus, string> = {
  pending: '待上传',
  hashing: '计算哈希中',
  uploading: '上传中',
  merging: '合并中',
  registering: '登记中',
  done: '成功',
  error: '失败',
}

function statusTagType(status: UploadStatus) {
  if (status === 'done') return 'success'
  if (status === 'error') return 'danger'
  if (status === 'pending') return 'info'
  return 'warning'
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

/** 计算文件整体 SHA-256（秒传与断点续传的锚点） */
async function computeSha256(file: UploadRawFile): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

/** 顺序处理全部待上传文件；单文件失败不中断后续文件 */
async function handleUpload() {
  if (isUploading.value) return
  isUploading.value = true
  let successCount = 0
  try {
    for (const item of uploadItems.value) {
      if (!['pending', 'error'].includes(item.status)) continue
      try {
        await uploadOne(item)
        item.status = 'done'
        item.progress = 100
        item.message = STATUS_TEXT.done
        successCount += 1
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error)
        item.status = 'error'
        item.progress = 0
        item.message = errMsg || '上传失败'
        console.log('handleUpload errMsg: ', errMsg)
      }
    }
    if (successCount) {
      emit('success')
      TipModal.msgSuccess(`成功上传 ${successCount} 个文件`)
    }
  } finally {
    isUploading.value = false
  }
}

/** 单文件上传：哈希 → 秒传检查 → 直传/分片 → 合并 → 登记 */
async function uploadOne(item: UploadItem) {
  const { file } = item
  item.status = 'hashing'
  item.message = STATUS_TEXT.hashing
  const fileHash = await computeSha256(file)
  const registerParams: SysFile.RegisterParams = { parentId: parentId.value, fileHash, fileName: file.name, fileSize: file.size, mimeType: file.type || undefined }

  item.status = 'uploading'
  item.message = STATUS_TEXT.uploading
  const check = await UploadRequest.checkFile({ fileHash })

  if (check.isExist) {
    item.message = '秒传命中'
  } else if (file.size <= SINGLE_LIMIT) {
    const formData = new FormData()
    formData.append('file', file)
    await UploadRequest.uploadFile(formData)
  } else {
    await uploadByChunks(item, fileHash, check.uploadedChunks)
    item.status = 'merging'
    item.message = STATUS_TEXT.merging
    await UploadRequest.mergeChunks({ fileHash, fileName: file.name })
  }

  item.status = 'registering'
  item.message = STATUS_TEXT.registering
  await FileRequest.register(registerParams)
}

/** 分片上传：跳过已传分片（断点续传），并发 3，失败清理临时分片 */
async function uploadByChunks(item: UploadItem, fileHash: string, uploadedChunks: string[]) {
  try {
    const uploadedIndexes = new Set(uploadedChunks.map((name) => Number.parseInt(name.split('-')[0], 10)))
    const totalChunks = Math.ceil(item.file.size / CHUNK_SIZE)
    const pendingIndexes = Array.from({ length: totalChunks }, (_, index) => index).filter((index) => !uploadedIndexes.has(index))
    let completedCount = totalChunks - pendingIndexes.length
    item.progress = Math.round((completedCount / totalChunks) * 100)

    let cursor = 0
    const workers = Array.from({ length: Math.min(CHUNK_CONCURRENCY, pendingIndexes.length) }, async () => {
      while (cursor < pendingIndexes.length) {
        const index = pendingIndexes[cursor++]
        const start = index * CHUNK_SIZE
        const formData = new FormData()
        formData.append('file', item.file.slice(start, Math.min(start + CHUNK_SIZE, item.file.size)))
        formData.append('fileHash', fileHash)
        formData.append('chunkHash', `${index}`)
        await UploadRequest.uploadChunk(formData)
        completedCount += 1
        item.progress = Math.round((completedCount / totalChunks) * 100)
      }
    })
    await Promise.all(workers)
  } catch (error: unknown) {
    await UploadRequest.clearChunk({ fileHash }).catch(() => undefined)
    return Promise.reject(error)
  }
}

defineExpose({ open })
</script>
