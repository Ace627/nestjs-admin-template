export interface Item extends BaseEntity {
  /** 主键ID */
  id: string
  /** 参数名称 */
  configName: string
  /** 参数键名（唯一，内置参数不允许修改） */
  configKey: string
  /** 参数键值（统一字符串，业务侧自行转换类型） */
  configValue: string
  /** 系统内置（Y 内置 / N 非内置，内置参数禁止删除与改键名） */
  configType: string
  /** 备注 */
  remark: string
}

export interface Query {
  pageNo: number
  pageSize: number
  configName?: string
  configKey?: string
  configType?: string
}

export type Form = Partial<Item>
