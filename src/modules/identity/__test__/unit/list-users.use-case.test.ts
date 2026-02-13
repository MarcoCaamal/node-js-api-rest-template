import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ListUsersUseCase } from '@/modules/identity/application/users/use-cases/list-users.use-case'
import { IUserRepository } from '@/modules/identity/domain/repositories/user.repository.interface'
import { User } from '@/modules/identity/domain/entities/user.entity'
import { UserId } from '@/modules/identity/domain/value-objects/user-id.vo'
import { Email } from '@/modules/identity/domain/value-objects/email.vo'
import { Password } from '@/modules/identity/domain/value-objects/password.vo'
import { RoleId } from '@/modules/identity/domain/value-objects/role-id.vo'
import { Result } from '@/lib/result/result'
import { ValidationError } from '@/modules/common/errors/domain/validation.error'
import { DatabaseError } from '@/modules/common/errors/database.error'

describe('ListUsersUseCase', () => {
  let useCase: ListUsersUseCase
  let mockUserRepository: IUserRepository

  const createUser = (emailValue: string, firstName: string, lastName: string): User => {
    const email = Email.create(emailValue).value

    return User.reconstitute({
      id: UserId.create(),
      email,
      password: Password.fromString('$2b$10$hashed'),
      firstName,
      lastName,
      isActive: true,
      roleId: RoleId.create(),
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z')
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

    useCase = new ListUsersUseCase(mockUserRepository)
  })

  it('should return paginated users with default parameters', async () => {
    const users = [
      createUser('user1@example.com', 'John', 'Doe'),
      createUser('user2@example.com', 'Jane', 'Smith')
    ]

    vi.mocked(mockUserRepository.findAll).mockResolvedValue(Result.ok(users))
    vi.mocked(mockUserRepository.count).mockResolvedValue(Result.ok(2))

    const result = await useCase.execute()

    expect(result.isSuccess()).toBe(true)
    expect(mockUserRepository.findAll).toHaveBeenCalledWith(20, 0)
    expect(result.value.data).toHaveLength(2)
    expect(result.value.pagination).toEqual({
      total: 2,
      limit: 20,
      offset: 0,
      hasMore: false,
      currentPage: 1,
      totalPages: 1
    })
  })

  it('should return paginated users with custom parameters', async () => {
    const users = [createUser('user@example.com', 'John', 'Doe')]

    vi.mocked(mockUserRepository.findAll).mockResolvedValue(Result.ok(users))
    vi.mocked(mockUserRepository.count).mockResolvedValue(Result.ok(10))

    const result = await useCase.execute(1, 2)

    expect(result.isSuccess()).toBe(true)
    expect(mockUserRepository.findAll).toHaveBeenCalledWith(1, 2)
    expect(result.value.pagination).toEqual({
      total: 10,
      limit: 1,
      offset: 2,
      hasMore: true,
      currentPage: 3,
      totalPages: 10
    })
  })

  it('should return empty array when no users exist', async () => {
    vi.mocked(mockUserRepository.findAll).mockResolvedValue(Result.ok([]))
    vi.mocked(mockUserRepository.count).mockResolvedValue(Result.ok(0))

    const result = await useCase.execute()

    expect(result.isSuccess()).toBe(true)
    expect(result.value.data).toEqual([])
    expect(result.value.pagination).toEqual({
      total: 0,
      limit: 20,
      offset: 0,
      hasMore: false,
      currentPage: 1,
      totalPages: 0
    })
  })

  it('should fail when limit is invalid', async () => {
    const result = await useCase.execute(0, 0)

    expect(result.isSuccess()).toBe(false)
    expect(result.error).toBeInstanceOf(ValidationError)
    expect((result.error as ValidationError).field).toBe('limit')
    expect(mockUserRepository.findAll).not.toHaveBeenCalled()
  })

  it('should fail when limit exceeds maximum', async () => {
    const result = await useCase.execute(101, 0)

    expect(result.isSuccess()).toBe(false)
    expect(result.error).toBeInstanceOf(ValidationError)
    expect((result.error as ValidationError).field).toBe('limit')
    expect(mockUserRepository.findAll).not.toHaveBeenCalled()
  })

  it('should fail when offset is invalid', async () => {
    const result = await useCase.execute(20, -1)

    expect(result.isSuccess()).toBe(false)
    expect(result.error).toBeInstanceOf(ValidationError)
    expect((result.error as ValidationError).field).toBe('offset')
    expect(mockUserRepository.findAll).not.toHaveBeenCalled()
  })

  it('should fail when repository findAll fails', async () => {
    const dbError = new DatabaseError('Failed to list users', {
      metadata: { operation: 'findAll' }
    })

    vi.mocked(mockUserRepository.findAll).mockResolvedValue(Result.fail(dbError))
    vi.mocked(mockUserRepository.count).mockResolvedValue(Result.ok(10))

    const result = await useCase.execute()

    expect(result.isSuccess()).toBe(false)
    expect(result.error).toBe(dbError)
  })

  it('should fail when repository count fails', async () => {
    const users = [createUser('user@example.com', 'John', 'Doe')]
    const dbError = new DatabaseError('Failed to count users', {
      metadata: { operation: 'count' }
    })

    vi.mocked(mockUserRepository.findAll).mockResolvedValue(Result.ok(users))
    vi.mocked(mockUserRepository.count).mockResolvedValue(Result.fail(dbError))

    const result = await useCase.execute()

    expect(result.isSuccess()).toBe(false)
    expect(result.error).toBe(dbError)
  })

  it('should handle large datasets with correct pagination', async () => {
    const users = Array.from({ length: 50 }, (_, i) =>
      createUser(`user${i}@example.com`, 'John', 'Doe')
    )

    vi.mocked(mockUserRepository.findAll).mockResolvedValue(Result.ok(users))
    vi.mocked(mockUserRepository.count).mockResolvedValue(Result.ok(500))

    const result = await useCase.execute(50, 100)

    expect(result.isSuccess()).toBe(true)
    expect(result.value.data).toHaveLength(50)
    expect(result.value.pagination).toEqual({
      total: 500,
      limit: 50,
      offset: 100,
      hasMore: true,
      currentPage: 3,
      totalPages: 10
    })
  })
})
