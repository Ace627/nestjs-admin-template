/** 秒传 + 断点续传检查参数 */
export interface CheckFileParams {
  /** 文件整体哈希（前端分片前计算） */
  fileHash: string
}

/** 秒传 + 断点续传检查结果 */
export interface CheckFileResponse {
  /** 文件是否已存在（存在则秒传） */
  isExist: boolean
  /** 已上传的分片文件名列表（{序号}-{哈希}） */
  uploadedChunks: string[]
}

/** 分片合并参数 */
export interface MergeChunkParams {
  /** 文件整体哈希，用于定位分片目录与命名最终文件 */
  fileHash: string
  /** 原始文件名，用于提取扩展名 */
  fileName: string
}

/** 清理分片参数 */
export interface ClearChunkParams {
  /** 文件整体哈希，用于定位分片目录 */
  fileHash: string
}
