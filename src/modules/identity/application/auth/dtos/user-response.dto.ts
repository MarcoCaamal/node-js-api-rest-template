/**
 * User Response DTO
 *
 * Data Transfer Object for user information exposed to clients.
 * Contains only non-sensitive user data.
 *
 * @remarks
 * This DTO is used for:
 * - Registration responses
 * - Login responses
 * - User profile endpoints
 * - Any endpoint that returns user information
 *
 * SECURITY NOTE: Password is NEVER included in this DTO.
 *
 * @example
 * ```typescript
 * const userDto: UserResponseDto = {
 *   id: '550e8400-e29b-41d4-a716-446655440000',
 *   email: 'john.doe@example.com',
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   isActive: true,
 *   roleId: '660e8400-e29b-41d4-a716-446655440001',
 *   createdAt: new Date('2026-02-12T10:00:00Z'),
 *   updatedAt: new Date('2026-02-12T10:00:00Z')
 * }
 * ```
 */
export interface UserResponseDto {
  /**
   * Unique identifier for the user (UUID v4)
   *
   * @example '550e8400-e29b-41d4-a716-446655440000'
   */
  id: string

  /**
   * User's email address (unique across the system)
   *
   * @example 'john.doe@example.com'
   */
  email: string

  /**
   * User's first name
   *
   * @minLength 1
   * @maxLength 100
   * @example 'John'
   */
  firstName: string

  /**
   * User's last name
   *
   * @minLength 1
   * @maxLength 100
   * @example 'Doe'
   */
  lastName: string

  /**
   * User's full name (computed from firstName + lastName)
   *
   * @example 'John Doe'
   */
  fullName: string

  /**
   * Indicates if the user account is active
   *
   * @remarks
   * Inactive users cannot authenticate or access the system.
   *
   * @example true
   */
  isActive: boolean

  /**
   * The ID of the user's assigned role (UUID v4)
   *
   * @remarks
   * Each user has exactly ONE role.
   * Roles determine permissions and access levels.
   *
   * @example '660e8400-e29b-41d4-a716-446655440001'
   */
  roleId: string

  /**
   * Timestamp when the user was created (ISO 8601)
   *
   * @example '2026-02-12T10:00:00.000Z'
   */
  createdAt: Date

  /**
   * Timestamp when the user was last updated (ISO 8601)
   *
   * @example '2026-02-12T15:30:00.000Z'
   */
  updatedAt: Date
}
