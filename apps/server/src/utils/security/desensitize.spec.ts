import { describe, expect, it } from 'vitest'

import { maskSensitiveData, truncateText } from './desensitize'

describe('maskSensitiveData', () => {
  it('改密码接口的三个字段全部掩码', () => {
    const requestBody = {
      oldPassword: 'OldPass@123',
      newPassword: 'Jcss@!123',
      repeatPassword: 'Jcss@!123',
    }

    expect(maskSensitiveData(requestBody)).toEqual({
      oldPassword: '******',
      newPassword: '******',
      repeatPassword: '******',
    })
  })

  it('字段名的下划线、中划线、大小写变体同样掩码', () => {
    const maskedData = maskSensitiveData({
      repeat_password: 'plain',
      'REPEAT-PASSWORD': 'plain',
      new_pwd: 'plain',
      userPwd: 'plain',
      accessToken: 'plain',
      refresh_token: 'plain',
      clientSecret: 'plain',
      sign: 'plain',
    }) as Record<string, unknown>

    expect(maskedData.repeat_password).toBe('******')
    expect(maskedData['REPEAT-PASSWORD']).toBe('******')
    expect(maskedData.new_pwd).toBe('******')
    expect(maskedData.userPwd).toBe('******')
    expect(maskedData.accessToken).toBe('******')
    expect(maskedData.refresh_token).toBe('******')
    expect(maskedData.clientSecret).toBe('******')
    // sign 不含任何敏感关键词，不应被误伤
    expect(maskedData.sign).toBe('plain')
  })

  it('普通业务字段原值保留', () => {
    const requestBody = { username: 'admin', pageNo: 1, pageSize: 10, enabled: true }

    expect(maskSensitiveData(requestBody)).toEqual(requestBody)
  })

  it('嵌套对象与数组内的敏感字段同样掩码', () => {
    const requestBody = {
      body: {
        user: { username: 'admin', password: 'plain' },
        roles: [{ roleKey: 'admin', token: 'plain' }],
      },
      query: {},
    }

    expect(maskSensitiveData(requestBody)).toEqual({
      body: {
        user: { username: 'admin', password: '******' },
        roles: [{ roleKey: 'admin', token: '******' }],
      },
      query: {},
    })
  })

  it('数字等非字符串敏感值也替换为掩码', () => {
    expect(maskSensitiveData({ password: 123456 })).toEqual({ password: '******' })
  })

  it('非对象入参原样返回', () => {
    expect(maskSensitiveData(null)).toBeNull()
    expect(maskSensitiveData(undefined)).toBeUndefined()
    expect(maskSensitiveData('plain-text')).toBe('plain-text')
    expect(maskSensitiveData(1024)).toBe(1024)
  })

  it('嵌套层级超过上限时输出占位符', () => {
    let nestedValue: Record<string, unknown> = { password: 'plain' }
    for (let level = 0; level < 8; level++) nestedValue = { child: nestedValue }

    const maskedText = JSON.stringify(maskSensitiveData(nestedValue))

    expect(maskedText).toContain('[层级过深，已省略]')
    expect(maskedText).not.toContain('plain')
  })

  it('不修改入参对象', () => {
    const requestBody = { username: 'admin', repeatPassword: 'Jcss@!123' }

    maskSensitiveData(requestBody)

    expect(requestBody.repeatPassword).toBe('Jcss@!123')
  })
})

describe('truncateText', () => {
  it('未超长时原样返回', () => {
    expect(truncateText('短文本', 10)).toBe('短文本')
  })

  it('超长时截断并提示原始长度', () => {
    const result = truncateText('0123456789', 5)

    expect(result).toBe('01234\n...(已截断，原始长度 10 字符)')
  })
})
