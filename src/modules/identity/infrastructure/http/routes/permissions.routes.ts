import { Router } from 'express'
import { PermissionsController } from '../controllers/permissions.controller'

/**
 * Permissions Routes
 *
 * Defines HTTP routes for permission operations.
 * Maps routes to controller methods.
 */
export class PermissionsRoutes {
  private readonly router: Router
  private readonly controller: PermissionsController

  constructor(controller: PermissionsController) {
    this.router = Router()
    this.controller = controller
    this.setupRoutes()
  }

  private setupRoutes(): void {
    /**
     * GET /api/permissions
     * List all permissions with pagination
     * Query params: ?limit=20&offset=0
     */
    this.router.get('/', this.controller.list.bind(this.controller))

    /**
     * GET /api/permissions/:id
     * Get a single permission by ID
     */
    this.router.get('/:id', this.controller.getById.bind(this.controller))
  }

  getRouter(): Router {
    return this.router
  }
}
