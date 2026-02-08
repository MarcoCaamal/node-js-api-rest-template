/**
 * Core Dependency Injection Tokens
 *
 * Symbols used as unique identifiers for core/shared dependencies.
 * Module-specific tokens live inside each module (e.g. identity.tokens.ts).
 *
 * Using symbols instead of strings provides:
 * - Type safety
 * - No naming collisions
 * - Better IDE support
 * - Refactor-safe code
 *
 * @example
 * ```typescript
 * import { container } from 'tsyringe'
 * import { TOKENS } from '@/config/tokens'
 *
 * container.register(TOKENS.ILogger, { useFactory: () => new ConsoleLogger('info') })
 * const logger = container.resolve<ILogger>(TOKENS.ILogger)
 * ```
 */
export const TOKENS = {
  // ── Core ─────────────────────────────────────────────────────────────
  Config: Symbol.for('Config'),
  ILogger: Symbol.for('ILogger'),
  PrismaClient: Symbol.for('PrismaClient'),

  // ── Middleware ───────────────────────────────────────────────────────
  CorsMiddleware: Symbol.for('CorsMiddleware'),
  RequestIdMiddleware: Symbol.for('RequestIdMiddleware'),
  LoggerMiddleware: Symbol.for('LoggerMiddleware'),
  NotFoundMiddleware: Symbol.for('NotFoundMiddleware'),
  ErrorHandlerMiddleware: Symbol.for('ErrorHandlerMiddleware')
} as const

/**
 * Type helper to get the token type
 */
export type Token = (typeof TOKENS)[keyof typeof TOKENS]
