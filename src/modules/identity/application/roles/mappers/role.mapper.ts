import { Role } from '@/modules/identity/domain/entities/role.entity'
import { RoleResponseDto } from '../dtos/role-response.dto'

export class RoleMapper {
  static toDto(role: Role): RoleResponseDto {
    return {
      id: role.id.getValue(),
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      permissionIds: role.getPermissionIds().map((permissionId) => permissionId.getValue()),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt
    }
  }

  static toDtoList(roles: Role[]): RoleResponseDto[] {
    return roles.map((role) => this.toDto(role))
  }
}
