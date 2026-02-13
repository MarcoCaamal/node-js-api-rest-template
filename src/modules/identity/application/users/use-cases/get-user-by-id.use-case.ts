import { Result } from '@/lib/result/result'
import { IUserRepository } from '@/modules/identity/domain/repositories/user.repository.interface'
import { UserId } from '@/modules/identity/domain/value-objects/user-id.vo'
import { NotFoundError } from '@/modules/common/errors/not-found.error'
import { UserResponseDto } from '@/modules/identity/application/auth/dtos/user-response.dto'
import { UserMapper } from '@/modules/identity/application/auth/mappers/user.mapper'

/**
 * Get User By ID Use Case
 *
 * Retrieves a single user by its unique identifier.
 */
export class GetUserByIdUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string): Promise<Result<UserResponseDto, Error>> {
    const userIdResult = UserId.fromString(userId)
    if (!userIdResult.isSuccess()) {
      return Result.fail(userIdResult.error)
    }

    const userResult = await this.userRepository.findById(userIdResult.value)
    if (!userResult.isSuccess()) {
      return Result.fail(userResult.error)
    }

    const user = userResult.value
    if (!user) {
      return Result.fail(
        new NotFoundError('User', userId, {
          metadata: { reason: 'User not found with provided ID' }
        })
      )
    }

    return Result.ok(UserMapper.toDto(user))
  }
}
