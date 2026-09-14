export { isString } from 'lodash-es'
export { isArray } from 'lodash-es'
export { isEmpty } from 'lodash-es'

/**
 * 判断字符串是否为有效的数字格式
 * 支持整数、小数、负数和科学计数法
 * @param value - 待判断的值
 * @returns boolean
 */
export function isNumberString(value: unknown): boolean {
  if (typeof value !== 'string') return false
  const trimmedValue = value.trim()
  if (trimmedValue === '') return false
  return /^-?\d+(\.\d+)?$/.test(trimmedValue) // 匹配整数或浮点数
}

/**
 * 判断字符串是否为整数字符串
 * 支持负整数；不支持小数、正号、科学计数法（'1.0'、'1e3' 均返回 false）
 * @param value - 待判断的值
 * @returns boolean
 */
export function isIntegerString(value: unknown): boolean {
  if (typeof value !== 'string') return false
  const trimmedValue = value.trim()
  if (trimmedValue === '') return false
  return /^-?\d+$/.test(trimmedValue) // 可选负号 + 纯数字
}

/**
 * 判断字符串是否为合法的 JSON 对象格式
 * @param value - 待判断的值
 * @returns 是合法 JSON 对象则返回 true，原始值（如字符串、数字）返回 false
 */
export function isJsonObjectString(value: unknown): boolean {
  try {
    if (typeof value !== 'string') return false
    const trimmedValue = value.trim()
    if (!trimmedValue.startsWith('{') || !trimmedValue.endsWith('}')) return false
    JSON.parse(trimmedValue)
    return true
  } catch {
    return false
  }
}

/**
 * 判断字符串是否为合法的 JSON 数组格式
 * @param value - 待判断的值
 * @returns 是合法 JSON 数组则返回 true，原始值（如字符串、数字）返回 false
 */
export function isJsonArrayString(value: unknown): boolean {
  try {
    if (typeof value !== 'string') return false
    const trimmedValue = value.trim()
    if (!trimmedValue.startsWith('[') || !trimmedValue.endsWith(']')) return false
    JSON.parse(trimmedValue)
    return true
  } catch {
    return false
  }
}
