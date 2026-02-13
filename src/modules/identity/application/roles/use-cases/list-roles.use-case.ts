import { Result } from '@/lib/result/result'
import { IRoleRepository } from '@/modules/identity/domain/repositories/role.repository.interface'
import { PaginatedResponseDto } from '@/modules/common/dtos/paginated-response.dto'
import { PaginationService } from '@/modules/common/services/pagination.service'
import { RoleResponseDto } from '@/modules/identity/application/roles/dtos/role-response.dto'
import { RoleMapper } from '@/modules/identity/application/roles/mappers/role.mapper'

/**
 * List Roles Use Case
 *
 * Retrieves a paginated list of roles in the system.
 */
export class ListRolesUseCase {
  constructor(private readonly roleRepository: IRoleRepository) {}

  async execute(
    limit?: number,
    offset?: number
  ): Promise<Result<PaginatedResponseDto<RoleResponseDto>, Error>> {
    const paramsResult = PaginationService.validateParams(limit, offset)
    if (!paramsResult.isSuccess()) {
      return Result.fail(paramsResult.error)
    }

    const { limit: validLimit, offset: validOffset } = paramsResult.value

    const [rolesResult, countResult] = await Promise.all([
      this.roleRepository.findAll(validLimit, validOffset),
      this.roleRepository.count()
    ])

    if (!rolesResult.isSuccess()) {
      return Result.fail(rolesResult.error)
    }

    if (!countResult.isSuccess()) {
      return Result.fail(countResult.error)
    }

    const dtos = RoleMapper.toDtoList(rolesResult.value)
    const response = PaginationService.buildResponse(
      dtos,
      countResult.value,
      validLimit,
      validOffset
    )

    return Result.ok(response)
  }
}
