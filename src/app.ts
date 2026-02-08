import express, { Express } from 'express'
import { container } from 'tsyringe'
import { Config, TOKENS } from '@/config'
import { ILogger } from '@/lib/logger'
import { CorsMiddleware } from '@/modules/common/middleware/cors.middleware'
import { RequestIdMiddleware } from '@/modules/common/middleware/request-id.middleware'
import { LoggerMiddleware } from '@/modules/common/middleware/logger.middleware'
import { NotFoundMiddleware } from '@/modules/common/middleware/not-found.middleware'
import { ErrorHandlerMiddleware } from '@/modules/common/middleware/error-handler.middleware'
import { PermissionsRoutes } from '@/modules/identity/infrastructure/http/routes/permissions.routes'
import { IDENTITY_TOKENS } from '@/modules/identity/identity.tokens'

/**
 * App - Application orchestrator
 *
 * Resolves all dependencies from the tsyringe container.
 * Configures and manages the Express application lifecycle.
 *
 * Responsibilities:
 * - Setup middlewares in correct order
 * - Register module routes
 * - Configure error handling
 * - Manage application lifecycle (start/shutdown)
 *
 * @example
 * ```typescript
 * const config = Config.load()
 * await initContainer(config)
 * const app = new App()
 * await app.start()
 * ```
 */
export class App {
  private readonly app: Express
  private readonly config: Config
  private readonly logger: ILogger

  // Middlewares — resolved from container
  private readonly corsMiddleware: CorsMiddleware
  private readonly requestIdMiddleware: RequestIdMiddleware
  private readonly loggerMiddleware: LoggerMiddleware
  private readonly notFoundMiddleware: NotFoundMiddleware
  private readonly errorHandlerMiddleware: ErrorHandlerMiddleware

  // Module routes — resolved from container
  private readonly permissionsRoutes: PermissionsRoutes

  constructor() {
    // Resolve core dependencies
    this.config = container.resolve<Config>(TOKENS.Config)
    this.logger = container.resolve<ILogger>(TOKENS.ILogger)

    // Resolve middlewares
    this.corsMiddleware = container.resolve<CorsMiddleware>(TOKENS.CorsMiddleware)
    this.requestIdMiddleware = container.resolve<RequestIdMiddleware>(TOKENS.RequestIdMiddleware)
    this.loggerMiddleware = container.resolve<LoggerMiddleware>(TOKENS.LoggerMiddleware)
    this.notFoundMiddleware = container.resolve<NotFoundMiddleware>(TOKENS.NotFoundMiddleware)
    this.errorHandlerMiddleware = container.resolve<ErrorHandlerMiddleware>(
      TOKENS.ErrorHandlerMiddleware
    )

    // Resolve module routes
    this.permissionsRoutes = container.resolve<PermissionsRoutes>(IDENTITY_TOKENS.PermissionsRoutes)

    // Create Express app
    this.app = express()

    // Setup application
    this.setupMiddlewares()
    this.setupRoutes()
    this.setupErrorHandlers()

    this.logger.info('Application initialized')
  }

  /**
   * Setup global middlewares
   * ORDER MATTERS: body parsing -> cors -> requestId -> logger
   */
  private setupMiddlewares(): void {
    // Body parsing
    this.app.use(express.json())
    this.app.use(express.urlencoded({ extended: true }))

    // CORS (must be first to handle preflight requests)
    this.app.use(this.corsMiddleware.handle.bind(this.corsMiddleware))

    // Request ID (must be early to be available in all logs)
    this.app.use(this.requestIdMiddleware.handle.bind(this.requestIdMiddleware))

    // Logger (after requestId to include it in logs)
    this.app.use(this.loggerMiddleware.handle.bind(this.loggerMiddleware))

    this.logger.info('Global middlewares configured')
  }

  /**
   * Setup application routes
   */
  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        requestId: req.id,
        environment: this.config.nodeEnv
      })
    })

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        message: 'Node.js REST API Template',
        version: '1.0.0',
        documentation: '/api/docs'
      })
    })

    // Register module routes
    this.app.use('/api/permissions', this.permissionsRoutes.getRouter())

    this.logger.info('Routes configured')
  }

  /**
   * Setup error handling
   * ORDER MATTERS: notFound -> errorHandler (must be last)
   */
  private setupErrorHandlers(): void {
    // 404 handler for undefined routes (before error handler)
    this.app.use(this.notFoundMiddleware.handle.bind(this.notFoundMiddleware))

    // Global error handler (MUST BE LAST)
    this.app.use(this.errorHandlerMiddleware.handle.bind(this.errorHandlerMiddleware))

    this.logger.info('Error handlers configured')
  }

  /**
   * Get the Express application instance
   * Useful for testing or custom configuration
   */
  public getExpressApp(): Express {
    return this.app
  }

  /**
   * Start the HTTP server
   */
  public async start(): Promise<ReturnType<Express['listen']>> {
    const port = this.config.port

    this.logger.info('Database connected')

    return this.app.listen(port, () => {
      this.logger.info(`🚀 Server running on port ${port}`)
      this.logger.info(`📚 Environment: ${this.config.nodeEnv}`)
      this.logger.info(`🔗 API Base URL: ${this.config.apiBaseUrl}`)
      this.logger.info(`📝 Log Level: ${this.config.logLevel}`)
    })
  }

  /**
   * Gracefully shutdown the application
   */
  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down gracefully...')
    this.logger.info('Shutdown complete')
  }
}
