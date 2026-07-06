/**
 * Logging System
 * Structured logging with multiple transports (console, file, external)
 */

import config from './config.js'

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
}

const LEVEL_COLORS = {
  ERROR: '\x1b[31m', // Red
  WARN: '\x1b[33m', // Yellow
  INFO: '\x1b[36m', // Cyan
  DEBUG: '\x1b[90m' // Gray
}

const RESET_COLOR = '\x1b[0m'

class Logger {
  constructor(options = {}) {
    this.level = options.level || config.logging.level
    this.format = options.format || config.logging.format
    this.isDev = config.isDev
    this.context = options.context || 'PayTray'
  }

  /**
   * Format log entry
   */
  formatLog(level, message, data = null) {
    const timestamp = new Date().toISOString()
    const baselog = {
      timestamp,
      level,
      context: this.context,
      message
    }

    if (data) {
      baselog.data = data
    }

    return baselog
  }

  /**
   * Output log
   */
  output(level, message, data = null) {
    if (LOG_LEVELS[level] > LOG_LEVELS[this.level]) {
      return // Skip if below log level
    }

    const logEntry = this.formatLog(level, message, data)

    if (this.format === 'json' || !this.isDev) {
      // JSON format for production/logging services
      console[level.toLowerCase()](JSON.stringify(logEntry))
    } else {
      // Pretty format for development
      const color = LEVEL_COLORS[level]
      const timestamp = new Date().toLocaleTimeString()
      console[level.toLowerCase()](
        `${color}[${timestamp}] [${level}] ${this.context}: ${message}${RESET_COLOR}`,
        data ? data : ''
      )
    }
  }

  /**
   * Error logging
   */
  error(message, error = null, context = null) {
    const data = error ? {
      error: error.message,
      stack: error.stack,
      ...(context && { context })
    } : context

    this.output('ERROR', message, data)
  }

  /**
   * Warning logging
   */
  warn(message, data = null) {
    this.output('WARN', message, data)
  }

  /**
   * Info logging
   */
  info(message, data = null) {
    this.output('INFO', message, data)
  }

  /**
   * Debug logging
   */
  debug(message, data = null) {
    this.output('DEBUG', message, data)
  }

  /**
   * HTTP request logging
   */
  http(req, res, duration) {
    const method = req.method
    const url = req.originalUrl || req.url
    const status = res.statusCode
    const statusColor = status >= 400 ? '\x1b[31m' : status >= 300 ? '\x1b[33m' : '\x1b[32m'

    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'HTTP',
      method,
      url,
      status,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    }

    if (this.format === 'json' || !this.isDev) {
      console.log(JSON.stringify(logEntry))
    } else {
      console.log(
        `${statusColor}[HTTP] ${method} ${url} ${status} ${duration}ms${RESET_COLOR}`
      )
    }
  }

  /**
   * Performance logging
   */
  performance(label, duration) {
    const unit = duration > 1000 ? 's' : 'ms'
    const value = duration > 1000 ? (duration / 1000).toFixed(2) : duration.toFixed(2)

    this.info(`⏱️  ${label}: ${value}${unit}`, { duration })
  }

  /**
   * Audit logging (for security events)
   */
  audit(action, userId, details = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'AUDIT',
      action,
      userId,
      ...(details && { details })
    }

    console.log(JSON.stringify(logEntry))
  }
}

// Singleton instance
let loggerInstance = null

/**
 * Get or create logger instance
 */
export function getLogger(context = 'PayTray') {
  if (!loggerInstance) {
    loggerInstance = new Logger({ context })
  }
  return loggerInstance
}

/**
 * Create logger with context
 */
export function createLogger(context) {
  return new Logger({ context })
}

/**
 * Express middleware for request logging
 */
export function requestLogger(req, res, next) {
  const logger = getLogger('HTTP')
  const start = Date.now()

  // Capture response end
  const originalEnd = res.end
  res.end = function (...args) {
    const duration = Date.now() - start
    logger.http(req, res, duration)
    originalEnd.apply(res, args)
  }

  next()
}

/**
 * Express error logging middleware
 */
export function errorLogger(err, req, res, next) {
  const logger = getLogger('ErrorHandler')
  logger.error(`${req.method} ${req.url}`, err, {
    url: req.url,
    method: req.method,
    statusCode: res.statusCode
  })
  next(err)
}

export default {
  Logger,
  getLogger,
  createLogger,
  requestLogger,
  errorLogger,
  LOG_LEVELS
}
