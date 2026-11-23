/** 秒传 + 断点续传检查参数 */
export interface CheckFileParams {
  /** 文件整体哈希（前端分片前计算） */
  fileHash: string
  /** 文件总大小（字节），与哈希一起构成秒传判定口径 */
  fileSize: number
}

/** 秒传 + 断点续传检查结果 */
export interface CheckFileResponse {
  /** 文件是否已存在（存在则秒传） */
  isExist: boolean
  /** 已上传的分片序号列表（从 0 开始） */
  uploadedChunks: number[]
}

/** 分片合并参数 */
export interface MergeChunkParams {
  /** 文件整体哈希，用于定位分片目录与命名最终文件 */
  fileHash: string
  /** 原始文件名，用于提取扩展名 */
  fileName: string
  /** 文件总大小（字节），合并时校验分片字节总和 */
  fileSize: number
  /** 分片总数，合并时校验无缺口 */
  totalChunks: number
}

/** 清理分片参数 */
export interface ClearChunkParams {
  /** 文件整体哈希，用于定位分片目录 */
  fileHash: string
}
