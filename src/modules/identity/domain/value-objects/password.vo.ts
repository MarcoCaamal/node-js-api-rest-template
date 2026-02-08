import { Result } from '@/lib/result/result'
import { ValidationError } from '@/modules/common/errors/validation.error'

/**
 * Password - Password Value Object
 *
 * Responsibilities:
 * - Validate password format and security policy
 * - Store password value (plain or hashed)
 *
 * Does NOT hash passwords - that's application layer concern.
 * Domain only cares about validation rules.
 *
 * Password Policy:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 *
 * @example
 * ```typescript
 * // Create new password (with validation)
 * const passwordResult = Password.create('SecureP@ss123')
 * if (passwordResult.isSuccess()) {
 *   const password = passwordResult.value
 *   // Hash in application layer before saving
 * }
 *
 * // Reconstitute from database (already hashed)
 * const hashedPassword = Password.fromString('$2b$10$...')
 * ```
 */
export class Password {
  private constructor(private readonly value: string) {}

  /**
   * Create password with validation (for new passwords)
   *
   * Validates password policy but does NOT hash.
   * Use application layer service to hash before persisting.
   */
  static create(password: string): Result<Password, ValidationError> {
    // Validate not empty
    if (!password || password.trim().length === 0) {
      return Result.fail(new ValidationError('password', 'Password cannot be empty'))
    }

    // Validate minimum length
    if (password.length < 8) {
      return Result.fail(
        new ValidationError('password', 'Password must be at least 8 characters long')
      )
    }

    // Validate maximum length (bcrypt limit is 72 bytes)
    if (password.length > 72) {
      return Result.fail(new ValidationError('password', 'Password cannot exceed 72 characters'))
    }

    // Validate password policy: uppercase
    if (!/[A-Z]/.test(password)) {
      return Result.fail(
        new ValidationError('password', 'Password must contain at least one uppercase letter')
      )
    }

    // Validate password policy: lowercase
    if (!/[a-z]/.test(password)) {
      return Result.fail(
        new ValidationError('password', 'Password must contain at least one lowercase letter')
      )
    }

    // Validate password policy: number
    if (!/[0-9]/.test(password)) {
      return Result.fail(
        new ValidationError('password', 'Password must contain at least one number')
      )
    }

    // Validate password policy: special character
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/'`~]/.test(password)) {
      return Result.fail(
        new ValidationError('password', 'Password must contain at least one special character')
      )
    }

    return Result.ok(new Password(password))
  }

  /**
   * Create from existing value (from database, already hashed)
   *
   * No validation - assumes value is already valid (hashed password).
   * Use this when reconstituting entities from database.
   */
  static fromString(value: string): Password {
    return new Password(value)
  }

  /**
   * Get the password value
   *
   * Note: This should only be used in application layer
   * for hashing or comparison. Never expose to clients.
   */
  getValue(): string {
    return this.value
  }

  /**
   * Value equality
   */
  equals(other: Password): boolean {
    return this.value === other.value
  }
}
