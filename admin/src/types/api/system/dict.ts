export interface TypeItem extends BaseEntity {
  /** 主键ID */
  id: string
  /** 字典名称 */
  dictName: string
  /** 字典类型（唯一编码，允许修改；修改时后端会级联同步该类型下的字典数据与缓存） */
  dictType: string
  /** 状态（1 正常 / 0 停用） */
  status: string
  /** 备注 */
  remark: string
}

export interface DataItem extends BaseEntity {
  /** 主键ID */
  id: string
  /** 字典标签 */
  dictLabel: string
  /** 字典键值 */
  dictValue: string
  /** 字典排序 */
  dictSort: number
  /** 字典类型（关联 TypeItem.dictType） */
  dictType: string
  /** 表格回显样式（el-tag type） */
  listClass: string
  /** 状态（1 正常 / 0 停用） */
  status: string
  /** 备注 */
  remark: string
}

export interface TypeQuery {
  pageNo: number
  pageSize: number
  dictName?: string
  dictType?: string
  status?: string
}

export interface DataQuery {
  pageNo: number
  pageSize: number
  dictType?: string
  dictLabel?: string
  status?: string
}

export type TypeForm = Partial<TypeItem>
export type DataForm = Partial<DataItem>
