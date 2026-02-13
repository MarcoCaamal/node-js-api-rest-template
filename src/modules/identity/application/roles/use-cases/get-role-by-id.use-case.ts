import { Result } from '@/lib/result/result'
import { IRoleRepository } from '@/modules/identity/domain/repositories/role.repository.interface'
import { RoleId } from '@/modules/identity/domain/value-objects/role-id.vo'
import { NotFoundError } from '@/modules/common/errors/not-found.error'
import { RoleResponseDto } from '@/modules/identity/application/roles/dtos/role-response.dto'
import { RoleMapper } from '@/modules/identity/application/roles/mappers/role.mapper'

/**
 * Get Role By ID Use Case
 *
 * Retrieves a single role by its unique identifier.
 */
export class GetRoleByIdUseCase {
  constructor(private readonly roleRepository: IRoleRepository) {}

  async execute(roleId: string): Promise<Result<RoleResponseDto, Error>> {
    const roleIdResult = RoleId.fromString(roleId)
    if (!roleIdResult.isSuccess()) {
      return Result.fail(roleIdResult.error)
    }

    const roleResult = await this.roleRepository.findById(roleIdResult.value)
    if (!roleResult.isSuccess()) {
      return Result.fail(roleResult.error)
    }

    const role = roleResult.value
    if (!role) {
      return Result.fail(
        new NotFoundError('Role', roleId, {
          metadata: { reason: 'Role not found with provided ID' }
        })
      )
    }

    return Result.ok(RoleMapper.toDto(role))
  }
}
