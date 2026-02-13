import { Result } from '@/lib/result/result'
import { IUserRepository } from '@/modules/identity/domain/repositories/user.repository.interface'
import { PaginatedResponseDto } from '@/modules/common/dtos/paginated-response.dto'
import { PaginationService } from '@/modules/common/services/pagination.service'
import { UserResponseDto } from '@/modules/identity/application/auth/dtos/user-response.dto'
import { UserMapper } from '@/modules/identity/application/auth/mappers/user.mapper'

/**
 * List Users Use Case
 *
 * Retrieves a paginated list of users in the system.
 */
export class ListUsersUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(
    limit?: number,
    offset?: number
  ): Promise<Result<PaginatedResponseDto<UserResponseDto>, Error>> {
    const paramsResult = PaginationService.validateParams(limit, offset)
    if (!paramsResult.isSuccess()) {
      return Result.fail(paramsResult.error)
    }

    const { limit: validLimit, offset: validOffset } = paramsResult.value

    const [usersResult, countResult] = await Promise.all([
      this.userRepository.findAll(validLimit, validOffset),
      this.userRepository.count()
    ])

    if (!usersResult.isSuccess()) {
      return Result.fail(usersResult.error)
    }

    if (!countResult.isSuccess()) {
      return Result.fail(countResult.error)
    }

    const dtos = UserMapper.toDtoList(usersResult.value)
    const response = PaginationService.buildResponse(
      dtos,
      countResult.value,
      validLimit,
      validOffset
    )

    return Result.ok(response)
  }
}
