import type { Upload } from '@/types'
import { request } from '@/utils/request'
import type { AxiosRequestConfig } from 'axios'

export abstract class UploadRequest {
  /** 单文件上传（≤10MB） */
  static uploadFile(data: FormData): Promise<string> {
    return request.post('/common/upload/file', data)
  }

  /** 秒传 + 断点续传检查 */
  static checkFile(data: Upload.CheckFileParams): Promise<Upload.CheckFileResponse> {
    return request.post('/common/upload/check', data)
  }

  /** 上传单个分片 */
  static uploadChunk(data: FormData, config: AxiosRequestConfig = {}): Promise<string> {
    return request.post('/common/upload/chunk', data, config)
  }

  /** 合并所有分片 */
  static mergeChunks(data: Upload.MergeChunkParams): Promise<string> {
    return request.post('/common/upload/chunk/merge', data)
  }

  /** 清理分片 */
  static clearChunk(params: Upload.ClearChunkParams): Promise<string> {
    return request.delete('/common/upload/chunk/clear', { params })
  }
}
