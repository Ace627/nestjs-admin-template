import { DictDataEntity } from '@/common'

export class ExcelOption {
  /** 导出时在 Excel 中排序，值越小越靠前 */
  order?: number

  /** 导出到 Excel 中的名字 */
  name: string

  /** 如果是字典类型，请设置字典的 type 值 (如: sys_user_sex) */
  dictType?: string

  /** 当值为空时，字段的默认值 */
  defaultValue?: string

  /** 字段类型（0：导出导入；1：仅导出；2：仅导入） */
  type?: string

  /** 列宽 */
  width?: number

  /** 日期格式, DayJS 文档看规则（https://dayjs.fenxianglu.cn/category/display.html#格式化）  如: YYYY-MM-DD */
  dateFormat?: string
}

export interface ExcelOptionAll extends ExcelOption {
  // 字段名
  propertyKey: string

  /* 字段值数组 */
  dictDataList: DictDataEntity[]
}

export interface ImportRow {
  /** Excel 中的行号（从 1 开始且包含表头行），用于错误定位 */
  rowNumber: number

  /** 行数据：propertyKey → 解析后的值（未做业务校验） */
  data: Record<string, any>
}
