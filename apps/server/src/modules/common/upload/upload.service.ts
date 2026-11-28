import { createHash } from 'node:crypto'
import { once } from 'node:events'
import { extname, join, resolve } from 'node:path'
import { createSha256 } from '@/utils'
import { finished } from 'node:stream/promises'
import { BusinessException, FORBIDDEN_UPLOAD_EXTENSIONS, UploadConstant } from '@/common'
import { Injectable } from '@nestjs/common'
import { createReadStream, createWriteStream } from 'node:fs'
import { mkdir, readdir, rename, rm, stat, writeFile } from 'node:fs/promises'
import type { Stats } from 'node:fs'
import { CheckFileDto, ClearChunkDto, MergeChunkDto, UploadChunkDto } from './upload.dto'
import { extractPartNumber, findMissingPartNumbers, resolveInsideDirectory } from './upload.util'

@Injectable()
export class UploadService {
  /** 文件上传根目录，默认为项目根目录下的 `uploads` 文件夹 */
  private readonly UPLOAD_DIR_PATH = resolve(process.cwd(), 'uploads')

  /** 分片目录名：必须与最终文件命名空间隔离，否则无扩展名文件会与分片目录同名 */
  private readonly CHUNK_DIR_NAME = '.chunks'

  /** 校验后缀是否在禁止上传名单内（静态托管目录不接受可执行/可渲染文件） */
  private assertExtensionAllowed(ext: string): void {
    if (FORBIDDEN_UPLOAD_EXTENSIONS.includes(ext.toLowerCase())) throw new BusinessException('禁止上传该类型的文件')
  }

  /** 单文件上传（≤10MB 直接上传，>10MB 拒绝并提示分片） */
  public async uploadFile(file: ExpressMulterFile) {
    if (!file?.buffer?.length) throw new BusinessException('上传文件不能为空')
    if (file.size > UploadConstant.MAX_SINGLE_FILE_SIZE) throw new BusinessException('文件大于10MB，请使用分片上传')
    // 处理中文乱码并获取后缀
    const ext = extname(Buffer.from(file.originalname, 'latin1').toString('utf8'))
    this.assertExtensionAllowed(ext)
    /** 根据文件内容生成唯一 SHA-256 文件名 */
    const filename = `${createSha256(file.buffer)}${ext}`
    const filePath = resolveInsideDirectory(this.UPLOAD_DIR_PATH, filename)
    await mkdir(this.UPLOAD_DIR_PATH, { recursive: true })
    // 文件已存在则直接返回路径（秒传）
    if (await this.statOrNull(filePath)) return `uploads/${filename}`
    await this.writeFileAtomic(filePath, file.buffer)
    // 返回可访问地址
    return `uploads/${filename}`
  }

  /** 秒传 + 断点续传检查（哈希 + 大小双重确认，已完成的文件才判为秒传） */
  public async checkFile(checkFileDto: CheckFileDto) {
    const { fileHash, fileSize } = checkFileDto
    await mkdir(this.UPLOAD_DIR_PATH, { recursive: true })
    // 1. 已合并完成且大小一致 => 秒传
    if (await this.hasFinalFile(fileHash, fileSize)) return { isExist: true, uploadedChunks: [] }
    // 2. 断点续传：返回已落盘的分片序号（0 起）
    const chunkDir = this.resolveChunkDirectory(fileHash)
    const partNumbers = (await this.readdirOrEmpty(chunkDir)).map(extractPartNumber).filter((partNumber): partNumber is number => partNumber !== null)
    return { isExist: false, uploadedChunks: [...new Set(partNumbers)].sort((left, right) => left - right) }
  }

  /** 上传单个分片（同一序号重传直接覆盖，天然幂等） */
  public async uploadChunk(files: ExpressMulterFile[], uploadChunkDto: UploadChunkDto) {
    const chunkFile = files?.[0]
    if (!chunkFile?.buffer?.length) throw new BusinessException('分片内容不能为空')
    if (chunkFile.size > UploadConstant.MAX_CHUNK_SIZE) throw new BusinessException('分片大小超出限制')
    const chunkDir = this.resolveChunkDirectory(uploadChunkDto.fileHash)
    await mkdir(chunkDir, { recursive: true })
    await this.writeFileAtomic(resolveInsideDirectory(chunkDir, String(uploadChunkDto.partNumber)), chunkFile.buffer)
    return '分片上传成功'
  }

  /** 合并所有分片：校验分片完整性与总大小，边合并边算 SHA-256，校验通过后原子改名 */
  public async mergeChunk(mergeChunkDto: MergeChunkDto) {
    const { fileHash, fileName, fileSize, totalChunks } = mergeChunkDto
    const ext = extname(fileName)
    this.assertExtensionAllowed(ext)
    const finalFilePath = resolveInsideDirectory(this.UPLOAD_DIR_PATH, `${fileHash}${ext}`)
    await mkdir(this.UPLOAD_DIR_PATH, { recursive: true })
    // 1. 幂等：已完整落盘直接返回成功，尺寸不符则说明磁盘出现异常文件
    const existingStats = await this.statOrNull(finalFilePath)
    if (existingStats?.isFile()) {
      if (existingStats.size === fileSize) return '文件合并成功'
      throw new BusinessException('目标文件已存在但大小不一致，请联系管理员处理')
    }
    // 2. 分片目录与缺口校验
    const chunkDir = this.resolveChunkDirectory(fileHash)
    const partNumbers = (await this.readdirOrEmpty(chunkDir)).map(extractPartNumber).filter((partNumber): partNumber is number => partNumber !== null)
    if (!partNumbers.length) throw new BusinessException('分片文件不存在，请重新上传')
    const missingPartNumbers = findMissingPartNumbers(partNumbers, totalChunks)
    if (missingPartNumbers.length) {
      const preview = missingPartNumbers.slice(0, 5).join('、')
      throw new BusinessException(`分片不完整，缺少第 ${preview} 片（共缺 ${missingPartNumbers.length} 片）`)
    }
    // 3. 顺序流式合并，同时累积 SHA-256 与字节数，避免为校验再读一遍文件
    const contentHash = createHash('sha256')
    const tempFilePath = `${finalFilePath}.${process.pid}.tmp`
    const writeStream = createWriteStream(tempFilePath)
    let writtenBytes = 0
    try {
      for (let partNumber = 0; partNumber < totalChunks; partNumber += 1) {
        const chunkReadStream: AsyncIterable<Buffer> = createReadStream(resolveInsideDirectory(chunkDir, String(partNumber)))
        for await (const piece of chunkReadStream) {
          writtenBytes += piece.length
          contentHash.update(piece)
          if (!writeStream.write(piece)) await once(writeStream, 'drain')
        }
      }
      writeStream.end()
      await finished(writeStream)
      if (writtenBytes !== fileSize) throw new BusinessException(`分片总大小与文件大小不一致（应为 ${fileSize} 字节，实际 ${writtenBytes} 字节）`)
      if (contentHash.digest('hex') !== fileHash) throw new BusinessException('文件校验失败，内容与哈希不一致，请重新上传')
      await rename(tempFilePath, finalFilePath)
    } catch (error) {
      writeStream.destroy()
      await rm(tempFilePath, { force: true })
      throw error
    }
    // 4. 清理临时目录
    await rm(chunkDir, { recursive: true, force: true })
    return '文件合并成功'
  }

  /** 清理分片 */
  public async clearChunk(clearChunkDto: ClearChunkDto) {
    const chunkDir = this.resolveChunkDirectory(clearChunkDto.fileHash)
    if (!(await this.statOrNull(chunkDir))) return '分片目录不存在，无需清理'
    await rm(chunkDir, { recursive: true, force: true })
    return '分片目录已成功清理'
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Handler                              */
  /* -------------------------------------------------------------------------- */

  /** 分片目录：uploads/.chunks/{fileHash}，与最终文件 uploads/{fileHash}{ext} 隔离命名空间 */
  private resolveChunkDirectory(fileHash: string): string {
    return resolveInsideDirectory(this.UPLOAD_DIR_PATH, join(this.CHUNK_DIR_NAME, fileHash))
  }

  /** 最终文件是否已完整落盘：merge 走原子改名，文件名出现即代表内容完整，仍需复核大小 */
  private async hasFinalFile(fileHash: string, fileSize: number): Promise<boolean> {
    // 排除合并中断留下的 .tmp 临时文件；无扩展名文件的最终文件名就是哈希本身
    const matchedNames = (await this.readdirOrEmpty(this.UPLOAD_DIR_PATH)).filter((name) => (name === fileHash || name.startsWith(`${fileHash}.`)) && !name.endsWith('.tmp'))
    for (const name of matchedNames) {
      const stats = await this.statOrNull(resolveInsideDirectory(this.UPLOAD_DIR_PATH, name))
      if (stats?.isFile() && stats.size === fileSize) return true
    }
    return false
  }

  /** 先写临时文件再改名，避免中断留下半成品被误判为完整文件 */
  private async writeFileAtomic(targetPath: string, content: Buffer): Promise<void> {
    const tempFilePath = `${targetPath}.${process.pid}.tmp`
    try {
      await writeFile(tempFilePath, content)
      await rename(tempFilePath, targetPath)
    } catch (error) {
      await rm(tempFilePath, { force: true })
      throw error
    }
  }

  /** 读取目录，目录不存在时返回空数组 */
  private async readdirOrEmpty(dirPath: string): Promise<string[]> {
    try {
      return await readdir(dirPath)
    } catch {
      return []
    }
  }

  /** 读取文件状态，不存在或不可访问时返回 null */
  private async statOrNull(targetPath: string): Promise<Stats | null> {
    try {
      return await stat(targetPath)
    } catch {
      return null
    }
  }
}
