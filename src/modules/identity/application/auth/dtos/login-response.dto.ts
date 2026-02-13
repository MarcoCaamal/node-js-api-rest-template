import { UserResponseDto } from './user-response.dto'

/**
 * Login Response DTO
 *
 * Data Transfer Object returned after successful authentication.
 * Contains the JWT access token and authenticated user information.
 *
 * @remarks
 * This DTO is returned by the login endpoint after successful authentication.
 * The access token should be included in subsequent requests via the
 * Authorization header: `Bearer <accessToken>`
 *
 * Token format: JWT (JSON Web Token)
 * Header format: `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
 *
 * @example
 * ```typescript
 * const loginResponse: LoginResponseDto = {
 *   accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJpYXQiOjE2NDA5NzYwMDAsImV4cCI6MTY0MDk3OTYwMH0.abc123',
 *   user: {
 *     id: '550e8400-e29b-41d4-a716-446655440000',
 *     email: 'john.doe@example.com',
 *     firstName: 'John',
 *     lastName: 'Doe',
 *     fullName: 'John Doe',
 *     isActive: true,
 *     roleId: '660e8400-e29b-41d4-a716-446655440001',
 *     createdAt: new Date('2026-02-12T10:00:00Z'),
 *     updatedAt: new Date('2026-02-12T10:00:00Z')
 *   }
 * }
 * ```
 */
export interface LoginResponseDto {
  /**
   * JWT access token for authenticated requests
   *
   * @remarks
   * This token must be included in the Authorization header of subsequent requests:
   * `Authorization: Bearer <accessToken>`
   *
   * Token contains:
   * - User ID (userId)
   * - Issued at timestamp (iat)
   * - Expiration timestamp (exp)
   *
   * The token will expire after the configured duration (see JWT_EXPIRES_IN env var).
   * Default expiration: 1 hour
   *
   * @example 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJpYXQiOjE2NDA5NzYwMDAsImV4cCI6MTY0MDk3OTYwMH0.abc123'
   */
  accessToken: string

  /**
   * Authenticated user information
   *
   * @remarks
   * Contains non-sensitive user data.
   * Password is never included.
   *
   * @see {@link UserResponseDto}
   */
  user: UserResponseDto
}
