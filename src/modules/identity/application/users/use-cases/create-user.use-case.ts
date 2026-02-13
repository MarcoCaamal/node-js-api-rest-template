import { Result } from '@/lib/result/result'
import { IUserRepository } from '@/modules/identity/domain/repositories/user.repository.interface'
import { IRoleRepository } from '@/modules/identity/domain/repositories/role.repository.interface'
import { IPasswordHashService } from '@/modules/identity/application/services/password-hash.service.interface'
import { Email } from '@/modules/identity/domain/value-objects/email.vo'
import { Password } from '@/modules/identity/domain/value-objects/password.vo'
import { RoleId } from '@/modules/identity/domain/value-objects/role-id.vo'
import { User } from '@/modules/identity/domain/entities/user.entity'
import { ConflictError } from '@/modules/common/errors/conflict.error'
import { NotFoundError } from '@/modules/common/errors/not-found.error'
import { UserResponseDto } from '@/modules/identity/application/auth/dtos/user-response.dto'
import { UserMapper } from '@/modules/identity/application/auth/mappers/user.mapper'

export interface CreateUserInput {
  email: string
  password: string
  firstName: string
  lastName: string
  roleId: string
}

/**
 * Create User Use Case
 *
 * Creates a new user with an explicit role assignment.
 */
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly roleRepository: IRoleRepository,
    private readonly passwordHashService: IPasswordHashService
  ) {}

  async execute(input: CreateUserInput): Promise<Result<UserResponseDto, Error>> {
    const emailResult = Email.create(input.email)
    if (!emailResult.isSuccess()) {
      return Result.fail(emailResult.error)
    }

    const email = emailResult.value

    const emailExistsResult = await this.userRepository.existsByEmail(email)
    if (!emailExistsResult.isSuccess()) {
      return Result.fail(emailExistsResult.error)
    }

    if (emailExistsResult.value) {
      return Result.fail(
        new ConflictError('User', 'email', input.email, 'Email already registered', {
          aggregateType: 'User',
          operation: 'create',
          metadata: { email: input.email }
        })
      )
    }

    const passwordResult = Password.create(input.password)
    if (!passwordResult.isSuccess()) {
      return Result.fail(passwordResult.error)
    }

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
          operation: 'create_user'
        })
      )
    }

    const hashedPasswordString = await this.passwordHashService.hash(input.password)
    const hashedPassword = Password.fromString(hashedPasswordString)

    const userResult = User.create({
      email,
      password: hashedPassword,
      firstName: input.firstName,
      lastName: input.lastName,
      roleId: roleIdResult.value
    })

    if (!userResult.isSuccess()) {
      return Result.fail(userResult.error)
    }

    const saveResult = await this.userRepository.save(userResult.value)
    if (!saveResult.isSuccess()) {
      return Result.fail(saveResult.error)
    }

    return Result.ok(UserMapper.toDto(userResult.value))
  }
}
