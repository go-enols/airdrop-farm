/**
 * @file 日志工具
 * @description 提供应用统一的日志基础设施，包括日志级别控制、格式化输出、
 *              数据库持久化（通过 StoreService 注册）、EPIPE 静默处理。
 *              所有业务模块通过 createLogger(category) 获取 Logger 实例。
 * @module main/utils
 */

/**
 * Monkey-patch process.stdout/stderr.write 静默忽略 EPIPE 错误。
 *
 * EPIPE 在父进程管道关闭时发生（如终端关闭或应用关闭），但 Node.js 仍尝试写入。
 * 此补丁捕获所有来源的 EPIPE：Logger、console.*、HTTP 服务器内部或第三方代码。
 */
function wrapStream(stream: NodeJS.WriteStream): void {
  const orig = stream.write.bind(stream) as typeof stream.write
  stream.write = function (...args: Parameters<typeof orig>): boolean {
    try {
      return orig(...args)
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'EPIPE') {

        return false
      }
      throw err
    }
  } as typeof stream.write
}

wrapStream(process.stdout)
wrapStream(process.stderr)

/** 日志级别枚举 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/** 日志级别优先级映射（数值越大越重要） */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
}

/**
 * 从环境变量 LOG_LEVEL 解析日志级别
 * @returns 解析后的日志级别，默认 'info'
 */
function resolveLogLevel(): LogLevel {
  const env = process.env.LOG_LEVEL?.toLowerCase()
  if (env && env in LOG_LEVEL_PRIORITY) {
    return env as LogLevel
  }
  return 'info'
}

/** 当前生效的日志级别 */
const currentLogLevel: LogLevel = resolveLogLevel()

/** 应用是否正在关闭（关闭期间禁止日志输出以避免管道写入） */
let isShuttingDown = false

/** 数据库日志写入函数类型：写入日志到 app_logs 表 */
type DbLoggerFn = (level: string, category: string, message: string, fields?: Record<string, unknown>) => void

/**
 * 日志器
 *
 * 提供按分类的日志记录功能，支持 debug / info / warn / error 四级。
 * 输出到控制台的同时，可通过 setDbLogger() 注册回调写入数据库。
 *
 * 使用方式：
 * ```ts
 * const log = createLogger('my-module')
 * log.info('Operation completed', { duration: 100 })
 * log.error('Failed', { error: err.message })
 * ```
 */
export class Logger {
  /** 数据库日志写入回调（由 StoreService 初始化后注册） */
  private static dbLogger?: DbLoggerFn

  /**
   * @param category - 日志分类名称，用于区分日志来源模块
   */
  constructor(public readonly category: string) {}

  /**
   * 注册数据库日志写入回调
   *
   * 由 StoreService 在数据库就绪后调用，注册后所有日志同时写入数据库的 app_logs 表。
   *
   * @param fn - 日志写入回调函数
   */
  static setDbLogger(fn: DbLoggerFn): void {
    Logger.dbLogger = fn
  }

  /**
   * 关闭日志系统
   *
   * 在 app 'before-quit' 早期调用，抑制后续日志输出，防止关闭期间写入已断开的管道。
   */
  static shutdown(): void {
    isShuttingDown = true
  }

  /**
   * 检查当前级别是否应输出
   * @param level - 待检查的日志级别
   * @returns 是否允许输出
   */
  private shouldLog(level: LogLevel): boolean {
    if (isShuttingDown) return false
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[currentLogLevel]
  }

  /**
   * 格式化日志消息
   * 格式：[LEVEL] [category] message {"fields"}
   * @param level - 日志级别
   * @param msg - 日志消息文本
   * @param fields - 可选的附加结构化字段（JSON 序列化）
   * @returns 格式化后的日志字符串
   */
  private format(level: LogLevel, msg: string, fields?: Record<string, unknown>): string {
    const base = `[${level.toUpperCase()}] [${this.category}] ${msg}`
    if (fields && Object.keys(fields).length > 0) {
      return `${base} ${JSON.stringify(fields)}`
    }
    return base
  }

  /**
   * 日志发射内部方法
   * 先输出到控制台，再写入数据库（如有注册回调）。
   * 数据库写入失败时静默忽略，不影响主流程。
   * @param level - 日志级别
   * @param msg - 日志消息
   * @param fields - 可选的附加字段
   */
  private emit(level: LogLevel, msg: string, fields?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) return
    const formatted = this.format(level, msg, fields)
    console[level](formatted)
    try {
      Logger.dbLogger?.(level, this.category, msg, fields)
    } catch {
      // 数据库写入失败时静默忽略
    }
  }

  /** 输出 DEBUG 级别日志 */
  debug(msg: string, fields?: Record<string, unknown>): void {
    this.emit('debug', msg, fields)
  }

  /** 输出 INFO 级别日志 */
  info(msg: string, fields?: Record<string, unknown>): void {
    this.emit('info', msg, fields)
  }

  /** 输出 WARN 级别日志 */
  warn(msg: string, fields?: Record<string, unknown>): void {
    this.emit('warn', msg, fields)
  }

  /** 输出 ERROR 级别日志 */
  error(msg: string, fields?: Record<string, unknown>): void {
    this.emit('error', msg, fields)
  }
}

/**
 * 创建指定分类的 Logger 实例
 * @param category - 日志分类名称
 * @returns Logger 实例
 */
export function createLogger(category: string): Logger {
  return new Logger(category)
}
