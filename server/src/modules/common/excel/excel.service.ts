import dayjs from 'dayjs'
import stream from 'stream'
import ExcelJS from 'exceljs'
import type { Cell, CellFormulaValue, CellHyperlinkValue, CellRichTextValue } from 'exceljs'
import { Injectable, Type } from '@nestjs/common'
import { ExcelOptionAll, ImportRow } from './excel.interface'
import { BusinessException, DecoratorConstant, ExcelType } from '@/common'
import { DictDataService } from '@/modules/system/dict/dict-data.service'

/** 导入解析时日期值的统一存储格式（与 formatTime 默认格式保持一致） */
const STORAGE_DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss'

@Injectable()
export class ExcelService {
  constructor(private readonly dictDataService: DictDataService) {}

  /**
   * 导入：解析 Excel 文件为行对象数组（通用能力，业务校验与入库由调用方负责）
   *
   * 职责边界：只做「文件结构校验 + 值逆变换」（表头比对、字典标签反查、日期逆解析），不做业务校验、不入库。
   *
   * 错误策略（全有或全无）：表头不一致直接驳回；任何一行的字典标签 / 日期解析失败，汇总行错误后整体驳回，不返回部分数据。
   */
  public async import<TModel extends Type<any>>(model: TModel, file: ExpressMulterFile): Promise<ImportRow[]> {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(file.buffer)
    const worksheet = workbook.worksheets[0]
    if (!worksheet) throw new BusinessException('文件缺少工作表')

    const importObjArr: ExcelOptionAll[] = Reflect.getMetadata(DecoratorConstant.EXCEL, model) ?? []
    const sortedImportObjArr = importObjArr
      .filter((item) => item.type === ExcelType.ALL || item.type === ExcelType.IMPORT)
      .sort((obj, obj2) => (obj.order ?? 1) - (obj2.order ?? 1))
    if (!sortedImportObjArr.length) throw new BusinessException('该数据模型未配置可导入的字段')

    // 表头强校验：列名、顺序、数量必须与模板完全一致，防止用户篡改模板后列错位
    const expectedHeaders = sortedImportObjArr.map((item) => item.name)
    const actualHeaders: string[] = []
    worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => actualHeaders.push(this.parseCellText(cell) ?? ''))
    while (actualHeaders.length && !actualHeaders.at(-1)) actualHeaders.pop() // 去除表尾空单元格
    const headerMismatch = expectedHeaders.length !== actualHeaders.length || expectedHeaders.some((name, index) => name !== actualHeaders[index])
    if (headerMismatch) throw new BusinessException('导入文件与模板不一致，请下载最新模板后填写')

    // 预取字典数据（导入时做 标签 → 值 的反查，与导出时 值 → 标签 互逆）
    const optionPromiseArr = sortedImportObjArr.map(async (item) => {
      if (item.dictType) item.dictDataList = await this.dictDataService.findByType(item.dictType)
      return item
    })
    const optionArr: ExcelOptionAll[] = await Promise.all(optionPromiseArr)

    // 逐行解析（跳过表头行，跳过全空行）
    const rowErrors: string[] = []
    const rows: ImportRow[] = []
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return
      const data: Record<string, any> = {}
      let hasValue = false
      optionArr.forEach((option, index) => {
        const text = this.parseCellText(row.getCell(index + 1))
        if (text === null) return
        hasValue = true
        if (option.dictType) {
          const dictData = option.dictDataList.find((item) => item.dictLabel === text)
          if (!dictData) {
            rowErrors.push(`第 ${rowNumber} 行：${option.name}「${text}」不存在`)
            return
          }
          data[option.propertyKey] = dictData.dictValue
          return
        }
        if (option.dateFormat) {
          const dateValue = dayjs(text)
          if (!dateValue.isValid()) {
            rowErrors.push(`第 ${rowNumber} 行：${option.name}「${text}」日期格式错误`)
            return
          }
          data[option.propertyKey] = dateValue.format(STORAGE_DATETIME_FORMAT)
          return
        }
        data[option.propertyKey] = option.defaultValue ?? text
      })
      if (hasValue) rows.push({ rowNumber, data })
    })

    if (rowErrors.length) {
      const summary = rowErrors.slice(0, 10).join('；')
      const suffix = rowErrors.length > 10 ? `（共 ${rowErrors.length} 处错误）` : ''
      throw new BusinessException(`上传的文件存在错误，请修正后重新上传；${summary}${suffix}`)
    }
    return rows
  }

  /** 读取单元格文本：兼容字符串、数字、富文本、超链接、公式结果、Date 等形态，空值统一返回 null */
  private parseCellText(cell: Cell): string | null {
    const value = cell.value
    if (value === null || value === undefined || value === '') return null
    if (typeof value !== 'object') return String(value).trim() || null
    if (value instanceof Date) return dayjs(value).format(STORAGE_DATETIME_FORMAT)
    const richText = (value as CellRichTextValue).richText
    if (richText) return richText.map((item) => item.text).join('').trim() || null
    const text = (value as CellHyperlinkValue).text ?? (value as CellFormulaValue).result
    if (text === null || text === undefined || text === '') return null
    return String(text).trim() || null
  }

  /* 导出 */
  public async export<Model, TModel extends Type<Model>>(model: TModel, list: Model[]) {
    const passThrough = new stream.PassThrough()
    const exportObjArr = Reflect.getMetadata(DecoratorConstant.EXCEL, model) ?? []
    const { headers, rows } = await this.formatExport(exportObjArr, list)
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Sheet1', { views: [{ state: 'frozen', ySplit: 1 }] })
    worksheet.columns = headers
    worksheet.addRows(rows)
    for (let i = 1; i <= worksheet.rowCount; i++) {
      const currentRow = worksheet.getRow(i)
      // 设置表头样式（可选）
      if (i === 1) currentRow.font = { bold: true }
      // 每个单元格都水平垂直局中
      currentRow.alignment = { vertical: 'middle', horizontal: 'center' }
    }
    await workbook.xlsx.write(passThrough)
    return passThrough
  }

  /* 导出模板 */
  public async importTemplate<TModel extends Type<any>>(model: TModel) {
    const passThrough = new stream.PassThrough()
    const importObjArr = Reflect.getMetadata(DecoratorConstant.EXCEL, model) ?? []
    const headers = await this.formatImport(importObjArr)
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Sheet1', { views: [{ state: 'frozen', ySplit: 1 }] })
    for (const header of headers) {
      header['width'] = header.width ?? 15 // 默认列宽（像素）
      header.style = { alignment: { horizontal: 'center', vertical: 'middle' } } // 水平垂直居中每一列
    }
    worksheet.getRow(1).font = { bold: true } // 单独设置表头行加粗（不影响数据行）
    worksheet.columns = headers
    await workbook.xlsx.write(passThrough)
    return passThrough
  }

  /** 整理导入模板 */
  private async formatImport(importObjArr: ExcelOptionAll[]): Promise<Partial<ExcelJS.Column>[]> {
    const filtered = importObjArr.filter((item) => item.type === ExcelType.ALL || item.type === ExcelType.IMPORT)
    const sorted = filtered.sort((obj, obj2) => (obj.order ?? 1) - (obj2.order ?? 1))
    const propertyKeys = sorted.map((item) => item.propertyKey)
    const names = sorted.map((item) => item.name)
    return propertyKeys.map((key, index) => ({ key, header: names[index] }))
  }

  /* 整理导出数据 */
  private async formatExport(exportObjArr: ExcelOptionAll[], list: any[]) {
    const filteredExportObjArr = exportObjArr.filter((item) => item.type === ExcelType.ALL || item.type === ExcelType.EXPORT)
    const sortedExportObjArr = filteredExportObjArr.sort((obj, obj2) => (obj.order ?? 1) - (obj2.order ?? 1))
    const optionPromiseArr = sortedExportObjArr.map(async (item) => {
      if (item.dictType) item.dictDataList = await this.dictDataService.findByType(item.dictType)
      return item
    })
    const optionArr: ExcelOptionAll[] = await Promise.all(optionPromiseArr)
    // 构建表头配置
    const headers: Partial<ExcelJS.Column>[] = optionArr.map((item) => {
      const header = { header: item.name, key: item.propertyKey }
      header['width'] = item.width ?? 15 // 默认列宽（像素）
      return header
    })
    const rows: Array<any> = []
    for (let index = 0; index < list.length; index++) {
      const element = list[index]
      const inArr = optionArr.map((option) => {
        let dataItem = element[option.propertyKey]
        if (option.dictType) {
          const dictData = option.dictDataList.find((item) => item.dictValue == dataItem)
          dataItem = dictData ? dictData.dictLabel : ''
        }
        if (option.defaultValue) dataItem = dataItem ?? option.defaultValue
        if (option.dateFormat) dataItem = dayjs(dataItem).format(option.dateFormat)
        return dataItem
      })
      rows.push(inArr) //插入每行数据
    }
    return { headers, rows }
  }
}
