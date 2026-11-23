/**
 * SHA-256 摘要工具
 * @description crypto.subtle 只在安全上下文（https / localhost）可用，生产环境为 http，
 * 此时 crypto.subtle 为 undefined，故内置纯 JS 实现兜底，保证两种环境下哈希结果一致
 */

/** SHA-256 轮常量 */
const SHA256_K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
])

/** 每处理 128KB（2048 个 64 字节块）让出一次事件循环，避免大文件哈希时页面卡死 */
const YIELD_BLOCK_INTERVAL = 2048

/**
 * 计算 SHA-256 并返回小写十六进制字符串
 * @description 优先使用浏览器原生 crypto.subtle（安全上下文），不可用时走纯 JS 实现
 * @param signal 传入后可中途放弃计算（抛 AbortError），用于取消上传
 */
export async function sha256Hex(source: ArrayBuffer | ArrayBufferView, signal?: AbortSignal): Promise<string> {
  const bytes = toUint8Array(source)
  throwIfAborted(signal)
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
    throwIfAborted(signal)
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
  }
  return sha256HexFallback(bytes, signal)
}

/** 统一抛出 AbortError，供调用方用 error.name 判定主动取消 */
function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException('上传已取消', 'AbortError')
}

/** 仅按视图实际范围取字节，避免把 ArrayBuffer 的其余内容算进摘要 */
function toUint8Array(source: ArrayBuffer | ArrayBufferView): Uint8Array<ArrayBuffer> {
  if (ArrayBuffer.isView(source)) return new Uint8Array(source.buffer as ArrayBuffer, source.byteOffset, source.byteLength)
  return new Uint8Array(source)
}

/** 纯 JS SHA-256：分块计算并在长任务中主动让出主线程 */
async function sha256HexFallback(bytes: Uint8Array, signal?: AbortSignal): Promise<string> {
  const state = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19])
  const schedule = new Uint32Array(64)
  const fullBlockCount = Math.floor(bytes.length / 64)

  for (let blockIndex = 0; blockIndex < fullBlockCount; blockIndex += 1) {
    processBlock(state, bytes, blockIndex * 64, schedule)
    if ((blockIndex + 1) % YIELD_BLOCK_INTERVAL === 0) {
      await yieldToEventLoop()
      throwIfAborted(signal)
    }
  }

  /** 尾部补位：追加 0x80、若干 0x00，最后 8 字节写入原始 bit 长度 */
  const remainderLength = bytes.length - fullBlockCount * 64
  const tail = new Uint8Array(remainderLength < 56 ? 64 : 128)
  tail.set(bytes.subarray(fullBlockCount * 64))
  tail[remainderLength] = 0x80
  const tailView = new DataView(tail.buffer)
  tailView.setUint32(tail.length - 8, Math.floor(bytes.length / 0x20000000))
  tailView.setUint32(tail.length - 4, (bytes.length * 8) >>> 0)
  for (let offset = 0; offset < tail.length; offset += 64) {
    processBlock(state, tail, offset, schedule)
  }

  return Array.from(state, (word) => (word >>> 0).toString(16).padStart(8, '0')).join('')
}

/** 处理一个 64 字节块，原地更新 state */
function processBlock(state: Uint32Array, bytes: Uint8Array, offset: number, schedule: Uint32Array): void {
  for (let index = 0; index < 16; index += 1) {
    const start = offset + index * 4
    schedule[index] = (bytes[start] << 24) | (bytes[start + 1] << 16) | (bytes[start + 2] << 8) | bytes[start + 3]
  }
  for (let index = 16; index < 64; index += 1) {
    const previous = schedule[index - 15]
    const recent = schedule[index - 2]
    const sigma0 = ((previous >>> 7) | (previous << 25)) ^ ((previous >>> 18) | (previous << 14)) ^ (previous >>> 3)
    const sigma1 = ((recent >>> 17) | (recent << 15)) ^ ((recent >>> 19) | (recent << 13)) ^ (recent >>> 10)
    schedule[index] = (schedule[index - 16] + sigma0 + schedule[index - 7] + sigma1) | 0
  }

  let a = state[0]
  let b = state[1]
  let c = state[2]
  let d = state[3]
  let e = state[4]
  let f = state[5]
  let g = state[6]
  let h = state[7]

  for (let index = 0; index < 64; index += 1) {
    const sum1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7))
    const choose = (e & f) ^ (~e & g)
    const temp1 = (h + sum1 + choose + SHA256_K[index] + schedule[index]) | 0
    const sum0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10))
    const majority = (a & b) ^ (a & c) ^ (b & c)
    const temp2 = (sum0 + majority) | 0
    h = g
    g = f
    f = e
    e = (d + temp1) | 0
    d = c
    c = b
    b = a
    a = (temp1 + temp2) | 0
  }

  state[0] = (state[0] + a) | 0
  state[1] = (state[1] + b) | 0
  state[2] = (state[2] + c) | 0
  state[3] = (state[3] + d) | 0
  state[4] = (state[4] + e) | 0
  state[5] = (state[5] + f) | 0
  state[6] = (state[6] + g) | 0
  state[7] = (state[7] + h) | 0
}

function yieldToEventLoop(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}
