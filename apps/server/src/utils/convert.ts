import { toNumber as _toNumber } from 'lodash-es'

/**
 * 将字符串数字转换为 number，缺失或非法时返回默认值
 * @param value - 待转换的值
 * @param defaultValue - 非法或缺失时的默认数字
 * @returns 转换后的数字或默认值
 */
export function toNumber(value: unknown, defaultValue: number): number {
  if (typeof value !== 'string' || value.trim() === '') return defaultValue
  const result = _toNumber(value)
  return Number.isFinite(result) ? result : defaultValue
}

/**
 * 将字符串转换为 boolean，缺失或非法时返回默认值
 * @param value - 待转换的值
 * @param defaultValue - 非法或缺失时的默认布尔值，默认 false
 * @returns 转换后的布尔值或默认值
 */
export function toBoolean(value: unknown, defaultValue: boolean = false): boolean {
  if (typeof value !== 'string') return defaultValue
  return value === 'true'
}

/**
 * 将字符串数字转换为整数，小数部分向零截断，缺失或非法时返回默认值
 * @param value - 待转换的值
 * @param defaultValue - 非法或缺失时的默认整数
 * @returns 转换后的整数或默认值
 */
export function toInteger(value: unknown, defaultValue: number): number {
  if (typeof value !== 'string' || value.trim() === '') return defaultValue
  const result = Math.trunc(Number(value.trim()))
  return Number.isFinite(result) ? result : defaultValue
}
