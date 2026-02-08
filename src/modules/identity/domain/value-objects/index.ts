/**
 * Identity Domain - Value Objects
 *
 * Value Objects are immutable objects defined by their attributes.
 * They encapsulate validation and business rules.
 *
 * @example
 * ```typescript
 * import { Email, Password, UserId } from '@/modules/identity/domain/value-objects'
 *
 * const emailResult = Email.create('user@example.com')
 * const passwordResult = Password.create('SecureP@ss123')
 * const userId = UserId.create()
 * ```
 */

export { UserId } from './user-id.vo'
export { RoleId } from './role-id.vo'
export { PermissionId } from './permission-id.vo'
export { Email } from './email.vo'
export { Password } from './password.vo'
