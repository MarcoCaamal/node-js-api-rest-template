import { Result } from '@/lib/result/result'
import { IRoleRepository } from '@/modules/identity/domain/repositories/role.repository.interface'
import { IPermissionRepository } from '@/modules/identity/domain/repositories/permission.repository.interface'
import { RoleId } from '@/modules/identity/domain/value-objects/role-id.vo'
import { PermissionId } from '@/modules/identity/domain/value-objects/permission-id.vo'
import { NotFoundError } from '@/modules/common/errors/not-found.error'
import { ConflictError } from '@/modules/common/errors/conflict.error'
import { ForbiddenError } from '@/modules/common/errors/forbidden.error'
import { RoleResponseDto } from '@/modules/identity/application/roles/dtos/role-response.dto'
import { RoleMapper } from '@/modules/identity/application/roles/mappers/role.mapper'

export interface UpdateRoleInput {
  name?: string
  description?: string
  permissionIds?: string[]
}

/**
 * Update Role Use Case
 *
 * Updates a role (system roles cannot be edited).
 */
export class UpdateRoleUseCase {
  constructor(
    private readonly roleRepository: IRoleRepository,
    private readonly permissionRepository: IPermissionRepository
  ) {}

  async execute(roleId: string, input: UpdateRoleInput): Promise<Result<RoleResponseDto, Error>> {
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
        new ForbiddenError('update', 'Role', 'System roles cannot be edited', {
          aggregateType: 'Role',
          aggregateId: role.id.getValue(),
          operation: 'update',
          metadata: { isSystem: true }
        })
      )
    }

    if (input.name && input.name.toUpperCase() !== role.name) {
      const existsResult = await this.roleRepository.existsByName(input.name)
      if (!existsResult.isSuccess()) {
        return Result.fail(existsResult.error)
      }

      if (existsResult.value) {
        return Result.fail(
          new ConflictError('Role', 'name', input.name, 'Role name already exists', {
            aggregateType: 'Role',
            operation: 'update',
            metadata: { name: input.name }
          })
        )
      }

      const changeNameResult = role.changeName(input.name)
      if (!changeNameResult.isSuccess()) {
        return Result.fail(changeNameResult.error)
      }
    }

    if (input.description) {
      const changeDescriptionResult = role.changeDescription(input.description)
      if (!changeDescriptionResult.isSuccess()) {
        return Result.fail(changeDescriptionResult.error)
      }
    }

    if (input.permissionIds) {
      const permissionIdsResult = this.parsePermissionIds(input.permissionIds)
      if (!permissionIdsResult.isSuccess()) {
        return Result.fail(permissionIdsResult.error)
      }

      const permissionsExistResult = await this.ensurePermissionsExist(permissionIdsResult.value)
      if (!permissionsExistResult.isSuccess()) {
        return Result.fail(permissionsExistResult.error)
      }

      const replaceResult = role.replacePermissions(permissionIdsResult.value)
      if (!replaceResult.isSuccess()) {
        return Result.fail(replaceResult.error)
      }
    }

    const updateResult = await this.roleRepository.update(role)
    if (!updateResult.isSuccess()) {
      return Result.fail(updateResult.error)
    }

    return Result.ok(RoleMapper.toDto(role))
  }

  private parsePermissionIds(permissionIds: string[]): Result<PermissionId[], Error> {
    const ids: PermissionId[] = []

    for (const permissionId of permissionIds) {
      const permissionIdResult = PermissionId.fromString(permissionId)
      if (!permissionIdResult.isSuccess()) {
        return Result.fail(permissionIdResult.error)
      }

      ids.push(permissionIdResult.value)
    }

    return Result.ok(ids)
  }

  private async ensurePermissionsExist(
    permissionIds: PermissionId[]
  ): Promise<Result<void, Error>> {
    if (permissionIds.length === 0) {
      return Result.ok(undefined)
    }

    const permissionsResult = await this.permissionRepository.findByIds(permissionIds)
    if (!permissionsResult.isSuccess()) {
      return Result.fail(permissionsResult.error)
    }

    if (permissionsResult.value.length !== permissionIds.length) {
      const existing = new Set(
        permissionsResult.value.map((permission) => permission.id.getValue())
      )
      const missingIds = permissionIds
        .map((permissionId) => permissionId.getValue())
        .filter((id) => !existing.has(id))

      return Result.fail(
        new NotFoundError('Permission', missingIds.join(','), {
          aggregateType: 'Permission',
          metadata: { missingIds }
        })
      )
    }

    return Result.ok(undefined)
  }
}
