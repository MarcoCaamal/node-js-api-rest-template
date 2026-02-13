import { Result } from '@/lib/result/result'
import { IRoleRepository } from '@/modules/identity/domain/repositories/role.repository.interface'
import { IPermissionRepository } from '@/modules/identity/domain/repositories/permission.repository.interface'
import { Role } from '@/modules/identity/domain/entities/role.entity'
import { PermissionId } from '@/modules/identity/domain/value-objects/permission-id.vo'
import { ConflictError } from '@/modules/common/errors/conflict.error'
import { NotFoundError } from '@/modules/common/errors/not-found.error'
import { RoleResponseDto } from '@/modules/identity/application/roles/dtos/role-response.dto'
import { RoleMapper } from '@/modules/identity/application/roles/mappers/role.mapper'

export interface CreateRoleInput {
  name: string
  description: string
  permissionIds?: string[]
}

/**
 * Create Role Use Case
 *
 * Creates a custom role (system roles cannot be created via API).
 */
export class CreateRoleUseCase {
  constructor(
    private readonly roleRepository: IRoleRepository,
    private readonly permissionRepository: IPermissionRepository
  ) {}

  async execute(input: CreateRoleInput): Promise<Result<RoleResponseDto, Error>> {
    const existsResult = await this.roleRepository.existsByName(input.name)
    if (!existsResult.isSuccess()) {
      return Result.fail(existsResult.error)
    }

    if (existsResult.value) {
      return Result.fail(
        new ConflictError('Role', 'name', input.name, 'Role name already exists', {
          aggregateType: 'Role',
          operation: 'create',
          metadata: { name: input.name }
        })
      )
    }

    const permissionIds = input.permissionIds ?? []
    const permissionVoResult = this.parsePermissionIds(permissionIds)
    if (!permissionVoResult.isSuccess()) {
      return Result.fail(permissionVoResult.error)
    }

    const permissionsExistResult = await this.ensurePermissionsExist(permissionVoResult.value)
    if (!permissionsExistResult.isSuccess()) {
      return Result.fail(permissionsExistResult.error)
    }

    const roleResult = Role.create({
      name: input.name,
      description: input.description,
      permissionIds: permissionVoResult.value
    })

    if (!roleResult.isSuccess()) {
      return Result.fail(roleResult.error)
    }

    const saveResult = await this.roleRepository.save(roleResult.value)
    if (!saveResult.isSuccess()) {
      return Result.fail(saveResult.error)
    }

    return Result.ok(RoleMapper.toDto(roleResult.value))
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
