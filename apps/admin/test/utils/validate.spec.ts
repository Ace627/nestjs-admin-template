import { describe, expect, it } from 'vitest'
import { isArray, isBoolean, isEmpty, isExternal, isJsonString, isNil, isNumber, isPlainObject, isString, isStringNumber } from '@/utils/validate'

describe('isExternal', () => {
  it('识别 http / https 链接', () => {
    expect(isExternal('http://example.com')).toBe(true)
    expect(isExternal('https://example.com/path?query=1')).toBe(true)
  })

  it('识别 mailto 与 tel 协议', () => {
    expect(isExternal('mailto:admin@example.com')).toBe(true)
    expect(isExternal('tel:10086')).toBe(true)
  })

  it('去除首尾空白后再判断', () => {
    expect(isExternal('  https://example.com  ')).toBe(true)
  })

  it('站内路径与协议相对路径不算外链', () => {
    expect(isExternal('/system/user')).toBe(false)
    expect(isExternal('//example.com')).toBe(false)
    expect(isExternal('example.com')).toBe(false)
  })

  it('不支持的协议返回 false', () => {
    expect(isExternal('ftp://example.com')).toBe(false)
  })

  it('协议名大小写不敏感', () => {
    expect(isExternal('HTTP://EXAMPLE.COM')).toBe(true)
    expect(isExternal('Https://example.com')).toBe(true)
    expect(isExternal('MAILTO:admin@example.com')).toBe(true)
  })

  it('空字符串与非字符串返回 false', () => {
    expect(isExternal('')).toBe(false)
    expect(isExternal('   ')).toBe(false)
    expect(isExternal(123)).toBe(false)
    expect(isExternal(null)).toBe(false)
  })
})

describe('isStringNumber', () => {
  it('识别整数、小数与负数', () => {
    expect(isStringNumber('123')).toBe(true)
    expect(isStringNumber('-123')).toBe(true)
    expect(isStringNumber('12.5')).toBe(true)
    expect(isStringNumber('-12.5')).toBe(true)
  })

  it('去除首尾空白后再判断', () => {
    expect(isStringNumber(' 42 ')).toBe(true)
  })

  it('缺少整数位或小数位时不通过', () => {
    expect(isStringNumber('.5')).toBe(false)
    expect(isStringNumber('5.')).toBe(false)
  })

  it('不支持科学计数法', () => {
    expect(isStringNumber('1e3')).toBe(false)
    expect(isStringNumber('1E3')).toBe(false)
  })

  it('不支持正号、千分位与进制前缀', () => {
    expect(isStringNumber('+42')).toBe(false)
    expect(isStringNumber('1,000')).toBe(false)
    expect(isStringNumber('0x10')).toBe(false)
  })

  it('空字符串与非字符串返回 false', () => {
    expect(isStringNumber('')).toBe(false)
    expect(isStringNumber('   ')).toBe(false)
    expect(isStringNumber(123)).toBe(false)
  })
})

describe('isJsonString', () => {
  it('识别合法的 JSON 对象与数组', () => {
    expect(isJsonString('{"name":"admin"}')).toBe(true)
    expect(isJsonString('[1,2,3]')).toBe(true)
    expect(isJsonString('{}')).toBe(true)
    expect(isJsonString('[]')).toBe(true)
  })

  it('去除首尾空白后再判断', () => {
    expect(isJsonString('  {"name":"admin"}  ')).toBe(true)
  })

  it('非法 JSON 返回 false', () => {
    expect(isJsonString('{"name":}')).toBe(false)
    expect(isJsonString('{"name":"admin"')).toBe(false)
    expect(isJsonString('{bad}')).toBe(false)
  })

  it('首尾符号不配对时返回 false', () => {
    expect(isJsonString('{"name":"admin"}]')).toBe(false)
    expect(isJsonString('[1,2,3}')).toBe(false)
  })

  it('原始值（字符串、数字、布尔、null）返回 false', () => {
    expect(isJsonString('"admin"')).toBe(false)
    expect(isJsonString('123')).toBe(false)
    expect(isJsonString('true')).toBe(false)
    expect(isJsonString('null')).toBe(false)
  })

  it('空字符串与非字符串返回 false', () => {
    expect(isJsonString('')).toBe(false)
    expect(isJsonString('   ')).toBe(false)
    expect(isJsonString({ name: 'admin' })).toBe(false)
  })
})

describe('lodash 类型判断的转导出', () => {
  it('转导出的函数可正常调用', () => {
    expect(isArray([1, 2])).toBe(true)
    expect(isString('admin')).toBe(true)
    expect(isNumber(1)).toBe(true)
    expect(isBoolean(false)).toBe(true)
    expect(isPlainObject({ name: 'admin' })).toBe(true)
    expect(isEmpty([])).toBe(true)
    expect(isNil(null)).toBe(true)
  })
})
