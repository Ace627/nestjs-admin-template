import { DictRequest } from '@/api/system/dict.request'
import type { Dict } from '@/types'

/** 字典选项：在 Dict.DataItem 基础上扩展通用 label/value，可直接喂给 el-select / el-radio-group */
export interface DictSelectItem extends Dict.DataItem {
  label: string
  value: string
}

// 模块级全局缓存：跨组件共享，避免重复请求
const dictCache: Record<string, DictSelectItem[]> = {}
// 进行中的请求：同一类型并发请求时复用同一个 Promise
const pendingRequests: Record<string, Promise<Dict.DataItem[]> | undefined> = {}

/** 补充通用 label/value 字段（dictLabel/dictValue 保留不动，DictTag 依赖原始字段匹配） */
function formatDictItem(item: Dict.DataItem): DictSelectItem {
  return { ...item, label: item.dictLabel, value: item.dictValue }
}

/** 清空前端字典缓存（配合后端「刷新缓存」端点使用） */
export function resetDictCache(): void {
  for (const key of Object.keys(dictCache)) delete dictCache[key]
}

/**
 * 多字典加载 hook：`const { sys_normal_disable, sys_user_sex } = useDict('sys_normal_disable', 'sys_user_sex')`
 * 返回各字典类型的响应式选项数组（键名强类型推导）
 */
export function useDict<T extends string[]>(...dictTypes: T) {
  const dictData = reactive<Record<string, DictSelectItem[]>>({})

  // 初始化：已有全局缓存先同步，避免空数组覆盖导致闪空
  for (const dictType of dictTypes) dictData[dictType] = dictCache[dictType] ?? []

  async function getDictData(dictType: string) {
    try {
      // 已有缓存：直接返回
      if (dictCache[dictType]) return
      // 正在请求中：复用已有 Promise，等第一个请求跑完再从全局缓存同步
      if (pendingRequests[dictType]) {
        await pendingRequests[dictType]
        dictData[dictType] = dictCache[dictType] ?? []
        return
      }
      // 新请求：创建并存储 Promise 后等待
      const pending = DictRequest.findByType({ dictType })
      pendingRequests[dictType] = pending
      dictData[dictType] = (await pending).map(formatDictItem)
      dictCache[dictType] = dictData[dictType]
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error)
      console.log('useDict errMsg: ', errMsg)
      dictData[dictType] = []
      return Promise.reject(error)
    } finally {
      delete pendingRequests[dictType]
    }
  }

  Promise.allSettled(dictTypes.map((type) => getDictData(type)))

  return toRefs(dictData) as { [K in T[number]]: Ref<DictSelectItem[]> }
}
