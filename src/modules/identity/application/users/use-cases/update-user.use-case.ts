import { Result } from '@/lib/result/result'
import { IUserRepository } from '@/modules/identity/domain/repositories/user.repository.interface'
import { IRoleRepository } from '@/modules/identity/domain/repositories/role.repository.interface'
import { IPasswordHashService } from '@/modules/identity/application/services/password-hash.service.interface'
import { UserId } from '@/modules/identity/domain/value-objects/user-id.vo'
import { Email } from '@/modules/identity/domain/value-objects/email.vo'
import { Password } from '@/modules/identity/domain/value-objects/password.vo'
import { RoleId } from '@/modules/identity/domain/value-objects/role-id.vo'
import { NotFoundError } from '@/modules/common/errors/not-found.error'
import { ConflictError } from '@/modules/common/errors/conflict.error'
import { UserResponseDto } from '@/modules/identity/application/auth/dtos/user-response.dto'
import { UserMapper } from '@/modules/identity/application/auth/mappers/user.mapper'

export interface UpdateUserInput {
  email?: string
  password?: string
  firstName?: string
  lastName?: string
  roleId?: string
  isActive?: boolean
}

/**
 * Update User Use Case
 *
 * Updates user profile and access properties.
 */
export class UpdateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly roleRepository: IRoleRepository,
    private readonly passwordHashService: IPasswordHashService
  ) {}

  async execute(userId: string, input: UpdateUserInput): Promise<Result<UserResponseDto, Error>> {
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

    if (input.email && input.email !== user.email.getValue()) {
      const emailResult = Email.create(input.email)
      if (!emailResult.isSuccess()) {
        return Result.fail(emailResult.error)
      }

      const emailExistsResult = await this.userRepository.existsByEmail(emailResult.value)
      if (!emailExistsResult.isSuccess()) {
        return Result.fail(emailExistsResult.error)
      }

      if (emailExistsResult.value) {
        return Result.fail(
          new ConflictError('User', 'email', input.email, 'Email already registered', {
            aggregateType: 'User',
            operation: 'update',
            metadata: { email: input.email }
          })
        )
      }

      const changeEmailResult = user.changeEmail(emailResult.value)
      if (!changeEmailResult.isSuccess()) {
        return Result.fail(changeEmailResult.error)
      }
    }

    if (input.password) {
      const passwordResult = Password.create(input.password)
      if (!passwordResult.isSuccess()) {
        return Result.fail(passwordResult.error)
      }

      const hashedPasswordString = await this.passwordHashService.hash(input.password)
      const hashedPassword = Password.fromString(hashedPasswordString)
      const changePasswordResult = user.changePassword(hashedPassword)
      if (!changePasswordResult.isSuccess()) {
        return Result.fail(changePasswordResult.error)
      }
    }

    if (input.firstName) {
      const changeFirstNameResult = user.changeFirstName(input.firstName)
      if (!changeFirstNameResult.isSuccess()) {
        return Result.fail(changeFirstNameResult.error)
      }
    }

    if (input.lastName) {
      const changeLastNameResult = user.changeLastName(input.lastName)
      if (!changeLastNameResult.isSuccess()) {
        return Result.fail(changeLastNameResult.error)
      }
    }

    if (input.roleId) {
      const roleIdResult = RoleId.fromString(input.roleId)
      if (!roleIdResult.isSuccess()) {
        return Result.fail(roleIdResult.error)
      }

      const roleResult = await this.roleRepository.findById(roleIdResult.value)
      if (!roleResult.isSuccess()) {
        return Result.fail(roleResult.error)
      }

      if (!roleResult.value) {
        return Result.fail(
          new NotFoundError('Role', input.roleId, {
            aggregateType: 'Role',
            aggregateId: input.roleId,
            operation: 'update_user'
          })
        )
      }

      const changeRoleResult = user.changeRole(roleIdResult.value)
      if (!changeRoleResult.isSuccess()) {
        return Result.fail(changeRoleResult.error)
      }
    }

    if (input.isActive !== undefined && input.isActive !== user.isActive) {
      const activationResult = input.isActive ? user.activate() : user.deactivate()
      if (!activationResult.isSuccess()) {
        return Result.fail(activationResult.error)
      }
    }

    const updateResult = await this.userRepository.update(user)
    if (!updateResult.isSuccess()) {
      return Result.fail(updateResult.error)
    }

    return Result.ok(UserMapper.toDto(user))
  }
}
