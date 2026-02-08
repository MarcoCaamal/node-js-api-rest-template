import { randomUUID } from 'node:crypto'
import { Result } from '@/lib/result/result'
import { ValidationError } from '@/modules/common/errors/validation.error'

/**
 * UserId - User unique identifier Value Object
 *
 * Wraps UUID string to provide type safety and prevent mixing
 * user IDs with other entity IDs.
 *
 * @example
 * ```typescript
 * // Generate new ID
 * const userId = UserId.create()
 *
 * // From existing string
 * const userIdResult = UserId.fromString('123e4567-e89b-12d3-a456-426614174000')
 * if (userIdResult.isSuccess()) {
 *   console.log(userIdResult.value.getValue())
 * }
 * ```
 */
export class UserId {
  private constructor(private readonly value: string) {}

  /**
   * Create new UserId with generated UUID
   */
  static create(): UserId {
    return new UserId(randomUUID())
  }

  /**
   * Create UserId from existing string with validation
   */
  static fromString(id: string): Result<UserId, ValidationError> {
    if (!id || id.trim().length === 0) {
      return Result.fail(new ValidationError('userId', 'User ID cannot be empty'))
    }

    // Validate UUID v4 format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

    if (!uuidRegex.test(id)) {
      return Result.fail(new ValidationError('userId', 'User ID must be a valid UUID v4'))
    }

    return Result.ok(new UserId(id))
  }

  /**
   * Get the underlying UUID string value
   */
  getValue(): string {
    return this.value
  }

  /**
   * Value equality comparison
   */
  equals(other: UserId): boolean {
    return this.value === other.value
  }

  /**
   * String representation
   */
  toString(): string {
    return this.value
  }
}
