import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CreateUserUseCase } from '@/modules/identity/application/users/use-cases/create-user.use-case'
import { IUserRepository } from '@/modules/identity/domain/repositories/user.repository.interface'
import { IRoleRepository } from '@/modules/identity/domain/repositories/role.repository.interface'
import { IPasswordHashService } from '@/modules/identity/application/services/password-hash.service.interface'
import { Role } from '@/modules/identity/domain/entities/role.entity'
import { RoleId } from '@/modules/identity/domain/value-objects/role-id.vo'
import { PermissionId } from '@/modules/identity/domain/value-objects/permission-id.vo'
import { Result } from '@/lib/result/result'
import { ValidationError } from '@/modules/common/errors/domain/validation.error'
import { ConflictError } from '@/modules/common/errors/conflict.error'
import { NotFoundError } from '@/modules/common/errors/not-found.error'

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase
  let mockUserRepository: IUserRepository
  let mockRoleRepository: IRoleRepository
  let mockPasswordHashService: IPasswordHashService

  const createRole = (): Role => {
    return Role.reconstitute({
      id: RoleId.create(),
      name: 'USER',
      description: 'Default role',
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

    useCase = new CreateUserUseCase(mockUserRepository, mockRoleRepository, mockPasswordHashService)
  })

  it('should fail when email is invalid', async () => {
    const result = await useCase.execute({
      email: 'invalid-email',
      password: 'SecureP@ss123!',
      firstName: 'John',
      lastName: 'Doe',
      roleId: RoleId.create().getValue()
    })

    expect(result.isSuccess()).toBe(false)
    expect(result.error).toBeInstanceOf(ValidationError)
    expect((result.error as ValidationError).field).toBe('email')
  })

  it('should fail when email already exists', async () => {
    vi.mocked(mockUserRepository.existsByEmail).mockResolvedValue(Result.ok(true))

    const result = await useCase.execute({
      email: 'user@example.com',
      password: 'SecureP@ss123!',
      firstName: 'John',
      lastName: 'Doe',
      roleId: RoleId.create().getValue()
    })

    expect(result.isSuccess()).toBe(false)
    expect(result.error).toBeInstanceOf(ConflictError)
  })

  it('should fail when role does not exist', async () => {
    vi.mocked(mockUserRepository.existsByEmail).mockResolvedValue(Result.ok(false))
    vi.mocked(mockRoleRepository.findById).mockResolvedValue(Result.ok(null))

    const roleId = RoleId.create().getValue()
    const result = await useCase.execute({
      email: 'user@example.com',
      password: 'SecureP@ss123!',
      firstName: 'John',
      lastName: 'Doe',
      roleId
    })

    expect(result.isSuccess()).toBe(false)
    expect(result.error).toBeInstanceOf(NotFoundError)
  })

  it('should create user when input is valid', async () => {
    const role = createRole()
    vi.mocked(mockUserRepository.existsByEmail).mockResolvedValue(Result.ok(false))
    vi.mocked(mockRoleRepository.findById).mockResolvedValue(Result.ok(role))
    vi.mocked(mockPasswordHashService.hash).mockResolvedValue('$2b$10$hashed')
    vi.mocked(mockUserRepository.save).mockResolvedValue(Result.ok(undefined))

    const result = await useCase.execute({
      email: 'user@example.com',
      password: 'SecureP@ss123!',
      firstName: 'John',
      lastName: 'Doe',
      roleId: role.id.getValue()
    })

    expect(result.isSuccess()).toBe(true)
    expect(mockPasswordHashService.hash).toHaveBeenCalledWith('SecureP@ss123!')
    expect(mockUserRepository.save).toHaveBeenCalledTimes(1)
    expect(result.value).toMatchObject({
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      roleId: role.id.getValue()
    })
  })
})
