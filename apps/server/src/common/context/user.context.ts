import type { AuthType } from '@/types'
import { AsyncLocalStorage } from 'async_hooks'

/**
 * 登录用户上下文
 * 用于在 Service / Entity 监听器中获取当前登录用户的 username
 */
export class UserContext {
  private static readonly storage = new AsyncLocalStorage<AuthType.JwtPayload | undefined>()

  /**
   * 设置当前登录用户
   */
  static setCurrentUser(username: string): void {
    const store = this.storage.getStore() ?? ({} as AuthType.JwtPayload)
    store.username = username
    this.storage.enterWith(store)
  }

  /**
   * 获取当前登录用户名
   * 取不到时返回 admin（兜底）
   */
  static getCurrentUsername(): string {
    return this.storage.getStore()?.username ?? 'admin'
  }
}
