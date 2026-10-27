/**
 * 根据当前时间生成问候语
 * @example 上午好 / 中午好 / 下午好 / 晚上好
 * @param date 可选参数，指定时间，默认当前系统时间
 */
export function getTimeGreeting(date?: Date) {
  const hour = date ? new Date(date).getHours() : new Date().getHours()
  if (hour >= 0 && hour < 6) return '凌晨好'
  if (hour >= 6 && hour < 12) return '上午好'
  if (hour >= 12 && hour < 14) return '中午好'
  if (hour >= 14 && hour < 18) return '下午好'
  return '晚上好'
}

/**
 * 获取某天是星期几
 * @param options.prefix 前缀，支持 '星期' | '周' | '礼拜'，默认 '星期'
 * @param options.date 目标时间，支持 Date 或时间戳/日期字符串，默认当前时间
 * @returns 如 '星期三'、'周三'、'礼拜三'
 */
export function getWeekDay(options: { prefix?: '星期' | '周' | '礼拜'; date?: Date | string | number } = {}): string {
  const { prefix = '星期', date = new Date() } = options
  const target = date instanceof Date ? date : new Date(date)
  const days = ['日', '一', '二', '三', '四', '五', '六'] as const
  return `${prefix}${days[target.getDay()]}`
}
