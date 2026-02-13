import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { ListUsersUseCase } from '@/modules/identity/application/users/use-cases/list-users.use-case'
import { GetUserByIdUseCase } from '@/modules/identity/application/users/use-cases/get-user-by-id.use-case'
import { CreateUserUseCase } from '@/modules/identity/application/users/use-cases/create-user.use-case'
import { UpdateUserUseCase } from '@/modules/identity/application/users/use-cases/update-user.use-case'
import { DeleteUserUseCase } from '@/modules/identity/application/users/use-cases/delete-user.use-case'
import { ZodValidationError } from '@/modules/common/errors/infrastructure/zod-validation.error'

const paginationQuerySchema = z.object({
  limit: z.preprocess(
    (value) => (value === '' || value === undefined || value === null ? undefined : value),
    z.coerce.number().int().min(1).max(100).optional()
  ),
  offset: z.preprocess(
    (value) => (value === '' || value === undefined || value === null ? undefined : value),
    z.coerce.number().int().min(0).optional()
  )
})

const userIdParamsSchema = z.object({
  id: z.uuid()
})

const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name must not exceed 100 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters')

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password cannot exceed 72 characters')
  .refine((value) => /[A-Z]/.test(value), 'Password must contain at least one uppercase letter')
  .refine((value) => /[a-z]/.test(value), 'Password must contain at least one lowercase letter')
  .refine((value) => /[0-9]/.test(value), 'Password must contain at least one number')
  .refine(
    (value) => /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/'`~]/.test(value),
    'Password must contain at least one special character'
  )

const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: passwordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  roleId: z.uuid()
})

const updateUserSchema = z
  .object({
    email: z.string().email('Invalid email format').optional(),
    password: passwordSchema.optional(),
    firstName: nameSchema.optional(),
    lastName: nameSchema.optional(),
    roleId: z.uuid().optional(),
    isActive: z.boolean().optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided'
  })

/**
 * Users Controller
 *
 * Handles HTTP requests for user operations.
 */
export class UsersController {
  constructor(
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase
  ) {}

  /**
   * @openapi
   * /api/users:
   *   get:
   *     summary: List all users
   *     description: Retrieve a paginated list of users in the system.
   *     tags:
   *       - Users
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         required: false
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 20
   *         description: Maximum number of items to return per page
   *         example: 20
   *       - in: query
   *         name: offset
   *         required: false
   *         schema:
   *           type: integer
   *           minimum: 0
   *           default: 0
   *         description: Number of items to skip from the beginning
   *         example: 0
   *     responses:
   *       200:
   *         description: Paginated list of users retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/PaginatedUserResponse'
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryResult = paginationQuerySchema.safeParse(req.query)

      if (!queryResult.success) {
        return next(ZodValidationError.fromZodError(queryResult.error))
      }

      const { limit, offset } = queryResult.data

      const result = await this.listUsersUseCase.execute(limit, offset)

      if (!result.isSuccess()) {
        next(result.error)
        return
      }

      res.status(200).json(result.value)
    } catch (error) {
      next(error)
    }
  }

  /**
   * @openapi
   * /api/users/{id}:
   *   get:
   *     summary: Get user by ID
   *     description: Retrieve a single user by its unique identifier (UUID v4)
   *     tags:
   *       - Users
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: User unique identifier
   *         example: 550e8400-e29b-41d4-a716-446655440000
   *     responses:
   *       200:
   *         description: User found successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserResponse'
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const paramsResult = userIdParamsSchema.safeParse(req.params)

      if (!paramsResult.success) {
        return next(ZodValidationError.fromZodError(paramsResult.error))
      }

      const result = await this.getUserByIdUseCase.execute(paramsResult.data.id)

      if (!result.isSuccess()) {
        next(result.error)
        return
      }

      res.status(200).json(result.value)
    } catch (error) {
      next(error)
    }
  }

  /**
   * @openapi
   * /api/users:
   *   post:
   *     summary: Create a new user
   *     description: Create a new user with an explicit role assignment.
   *     tags:
   *       - Users
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateUserRequest'
   *     responses:
   *       201:
   *         description: User created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserResponse'
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       409:
   *         $ref: '#/components/responses/Conflict'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bodyResult = createUserSchema.safeParse(req.body)

      if (!bodyResult.success) {
        return next(ZodValidationError.fromZodError(bodyResult.error))
      }

      const result = await this.createUserUseCase.execute(bodyResult.data)

      if (!result.isSuccess()) {
        next(result.error)
        return
      }

      res.status(201).json(result.value)
    } catch (error) {
      next(error)
    }
  }

  /**
   * @openapi
   * /api/users/{id}:
   *   patch:
   *     summary: Update a user
   *     description: Update user profile, role, or activation status.
   *     tags:
   *       - Users
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: User unique identifier
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateUserRequest'
   *     responses:
   *       200:
   *         description: User updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserResponse'
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       409:
   *         $ref: '#/components/responses/Conflict'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const paramsResult = userIdParamsSchema.safeParse(req.params)

      if (!paramsResult.success) {
        return next(ZodValidationError.fromZodError(paramsResult.error))
      }

      const bodyResult = updateUserSchema.safeParse(req.body)

      if (!bodyResult.success) {
        return next(ZodValidationError.fromZodError(bodyResult.error))
      }

      const result = await this.updateUserUseCase.execute(paramsResult.data.id, bodyResult.data)

      if (!result.isSuccess()) {
        next(result.error)
        return
      }

      res.status(200).json(result.value)
    } catch (error) {
      next(error)
    }
  }

  /**
   * @openapi
   * /api/users/{id}:
   *   delete:
   *     summary: Delete a user
   *     description: Soft delete a user by ID.
   *     tags:
   *       - Users
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: User unique identifier
   *     responses:
   *       204:
   *         description: User deleted successfully
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const paramsResult = userIdParamsSchema.safeParse(req.params)

      if (!paramsResult.success) {
        return next(ZodValidationError.fromZodError(paramsResult.error))
      }

      const result = await this.deleteUserUseCase.execute(paramsResult.data.id)

      if (!result.isSuccess()) {
        next(result.error)
        return
      }

      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}
