/**
 * @file 日志缓冲区
 * @description 为任务子进程的 stdout/stderr 输出提供批量缓冲写入功能。
 *              将高频日志按时间间隔或行数阈值批量刷新（flush）到数据库，
 *              减少数据库写入频率，同时控制内存占用上限。
 * @module main/utils
 */
import type { TaskLogLevel } from '../../shared/types'

/** 日志条目结构 */
export interface LogEntry {
  /** 日志级别（info / warn / error / debug） */
  level: TaskLogLevel
  /** 日志消息内容 */
  message: string
  /** ISO 8601 时间戳 */
  timestamp: string
}

/**
 * 日志缓冲区
 *
 * 用于缓存任务子进程产生的实时日志，按以下策略批量刷新：
 * - 达到 maxBatchSize 立即刷新
 * - 未达到时启动定时器，flushIntervalMs 后刷新
 * - 超过 maxBufferLines 时丢弃最早的行并记录截断数
 * - destroy() 时强制刷新剩余日志
 *
 * @example
 * ```ts
 * const buffer = new LogBuffer(
 *   (batch) => taskRepo.batchAddLogs(batch),  // flush 回调
 *   50,                                        // 50ms 刷新间隔
 *   20,                                        // 每批最多 20 条
 *   200                                        // 最多缓存 200 行
 * )
 * buffer.push('info', 'Task started')
 * buffer.push('error', 'Connection failed')
 * buffer.destroy() // 确保最后一批写入
 * ```
 */
export class LogBuffer {
  /** 日志行缓冲数组 */
  private lines: LogEntry[] = []
  /** 定时器引用，用于延迟刷新 */
  private timer: ReturnType<typeof setTimeout> | null = null
  /** 因缓冲区满而被丢弃的日志行数 */
  private truncated = 0

  /**
   * @param flushCallback - 批量写入回调函数，接收 LogEntry 数组
   * @param flushIntervalMs - 定时刷新间隔（默认 50ms）
   * @param maxBatchSize - 触发刷新的行数阈值（默认 20）
   * @param maxBufferLines - 缓冲区最大行数（默认 200，超过时丢弃最旧行）
   */
  constructor(
    private flushCallback: (lines: LogEntry[]) => void,
    private flushIntervalMs = 50,
    private maxBatchSize = 20,
    private maxBufferLines = 200
  ) {}

  /**
   * 推入一条日志
   *
   * 超过最大行数时丢弃最早的行并记录截断数。
   * 达到批量阈值时立即刷新，否则启动定时器延迟刷新。
   *
   * @param level - 日志级别
   * @param message - 日志消息（末尾的换行符会被自动去除）
   */
  push(level: TaskLogLevel, message: string): void {
    // 缓冲区满时丢弃最旧行
    if (this.lines.length >= this.maxBufferLines) {
      this.lines.shift()
      this.truncated++
    }

    this.lines.push({
      level,
      message: message.endsWith('\n') ? message.slice(0, -1) : message,
      timestamp: new Date().toISOString()
    })

    // 达到批处理阈值时立即刷新
    if (this.lines.length >= this.maxBatchSize) {
      this.flush()
      return
    }

    // 首次新日志启动延迟刷新定时器
    if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.flushIntervalMs)
    }
  }

  /**
   * 强制刷新缓冲区
   *
   * 将当前所有缓冲日志通过 flushCallback 写入，如果存在被截断的行数，
   * 在批次末尾追加一条警告日志说明截断数量。
   */
  flush(): void {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }

    if (this.lines.length === 0) return

    const batch = [...this.lines]
    this.lines = []

    // 如有截断，追加截断提示日志
    if (this.truncated > 0) {
      batch.push({
        level: 'warn' as TaskLogLevel,
        message: `[truncated ${this.truncated} earlier lines]`,
        timestamp: new Date().toISOString()
      })
      this.truncated = 0
    }

    this.flushCallback(batch)
  }

  /**
   * 销毁缓冲区
   *
   * 强制刷新剩余日志后清理定时器。
   * 应在任务结束时调用，确保没有日志丢失。
   */
  destroy(): void {
    this.flush()
  }
}
