import 'reflect-metadata'
import { ExcelType } from '../constant/excel.constant'
import { DecoratorConstant } from '../constant/decorator.constant'
import { ExcelOption } from '@/modules/common/excel/excel.interface'

export const Excel = (option: ExcelOption) => {
  return (target: any, propertyKey: string | symbol) => {
    const old = Reflect.getMetadata(`${DecoratorConstant.EXCEL}`, target.constructor)
    const obj = Object.assign({ sort: 1, type: ExcelType.ALL }, option, { propertyKey })
    if (old) {
      const exports = JSON.parse(JSON.stringify(old))
      exports.push(obj)
      Reflect.defineMetadata(`${DecoratorConstant.EXCEL}`, exports, target.constructor)
    } else {
      Reflect.defineMetadata(`${DecoratorConstant.EXCEL}`, [obj], target.constructor)
    }
  }
}
