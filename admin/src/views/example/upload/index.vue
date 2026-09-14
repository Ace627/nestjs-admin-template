<template>
  <div class="upload-page">
    <el-row :gutter="16" class="upload-page__grid">
      <el-col :xs="24" class="upload-page__col">
        <el-card class="upload-page__card">
          <template #header>
            <div class="upload-page__card-header">文件选择（拖拽或点击）</div>
          </template>
          <el-upload class="upload-page__upload" drag multiple :auto-upload="false" :show-file-list="false" @change="handleUploadChange">
            <SvgIcon name="Upload" class="upload-page__upload-icon" />
            <div class="upload-page__upload-text">将文件拖拽到此处或<span class="upload-page__upload-link">点击上传</span></div>
            <div class="upload-page__upload-hint">支持大文件分片上传、断点续传</div>
          </el-upload>
        </el-card>
      </el-col>

      <el-col :xs="24" class="upload-page__col" v-if="taskList.length > 0">
        <el-card class="upload-page__card">
          <template #header>
            <div class="upload-page__card-header">上传任务（{{ finishCount }} / {{ taskList.length }}）</div>
          </template>
          <div class="upload-page__task-list">
            <div v-for="task in taskList" :key="task.id" class="upload-page__task">
              <div class="upload-page__task-info">
                <div class="upload-page__task-name">
                  <SvgIcon name="Resource" class="upload-page__task-file-icon" />
                  <span class="upload-page__task-filename">{{ task.fileName }}</span>
                  <el-tag :type="statusTagType(task.status)" size="small">{{ statusText(task.status) }}</el-tag>
                </div>
                <div class="upload-page__task-meta">
                  <span class="upload-page__task-meta-item">大小：{{ formatSize(task.fileSize) }}</span>
                  <span class="upload-page__task-meta-item">分片：{{ task.totalChunks }} 个（每片 {{ formatSize(chunkSize) }}）</span>
                  <span class="upload-page__task-meta-item" v-if="task.hash">Hash：{{ task.hash.slice(0, 16) }}...</span>
                </div>
                <div class="upload-page__task-progress">
                  <el-progress :percentage="task.percent" :status="progressStatus(task.status)" :stroke-width="16" :text-inside="true" />
                </div>
              </div>
              <div class="upload-page__task-actions">
                <el-button v-if="task.status === 'paused' || task.status === 'pending'" type="primary" size="small" @click="startUpload(task)">
                  <template #icon><SvgIcon name="ArrowRight" /></template>
                  {{ task.status === 'paused' ? '继续' : '上传' }}
                </el-button>
                <el-button v-if="task.status === 'uploading'" type="warning" size="small" @click="pauseUpload(task)">
                  <template #icon><SvgIcon name="Minus" /></template>
                  暂停
                </el-button>
                <el-button v-if="task.status !== 'done' && task.status !== 'calculating' && task.status !== 'checking' && task.status !== 'merging'" type="danger" size="small" @click="cancelUpload(task)">
                  <template #icon><SvgIcon name="Delete" /></template>
                  取消
                </el-button>
                <el-button v-if="task.status === 'done'" type="success" size="small" disabled>
                  <template #icon><SvgIcon name="Check" /></template>
                  完成
                </el-button>
              </div>
            </div>
          </div>
          <div class="upload-page__batch-actions" v-if="hasActiveTask">
            <el-button type="primary" size="small" :disabled="!hasPausedTask" @click="resumeAll">全部继续</el-button>
            <el-button type="warning" size="small" :disabled="!hasUploadingTask" @click="pauseAll">全部暂停</el-button>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" class="upload-page__col">
        <el-card class="upload-page__card">
          <template #header>
            <div class="upload-page__card-header">技术说明</div>
          </template>
          <el-descriptions :column="appStore.isDesktop ? 2 : 1" border size="small">
            <el-descriptions-item label="文件选择">el-upload drag 拖拽区域</el-descriptions-item>
            <el-descriptions-item label="进度展示">el-progress 进度条组件</el-descriptions-item>
            <el-descriptions-item label="文件分片">File.slice 按 5MB 固定大小切割</el-descriptions-item>
            <el-descriptions-item label="并发上传">3 路并发 Promise.race 协程池</el-descriptions-item>
            <el-descriptions-item label="Hash 计算">Web Crypto SHA-256 硬件加速（Worker 线程）</el-descriptions-item>
            <el-descriptions-item label="秒传机制">checkFile 接口查询 Hash，已存在则跳过上传</el-descriptions-item>
            <el-descriptions-item label="断点续传">checkFile 返回 uploadedChunks，跳过已完成分片继续上传</el-descriptions-item>
            <el-descriptions-item label="合并分片">全部分片上传完毕后 mergeChunks 接口合并</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import type { UploadFile } from 'element-plus'
import HashWorker from './hash.worker?worker'
import { UploadRequest } from '@/api/common/upload.request'

const CHUNK_SIZE = 5 * 1024 * 1024
const CONCURRENCY = 3
const chunkSize = CHUNK_SIZE

type TaskStatus = 'pending' | 'calculating' | 'checking' | 'uploading' | 'merging' | 'paused' | 'done'

interface UploadTask {
  id: string
  file: File
  fileName: string
  fileSize: number
  totalChunks: number
  completedChunks: number
  percent: number
  status: TaskStatus
  hash: string
  chunkHashes: string[]
  doneChunkIndexes: Set<number>
  abortController: AbortController | null
}

const appStore = useAppStore()

const taskList = ref<UploadTask[]>([])

const finishCount = computed(() => taskList.value.filter((t) => t.status === 'done').length)
const hasActiveTask = computed(() => taskList.value.length > 0)
const hasPausedTask = computed(() => taskList.value.some((t) => t.status === 'paused'))
const hasUploadingTask = computed(() => taskList.value.some((t) => t.status === 'uploading'))

/** el-upload @change 回调，取到原生 File 后创建上传任务 */
function handleUploadChange(uploadFile: UploadFile) {
  if (uploadFile.raw) {
    addTasks([uploadFile.raw])
  }
}

/** 生成唯一任务 ID */
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/** 格式化字节大小为 B/KB/MB/GB */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

/** 任务状态 → 中文文本 */
function statusText(status: TaskStatus): string {
  const map: Record<TaskStatus, string> = {
    pending: '等待中',
    calculating: '计算 Hash',
    checking: '检查断点',
    uploading: '上传中',
    merging: '合并分片',
    paused: '已暂停',
    done: '已完成',
  }
  return map[status]
}

/** 任务状态 → el-tag type */
function statusTagType(status: TaskStatus): 'info' | 'warning' | 'success' | 'danger' | undefined {
  if (status === 'done') return 'success'
  if (status === 'calculating' || status === 'paused' || status === 'checking' || status === 'merging') return 'warning'
  if (status === 'pending') return 'info'
  return undefined
}

/** 任务状态 → el-progress status */
function progressStatus(status: TaskStatus): 'success' | 'exception' | 'warning' | undefined {
  if (status === 'done') return 'success'
  if (status === 'paused') return 'warning'
  return undefined
}

/** 批量创建上传任务 */
function addTasks(files: File[]) {
  for (const file of files) {
    const id = generateId()
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
    const task: UploadTask = {
      id,
      file,
      fileName: file.name,
      fileSize: file.size,
      totalChunks,
      completedChunks: 0,
      percent: 0,
      status: 'pending',
      hash: '',
      chunkHashes: [],
      doneChunkIndexes: new Set(),
      abortController: null,
    }
    taskList.value.push(task)
  }
}

/**
 * Web Worker 计算文件 Hash 与分片 Hash
 *
 * 主线程 FileReader.readAsArrayBuffer 逐片读取
 * → transfer ArrayBuffer 到 Worker
 * → Worker 内 crypto.subtle.digest('SHA-256') 硬件加速计算
 * → 全部完成后 postMessage 返回
 */
function computeAllHashes(task: UploadTask): Promise<{ fileHash: string; chunkHashes: string[] }> {
  return new Promise((resolve) => {
    const worker = new HashWorker()
    let currentChunk = 0

    worker.postMessage({ type: 'init', totalChunks: task.totalChunks })

    worker.onmessage = (e: MessageEvent<{ type: 'done'; fileHash: string; chunkHashes: string[] } | { type: 'error' }>) => {
      if (e.data.type === 'error') {
        resolve({ fileHash: '', chunkHashes: [] })
        worker.terminate()
        return
      }
      resolve({ fileHash: e.data.fileHash, chunkHashes: e.data.chunkHashes })
      worker.terminate()
    }

    function loadNext() {
      if (currentChunk >= task.totalChunks) return
      const start = currentChunk * CHUNK_SIZE
      const end = Math.min(start + CHUNK_SIZE, task.file.size)
      const reader = new FileReader()

      reader.onload = (e) => {
        worker.postMessage({ type: 'chunk', buffer: e.target!.result as ArrayBuffer, index: currentChunk }, [e.target!.result as ArrayBuffer])
        currentChunk++
        setTimeout(loadNext, 0)
      }

      reader.onerror = () => {
        resolve({ fileHash: '', chunkHashes: [] })
        worker.terminate()
      }

      reader.readAsArrayBuffer(task.file.slice(start, end))
    }

    loadNext()
  })
}

/** 构建 FormData 并发起单个分片上传请求 */
function uploadOneChunk(task: UploadTask, i: number) {
  const start = i * CHUNK_SIZE
  const end = Math.min(start + CHUNK_SIZE, task.file.size)
  const chunk = task.file.slice(start, end)
  const formData = new FormData()
  formData.append('file', chunk, task.fileName)
  formData.append('fileHash', task.hash)
  formData.append('chunkHash', task.chunkHashes[i] + '-' + i)
  return UploadRequest.uploadChunk(formData, { signal: task.abortController!.signal }).then(() => {})
}

/** 开始/继续上传：计算 Hash → 检查断点/秒传 → 跳过已完成分片 → 并发上传 → 合并 */
async function startUpload(task: UploadTask) {
  if (task.status === 'uploading') return

  if (!task.hash) {
    task.status = 'calculating'
    const { fileHash, chunkHashes } = await computeAllHashes(task)
    if (!fileHash) {
      task.status = 'pending'
      return
    }
    task.hash = fileHash
    task.chunkHashes = chunkHashes

    task.status = 'checking'
    const checkResult = await UploadRequest.checkFile({ fileHash })
    if (checkResult.isExist) {
      task.completedChunks = task.totalChunks
      task.percent = 100
      task.status = 'done'
      return
    }
    const uploadedSet = new Set(checkResult.uploadedChunks)
    chunkHashes.forEach((h, idx) => {
      if (uploadedSet.has(h + '-' + idx)) task.doneChunkIndexes.add(idx)
    })
    task.completedChunks = task.doneChunkIndexes.size
    task.percent = Math.round((task.completedChunks / task.totalChunks) * 100)
  }

  task.status = 'uploading'
  task.abortController = new AbortController()

  /** 分片上传协程池（CONCURRENCY 路并发） */
  const pending: number[] = []
  for (let i = 0; i < task.totalChunks; i++) {
    if (!task.doneChunkIndexes.has(i)) pending.push(i)
  }

  if (pending.length === 0) {
    task.status = 'merging'
    await UploadRequest.mergeChunks({ fileHash: task.hash, fileName: task.fileName })
    task.status = 'done'
    task.percent = 100
    return
  }

  const running = new Map<number, Promise<void>>()
  let nextIndex = 0

  while (nextIndex < pending.length || running.size > 0) {
    if (task.status !== 'uploading') return

    while (running.size < CONCURRENCY && nextIndex < pending.length) {
      const i = pending[nextIndex]
      nextIndex++
      running.set(i, uploadOneChunk(task, i))
    }

    const result = await Promise.race(
      Array.from(running.entries()).map(([idx, p]) =>
        p.then(
          () => ({ idx, ok: true as const }),
          (err) => ({ idx, ok: false as const, err }),
        ),
      ),
    )

    if (!result.ok) {
      if (result.err?.name === 'CanceledError' || result.err?.code === 'ERR_CANCELED') return
      task.status = 'paused'
      return
    }

    running.delete(result.idx)
    task.doneChunkIndexes.add(result.idx)
    task.completedChunks++
    task.percent = Math.round((task.completedChunks / task.totalChunks) * 100)
  }

  task.status = 'merging'
  await UploadRequest.mergeChunks({ fileHash: task.hash, fileName: task.fileName })

  task.status = 'done'
  task.percent = 100
}

/** 暂停上传（中断当前 HTTP 请求） */
function pauseUpload(task: UploadTask) {
  task.status = 'paused'
  task.abortController?.abort()
  task.abortController = null
}

/** 取消上传并清理后端分片 */
function cancelUpload(task: UploadTask) {
  task.abortController?.abort()
  task.abortController = null
  if (task.hash) {
    UploadRequest.clearChunk({ fileHash: task.hash }).catch(() => {})
  }
  const idx = taskList.value.findIndex((t) => t.id === task.id)
  if (idx !== -1) taskList.value.splice(idx, 1)
}

/** 批量继续所有暂停任务 */
function resumeAll() {
  taskList.value.filter((t) => t.status === 'paused').forEach(startUpload)
}

/** 批量暂停所有上传中任务 */
function pauseAll() {
  taskList.value.filter((t) => t.status === 'uploading').forEach(pauseUpload)
}
</script>

<style lang="scss" scoped>
.upload-page {
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

  &__upload {
    :deep(.el-upload) {
      display: block;
    }
    :deep(.el-upload-dragger) {
      padding: 48px 24px;
    }
  }

  &__upload-icon {
    width: 48px;
    height: 48px;
    color: var(--el-color-primary);
    margin-bottom: 16px;
  }

  &__upload-text {
    font-size: 16px;
    color: var(--el-text-color-regular);
    margin-bottom: 8px;
  }

  &__upload-link {
    color: var(--el-color-primary);
  }

  &__upload-hint {
    font-size: 13px;
    color: var(--el-text-color-placeholder);
  }

  &__task-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__task {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 16px;
    background: var(--el-fill-color-lighter);
    border-radius: 8px;
  }

  &__task-info {
    flex: 1;
    min-width: 0;
  }

  &__task-name {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  &__task-file-icon {
    width: 20px;
    height: 20px;
    color: var(--el-color-primary);
    flex-shrink: 0;
  }

  &__task-filename {
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__task-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 10px;
  }

  &__task-meta-item {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }

  &__task-progress {
    /* 强制内部文字永远垂直居中，不受高度影响！ */
    :deep(.el-progress-bar__innerText) {
      position: absolute;
      top: 50%;
      left: 0;
      width: 100%;
      transform: translateY(-50%);
      margin: 0;
      padding: 0 5px;
      font-size: 12px;
    }
  }

  &__task-actions {
    display: flex;
    flex-shrink: 0;
    gap: 8px;
    padding-top: 2px;
  }

  &__batch-actions {
    margin-top: 16px;
    padding: 12px 16px;
    background: var(--el-fill-color-lighter);
    border-radius: 8px;
    display: flex;
    gap: 8px;
  }
}

html[data-device='mobile'] {
  .upload-page {
    padding: 12px;

    &__col {
      margin-bottom: 12px;
    }

    &__upload {
      :deep(.el-upload-dragger) {
        padding: 32px 16px;
      }
    }

    &__upload-icon {
      width: 36px;
      height: 36px;
    }

    &__upload-text {
      font-size: 14px;
    }

    &__task {
      flex-direction: column;
    }

    &__task-actions {
      width: 100%;
      justify-content: flex-end;
    }

    &__batch-actions {
      flex-wrap: wrap;
    }
  }
}
</style>
