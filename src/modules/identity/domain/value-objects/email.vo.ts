import { Result } from '@/lib/result/result'
import { ValidationError } from '@/modules/common/errors/validation.error'

/**
 * Email - Email address Value Object
 *
 * Encapsulates email validation and ensures email is always valid.
 * Normalizes email to lowercase for consistency.
 *
 * @example
 * ```typescript
 * const emailResult = Email.create('user@example.com')
 * if (emailResult.isSuccess()) {
 *   const email = emailResult.value
 *   console.log(email.getValue()) // 'user@example.com'
 * }
 * ```
 */
export class Email {
  private constructor(private readonly value: string) {}

  /**
   * Create Email with validation
   */
  static create(email: string): Result<Email, ValidationError> {
    // Validate not empty
    if (!email || email.trim().length === 0) {
      return Result.fail(new ValidationError('email', 'Email cannot be empty'))
    }

    // Normalize to lowercase
    const normalized = email.trim().toLowerCase()

    // Validate length
    if (normalized.length > 255) {
      return Result.fail(new ValidationError('email', 'Email cannot exceed 255 characters'))
    }

    // Validate format
    // RFC 5322 simplified regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(normalized)) {
      return Result.fail(new ValidationError('email', 'Invalid email format'))
    }

    // Additional validations
    const [localPart, domain] = normalized.split('@')

    if (localPart.length > 64) {
      return Result.fail(
        new ValidationError('email', 'Email local part cannot exceed 64 characters')
      )
    }

    if (domain.length > 255) {
      return Result.fail(new ValidationError('email', 'Email domain cannot exceed 255 characters'))
    }

    return Result.ok(new Email(normalized))
  }

  getValue(): string {
    return this.value
  }

  equals(other: Email): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
