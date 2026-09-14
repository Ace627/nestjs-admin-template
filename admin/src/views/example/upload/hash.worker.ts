/**
 * 浏览器原生 SHA-256 计算（最终正确版）
 * 100% 对齐后端 createSha256(文件二进制)
 * 无 createHash / update，只用标准 digest API
 */
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

// ArrayBuffer → Hex（和后端digest(hex)一致）
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// 拼接所有分片二进制 → 完整文件Buffer
function concatBuffers(buffers: ArrayBuffer[]): ArrayBuffer {
  let totalLength = 0
  buffers.forEach((buf) => (totalLength += buf.byteLength))

  const result = new Uint8Array(totalLength)
  let offset = 0
  buffers.forEach((buf) => {
    result.set(new Uint8Array(buf), offset)
    offset += buf.byteLength
  })
  return result.buffer
}

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const msg = e.data

  // 初始化
  if (msg.type === 'init') {
    totalChunks = msg.totalChunks
    receivedChunks = 0
    chunkBufferMap.clear()
    chunkHashMap.clear()
    return
  }

  // 接收分片
  if (msg.type === 'chunk') {
    const { index, buffer } = msg

    // 1. 计算当前分片的 SHA256（给后端存分片用）
    const chunkHash = bufferToHex(await crypto.subtle.digest('SHA-256', buffer))
    chunkHashMap.set(index, chunkHash)
    // 2. 保存分片原始二进制（最后算完整文件Hash用）
    chunkBufferMap.set(index, buffer)

    receivedChunks++

    // 全部收齐 → 计算最终文件Hash
    if (receivedChunks === totalChunks) {
      // 按顺序排序分片
      const indexes = Array.from(chunkBufferMap.keys()).sort((a, b) => a - b)
      const sortedBuffers = indexes.map((i) => chunkBufferMap.get(i)!)
      const sortedChunkHashes = indexes.map((i) => chunkHashMap.get(i)!)

      // 🔥 核心：拼接完整文件二进制 → 算SHA256（和后端完全一致）
      const fullFileBuffer = concatBuffers(sortedBuffers)
      const fileHash = bufferToHex(await crypto.subtle.digest('SHA-256', fullFileBuffer))

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
