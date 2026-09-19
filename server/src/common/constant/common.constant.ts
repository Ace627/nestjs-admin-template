/**
 * 公共常量类
 * - 说明：定义项目中常用的常量，如 HTTP 授权请求头字段名、JWT 令牌前缀等
 * - 用途：在项目中统一使用，避免重复定义和错误使用
 */
export const CommonConstant = {
  /**
   * 开发环境
   * 本地开发与调试时使用的环境标识
   */
  DEVELOPMENT: 'development',

  /**
   * 生产环境
   * 项目正式部署、对外提供服务时使用的环境标识
   */
  PRODUCTION: 'production',

  /**
   * 默认的父级菜单编号
   * 菜单创建时默认的上级菜单ID，用于根菜单/一级菜单的父级标识
   */
  DEFAULT_PARENT_ID: '0',

  /**
   * 种子管理员用户固定 ID
   * @deprecated 仅作为初始化种子数据的一致性锚点，禁止用于任何鉴权判定
   * （超管判定一律使用 RbacConstant.SUPER_ROLE_CODE，即 roleCode === 'admin'）
   */
  ADMIN_USER_ID: '866b0232-507b-42a4-bdc1-47fc4a83616a',

  /**
   * HTTP 授权请求头字段名
   * 前端传递JWT令牌的请求头关键字，用于接口鉴权时提取令牌信息
   */
  AUTHORIZATION: 'authorization',

  /**
   * JWT 令牌前缀
   * 配合Authorization请求头使用，标识令牌类型，格式为「Bearer + 令牌字符串」
   */
  TOKEN_PREFIX: 'Bearer',

  /**
   * JWT载荷中用户信息的存储键名
   * JWT令牌载荷内存放用户核心身份信息的键，用于解析令牌时获取用户数据
   */
  JWT_PAYLOAD: 'user',

  /**
   * 请求 ID键名
   * 用于在请求上下文存储和传递请求 ID，方便日志记录和调试
   */
  REQUEST_ID: 'requestId',

  /**
   * 请求 ID请求头字段名
   * 用于在响应头中传递请求 ID，方便客户端识别和关联请求
   */
  REQUEST_ID_HEADER: 'X-Request-Id',

  /**
   * 请求开始时间键名
   * 用于在请求上下文存储请求进入时刻，供响应耗时（duration）统计使用
   */
  REQUEST_START_TIME: 'X-Request-StartTime',

  /**
   * 全局通用状态：正常/启用
   * 所有业务表的 status 字段通用，值为 '1'
   */
  STATUS_NORMAL: '1',

  /**
   * 全局通用状态：禁用/停用
   * 所有业务表的 status 字段通用，值为 '0'
   */
  STATUS_DISABLE: '0',

  /**
   * 参数系统内置标识
   * sys_config.config_type 为 Y 表示代码引用的内置参数，禁止删除与修改键名
   */
  CONFIG_TYPE_BUILTIN: 'Y',

  /**
   * 参数非内置标识
   * sys_config.config_type 为 N 表示业务自定义参数，可自由增删改
   */
  CONFIG_TYPE_CUSTOM: 'N',

  /**
   * 验证码开关参数键名
   * sys_config 内置参数，控制登录页是否显示与校验图形验证码；参数缺失时后端默认开启（fail-safe）
   */
  CAPTCHA_ENABLED_CONFIG_KEY: 'sys.account.captchaEnabled',

  /** 登录失败锁定阈值参数键名（默认 5 次） */
  MAX_FAIL_COUNT_CONFIG_KEY: 'sys.account.maxFailCount',

  /** 账号锁定时长参数键名，单位秒（默认 1800） */
  LOCK_SECONDS_CONFIG_KEY: 'sys.account.lockSeconds',
}
