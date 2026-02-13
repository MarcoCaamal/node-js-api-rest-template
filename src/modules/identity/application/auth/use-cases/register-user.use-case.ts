import { Result } from '@/lib/result/result'
import { IUserRepository } from '@/modules/identity/domain/repositories/user.repository.interface'
import { IRoleRepository } from '@/modules/identity/domain/repositories/role.repository.interface'
import { IPasswordHashService } from '@/modules/identity/application/services/password-hash.service.interface'
import { Email } from '@/modules/identity/domain/value-objects/email.vo'
import { Password } from '@/modules/identity/domain/value-objects/password.vo'
import { User } from '@/modules/identity/domain/entities/user.entity'
import { UserMapper } from '../mappers/user.mapper'
import { UserResponseDto } from '../dtos/user-response.dto'
import { ConflictError } from '@/modules/common/errors/conflict.error'
import { NotFoundError } from '@/modules/common/errors/not-found.error'

/**
 * Register User Input DTO
 *
 * Data required to register a new user account.
 */
export interface RegisterUserInput {
  /**
   * User's email address (must be unique)
   * @example 'john.doe@example.com'
   */
  email: string

  /**
   * Plain-text password (will be hashed before storage)
   * @minLength 8
   * @maxLength 72
   * @example 'SecureP@ss123!'
   */
  password: string

  /**
   * User's first name
   * @minLength 1
   * @maxLength 100
   * @example 'John'
   */
  firstName: string

  /**
   * User's last name
   * @minLength 1
   * @maxLength 100
   * @example 'Doe'
   */
  lastName: string
}

/**
 * Register User Use Case
 *
 * Handles the business logic for registering a new user in the system.
 *
 * @remarks
 * This use case orchestrates the user registration process:
 * 1. Validates that the email is not already registered
 * 2. Creates and validates value objects (Email, Password)
 * 3. Hashes the password securely using bcrypt
 * 4. Assigns the default "USER" role to new users
 * 5. Creates and persists the User aggregate
 * 6. Returns the created user (without password)
 *
 * Business Rules:
 * - Email must be unique across the system
 * - Password must meet security policy (enforced by Password VO)
 * - All new users are assigned the "USER" role by default
 * - Users are active by default
 *
 * @example
 * ```typescript
 * const useCase = new RegisterUserUseCase(
 *   userRepository,
 *   roleRepository,
 *   passwordHashService
 * )
 *
 * const result = await useCase.execute({
 *   email: 'john.doe@example.com',
 *   password: 'SecureP@ss123!',
 *   firstName: 'John',
 *   lastName: 'Doe'
 * })
 *
 * if (result.isSuccess()) {
 *   console.log('User registered:', result.value)
 * } else {
 *   console.error('Registration failed:', result.error)
 * }
 * ```
 */
export class RegisterUserUseCase {
  /**
   * Default role name assigned to new users
   * @private
   */
  private readonly DEFAULT_ROLE = 'USER'

  /**
   * Creates an instance of RegisterUserUseCase
   *
   * @param userRepository - Repository for user persistence operations
   * @param roleRepository - Repository for role queries
   * @param passwordHashService - Service for password hashing
   */
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly roleRepository: IRoleRepository,
    private readonly passwordHashService: IPasswordHashService
  ) {}

  /**
   * Executes the user registration process
   *
   * @param input - Registration data (email, password, firstName, lastName)
   * @returns Result containing the created UserResponseDto or an Error
   *
   * @throws {ConflictError} If email is already registered
   * @throws {NotFoundError} If the default USER role doesn't exist in the system
   * @throws {ValidationError} If input validation fails (invalid email, weak password, etc.)
   * @throws {DatabaseError} If database operations fail
   *
   * @remarks
   * Error types:
   * - ConflictError (409): Email already exists
   * - NotFoundError (404): Default role not found (system configuration issue)
   * - ValidationError (400): Invalid input (email format, password policy, name validation)
   * - DatabaseError (500): Unexpected database failure
   *
   * @example
   * ```typescript
   * // Success case
   * const result = await useCase.execute({
   *   email: 'jane@example.com',
   *   password: 'MySecure123!',
   *   firstName: 'Jane',
   *   lastName: 'Smith'
   * })
   * if (result.isSuccess()) {
   *   // result.value: UserResponseDto
   * }
   *
   * // Email already exists
   * const result = await useCase.execute({ email: 'existing@example.com', ... })
   * // result.error: ConflictError('Email already registered')
   *
   * // Invalid password
   * const result = await useCase.execute({ password: 'weak', ... })
   * // result.error: ValidationError('Password must contain at least one uppercase letter')
   * ```
   */
  async execute(input: RegisterUserInput): Promise<Result<UserResponseDto, Error>> {
    // Step 1: Create and validate Email value object
    const emailResult = Email.create(input.email)
    if (!emailResult.isSuccess()) {
      return Result.fail(emailResult.error)
    }
    const email = emailResult.value

    // Step 2: Check if email already exists
    const emailExistsResult = await this.userRepository.existsByEmail(email)
    if (!emailExistsResult.isSuccess()) {
      return Result.fail(emailExistsResult.error)
    }

    if (emailExistsResult.value) {
      return Result.fail(
        new ConflictError('User', 'email', input.email, 'Email already registered', {
          aggregateType: 'User',
          operation: 'register',
          metadata: { email: input.email }
        })
      )
    }

    // Step 3: Create and validate Password value object (plain-text)
    const passwordResult = Password.create(input.password)
    if (!passwordResult.isSuccess()) {
      return Result.fail(passwordResult.error)
    }

    // Step 4: Hash the password
    const hashedPasswordString = await this.passwordHashService.hash(input.password)
    const hashedPassword = Password.fromString(hashedPasswordString)

    // Step 5: Get the default USER role
    const roleResult = await this.roleRepository.findByName(this.DEFAULT_ROLE)
    if (!roleResult.isSuccess()) {
      return Result.fail(roleResult.error)
    }

    if (!roleResult.value) {
      return Result.fail(
        new NotFoundError('Role', this.DEFAULT_ROLE, {
          aggregateType: 'Role',
          aggregateId: this.DEFAULT_ROLE,
          operation: 'register',
          metadata: { roleName: this.DEFAULT_ROLE, reason: 'Default role not configured in system' }
        })
      )
    }
    const defaultRole = roleResult.value

    // Step 6: Create User entity (domain validation)
    const userResult = User.create({
      email,
      password: hashedPassword,
      firstName: input.firstName,
      lastName: input.lastName,
      roleId: defaultRole.id
    })

    if (!userResult.isSuccess()) {
      return Result.fail(userResult.error)
    }
    const user = userResult.value

    // Step 7: Persist user to database
    const saveResult = await this.userRepository.save(user)
    if (!saveResult.isSuccess()) {
      return Result.fail(saveResult.error)
    }

    // Step 8: Map to DTO and return (excludes password)
    const userDto = UserMapper.toDto(user)
    return Result.ok(userDto)
  }
}
