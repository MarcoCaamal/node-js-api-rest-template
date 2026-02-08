import { randomUUID } from 'node:crypto'
import { Result } from '@/lib/result/result'
import { ValidationError } from '@/modules/common/errors/validation.error'

/**
 * PermissionId - Permission unique identifier Value Object
 *
 * Wraps UUID string to provide type safety and prevent mixing
 * permission IDs with other entity IDs.
 */
export class PermissionId {
  private constructor(private readonly value: string) {}

  /**
   * Create new PermissionId with generated UUID
   */
  static create(): PermissionId {
    return new PermissionId(randomUUID())
  }

  /**
   * Create PermissionId from existing string with validation
   */
  static fromString(id: string): Result<PermissionId, ValidationError> {
    if (!id || id.trim().length === 0) {
      return Result.fail(new ValidationError('permissionId', 'Permission ID cannot be empty'))
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

    if (!uuidRegex.test(id)) {
      return Result.fail(
        new ValidationError('permissionId', 'Permission ID must be a valid UUID v4')
      )
    }

    return Result.ok(new PermissionId(id))
  }

  getValue(): string {
    return this.value
  }

  equals(other: PermissionId): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
