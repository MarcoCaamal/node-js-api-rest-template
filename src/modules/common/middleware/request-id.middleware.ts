import { Request, Response, NextFunction } from 'express'
import { randomUUID } from 'node:crypto'
import { IMiddleware } from './middleware.interface'

/**
 * RequestIdMiddleware - Generates and attaches unique request ID
 *
 * Behavior:
 * - Checks for existing request ID in headers
 * - Generates UUID if not present
 * - Attaches to req.id
 * - Sets X-Request-ID response header
 *
 * Use for:
 * - Request tracing across all layers
 * - Correlating logs
 * - Debugging production issues
 *
 * @example
 * ```typescript
 * const middleware = new RequestIdMiddleware()
 * app.use(middleware.handle.bind(middleware))
 *
 * // In route handler
 * console.log(req.id) // "abc-123-def-456"
 * ```
 */
export class RequestIdMiddleware implements IMiddleware {
  private static readonly MAX_REQUEST_ID_LENGTH = 128
  private static readonly SAFE_REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]+$/

  constructor(private readonly headerName: string = 'x-request-id') {}

  handle(req: Request, res: Response, next: NextFunction): void {
    const incomingRequestId = this.getValidIncomingRequestId(req)
    const requestId = incomingRequestId ?? randomUUID()

    // Attach to request object
    req.id = requestId

    // Set response header
    res.setHeader('X-Request-ID', requestId)

    next()
  }

  private getValidIncomingRequestId(req: Request): string | undefined {
    const headerValue = req.get(this.headerName)

    if (!headerValue) {
      return undefined
    }

    const value = headerValue.trim()
    if (!value || value.length > RequestIdMiddleware.MAX_REQUEST_ID_LENGTH) {
      return undefined
    }

    if (!RequestIdMiddleware.SAFE_REQUEST_ID_PATTERN.test(value)) {
      return undefined
    }

    return value
  }
}

/**
 * Type augmentation for Express Request
 * Adds 'id' property to Request interface
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      id: string
    }
  }
}
