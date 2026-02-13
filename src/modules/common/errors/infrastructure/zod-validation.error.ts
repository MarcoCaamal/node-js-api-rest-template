import { ApplicationError, ErrorContext } from '@/lib/errors'
import { z } from 'zod'

/**
 * Validation Error Detail (RFC 9457 Problem Details compliant)
 *
 * Represents a single validation error following RFC 9457 standard.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc9457.html|RFC 9457 - Problem Details for HTTP APIs}
 */
export interface ValidationErrorDetail {
  /**
   * Human-readable explanation of the validation failure
   *
   * @example 'must be a valid email address'
   * @example 'must be at least 8 characters'
   */
  detail: string

  /**
   * Path to the field that failed validation (using dot notation)
   *
   * @remarks
   * Uses Zod's path format (e.g., 'email', 'profile.name', 'items.0.price')
   * More intuitive than JSON Pointer for nested objects and arrays.
   *
   * @example 'email'
   * @example 'profile.name'
   * @example 'items.0.price'
   */
  path: string
}

/**
 * Zod Validation Error (RFC 9457 Problem Details for Zod validation failures)
 *
 * Use this error when Zod schema validation fails in controllers/HTTP layer.
 * Provides structured validation errors following RFC 9457 Problem Details standard.
 *
 * HTTP Status: 400 Bad Request
 * Severity: LOW (expected user input errors)
 *
 * @remarks
 * This error is specifically for request validation (body, query, params).
 * Domain validation errors (Value Objects, Entities) should use ValidationError.
 *
 * Format follows RFC 9457 with additional 'errors' array for multiple validation failures.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc9457.html|RFC 9457 - Problem Details for HTTP APIs}
 * @see {@link https://zod.dev|Zod Documentation}
 *
 * @example
 * ```typescript
 * // In Controller
 * import { z } from 'zod'
 *
 * const registerSchema = z.object({
 *   email: z.string().email(),
 *   password: z.string().min(8),
 *   profile: z.object({
 *     name: z.string().min(1)
 *   })
 * })
 *
 * async register(req: Request, res: Response, next: NextFunction) {
 *   const result = registerSchema.safeParse(req.body)
 *
 *   if (!result.success) {
 *     return next(ZodValidationError.fromZodError(result.error))
 *   }
 *
 *   // Process valid data...
 * }
 * ```
 *
 * @example
 * ```json
 * // HTTP Response (400 Bad Request)
 * {
 *   "type": "https://api.example.com/errors/validation-error",
 *   "title": "Your request is not valid.",
 *   "status": 400,
 *   "errors": [
 *     {
 *       "detail": "Invalid email format",
 *       "path": "email"
 *     },
 *     {
 *       "detail": "Password must be at least 8 characters",
 *       "path": "password"
 *     },
 *     {
 *       "detail": "Name is required",
 *       "path": "profile.name"
 *     }
 *   ]
 * }
 * ```
 */
export class ZodValidationError extends ApplicationError {
  readonly errorCode = 'VALIDATION_ERROR'
  readonly httpStatus = 400

  /**
   * RFC 9457 'type' field - URI reference identifying the problem type
   *
   * @remarks
   * Should be a URI that identifies the error type.
   * Can be used by clients to identify the error programmatically.
   * Defaults to 'about:blank' as per RFC 9457 specification.
   */
  public readonly type: string

  /**
   * RFC 9457 'title' field - Short, human-readable summary
   *
   * @remarks
   * Should be the same for all instances of this error type.
   * Useful for displaying in UI error dialogs.
   */
  public readonly title: string

  /**
   * Array of validation errors
   *
   * @remarks
   * Each error contains:
   * - detail: Human-readable explanation
   * - path: Field path using dot notation (e.g., 'profile.name')
   */
  public readonly errors: ValidationErrorDetail[]

  /**
   * Creates a ZodValidationError instance
   *
   * @param errors - Array of validation error details
   * @param type - URI identifying the error type (default: 'about:blank' per RFC 9457)
   * @param title - Human-readable title (default: 'Your request is not valid.')
   * @param context - Additional error context for logging
   *
   * @private Use {@link fromZodError} factory method instead
   */
  private constructor(
    errors: ValidationErrorDetail[],
    type: string = 'about:blank',
    title: string = 'Your request is not valid.',
    context?: ErrorContext
  ) {
    const message = ZodValidationError.buildMessage(title, errors)
    super(message, context)

    this.type = type
    this.title = title
    this.errors = errors
  }

  /**
   * Factory method to create ZodValidationError from Zod's ZodError
   *
   * @param zodError - The ZodError thrown by Zod schema validation
   * @param typeUri - URI for the 'type' field (optional, defaults to 'about:blank' per RFC 9457)
   * @returns ZodValidationError instance with structured errors
   *
   * @remarks
   * Converts Zod's issues array into RFC 9457 compliant error format.
   * Preserves Zod's path information for nested fields.
   *
   * RFC 9457 specifies that 'type' should be a URI reference.
   * If not provided, it defaults to 'about:blank' which indicates
   * the error is explained by the status code and title.
   *
   * @example
   * ```typescript
   * const schema = z.object({ email: z.string().email() })
   * const result = schema.safeParse({ email: 'invalid' })
   *
   * if (!result.success) {
   *   const error = ZodValidationError.fromZodError(result.error)
   *   throw error
   * }
   *
   * // With custom type URI
   * const error = ZodValidationError.fromZodError(
   *   result.error,
   *   'https://api.example.com/problems/validation-error'
   * )
   * ```
   */
  static fromZodError(zodError: z.ZodError, typeUri?: string): ZodValidationError {
    const errors: ValidationErrorDetail[] = zodError.issues.map((issue) => ({
      detail: issue.message,
      path: issue.path.join('.') || 'body' // Use 'body' if path is empty
    }))

    // RFC 9457: Use 'about:blank' if no type URI is provided
    const type = typeUri ?? 'about:blank'

    return new ZodValidationError(errors, type, 'Your request is not valid.', {
      operation: 'request_validation'
    })
  }

  /**
   * Builds a concise error message for logging
   *
   * @private
   * @param title - Error title
   * @param errors - Array of validation errors
   * @returns Formatted error message
   *
   * @example
   * // Returns: "Your request is not valid. Validation failed for 2 fields: email, password"
   */
  private static buildMessage(title: string, errors: ValidationErrorDetail[]): string {
    const fieldNames = errors.map((e) => e.path).join(', ')
    const count = errors.length
    return `${title} Validation failed for ${count} field${count > 1 ? 's' : ''}: ${fieldNames}`
  }

  /**
   * Serializes error to RFC 9457 Problem Details format
   *
   * @returns JSON object following RFC 9457 specification
   *
   * @remarks
   * The response includes RFC 9457 required fields:
   * - type: URI identifying the error type (defaults to 'about:blank')
   * - title: Human-readable summary
   * - status: HTTP status code (400)
   * - detail: Human-readable explanation (message)
   *
   * Plus custom extension members:
   * - errors: Array of validation errors with path and detail
   * - errorCode: Machine-readable error code
   * - And all fields from BaseError (name, timestamp, etc.)
   *
   * @see {@link https://www.rfc-editor.org/rfc/rfc9457.html#section-3|RFC 9457 Section 3}
   *
   * @example
   * ```json
   * {
   *   "type": "about:blank",
   *   "title": "Your request is not valid.",
   *   "status": 400,
   *   "detail": "Your request is not valid. Validation failed for 2 fields: email, password",
   *   "errorCode": "VALIDATION_ERROR",
   *   "name": "ZodValidationError",
   *   "httpStatus": 400,
   *   "severity": "LOW",
   *   "timestamp": "2026-02-12T18:30:00.000Z",
   *   "isOperational": true,
   *   "errors": [
   *     { "detail": "Invalid email", "path": "email" },
   *     { "detail": "Too short", "path": "password" }
   *   ]
   * }
   * ```
   */
  toJSON() {
    const base = super.toJSON()

    return {
      // RFC 9457 required/standard fields
      type: this.type,
      title: this.title,
      status: this.httpStatus,
      detail: this.message, // RFC 9457 uses 'detail' for the message

      // Custom extension members (allowed by RFC 9457)
      errorCode: this.errorCode,
      errors: this.errors,

      // Additional fields from BaseError (maintain compatibility)
      name: base.name,
      message: base.message, // Keep for backwards compatibility
      httpStatus: base.httpStatus, // Keep for backwards compatibility
      severity: base.severity,
      timestamp: base.timestamp,
      isOperational: base.isOperational
    }
  }
}
