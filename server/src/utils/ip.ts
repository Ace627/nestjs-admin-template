import axios from 'axios'
import iconv from 'iconv-lite'
import { defaultDbFile, newWithFileOnly } from 'ip2region-ts'

// 初始化 Searcher 实例
const searcher = newWithFileOnly(defaultDbFile)

/**
 * 获取客户端真实 IP
 * - 以 TCP 直连对端为准：对端非内网（可信代理）时转发头一律不可信，直接采信 TCP 层地址，
 *   防止公网客户端伪造 X-Forwarded-For / X-Real-IP 绕过限流与登录锁定
 * - 可信代理（Nginx 覆盖式转发）场景下读转发头：优先 X-Real-IP，其次 X-Forwarded-For
 *   取最后一个元素（代理追加的真实客户端 IP，兼容追加式转发链）
 * - 已知取舍：内网客户端直连时同样命中可信判定，可伪造头骗过，风险面收窄到内网可接受
 * @param {ExpressRequest} request - Express 请求对象
 * @returns {string} 客户端真实 IP 地址
 */
export function getRequestIp(request: ExpressRequest): string {
  const remoteIp = (request.socket.remoteAddress || '').trim().replace(/^::ffff:/, '')
  const normalizedRemoteIp = remoteIp === '::1' ? '127.0.0.1' : remoteIp
  if (!isInternalIp(normalizedRemoteIp)) return normalizedRemoteIp
  const xRealIp = request.headers['x-real-ip']
  if (xRealIp) {
    const ip = (Array.isArray(xRealIp) ? xRealIp[0] : xRealIp).trim().replace(/^::ffff:/, '')
    return ip === '::1' ? '127.0.0.1' : ip
  }
  const xForwardedFor = request.headers['x-forwarded-for']
  if (xForwardedFor) {
    const forwarded = Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor
    const ip = (forwarded.split(',').pop()?.trim() || '').replace(/^::ffff:/, '')
    return ip === '::1' ? '127.0.0.1' : ip
  }
  return normalizedRemoteIp
}

/**
 * 判断是否为内网 IP 地址
 * - 支持 IPv4 内网地址段：127.0.0.0/8、10.0.0.0/8、172.16.0.0/12、192.168.0.0/16
 * @param {string} ip - IP 地址字符串
 * @returns {boolean} 是否为内网 IP
 * @example
 * // 内网 IP
 * isInternalIp('192.168.1.1') // 返回 true
 * // 外网 IP
 * isInternalIp('8.8.8.8') // 返回 false
 */
export function isInternalIp(ip: string): boolean {
  if (!ip) return false
  const regex = /^(127\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.)/
  return regex.test(ip.trim())
}

/**
 * pconline 在线查询 IP 归属地
 * @param ip - IP 地址字符串
 * @returns 查询成功返回位置字符串，失败或无结果返回空字符串
 */
async function searchByPconline(ip: string): Promise<string> {
  try {
    const url = `https://whois.pconline.com.cn/ipJson.jsp?ip=${ip}&json=true`
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 3000 })
    const data = JSON.parse(iconv.decode(response.data, 'gbk'))
    return data.addr || ''
  } catch (error) {
    return ''
  }
}

/**
 * ip2region 离线库查询 IP 归属地
 * @param ip - IP 地址字符串
 * @returns 查询成功返回位置字符串，失败返回 '未知位置'
 */
async function searchByIp2Region(ip: string): Promise<string> {
  try {
    const data = await searcher.search(ip)
    const region = data?.region || ''
    if (!region) return '未知位置'
    const [country, _, province, city, isp] = region.split('|')
    const location = `${province || ''} ${city || ''}`.trim()
    return province !== '0' && city !== '0' ? location : '未知位置'
  } catch (error) {
    return '未知位置'
  }
}

/**
 * 根据 IP 地址获取位置信息
 * - 优先 pconline 在线接口查询，失败或无结果时回退 ip2region 离线库
 * @param ip - IP 地址字符串
 * @returns {Promise<string>} 位置信息字符串
 */
export async function getLocationByIP(ip: string): Promise<string> {
  if (!ip) return '未知位置'
  if (isInternalIp(ip)) return '内网IP'
  const onlineLocation = await searchByPconline(ip)
  if (onlineLocation) return onlineLocation
  return searchByIp2Region(ip)
}
