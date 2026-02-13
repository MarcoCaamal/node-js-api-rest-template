import { Router } from 'express'
import { UsersController } from '../controllers/users.controller'
import { AuthenticationMiddleware } from '../middleware/authentication.middleware'
import { AuthorizationMiddleware } from '../middleware/authorization.middleware'

/**
 * Users Routes
 *
 * Defines HTTP routes for user operations.
 */
export class UsersRoutes {
  private readonly router: Router
  private readonly controller: UsersController
  private readonly authenticationMiddleware: AuthenticationMiddleware
  private readonly authorizationMiddleware: AuthorizationMiddleware

  constructor(
    controller: UsersController,
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
    const requireUsersRead = this.authorizationMiddleware.requirePermission('users:read')
    const requireUsersCreate = this.authorizationMiddleware.requirePermission('users:create')
    const requireUsersUpdate = this.authorizationMiddleware.requirePermission('users:update')
    const requireUsersDelete = this.authorizationMiddleware.requirePermission('users:delete')

    /**
     * GET /api/users
     * List all users with pagination
     * Query params: ?limit=20&offset=0
     */
    this.router.get('/', authenticate, requireUsersRead, this.controller.list.bind(this.controller))

    /**
     * GET /api/users/:id
     * Get a single user by ID
     */
    this.router.get(
      '/:id',
      authenticate,
      requireUsersRead,
      this.controller.getById.bind(this.controller)
    )

    /**
     * POST /api/users
     * Create a new user
     */
    this.router.post(
      '/',
      authenticate,
      requireUsersCreate,
      this.controller.create.bind(this.controller)
    )

    /**
     * PATCH /api/users/:id
     * Update a user
     */
    this.router.patch(
      '/:id',
      authenticate,
      requireUsersUpdate,
      this.controller.update.bind(this.controller)
    )

    /**
     * DELETE /api/users/:id
     * Delete a user
     */
    this.router.delete(
      '/:id',
      authenticate,
      requireUsersDelete,
      this.controller.delete.bind(this.controller)
    )
  }

  getRouter(): Router {
    return this.router
  }
}
