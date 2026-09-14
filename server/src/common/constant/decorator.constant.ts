/**
 * 装饰器常量对象
 * @description 统一管理系统装饰器相关常量，确保装饰器命名规范统一，便于维护与排查装饰器相关问题
 */
export const DecoratorConstant = {
  /**
   * 公开接口装饰器标识
   * 用于标记不需要进行认证的公开接口，值为 'common:response:public'
   */
  PUBLIC: 'common:response:public',

  /**
   * 操作日志装饰器标识
   * 用于标记需要记录操作日志的接口，值为 'common:operlog'
   */
  OPERLOG: 'common:operlog',

  /**
   * Excel 导出装饰器标识
   * 用于标记需要导出 Excel 文件的接口，值为 'excel:option:list'
   */
  EXCEL: 'excel:option:list',

  /**
   * 角色装饰器标识
   * 用于标记需要进行角色校验的接口，值为 'common:auth:roles'
   */
  ROLES: 'common:auth:roles',

  /**
   * 权限装饰器标识
   * 用于标记需要进行权限校验的接口，值为 'common:auth:permissions'
   */
  PERMISSIONS: 'common:auth:permissions',

  /**
   * 数据权限装饰器标识
   * 用于标记需要按部门数据范围过滤查询结果的接口，值为 'common:auth:dataScope'
   */
  DATA_SCOPE: 'common:auth:dataScope',

  /**
   * 重复提交装饰器标识
   * 用于标记需要进行重复提交校验的接口，值为 'common:request:repeatSubmit'
   */
  REPEAT_SUBMIT: 'common:request:repeatSubmit',

  /**
   * 跳过响应转换装饰器标识
   * 用于标记不需要进行响应转换的接口，值为 'common:response:skip'
   */
  SKIP_TRANSFORM: 'common:response:skip',

  /**
   * 跳过限流装饰器标识
   * 用于标记不需要进行限流的接口，值为 'common:request:skipThrottle'
   */
  SKIP_THROTTLE: 'common:request:skipThrottle',

  /**
   * 响应缓存装饰器标识
   * 用于标记需要进行响应缓存的接口，值为 'common:response:cache'
   */
  RESPONSE_CACHE: 'common:response:cache',
}
