import { Result } from '@/lib/result/result'
import { IPermissionRepository } from '@/modules/identity/domain/repositories/permission.repository.interface'
import { PermissionId } from '@/modules/identity/domain/value-objects/permission-id.vo'
import { NotFoundError } from '@/modules/common/errors/not-found.error'
import { PermissionResponseDto } from '../dtos/permission-response.dto'
import { PermissionMapper } from '../mappers/permission.mapper'

/**
 * Get Permission By ID Use Case
 *
 * Retrieves a single permission by its unique identifier.
 *
 * Business Rules:
 * - Permission ID must be a valid UUID
 * - Returns NotFoundError if permission doesn't exist
 */
export class GetPermissionByIdUseCase {
  constructor(private readonly permissionRepository: IPermissionRepository) {}

  async execute(permissionId: string): Promise<Result<PermissionResponseDto, Error>> {
    // Validate and create PermissionId value object
    const permissionIdResult = PermissionId.fromString(permissionId)
    if (!permissionIdResult.isSuccess()) {
      return Result.fail(permissionIdResult.error)
    }

    // Fetch permission from repository
    const permissionResult = await this.permissionRepository.findById(permissionIdResult.value)

    if (!permissionResult.isSuccess()) {
      return Result.fail(permissionResult.error)
    }

    // Check if permission was found
    const permission = permissionResult.value
    if (!permission) {
      return Result.fail(
        new NotFoundError('Permission', permissionId, {
          metadata: { reason: 'Permission not found with provided ID' }
        })
      )
    }

    // Map domain entity to DTO
    const dto = PermissionMapper.toDto(permission)
    return Result.ok(dto)
  }
}
