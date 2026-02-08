import { Result } from '@/lib/result/result'
import { ValidationError } from '@/modules/common/errors/validation.error'
import { UserId } from '../value-objects/user-id.vo'
import { Email } from '../value-objects/email.vo'
import { Password } from '../value-objects/password.vo'
import { RoleId } from '../value-objects/role-id.vo'

interface UserProps {
  id: UserId
  email: Email
  password: Password
  firstName: string
  lastName: string
  isActive: boolean
  roleId: RoleId
  createdAt: Date
  updatedAt: Date
}

interface CreateUserProps {
  email: Email
  password: Password
  firstName: string
  lastName: string
  roleId: RoleId
}

/**
 * User Entity (Aggregate Root)
 *
 * Represents a user in the system with authentication and authorization.
 *
 * Business Rules:
 * - Email must be unique (enforced by repository)
 * - Password must be already hashed when creating/reconstituting
 * - First name and last name are required, max 100 chars each
 * - Users are active by default
 * - Inactive users cannot authenticate
 * - Each user has EXACTLY ONE role (not multiple)
 * - User aggregates control their own lifecycle (activate, deactivate)
 */
export class User {
  private constructor(
    private readonly _id: UserId,
    private _email: Email,
    private _password: Password,
    private _firstName: string,
    private _lastName: string,
    private _isActive: boolean,
    private _roleId: RoleId,
    private readonly _createdAt: Date,
    private _updatedAt: Date
  ) {}

  /**
   * Creates a new User (factory method)
   * Note: Password should already be hashed by the application layer
   */
  static create(props: CreateUserProps): Result<User, ValidationError> {
    // Validate first name
    const firstNameValidation = this.validateName(props.firstName, 'firstName')
    if (!firstNameValidation.isSuccess()) {
      return Result.fail(firstNameValidation.error)
    }

    // Validate last name
    const lastNameValidation = this.validateName(props.lastName, 'lastName')
    if (!lastNameValidation.isSuccess()) {
      return Result.fail(lastNameValidation.error)
    }

    const now = new Date()
    const user = new User(
      UserId.create(),
      props.email,
      props.password,
      props.firstName.trim(),
      props.lastName.trim(),
      true, // Active by default
      props.roleId,
      now,
      now
    )

    return Result.ok(user)
  }

  /**
   * Reconstitutes a User from persistence (no validation)
   */
  static reconstitute(props: UserProps): User {
    return new User(
      props.id,
      props.email,
      props.password,
      props.firstName,
      props.lastName,
      props.isActive,
      props.roleId,
      props.createdAt,
      props.updatedAt
    )
  }

  // === Validation Methods ===

  private static validateName(name: string, fieldName: string): Result<void, ValidationError> {
    if (!name || name.trim().length === 0) {
      return Result.fail(new ValidationError(fieldName, `${fieldName} is required`))
    }

    const trimmed = name.trim()

    if (trimmed.length > 100) {
      return Result.fail(
        new ValidationError(fieldName, `${fieldName} must not exceed 100 characters`, {
          metadata: { value: trimmed }
        })
      )
    }

    // Must contain only letters, spaces, hyphens, and apostrophes
    if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
      return Result.fail(
        new ValidationError(
          fieldName,
          `${fieldName} must contain only letters, spaces, hyphens, and apostrophes`,
          { metadata: { value: trimmed } }
        )
      )
    }

    return Result.ok(undefined)
  }

  // === Business Methods ===

  /**
   * Changes the user's email
   */
  changeEmail(newEmail: Email): Result<void, ValidationError> {
    if (this._email.equals(newEmail)) {
      return Result.fail(new ValidationError('email', 'New email is the same as current email'))
    }

    this._email = newEmail
    this._updatedAt = new Date()
    return Result.ok(undefined)
  }

  /**
   * Changes the user's password
   * Note: Password should already be hashed by the application layer
   */
  changePassword(newPassword: Password): Result<void, ValidationError> {
    if (this._password.equals(newPassword)) {
      return Result.fail(
        new ValidationError('password', 'New password is the same as current password')
      )
    }

    this._password = newPassword
    this._updatedAt = new Date()
    return Result.ok(undefined)
  }

  /**
   * Changes the user's first name
   */
  changeFirstName(newFirstName: string): Result<void, ValidationError> {
    const validation = User.validateName(newFirstName, 'firstName')
    if (!validation.isSuccess()) {
      return validation
    }

    this._firstName = newFirstName.trim()
    this._updatedAt = new Date()
    return Result.ok(undefined)
  }

  /**
   * Changes the user's last name
   */
  changeLastName(newLastName: string): Result<void, ValidationError> {
    const validation = User.validateName(newLastName, 'lastName')
    if (!validation.isSuccess()) {
      return validation
    }

    this._lastName = newLastName.trim()
    this._updatedAt = new Date()
    return Result.ok(undefined)
  }

  /**
   * Activates the user account
   */
  activate(): Result<void, ValidationError> {
    if (this._isActive) {
      return Result.fail(new ValidationError('isActive', 'User is already active'))
    }

    this._isActive = true
    this._updatedAt = new Date()
    return Result.ok(undefined)
  }

  /**
   * Deactivates the user account
   */
  deactivate(): Result<void, ValidationError> {
    if (!this._isActive) {
      return Result.fail(new ValidationError('isActive', 'User is already inactive'))
    }

    this._isActive = false
    this._updatedAt = new Date()
    return Result.ok(undefined)
  }

  /**
   * Changes the user's role
   * This is the ONLY way to modify a user's role
   */
  changeRole(newRoleId: RoleId): Result<void, ValidationError> {
    if (this._roleId.equals(newRoleId)) {
      return Result.fail(new ValidationError('roleId', 'New role is the same as current role'))
    }

    this._roleId = newRoleId
    this._updatedAt = new Date()
    return Result.ok(undefined)
  }

  /**
   * Gets the user's role ID
   */
  getRoleId(): RoleId {
    return this._roleId
  }

  /**
   * Returns the full name (first + last)
   */
  getFullName(): string {
    return `${this._firstName} ${this._lastName}`
  }

  /**
   * Checks if the user can authenticate
   */
  canAuthenticate(): boolean {
    return this._isActive
  }

  // === Getters ===

  get id(): UserId {
    return this._id
  }

  get email(): Email {
    return this._email
  }

  get password(): Password {
    return this._password
  }

  get firstName(): string {
    return this._firstName
  }

  get lastName(): string {
    return this._lastName
  }

  get isActive(): boolean {
    return this._isActive
  }

  get createdAt(): Date {
    return this._createdAt
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  // === Equality ===

  equals(other: User): boolean {
    if (!(other instanceof User)) {
      return false
    }
    return this._id.equals(other._id)
  }
}
