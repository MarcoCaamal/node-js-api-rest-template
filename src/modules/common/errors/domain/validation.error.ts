import { DomainError } from '@/lib/errors/domain-error'
import { ErrorContext } from '@/lib/errors/error-context'

/**
 * ValidationError - Domain error for value object and entity validation failures
 *
 * Use this error when:
 * - Value object creation fails (invalid email, invalid phone, etc)
 * - Entity invariants are violated
 * - Input data doesn't meet business rules
 *
 * HTTP Status: 400 Bad Request
 * Severity: LOW (expected user input errors)
 *
 * @example
 * ```typescript
 * // In Value Object
 * class Email {
 *   static create(value: string): Result<Email, ValidationError> {
 *     if (!value || value.trim().length === 0) {
 *       return Result.fail(
 *         new ValidationError('email', 'Email cannot be empty', {
 *           aggregateType: 'User',
 *           metadata: { providedValue: value }
 *         })
 *       )
 *     }
 *
 *     if (!this.isValidFormat(value)) {
 *       return Result.fail(
 *         new ValidationError('email', 'Invalid email format', {
 *           aggregateType: 'User',
 *           metadata: { providedValue: value }
 *         })
 *       )
 *     }
 *
 *     return Result.ok(new Email(value))
 *   }
 * }
 *
 * // In Entity invariants
 * class User {
 *   changePassword(newPassword: string): Result<void, ValidationError> {
 *     if (newPassword.length < 8) {
 *       return Result.fail(
 *         new ValidationError(
 *           'password',
 *           'Password must be at least 8 characters',
 *           { aggregateId: this.id, aggregateType: 'User' }
 *         )
 *       )
 *     }
 *     // ...
 *   }
 * }
 * ```
 */
export class ValidationError extends DomainError {
  readonly errorCode = 'VALIDATION_ERROR'
  readonly httpStatus = 400

  /**
   * The field that failed validation
   */
  public readonly field: string

  /**
   * Human-readable reason for the validation failure
   */
  public readonly reason: string

  constructor(field: string, reason: string, context?: ErrorContext) {
    super(`Validation failed for '${field}': ${reason}`, context)

    this.field = field
    this.reason = reason
  }

  /**
   * Override toJSON to include field and reason
   */
  toJSON() {
    return {
      ...super.toJSON(),
      field: this.field,
      reason: this.reason
    }
  }
}
