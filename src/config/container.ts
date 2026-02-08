import 'reflect-metadata'
import { container, type DependencyContainer } from 'tsyringe'
import { PrismaClient } from '@/generated/prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

import { Config, TOKENS } from '@/config'
import { ILogger } from '@/lib/logger'
import { ConsoleLogger } from '@/lib/logger/console.logger'

// Middlewares
import {
  CorsMiddleware,
  RequestIdMiddleware,
  LoggerMiddleware,
  NotFoundMiddleware,
  ErrorHandlerMiddleware
} from '@/modules/common/middleware'

// Module registrations
import { registerIdentityModule } from '@/modules/identity/identity.module'

/**
 * Composition Root — Dependency Injection Container
 *
 * Uses tsyringe with factory providers (no decorators).
 * Registers core dependencies (Config, Logger, Database, Middlewares)
 * and delegates module-specific registrations to each module.
 *
 * Bootstrap order:
 * 1. Config (value provider — already instantiated)
 * 2. Logger (factory — depends on Config)
 * 3. Database (PgPool + PrismaClient — depends on Config)
 * 4. Middlewares (factories — depend on Config + Logger)
 * 5. Module registrations (Identity, etc.)
 */

// ═══════════════════════════════════════════════════════════════════════════
// 1. CORE — Configuration
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Initialize the DI container with all dependencies.
 *
 * Must be called once at application startup before resolving anything.
 * Sets up the database connection pool and registers every dependency.
 */
export async function initContainer(config: Config): Promise<DependencyContainer> {
  // ── Config ──────────────────────────────────────────────────────────
  container.register<Config>(TOKENS.Config, { useValue: config })

  // ── Logger ──────────────────────────────────────────────────────────
  container.register<ILogger>(TOKENS.ILogger, {
    useFactory: (c) => {
      const cfg = c.resolve<Config>(TOKENS.Config)
      return new ConsoleLogger(cfg.logLevel)
    }
  })

  // ── Database ────────────────────────────────────────────────────────
  const pool = new Pool({ connectionString: config.databaseUrl })
  const adapter = new PrismaPg(pool)
  const prismaClient = new PrismaClient({ adapter })

  container.register<PrismaClient>(TOKENS.PrismaClient, { useValue: prismaClient })

  // ── Middlewares ─────────────────────────────────────────────────────
  registerMiddlewares(container)

  // ── Module registrations ────────────────────────────────────────────
  registerIdentityModule(container)

  return container
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. MIDDLEWARES — Global Express middlewares
// ═══════════════════════════════════════════════════════════════════════════

function registerMiddlewares(c: DependencyContainer): void {
  c.register<CorsMiddleware>(TOKENS.CorsMiddleware, {
    useFactory: (di) => {
      const cfg = di.resolve<Config>(TOKENS.Config)
      return new CorsMiddleware(cfg.corsOptions)
    }
  })

  c.register<RequestIdMiddleware>(TOKENS.RequestIdMiddleware, {
    useFactory: () => new RequestIdMiddleware()
  })

  c.register<LoggerMiddleware>(TOKENS.LoggerMiddleware, {
    useFactory: (di) => {
      const logger = di.resolve<ILogger>(TOKENS.ILogger)
      return new LoggerMiddleware(logger)
    }
  })

  c.register<NotFoundMiddleware>(TOKENS.NotFoundMiddleware, {
    useFactory: (di) => {
      const cfg = di.resolve<Config>(TOKENS.Config)
      return new NotFoundMiddleware(cfg.apiBaseUrl)
    }
  })

  c.register<ErrorHandlerMiddleware>(TOKENS.ErrorHandlerMiddleware, {
    useFactory: (di) => {
      const logger = di.resolve<ILogger>(TOKENS.ILogger)
      const cfg = di.resolve<Config>(TOKENS.Config)
      return new ErrorHandlerMiddleware(logger, cfg.isDevelopment, cfg.apiBaseUrl)
    }
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. DISPOSAL — Graceful shutdown
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Gracefully dispose of container resources.
 * Disconnects database pool and Prisma client.
 */
export async function disposeContainer(): Promise<void> {
  const prisma = container.resolve<PrismaClient>(TOKENS.PrismaClient)

  await prisma.$disconnect()
}

/**
 * Re-export the tsyringe container instance for direct resolution.
 * Prefer using typed resolve helpers or injection over direct access.
 */
export { container }
