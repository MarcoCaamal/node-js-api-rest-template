import { randomUUID } from 'node:crypto'
import { Result } from '@/lib/result/result'
import { ValidationError } from '@/modules/common/errors/validation.error'

/**
 * RoleId - Role unique identifier Value Object
 *
 * Wraps UUID string to provide type safety and prevent mixing
 * role IDs with other entity IDs.
 */
export class RoleId {
  private constructor(private readonly value: string) {}

  /**
   * Create new RoleId with generated UUID
   */
  static create(): RoleId {
    return new RoleId(randomUUID())
  }

  /**
   * Create RoleId from existing string with validation
   */
  static fromString(id: string): Result<RoleId, ValidationError> {
    if (!id || id.trim().length === 0) {
      return Result.fail(new ValidationError('roleId', 'Role ID cannot be empty'))
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

    if (!uuidRegex.test(id)) {
      return Result.fail(new ValidationError('roleId', 'Role ID must be a valid UUID v4'))
    }

    return Result.ok(new RoleId(id))
  }

  getValue(): string {
    return this.value
  }

  equals(other: RoleId): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
