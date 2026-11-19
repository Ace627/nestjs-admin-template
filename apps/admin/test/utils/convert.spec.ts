import { describe, expect, it } from 'vitest'
import { toBoolean, toInteger, toNumber } from '@/utils/convert'

describe('toNumber', () => {
  it('把数字字符串转为 number', () => {
    expect(toNumber('123', 0)).toBe(123)
    expect(toNumber('12.5', 0)).toBe(12.5)
    expect(toNumber('-5', 0)).toBe(-5)
  })

  it('去除首尾空白后再转换', () => {
    expect(toNumber(' 42 ', 0)).toBe(42)
  })

  it('空字符串与纯空白字符串返回默认值', () => {
    expect(toNumber('', 9)).toBe(9)
    expect(toNumber('   ', 9)).toBe(9)
  })

  it('无法解析的字符串返回默认值', () => {
    expect(toNumber('abc', 9)).toBe(9)
  })

  it('非字符串类型直接返回默认值，不做隐式转换', () => {
    expect(toNumber(123, 9)).toBe(9)
    expect(toNumber(null, 9)).toBe(9)
    expect(toNumber(undefined, 9)).toBe(9)
    expect(toNumber(true, 9)).toBe(9)
  })

  it('超出有限范围的 Infinity 返回默认值', () => {
    expect(toNumber('Infinity', 9)).toBe(9)
  })

  it('支持十六进制、二进制、科学计数法，但不识别千分位（Number 语义）', () => {
    expect(toNumber('0x10', 0)).toBe(16)
    expect(toNumber('0b11', 0)).toBe(3)
    expect(toNumber('1e3', 0)).toBe(1000)
    expect(toNumber('1,000', 9)).toBe(9)
  })
})

describe('toBoolean', () => {
  it('仅字符串 true 转为 true', () => {
    expect(toBoolean('true')).toBe(true)
  })

  it('其余字符串一律为 false', () => {
    expect(toBoolean('false')).toBe(false)
    expect(toBoolean('TRUE')).toBe(false)
    expect(toBoolean('1')).toBe(false)
    expect(toBoolean('')).toBe(false)
  })

  it('去除首尾空白后再判断', () => {
    expect(toBoolean(' true ')).toBe(true)
    expect(toBoolean(' false ')).toBe(false)
  })

  it('纯空白字符串返回默认值', () => {
    expect(toBoolean('   ')).toBe(false)
    expect(toBoolean('   ', true)).toBe(true)
  })

  it('真布尔值原样返回，不被默认值覆盖', () => {
    expect(toBoolean(true)).toBe(true)
    expect(toBoolean(false)).toBe(false)
    expect(toBoolean(false, true)).toBe(false)
  })

  it('既不是布尔也不是字符串的类型返回默认值', () => {
    expect(toBoolean(1)).toBe(false)
    expect(toBoolean(null, true)).toBe(true)
    expect(toBoolean(undefined, true)).toBe(true)
  })
})

describe('toInteger', () => {
  it('小数部分向零截断', () => {
    expect(toInteger('12.9', 0)).toBe(12)
    expect(toInteger('-12.9', 0)).toBe(-12)
  })

  it('去除首尾空白后转换', () => {
    expect(toInteger(' 42 ', 0)).toBe(42)
  })

  it('空字符串与纯空白字符串返回默认值', () => {
    expect(toInteger('', 7)).toBe(7)
    expect(toInteger('  ', 7)).toBe(7)
  })

  it('无法解析的字符串返回默认值', () => {
    expect(toInteger('abc', 7)).toBe(7)
  })

  it('科学计数法与十六进制按 Number 规则解析', () => {
    expect(toInteger('1e3', 0)).toBe(1000)
    expect(toInteger('0x10', 0)).toBe(16)
  })

  it('超出有限范围的 Infinity 返回默认值', () => {
    expect(toInteger('Infinity', 7)).toBe(7)
  })

  it('非字符串类型返回默认值', () => {
    expect(toInteger(12.9, 7)).toBe(7)
  })
})
