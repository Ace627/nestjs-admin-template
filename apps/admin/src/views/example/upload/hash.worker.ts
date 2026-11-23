/**
 * 文件 SHA-256 计算 Worker
 * @description 统一走 @/utils/crypto，兼容 http 等非安全上下文（crypto.subtle 不可用）
 */
import { sha256Hex } from '@/utils/crypto'

interface WorkerInit {
  type: 'init'
  totalChunks: number
}

type WorkerMessage =
  | WorkerInit
  | {
      type: 'chunk'
      index: number
      buffer: ArrayBuffer
    }

interface WorkerResponse {
  type: 'done'
  fileHash: string
  chunkHashes: string[]
}

// 状态：按顺序存储所有分片二进制 + 哈希
let totalChunks = 0
let receivedChunks = 0
const chunkBufferMap = new Map<number, ArrayBuffer>() // 按index存原始二进制
const chunkHashMap = new Map<number, string>()

// 拼接所有分片二进制 → 完整文件Buffer
function concatBuffers(buffers: ArrayBuffer[]): ArrayBuffer {
  let totalLength = 0
  buffers.forEach((buffer) => (totalLength += buffer.byteLength))

  const result = new Uint8Array(totalLength)
  let offset = 0
  buffers.forEach((buffer) => {
    result.set(new Uint8Array(buffer), offset)
    offset += buffer.byteLength
  })
  return result.buffer
}

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const message = event.data

  // 初始化
  if (message.type === 'init') {
    totalChunks = message.totalChunks
    receivedChunks = 0
    chunkBufferMap.clear()
    chunkHashMap.clear()
    return
  }

  // 接收分片
  if (message.type === 'chunk') {
    const { index, buffer } = message

    // 1. 计算当前分片的 SHA256（给后端存分片用）
    const chunkHash = await sha256Hex(buffer)
    chunkHashMap.set(index, chunkHash)
    // 2. 保存分片原始二进制（最后算完整文件Hash用）
    chunkBufferMap.set(index, buffer)

    receivedChunks++

    // 全部收齐 → 计算最终文件Hash
    if (receivedChunks === totalChunks) {
      // 按顺序排序分片
      const indexes = Array.from(chunkBufferMap.keys()).sort((a, b) => a - b)
      const sortedBuffers = indexes.map((index) => chunkBufferMap.get(index)!)
      const sortedChunkHashes = indexes.map((index) => chunkHashMap.get(index)!)

      // 🔥 核心：拼接完整文件二进制 → 算SHA256（和后端完全一致）
      const fullFileBuffer = concatBuffers(sortedBuffers)
      const fileHash = await sha256Hex(fullFileBuffer)

      // 返回结果
      self.postMessage({
        type: 'done',
        fileHash,
        chunkHashes: sortedChunkHashes,
      } as WorkerResponse)
    }
  }
}

// 异常兜底
self.onerror = () => self.postMessage({ type: 'error' })
