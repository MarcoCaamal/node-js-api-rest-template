import { Result } from '@/lib/result/result'
import { IUserRepository } from '@/modules/identity/domain/repositories/user.repository.interface'
import { IPasswordHashService } from '@/modules/identity/application/services/password-hash.service.interface'
import { IJwtService } from '@/modules/identity/application/services/jwt.service.interface'
import { Email } from '@/modules/identity/domain/value-objects/email.vo'
import { UserMapper } from '../mappers/user.mapper'
import { LoginResponseDto } from '../dtos/login-response.dto'
import { UnauthorizedError } from '@/modules/common/errors/unauthorized.error'

/**
 * Login User Input DTO
 *
 * Credentials required to authenticate a user.
 */
export interface LoginUserInput {
  /**
   * User's email address
   * @example 'john.doe@example.com'
   */
  email: string

  /**
   * Plain-text password
   * @example 'SecureP@ss123!'
   */
  password: string
}

/**
 * Login User Use Case
 *
 * Handles the business logic for user authentication (login).
 *
 * @remarks
 * This use case orchestrates the authentication process:
 * 1. Validates the email format
 * 2. Finds the user by email
 * 3. Validates that the user exists
 * 4. Validates that the user account is active
 * 5. Verifies the password against the stored hash
 * 6. Generates a JWT access token
 * 7. Returns the token and user information
 *
 * Business Rules:
 * - Only active users can authenticate
 * - Password must match the stored hash
 * - Failed login attempts do not lock accounts (implement separately if needed)
 * - JWT token contains only the user ID (no sensitive data)
 *
 * Security Considerations:
 * - Password comparison is timing-attack resistant (bcrypt.compare)
 * - Generic error messages prevent user enumeration attacks
 * - Failed attempts should be logged (implement in controller/middleware)
 *
 * @example
 * ```typescript
 * const useCase = new LoginUserUseCase(
 *   userRepository,
 *   passwordHashService,
 *   jwtService
 * )
 *
 * const result = await useCase.execute({
 *   email: 'john.doe@example.com',
 *   password: 'SecureP@ss123!'
 * })
 *
 * if (result.isSuccess()) {
 *   const { accessToken, user } = result.value
 *   console.log('Login successful:', user.email)
 *   console.log('Token:', accessToken)
 * } else {
 *   console.error('Login failed:', result.error.message)
 * }
 * ```
 */
export class LoginUserUseCase {
  /**
   * Creates an instance of LoginUserUseCase
   *
   * @param userRepository - Repository for user queries
   * @param passwordHashService - Service for password verification
   * @param jwtService - Service for JWT token generation
   */
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHashService: IPasswordHashService,
    private readonly jwtService: IJwtService
  ) {}

  /**
   * Executes the user login process
   *
   * @param input - Login credentials (email and password)
   * @returns Result containing LoginResponseDto (token + user) or an Error
   *
   * @throws {UnauthorizedError} If credentials are invalid or account is inactive
   * @throws {ValidationError} If email format is invalid
   * @throws {DatabaseError} If database operations fail
   *
   * @remarks
   * Error types:
   * - UnauthorizedError (401): Invalid credentials, user not found, or account inactive
   * - ValidationError (400): Invalid email format
   * - DatabaseError (500): Unexpected database failure
   *
   * Security Note:
   * For security reasons, we return the SAME error for:
   * - User not found
   * - Incorrect password
   * - Inactive account
   * This prevents user enumeration attacks.
   *
   * @example
   * ```typescript
   * // Success case
   * const result = await useCase.execute({
   *   email: 'jane@example.com',
   *   password: 'MySecure123!'
   * })
   * if (result.isSuccess()) {
   *   // result.value: { accessToken: 'eyJ...', user: { ... } }
   * }
   *
   * // Invalid credentials
   * const result = await useCase.execute({
   *   email: 'jane@example.com',
   *   password: 'WrongPassword'
   * })
   * // result.error: UnauthorizedError('Invalid credentials')
   *
   * // Inactive account
   * const result = await useCase.execute({
   *   email: 'inactive@example.com',
   *   password: 'CorrectPassword123!'
   * })
   * // result.error: UnauthorizedError('Invalid credentials')
   * ```
   */
  async execute(input: LoginUserInput): Promise<Result<LoginResponseDto, Error>> {
    // Step 1: Create and validate Email value object
    const emailResult = Email.create(input.email)
    if (!emailResult.isSuccess()) {
      return Result.fail(emailResult.error)
    }
    const email = emailResult.value

    // Step 2: Find user by email
    const userResult = await this.userRepository.findByEmail(email)
    if (!userResult.isSuccess()) {
      return Result.fail(userResult.error)
    }

    // Step 3: Validate user exists
    if (!userResult.value) {
      // Generic error to prevent user enumeration
      return Result.fail(
        new UnauthorizedError('Invalid credentials', {
          aggregateType: 'User',
          operation: 'login',
          metadata: { reason: 'user_not_found', email: input.email }
        })
      )
    }
    const user = userResult.value

    // Step 4: Validate user is active
    if (!user.canAuthenticate()) {
      // Generic error to prevent user enumeration
      return Result.fail(
        new UnauthorizedError('Invalid credentials', {
          aggregateType: 'User',
          aggregateId: user.id.getValue(),
          operation: 'login',
          metadata: { reason: 'account_inactive', email: input.email }
        })
      )
    }

    // Step 5: Verify password
    const isPasswordValid = await this.passwordHashService.compare(
      input.password,
      user.password.getValue()
    )

    if (!isPasswordValid) {
      // Generic error to prevent user enumeration
      return Result.fail(
        new UnauthorizedError('Invalid credentials', {
          aggregateType: 'User',
          aggregateId: user.id.getValue(),
          operation: 'login',
          metadata: { reason: 'invalid_password', email: input.email }
        })
      )
    }

    // Step 6: Generate JWT access token
    const accessToken = this.jwtService.sign({
      userId: user.id.getValue()
    })

    // Step 7: Map to DTO and return
    const userDto = UserMapper.toDto(user)

    return Result.ok({
      accessToken,
      user: userDto
    })
  }
}
