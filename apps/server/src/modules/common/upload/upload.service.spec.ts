import { mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createSha256 } from '@/utils'
import { afterEach, describe, expect, it } from 'vitest'
import { UploadService } from './upload.service'

/** 每个用例独立的上传根目录，避免相互干扰 */
let workDir = ''

function createService(): UploadService {
  workDir = mkdtempSync(join(tmpdir(), 'upload-service-'))
  const service = new UploadService()
  Object.assign(service, { UPLOAD_DIR_PATH: workDir })
  return service
}

/** 构造 Multer 文件桩：字段与 Multer.File 结构对齐，service 实际只用到 buffer 与 size */
function toChunkFile(content: Buffer): ExpressMulterFile {
  return { fieldname: 'file', originalname: 'chunk', encoding: '7bit', mimetype: 'application/octet-stream', buffer: content, size: content.length } as ExpressMulterFile
}

/** 按 partCount 均分内容并上传前 uploadedCount 个分片 */
async function uploadParts(service: UploadService, fileHash: string, content: Buffer, partCount: number, uploadedCount = partCount): Promise<void> {
  const chunkSize = Math.ceil(content.length / partCount)
  for (let partNumber = 0; partNumber < uploadedCount; partNumber += 1) {
    const chunk = content.subarray(partNumber * chunkSize, (partNumber + 1) * chunkSize)
    await service.uploadChunk([toChunkFile(chunk)], { fileHash, partNumber })
  }
}

afterEach(() => {
  if (workDir) rmSync(workDir, { recursive: true, force: true })
  workDir = ''
})

describe('UploadService.mergeChunk', () => {
  it('按序合并分片，内容与哈希一致，并清理临时目录', async () => {
    const service = createService()
    const content = Buffer.from('0123456789abcdef')
    const fileHash = createSha256(content)
    await uploadParts(service, fileHash, content, 4)

    await expect(service.mergeChunk({ fileHash, fileName: 'demo.bin', fileSize: content.length, totalChunks: 4 })).resolves.toBe('文件合并成功')
    expect(readFileSync(join(workDir, `${fileHash}.bin`)).equals(content)).toBe(true)
    expect(existsSync(join(workDir, '.chunks', fileHash))).toBe(false)
  })

  it('重复合并幂等返回成功，不抛异常', async () => {
    const service = createService()
    const content = Buffer.from('abcdefgh')
    const fileHash = createSha256(content)
    await uploadParts(service, fileHash, content, 2)

    await service.mergeChunk({ fileHash, fileName: 'demo.bin', fileSize: content.length, totalChunks: 2 })
    await expect(service.mergeChunk({ fileHash, fileName: 'demo.bin', fileSize: content.length, totalChunks: 2 })).resolves.toBe('文件合并成功')
  })

  it('缺片时拒绝合并并提示缺失序号', async () => {
    const service = createService()
    const content = Buffer.from('0123456789abcdef')
    const fileHash = createSha256(content)
    await uploadParts(service, fileHash, content, 4, 3)

    await expect(service.mergeChunk({ fileHash, fileName: 'demo.bin', fileSize: content.length, totalChunks: 4 })).rejects.toThrow('分片不完整，缺少第 3 片')
  })

  it('内容与哈希不一致时拒绝合并且不留下最终文件', async () => {
    const service = createService()
    const content = Buffer.from('0123456789abcdef')
    const wrongHash = createSha256(Buffer.from('another-content'))
    await uploadParts(service, wrongHash, content, 4)

    await expect(service.mergeChunk({ fileHash: wrongHash, fileName: 'demo.bin', fileSize: content.length, totalChunks: 4 })).rejects.toThrow('文件校验失败')
    expect(existsSync(join(workDir, `${wrongHash}.bin`))).toBe(false)
  })

  it('分片总大小与声明大小不一致时拒绝合并', async () => {
    const service = createService()
    const content = Buffer.from('0123456789abcdef')
    const fileHash = createSha256(content)
    await uploadParts(service, fileHash, content, 4)

    await expect(service.mergeChunk({ fileHash, fileName: 'demo.bin', fileSize: content.length + 1, totalChunks: 4 })).rejects.toThrow('分片总大小与文件大小不一致')
  })

  it('分片目录不存在时提示重新上传', async () => {
    const service = createService()
    await expect(service.mergeChunk({ fileHash: 'a'.repeat(64), fileName: 'demo.bin', fileSize: 4, totalChunks: 1 })).rejects.toThrow('分片文件不存在，请重新上传')
  })
})

describe('UploadService.checkFile', () => {
  it('未完成时返回已上传分片序号', async () => {
    const service = createService()
    const content = Buffer.from('0123456789abcdef')
    const fileHash = createSha256(content)
    await uploadParts(service, fileHash, content, 4, 2)

    await expect(service.checkFile({ fileHash, fileSize: content.length })).resolves.toEqual({ isExist: false, uploadedChunks: [0, 1] })
  })

  it('合并完成后判定秒传', async () => {
    const service = createService()
    const content = Buffer.from('0123456789abcdef')
    const fileHash = createSha256(content)
    await uploadParts(service, fileHash, content, 4)
    await service.mergeChunk({ fileHash, fileName: 'demo.bin', fileSize: content.length, totalChunks: 4 })

    await expect(service.checkFile({ fileHash, fileSize: content.length })).resolves.toEqual({ isExist: true, uploadedChunks: [] })
  })

  it('文件存在但大小不符时不判定秒传', async () => {
    const service = createService()
    const content = Buffer.from('0123456789abcdef')
    const fileHash = createSha256(content)
    await uploadParts(service, fileHash, content, 4)
    await service.mergeChunk({ fileHash, fileName: 'demo.bin', fileSize: content.length, totalChunks: 4 })

    const result = await service.checkFile({ fileHash, fileSize: content.length + 1 })
    expect(result.isExist).toBe(false)
  })
})

describe('UploadService 无扩展名文件', () => {
  it('分片存放在 .chunks 子目录，不占用最终文件名', async () => {
    const service = createService()
    const content = Buffer.from('extensionless')
    const fileHash = createSha256(content)
    await uploadParts(service, fileHash, content, 2, 1)

    expect(existsSync(join(workDir, '.chunks', fileHash))).toBe(true)
    expect(existsSync(join(workDir, fileHash))).toBe(false)
  })

  it('合并成功，最终文件与分片目录不再同名冲突', async () => {
    const service = createService()
    const content = Buffer.from('extensionless')
    const fileHash = createSha256(content)
    await uploadParts(service, fileHash, content, 2)

    await expect(service.mergeChunk({ fileHash, fileName: 'demo', fileSize: content.length, totalChunks: 2 })).resolves.toBe('文件合并成功')
    expect(readFileSync(join(workDir, fileHash)).equals(content)).toBe(true)
    expect(existsSync(join(workDir, '.chunks', fileHash))).toBe(false)
  })

  it('合并后秒传判定生效', async () => {
    const service = createService()
    const content = Buffer.from('extensionless')
    const fileHash = createSha256(content)
    await uploadParts(service, fileHash, content, 2)
    await service.mergeChunk({ fileHash, fileName: 'demo', fileSize: content.length, totalChunks: 2 })

    await expect(service.checkFile({ fileHash, fileSize: content.length })).resolves.toEqual({ isExist: true, uploadedChunks: [] })
  })
})

describe('UploadService 路径安全', () => {
  it('拒绝逃逸上传根目录的 fileHash', async () => {
    const service = createService()
    await expect(service.clearChunk({ fileHash: '../../etc' })).rejects.toThrow('非法的文件路径')
  })

  it('正常清理分片目录', async () => {
    const service = createService()
    const content = Buffer.from('0123456789abcdef')
    const fileHash = createSha256(content)
    await uploadParts(service, fileHash, content, 4, 1)

    await expect(service.clearChunk({ fileHash })).resolves.toBe('分片目录已成功清理')
    expect(existsSync(join(workDir, '.chunks', fileHash))).toBe(false)
  })
})
