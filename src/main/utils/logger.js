const LOG_LEVEL_PRIORITY = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
}
function resolveLogLevel() {
  const env = process.env.LOG_LEVEL?.toLowerCase()
  if (env && env in LOG_LEVEL_PRIORITY) {
    return env
  }
  return 'info'
}
const currentLogLevel = resolveLogLevel()
export class Logger {
  category
  constructor(category) {
    this.category = category
  }
  shouldLog(level) {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[currentLogLevel]
  }
  format(level, msg, fields) {
    const base = `[${level.toUpperCase()}] [${this.category}] ${msg}`
    if (fields && Object.keys(fields).length > 0) {
      return `${base} ${JSON.stringify(fields)}`
    }
    return base
  }
  debug(msg, fields) {
    if (this.shouldLog('debug')) {
      console.debug(this.format('debug', msg, fields))
    }
  }
  info(msg, fields) {
    if (this.shouldLog('info')) {
      console.info(this.format('info', msg, fields))
    }
  }
  warn(msg, fields) {
    if (this.shouldLog('warn')) {
      console.warn(this.format('warn', msg, fields))
    }
  }
  error(msg, fields) {
    if (this.shouldLog('error')) {
      console.error(this.format('error', msg, fields))
    }
  }
}
export function createLogger(category) {
  return new Logger(category)
}
