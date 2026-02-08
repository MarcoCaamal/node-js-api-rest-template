import { Result } from '@/lib/result/result'
import { ValidationError } from '@/modules/common/errors/validation.error'
import { RoleId } from '../value-objects/role-id.vo'
import { PermissionId } from '../value-objects/permission-id.vo'

interface RoleProps {
  id: RoleId
  name: string
  description: string
  permissionIds: PermissionId[]
  createdAt: Date
  updatedAt: Date
}

interface CreateRoleProps {
  name: string
  description: string
  permissionIds?: PermissionId[]
}

/**
 * Role Entity
 *
 * Represents a role in the RBAC system.
 * Roles group permissions together and can be assigned to users.
 *
 * Predefined system roles (to be created via seeds):
 * - ADMIN: Can manage users, roles, permissions
 * - USER: Basic authenticated user permissions
 * - GUEST: Read-only access
 *
 * Business Rules:
 * - Name must be unique (enforced by repository)
 * - Name must be alphanumeric uppercase with underscores, max 50 chars
 * - Description is required, max 255 chars
 * - A role can have 0 or more permissions
 * - No duplicate permissions within a role
 */
export class Role {
  private constructor(
    private readonly _id: RoleId,
    private _name: string,
    private _description: string,
    private _permissionIds: PermissionId[],
    private readonly _createdAt: Date,
    private _updatedAt: Date
  ) {}

  /**
   * Creates a new Role (factory method)
   */
  static create(props: CreateRoleProps): Result<Role, ValidationError> {
    // Validate name
    const nameValidation = this.validateName(props.name)
    if (!nameValidation.isSuccess()) {
      return Result.fail(nameValidation.error)
    }

    // Validate description
    const descriptionValidation = this.validateDescription(props.description)
    if (!descriptionValidation.isSuccess()) {
      return Result.fail(descriptionValidation.error)
    }

    // Validate no duplicate permissions
    const permissionIds = props.permissionIds || []
    const duplicateCheck = this.validateNoDuplicatePermissions(permissionIds)
    if (!duplicateCheck.isSuccess()) {
      return Result.fail(duplicateCheck.error)
    }

    const now = new Date()
    const role = new Role(
      RoleId.create(),
      props.name.toUpperCase().trim(),
      props.description.trim(),
      [...permissionIds], // Copy array to prevent external mutation
      now,
      now
    )

    return Result.ok(role)
  }

  /**
   * Reconstitutes a Role from persistence (no validation)
   */
  static reconstitute(props: RoleProps): Role {
    return new Role(
      props.id,
      props.name,
      props.description,
      [...props.permissionIds], // Copy array
      props.createdAt,
      props.updatedAt
    )
  }

  // === Validation Methods ===

  private static validateName(name: string): Result<void, ValidationError> {
    if (!name || name.trim().length === 0) {
      return Result.fail(new ValidationError('name', 'Role name is required'))
    }

    const trimmed = name.trim()

    if (trimmed.length > 50) {
      return Result.fail(
        new ValidationError('name', 'Role name must not exceed 50 characters', {
          metadata: { value: trimmed }
        })
      )
    }

    // Must be alphanumeric uppercase with underscores
    if (!/^[A-Z0-9_]+$/.test(trimmed.toUpperCase())) {
      return Result.fail(
        new ValidationError(
          'name',
          'Role name must contain only uppercase letters, numbers, and underscores',
          { metadata: { value: trimmed } }
        )
      )
    }

    return Result.ok(undefined)
  }

  private static validateDescription(description: string): Result<void, ValidationError> {
    if (!description || description.trim().length === 0) {
      return Result.fail(new ValidationError('description', 'Role description is required'))
    }

    const trimmed = description.trim()

    if (trimmed.length > 255) {
      return Result.fail(
        new ValidationError('description', 'Role description must not exceed 255 characters', {
          metadata: { value: trimmed }
        })
      )
    }

    return Result.ok(undefined)
  }

  private static validateNoDuplicatePermissions(
    permissionIds: PermissionId[]
  ): Result<void, ValidationError> {
    const uniqueIds = new Set(permissionIds.map((id) => id.getValue()))

    if (uniqueIds.size !== permissionIds.length) {
      return Result.fail(
        new ValidationError('permissionIds', 'Role cannot have duplicate permissions')
      )
    }

    return Result.ok(undefined)
  }

  // === Business Methods ===

  /**
   * Changes the role name
   */
  changeName(newName: string): Result<void, ValidationError> {
    const validation = Role.validateName(newName)
    if (!validation.isSuccess()) {
      return validation
    }

    this._name = newName.toUpperCase().trim()
    this._updatedAt = new Date()
    return Result.ok(undefined)
  }

  /**
   * Changes the role description
   */
  changeDescription(newDescription: string): Result<void, ValidationError> {
    const validation = Role.validateDescription(newDescription)
    if (!validation.isSuccess()) {
      return validation
    }

    this._description = newDescription.trim()
    this._updatedAt = new Date()
    return Result.ok(undefined)
  }

  /**
   * Assigns a permission to this role
   */
  assignPermission(permissionId: PermissionId): Result<void, ValidationError> {
    // Check if permission already assigned
    if (this.hasPermission(permissionId)) {
      return Result.fail(
        new ValidationError('permissionId', 'Permission already assigned to this role', {
          metadata: { permissionId: permissionId.getValue() }
        })
      )
    }

    this._permissionIds.push(permissionId)
    this._updatedAt = new Date()
    return Result.ok(undefined)
  }

  /**
   * Removes a permission from this role
   */
  removePermission(permissionId: PermissionId): Result<void, ValidationError> {
    const index = this._permissionIds.findIndex((id) => id.equals(permissionId))

    if (index === -1) {
      return Result.fail(
        new ValidationError('permissionId', 'Permission not found in this role', {
          metadata: { permissionId: permissionId.getValue() }
        })
      )
    }

    this._permissionIds.splice(index, 1)
    this._updatedAt = new Date()
    return Result.ok(undefined)
  }

  /**
   * Checks if this role has a specific permission
   */
  hasPermission(permissionId: PermissionId): boolean {
    return this._permissionIds.some((id) => id.equals(permissionId))
  }

  /**
   * Returns a copy of all permission IDs
   */
  getPermissionIds(): PermissionId[] {
    return [...this._permissionIds]
  }

  /**
   * Returns the number of permissions in this role
   */
  getPermissionCount(): number {
    return this._permissionIds.length
  }

  // === Getters ===

  get id(): RoleId {
    return this._id
  }

  get name(): string {
    return this._name
  }

  get description(): string {
    return this._description
  }

  get createdAt(): Date {
    return this._createdAt
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  // === Equality ===

  equals(other: Role): boolean {
    if (!(other instanceof Role)) {
      return false
    }
    return this._id.equals(other._id)
  }
}
