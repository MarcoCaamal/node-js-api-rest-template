import { Permission } from '@/modules/identity/domain/entities/permission.entity'
import { PermissionResponseDto } from '../dtos/permission-response.dto'

/**
 * Permission Mapper
 *
 * Converts between Permission domain entity and PermissionResponseDto.
 * Maps domain concepts to presentation layer format.
 */
export class PermissionMapper {
  /**
   * Converts a Permission entity to a PermissionResponseDto
   */
  static toDto(permission: Permission): PermissionResponseDto {
    return {
      id: permission.id.getValue(),
      resource: permission.resource,
      action: permission.action,
      description: permission.description,
      createdAt: permission.createdAt,
      updatedAt: permission.createdAt // Permission entity doesn't track updates
    }
  }

  /**
   * Converts an array of Permission entities to PermissionResponseDto array
   */
  static toDtoList(permissions: Permission[]): PermissionResponseDto[] {
    return permissions.map((permission) => this.toDto(permission))
  }
}
