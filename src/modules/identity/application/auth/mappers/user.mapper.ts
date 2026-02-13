import { User } from '@/modules/identity/domain/entities/user.entity'
import { UserResponseDto } from '../dtos/user-response.dto'

/**
 * User Mapper
 *
 * Maps User domain entities to UserResponseDto for API responses.
 *
 * @remarks
 * This mapper is part of the application layer and serves as a boundary
 * between the domain and infrastructure layers. It ensures that:
 * - Domain entities are never exposed directly to clients
 * - Sensitive data (like passwords) is never leaked
 * - DTOs contain only the data needed by clients
 *
 * @example
 * ```typescript
 * const user = User.create({ ... })
 * const dto = UserMapper.toDto(user.value)
 * // Response: { id, email, firstName, lastName, ... } (no password!)
 * ```
 */
export class UserMapper {
  /**
   * Maps a User entity to a UserResponseDto
   *
   * @param user - The User domain entity to map
   * @returns A UserResponseDto containing non-sensitive user data
   *
   * @remarks
   * This method:
   * - Extracts only public user information
   * - Computes the full name from firstName + lastName
   * - Converts value objects (UserId, Email, RoleId) to primitive strings
   * - EXCLUDES the password field for security
   *
   * @example
   * ```typescript
   * const user: User = // ... from repository
   * const dto = UserMapper.toDto(user)
   *
   * console.log(dto)
   * // {
   * //   id: '550e8400-e29b-41d4-a716-446655440000',
   * //   email: 'john.doe@example.com',
   * //   firstName: 'John',
   * //   lastName: 'Doe',
   * //   fullName: 'John Doe',
   * //   isActive: true,
   * //   roleId: '660e8400-e29b-41d4-a716-446655440001',
   * //   createdAt: 2026-02-12T10:00:00.000Z,
   * //   updatedAt: 2026-02-12T10:00:00.000Z
   * // }
   * ```
   */
  static toDto(user: User): UserResponseDto {
    return {
      id: user.id.getValue(),
      email: user.email.getValue(),
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.getFullName(),
      isActive: user.isActive,
      roleId: user.getRoleId().getValue(),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  }

  /**
   * Maps multiple User entities to UserResponseDtos
   *
   * @param users - Array of User domain entities to map
   * @returns Array of UserResponseDtos
   *
   * @remarks
   * Convenience method for mapping collections of users.
   * Useful for list endpoints that return multiple users.
   *
   * @example
   * ```typescript
   * const users: User[] = // ... from repository
   * const dtos = UserMapper.toDtoList(users)
   * ```
   */
  static toDtoList(users: User[]): UserResponseDto[] {
    return users.map((user) => this.toDto(user))
  }
}
