import type { Auth } from '@/types'
import { AuthRequest } from '@/api/auth.request'
import { removeTokenPair, resolveFileUrl, setTokenPair } from '@/utils'
import defaultAvatar from '@/assets/images/default-avatar.jpg'

export const useUserStore = defineStore('user', () => {
  const tagsViewStore = useTagsViewStore()

  /** 登录者的信息 */
  const currentUserInfo = ref({} as Auth.CurrentUserInfo['user'])
  /** 角色列表 */
  const roles = ref<string[]>([])
  /** 权限列表 */
  const permissions = ref<string[]>([])
  /** 用户头像 */
  const avatar = computed(() => resolveFileUrl(currentUserInfo.value.avatar) || defaultAvatar)

  /** 登录 */
  async function login(LoginForm: Auth.LoginParams) {
    const data = await AuthRequest.login(LoginForm)
    setTokenPair(data)
  }

  /** 获取登录者信息 */
  async function getInfo() {
    const data = await AuthRequest.getInfo()
    currentUserInfo.value = data.user
    roles.value = data.roles
    permissions.value = data.permissions
  }

  /** 退出登录 */
  async function logout() {
    try {
      await AuthRequest.logout()
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error)
      console.error('退出登录失败:', errMsg)
    } finally {
      removeTokenPair()
      tagsViewStore.clear()
    }
  }

  return { avatar, currentUserInfo, roles, permissions, login, getInfo, logout }
})
