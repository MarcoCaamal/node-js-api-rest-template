import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { RegisterUserUseCase } from '@/modules/identity/application/auth/use-cases/register-user.use-case'
import { LoginUserUseCase } from '@/modules/identity/application/auth/use-cases/login-user.use-case'
import { ZodValidationError } from '@/modules/common/errors/infrastructure/zod-validation.error'

/**
 * Zod schema for user registration request body
 *
 * Validates:
 * - Email format
 * - Password length constraints
 * - First/Last name presence and length
 */
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password cannot exceed 72 characters'),
  firstName: z.string().min(1, 'First name is required').max(100, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name too long')
})

/**
 * Zod schema for user login request body
 *
 * Validates:
 * - Email format
 * - Password presence (no strict validation on login)
 */
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
})

/**
 * Auth Controller
 *
 * Handles HTTP requests for authentication operations (register, login).
 * Maps HTTP layer to application use cases.
 *
 * @remarks
 * This controller:
 * - Validates incoming requests using Zod schemas
 * - Delegates business logic to use cases
 * - Returns appropriate HTTP status codes
 * - Handles error propagation to error middleware
 *
 * Endpoints:
 * - POST /auth/register - User registration
 * - POST /auth/login - User authentication
 *
 * @example
 * ```typescript
 * const controller = new AuthController(
 *   registerUserUseCase,
 *   loginUserUseCase
 * )
 *
 * // In routes:
 * router.post('/register', controller.register.bind(controller))
 * router.post('/login', controller.login.bind(controller))
 * ```
 */
export class AuthController {
  /**
   * Creates an instance of AuthController
   *
   * @param registerUserUseCase - Use case for user registration
   * @param loginUserUseCase - Use case for user authentication
   */
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase
  ) {}

  /**
   * @openapi
   * /api/auth/register:
   *   post:
   *     summary: Register a new user
   *     description: |
   *       Creates a new user account in the system.
   *
   *       **Business Rules:**
   *       - Email must be unique (returns 409 if already exists)
   *       - Password must meet security policy (8+ chars, uppercase, lowercase, number, special char)
   *       - New users are assigned the "USER" role by default
   *       - Accounts are active by default
   *
   *       **Security:**
   *       - Passwords are hashed using bcrypt before storage
   *       - Password is never returned in the response
   *     tags:
   *       - Auth
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *               - firstName
   *               - lastName
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 description: User's email address (must be unique)
   *                 example: john.doe@example.com
   *               password:
   *                 type: string
   *                 format: password
   *                 minLength: 8
   *                 maxLength: 72
   *                 description: |
   *                   User's password. Must contain:
   *                   - At least 8 characters
   *                   - At least 1 uppercase letter
   *                   - At least 1 lowercase letter
   *                   - At least 1 number
   *                   - At least 1 special character (!@#$%^&* etc.)
   *                 example: SecureP@ss123!
   *               firstName:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 100
   *                 description: User's first name
   *                 example: John
   *               lastName:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 100
   *                 description: User's last name
   *                 example: Doe
   *     responses:
   *       201:
   *         description: User registered successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                   format: uuid
   *                   description: User unique identifier
   *                   example: 550e8400-e29b-41d4-a716-446655440000
   *                 email:
   *                   type: string
   *                   format: email
   *                   example: john.doe@example.com
   *                 firstName:
   *                   type: string
   *                   example: John
   *                 lastName:
   *                   type: string
   *                   example: Doe
   *                 fullName:
   *                   type: string
   *                   example: John Doe
   *                 isActive:
   *                   type: boolean
   *                   example: true
   *                 roleId:
   *                   type: string
   *                   format: uuid
   *                   example: 660e8400-e29b-41d4-a716-446655440001
   *                 createdAt:
   *                   type: string
   *                   format: date-time
   *                   example: 2026-02-12T10:00:00.000Z
   *                 updatedAt:
   *                   type: string
   *                   format: date-time
   *                   example: 2026-02-12T10:00:00.000Z
   *       400:
   *         description: Validation error (invalid input) - RFC 9457 Problem Details format
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required:
   *                 - type
   *                 - title
   *                 - status
   *                 - detail
   *               properties:
   *                 type:
   *                   type: string
   *                   description: URI identifying the error type (about:blank for generic errors)
   *                   example: about:blank
   *                 title:
   *                   type: string
   *                   description: Human-readable error summary
   *                   example: Your request is not valid.
   *                 status:
   *                   type: integer
   *                   description: HTTP status code
   *                   example: 400
   *                 detail:
   *                   type: string
   *                   description: Human-readable error explanation
   *                   example: Your request is not valid. Validation failed for 2 fields email, password
   *                 errorCode:
   *                   type: string
   *                   description: Machine-readable error code (extension member)
   *                   example: VALIDATION_ERROR
   *                 errors:
   *                   type: array
   *                   description: Array of validation errors (extension member)
   *                   items:
   *                     type: object
   *                     required:
   *                       - detail
   *                       - path
   *                     properties:
   *                       detail:
   *                         type: string
   *                         description: Human-readable error explanation
   *                         example: Invalid email format
   *                       path:
   *                         type: string
   *                         description: Field path using dot notation
   *                         example: email
   *             examples:
   *               multipleErrors:
   *                 summary: Multiple validation errors (RFC 9457)
   *                 value:
   *                   type: about:blank
   *                   title: Your request is not valid.
   *                   status: 400
   *                   detail: Your request is not valid. Validation failed for 2 fields email, password
   *                   errorCode: VALIDATION_ERROR
   *                   errors:
   *                     - detail: Invalid email format
   *                       path: email
   *                     - detail: Password must be at least 8 characters
   *                       path: password
   *                   name: ZodValidationError
   *                   message: Your request is not valid. Validation failed for 2 fields email, password
   *                   httpStatus: 400
   *                   severity: LOW
   *                   timestamp: 2026-02-12T18:30:00.000Z
   *                   isOperational: true
   *               weakPassword:
   *                 summary: Single validation error (RFC 9457)
   *                 value:
   *                   type: about:blank
   *                   title: Your request is not valid.
   *                   status: 400
   *                   detail: Your request is not valid. Validation failed for 1 field password
   *                   errorCode: VALIDATION_ERROR
   *                   errors:
   *                     - detail: Password must contain at least one uppercase letter
   *                       path: password
   *       409:
   *         description: Conflict - Email already registered
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/responses/Conflict'
   *             example:
   *               errorCode: CONFLICT
   *               message: "Conflict in User.email with value 'john.doe@example.com': Email already registered"
   *               entityType: User
   *               conflictField: email
   *               conflictValue: john.doe@example.com
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body with Zod
      const bodyResult = registerSchema.safeParse(req.body)

      if (!bodyResult.success) {
        return next(ZodValidationError.fromZodError(bodyResult.error))
      }

      // Execute use case
      const result = await this.registerUserUseCase.execute(bodyResult.data)

      if (!result.isSuccess()) {
        next(result.error)
        return
      }

      // Return 201 Created with user data (no password)
      res.status(201).json(result.value)
    } catch (error) {
      next(error)
    }
  }

  /**
   * @openapi
   * /api/auth/login:
   *   post:
   *     summary: Authenticate user (login)
   *     description: |
   *       Authenticates a user with email and password, returning a JWT access token.
   *
   *       **Business Rules:**
   *       - User must exist and be active
   *       - Password must match the stored hash
   *       - Token expires after configured duration (default: 1 hour)
   *
   *       **Security:**
   *       - Password verification is timing-attack resistant
   *       - Generic error messages prevent user enumeration
   *       - Token contains only user ID (no sensitive data)
   *
   *       **Token Usage:**
   *       Include the returned access token in subsequent requests:
   *       ```
   *       Authorization: Bearer <accessToken>
   *       ```
   *
   *       **Error Format:**
   *       - Follows RFC 9457 Problem Details standard
   *     tags:
   *       - Auth
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 description: User's email address
   *                 example: john.doe@example.com
   *               password:
   *                 type: string
   *                 format: password
   *                 description: User's password
   *                 example: SecureP@ss123!
   *     responses:
   *       200:
   *         description: Authentication successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 accessToken:
   *                   type: string
   *                   description: JWT access token (include in Authorization header)
   *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJpYXQiOjE2NDA5NzYwMDAsImV4cCI6MTY0MDk3OTYwMH0.abc123
   *                 user:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                       format: uuid
   *                       example: 550e8400-e29b-41d4-a716-446655440000
   *                     email:
   *                       type: string
   *                       format: email
   *                       example: john.doe@example.com
   *                     firstName:
   *                       type: string
   *                       example: John
   *                     lastName:
   *                       type: string
   *                       example: Doe
   *                     fullName:
   *                       type: string
   *                       example: John Doe
   *                     isActive:
   *                       type: boolean
   *                       example: true
   *                     roleId:
   *                       type: string
   *                       format: uuid
   *                       example: 660e8400-e29b-41d4-a716-446655440001
   *                     createdAt:
   *                       type: string
   *                       format: date-time
   *                       example: 2026-02-12T10:00:00.000Z
   *                     updatedAt:
   *                       type: string
   *                       format: date-time
   *                       example: 2026-02-12T10:00:00.000Z
   *       400:
   *         description: Validation error (invalid email format) - RFC 9457 Problem Details
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required:
   *                 - type
   *                 - title
   *                 - status
   *                 - detail
   *               properties:
   *                 type:
   *                   type: string
   *                   example: about:blank
   *                 title:
   *                   type: string
   *                   example: Your request is not valid.
   *                 status:
   *                   type: integer
   *                   example: 400
   *                 detail:
   *                   type: string
   *                   example: Your request is not valid. Validation failed for 1 field email
   *                 errorCode:
   *                   type: string
   *                   example: VALIDATION_ERROR
   *                 errors:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       detail:
   *                         type: string
   *                       path:
   *                         type: string
   *             example:
   *               type: about:blank
   *               title: Your request is not valid.
   *               status: 400
   *               detail: Your request is not valid. Validation failed for 1 field email
   *               errorCode: VALIDATION_ERROR
   *               errors:
   *                 - detail: Invalid email format
   *                   path: email
   *               name: ZodValidationError
   *               message: Your request is not valid. Validation failed for 1 field email
   *               httpStatus: 400
   *               severity: LOW
   *               timestamp: 2026-02-12T18:30:00.000Z
   *               isOperational: true
   *       401:
   *         description: Unauthorized - Invalid credentials or inactive account
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/responses/Unauthorized'
   *             example:
   *               errorCode: UNAUTHORIZED
   *               message: Invalid credentials
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body with Zod
      const bodyResult = loginSchema.safeParse(req.body)

      if (!bodyResult.success) {
        return next(ZodValidationError.fromZodError(bodyResult.error))
      }

      // Execute use case
      const result = await this.loginUserUseCase.execute(bodyResult.data)

      if (!result.isSuccess()) {
        next(result.error)
        return
      }

      // Return 200 OK with token and user data
      res.status(200).json(result.value)
    } catch (error) {
      next(error)
    }
  }
}
