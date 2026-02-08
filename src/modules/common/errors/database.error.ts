import { InfrastructureError } from '@/lib/errors/infrastructure-error'
import { ErrorContext, ErrorSeverity } from '@/lib/errors/error-context'

/**
 * Database Error
 *
 * Concrete infrastructure error for database operations.
 * Used by repositories when database operations fail.
 */
export class DatabaseError extends InfrastructureError {
  readonly errorCode: string = 'DATABASE_ERROR'
  readonly severity: ErrorSeverity = ErrorSeverity.HIGH
  readonly isOperational: boolean = true

  constructor(message: string, context?: ErrorContext) {
    super(message, context, true)
    this.name = 'DatabaseError'
  }
}
