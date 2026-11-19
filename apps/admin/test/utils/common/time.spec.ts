import { describe, expect, it } from 'vitest'
import { getTimeGreeting, getWeekDay } from '@/utils/common/time'

/**
 * 注意：被测函数取的是本地时区的小时/星期，用例统一用本地时间构造 Date，
 * 不要写成 '2026-01-01T00:00:00Z' 这类带 Z 的字符串，否则跨时区运行会失败。
 */

describe('getTimeGreeting', () => {
  const greetingCases: Array<[number, string]> = [
    [0, '凌晨好'],
    [5, '凌晨好'],
    [6, '上午好'],
    [11, '上午好'],
    [12, '中午好'],
    [13, '中午好'],
    [14, '下午好'],
    [17, '下午好'],
    [18, '晚上好'],
    [23, '晚上好'],
  ]

  it.each(greetingCases)('%i 点返回 %s', (hour, expectedGreeting) => {
    expect(getTimeGreeting(new Date(2026, 0, 1, hour, 30))).toBe(expectedGreeting)
  })

  it('不传参数时返回五个问候语之一', () => {
    const allGreetings = ['凌晨好', '上午好', '中午好', '下午好', '晚上好']
    expect(allGreetings).toContain(getTimeGreeting())
  })
})

describe('getWeekDay', () => {
  /** 2026-01-01 是星期四 */
  const thursdayDate = new Date(2026, 0, 1, 12)

  it('默认前缀为「星期」', () => {
    expect(getWeekDay({ date: thursdayDate })).toBe('星期四')
  })

  it('支持「周」前缀', () => {
    expect(getWeekDay({ prefix: '周', date: thursdayDate })).toBe('周四')
  })

  it('支持「礼拜」前缀', () => {
    expect(getWeekDay({ prefix: '礼拜', date: thursdayDate })).toBe('礼拜四')
  })

  it('支持时间戳入参', () => {
    expect(getWeekDay({ date: thursdayDate.getTime() })).toBe('星期四')
  })

  it('支持日期字符串入参', () => {
    // 不带 Z 的字符串按本地时间解析，避免时区偏移
    expect(getWeekDay({ date: '2026-01-01T12:00:00' })).toBe('星期四')
  })

  it('周日正确映射为「日」', () => {
    expect(getWeekDay({ date: new Date(2026, 0, 4, 12) })).toBe('星期日')
  })

  it('不传参数时返回「星期」+ 单个汉字', () => {
    expect(getWeekDay()).toMatch(/^星期[日一二三四五六]$/)
  })

  it('date 为 0 时按 1970-01-01 处理，不被默认值吞掉', () => {
    // 1970-01-01T00:00Z 在 UTC 及东时区是周四，在西时区（UTC-4 及更西）是周三
    expect(['星期三', '星期四']).toContain(getWeekDay({ date: 0 }))
    expect(getWeekDay({ date: 0 })).toBe(getWeekDay({ date: new Date(0) }))
  })
})

describe('无效日期入参', () => {
  it('getWeekDay 传入空字符串时抛 TypeError', () => {
    expect(() => getWeekDay({ date: '' })).toThrow(TypeError)
  })

  it('getWeekDay 传入无法解析的字符串时抛 TypeError', () => {
    expect(() => getWeekDay({ date: 'not-a-date' })).toThrow(TypeError)
  })

  it('getWeekDay 传入 Invalid Date 时抛 TypeError', () => {
    expect(() => getWeekDay({ date: new Date('无效') })).toThrow(TypeError)
  })

  it('getTimeGreeting 传入 Invalid Date 时抛 TypeError', () => {
    expect(() => getTimeGreeting(new Date('无效'))).toThrow(TypeError)
  })

  it('错误信息中包含原始入参，便于定位调用方', () => {
    expect(() => getWeekDay({ date: 'not-a-date' })).toThrow('无效的日期入参：not-a-date')
  })
})
