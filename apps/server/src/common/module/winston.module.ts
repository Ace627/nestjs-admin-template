import { merge } from 'lodash-es'
import { isArray } from '@/utils'
import 'winston-daily-rotate-file'
import { resolve } from 'node:path'
import { transports, format } from 'winston'
import { LoggerService, Module } from '@nestjs/common'
import { WinstonModule as NestWinstonModule, utilities } from 'nest-winston'
import { type DailyRotateFileTransportOptions } from 'winston-daily-rotate-file'

@Module({})
export class WinstonModule {
  private static timestampFormat = format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })

  /**
   * 创建NestJS应用的Winston日志服务实例
   * @returns {LoggerService} 配置好的 NestJS 日志服务实例
   */
  static createLogger(): LoggerService {
    // 定义日志传输目标
    const transportList: transports.StreamTransportInstance[] = []
    const nestLikeFormat = utilities.format.nestLike('NestJS', { prettyPrint: true, colors: true, processId: true })
    transportList.push(new transports.Console({ format: format.combine(this.timestampFormat, nestLikeFormat) }))
    // 日常运维：查看 info 日志了解系统运行状态
    transportList.push(this.createFileTransport({ level: 'info', dirname: resolve('logs/info') }))
    // 问题排查：直接查看 error 日志定位故障，避免被大量 info 日志淹没
    transportList.push(this.createFileTransport({ level: 'error', dirname: resolve('logs/error') }))
    // exitOnError: false 日志系统异常时不终止应用
    return NestWinstonModule.createLogger({ transports: transportList, exitOnError: false, level: 'verbose' })
  }

  /**
   * 创建按日期轮换的文件日志传输器
   * @param {DailyRotateFileTransportOptions} [config={}] 自定义配置项，将合并到基础配置
   * @returns {transports.DailyRotateFile} 配置好的文件传输器实例
   */
  private static createFileTransport(config: DailyRotateFileTransportOptions = {}) {
    const BaseConfig: DailyRotateFileTransportOptions = {}
    // 基础路径配置：优先使用传入的dirname，否则按级别分目录
    Reflect.set(BaseConfig, 'dirname', config.dirname || `logs/${config.level || 'info'}`)

    // 日志分割与命名配置
    Reflect.set(BaseConfig, 'datePattern', 'YYYYMMDD') // 按天分割日志
    Reflect.set(BaseConfig, 'filename', `${config.level}-%DATE%.log`) // 文件名含级别和日期，日志文件名格式，%DATE% 会被替换为实际日期

    // 日志归档与清理策略
    Reflect.set(BaseConfig, 'zippedArchive', true) // 压缩历史日志
    Reflect.set(BaseConfig, 'maxSize', '10m') // 单文件最大 10MB，超过会自动分割
    Reflect.set(BaseConfig, 'maxFiles', '14d') // 保留最近14天的日志文件，自动删除旧文件

    // 日志格式处理（保留原有的 JSON 格式化和时间戳）
    const errorsFormat = format.errors({ stack: true })
    const value = format.combine(this.timestampFormat, errorsFormat, format.json(), format.printf(this.formatLog))
    Reflect.set(BaseConfig, 'format', value)
    return new transports.DailyRotateFile(merge(BaseConfig, config)) as any
  }

  /**
   * 格式化生产环境的日志格式
   * 统一日志字段结构，便于解析和存储
   */
  private static formatLog(info: Record<string, any>) {
    const record: Record<string, any> = {}
    // 依次设置日志必要字段
    Reflect.set(record, 'level', info.level)
    Reflect.set(record, 'time', info.timestamp)
    Reflect.set(record, 'context', info.context)
    Reflect.set(record, 'message', info.message)
    const rawStack = isArray(info.stack) ? info.stack[0] : info.stack
    if (typeof rawStack === 'string') Reflect.set(record, 'stack', rawStack)
    return JSON.stringify(record) // 转为JSON字符串输出
  }
}
