import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { ListRolesUseCase } from '@/modules/identity/application/roles/use-cases/list-roles.use-case'
import { GetRoleByIdUseCase } from '@/modules/identity/application/roles/use-cases/get-role-by-id.use-case'
import { CreateRoleUseCase } from '@/modules/identity/application/roles/use-cases/create-role.use-case'
import { UpdateRoleUseCase } from '@/modules/identity/application/roles/use-cases/update-role.use-case'
import { DeleteRoleUseCase } from '@/modules/identity/application/roles/use-cases/delete-role.use-case'
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

const roleIdParamsSchema = z.object({
  id: z.uuid()
})

const roleNameSchema = z
  .string()
  .min(1, 'Role name is required')
  .max(50, 'Role name must not exceed 50 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Role name must contain only letters, numbers, and underscores')

const roleDescriptionSchema = z
  .string()
  .min(1, 'Role description is required')
  .max(255, 'Role description must not exceed 255 characters')

const createRoleSchema = z.object({
  name: roleNameSchema,
  description: roleDescriptionSchema,
  permissionIds: z.array(z.uuid()).optional()
})

const updateRoleSchema = z
  .object({
    name: roleNameSchema.optional(),
    description: roleDescriptionSchema.optional(),
    permissionIds: z.array(z.uuid()).optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided'
  })

/**
 * Roles Controller
 *
 * Handles HTTP requests for role operations.
 */
export class RolesController {
  constructor(
    private readonly listRolesUseCase: ListRolesUseCase,
    private readonly getRoleByIdUseCase: GetRoleByIdUseCase,
    private readonly createRoleUseCase: CreateRoleUseCase,
    private readonly updateRoleUseCase: UpdateRoleUseCase,
    private readonly deleteRoleUseCase: DeleteRoleUseCase
  ) {}

  /**
   * @openapi
   * /api/roles:
   *   get:
   *     summary: List all roles
   *     description: Retrieve a paginated list of roles in the system.
   *     tags:
   *       - Roles
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
   *       - in: query
   *         name: offset
   *         required: false
   *         schema:
   *           type: integer
   *           minimum: 0
   *           default: 0
   *         description: Number of items to skip from the beginning
   *     responses:
   *       200:
   *         description: Paginated list of roles retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/PaginatedRoleResponse'
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
      const result = await this.listRolesUseCase.execute(limit, offset)

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
   * /api/roles/{id}:
   *   get:
   *     summary: Get role by ID
   *     description: Retrieve a single role by its unique identifier (UUID v4)
   *     tags:
   *       - Roles
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Role unique identifier
   *     responses:
   *       200:
   *         description: Role found successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/RoleResponse'
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
      const paramsResult = roleIdParamsSchema.safeParse(req.params)

      if (!paramsResult.success) {
        return next(ZodValidationError.fromZodError(paramsResult.error))
      }

      const result = await this.getRoleByIdUseCase.execute(paramsResult.data.id)

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
   * /api/roles:
   *   post:
   *     summary: Create a new role
   *     description: Create a custom role. System roles cannot be created via this endpoint.
   *     tags:
   *       - Roles
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateRoleRequest'
   *     responses:
   *       201:
   *         description: Role created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/RoleResponse'
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
      const bodyResult = createRoleSchema.safeParse(req.body)

      if (!bodyResult.success) {
        return next(ZodValidationError.fromZodError(bodyResult.error))
      }

      const result = await this.createRoleUseCase.execute(bodyResult.data)

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
   * /api/roles/{id}:
   *   patch:
   *     summary: Update a role
   *     description: Update a role (system roles cannot be edited).
   *     tags:
   *       - Roles
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Role unique identifier
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateRoleRequest'
   *     responses:
   *       200:
   *         description: Role updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/RoleResponse'
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
      const paramsResult = roleIdParamsSchema.safeParse(req.params)

      if (!paramsResult.success) {
        return next(ZodValidationError.fromZodError(paramsResult.error))
      }

      const bodyResult = updateRoleSchema.safeParse(req.body)

      if (!bodyResult.success) {
        return next(ZodValidationError.fromZodError(bodyResult.error))
      }

      const result = await this.updateRoleUseCase.execute(paramsResult.data.id, bodyResult.data)

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
   * /api/roles/{id}:
   *   delete:
   *     summary: Delete a role
   *     description: Delete a role (system roles cannot be deleted).
   *     tags:
   *       - Roles
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Role unique identifier
   *     responses:
   *       204:
   *         description: Role deleted successfully
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
      const paramsResult = roleIdParamsSchema.safeParse(req.params)

      if (!paramsResult.success) {
        return next(ZodValidationError.fromZodError(paramsResult.error))
      }

      const result = await this.deleteRoleUseCase.execute(paramsResult.data.id)

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
