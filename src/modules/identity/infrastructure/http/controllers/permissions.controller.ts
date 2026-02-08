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
   * GET /api/permissions/:id
   * Get a single permission by ID
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
   * GET /api/permissions
   * List all permissions with pagination
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
