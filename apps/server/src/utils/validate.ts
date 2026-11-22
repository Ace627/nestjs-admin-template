export { isEmpty } from 'lodash-es'

/**
 * 判断值是否为字符串
 * - 原始字符串由 typeof 判定；new String('x') 这类包装对象 typeof 结果是 'object'，需用 instanceof 兜住
 * @param value - 待判断的值
 * @returns 是字符串（含 String 包装对象）则返回 true
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string' || value instanceof String
}

/**
 * 判断值是否为数组
 * - 用 Array.isArray 而非 instanceof Array：跨执行上下文（如 iframe）的数组用 instanceof 会误判为 false
 * @param value - 待判断的值
 * @returns 是数组则返回 true，并在类型上收窄为 unknown[]
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

/**
 * 判断链接是否为外部链接
 * 支持 http(s)、ftp、mailto、tel 协议前缀，以及 // 开头的协议相对地址
 * @param value - 待判断的链接/路径
 * @returns boolean
 */
export function isExternal(value: unknown): boolean {
  if (typeof value !== 'string') return false
  const trimmedValue = value.trim()
  if (trimmedValue === '') return false
  return /^(https?:|ftp:|mailto:|tel:|\/\/)/.test(trimmedValue)
}

/**
 * 判断链接是否为 http(s) 外部地址（菜单内嵌/外链的判定依据）
 * @param value - 待判断的链接/路径
 * @returns boolean
 */
export function isHttpUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false
  const trimmedValue = value.trim()
  if (trimmedValue === '') return false
  return /^https?:\/\//i.test(trimmedValue)
}

/**
 * 判断字符串是否以协议前缀开头（如 mailto:、tel:、ftp:、javascript:），用于拦截菜单不支持的外部协议
 * @param value - 待判断的路径
 * @returns boolean
 */
export function hasProtocolPrefix(value: unknown): boolean {
  if (!isString(value)) return false
  return /^[a-z][a-z0-9+.-]*:/i.test(value.trim())
}

/**
 * 判断字符串是否为有效的数字格式
 * 支持整数、小数、负数和科学计数法
 * @param value - 待判断的值
 * @returns boolean
 */
export function isNumberString(value: unknown): boolean {
  if (!isString(value)) return false
  const trimmedValue = value.trim()
  if (trimmedValue === '') return false
  return /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(trimmedValue) // 匹配整数、浮点数与科学计数法
}

/**
 * 判断字符串是否为整数字符串
 * 支持负整数；不支持小数、正号、科学计数法（'1.0'、'1e3' 均返回 false）
 * @param value - 待判断的值
 * @returns boolean
 */
export function isIntegerString(value: unknown): boolean {
  if (!isString(value)) return false
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
    if (!isString(value)) return false
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
    if (!isString(value)) return false
    const trimmedValue = value.trim()
    if (!trimmedValue.startsWith('[') || !trimmedValue.endsWith(']')) return false
    JSON.parse(trimmedValue)
    return true
  } catch {
    return false
  }
}
