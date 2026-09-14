import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import systeminformation from 'systeminformation'

@Injectable()
export class ServerService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /* 获取cpu信息 */
  public async getCpuInfo() {
    const cup = await systeminformation.cpu()
    const currentLoad = await systeminformation.currentLoad()
    const used = currentLoad.currentLoadUser.toFixed(2) + '%'
    const system = currentLoad.currentLoadSystem.toFixed(2) + '%'
    const free = (100 - currentLoad.currentLoadUser - currentLoad.currentLoadSystem).toFixed(2) + '%'
    return { cores: cup.cores, used, system, free }
  }

  /* 获取内存信息 */
  public async getMemoryInfo() {
    const { total, used, free } = await systeminformation.mem()
    const GB_FACTOR = 1024 * 1024 * 1024
    const totalGB = (total / GB_FACTOR).toFixed(2) + 'GB'
    const usedGB = (used / GB_FACTOR).toFixed(2) + 'GB'
    const freeGB = (free / GB_FACTOR).toFixed(2) + 'GB'
    const usage = ((used / total) * 100).toFixed(2) + '%'
    return { total: totalGB, used: usedGB, free: freeGB, usage }
  }

  /* 获取服务器基本信息 */
  public async getServerInfo() {
    const osInfo = await systeminformation.osInfo()
    const networkInterfaces = await systeminformation.networkInterfaces()
    const primaryInterface = networkInterfaces.find((net) => net.internal === false) || networkInterfaces[0]
    return { hostname: osInfo.hostname, platform: osInfo.platform, ip: primaryInterface.ip4, arch: osInfo.arch }
  }

  /* 获取磁盘文件系统状态 */
  public async getDiskInfo() {
    const diskPartitions = await systeminformation.fsSize()
    const disks = diskPartitions.map((partition) => {
      const GB_FACTOR = 1024 ** 3
      const total = (partition.size / GB_FACTOR).toFixed(2) + 'GB'
      const used = (partition.used / GB_FACTOR).toFixed(2) + 'GB'
      const free = ((partition.size - partition.used) / GB_FACTOR).toFixed(2) + 'GB'
      const usage = partition.use.toFixed(2) + '%'
      return { fs: partition.fs, mount: partition.mount, type: partition.type, total, used, free, usage }
    })
    return disks
  }

  /* 获取数据库连接池状态（SQL 取数，不依赖 mysql2 私有属性） */
  public async getPoolInfo() {
    const [statusRows, variableRows] = await Promise.all([
      this.dataSource.query("SHOW GLOBAL STATUS WHERE Variable_name IN ('Threads_connected', 'Threads_running', 'Max_used_connections')"),
      this.dataSource.query("SHOW VARIABLES LIKE 'max_connections'"),
    ])
    const status = Object.fromEntries(statusRows.map((row: { Variable_name: string; Value: string }) => [row.Variable_name, Number(row.Value)]))
    const maxConnections = Number(variableRows[0]?.Value ?? 0)
    return {
      /** 当前已建立连接数 */
      current: status.Threads_connected ?? 0,
      /** 正在执行 SQL 的连接数 */
      running: status.Threads_running ?? 0,
      /** 历史峰值连接数 */
      maxUsed: status.Max_used_connections ?? 0,
      /** 连接上限 */
      maxConnections,
    }
  }
}
