import { sep, resolve } from 'node:path'
import { BusinessException } from '@/common'

/**
 * 将子路径解析到指定目录内，并拒绝任何逃逸（`..`、绝对路径等）
 * @description 客户端传入的分片序号/哈希只允许拼在受控目录下，解析结果必须仍以 baseDirectory + 分隔符开头
 */
export function resolveInsideDirectory(baseDirectory: string, childName: string): string {
  const targetPath = resolve(baseDirectory, childName)
  if (!targetPath.startsWith(`${baseDirectory}${sep}`)) throw new BusinessException('非法的文件路径')
  return targetPath
}

/**
 * 从分片文件名中解析分片序号
 * @description 兼容历史命名（`序号-哈希`）与现行命名（纯序号），无法解析时返回 null
 */
export function extractPartNumber(fileName: string): number | null {
  const matched = /^(\d+)/.exec(fileName)
  if (!matched) return null
  const partNumber = Number(matched[1])
  return Number.isSafeInteger(partNumber) ? partNumber : null
}

/**
 * 找出 0..totalChunks-1 中缺失的分片序号
 * @description 越界序号（>= totalChunks 或负数）视为多余分片，不参与缺失判断
 */
export function findMissingPartNumbers(partNumbers: number[], totalChunks: number): number[] {
  const presentPartNumbers = new Set(partNumbers.filter((partNumber) => partNumber >= 0 && partNumber < totalChunks))
  const missingPartNumbers: number[] = []
  for (let partNumber = 0; partNumber < totalChunks; partNumber += 1) {
    if (!presentPartNumbers.has(partNumber)) missingPartNumbers.push(partNumber)
  }
  return missingPartNumbers
}
