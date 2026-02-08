import { Result } from '@/lib/result/result'
import { IPermissionRepository } from '@/modules/identity/domain/repositories/permission.repository.interface'
import { PaginatedResponseDto } from '@/modules/common/dtos/paginated-response.dto'
import { PaginationService } from '@/modules/common/services/pagination.service'
import { PermissionResponseDto } from '../dtos/permission-response.dto'
import { PermissionMapper } from '../mappers/permission.mapper'

/**
 * List Permissions Use Case
 *
 * Retrieves a paginated list of all permissions in the system.
 *
 * Business Rules:
 * - Limit must be between 1 and 100 (default: 20)
 * - Offset must be >= 0 (default: 0)
 * - Returns empty array if no permissions found
 * - Includes total count and pagination metadata
 */
export class ListPermissionsUseCase {
  constructor(private readonly permissionRepository: IPermissionRepository) {}

  async execute(
    limit?: number,
    offset?: number
  ): Promise<Result<PaginatedResponseDto<PermissionResponseDto>, Error>> {
    // Validate pagination parameters
    const paramsResult = PaginationService.validateParams(limit, offset)
    if (!paramsResult.isSuccess()) {
      return Result.fail(paramsResult.error)
    }

    const { limit: validLimit, offset: validOffset } = paramsResult.value

    // Fetch permissions and total count in parallel
    const [permissionsResult, countResult] = await Promise.all([
      this.permissionRepository.findAll(validLimit, validOffset),
      this.permissionRepository.count()
    ])

    // Handle repository errors
    if (!permissionsResult.isSuccess()) {
      return Result.fail(permissionsResult.error)
    }

    if (!countResult.isSuccess()) {
      return Result.fail(countResult.error)
    }

    // Map domain entities to DTOs
    const permissions = permissionsResult.value
    const total = countResult.value
    const dtos = PermissionMapper.toDtoList(permissions)

    // Build paginated response using PaginationService
    const response = PaginationService.buildResponse(dtos, total, validLimit, validOffset)

    return Result.ok(response)
  }
}
