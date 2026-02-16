import { Request, Response, NextFunction } from 'express'
import { IMiddleware } from './middleware.interface'
import { ILogger } from '@/lib/logger'

/**
 * LoggerMiddleware - Logs HTTP requests and responses
 *
 * Logs:
 * - Incoming request: method, path, requestId, query, IP
 * - Completed response: statusCode, duration
 *
 * Does NOT log errors (handled by error middleware)
 *
 * @example
 * ```typescript
 * const middleware = new LoggerMiddleware(logger)
 * app.use(middleware.handle.bind(middleware))
 * ```
 */
export class LoggerMiddleware implements IMiddleware {
  private static readonly SENSITIVE_QUERY_KEYS = new Set([
    'token',
    'access_token',
    'refresh_token',
    'authorization',
    'password',
    'secret',
    'api_key',
    'apikey',
    'email'
  ])

  constructor(private readonly logger: ILogger) {}

  handle(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now()
    const sanitizedQuery = this.sanitizeQuery(req.query)

    // Log incoming request
    this.logger.info('Incoming request', {
      requestId: req.id,
      method: req.method,
      path: req.path,
      query: sanitizedQuery,
      ip: req.ip
    })

    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - startTime

      this.logger.info('Request completed', {
        requestId: req.id,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`
      })
    })

    next()
  }

  private sanitizeQuery(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizeQuery(item))
    }

    if (this.isObject(value)) {
      const sanitized: Record<string, unknown> = {}

      for (const [key, currentValue] of Object.entries(value)) {
        if (LoggerMiddleware.SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) {
          sanitized[key] = '[REDACTED]'
          continue
        }

        sanitized[key] = this.sanitizeQuery(currentValue)
      }

      return sanitized
    }

    if (typeof value === 'string') {
      return value.length > 200 ? `${value.slice(0, 200)}...` : value
    }

    return value
  }

  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
  }
}
