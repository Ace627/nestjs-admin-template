import { toBoolean } from '@/utils'
import type { AxiosInstance } from 'axios'

const enableRequestProgress = toBoolean(import.meta.env.VITE_REQUEST_NPROGRESS, true)
const NProgress = useProgress({ show: enableRequestProgress })

/**
 * NProgress 进度条拦截器
 * 请求发起时开启顶部进度条，响应完成或失败时结束
 * @param instance Axios 实例
 */
export function requestProgressInterceptor(instance: AxiosInstance) {
  // 请求拦截：请求发起时开启顶部进度条
  instance.interceptors.request.use((config) => {
    NProgress.start()
    return config
  })

  // 响应拦截：请求完成或失败时结束顶部进度条
  instance.interceptors.response.use(
    (response) => {
      NProgress.done()
      return response
    },
    (error) => {
      NProgress.done()
      return Promise.reject(error)
    },
  )
}
