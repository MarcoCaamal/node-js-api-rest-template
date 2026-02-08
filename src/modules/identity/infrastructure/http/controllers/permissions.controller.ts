import { Request, Response, NextFunction } from 'express'
import { GetPermissionByIdUseCase } from '@/modules/identity/application/permissions/use-cases/get-permission-by-id.use-case'
import { ListPermissionsUseCase } from '@/modules/identity/application/permissions/use-cases/list-permissions.use-case'

/**
 * Permissions Controller
 *
 * Handles HTTP requests for permission-related operations.
 * Maps HTTP layer to application use cases.
 */
export class PermissionsController {
  constructor(
    private readonly getPermissionByIdUseCase: GetPermissionByIdUseCase,
    private readonly listPermissionsUseCase: ListPermissionsUseCase
  ) {}

  /**
   * @openapi
   * /api/permissions/{id}:
   *   get:
   *     summary: Get permission by ID
   *     description: Retrieve a single permission by its unique identifier (UUID v4)
   *     tags:
   *       - Permissions
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Permission unique identifier
   *         example: b8fb0213-4718-4759-9d96-2c222c9cf9ee
   *     responses:
   *       200:
   *         description: Permission found successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/PermissionResponse'
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params

      if (typeof id !== 'string') {
        res.status(400).json({ error: 'Invalid ID parameter' })
        return
      }

      const result = await this.getPermissionByIdUseCase.execute(id)

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
   * /api/permissions:
   *   get:
   *     summary: List all permissions
   *     description: Retrieve a paginated list of all permissions in the system. Supports limit and offset parameters for pagination.
   *     tags:
   *       - Permissions
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
   *         description: Paginated list of permissions retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/PaginatedPermissionResponse'
   *             example:
   *               data:
   *                 - id: b8fb0213-4718-4759-9d96-2c222c9cf9ee
   *                   resource: "*"
   *                   action: "*"
   *                   description: Full system access (admin)
   *                   createdAt: 2026-02-07T13:26:24.206Z
   *                   updatedAt: 2026-02-07T13:26:24.206Z
   *                 - id: 4cef5207-d2a6-4364-9c9f-8319df6e8167
   *                   resource: users
   *                   action: read
   *                   description: View user details
   *                   createdAt: 2026-02-07T13:26:24.204Z
   *                   updatedAt: 2026-02-07T13:26:24.204Z
   *               pagination:
   *                 total: 10
   *                 limit: 20
   *                 offset: 0
   *                 hasMore: false
   *                 currentPage: 1
   *                 totalPages: 1
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined

      const result = await this.listPermissionsUseCase.execute(limit, offset)

      if (!result.isSuccess()) {
        next(result.error)
        return
      }

      res.status(200).json(result.value)
    } catch (error) {
      next(error)
    }
  }
}
