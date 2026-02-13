import { Result } from '@/lib/result/result'
import { IRoleRepository } from '@/modules/identity/domain/repositories/role.repository.interface'
import { RoleId } from '@/modules/identity/domain/value-objects/role-id.vo'
import { NotFoundError } from '@/modules/common/errors/not-found.error'
import { ForbiddenError } from '@/modules/common/errors/forbidden.error'

/**
 * Delete Role Use Case
 *
 * Deletes a role (system roles cannot be deleted).
 */
export class DeleteRoleUseCase {
  constructor(private readonly roleRepository: IRoleRepository) {}

  async execute(roleId: string): Promise<Result<void, Error>> {
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

    if (role.isSystem) {
      return Result.fail(
        new ForbiddenError('delete', 'Role', 'System roles cannot be deleted', {
          aggregateType: 'Role',
          aggregateId: role.id.getValue(),
          operation: 'delete',
          metadata: { isSystem: true }
        })
      )
    }

    const deleteResult = await this.roleRepository.delete(roleIdResult.value)
    if (!deleteResult.isSuccess()) {
      return Result.fail(deleteResult.error)
    }

    if (!deleteResult.value) {
      return Result.fail(
        new NotFoundError('Role', roleId, {
          metadata: { reason: 'Role not found with provided ID' }
        })
      )
    }

    return Result.ok(undefined)
  }
}
