import { AuthRequest } from '@/api/auth.request'
import { TipModal, getRefreshToken, removeTokenPair, setTokenPair, sleep } from '@/utils'
import { AxiosError, HttpStatusCode, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'

/** 刷新令牌接口路径（该请求自身的 401 不再触发刷新，直接清场） */
const REFRESH_URL = '/auth/refreshToken'

/** 并发清场只处理一次（弹一次提示、刷新一次页面），其余静默 reject */
let isHandlingUnauthorized = false

/** 进行中的刷新令牌请求（并发 401 共享同一次刷新，null 表示当前无刷新） */
let refreshingPromise: Promise<boolean> | null = null

/** 重放请求的配置标记（重放后仍 401 直接清场，防止死循环） */
type RetryConfig = InternalAxiosRequestConfig & { _isRetry?: boolean }

/** 清场回登录页（单次执行：提示 + 清双 token + 刷新页面） */
async function redirectToLogin(message: string) {
  if (isHandlingUnauthorized) return
  isHandlingUnauthorized = true
  TipModal.msgError(message, { duration: 1.5 * 1000 })
  await sleep(1500)
  removeTokenPair()
  window.location.reload()
}

export function tokenRefreshInterceptor(instance: AxiosInstance) {
  instance.interceptors.response.use(undefined, async (error: AxiosError<ApiResponse>) => {
    // 状态码提取与响应错误拦截器同口径（业务错误以普通对象 reject 时无 response.status，从 message 兜底解析）
    let status = error?.response?.status ?? -1
    const rawMessage = error?.message ?? ''
    if (status === -1 && rawMessage.includes('Request failed with status code')) status = parseInt(rawMessage.slice(-3))
    if (status !== HttpStatusCode.Unauthorized) return Promise.reject(error)

    // 刷新一次令牌：成功更新双 token 返回 true；无 refreshToken 或刷新失败返回 false
    const refreshOnce = async (): Promise<boolean> => {
      const refreshToken = getRefreshToken()
      if (!refreshToken) return false
      try {
        setTokenPair(await AuthRequest.refreshToken({ refreshToken }))
        return true
      } catch {
        return false
      }
    }

    const config = error.config as RetryConfig | undefined
    if (config && config.url !== REFRESH_URL && !config._isRetry) {
      // 并发 401 共享同一次刷新（只发一次请求），结束后清空标记
      if (!refreshingPromise) {
        refreshingPromise = refreshOnce().finally(() => (refreshingPromise = null))
      }
      if (await refreshingPromise) {
        config._isRetry = true
        // 重放走完整请求拦截器，jwt-auth 会实时读取新的 accessToken
        return instance.request(config)
      }
    }

    // 刷新无望（无 refreshToken / 刷新失败 / 重放仍 401 / 刷新接口自身 401）：清场回登录页
    const message = error?.response?.data?.message || '登录已过期，请重新登录'
    await redirectToLogin(message)
    return Promise.reject(error)
  })
}
