/** 文件类型：D 目录 / F 文件 */
export const FILE_TYPE = { FOLDER: 'D', FILE: 'F' } as const

export interface Item extends BaseEntity {
  /** 主键ID */
  id: string
  /** 父节点ID（0 表示根节点） */
  parentId: string
  /** 祖级列表（如 0,{uuid}） */
  ancestors: string
  /** 类型（D 目录 / F 文件） */
  fileType: string
  /** 名称（目录名或文件原始名） */
  fileName: string
  /** 文件 SHA-256（目录为 null） */
  fileHash: string | null
  /** 相对存储路径，如 uploads/xxx.png（目录为 null） */
  filePath: string | null
  /** 文件大小（字节，目录为 null） */
  fileSize: number | null
  /** 扩展名（含点，如 .png，目录为 null） */
  fileExt: string | null
  /** MIME 类型（目录为 null） */
  mimeType: string | null
}

export interface TreeItem extends Item {
  children: TreeItem[]
}

export interface Query {
  pageNo: number
  pageSize: number
  parentId?: string
  fileName?: string
}

export interface RecycleQuery {
  pageNo: number
  pageSize: number
  fileName?: string
}

export type FolderForm = Partial<Pick<Item, 'id' | 'parentId' | 'fileName'>>

/** 上传登记参数（单传/分片合并成功后调用） */
export interface RegisterParams {
  /** 父目录 ID（0 表示根节点） */
  parentId?: string
  /** 文件整体 SHA-256 */
  fileHash: string
  /** 原始文件名 */
  fileName: string
  /** 文件大小（字节） */
  fileSize: number
  /** MIME 类型 */
  mimeType?: string
}
