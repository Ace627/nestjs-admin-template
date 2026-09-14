import { createSha256 } from '@/utils'
import type { RmOptions } from 'node:fs'
import { Injectable } from '@nestjs/common'
import { extname, resolve } from 'node:path'
import { BusinessException } from '@/common'
import { pipeline } from 'node:stream/promises'
import { CheckFileDto, ClearChunkDto, MergeChunkDto, UploadChunkDto } from './upload.dto'
import { existsSync, mkdirSync, writeFileSync, rmSync, readdirSync, createReadStream, createWriteStream } from 'node:fs'

@Injectable()
export class UploadService {
  /** 文件上传根目录，默认为项目根目录下的 `uploads` 文件夹 */
  private readonly UPLOAD_DIR_PATH = resolve(process.cwd(), 'uploads')

  /** 单文件上传（≤10MB 直接上传，>10MB 拒绝并提示分片） */
  public async uploadFile(file: ExpressMulterFile) {
    // 限制文件最大 10MB，超出提示分片上传
    if (file.size > 10 * 1024 * 1024) throw new BusinessException('文件大于10MB，请使用分片上传')
    // 处理中文乱码并获取后缀
    const ext = extname(Buffer.from(file.originalname, 'latin1').toString('utf8'))
    /** 根据文件内容生成唯一 SHA-256 文件名 */
    const filename = `${createSha256(file.buffer)}${ext}`
    // 生成文件保存路径
    const filePath = resolve(this.UPLOAD_DIR_PATH, filename)
    // 文件已存在则直接返回路径（秒传）
    if (existsSync(filePath)) return `uploads/${filename}`
    if (!existsSync(this.UPLOAD_DIR_PATH)) mkdirSync(this.UPLOAD_DIR_PATH, { recursive: true })
    // 写入文件到本地
    writeFileSync(filePath, file.buffer)
    // 返回可访问地址
    return `uploads/${filename}`
  }

  /** 秒传 + 断点续传检查 */
  public checkFile(checkFileDto: CheckFileDto) {
    if (!existsSync(this.UPLOAD_DIR_PATH)) mkdirSync(this.UPLOAD_DIR_PATH, { recursive: true })
    const { fileHash } = checkFileDto
    const tempDir = resolve(this.UPLOAD_DIR_PATH, fileHash)
    // 1. 已合并完成 => 秒传
    const hasFinalFile = readdirSync(this.UPLOAD_DIR_PATH).some((file) => file.startsWith(fileHash + '.'))
    if (hasFinalFile) return { isExist: true, uploadedChunks: [] }
    // 2. 断点续传 / 全新文件
    return { isExist: false, uploadedChunks: existsSync(tempDir) ? readdirSync(tempDir) : [] }
  }

  /** 上传单个分片 */
  public uploadChunk(files: ExpressMulterFile[], uploadChunkDto: UploadChunkDto) {
    const { fileHash, chunkHash } = uploadChunkDto
    // 临时分片目录
    const tempDir = resolve(this.UPLOAD_DIR_PATH, fileHash)
    // 不存在则创建文件夹
    if (!existsSync(tempDir)) mkdirSync(tempDir, { recursive: true })
    // 写入分片文件
    writeFileSync(resolve(tempDir, chunkHash), files[0].buffer)
    // 返回成功信息
    return '分片上传成功'
  }

  /** 合并所有分片 */
  public async mergeChunk(mergeChunkDto: MergeChunkDto) {
    const { fileHash, fileName } = mergeChunkDto
    const tempDir = resolve(this.UPLOAD_DIR_PATH, fileHash)
    const ext = extname(fileName)
    const finalFilePath = resolve(this.UPLOAD_DIR_PATH, `${fileHash}${ext}`)
    // 1. 已存在 => 抛出异常
    if (existsSync(finalFilePath)) throw new BusinessException('文件已存在，无需合并')
    // 2. 分片目录不存在，抛出异常（全局捕获会处理）
    if (!existsSync(tempDir)) throw new BusinessException('分片文件不存在，请重新上传')
    // 3. 读取并按分片序号排序
    const chunks = readdirSync(tempDir).sort((a, b) => parseInt(a.split('-').pop() || '0') - parseInt(b.split('-').pop() || '0'))
    // 4. 流式合并（企业级标准，高性能、不占内存）
    const writeStream = createWriteStream(finalFilePath)
    // Node 默认最多给一个流加 10 个事件监听，防止意外内存泄漏
    // 但这是分片合并，必须给一个 writeStream 绑定多个监听器，是正常业务场景，不是泄漏
    // 所以这里提高监听上限，消除警告
    writeStream.setMaxListeners(0)
    // 遍历分片文件，按序号合并
    for (const chunk of chunks) await pipeline(createReadStream(resolve(tempDir, chunk)), writeStream, { end: false })
    // 关闭写入流，等待所有数据写入完成
    writeStream.end()
    await new Promise<void>((resolve) => writeStream.on('finish', () => resolve())) // 等待真正写入完成
    // 5. 清理临时目录
    this.deleteDirectory(tempDir)
    // 6. 返回成功信息
    return '文件合并成功'
  }

  /** 清理分片 */
  public clearChunk(clearChunkDto: ClearChunkDto) {
    const { fileHash } = clearChunkDto
    // 1. 拼接临时分片目录
    const tempDir = resolve(process.cwd(), 'uploads', fileHash)
    // 2. 目录不存在 → 直接返回
    if (!existsSync(tempDir)) return '分片目录不存在，无需清理'
    // 3. 递归删除目录（安全强制删除）
    this.deleteDirectory(tempDir)
    // 4. 返回成功信息
    return '分片目录已成功清理'
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Handler                              */
  /* -------------------------------------------------------------------------- */

  /** 删除指定目录 */
  private deleteDirectory(dirPath: string, options: RmOptions = {}) {
    if (!existsSync(dirPath)) return
    rmSync(dirPath, Object.assign({ recursive: true, force: true }, options))
  }
}
