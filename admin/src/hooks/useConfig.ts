import { ConfigRequest } from '@/api/system/config.request'

/**
 * 系统参数读取 hook：`const initPassword = useConfig('sys.user.initPassword', '123456')`
 * - 返回响应式参数值：初始为默认值，参数加载成功后自动替换
 * - 不做前端缓存，缓存职责在后端 Redis
 * - 参数缺失、接口报错或无权限时保持默认值（默认值即 fail-safe 兜底，静默回退不抛错）
 */
export function useConfig(configKey: string, defaultValue: string): Ref<string> {
  const value = ref<string>(defaultValue)

  ConfigRequest.findValueByKey({ configKey })
    .then((result) => {
      if (result !== null && result !== '') value.value = result
    })
    .catch((error: unknown) => {
      const errMsg = error instanceof Error ? error.message : String(error)
      console.log('useConfig errMsg: ', errMsg)
    })

  return value
}
