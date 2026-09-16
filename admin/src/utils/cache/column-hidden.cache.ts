import { StorageCache } from '../storage-cache'

const CACHE_KEY_PREFIX = 'columnHidden:'

/** 写入列显隐记忆（隐藏列 key 数组，storageKey 为页面标识） */
export function setColumnHidden(storageKey: string, hiddenColumnKeys: string[]): void {
  StorageCache.set(CACHE_KEY_PREFIX + storageKey, hiddenColumnKeys)
}

/** 读取列显隐记忆，不存在时返回 null */
export function getColumnHidden(storageKey: string): string[] | null {
  return StorageCache.get<string[]>(CACHE_KEY_PREFIX + storageKey)
}

/** 移除列显隐记忆 */
export function removeColumnHidden(storageKey: string): void {
  StorageCache.remove(CACHE_KEY_PREFIX + storageKey)
}
