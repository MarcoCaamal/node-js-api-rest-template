import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GetUserByIdUseCase } from '@/modules/identity/application/users/use-cases/get-user-by-id.use-case'
import { IUserRepository } from '@/modules/identity/domain/repositories/user.repository.interface'
import { User } from '@/modules/identity/domain/entities/user.entity'
import { UserId } from '@/modules/identity/domain/value-objects/user-id.vo'
import { Email } from '@/modules/identity/domain/value-objects/email.vo'
import { Password } from '@/modules/identity/domain/value-objects/password.vo'
import { RoleId } from '@/modules/identity/domain/value-objects/role-id.vo'
import { Result } from '@/lib/result/result'
import { ValidationError } from '@/modules/common/errors/domain/validation.error'
import { DatabaseError } from '@/modules/common/errors/database.error'
import { NotFoundError } from '@/modules/common/errors/not-found.error'

describe('GetUserByIdUseCase', () => {
  let useCase: GetUserByIdUseCase
  let mockUserRepository: IUserRepository

  const createUser = (): User => {
    const email = Email.create('user@example.com').value
    const roleId = RoleId.create()

    return User.reconstitute({
      id: UserId.create(),
      email,
      password: Password.fromString('$2b$10$hashed'),
      firstName: 'John',
      lastName: 'Doe',
      isActive: true,
      roleId,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-02T00:00:00.000Z')
    })
  }

  beforeEach(() => {
    mockUserRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findAll: vi.fn(),
      existsByEmail: vi.fn(),
      existsById: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn()
    }

    useCase = new GetUserByIdUseCase(mockUserRepository)
  })

  it('should fail when user ID is invalid', async () => {
    const result = await useCase.execute('invalid-id')

    expect(result.isSuccess()).toBe(false)
    expect(result.error).toBeInstanceOf(ValidationError)
    expect((result.error as ValidationError).field).toBe('userId')
    expect(mockUserRepository.findById).not.toHaveBeenCalled()
  })

  it('should fail when repository returns error', async () => {
    const userId = UserId.create().getValue()
    const dbError = new DatabaseError('Failed to find user by ID', {
      metadata: { operation: 'findById' }
    })

    vi.mocked(mockUserRepository.findById).mockResolvedValue(Result.fail(dbError))

    const result = await useCase.execute(userId)

    expect(result.isSuccess()).toBe(false)
    expect(result.error).toBe(dbError)
  })

  it('should return NotFoundError when user does not exist', async () => {
    const userId = UserId.create().getValue()

    vi.mocked(mockUserRepository.findById).mockResolvedValue(Result.ok(null))

    const result = await useCase.execute(userId)

    expect(result.isSuccess()).toBe(false)
    expect(result.error).toBeInstanceOf(NotFoundError)
  })

  it('should return user DTO when user exists', async () => {
    const user = createUser()

    vi.mocked(mockUserRepository.findById).mockResolvedValue(Result.ok(user))

    const result = await useCase.execute(user.id.getValue())

    expect(result.isSuccess()).toBe(true)
    expect(result.value).toMatchObject({
      id: user.id.getValue(),
      email: user.email.getValue(),
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.getFullName(),
      isActive: user.isActive,
      roleId: user.getRoleId().getValue(),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    })
  })
})
