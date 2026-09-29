#!/usr/bin/env node
/**
 * Apipost 接口文档同步脚本（本项目专用，apipost-doc-sync skill 资源）
 *
 * 用法：
 *   node sync-openapi.mjs                     # 无基线：从 DEFS 全量生成完整文档
 *   node sync-openapi.mjs <apipost导出json>   # 有基线：幂等合并（已存在 path+method 跳过，--force 覆盖）
 *   --force                                   # 合并模式下覆盖已存在端点
 *
 * 输出：统一写入项目根目录 接口文档_YYYYMMDDHHmmss.json（不改动基线文件本身）
 *
 * 维护方式：端点定义只写在下方 DEFS 区（按文件内示例格式追加），
 * helper 区勿动。执行后脚本自动校验并打印操作数统计。
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..')
const BASE = process.argv.slice(2).find((arg) => !arg.startsWith('--')) || null
const FORCE = process.argv.includes('--force')

/* ----------------------------- 常量 ----------------------------- */
const USER_NAME = '当时只道是寻常'
const REQUEST_ID = '909008bf-18b2-48e0-8a9c-9a99b3a9926a'
const now = new Date()
const pad = (n) => String(n).padStart(2, '0')
const UPDATED_AT = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}+08:00`
const hexId = () => crypto.randomBytes(8).toString('hex').slice(0, 15)

/* ----------------------------- schema helper（勿动） ----------------------------- */
const str = (example, description) => ({ type: 'string', example, ...(description ? { description } : {}) })
const int = (example, description) => ({ type: 'integer', example, ...(description ? { description } : {}) })
const bool = (example) => ({ type: 'boolean', example })
const nul = () => ({ type: 'null' })
const obj = (properties) => ({ type: 'object', required: Object.keys(properties), properties })
const arr = (items) => ({ type: 'array', items })
const page = (itemProperties, total) => ({
  type: 'object',
  required: ['total', 'records'],
  properties: { total: int(total, '总条数'), records: { type: 'array', items: { type: 'object', properties: itemProperties } } },
})
/** BaseEntity 公共五字段（各实体 props 展开用） */
const base5 = () => ({
  createTime: str('2026-09-04 18:58:40'),
  updateTime: str('2026-09-04 19:02:11'),
  deleteTime: nul(),
  createBy: str('admin'),
  updateBy: str('admin'),
})

const q = (name, description, example = '') => ({ name, in: 'query', description, required: false, example, schema: { type: 'string' } })
const qReq = (name, description, example) => ({ name, in: 'query', description, required: true, example, schema: { type: 'string' } })
/* 分页参数文档口径恒为必填（前端明传；后端 PaginationDto 实际可选、缺省取默认值，属兼容行为不写入文档） */
const pageParams = () => [
  { name: 'pageNo', in: 'query', description: '当前页码数', required: true, example: '1', schema: { type: 'string' } },
  { name: 'pageSize', in: 'query', description: '当前页显示的条目数', required: true, example: '10', schema: { type: 'string' } },
]
const jsonBody = (data) => ({ content: { 'application/json': { schema: { type: 'object' }, example: JSON.stringify(data, null, '\t') } } })
const multipartBody = (properties) => ({ content: { 'multipart/form-data': { schema: { type: 'object', properties } } } })

const okResponse = (dataSchema, dataExample) => ({
  description: '成功',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        required: ['code', 'message', 'requestId', 'data', 'timestamp', 'duration'],
        properties: {
          code: int(200, '响应状态码'),
          message: str('请求成功', '响应描述'),
          requestId: str(REQUEST_ID, '请求标识'),
          data: dataSchema,
          timestamp: int(1789193000000, '响应时间戳'),
          duration: int(12, '响应耗时'),
        },
      },
      example: JSON.stringify({ code: 200, message: '请求成功', requestId: REQUEST_ID, data: dataExample, timestamp: 1789193000000, duration: 12 }, null, '\t'),
    },
  },
})
const failResponse = () => ({ description: '失败', content: { 'application/json': { schema: { type: 'object', properties: {} }, example: '' } } })
const binaryResponse = () => ({
  200: { description: '成功', content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } } },
  404: failResponse(),
})

/* ----------------------------- 实体 props 复用（DEFS 区内通用） ----------------------------- */
const userProps = () => ({
  ...base5(),
  id: str('866b0232-507b-42a4-bdc1-47fc4a83616a'),
  username: str('admin'),
  password: str('$argon2id$v=19$m=65536,t=3,p=4$emlwemlw$ZGVtb2hhc2g', '密码（argon2 哈希）'),
  phone: str('15888888888'),
  nickname: str('管理员'),
  email: str('admin@example.com'),
  status: str('1', '状态（1正常 0停用）'),
  gender: str('1', '性别（1男 2女 3未知）'),
  age: int(30, '年龄'),
  remark: nul(),
  deptId: str('d2c17a9e-8e3c-4f9a-9f2a-6b7c8d9e0f1a', '归属部门ID（0 表示未分配）'),
  avatar: nul(),
  loginTime: str('2026-09-15 09:30:00', '最后登录时间'),
})
/** getInfo 返回的 user（已剔除 password/deleteTime/roles） */
const safeUserProps = () => {
  const { password, deleteTime, ...rest } = userProps()
  return rest
}
const roleProps = () => ({
  ...base5(),
  id: str('1967a8c5-63e4-4c2c-9902-2c7c32e365b3'),
  roleCode: str('common', '角色编码'),
  roleName: str('普通角色'),
  roleSort: int(1, '角色排序'),
  dataScope: str('4', '数据范围（1全部 2自定义 3本部门 4本部门及以下 5仅本人）'),
  status: str('1', '状态（1正常 0停用）'),
  remark: nul(),
})
const menuProps = () => ({
  ...base5(),
  id: str('3a1b2c3d-4e5f-4a6b-8c9d-0e1f2a3b4c5d'),
  parentId: str('0', '上级菜单（0 表示根节点）'),
  path: str('user', '路由地址'),
  component: str('system/user/index', '组件路径'),
  menuType: str('C', '类型（M目录 C菜单 F按钮）'),
  icon: str('user', '菜单图标'),
  menuName: str('用户管理'),
  visible: str('1', '是否可见（1显示 0隐藏）'),
  permission: nul(),
  status: str('1', '状态（1正常 0停用）'),
  menuSort: int(1, '显示顺序'),
  isCache: str('0', '是否缓存组件（1缓存 0不缓存）'),
})
const deptProps = () => ({
  ...base5(),
  id: str('d2c17a9e-8e3c-4f9a-9f2a-6b7c8d9e0f1a'),
  parentId: str('0', '父部门ID（0 表示根部门）'),
  ancestors: str('0', '祖级列表'),
  deptName: str('研发部门'),
  leader: str('张三', '负责人'),
  phone: str('13800138000'),
  email: str('dev@example.com'),
  deptSort: int(1, '显示顺序'),
  status: str('1', '状态（1正常 0停用）'),
})
const dictTypeProps = () => ({
  ...base5(),
  id: str('7c6d5e4f-3a2b-4c1d-9e8f-0a1b2c3d4e5f'),
  dictName: str('用户性别'),
  dictType: str('sys_user_sex'),
  status: str('1', '状态（1正常 0停用）'),
  remark: nul(),
})
const dictDataProps = () => ({
  ...base5(),
  id: str('9a8b7c6d-5e4f-4a3b-2c1d-0e9f8a7b6c5d'),
  dictLabel: str('男'),
  dictValue: str('1'),
  dictSort: int(1, '排序'),
  dictType: str('sys_user_sex'),
  listClass: str('primary', '表格回显样式'),
  status: str('1', '状态（1正常 0停用）'),
  remark: nul(),
})
const configProps = () => ({
  ...base5(),
  id: str('52700ffd-f68f-4233-abcf-cf93273a7ca0'),
  configName: str('用户管理-账号初始密码'),
  configKey: str('sys.user.initPassword'),
  configValue: str('123456', '参数键值（统一存字符串，业务侧自行转换类型）'),
  configType: str('Y', '系统内置（Y内置 N非内置，内置参数禁止删除与改键名）'),
  remark: str('初始化密码 123456'),
})
const jobProps = () => ({
  ...base5(),
  id: str('5a4b3c2d-1e0f-4a5b-8c7d-6e5f4a3b2c1d'),
  jobName: str('示例任务'),
  jobGroup: str('DEFAULT', '任务组名'),
  invokeTarget: str('JobService.test()', '调用目标字符串（格式：Service.method(参数)）'),
  cronExpression: str('0 0/1 * * * ?', 'cron执行表达式'),
  misfirePolicy: str('3', '计划执行错误策略（1立即执行 2执行一次 3放弃执行）'),
  concurrent: str('0', '是否并发执行（1允许 0禁止）'),
  status: str('1', '任务状态（1正常 0暂停）'),
})
const jobLogProps = () => ({
  id: str('6b5a4c3d-2e1f-4b0a-9c8d-7e6f5a4b3c2d'),
  jobName: str('示例任务'),
  jobGroup: str('DEFAULT'),
  invokeTarget: str('JobService.test()'),
  jobMessage: str('执行成功', '日志信息'),
  status: str('1', '执行状态（1正常 0失败）'),
  createTime: str('2026-09-15 09:30:00', '执行时间'),
})
const loginlogProps = () => ({
  id: str('2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e'),
  username: str('admin', '用户账号'),
  userId: str('866b0232-507b-42a4-bdc1-47fc4a83616a', '用户ID（登录失败为 null）'),
  ip: str('127.0.0.1'),
  location: str('内网', '登录地点'),
  browser: str('Chrome 130'),
  os: str('Windows 10'),
  status: str('1', '登录状态（1成功 0失败）'),
  message: str('登录成功', '提示消息'),
  loginTime: str('2026-09-15 09:30:00'),
  requestId: str(REQUEST_ID),
})
const operlogProps = () => ({
  id: str('4d5e6f7a-8b9c-4d0e-af1b-2c3d4e5f6a7b'),
  title: str('用户管理', '模块标题'),
  username: str('admin', '操作人员'),
  userId: str('866b0232-507b-42a4-bdc1-47fc4a83616a', '操作人员ID'),
  method: str('UserController.create', '方法名称'),
  requestMethod: str('POST', '请求方式'),
  params: str('{"username":"zhangsan"}', '请求参数'),
  url: str('/api/system/user/create', '请求接口'),
  ip: str('127.0.0.1'),
  location: str('内网', '请求地址'),
  businessType: str('1', '操作类型（1新增 2修改 3删除等，见 sys_oper_type 字典）'),
  status: str('1', '操作状态（1正常 0异常）'),
  operTime: str('2026-09-15 09:30:00'),
  duration: int(45, '请求耗时（毫秒）'),
  requestId: str(REQUEST_ID),
})
/** terminus HealthCheckResult（database/memory/rss/storage/network/checkAll） */
const healthResultSchema = () => ({
  status: str('ok', '整体状态（ok/error）'),
  info: { type: 'object', description: '健康项明细' },
  error: { type: 'object', description: '异常项明细' },
  details: { type: 'object', description: '全部检查项明细' },
})
const healthResultExample = { status: 'ok', info: { database: { status: 'up' } }, error: {}, details: { database: { status: 'up' } } }

/* ----------------------------- DEFS（端点定义区，在此追加） ----------------------------- */
/* 每条 def 字段：
 * path/method/tag/sort/summary/desc               基础信息（summary = 纯汉字且最多 8 字的接口名，禁标点/字母/数字；补充语义放 desc，写入文档 description）
 * params: [q(...)/qReq(...)/pageParams()...]      query 参数
 * body: jsonBody({...})/multipartBody({...})      请求体
 * data + example                                  统一 envelope 的 data schema 与真实示例
 * raw200: true                                    二进制流响应（导出接口），省略 data/example
 */
const defs = [
  /* ----------------------------- 鉴权管理（auth，6 端点） ----------------------------- */
  {
    path: '/auth/captcha', method: 'get', tag: '鉴权管理', sort: 1000, summary: '获取图片验证码',
    desc: '实时读取参数开关，关闭时不生成图片，仅返回 enabled 标识（uuid/captcha 为空串）',
    data: obj({ enabled: bool(true, '验证码开关（实时读取参数 sys.account.captchaEnabled）'), uuid: str('8f1e2a10-6f10-4c10-8a10-1e2f3a4b5c01', '验证码唯一标识，登录时回传'), captcha: str('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciL', 'base64 图片，img 标签可直接渲染，有效期 60 秒') }),
    example: { enabled: true, uuid: '8f1e2a10-6f10-4c10-8a10-1e2f3a4b5c01', captcha: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciL' },
  },
  {
    path: '/auth/login', method: 'post', tag: '鉴权管理', sort: 2000, summary: '用户登录',
    body: jsonBody({ username: 'admin', password: '123456', captcha: '3', uuid: '8f1e2a10-6f10-4c10-8a10-1e2f3a4b5c01' }),
    data: obj({ accessToken: str('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4NjZiMDIzMi01MDdiLTQyYTQtYmRjMS00N2ZjNGE4MzYxNmEiLCJ1c2VybmFtZSI6ImFkbWluIiwidXVpZCI6IjMwZTBiZjkwLTI0ZmItNDcwMC05NjkwLTA2YzZkZjM4YzQ0YiJ9.dQw4w9WgXcQ', '访问令牌'), refreshToken: str('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4NjZiMDIzMi01MDdiLTQyYTQtYmRjMS00N2ZjNGE4MzYxNmEiLCJ1c2VybmFtZSI6ImFkbWluIiwidXVpZCI6IjMwZTBiZjkwLTI0ZmItNDcwMC05NjkwLTA2YzZkZjM4YzQ0YiIsInR5cGUiOiJyZWZyZXNoIiwianRpIjoiMmFhYzQ1NjctYjg5ZS00Y2RmLThmZWItMWQyZTM0NTY3ODkwIn0.xYz4w9WgXcQ', '刷新令牌，用于向服务端换取新的访问令牌'), expiresIn: int(1800, '访问令牌有效期（秒）') }),
    example: { accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4NjZiMDIzMi01MDdiLTQyYTQtYmRjMS00N2ZjNGE4MzYxNmEiLCJ1c2VybmFtZSI6ImFkbWluIiwidXVpZCI6IjMwZTBiZjkwLTI0ZmItNDcwMC05NjkwLTA2YzZkZjM4YzQ0YiJ9.dQw4w9WgXcQ', refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4NjZiMDIzMi01MDdiLTQyYTQtYmRjMS00N2ZjNGE4MzYxNmEiLCJ1c2VybmFtZSI6ImFkbWluIiwidXVpZCI6IjMwZTBiZjkwLTI0ZmItNDcwMC05NjkwLTA2YzZkZjM4YzQ0YiIsInR5cGUiOiJyZWZyZXNoIiwianRpIjoiMmFhYzQ1NjctYjg5ZS00Y2RmLThmZWItMWQyZTM0NTY3ODkwIn0.xYz4w9WgXcQ', expiresIn: 1800 },
  },
  {
    path: '/auth/refreshToken', method: 'post', tag: '鉴权管理', sort: 2500, summary: '刷新访问令牌',
    desc: '无感续期：校验 refreshToken（验签与 Redis 值比对防重放）后轮换签发新令牌对，刷新令牌有效期滑动重置 7 天，旧刷新令牌即告作废',
    body: jsonBody({ refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4NjZiMDIzMi01MDdiLTQyYTQtYmRjMS00N2ZjNGE4MzYxNmEiLCJ1c2VybmFtZSI6ImFkbWluIiwidXVpZCI6IjMwZTBiZjkwLTI0ZmItNDcwMC05NjkwLTA2YzZkZjM4YzQ0YiIsInR5cGUiOiJyZWZyZXNoIiwianRpIjoiMmFhYzQ1NjctYjg5ZS00Y2RmLThmZWItMWQyZTM0NTY3ODkwIn0.xYz4w9WgXcQ' }),
    data: obj({ accessToken: str('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4NjZiMDIzMi01MDdiLTQyYTQtYmRjMS00N2ZjNGE4MzYxNmEiLCJ1c2VybmFtZSI6ImFkbWluIiwidXVpZCI6IjMwZTBiZjkwLTI0ZmItNDcwMC05NjkwLTA2YzZkZjM4YzQ0YiJ9.dQw4w9WgXcQ', '访问令牌'), refreshToken: str('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4NjZiMDIzMi01MDdiLTQyYTQtYmRjMS00N2ZjNGE4MzYxNmEiLCJ1c2VybmFtZSI6ImFkbWluIiwidXVpZCI6IjMwZTBiZjkwLTI0ZmItNDcwMC05NjkwLTA2YzZkZjM4YzQ0YiIsInR5cGUiOiJyZWZyZXNoIiwianRpIjoiM2RkZjU2NzgtYzkwZS01ZGVmLTlhZmMtMmUzZjQ1Njc4OTAxIn0.zXw5w9WgXcQ', '轮换后的新刷新令牌，须替换客户端旧值'), expiresIn: int(1800, '访问令牌有效期（秒）') }),
    example: { accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4NjZiMDIzMi01MDdiLTQyYTQtYmRjMS00N2ZjNGE4MzYxNmEiLCJ1c2VybmFtZSI6ImFkbWluIiwidXVpZCI6IjMwZTBiZjkwLTI0ZmItNDcwMC05NjkwLTA2YzZkZjM4YzQ0YiJ9.dQw4w9WgXcQ', refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4NjZiMDIzMi01MDdiLTQyYTQtYmRjMS00N2ZjNGE4MzYxNmEiLCJ1c2VybmFtZSI6ImFkbWluIiwidXVpZCI6IjMwZTBiZjkwLTI0ZmItNDcwMC05NjkwLTA2YzZkZjM4YzQ0YiIsInR5cGUiOiJyZWZyZXNoIiwianRpIjoiM2RkZjU2NzgtYzkwZS01ZGVmLTlhZmMtMmUzZjQ1Njc4OTAxIn0.zXw5w9WgXcQ', expiresIn: 1800 },
  },
  {
    path: '/auth/getInfo', method: 'get', tag: '鉴权管理', sort: 3000, summary: '获取登录用户信息',
    data: obj({ user: obj(safeUserProps()), roles: arr(str('admin')), permissions: arr(str('system:user:create')) }),
    example: {
      user: { createTime: '2026-08-29 22:01:32', updateTime: '2026-09-12 11:52:50', createBy: 'admin', updateBy: 'admin', id: '866b0232-507b-42a4-bdc1-47fc4a83616a', username: 'admin', phone: '15888888888', nickname: '管理员', email: 'admin@example.com', status: '1', gender: '1', age: 30, remark: null, deptId: 'd2c17a9e-8e3c-4f9a-9f2a-6b7c8d9e0f1a', avatar: null, loginTime: '2026-09-15 09:30:00' },
      roles: ['admin'],
      permissions: ['system:user:create', 'system:user:update', 'monitor:server:query'],
    },
  },
  {
    path: '/auth/getRoutes', method: 'get', tag: '鉴权管理', sort: 4000, summary: '获取路由菜单',
    data: arr(obj(menuProps())),
    example: [{ createTime: '2026-08-29 22:01:32', updateTime: '2026-09-12 11:52:50', deleteTime: null, createBy: 'admin', updateBy: 'admin', id: '3a1b2c3d-4e5f-4a6b-8c9d-0e1f2a3b4c5d', parentId: '0', path: 'user', component: 'system/user/index', menuType: 'C', icon: 'user', menuName: '用户管理', visible: '1', permission: null, status: '1', menuSort: 1, isCache: '0' }],
  },
  {
    path: '/auth/logout', method: 'post', tag: '鉴权管理', sort: 5000, summary: '退出登录',
    data: str('退出登录成功'), example: '退出登录成功',
  },

  /* ----------------------------- 首页统计（dashboard，1 端点） ----------------------------- */
  {
    path: '/dashboard/statistics', method: 'get', tag: '首页统计', sort: 1000, summary: '查询首页统计', desc: '仅登录态，不挂权限码',
    data: obj({
      userCount: int(2, '用户总数'), roleCount: int(2, '角色总数'), onlineCount: int(1, '当前在线人数'), todayLoginCount: int(3, '今日登录成功次数'),
      loginTrend: arr(obj({ date: str('2026-09-15'), successCount: int(3, '登录成功次数'), failCount: int(0, '登录失败次数') })),
      operTrend: arr(obj({ date: str('2026-09-15'), count: int(5, '操作次数') })),
    }),
    example: {
      userCount: 2, roleCount: 2, onlineCount: 1, todayLoginCount: 3,
      loginTrend: [
        { date: '2026-09-14', successCount: 2, failCount: 0 },
        { date: '2026-09-15', successCount: 3, failCount: 0 },
      ],
      operTrend: [
        { date: '2026-09-14', count: 4 },
        { date: '2026-09-15', count: 5 },
      ],
    },
  },

  /* ----------------------------- 用户管理（system/user，9 端点） ----------------------------- */
  {
    path: '/system/user/create', method: 'post', tag: '用户管理', sort: 1000, summary: '新建用户',
    body: jsonBody({ username: 'zhangsan', password: '123456', roleIds: ['1967a8c5-63e4-4c2c-9902-2c7c32e365b3'], deptId: 'd2c17a9e-8e3c-4f9a-9f2a-6b7c8d9e0f1a', nickname: '张三', age: 25, status: '1', email: 'zhangsan@example.com', phone: '13800138000', gender: '1', remark: '' }),
    data: str('添加成功'), example: '添加成功',
  },
  {
    path: '/system/user/delete', method: 'delete', tag: '用户管理', sort: 2000, summary: '批量删除用户',
    params: [qReq('ids', '用户 ID，多个逗号拼接', '866b0232-507b-42a4-bdc1-47fc4a83616a')],
    data: str('删除成功'), example: '删除成功',
  },
  {
    path: '/system/user/update', method: 'put', tag: '用户管理', sort: 3000, summary: '编辑用户',
    body: jsonBody({ id: '866b0232-507b-42a4-bdc1-47fc4a83616a', nickname: '张三三', phone: '13800138000', email: 'zhangsan@example.com', age: 26, status: '1', gender: '1', remark: '', deptId: 'd2c17a9e-8e3c-4f9a-9f2a-6b7c8d9e0f1a', roleIds: ['1967a8c5-63e4-4c2c-9902-2c7c32e365b3'] }),
    data: str('更新成功'), example: '更新成功',
  },
  {
    path: '/system/user/resetPassword', method: 'put', tag: '用户管理', sort: 4000, summary: '重置密码',
    body: jsonBody({ username: 'zhangsan', password: '123456' }),
    data: str('密码重置成功，请重新登录'), example: '密码重置成功，请重新登录',
  },
  {
    path: '/system/user/updatePassword', method: 'put', tag: '用户管理', sort: 5000, summary: '修改密码',
    body: jsonBody({ oldPassword: '123456', newPassword: '654321', repeatPassword: '654321' }),
    data: str('密码修改成功，请重新登录'), example: '密码修改成功，请重新登录',
  },
  {
    path: '/system/user/list', method: 'get', tag: '用户管理', sort: 6000, summary: '查询用户列表', desc: '按部门数据范围过滤',
    params: [...pageParams(), q('username', '用户账号'), q('nickname', '用户昵称'), q('email', '邮箱'), q('phone', '手机号'), q('status', '状态（1正常 0停用）'), q('deptId', '归属部门ID（过滤该部门及其全部子孙部门）')],
    data: page(userProps(), 1),
    example: { total: 1, records: [{ createTime: '2026-08-29 22:01:32', updateTime: '2026-09-12 11:52:50', deleteTime: null, createBy: 'admin', updateBy: 'admin', id: '866b0232-507b-42a4-bdc1-47fc4a83616a', username: 'admin', password: '$argon2id$v=19$m=65536,t=3,p=4$emlwemlw$ZGVtb2hhc2g', phone: '15888888888', nickname: '管理员', email: 'admin@example.com', status: '1', gender: '1', age: 30, remark: null, deptId: 'd2c17a9e-8e3c-4f9a-9f2a-6b7c8d9e0f1a', avatar: null, loginTime: '2026-09-15 09:30:00' }] },
  },
  {
    path: '/system/user/detail', method: 'get', tag: '用户管理', sort: 7000, summary: '查询用户详情',
    params: [qReq('id', '用户 ID', '866b0232-507b-42a4-bdc1-47fc4a83616a')],
    data: obj({ ...userProps(), roles: arr(obj(roleProps())) }),
    example: { createTime: '2026-08-29 22:01:32', updateTime: '2026-09-12 11:52:50', deleteTime: null, createBy: 'admin', updateBy: 'admin', id: '866b0232-507b-42a4-bdc1-47fc4a83616a', username: 'admin', password: '$argon2id$v=19$m=65536,t=3,p=4$emlwemlw$ZGVtb2hhc2g', phone: '15888888888', nickname: '管理员', email: 'admin@example.com', status: '1', gender: '1', age: 30, remark: null, deptId: 'd2c17a9e-8e3c-4f9a-9f2a-6b7c8d9e0f1a', avatar: null, loginTime: '2026-09-15 09:30:00', roles: [{ createTime: '2026-08-29 22:01:32', updateTime: '2026-09-12 11:52:50', deleteTime: null, createBy: 'admin', updateBy: 'admin', id: '1967a8c5-63e4-4c2c-9902-2c7c32e365b3', roleCode: 'admin', roleName: '超级管理员', roleSort: 1, dataScope: '1', status: '1', remark: null }] },
  },
  {
    path: '/system/user/profile', method: 'get', tag: '用户管理', sort: 8000, summary: '查询个人资料',
    data: obj({ nickname: str('管理员'), phone: str('15888888888'), email: str('admin@example.com'), age: int(30), gender: str('1'), avatar: nul(), createTime: str('2026-08-29 22:01:32'), roleGroup: arr(str('超级管理员'), '所属角色名组') }),
    example: { nickname: '管理员', phone: '15888888888', email: 'admin@example.com', age: 30, gender: '1', avatar: null, createTime: '2026-08-29 22:01:32', roleGroup: ['超级管理员'] },
  },
  {
    path: '/system/user/profile/update', method: 'put', tag: '用户管理', sort: 9000, summary: '修改个人资料',
    body: jsonBody({ nickname: '管理员', phone: '15888888888', age: 30, email: 'admin@example.com', gender: '1', avatar: 'uploads/e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855.png' }),
    data: str('编辑成功'), example: '编辑成功',
  },

  /* ----------------------------- 角色管理（system/role，11 端点） ----------------------------- */
  {
    path: '/system/role/create', method: 'post', tag: '角色管理', sort: 1000, summary: '创建角色',
    body: jsonBody({ roleCode: 'common', roleName: '普通角色', roleSort: 1, status: '1', remark: '' }),
    data: str('添加成功'), example: '添加成功',
  },
  {
    path: '/system/role/delete', method: 'delete', tag: '角色管理', sort: 2000, summary: '批量删除角色',
    params: [qReq('ids', '角色 ID，多个逗号拼接', '1967a8c5-63e4-4c2c-9902-2c7c32e365b3')],
    data: str('删除成功'), example: '删除成功',
  },
  {
    path: '/system/role/update', method: 'put', tag: '角色管理', sort: 3000, summary: '编辑角色',
    body: jsonBody({ id: '1967a8c5-63e4-4c2c-9902-2c7c32e365b3', roleName: '普通角色', roleCode: 'common', roleSort: 1, status: '1', remark: '' }),
    data: str('修改成功'), example: '修改成功',
  },
  {
    path: '/system/role/changeStatus', method: 'put', tag: '角色管理', sort: 4000, summary: '修改角色状态',
    body: jsonBody({ id: '1967a8c5-63e4-4c2c-9902-2c7c32e365b3', status: '0' }),
    data: str('状态修改成功'), example: '状态修改成功',
  },
  {
    path: '/system/role/authPermission', method: 'post', tag: '角色管理', sort: 5000, summary: '授权角色菜单权限',
    body: jsonBody({ roleId: '1967a8c5-63e4-4c2c-9902-2c7c32e365b3', menuIds: ['3a1b2c3d-4e5f-4a6b-8c9d-0e1f2a3b4c5d'] }),
    data: str('授权成功'), example: '授权成功',
  },
  {
    path: '/system/role/dataScope', method: 'put', tag: '角色管理', sort: 6000, summary: '设置角色数据范围',
    body: jsonBody({ id: '1967a8c5-63e4-4c2c-9902-2c7c32e365b3', dataScope: '2', deptIds: ['d2c17a9e-8e3c-4f9a-9f2a-6b7c8d9e0f1a'] }),
    data: str('数据权限设置成功'), example: '数据权限设置成功',
  },
  {
    path: '/system/role/list', method: 'get', tag: '角色管理', sort: 7000, summary: '角色分页列表',
    params: [...pageParams(), q('roleName', '角色名称'), q('roleCode', '角色编码'), q('status', '状态（1正常 0停用）')],
    data: page(roleProps(), 1),
    example: { total: 1, records: [{ createTime: '2026-08-29 22:01:32', updateTime: '2026-09-12 11:52:50', deleteTime: null, createBy: 'admin', updateBy: 'admin', id: '1967a8c5-63e4-4c2c-9902-2c7c32e365b3', roleCode: 'admin', roleName: '超级管理员', roleSort: 1, dataScope: '1', status: '1', remark: null }] },
  },
  {
    path: '/system/role/list/all', method: 'get', tag: '角色管理', sort: 8000, summary: '查询全部角色', desc: '不分页，分配角色下拉用',
    data: arr(obj(roleProps())),
    example: [{ createTime: '2026-08-29 22:01:32', updateTime: '2026-09-12 11:52:50', deleteTime: null, createBy: 'admin', updateBy: 'admin', id: '1967a8c5-63e4-4c2c-9902-2c7c32e365b3', roleCode: 'admin', roleName: '超级管理员', roleSort: 1, dataScope: '1', status: '1', remark: null }],
  },
  {
    path: '/system/role/detail', method: 'get', tag: '角色管理', sort: 9000, summary: '角色详情',
    params: [qReq('id', '角色 ID', '1967a8c5-63e4-4c2c-9902-2c7c32e365b3')],
    data: obj(roleProps()),
    example: { createTime: '2026-08-29 22:01:32', updateTime: '2026-09-12 11:52:50', deleteTime: null, createBy: 'admin', updateBy: 'admin', id: '1967a8c5-63e4-4c2c-9902-2c7c32e365b3', roleCode: 'admin', roleName: '超级管理员', roleSort: 1, dataScope: '1', status: '1', remark: null },
  },
  {
    path: '/system/role/permission', method: 'get', tag: '角色管理', sort: 10000, summary: '查询授权菜单', desc: '已授权菜单 ID 集合，授权树回显用',
    params: [qReq('roleId', '角色 ID', '1967a8c5-63e4-4c2c-9902-2c7c32e365b3')],
    data: arr(str('3a1b2c3d-4e5f-4a6b-8c9d-0e1f2a3b4c5d')),
    example: ['3a1b2c3d-4e5f-4a6b-8c9d-0e1f2a3b4c5d'],
  },
  {
    path: '/system/role/dataScope', method: 'get', tag: '角色管理', sort: 11000, summary: '查询数据范围', desc: '角色数据范围及自定义部门 ID 组，数据权限 Tab 回显用，顺带预热缓存',
    params: [qReq('roleId', '角色 ID', '1967a8c5-63e4-4c2c-9902-2c7c32e365b3')],
    data: obj({ dataScope: str('4', '数据范围（1全部 2自定义 3本部门 4本部门及以下 5仅本人）'), deptIds: arr(str('d2c17a9e-8e3c-4f9a-9f2a-6b7c8d9e0f1a'), '自定义档位的部门 ID 组') }),
    example: { dataScope: '4', deptIds: [] },
  },

  /* ----------------------------- 菜单管理（system/menu，6 端点） ----------------------------- */
  {
    path: '/system/menu/create', method: 'post', tag: '菜单管理', sort: 1000, summary: '新增菜单',
    body: jsonBody({ parentId: '0', menuName: '用户管理', menuType: 'C', path: 'user', component: 'system/user/index', icon: 'user', permission: '', visible: '1', status: '1', menuSort: 1, isCache: '0' }),
    data: str('添加成功'), example: '添加成功',
  },
  {
    path: '/system/menu/delete', method: 'delete', tag: '菜单管理', sort: 2000, summary: '批量删除菜单',
    params: [qReq('ids', '菜单 ID，多个逗号拼接', '3a1b2c3d-4e5f-4a6b-8c9d-0e1f2a3b4c5d')],
    data: str('删除成功'), example: '删除成功',
  },
  {
    path: '/system/menu/update', method: 'put', tag: '菜单管理', sort: 3000, summary: '编辑菜单',
    body: jsonBody({ id: '3a1b2c3d-4e5f-4a6b-8c9d-0e1f2a3b4c5d', parentId: '0', menuName: '用户管理', menuType: 'C', path: 'user', component: 'system/user/index', icon: 'user', visible: '1', status: '1', menuSort: 1, isCache: '0' }),
    data: str('修改成功'), example: '修改成功',
  },
  {
    path: '/system/menu/list', method: 'get', tag: '菜单管理', sort: 4000, summary: '菜单树形列表',
    params: [q('menuName', '菜单名称'), q('menuType', '菜单类型（M目录 C菜单 F按钮）'), q('status', '状态（1正常 0停用）')],
    data: arr(obj({ ...menuProps(), children: arr(obj({})) })),
    example: [{ createTime: '2026-08-29 22:01:32', updateTime: '2026-09-12 11:52:50', deleteTime: null, createBy: 'admin', updateBy: 'admin', id: '3a1b2c3d-4e5f-4a6b-8c9d-0e1f2a3b4c5d', parentId: '0', path: 'user', component: 'system/user/index', menuType: 'C', icon: 'user', menuName: '用户管理', visible: '1', permission: null, status: '1', menuSort: 1, isCache: '0', children: [] }],
  },
  {
    path: '/system/menu/list/parent', method: 'get', tag: '菜单管理', sort: 5000, summary: '上级菜单下拉列表',
    data: arr(obj({ parentId: str('0'), id: str('0'), menuName: str('主类目'), children: arr(obj(menuProps())) })),
    example: [{ parentId: '0', id: '0', menuName: '主类目', children: [{ createTime: '2026-08-29 22:01:32', updateTime: '2026-09-12 11:52:50', deleteTime: null, createBy: 'admin', updateBy: 'admin', id: '3a1b2c3d-4e5f-4a6b-8c9d-0e1f2a3b4c5d', parentId: '0', path: 'system', component: null, menuType: 'M', icon: 'system', menuName: '系统管理', visible: '1', permission: null, status: '1', menuSort: 1, isCache: '0' }] }],
  },
  {
    path: '/system/menu/detail', method: 'get', tag: '菜单管理', sort: 6000, summary: '菜单详情',
    params: [qReq('id', '菜单 ID', '3a1b2c3d-4e5f-4a6b-8c9d-0e1f2a3b4c5d')],
    data: obj(menuProps()),
    example: { createTime: '2026-08-29 22:01:32', updateTime: '2026-09-12 11:52:50', deleteTime: null, createBy: 'admin', updateBy: 'admin', id: '3a1b2c3d-4e5f-4a6b-8c9d-0e1f2a3b4c5d', parentId: '0', path: 'user', component: 'system/user/index', menuType: 'C', icon: 'user', menuName: '用户管理', visible: '1', permission: null, status: '1', menuSort: 1, isCache: '0' },
  },

  /* ----------------------------- 部门管理（system/dept，6 端点） ----------------------------- */
  {
    path: '/system/dept/list', method: 'get', tag: '部门管理', sort: 1000, summary: '部门树列表', desc: '树形列表，含停用部门',
    params: [q('deptName', '部门名称'), q('status', '状态（1正常 0停用）')],
    data: arr(obj({ ...deptProps(), children: arr(obj({})) })),
    example: [{ createTime: '2026-08-29 22:01:32', updateTime: '2026-09-12 11:52:50', deleteTime: null, createBy: 'admin', updateBy: 'admin', id: 'd2c17a9e-8e3c-4f9a-9f2a-6b7c8d9e0f1a', parentId: '0', ancestors: '0', deptName: '研发部门', leader: '张三', phone: '13800138000', email: 'dev@example.com', deptSort: 1, status: '1', children: [] }],
  },
  {
    path: '/system/dept/tree', method: 'get', tag: '部门管理', sort: 2000, summary: '部门下拉树', desc: '仅正常状态部门',
    data: arr(obj({ ...deptProps(), children: arr(obj({})) })),
    example: [{ createTime: '2026-08-29 22:01:32', updateTime: '2026-09-12 11:52:50', deleteTime: null, createBy: 'admin', updateBy: 'admin', id: 'd2c17a9e-8e3c-4f9a-9f2a-6b7c8d9e0f1a', parentId: '0', ancestors: '0', deptName: '研发部门', leader: '张三', phone: '13800138000', email: 'dev@example.com', deptSort: 1, status: '1', children: [] }],
  },
  {
    path: '/system/dept/detail', method: 'get', tag: '部门管理', sort: 3000, summary: '部门详情',
    params: [qReq('id', '部门 ID', 'd2c17a9e-8e3c-4f9a-9f2a-6b7c8d9e0f1a')],
    data: obj(deptProps()),
    example: { createTime: '2026-08-29 22:01:32', updateTime: '2026-09-12 11:52:50', deleteTime: null, createBy: 'admin', updateBy: 'admin', id: 'd2c17a9e-8e3c-4f9a-9f2a-6b7c8d9e0f1a', parentId: '0', ancestors: '0', deptName: '研发部门', leader: '张三', phone: '13800138000', email: 'dev@example.com', deptSort: 1, status: '1' },
  },
  {
    path: '/system/dept/create', method: 'post', tag: '部门管理', sort: 4000, summary: '新增部门',
    body: jsonBody({ parentId: '0', deptName: '研发部门', leader: '张三', phone: '13800138000', email: 'dev@example.com', deptSort: 1, status: '1' }),
    data: str('添加成功'), example: '添加成功',
  },
  {
    path: '/system/dept/update', method: 'put', tag: '部门管理', sort: 5000, summary: '编辑部门',
    body: jsonBody({ id: 'd2c17a9e-8e3c-4f9a-9f2a-6b7c8d9e0f1a', deptName: '研发中心', leader: '李四', deptSort: 1, status: '1' }),
    data: str('修改成功'), example: '修改成功',
  },
  {
    path: '/system/dept/delete', method: 'delete', tag: '部门管理', sort: 6000, summary: '删除部门',
    params: [qReq('ids', '部门 ID，多个逗号拼接', 'd2c17a9e-8e3c-4f9a-9f2a-6b7c8d9e0f1a')],
    data: str('删除成功'), example: '删除成功',
  },

  /* ----------------------------- 字典管理（system/dict，12 端点） ----------------------------- */
  {
    path: '/system/dict/type/create', method: 'post', tag: '字典管理', sort: 1000, summary: '新增字典类型',
    body: jsonBody({ dictName: '用户性别', dictType: 'sys_user_sex', status: '1', remark: '用户性别列表' }),
    data: str('新增成功'), example: '新增成功',
  },
  {
    path: '/system/dict/type/delete', method: 'delete', tag: '字典管理', sort: 2000, summary: '删除字典类型',
    params: [qReq('ids', '字典类型 ID，多个逗号拼接', '7c6d5e4f-3a2b-4c1d-9e8f-0a1b2c3d4e5f')],
    data: str('删除成功'), example: '删除成功',
  },
  {
    path: '/system/dict/type/update', method: 'put', tag: '字典管理', sort: 3000, summary: '编辑字典类型',
    body: jsonBody({ id: '7c6d5e4f-3a2b-4c1d-9e8f-0a1b2c3d4e5f', dictName: '用户性别', dictType: 'sys_user_sex', status: '1', remark: '用户性别列表' }),
    data: str('更新成功'), example: '更新成功',
  },
  {
    path: '/system/dict/type/list', method: 'get', tag: '字典管理', sort: 4000, summary: '字典类型分页列表',
    params: [...pageParams(), q('dictName', '字典名称'), q('dictType', '字典类型'), q('status', '状态（1正常 0停用）')],
    data: page(dictTypeProps(), 1),
    example: { total: 1, records: [{ createTime: '2026-08-29 22:01:32', updateTime: '2026-09-12 11:52:50', deleteTime: null, createBy: 'admin', updateBy: 'admin', id: '7c6d5e4f-3a2b-4c1d-9e8f-0a1b2c3d4e5f', dictName: '用户性别', dictType: 'sys_user_sex', status: '1', remark: '用户性别列表' }] },
  },
  {
    path: '/system/dict/type/detail', method: 'get', tag: '字典管理', sort: 5000, summary: '字典类型详情',
    params: [qReq('id', '字典类型 ID', '7c6d5e4f-3a2b-4c1d-9e8f-0a1b2c3d4e5f')],
    data: obj(dictTypeProps()),
    example: { createTime: '2026-08-29 22:01:32', updateTime: '2026-09-12 11:52:50', deleteTime: null, createBy: 'admin', updateBy: 'admin', id: '7c6d5e4f-3a2b-4c1d-9e8f-0a1b2c3d4e5f', dictName: '用户性别', dictType: 'sys_user_sex', status: '1', remark: '用户性别列表' },
  },
  {
    path: '/system/dict/data/create', method: 'post', tag: '字典管理', sort: 6000, summary: '新增字典数据',
    body: jsonBody({ dictLabel: '男', dictValue: '1', dictSort: 1, dictType: 'sys_user_sex', listClass: 'primary', status: '1', remark: '' }),
    data: str('新增成功'), example: '新增成功',
  },
  {
    path: '/system/dict/data/delete', method: 'delete', tag: '字典管理', sort: 7000, summary: '删除字典数据',
    params: [qReq('ids', '字典数据 ID，多个逗号拼接', '9a8b7c6d-5e4f-4a3b-2c1d-0e9f8a7b6c5d')],
    data: str('删除成功'), example: '删除成功',
  },
  {
    path: '/system/dict/data/update', method: 'put', tag: '字典管理', sort: 8000, summary: '编辑字典数据',
    body: jsonBody({ id: '9a8b7c6d-5e4f-4a3b-2c1d-0e9f8a7b6c5d', dictLabel: '男性', dictValue: '1', dictSort: 1, listClass: 'primary', status: '1', remark: '' }),
    data: str('更新成功'), example: '更新成功',
  },
  {
    path: '/system/dict/data/list', method: 'get', tag: '字典管理', sort: 9000, summary: '字典数据分页列表',
    params: [...pageParams(), q('dictLabel', '字典标签'), q('dictType', '字典类型'), q('status', '状态（1正常 0停用）')],
    data: page(dictDataProps(), 1),
    example: { total: 1, records: [{ createTime: '2026-08-29 22:01:32', updateTime: '2026-09-12 11:52:50', deleteTime: null, createBy: 'admin', updateBy: 'admin', id: '9a8b7c6d-5e4f-4a3b-2c1d-0e9f8a7b6c5d', dictLabel: '男', dictValue: '1', dictSort: 1, dictType: 'sys_user_sex', listClass: 'primary', status: '1', remark: null }] },
  },
  {
    path: '/system/dict/data/detail', method: 'get', tag: '字典管理', sort: 10000, summary: '字典数据详情',
    params: [qReq('id', '字典数据 ID', '9a8b7c6d-5e4f-4a3b-2c1d-0e9f8a7b6c5d')],
    data: obj(dictDataProps()),
    example: { createTime: '2026-08-29 22:01:32', updateTime: '2026-09-12 11:52:50', deleteTime: null, createBy: 'admin', updateBy: 'admin', id: '9a8b7c6d-5e4f-4a3b-2c1d-0e9f8a7b6c5d', dictLabel: '男', dictValue: '1', dictSort: 1, dictType: 'sys_user_sex', listClass: 'primary', status: '1', remark: null },
  },
  {
    path: '/system/dict/data/type', method: 'get', tag: '字典管理', sort: 11000, summary: '按类型查字典', desc: '前端 useDict 使用，缓存优先',
    params: [qReq('dictType', '字典类型', 'sys_user_sex')],
    data: arr(obj({ dictLabel: str('男'), dictValue: str('1'), listClass: str('primary'), dictSort: int(1) })),
    example: [{ dictLabel: '男', dictValue: '1', listClass: 'primary', dictSort: 1 }],
  },
  {
    path: '/system/dict/cache', method: 'delete', tag: '字典管理', sort: 12000, summary: '刷新字典缓存', desc: '清空全部字典缓存，下次查询回源重建',
    data: int(3, '删除的缓存键数量'), example: 3,
  },

  /* ----------------------------- 参数管理（system/config，7 端点） ----------------------------- */
  {
    path: '/system/config/create', method: 'post', tag: '参数管理', sort: 1000, summary: '新增参数',
    body: jsonBody({ configName: '用户管理-账号初始密码', configKey: 'sys.user.initPassword', configValue: '123456', configType: 'N', remark: '新建用户时的初始密码' }),
    data: str('新增成功'), example: '新增成功',
  },
  {
    path: '/system/config/delete', method: 'delete', tag: '参数管理', sort: 2000, summary: '删除参数', desc: '内置参数拦截；物理删除并清理对应缓存',
    params: [qReq('ids', '参数 ID，多个逗号拼接', '52700ffd-f68f-4233-abcf-cf93273a7ca0')],
    data: str('删除成功'), example: '删除成功',
  },
  {
    path: '/system/config/update', method: 'put', tag: '参数管理', sort: 3000, summary: '编辑参数', desc: '内置参数禁止修改键名；键名变更时同步迁移缓存',
    body: jsonBody({ id: '52700ffd-f68f-4233-abcf-cf93273a7ca0', configName: '用户管理-账号初始密码', configValue: '654321', remark: '初始化密码 654321' }),
    data: str('更新成功'), example: '更新成功',
  },
  {
    path: '/system/config/list', method: 'get', tag: '参数管理', sort: 4000, summary: '查询参数列表',
    params: [...pageParams(), q('configName', '参数名称'), q('configKey', '参数键名'), q('configType', '系统内置（Y内置 N非内置）')],
    data: page(configProps(), 2),
    example: {
      total: 2,
      records: [
        { createTime: '2026-09-17 22:56:18', updateTime: '2026-09-17 23:31:24', deleteTime: null, createBy: 'admin', updateBy: 'admin', id: '076189e6-d54f-4d00-93c8-9a17cba9608f', configName: '账号自助-验证码开关', configKey: 'sys.account.captchaEnabled', configValue: 'true', configType: 'Y', remark: '是否开启验证码功能（true开启，false关闭）' },
        { createTime: '2026-09-17 23:31:56', updateTime: '2026-09-18 00:19:51', deleteTime: null, createBy: 'admin', updateBy: 'admin', id: '52700ffd-f68f-4233-abcf-cf93273a7ca0', configName: '用户管理-账号初始密码', configKey: 'sys.user.initPassword', configValue: '123456', configType: 'Y', remark: '初始化密码 123456' },
      ],
    },
  },
  {
    path: '/system/config/detail', method: 'get', tag: '参数管理', sort: 5000, summary: '查询参数详情',
    params: [qReq('id', '参数 ID', '52700ffd-f68f-4233-abcf-cf93273a7ca0')],
    data: obj(configProps()),
    example: { createTime: '2026-09-17 23:31:56', updateTime: '2026-09-18 00:19:51', deleteTime: null, createBy: 'admin', updateBy: 'admin', id: '52700ffd-f68f-4233-abcf-cf93273a7ca0', configName: '用户管理-账号初始密码', configKey: 'sys.user.initPassword', configValue: '123456', configType: 'Y', remark: '初始化密码 123456' },
  },
  {
    path: '/system/config/key', method: 'get', tag: '参数管理', sort: 6000, summary: '按键查参数值', desc: 'Redis 缓存优先，未命中回源并回写；参数不存在时返回 null',
    params: [qReq('configKey', '参数键名', 'sys.user.initPassword')],
    data: { type: 'string', nullable: true, example: '123456', description: '参数键值，参数不存在时为 null' },
    example: '123456',
  },
  {
    path: '/system/config/cache', method: 'delete', tag: '参数管理', sort: 7000, summary: '刷新参数缓存', desc: '清空全部参数缓存并回源数据库重建，应用启动时亦会全量预热',
    data: nul(), example: null,
  },

  /* ----------------------------- 文件管理（system/file，11 端点） ----------------------------- */
  {
    path: '/system/file/tree', method: 'get', tag: '文件管理', sort: 1000, summary: '目录树', desc: '仅目录、未删除',
    data: arr(obj({
      ...base5(),
      id: str('5f1e2a10-6f10-4c10-8a10-1e2f3a4b5c01'),
      parentId: str('0', '父节点ID（0 表示根节点）'),
      ancestors: str('0', '祖级列表'),
      fileType: str('D', '类型（D目录 F文件）'),
      fileName: str('设计资料', '名称'),
      fileHash: nul(), filePath: nul(), fileSize: nul(), fileExt: nul(), mimeType: nul(),
      children: arr(obj({})),
    })),
    example: [{ createTime: '2026-09-13 12:00:00', updateTime: '2026-09-13 12:00:00', deleteTime: null, createBy: 'admin', updateBy: 'admin', id: '5f1e2a10-6f10-4c10-8a10-1e2f3a4b5c01', parentId: '0', ancestors: '0', fileType: 'D', fileName: '设计资料', fileHash: null, filePath: null, fileSize: null, fileExt: null, mimeType: null, children: [] }],
  },
  {
    path: '/system/file/list', method: 'get', tag: '文件管理', sort: 2000, summary: '查询文件列表', desc: '当前目录下分页',
    params: [...pageParams(), q('parentId', '目录 ID（0 表示根节点）', '0'), q('fileName', '文件名称')],
    data: page({
      ...base5(),
      id: str('8d1e6a90-3f2b-4c1d-9e8f-0a1b2c3d4e5f'),
      parentId: str('0'), ancestors: str('0'), fileType: str('F'), fileName: str('设计图.pdf'),
      fileHash: str('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'),
      filePath: str('uploads/e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855.pdf'),
      fileSize: int(1048576, '文件大小（字节）'), fileExt: str('.pdf'), mimeType: str('application/pdf'),
    }, 1),
    example: { total: 1, records: [{ createTime: '2026-09-13 12:00:00', updateTime: '2026-09-13 12:00:00', deleteTime: null, createBy: 'admin', updateBy: 'admin', id: '8d1e6a90-3f2b-4c1d-9e8f-0a1b2c3d4e5f', parentId: '0', ancestors: '0', fileType: 'F', fileName: '设计图.pdf', fileHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', filePath: 'uploads/e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855.pdf', fileSize: 1048576, fileExt: '.pdf', mimeType: 'application/pdf' }] },
  },
  {
    path: '/system/file/folder/create', method: 'post', tag: '文件管理', sort: 3000, summary: '新建目录',
    body: jsonBody({ parentId: '0', fileName: '设计资料' }),
    data: str('新增成功'), example: '新增成功',
  },
  {
    path: '/system/file/folder/update', method: 'put', tag: '文件管理', sort: 4000, summary: '重命名目录',
    body: jsonBody({ id: '5f1e2a10-6f10-4c10-8a10-1e2f3a4b5c01', fileName: '设计资料2026' }),
    data: str('修改成功'), example: '修改成功',
  },
  {
    path: '/system/file/delete', method: 'delete', tag: '文件管理', sort: 5000, summary: '删除文件目录', desc: '软删，进入回收站',
    params: [qReq('ids', '文件/目录 ID，多个逗号拼接', '8d1e6a90-3f2b-4c1d-9e8f-0a1b2c3d4e5f')],
    data: str('删除成功，已移入回收站'), example: '删除成功，已移入回收站',
  },
  {
    path: '/system/file/register', method: 'post', tag: '文件管理', sort: 6000, summary: '上传登记', desc: '单传/分片合并成功后写入文件记录',
    body: jsonBody({ parentId: '0', fileHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', fileName: '设计图.pdf', fileSize: 1048576, mimeType: 'application/pdf' }),
    data: str('登记成功'), example: '登记成功',
  },
  {
    path: '/system/file/download', method: 'get', tag: '文件管理', sort: 7000, summary: '文件下载', desc: '流式响应',
    params: [qReq('id', '文件 ID', '8d1e6a90-3f2b-4c1d-9e8f-0a1b2c3d4e5f')],
    raw200: true,
  },
  {
    path: '/system/file/recycle/list', method: 'get', tag: '文件管理', sort: 8000, summary: '回收站分页列表',
    params: [...pageParams(), q('fileName', '文件名称')],
    data: page({
      ...base5(),
      id: str('8d1e6a90-3f2b-4c1d-9e8f-0a1b2c3d4e5f'),
      parentId: str('0'), ancestors: str('0'), fileType: str('F'), fileName: str('旧版设计图.pdf'),
      fileHash: str('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'),
      filePath: str('uploads/e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855.pdf'),
      fileSize: int(204800, '文件大小（字节）'), fileExt: str('.pdf'), mimeType: str('application/pdf'),
      deleteTime: str('2026-09-13 12:30:00'),
    }, 1),
    example: { total: 1, records: [{ createTime: '2026-09-13 11:00:00', updateTime: '2026-09-13 12:30:00', deleteTime: '2026-09-13 12:30:00', createBy: 'admin', updateBy: 'admin', id: '8d1e6a90-3f2b-4c1d-9e8f-0a1b2c3d4e5f', parentId: '0', ancestors: '0', fileType: 'F', fileName: '旧版设计图.pdf', fileHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', filePath: 'uploads/e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855.pdf', fileSize: 204800, fileExt: '.pdf', mimeType: 'application/pdf' }] },
  },
  {
    path: '/system/file/recycle/restore', method: 'put', tag: '文件管理', sort: 9000, summary: '回收站还原',
    params: [qReq('ids', '文件/目录 ID，多个逗号拼接', '8d1e6a90-3f2b-4c1d-9e8f-0a1b2c3d4e5f')],
    data: str('还原成功'), example: '还原成功',
  },
  {
    path: '/system/file/recycle/delete', method: 'delete', tag: '文件管理', sort: 10000, summary: '回收站彻底删除',
    params: [qReq('ids', '文件/目录 ID，多个逗号拼接', '8d1e6a90-3f2b-4c1d-9e8f-0a1b2c3d4e5f')],
    data: str('彻底删除成功，清理物理文件 1 个'), example: '彻底删除成功，清理物理文件 1 个',
  },
  {
    path: '/system/file/recycle/clear', method: 'delete', tag: '文件管理', sort: 11000, summary: '清空回收站',
    data: str('回收站已清空，清理物理文件 2 个'), example: '回收站已清空，清理物理文件 2 个',
  },

  /* ----------------------------- 日志管理（monitor/log，9 端点） ----------------------------- */
  {
    path: '/monitor/log/loginlog/list', method: 'get', tag: '日志管理', sort: 1000, summary: '查询登录日志列表',
    params: [...pageParams(), q('ip', '登录IP'), q('username', '用户账号'), q('location', '登录地点'), q('status', '登录状态（1成功 0失败）')],
    data: page(loginlogProps(), 1),
    example: { total: 1, records: [{ id: '2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e', username: 'admin', userId: '866b0232-507b-42a4-bdc1-47fc4a83616a', ip: '127.0.0.1', location: '内网', browser: 'Chrome 130', os: 'Windows 10', status: '1', message: '登录成功', loginTime: '2026-09-15 09:30:00', requestId: REQUEST_ID }] },
  },
  {
    path: '/monitor/log/loginlog/self', method: 'get', tag: '日志管理', sort: 1100, summary: '个人登录日志', desc: '个人中心用，仅校验登录态，强制过滤为当前登录用户自己的日志',
    params: [...pageParams(), q('ip', '登录IP'), q('location', '登录地点'), q('status', '登录状态（1成功 0失败）')],
    data: page(loginlogProps(), 1),
    example: { total: 1, records: [{ id: '2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e', username: 'admin', userId: '866b0232-507b-42a4-bdc1-47fc4a83616a', ip: '127.0.0.1', location: '内网', browser: 'Chrome 130', os: 'Windows 10', status: '1', message: '登录成功', loginTime: '2026-09-15 09:30:00', requestId: REQUEST_ID }] },
  },
  {
    path: '/monitor/log/loginlog/export', method: 'post', tag: '日志管理', sort: 2000, summary: '导出登录日志', desc: 'xlsx 流，按查询条件全量导出',
    params: [q('ip', '登录IP'), q('username', '用户账号'), q('location', '登录地点'), q('status', '登录状态（1成功 0失败）')],
    raw200: true,
  },
  {
    path: '/monitor/log/loginlog/delete', method: 'delete', tag: '日志管理', sort: 3000, summary: '删除登录日志',
    params: [qReq('ids', '登录日志 ID，多个逗号拼接', '2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e')],
    data: str('删除成功'), example: '删除成功',
  },
  {
    path: '/monitor/log/loginlog/clear', method: 'delete', tag: '日志管理', sort: 4000, summary: '清空登录日志',
    data: str('清空成功'), example: '清空成功',
  },
  {
    path: '/monitor/log/operlog/list', method: 'get', tag: '日志管理', sort: 5000, summary: '查询操作日志列表',
    params: [...pageParams(), q('ip', '请求IP'), q('title', '模块标题'), q('username', '操作人员'), q('location', '请求地址'), q('status', '操作状态（1正常 0异常）')],
    data: page(operlogProps(), 1),
    example: { total: 1, records: [{ id: '4d5e6f7a-8b9c-4d0e-af1b-2c3d4e5f6a7b', title: '用户管理', username: 'admin', userId: '866b0232-507b-42a4-bdc1-47fc4a83616a', method: 'UserController.create', requestMethod: 'POST', params: '{"username":"zhangsan"}', url: '/api/system/user/create', ip: '127.0.0.1', location: '内网', businessType: '1', status: '1', operTime: '2026-09-15 09:30:00', duration: 45, requestId: REQUEST_ID }] },
  },
  {
    path: '/monitor/log/operlog/export', method: 'post', tag: '日志管理', sort: 6000, summary: '导出操作日志', desc: 'xlsx 流，按查询条件全量导出',
    params: [q('ip', '请求IP'), q('title', '模块标题'), q('username', '操作人员'), q('location', '请求地址'), q('status', '操作状态（1正常 0异常）')],
    raw200: true,
  },
  {
    path: '/monitor/log/operlog/delete', method: 'delete', tag: '日志管理', sort: 7000, summary: '删除操作日志',
    params: [qReq('ids', '操作日志 ID，多个逗号拼接', '4d5e6f7a-8b9c-4d0e-af1b-2c3d4e5f6a7b')],
    data: str('删除成功'), example: '删除成功',
  },
  {
    path: '/monitor/log/operlog/clear', method: 'delete', tag: '日志管理', sort: 8000, summary: '清空操作日志',
    data: str('清空成功'), example: '清空成功',
  },

  /* ----------------------------- 在线用户（monitor/online，3 端点） ----------------------------- */
  {
    path: '/monitor/online/list', method: 'get', tag: '在线用户', sort: 1000, summary: '分页列表查询',
    params: [...pageParams(), q('username', '用户账号'), q('location', '登录地点'), q('ip', '登录IP')],
    data: page({ userId: str('866b0232-507b-42a4-bdc1-47fc4a83616a'), ip: str('127.0.0.1'), location: str('内网'), username: str('admin'), loginTime: str('2026-09-15 09:30:00'), browser: str('Chrome 130'), os: str('Windows 10'), uuid: str('30e0bf90-24fb-4700-9690-06c6df38c44b') }, 1),
    example: { total: 1, records: [{ userId: '866b0232-507b-42a4-bdc1-47fc4a83616a', ip: '127.0.0.1', location: '内网', username: 'admin', loginTime: '2026-09-15 09:30:00', browser: 'Chrome 130', os: 'Windows 10', uuid: '30e0bf90-24fb-4700-9690-06c6df38c44b' }] },
  },
  {
    path: '/monitor/online/count', method: 'get', tag: '在线用户', sort: 2000, summary: '查询在线用户数量',
    data: int(1, '在线用户数量'), example: 1,
  },
  {
    path: '/monitor/online/forceLogout', method: 'delete', tag: '在线用户', sort: 3000, summary: '强制退出登录', desc: '清除与该用户相关的所有 Redis 缓存',
    params: [qReq('userId', '用户 ID', '866b0232-507b-42a4-bdc1-47fc4a83616a'), qReq('uuid', '会话 UUID', '30e0bf90-24fb-4700-9690-06c6df38c44b')],
    data: str('强退成功'), example: '强退成功',
  },

  /* ----------------------------- 缓存管理（monitor/cache，6 端点） ----------------------------- */
  {
    path: '/monitor/cache', method: 'get', tag: '缓存管理', sort: 1000, summary: '缓存监控',
    data: { type: 'object', required: ['dbsize', 'info', 'commandstats'], properties: { dbsize: int(12, 'Redis 键数量'), info: { type: 'object', description: 'Redis INFO 信息' }, commandstats: { type: 'object', description: '命令调用统计（cmdstat_*）' } } },
    example: { dbsize: 12, info: { redis_version: '7.4.5', used_memory_human: '2.5M' }, commandstats: { cmdstat_get: { calls: 120, usec: 3500 } } },
  },
  {
    path: '/monitor/cache/names', method: 'get', tag: '缓存管理', sort: 2000, summary: '查询缓存分类',
    data: arr(obj({ prefix: str('captcha:img', '缓存键前缀'), remark: str('验证码', '分类说明') })),
    example: [
      { prefix: 'captcha:img', remark: '验证码' },
      { prefix: 'token:access', remark: '用户令牌' },
      { prefix: 'system:dict', remark: '数据字典' },
      { prefix: 'repeat:submit', remark: '防重提交' },
      { prefix: 'response:cache', remark: '响应缓存' },
      { prefix: 'throttle:limit', remark: '限流处理' },
      { prefix: 'login:fail', remark: '登录失败锁定' },
    ],
  },
  {
    path: '/monitor/cache/names/delete', method: 'delete', tag: '缓存管理', sort: 3000, summary: '清除分类缓存', desc: '清除指定分类下的所有缓存键',
    params: [qReq('name', '缓存分类前缀（须在白名单内）', 'captcha:img')],
    data: int(3, '删除的键数量'), example: 3,
  },
  {
    path: '/monitor/cache/keys', method: 'get', tag: '缓存管理', sort: 4000, summary: '缓存键名列表',
    params: [qReq('name', '缓存分类前缀（须在白名单内）', 'captcha:img')],
    data: arr(str('captcha:img:8f1e2a10-6f10-4c10-8a10-1e2f3a4b5c01')),
    example: ['captcha:img:8f1e2a10-6f10-4c10-8a10-1e2f3a4b5c01'],
  },
  {
    path: '/monitor/cache/keys/detail', method: 'get', tag: '缓存管理', sort: 5000, summary: '查询缓存键值',
    params: [qReq('key', '缓存键名', 'captcha:img:8f1e2a10-6f10-4c10-8a10-1e2f3a4b5c01')],
    data: obj({ name: str('captcha:img', '所属分类前缀'), key: str('captcha:img:8f1e2a10-6f10-4c10-8a10-1e2f3a4b5c01'), value: str('3', '缓存值'), ttl: int(58, '剩余过期秒数（-1 永不过期，-2 键不存在）') }),
    example: { name: 'captcha:img', key: 'captcha:img:8f1e2a10-6f10-4c10-8a10-1e2f3a4b5c01', value: '3', ttl: 58 },
  },
  {
    path: '/monitor/cache/keys/delete', method: 'delete', tag: '缓存管理', sort: 6000, summary: '删除缓存键值',
    params: [qReq('key', '缓存键名', 'captcha:img:8f1e2a10-6f10-4c10-8a10-1e2f3a4b5c01')],
    data: bool(true, '是否删除成功'), example: true,
  },

  /* ----------------------------- 服务监控（monitor/server，2 端点） ----------------------------- */
  {
    path: '/monitor/server', method: 'get', tag: '服务监控', sort: 1000, summary: '获取监控数据',
    data: obj({
      cpu: obj({ cores: int(8, 'CPU 核心数'), used: str('12.35%', '用户态占用'), system: str('5.20%', '系统态占用'), free: str('82.45%', '空闲') }),
      memory: obj({ total: str('15.86GB', '总内存'), used: str('8.20GB', '已用内存'), free: str('7.66GB', '空闲内存'), usage: str('51.70%', '内存使用率') }),
      server: obj({ hostname: str('DESKTOP-ABC123'), platform: str('win32'), ip: str('192.168.1.100'), arch: str('x64') }),
      disks: arr(obj({ fs: str('C:'), mount: str('C:'), type: str('NTFS'), total: str('476.00GB'), used: str('230.00GB'), free: str('246.00GB'), usage: str('48.32%') })),
    }),
    example: {
      cpu: { cores: 8, used: '12.35%', system: '5.20%', free: '82.45%' },
      memory: { total: '15.86GB', used: '8.20GB', free: '7.66GB', usage: '51.70%' },
      server: { hostname: 'DESKTOP-ABC123', platform: 'win32', ip: '192.168.1.100', arch: 'x64' },
      disks: [{ fs: 'C:', mount: 'C:', type: 'NTFS', total: '476.00GB', used: '230.00GB', free: '246.00GB', usage: '48.32%' }],
    },
  },
  {
    path: '/monitor/server/pool', method: 'get', tag: '服务监控', sort: 2000, summary: '查询连接池',
    data: obj({ current: int(5, '当前已建立连接数'), running: int(1, '正在执行 SQL 的连接数'), maxUsed: int(8, '历史峰值连接数'), maxConnections: int(151, '连接上限') }),
    example: { current: 5, running: 1, maxUsed: 8, maxConnections: 151 },
  },

  /* ----------------------------- 定时任务（monitor/job，11 端点） ----------------------------- */
  {
    path: '/monitor/job/create', method: 'post', tag: '定时任务', sort: 1000, summary: '新增任务',
    body: jsonBody({ jobName: '示例任务', invokeTarget: 'JobService.test()', cronExpression: '0 0/1 * * * ?', jobGroup: 'DEFAULT', misfirePolicy: '3', concurrent: '0', status: '1' }),
    data: str('添加成功'), example: '添加成功',
  },
  {
    path: '/monitor/job/update', method: 'put', tag: '定时任务', sort: 2000, summary: '编辑任务',
    body: jsonBody({ id: '5a4b3c2d-1e0f-4a5b-8c7d-6e5f4a3b2c1d', jobName: '示例任务', invokeTarget: 'JobService.test()', cronExpression: '0 0/5 * * * ?', jobGroup: 'DEFAULT', misfirePolicy: '3', concurrent: '0', status: '1' }),
    data: str('更新成功'), example: '更新成功',
  },
  {
    path: '/monitor/job/list', method: 'get', tag: '定时任务', sort: 3000, summary: '查询任务分页列表',
    params: [...pageParams(), q('jobName', '任务名称'), q('jobGroup', '任务组名'), q('status', '任务状态（1正常 0暂停）')],
    data: page(jobProps(), 1),
    example: { total: 1, records: [{ createTime: '2026-09-12 16:30:00', updateTime: '2026-09-12 16:30:00', deleteTime: null, createBy: 'admin', updateBy: 'admin', id: '5a4b3c2d-1e0f-4a5b-8c7d-6e5f4a3b2c1d', jobName: '示例任务', jobGroup: 'DEFAULT', invokeTarget: 'JobService.test()', cronExpression: '0 0/1 * * * ?', misfirePolicy: '3', concurrent: '0', status: '1' }] },
  },
  {
    path: '/monitor/job/detail', method: 'get', tag: '定时任务', sort: 4000, summary: '查询任务详情',
    params: [qReq('id', '任务 ID', '5a4b3c2d-1e0f-4a5b-8c7d-6e5f4a3b2c1d')],
    data: obj(jobProps()),
    example: { createTime: '2026-09-12 16:30:00', updateTime: '2026-09-12 16:30:00', deleteTime: null, createBy: 'admin', updateBy: 'admin', id: '5a4b3c2d-1e0f-4a5b-8c7d-6e5f4a3b2c1d', jobName: '示例任务', jobGroup: 'DEFAULT', invokeTarget: 'JobService.test()', cronExpression: '0 0/1 * * * ?', misfirePolicy: '3', concurrent: '0', status: '1' },
  },
  {
    path: '/monitor/job/changeStatus', method: 'put', tag: '定时任务', sort: 5000, summary: '修改任务状态',
    body: jsonBody({ id: '5a4b3c2d-1e0f-4a5b-8c7d-6e5f4a3b2c1d', status: '0' }),
    data: str('状态修改成功'), example: '状态修改成功',
  },
  {
    path: '/monitor/job/run', method: 'put', tag: '定时任务', sort: 6000, summary: '执行一次',
    body: jsonBody({ jobId: '5a4b3c2d-1e0f-4a5b-8c7d-6e5f4a3b2c1d', jobGroup: 'DEFAULT' }),
    data: str('执行一次成功'), example: '执行一次成功',
  },
  {
    path: '/monitor/job/delete', method: 'delete', tag: '定时任务', sort: 7000, summary: '删除任务',
    params: [qReq('ids', '任务 ID，多个逗号拼接', '5a4b3c2d-1e0f-4a5b-8c7d-6e5f4a3b2c1d')],
    data: str('删除成功'), example: '删除成功',
  },
  {
    path: '/monitor/job/log/list', method: 'get', tag: '定时任务', sort: 8000, summary: '查询调度日志',
    params: [...pageParams(), q('jobName', '任务名称'), q('jobGroup', '任务组名'), q('status', '执行状态（1正常 0失败）')],
    data: page(jobLogProps(), 1),
    example: { total: 1, records: [{ id: '6b5a4c3d-2e1f-4b0a-9c8d-7e6f5a4b3c2d', jobName: '示例任务', jobGroup: 'DEFAULT', invokeTarget: 'JobService.test()', jobMessage: '执行成功', status: '1', createTime: '2026-09-15 09:30:00' }] },
  },
  {
    path: '/monitor/job/log/delete', method: 'delete', tag: '定时任务', sort: 9000, summary: '删除任务日志',
    params: [qReq('ids', '任务日志 ID，多个逗号拼接', '6b5a4c3d-2e1f-4b0a-9c8d-7e6f5a4b3c2d')],
    data: str('删除成功'), example: '删除成功',
  },
  {
    path: '/monitor/job/log/clear', method: 'delete', tag: '定时任务', sort: 10000, summary: '清空调度日志',
    data: str('清空成功'), example: '清空成功',
  },
  {
    path: '/monitor/job/log/export', method: 'post', tag: '定时任务', sort: 11000, summary: '导出调度日志', desc: 'xlsx 流，按查询条件全量导出',
    params: [q('jobName', '任务名称'), q('jobGroup', '任务组名'), q('status', '执行状态（1正常 0失败）')],
    raw200: true,
  },

  /* ----------------------------- 健康检查（monitor/health，8 端点） ----------------------------- */
  {
    path: '/monitor/health/live', method: 'get', tag: '健康检查', sort: 1000, summary: '存活探针', desc: 'K8s / Docker 探针专用，轻量、无依赖、永不宕机',
    data: obj({ status: str('ok'), message: str('服务运行中') }),
    example: { status: 'ok', message: '服务运行中' },
  },
  {
    path: '/monitor/health/ready', method: 'get', tag: '健康检查', sort: 2000, summary: '就绪探针', desc: 'K8s / Docker 探针专用，轻量、无依赖、永不宕机',
    data: obj({ status: str('ok'), message: str('服务已就绪') }),
    example: { status: 'ok', message: '服务已就绪' },
  },
  {
    path: '/monitor/health', method: 'get', tag: '健康检查', sort: 3000, summary: '检查所有健康状态',
    data: obj(healthResultSchema()), example: healthResultExample,
  },
  {
    path: '/monitor/health/network', method: 'get', tag: '健康检查', sort: 4000, summary: '检查网络健康状态',
    data: obj(healthResultSchema()), example: healthResultExample,
  },
  {
    path: '/monitor/health/database', method: 'get', tag: '健康检查', sort: 5000, summary: '检查数据库状态',
    data: obj(healthResultSchema()), example: healthResultExample,
  },
  {
    path: '/monitor/health/memory', method: 'get', tag: '健康检查', sort: 6000, summary: '检查内存堆状态',
    data: obj(healthResultSchema()), example: healthResultExample,
  },
  {
    path: '/monitor/health/rss', method: 'get', tag: '健康检查', sort: 7000, summary: '检查常驻内存',
    data: obj(healthResultSchema()), example: healthResultExample,
  },
  {
    path: '/monitor/health/storage', method: 'get', tag: '健康检查', sort: 8000, summary: '检查磁盘健康状态',
    data: obj(healthResultSchema()), example: healthResultExample,
  },

  /* ----------------------------- 文件上传（common/upload，5 端点） ----------------------------- */
  {
    path: '/common/upload/file', method: 'post', tag: '文件上传', sort: 1000, summary: '单文件上传', desc: '≤10MB，按内容 SHA-256 命名，重复秒传',
    body: multipartBody({ file: { type: 'string', format: 'binary', description: '待上传文件' } }),
    data: str('uploads/e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855.png', '相对存储路径'), example: 'uploads/e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855.png',
  },
  {
    path: '/common/upload/check', method: 'post', tag: '文件上传', sort: 2000, summary: '秒传续传检查',
    body: jsonBody({ fileHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' }),
    data: obj({ isExist: bool(false, '文件是否已存在（true 可秒传）'), uploadedChunks: arr(str('0-e3b0c442'), '已上传分片文件名组（断点续传跳过用）') }),
    example: { isExist: false, uploadedChunks: ['0-e3b0c442', '1-02638299'] },
  },
  {
    path: '/common/upload/chunk', method: 'post', tag: '文件上传', sort: 3000, summary: '上传单个分片',
    body: multipartBody({ file: { type: 'string', format: 'binary', description: '分片二进制数据' }, fileHash: str('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', '文件整体哈希，用作分片临时目录名'), chunkHash: str('0-e3b0c442', '分片哈希，用作分片文件名（{序号}-{哈希}）') }),
    data: str('分片上传成功'), example: '分片上传成功',
  },
  {
    path: '/common/upload/chunk/merge', method: 'post', tag: '文件上传', sort: 4000, summary: '合并所有分片',
    body: jsonBody({ fileHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', fileName: '设计图.pdf' }),
    data: str('文件合并成功'), example: '文件合并成功',
  },
  {
    path: '/common/upload/chunk/clear', method: 'delete', tag: '文件上传', sort: 5000, summary: '清理分片',
    params: [qReq('fileHash', '文件整体哈希，用于定位分片目录', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')],
    data: str('分片目录已成功清理'), example: '分片目录已成功清理',
  },

  /* ----------------------------- 登录锁定（monitor/loginlock，2 端点） ----------------------------- */
  {
    path: '/monitor/loginlock/list', method: 'get', tag: '登录锁定', sort: 1000, summary: '查询锁定列表',
    desc: '按「账号+IP」维度的登录失败计数分页列表，含未达锁定阈值的记录；按失败次数降序，最接近锁定的优先展示',
    params: [...pageParams(), q('username', '用户账号（模糊匹配）'), q('ip', '来源 IP（模糊匹配）')],
    data: page({
      username: str('zhangsan', '登录账号'),
      ip: str('127.0.0.1', '来源 IP'),
      failCount: int(3, '窗口期内失败次数'),
      remainingCount: int(2, '距锁定的剩余可尝试次数'),
      remainingSeconds: int(1200, '剩余窗口秒数（归零自动解锁）'),
    }, 1),
    example: { total: 1, records: [{ username: 'zhangsan', ip: '127.0.0.1', failCount: 3, remainingCount: 2, remainingSeconds: 1200 }] },
  },
  {
    path: '/monitor/loginlock/unlock', method: 'delete', tag: '登录锁定', sort: 2000, summary: '解锁登录锁定',
    desc: '删除对应失败计数键，与管理页列表的行维度一一对应；TTL 到期亦会自动解锁',
    params: [qReq('username', '登录账号', 'zhangsan'), qReq('ip', '来源 IP', '127.0.0.1')],
    data: str('解锁成功'), example: '解锁成功',
  },
]

/* 目录定义（全量 17 个；x-sort 沿用菜单排序递增） */
const newTags = [
  { name: '鉴权管理', sort: 20000 },
  { name: '用户管理', sort: 21000 },
  { name: '角色管理', sort: 22000 },
  { name: '菜单管理', sort: 23000 },
  { name: '部门管理', sort: 24000 },
  { name: '字典管理', sort: 25000 },
  { name: '参数管理', sort: 26000 },
  { name: '文件管理', sort: 27000 },
  { name: '日志管理', sort: 28000 },
  { name: '在线用户', sort: 29000 },
  { name: '缓存管理', sort: 30000 },
  { name: '服务监控', sort: 31000 },
  { name: '定时任务', sort: 32000 },
  { name: '健康检查', sort: 33000 },
  { name: '文件上传', sort: 34000 },
  { name: '首页统计', sort: 35000 },
  { name: '登录锁定', sort: 36000 },
]

/* ----------------------------- 合并执行（勿动） ----------------------------- */
const doc = BASE
  ? JSON.parse(fs.readFileSync(BASE, 'utf8'))
  : {
      openapi: '3.0.0',
      info: { title: 'NestJS Admin Template 接口文档', description: '由 apipost-doc-sync 技能从控制器/DTO/实体/服务层源码生成的接口文档', version: '1.0.0', contact: { name: USER_NAME } },
      servers: [{ url: 'http://localhost:3000/api', description: '本地开发环境' }],
      tags: [],
      paths: {},
      components: { schemas: {} },
    }

for (const { name, sort } of newTags) {
  if (doc.tags.some((item) => item.name === name)) continue
  doc.tags.push({ name, description: '', 'x-type': 'folder', 'x-url': '', 'x-target-id': hexId(), 'x-sort': sort, 'x-parent-id': '0' })
}

let added = 0
let skipped = 0
for (const def of defs) {
  if (doc.paths[def.path]?.[def.method] && !FORCE) {
    skipped++
    continue
  }
  const op = {
    'x-target-id': hexId(),
    'x-protocol': 'http',
    'x-sort': def.sort,
    summary: def.summary,
    description: def.desc || '',
    tags: [def.tag],
    'x-mark-id': '2',
    'x-updated-at': UPDATED_AT,
    'x-updated-user-name': USER_NAME,
  }
  if (def.params?.length) op.parameters = def.params
  if (def.body) op.requestBody = def.body
  op.responses = def.raw200 ? binaryResponse() : { 200: okResponse(def.data, def.example), 404: failResponse() }
  doc.paths[def.path] = { ...(doc.paths[def.path] || {}), [def.method]: op }
  added++
}

/* 校验：控制器端点自动对账（扫描 controller 提取全部端点，与 DEFS 互比，防漏录/多录） */
const MODULES_DIR = path.join(PROJECT_ROOT, 'server/src/modules')
const controllerFiles = []
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (entry.name.endsWith('.controller.ts')) controllerFiles.push(full)
  }
}
walk(MODULES_DIR)
/** 路径归一化：多斜杠合一，去首尾斜杠（控制器侧无前导 /，DEFS 有；@Get() 空参产生尾 /） */
const normalizePath = (p) => p.replace(/\/+/g, '/').replace(/^\/|\/$/g, '')
const endpointSet = new Set()
for (const file of controllerFiles) {
  const content = fs.readFileSync(file, 'utf8')
  const prefix = content.match(/@Controller\('([^']+)'\)/)?.[1] ?? ''
  const re = /@(Get|Post|Put|Delete)\s*\(\s*(?:'([^']*)'|"([^"]*)")?\s*\)/g
  let match
  while ((match = re.exec(content))) {
    const sub = match[2] ?? match[3] ?? ''
    endpointSet.add(`${match[1].toLowerCase()} ${normalizePath(`${prefix}/${sub}`)}`)
  }
}
const defSet = new Set(defs.map((d) => `${d.method} ${normalizePath(d.path)}`))
const missingInDefs = [...endpointSet].filter((key) => !defSet.has(key))
const extraInDefs = [...defSet].filter((key) => !endpointSet.has(key))
if (missingInDefs.length || extraInDefs.length) {
  if (missingInDefs.length) {
    console.error('❌ 以下控制器端点未录入 DEFS：')
    for (const key of missingInDefs) console.error(`   ${key}`)
  }
  if (extraInDefs.length) {
    console.error('❌ 以下 DEFS 端点在控制器中不存在（疑似已删除或路径变更）：')
    for (const key of extraInDefs) console.error(`   ${key}`)
  }
  process.exit(1)
}

/* 校验：接口名称（summary）必须为纯汉字且最多 8 字 */
const badSummaries = defs.filter((d) => !/^[\u4e00-\u9fa5]{1,8}$/.test(d.summary))
if (badSummaries.length) {
  console.error('❌ 以下接口名称不符合「纯汉字且最多 8 字」规范：')
  for (const d of badSummaries) console.error(`   ${d.method.toUpperCase()} ${d.path} → ${d.summary}`)
  process.exit(1)
}

/* 校验：目录无缺；基线模式下被 defs 覆盖不到的存量端点数也一并列出 */
const missingTags = [...new Set(defs.map((d) => d.tag))].filter((tag) => !doc.tags.some((item) => item.name === tag))
if (missingTags.length) {
  console.error(`❌ 缺失目录：${missingTags.join('、')}`)
  process.exit(1)
}

const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
const OUT = path.join(PROJECT_ROOT, `接口文档_${timestamp}.json`)
fs.writeFileSync(OUT, JSON.stringify(doc))

const opCount = Object.values(doc.paths).flatMap((p) => Object.keys(p).filter((k) => ['get', 'post', 'put', 'delete'].includes(k))).length
console.log(`模式：${BASE ? `基线合并（${BASE}）` : '无基线全量生成'}${FORCE ? '（--force 覆盖已存在端点）' : ''}`)
console.log(`本次补录 ${added} 个（跳过已存在 ${skipped} 个），目录 ${newTags.length} 个`)
console.log(`输出文件：${OUT}`)
console.log(`当前：${Object.keys(doc.paths).length} 个 path / ${opCount} 个操作 / ${doc.tags.length} 个目录`)
