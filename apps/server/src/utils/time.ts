import dayjs from 'dayjs'

/**
 * 格式化时间
 * @description 使用 dayjs 将日期对象/时间戳/字符串格式化为指定格式的日期字符串
 * @param date - 待格式化的时间，支持时间戳、Date对象、日期字符串，默认为当前时间
 * @param format - 日期格式化模板，默认为 YYYY-MM-DD HH:mm:ss
 * @returns 格式化后的日期字符串
 */
export function formatTime(date: dayjs.ConfigType = dayjs(), format: string = 'YYYY-MM-DD HH:mm:ss') {
  return dayjs(date).format(format)
}
