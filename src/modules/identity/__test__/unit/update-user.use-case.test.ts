import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UpdateUserUseCase } from '@/modules/identity/application/users/use-cases/update-user.use-case'
import { IUserRepository } from '@/modules/identity/domain/repositories/user.repository.interface'
import { IRoleRepository } from '@/modules/identity/domain/repositories/role.repository.interface'
import { IPasswordHashService } from '@/modules/identity/application/services/password-hash.service.interface'
import { User } from '@/modules/identity/domain/entities/user.entity'
import { UserId } from '@/modules/identity/domain/value-objects/user-id.vo'
import { Email } from '@/modules/identity/domain/value-objects/email.vo'
import { Password } from '@/modules/identity/domain/value-objects/password.vo'
import { RoleId } from '@/modules/identity/domain/value-objects/role-id.vo'
import { Role } from '@/modules/identity/domain/entities/role.entity'
import { PermissionId } from '@/modules/identity/domain/value-objects/permission-id.vo'
import { Result } from '@/lib/result/result'
import { ValidationError } from '@/modules/common/errors/domain/validation.error'
import { NotFoundError } from '@/modules/common/errors/not-found.error'
import { ConflictError } from '@/modules/common/errors/conflict.error'

describe('UpdateUserUseCase', () => {
  let useCase: UpdateUserUseCase
  let mockUserRepository: IUserRepository
  let mockRoleRepository: IRoleRepository
  let mockPasswordHashService: IPasswordHashService

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

  const createRole = (): Role => {
    return Role.reconstitute({
      id: RoleId.create(),
      name: 'ADMIN',
      description: 'Admin role',
      isSystem: false,
      permissionIds: [PermissionId.create()],
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

    mockRoleRepository = {
      findById: vi.fn(),
      findByName: vi.fn(),
      findAll: vi.fn(),
      findByIds: vi.fn(),
      existsByName: vi.fn(),
      existsById: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn()
    }

    mockPasswordHashService = {
      hash: vi.fn(),
      compare: vi.fn()
    }

    useCase = new UpdateUserUseCase(mockUserRepository, mockRoleRepository, mockPasswordHashService)
  })

  it('should fail when user ID is invalid', async () => {
    const result = await useCase.execute('invalid-id', { firstName: 'Jane' })

    expect(result.isSuccess()).toBe(false)
    expect(result.error).toBeInstanceOf(ValidationError)
    expect((result.error as ValidationError).field).toBe('userId')
  })

  it('should return NotFoundError when user does not exist', async () => {
    const userId = UserId.create().getValue()
    vi.mocked(mockUserRepository.findById).mockResolvedValue(Result.ok(null))

    const result = await useCase.execute(userId, { firstName: 'Jane' })

    expect(result.isSuccess()).toBe(false)
    expect(result.error).toBeInstanceOf(NotFoundError)
  })

  it('should return ConflictError when email already exists', async () => {
    const user = createUser()
    vi.mocked(mockUserRepository.findById).mockResolvedValue(Result.ok(user))
    vi.mocked(mockUserRepository.existsByEmail).mockResolvedValue(Result.ok(true))

    const result = await useCase.execute(user.id.getValue(), {
      email: 'new@example.com'
    })

    expect(result.isSuccess()).toBe(false)
    expect(result.error).toBeInstanceOf(ConflictError)
  })

  it('should return NotFoundError when role does not exist', async () => {
    const user = createUser()
    vi.mocked(mockUserRepository.findById).mockResolvedValue(Result.ok(user))
    vi.mocked(mockRoleRepository.findById).mockResolvedValue(Result.ok(null))

    const result = await useCase.execute(user.id.getValue(), {
      roleId: RoleId.create().getValue()
    })

    expect(result.isSuccess()).toBe(false)
    expect(result.error).toBeInstanceOf(NotFoundError)
  })

  it('should update user and return DTO when valid', async () => {
    const user = createUser()
    const role = createRole()

    vi.mocked(mockUserRepository.findById).mockResolvedValue(Result.ok(user))
    vi.mocked(mockUserRepository.existsByEmail).mockResolvedValue(Result.ok(false))
    vi.mocked(mockRoleRepository.findById).mockResolvedValue(Result.ok(role))
    vi.mocked(mockPasswordHashService.hash).mockResolvedValue('$2b$10$newhashed')
    vi.mocked(mockUserRepository.update).mockResolvedValue(Result.ok(undefined))

    const result = await useCase.execute(user.id.getValue(), {
      email: 'new@example.com',
      password: 'SecureP@ss123!',
      firstName: 'Jane',
      lastName: 'Smith',
      roleId: role.id.getValue(),
      isActive: false
    })

    expect(result.isSuccess()).toBe(true)
    expect(mockPasswordHashService.hash).toHaveBeenCalledWith('SecureP@ss123!')
    expect(mockUserRepository.update).toHaveBeenCalledTimes(1)
    expect(result.value).toMatchObject({
      email: 'new@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      roleId: role.id.getValue(),
      isActive: false
    })
  })
})
