import { IsNotEmpty } from 'class-validator'

/** 秒传校验：检查文件是否已存在（按文件哈希） */
export class CheckFileDto {
  /** 文件整体哈希（前端分片前计算） */
  @IsNotEmpty({ message: '参数 $property 不能为空' })
  fileHash: string
}

/** 单个分片上传 */
export class UploadChunkDto {
  /** 文件整体哈希，用作分片临时目录名 */
  @IsNotEmpty({ message: '参数 $property 不能为空' })
  fileHash: string

  /** 分片哈希，用作分片文件名（{序号}-{哈希}） */
  @IsNotEmpty({ message: '参数 $property 不能为空' })
  chunkHash: string
}

/** 分片合并成最终文件 */
export class MergeChunkDto {
  /** 文件整体哈希，用于定位分片目录与命名最终文件 */
  @IsNotEmpty({ message: '参数 $property 不能为空' })
  fileHash: string

  /** 原始文件名，用于提取扩展名 */
  @IsNotEmpty({ message: '参数 $property 不能为空' })
  fileName: string
}

/** 清理已上传的分片 */
export class ClearChunkDto {
  /** 文件整体哈希，用于定位分片目录 */
  @IsNotEmpty({ message: '参数 $property 不能为空' })
  fileHash: string
}
