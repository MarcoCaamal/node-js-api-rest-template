/**
 * Infrastructure Layer Errors
 *
 * These errors handle infrastructure-level concerns like HTTP validation.
 * Use them in:
 * - Controllers
 * - HTTP Middleware
 * - API Input Validation (Zod schemas)
 *
 * @example
 * ```typescript
 * import { ZodValidationError } from '@/modules/common/errors/infrastructure'
 *
 * const result = schema.safeParse(body)
 * if (!result.success) {
 *   throw new ZodValidationError(result.error)
 * }
 * ```
 */

export { ZodValidationError } from './zod-validation.error'
