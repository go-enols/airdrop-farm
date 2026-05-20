export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

function resolveLogLevel(): LogLevel {
  const env = process.env.LOG_LEVEL?.toLowerCase()
  if (env && env in LOG_LEVEL_PRIORITY) {
    return env as LogLevel
  }
  return 'info'
}

const currentLogLevel: LogLevel = resolveLogLevel()

export class Logger {
  constructor(public readonly category: string) {}

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[currentLogLevel]
  }

  private format(level: LogLevel, msg: string, fields?: Record<string, unknown>): string {
    const base = `[${level.toUpperCase()}] [${this.category}] ${msg}`
    if (fields && Object.keys(fields).length > 0) {
      return `${base} ${JSON.stringify(fields)}`
    }
    return base
  }

  debug(msg: string, fields?: Record<string, unknown>): void {
    if (this.shouldLog('debug')) {
      console.debug(this.format('debug', msg, fields))
    }
  }

  info(msg: string, fields?: Record<string, unknown>): void {
    if (this.shouldLog('info')) {
      console.info(this.format('info', msg, fields))
    }
  }

  warn(msg: string, fields?: Record<string, unknown>): void {
    if (this.shouldLog('warn')) {
      console.warn(this.format('warn', msg, fields))
    }
  }

  error(msg: string, fields?: Record<string, unknown>): void {
    if (this.shouldLog('error')) {
      console.error(this.format('error', msg, fields))
    }
  }
}

export function createLogger(category: string): Logger {
  return new Logger(category)
}
