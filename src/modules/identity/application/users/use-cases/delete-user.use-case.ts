import { Result } from '@/lib/result/result'
import { IUserRepository } from '@/modules/identity/domain/repositories/user.repository.interface'
import { UserId } from '@/modules/identity/domain/value-objects/user-id.vo'
import { NotFoundError } from '@/modules/common/errors/not-found.error'

/**
 * Delete User Use Case
 *
 * Soft deletes a user by ID.
 */
export class DeleteUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string): Promise<Result<void, Error>> {
    const userIdResult = UserId.fromString(userId)
    if (!userIdResult.isSuccess()) {
      return Result.fail(userIdResult.error)
    }

    const deleteResult = await this.userRepository.delete(userIdResult.value)
    if (!deleteResult.isSuccess()) {
      return Result.fail(deleteResult.error)
    }

    if (!deleteResult.value) {
      return Result.fail(
        new NotFoundError('User', userId, {
          metadata: { reason: 'User not found with provided ID' }
        })
      )
    }

    return Result.ok(undefined)
  }
}
