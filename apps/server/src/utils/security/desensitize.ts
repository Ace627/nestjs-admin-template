/** 敏感字段值替换符（保留字段名，只掩码值） */
const MASKED_VALUE = '******'

/** 敏感字段关键词：字段名归一化后包含任一关键词即掩码，覆盖 oldPassword / repeat_password / userPwd / accessToken 等变体 */
const SENSITIVE_FIELD_KEYWORDS = ['password', 'passwd', 'pwd', 'token', 'secret', 'privatekey', 'signature', 'authorization']

/** 返回参数落库最大长度 */
const MAX_TEXT_LENGTH = 2000

/** 归一化字段名：小写并去掉下划线/中划线/空白，兼容 repeat_password、REPEAT-PASSWORD */
function normalizeFieldName(fieldName: string): string {
  return fieldName.toLowerCase().replace(/[_\s-]/g, '')
}

/** 判断字段名是否命中敏感关键词 */
function isSensitiveFieldName(fieldName: string): boolean {
  const normalizedFieldName = normalizeFieldName(fieldName)
  return SENSITIVE_FIELD_KEYWORDS.some((keyword) => normalizedFieldName.includes(keyword))
}

/** 递归掩码敏感字段，保留字段名与嵌套结构 */
export function maskSensitiveData(value: unknown, depth: number = 0): unknown {
  if (value === null || typeof value !== 'object') return value
  if (depth > 6) return '[层级过深，已省略]'
  if (Array.isArray(value)) return value.map((item) => maskSensitiveData(item, depth + 1))
  const maskedData: Record<string, unknown> = {}
  for (const [fieldName, fieldValue] of Object.entries(value as Record<string, unknown>)) {
    maskedData[fieldName] = isSensitiveFieldName(fieldName) ? MASKED_VALUE : maskSensitiveData(fieldValue, depth + 1)
  }
  return maskedData
}

/** 超长文本截断，附带原始长度提示 */
export function truncateText(text: string, maxLength: number = MAX_TEXT_LENGTH): string {
  return text.length > maxLength ? `${text.slice(0, maxLength)}\n...(已截断，原始长度 ${text.length} 字符)` : text
}
