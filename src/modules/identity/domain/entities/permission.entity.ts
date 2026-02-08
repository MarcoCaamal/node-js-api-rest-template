import { Result } from '@/lib/result/result'
import { ValidationError } from '@/modules/common/errors/validation.error'
import { PermissionId } from '../value-objects/permission-id.vo'

interface PermissionProps {
  id: PermissionId
  resource: string
  action: string
  description: string
  createdAt: Date
}

interface CreatePermissionProps {
  resource: string
  action: string
  description: string
}

/**
 * Permission Entity
 *
 * Represents a granular permission in the system.
 * Permissions follow the format: "resource:action"
 *
 * Examples:
 * - users:create, users:read, users:update, users:delete
 * - roles:create, roles:read, roles:update, roles:delete
 * - permissions:read
 *
 * Business Rules:
 * - Resource must be alphanumeric, lowercase, max 50 chars
 * - Action must be alphanumeric, lowercase, max 50 chars
 * - Description is required, max 255 chars
 * - Permission code (resource:action) must be unique (enforced by repository)
 */
export class Permission {
  private constructor(
    private readonly _id: PermissionId,
    private readonly _resource: string,
    private readonly _action: string,
    private _description: string,
    private readonly _createdAt: Date
  ) {}

  /**
   * Creates a new Permission (factory method)
   */
  static create(props: CreatePermissionProps): Result<Permission, ValidationError> {
    // Validate resource
    const resourceValidation = this.validateResource(props.resource)
    if (!resourceValidation.isSuccess()) {
      return Result.fail(resourceValidation.error)
    }

    // Validate action
    const actionValidation = this.validateAction(props.action)
    if (!actionValidation.isSuccess()) {
      return Result.fail(actionValidation.error)
    }

    // Validate description
    const descriptionValidation = this.validateDescription(props.description)
    if (!descriptionValidation.isSuccess()) {
      return Result.fail(descriptionValidation.error)
    }

    const permission = new Permission(
      PermissionId.create(),
      props.resource.toLowerCase().trim(),
      props.action.toLowerCase().trim(),
      props.description.trim(),
      new Date()
    )

    return Result.ok(permission)
  }

  /**
   * Reconstitutes a Permission from persistence (no validation)
   */
  static reconstitute(props: PermissionProps): Permission {
    return new Permission(
      props.id,
      props.resource,
      props.action,
      props.description,
      props.createdAt
    )
  }

  // === Validation Methods ===

  private static validateResource(resource: string): Result<void, ValidationError> {
    if (!resource || resource.trim().length === 0) {
      return Result.fail(new ValidationError('resource', 'Resource is required'))
    }

    const trimmed = resource.trim()

    if (trimmed.length > 50) {
      return Result.fail(
        new ValidationError('resource', 'Resource must not exceed 50 characters', {
          metadata: { value: trimmed }
        })
      )
    }

    // Must be alphanumeric (and underscores/hyphens)
    if (!/^[a-z0-9_-]+$/i.test(trimmed)) {
      return Result.fail(
        new ValidationError(
          'resource',
          'Resource must contain only alphanumeric characters, underscores, and hyphens',
          { metadata: { value: trimmed } }
        )
      )
    }

    return Result.ok(undefined)
  }

  private static validateAction(action: string): Result<void, ValidationError> {
    if (!action || action.trim().length === 0) {
      return Result.fail(new ValidationError('action', 'Action is required'))
    }

    const trimmed = action.trim()

    if (trimmed.length > 50) {
      return Result.fail(
        new ValidationError('action', 'Action must not exceed 50 characters', {
          metadata: { value: trimmed }
        })
      )
    }

    // Must be alphanumeric (and underscores/hyphens)
    if (!/^[a-z0-9_-]+$/i.test(trimmed)) {
      return Result.fail(
        new ValidationError(
          'action',
          'Action must contain only alphanumeric characters, underscores, and hyphens',
          { metadata: { value: trimmed } }
        )
      )
    }

    return Result.ok(undefined)
  }

  private static validateDescription(description: string): Result<void, ValidationError> {
    if (!description || description.trim().length === 0) {
      return Result.fail(new ValidationError('description', 'Description is required'))
    }

    const trimmed = description.trim()

    if (trimmed.length > 255) {
      return Result.fail(
        new ValidationError('description', 'Description must not exceed 255 characters', {
          metadata: { value: trimmed }
        })
      )
    }

    return Result.ok(undefined)
  }

  // === Business Methods ===

  /**
   * Updates the permission description
   */
  updateDescription(newDescription: string): Result<void, ValidationError> {
    const validation = Permission.validateDescription(newDescription)
    if (!validation.isSuccess()) {
      return validation
    }

    this._description = newDescription.trim()
    return Result.ok(undefined)
  }

  /**
   * Returns the permission code in format "resource:action"
   */
  getCode(): string {
    return `${this._resource}:${this._action}`
  }

  /**
   * Checks if this permission matches a given resource and action
   */
  matches(resource: string, action: string): boolean {
    return (
      this._resource === resource.toLowerCase().trim() &&
      this._action === action.toLowerCase().trim()
    )
  }

  /**
   * Checks if this permission grants access to a specific resource action
   * Supports wildcard matching (e.g., "users:*" matches "users:create")
   */
  grants(resource: string, action: string): boolean {
    const normalizedResource = resource.toLowerCase().trim()
    const normalizedAction = action.toLowerCase().trim()

    // Exact match
    if (this.matches(normalizedResource, normalizedAction)) {
      return true
    }

    // Wildcard action (e.g., "users:*" grants all user actions)
    if (this._action === '*' && this._resource === normalizedResource) {
      return true
    }

    // Wildcard resource (e.g., "*:read" grants read on all resources)
    if (this._resource === '*' && this._action === normalizedAction) {
      return true
    }

    // Super admin wildcard (e.g., "*:*" grants everything)
    if (this._resource === '*' && this._action === '*') {
      return true
    }

    return false
  }

  // === Getters ===

  get id(): PermissionId {
    return this._id
  }

  get resource(): string {
    return this._resource
  }

  get action(): string {
    return this._action
  }

  get description(): string {
    return this._description
  }

  get createdAt(): Date {
    return this._createdAt
  }

  // === Equality ===

  equals(other: Permission): boolean {
    if (!(other instanceof Permission)) {
      return false
    }
    return this._id.equals(other._id)
  }
}
