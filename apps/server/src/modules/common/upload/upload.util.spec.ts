import { sep, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { extractPartNumber, findMissingPartNumbers, resolveInsideDirectory } from './upload.util'

const UPLOAD_DIR_PATH = resolve(process.cwd(), 'uploads')

describe('resolveInsideDirectory', () => {
  it('普通子路径拼接后仍在根目录内', () => {
    expect(resolveInsideDirectory(UPLOAD_DIR_PATH, 'a.txt')).toBe(`${UPLOAD_DIR_PATH}${sep}a.txt`)
  })

  it('多级子目录正常拼接', () => {
    expect(resolveInsideDirectory(UPLOAD_DIR_PATH, `abc${sep}def.txt`)).toBe(`${UPLOAD_DIR_PATH}${sep}abc${sep}def.txt`)
  })

  it('拒绝 .. 逃逸', () => {
    expect(() => resolveInsideDirectory(UPLOAD_DIR_PATH, '../etc/passwd')).toThrow('非法的文件路径')
    expect(() => resolveInsideDirectory(UPLOAD_DIR_PATH, 'abc/../../../etc/passwd')).toThrow('非法的文件路径')
  })

  it('拒绝绝对路径', () => {
    expect(() => resolveInsideDirectory(UPLOAD_DIR_PATH, '/etc/passwd')).toThrow('非法的文件路径')
  })

  it('拒绝解析结果等于根目录本身', () => {
    expect(() => resolveInsideDirectory(UPLOAD_DIR_PATH, '.')).toThrow('非法的文件路径')
  })
})

describe('extractPartNumber', () => {
  it('纯序号文件名返回对应序号', () => {
    expect(extractPartNumber('0')).toBe(0)
    expect(extractPartNumber('12')).toBe(12)
  })

  it('兼容历史「序号-哈希」命名', () => {
    expect(extractPartNumber('3-abcd1234')).toBe(3)
  })

  it('非数字开头返回 null', () => {
    expect(extractPartNumber('abc')).toBeNull()
    expect(extractPartNumber('')).toBeNull()
    expect(extractPartNumber('-1')).toBeNull()
  })

  it('超出安全整数范围返回 null', () => {
    expect(extractPartNumber('99999999999999999999')).toBeNull()
  })
})

describe('findMissingPartNumbers', () => {
  it('分片齐全返回空数组', () => {
    expect(findMissingPartNumbers([2, 0, 1], 3)).toEqual([])
  })

  it('返回缺失序号并按升序排列', () => {
    expect(findMissingPartNumbers([0, 2], 3)).toEqual([1])
    expect(findMissingPartNumbers([0, 5], 4)).toEqual([1, 2, 3])
  })

  it('没有任何分片时全部缺失', () => {
    expect(findMissingPartNumbers([], 2)).toEqual([0, 1])
  })

  it('忽略越界与重复序号', () => {
    expect(findMissingPartNumbers([0, 1, 1, 9], 2)).toEqual([])
  })
})
