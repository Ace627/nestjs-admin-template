import { afterEach, describe, expect, it, vi } from 'vitest'
import { sha256Hex } from '@/utils/crypto'

/** 标准测试向量，用于校验两种实现结果一致 */
const SHA256_OF_EMPTY = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
const SHA256_OF_ABC = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
const SHA256_OF_FOX = 'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592'

function toBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text)
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('sha256Hex（crypto.subtle 可用）', () => {
  it('标准向量结果正确', async () => {
    await expect(sha256Hex(toBytes(''))).resolves.toBe(SHA256_OF_EMPTY)
    await expect(sha256Hex(toBytes('abc'))).resolves.toBe(SHA256_OF_ABC)
    await expect(sha256Hex(toBytes('The quick brown fox jumps over the lazy dog'))).resolves.toBe(SHA256_OF_FOX)
  })

  it('ArrayBufferView 只计算视图范围内的字节', async () => {
    const buffer = toBytes('xxabc').buffer
    const view = new Uint8Array(buffer, 2, 3)
    await expect(sha256Hex(view)).resolves.toBe(SHA256_OF_ABC)
  })
})

describe('sha256Hex（http 非安全上下文，crypto.subtle 不可用）', () => {
  it('纯 JS 兜底实现与标准向量一致', async () => {
    vi.stubGlobal('crypto', {})
    await expect(sha256Hex(toBytes(''))).resolves.toBe(SHA256_OF_EMPTY)
    await expect(sha256Hex(toBytes('abc'))).resolves.toBe(SHA256_OF_ABC)
    await expect(sha256Hex(toBytes('The quick brown fox jumps over the lazy dog'))).resolves.toBe(SHA256_OF_FOX)
  })
})

describe('sha256Hex 取消', () => {
  it('传入已中止的 signal 时抛 AbortError', async () => {
    const controller = new AbortController()
    controller.abort()
    await expect(sha256Hex(toBytes('abc'), controller.signal)).rejects.toMatchObject({ name: 'AbortError' })
  })
})
