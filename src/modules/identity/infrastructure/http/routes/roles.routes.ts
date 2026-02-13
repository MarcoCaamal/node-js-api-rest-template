import { Router } from 'express'
import { RolesController } from '../controllers/roles.controller'
import { AuthenticationMiddleware } from '../middleware/authentication.middleware'
import { AuthorizationMiddleware } from '../middleware/authorization.middleware'

/**
 * Roles Routes
 *
 * Defines HTTP routes for role operations.
 */
export class RolesRoutes {
  private readonly router: Router
  private readonly controller: RolesController
  private readonly authenticationMiddleware: AuthenticationMiddleware
  private readonly authorizationMiddleware: AuthorizationMiddleware

  constructor(
    controller: RolesController,
    authenticationMiddleware: AuthenticationMiddleware,
    authorizationMiddleware: AuthorizationMiddleware
  ) {
    this.router = Router()
    this.controller = controller
    this.authenticationMiddleware = authenticationMiddleware
    this.authorizationMiddleware = authorizationMiddleware
    this.setupRoutes()
  }

  private setupRoutes(): void {
    const authenticate = this.authenticationMiddleware.handle.bind(this.authenticationMiddleware)
    const requireRolesRead = this.authorizationMiddleware.requirePermission('roles:read')
    const requireRolesCreate = this.authorizationMiddleware.requirePermission('roles:create')
    const requireRolesUpdate = this.authorizationMiddleware.requirePermission('roles:update')
    const requireRolesDelete = this.authorizationMiddleware.requirePermission('roles:delete')

    /**
     * GET /api/roles
     * List all roles with pagination
     */
    this.router.get('/', authenticate, requireRolesRead, this.controller.list.bind(this.controller))

    /**
     * GET /api/roles/:id
     * Get a single role by ID
     */
    this.router.get(
      '/:id',
      authenticate,
      requireRolesRead,
      this.controller.getById.bind(this.controller)
    )

    /**
     * POST /api/roles
     * Create a new role
     */
    this.router.post(
      '/',
      authenticate,
      requireRolesCreate,
      this.controller.create.bind(this.controller)
    )

    /**
     * PATCH /api/roles/:id
     * Update a role
     */
    this.router.patch(
      '/:id',
      authenticate,
      requireRolesUpdate,
      this.controller.update.bind(this.controller)
    )

    /**
     * DELETE /api/roles/:id
     * Delete a role
     */
    this.router.delete(
      '/:id',
      authenticate,
      requireRolesDelete,
      this.controller.delete.bind(this.controller)
    )
  }

  getRouter(): Router {
    return this.router
  }
}
