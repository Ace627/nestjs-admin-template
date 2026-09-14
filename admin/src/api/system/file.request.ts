import { request } from '@/utils/request'
import type { File } from '@/types'

export class FileRequest {
  /** 目录树（仅目录、未删除） */
  static findFolderTree(): Promise<File.TreeItem[]> {
    return request.get('/system/file/tree')
  }

  /** 当前目录下文件分页列表 */
  static findList(params: File.Query): PaginationResult<File.Item> {
    return request.get('/system/file/list', { params })
  }

  /** 新建目录 */
  static createFolder(data: File.FolderForm): Promise<string> {
    return request.post('/system/file/folder/create', data)
  }

  /** 重命名目录 */
  static updateFolder(data: File.FolderForm): Promise<string> {
    return request.put('/system/file/folder/update', data)
  }

  /** 删除文件/目录（ids 为逗号拼接字符串，软删进入回收站） */
  static delete(params: { ids: string }): Promise<string> {
    return request.delete('/system/file/delete', { params })
  }

  /** 上传登记（单传/分片合并成功后调用） */
  static register(data: File.RegisterParams): Promise<string> {
    return request.post('/system/file/register', data)
  }

  /** 文件下载（blob 响应，拦截器透传完整 axios response） */
  static download(params: { id: string }) {
    return request.get('/system/file/download', { params, responseType: 'blob' })
  }

  /* ----------------------------- 回收站 ----------------------------- */

  /** 回收站分页列表 */
  static findRecycleList(params: File.RecycleQuery): PaginationResult<File.Item> {
    return request.get('/system/file/recycle/list', { params })
  }

  /** 回收站还原（ids 为逗号拼接字符串，目录级联还原） */
  static restore(params: { ids: string }): Promise<string> {
    return request.put('/system/file/recycle/restore', {}, { params })
  }

  /** 回收站彻底删除（引用计数后删磁盘文件） */
  static deletePermanent(params: { ids: string }): Promise<string> {
    return request.delete('/system/file/recycle/delete', { params })
  }

  /** 清空回收站 */
  static clearRecycle(): Promise<string> {
    return request.delete('/system/file/recycle/clear')
  }
}
