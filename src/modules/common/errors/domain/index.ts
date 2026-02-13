/**
 * Domain Layer Errors
 *
 * These errors represent business rule violations in the domain layer.
 * Use them in:
 * - Value Objects (Email, UserId, etc.)
 * - Entities (User, Role, Permission)
 * - Domain Services
 * - Aggregates
 *
 * @example
 * ```typescript
 * import { ValidationError } from '@/modules/common/errors/domain'
 *
 * if (email.length > 255) {
 *   return Result.fail(new ValidationError('email', 'Email too long'))
 * }
 * ```
 */

export { ValidationError } from './validation.error'
