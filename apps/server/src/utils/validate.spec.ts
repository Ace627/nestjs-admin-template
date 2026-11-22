import { describe, expect, it } from 'vitest'

import { hasProtocolPrefix, isArray, isEmpty, isExternal, isHttpUrl, isIntegerString, isJsonArrayString, isJsonObjectString, isNumberString, isString } from './validate'

describe('isEmpty', () => {
  it('空值与空集合返回 true', () => {
    expect(isEmpty(null)).toBe(true)
    expect(isEmpty(undefined)).toBe(true)
    expect(isEmpty('')).toBe(true)
    expect(isEmpty([])).toBe(true)
    expect(isEmpty({})).toBe(true)
  })

  it('非空集合返回 false', () => {
    expect(isEmpty('a')).toBe(false)
    expect(isEmpty([0])).toBe(false)
    expect(isEmpty({ id: 1 })).toBe(false)
  })
})

describe('isString', () => {
  it('原始字符串与 String 包装对象返回 true', () => {
    expect(isString('')).toBe(true)
    expect(isString('abc')).toBe(true)
    expect(isString(new String('abc'))).toBe(true)
  })

  it('非字符串与 null/undefined 返回 false', () => {
    expect(isString(1)).toBe(false)
    expect(isString(null)).toBe(false)
    expect(isString(undefined)).toBe(false)
    expect(isString(['a'])).toBe(false)
    expect(isString({ toString: () => 'a' })).toBe(false)
  })
})

describe('isArray', () => {
  it('数组返回 true', () => {
    expect(isArray([])).toBe(true)
    expect(isArray([1, 'a'])).toBe(true)
  })

  it('类数组与非数组对象返回 false', () => {
    expect(isArray({ length: 0 })).toBe(false)
    expect(isArray('a')).toBe(false)
    expect(isArray(null)).toBe(false)
  })
})

describe('isExternal', () => {
  it('http(s)、ftp、mailto、tel 前缀与 // 协议相对地址返回 true', () => {
    expect(isExternal('http://example.com')).toBe(true)
    expect(isExternal('https://example.com/a?b=1')).toBe(true)
    expect(isExternal('ftp://ftp.example.com/pub')).toBe(true)
    expect(isExternal('ftp:pub/file.txt')).toBe(true)
    expect(isExternal('mailto:admin@example.com')).toBe(true)
    expect(isExternal('tel:10086')).toBe(true)
    expect(isExternal('//cdn.example.com/a.png')).toBe(true)
    expect(isExternal('  //cdn.example.com  ')).toBe(true)
    expect(isExternal('  https://example.com  ')).toBe(true)
  })

  it('站内路径、空串与非法前缀返回 false', () => {
    expect(isExternal('/system/role')).toBe(false)
    expect(isExternal('/system//role')).toBe(false)
    expect(isExternal('system/role')).toBe(false)
    expect(isExternal('')).toBe(false)
    expect(isExternal('   ')).toBe(false)
    expect(isExternal('ftp.example.com/pub')).toBe(false)
    expect(isExternal('httpx:example.com')).toBe(false)
  })

  it('非字符串返回 false', () => {
    expect(isExternal(null)).toBe(false)
    expect(isExternal(1)).toBe(false)
  })
})

describe('isHttpUrl', () => {
  it('http/https 地址返回 true，协议大小写不敏感', () => {
    expect(isHttpUrl('http://example.com')).toBe(true)
    expect(isHttpUrl('https://example.com')).toBe(true)
    expect(isHttpUrl('HTTPS://example.com')).toBe(true)
    expect(isHttpUrl('  http://example.com  ')).toBe(true)
  })

  it('缺少 // 或非 http(s) 返回 false', () => {
    expect(isHttpUrl('http:/example.com')).toBe(false)
    expect(isHttpUrl('//example.com')).toBe(false)
    expect(isHttpUrl('mailto:admin@example.com')).toBe(false)
    expect(isHttpUrl('')).toBe(false)
    expect(isHttpUrl('   ')).toBe(false)
  })

  it('非字符串返回 false', () => {
    expect(isHttpUrl(undefined)).toBe(false)
    expect(isHttpUrl({ url: 'http://example.com' })).toBe(false)
  })
})

describe('hasProtocolPrefix', () => {
  it('带协议前缀的字符串返回 true', () => {
    expect(hasProtocolPrefix('mailto:admin@example.com')).toBe(true)
    expect(hasProtocolPrefix('tel:10086')).toBe(true)
    expect(hasProtocolPrefix('ftp://example.com')).toBe(true)
    expect(hasProtocolPrefix('javascript:alert(1)')).toBe(true)
    expect(hasProtocolPrefix('  https://example.com  ')).toBe(true)
  })

  it('站内路径与空串返回 false', () => {
    expect(hasProtocolPrefix('/system/role')).toBe(false)
    expect(hasProtocolPrefix('system/role')).toBe(false)
    expect(hasProtocolPrefix('')).toBe(false)
    expect(hasProtocolPrefix('   ')).toBe(false)
  })

  it('非字符串返回 false', () => {
    expect(hasProtocolPrefix(null)).toBe(false)
    expect(hasProtocolPrefix(1)).toBe(false)
  })
})

describe('isNumberString', () => {
  it('整数、负数、小数与科学计数法返回 true', () => {
    expect(isNumberString('0')).toBe(true)
    expect(isNumberString('123')).toBe(true)
    expect(isNumberString('-123')).toBe(true)
    expect(isNumberString('1.5')).toBe(true)
    expect(isNumberString('-1.5')).toBe(true)
    expect(isNumberString('1e3')).toBe(true)
    expect(isNumberString('1E3')).toBe(true)
    expect(isNumberString('1.5e-3')).toBe(true)
    expect(isNumberString('-2.5E+10')).toBe(true)
    expect(isNumberString('  42  ')).toBe(true)
  })

  it('空串、非数字格式与非字符串返回 false', () => {
    expect(isNumberString('')).toBe(false)
    expect(isNumberString('   ')).toBe(false)
    expect(isNumberString('abc')).toBe(false)
    expect(isNumberString('NaN')).toBe(false)
    expect(isNumberString('+1')).toBe(false)
    expect(isNumberString('.5')).toBe(false)
    expect(isNumberString('1.')).toBe(false)
    expect(isNumberString('e3')).toBe(false)
    expect(isNumberString('1e')).toBe(false)
    expect(isNumberString('1e3.5')).toBe(false)
    expect(isNumberString('1 0')).toBe(false)
    expect(isNumberString(123)).toBe(false)
    expect(isNumberString(null)).toBe(false)
  })
})

describe('isIntegerString', () => {
  it('正整数、负整数与零返回 true', () => {
    expect(isIntegerString('0')).toBe(true)
    expect(isIntegerString('123')).toBe(true)
    expect(isIntegerString('-123')).toBe(true)
    expect(isIntegerString('  42  ')).toBe(true)
  })

  it('小数、科学计数法、正号与非字符串返回 false', () => {
    expect(isIntegerString('1.0')).toBe(false)
    expect(isIntegerString('1e3')).toBe(false)
    expect(isIntegerString('+1')).toBe(false)
    expect(isIntegerString('')).toBe(false)
    expect(isIntegerString('   ')).toBe(false)
    expect(isIntegerString('abc')).toBe(false)
    expect(isIntegerString(1)).toBe(false)
  })
})

describe('isJsonObjectString', () => {
  it('合法 JSON 对象字符串返回 true', () => {
    expect(isJsonObjectString('{}')).toBe(true)
    expect(isJsonObjectString('{"a":1}')).toBe(true)
    expect(isJsonObjectString('  {"a":{"b":[1,2]}}  ')).toBe(true)
  })

  it('JSON 数组、原始值与非法 JSON 返回 false', () => {
    expect(isJsonObjectString('[1,2]')).toBe(false)
    expect(isJsonObjectString('"a"')).toBe(false)
    expect(isJsonObjectString('123')).toBe(false)
    expect(isJsonObjectString('{a:1}')).toBe(false)
    expect(isJsonObjectString('{"a":1')).toBe(false)
    expect(isJsonObjectString('{"a":1} extra')).toBe(false)
    expect(isJsonObjectString('{}{}')).toBe(false)
    expect(isJsonObjectString('')).toBe(false)
  })

  it('非字符串返回 false', () => {
    expect(isJsonObjectString({ a: 1 })).toBe(false)
    expect(isJsonObjectString(null)).toBe(false)
    expect(isJsonObjectString(undefined)).toBe(false)
  })
})

describe('isJsonArrayString', () => {
  it('合法 JSON 数组字符串返回 true', () => {
    expect(isJsonArrayString('[]')).toBe(true)
    expect(isJsonArrayString('[1,2,3]')).toBe(true)
    expect(isJsonArrayString('  [{"a":1}]  ')).toBe(true)
  })

  it('JSON 对象、原始值与非法 JSON 返回 false', () => {
    expect(isJsonArrayString('{"a":1}')).toBe(false)
    expect(isJsonArrayString('"a"')).toBe(false)
    expect(isJsonArrayString(1)).toBe(false)
    expect(isJsonArrayString('[1,]')).toBe(false)
    expect(isJsonArrayString('[1,2')).toBe(false)
    expect(isJsonArrayString('[1,2] extra')).toBe(false)
    expect(isJsonArrayString('')).toBe(false)
  })

  it('非字符串返回 false', () => {
    expect(isJsonArrayString([])).toBe(false)
    expect(isJsonArrayString(null)).toBe(false)
    expect(isJsonArrayString(undefined)).toBe(false)
  })
})
