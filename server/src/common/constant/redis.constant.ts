/**
 * Redis 常量对象
 * @description 统一管理 Redis 相关常量，确保 Redis 键名规范统一，便于维护与排查 Redis 相关问题
 */
export const RedisConstant = {
  /**
   * 验证码缓存键
   * 用于存储验证码信息的 Redis 键，值为 'captcha:img'
   */
  CAPTCHA_KEY: 'captcha:img',

  /**
   * 访问令牌缓存键
   * 用于存储访问令牌的 Redis 键，值为 'token:access'
   */
  ACCESS_TOKEN_KEY: 'token:access',

  /**
   * 用户在线状态缓存 Key 前缀
   * 拼接用户 ID/用户名形成唯一缓存 Key，格式为「user:online:userId」，用于记录用户在线状态
   */
  ADMIN_USER_ONLINE_KEY: 'user:online',

  /**
   * 用户角色缓存 Key 前缀
   * 拼接用户 ID 形成唯一缓存 Key，格式为「user:roles:userId」，用于缓存用户关联的角色信息
   */
  ADMIN_USER_ROLES: 'user:roles',

  /**
   * 字典缓存 Key 前缀
   * 拼接字典类型编码形成唯一缓存 Key，格式为「system:dict:dictTypeCode」，用于缓存系统字典数据
   */
  DICTTYPE_KEY: 'system:dict',

  /**
   * 用户归属部门缓存 Key 前缀
   * 拼接用户 ID 形成唯一缓存 Key，格式为「user:depts:userId」，缓存用户主部门 ID（数据权限拦截器消费）
   */
  ADMIN_USER_DEPTS: 'user:depts',

  /**
   * 角色权限标识缓存 Key 前缀（角色级）
   * 拼接角色 ID 形成唯一缓存 Key，格式为「sys:role:perms:roleId」，缓存该角色全部按钮权限标识
   * @note 角色级缓存：失效点极少（仅角色授权/菜单变更），避免按用户反查失效
   */
  ROLE_PERMISSIONS: 'sys:role:perms',

  /**
   * 角色数据范围缓存 Key 前缀（角色级）
   * 拼接角色 ID 形成唯一缓存 Key，格式为「sys:role:depts:roleId」，缓存该角色可见部门 ID 集合
   */
  ROLE_DATA_SCOPE: 'sys:role:depts',

  /**
   * 部门树全量缓存 Key
   * 缓存全量部门列表（含 ancestors），用于内存计算子孙部门集合
   */
  SYS_DEPT_TREE: 'sys:dept:tree',

  /**
   * 系统参数缓存键前缀（参数管理）
   * 拼接参数键名形成唯一缓存 Key，格式为「sys:config:configKey」，键值为参数键值字符串
   */
  SYS_CONFIG_KEY: 'sys:config',

  /**
   * 防重复提交缓存键前缀
   * 用于存储防重复提交信息的 Redis 键前缀，值为 'repeat:submit'
   */
  REPEAT_SUBMIT_KEY: 'repeat:submit',

  /**
   * 响应缓存键前缀
   * 用于存储响应缓存的 Redis 键前缀，值为 'response:cache'
   */
  RESPONSE_CACHE: 'response:cache',

  /**
   * 限流键前缀
   * 用于存储限流信息的 Redis 键前缀，值为 'throttle:limit'
   */
  THROTTLE_LIMIT: 'throttle:limit',

  /**
   * 登录失败计数键前缀
   * 拼接用户名形成唯一缓存 Key，格式为「login:fail:username」，键值为窗口期内密码错误次数，
   * 次数达到阈值即视同账号锁定，TTL 到期自动解锁
   */
  LOGIN_FAIL_COUNT: 'login:fail',
}
