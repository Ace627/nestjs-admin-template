/** 敏感字段值替换符（保留字段名，只掩码值） */
const MASKED_VALUE = '******'

/** 需要脱敏的字段名（统一转小写比较，兼容 accessToken / ACCESS_TOKEN） */
const SENSITIVE_FIELD_NAMES = new Set(['password', 'oldpassword', 'newpassword', 'confirmpassword', 'token', 'accesstoken', 'refreshtoken', 'authorization', 'secret', 'privatekey', 'signature'])

/** 返回参数落库最大长度 */
const MAX_TEXT_LENGTH = 2000

/** 递归掩码敏感字段，保留字段名与嵌套结构 */
export function maskSensitiveData(value: unknown, depth: number = 0): unknown {
  if (value === null || typeof value !== 'object') return value
  if (depth > 6) return '[层级过深，已省略]'
  if (Array.isArray(value)) return value.map((item) => maskSensitiveData(item, depth + 1))
  const maskedData: Record<string, unknown> = {}
  for (const [fieldName, fieldValue] of Object.entries(value as Record<string, unknown>)) {
    maskedData[fieldName] = SENSITIVE_FIELD_NAMES.has(fieldName.toLowerCase()) ? MASKED_VALUE : maskSensitiveData(fieldValue, depth + 1)
  }
  return maskedData
}

/** 超长文本截断，附带原始长度提示 */
export function truncateText(text: string, maxLength: number = MAX_TEXT_LENGTH): string {
  return text.length > maxLength ? `${text.slice(0, maxLength)}\n...(已截断，原始长度 ${text.length} 字符)` : text
}
