import { Transform, Type } from 'class-transformer'
import { UploadConstant } from '@/common'
import { IsHexadecimal, IsInt, IsNotEmpty, Length, Max, Min } from 'class-validator'

const FILE_HASH_MESSAGE = '文件哈希须为 64 位十六进制 SHA-256'

/** 文件哈希公共字段：客户端传入的哈希只允许 64 位十六进制，统一转小写后再落盘/比对 */
class FileHashDto {
  /** 文件整体哈希（前端分片前计算） */
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsNotEmpty({ message: '文件哈希不能为空' })
  @IsHexadecimal({ message: FILE_HASH_MESSAGE })
  @Length(64, 64, { message: FILE_HASH_MESSAGE })
  fileHash: string
}

/** 秒传校验：按文件哈希 + 文件大小判断是否已有完整文件 */
export class CheckFileDto extends FileHashDto {
  /** 文件总大小（字节），与哈希一起构成秒传判定口径 */
  @Type(() => Number)
  @IsInt({ message: '文件大小必须是整数' })
  @Min(1, { message: '文件大小必须大于 0' })
  @Max(UploadConstant.MAX_FILE_SIZE, { message: '单个文件不能超过 2GB' })
  fileSize: number
}

/** 单个分片上传 */
export class UploadChunkDto extends FileHashDto {
  /** 分片序号（从 0 开始，同时作为分片文件名） */
  @Type(() => Number)
  @IsInt({ message: '分片序号必须是整数' })
  @Min(0, { message: '分片序号不能小于 0' })
  @Max(UploadConstant.MAX_CHUNK_COUNT - 1, { message: `分片序号不能超过 ${UploadConstant.MAX_CHUNK_COUNT - 1}` })
  partNumber: number
}

/** 分片合并成最终文件 */
export class MergeChunkDto extends FileHashDto {
  /** 原始文件名，用于提取扩展名 */
  @IsNotEmpty({ message: '文件名不能为空' })
  @Length(1, 255, { message: '文件名长度须在 1 到 255 个字符之间' })
  fileName: string

  /** 文件总大小（字节），合并时校验分片字节总和 */
  @Type(() => Number)
  @IsInt({ message: '文件大小必须是整数' })
  @Min(1, { message: '文件大小必须大于 0' })
  @Max(UploadConstant.MAX_FILE_SIZE, { message: '单个文件不能超过 2GB' })
  fileSize: number

  /** 分片总数，合并时校验 0..totalChunks-1 无缺口 */
  @Type(() => Number)
  @IsInt({ message: '分片总数必须是整数' })
  @Min(1, { message: '分片总数必须大于 0' })
  @Max(UploadConstant.MAX_CHUNK_COUNT, { message: `分片总数不能超过 ${UploadConstant.MAX_CHUNK_COUNT}` })
  totalChunks: number
}

/** 清理已上传的分片 */
export class ClearChunkDto extends FileHashDto {}
