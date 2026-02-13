import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CreateRoleUseCase } from '@/modules/identity/application/roles/use-cases/create-role.use-case'
import { IRoleRepository } from '@/modules/identity/domain/repositories/role.repository.interface'
import { IPermissionRepository } from '@/modules/identity/domain/repositories/permission.repository.interface'
import { Permission } from '@/modules/identity/domain/entities/permission.entity'
import { PermissionId } from '@/modules/identity/domain/value-objects/permission-id.vo'
import { Result } from '@/lib/result/result'
import { ValidationError } from '@/modules/common/errors/domain/validation.error'
import { ConflictError } from '@/modules/common/errors/conflict.error'
import { NotFoundError } from '@/modules/common/errors/not-found.error'

describe('CreateRoleUseCase', () => {
  let useCase: CreateRoleUseCase
  let mockRoleRepository: IRoleRepository
  let mockPermissionRepository: IPermissionRepository

  const createPermission = (): Permission => {
    return Permission.reconstitute({
      id: PermissionId.create(),
      resource: 'users',
      action: 'read',
      description: 'Read users',
      createdAt: new Date('2024-01-01T00:00:00.000Z')
    })
  }

  beforeEach(() => {
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

    mockPermissionRepository = {
      findById: vi.fn(),
      findAll: vi.fn(),
      findByResourceAndAction: vi.fn(),
      findByIds: vi.fn(),
      findByResource: vi.fn(),
      existsByCode: vi.fn(),
      existsById: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn()
    }

    useCase = new CreateRoleUseCase(mockRoleRepository, mockPermissionRepository)
  })

  it('should fail when role name already exists', async () => {
    vi.mocked(mockRoleRepository.existsByName).mockResolvedValue(Result.ok(true))

    const result = await useCase.execute({
      name: 'ADMIN',
      description: 'Admin role'
    })

    expect(result.isSuccess()).toBe(false)
    expect(result.error).toBeInstanceOf(ConflictError)
  })

  it('should fail when permission ID is invalid', async () => {
    vi.mocked(mockRoleRepository.existsByName).mockResolvedValue(Result.ok(false))

    const result = await useCase.execute({
      name: 'SUPPORT',
      description: 'Support role',
      permissionIds: ['invalid-id']
    })

    expect(result.isSuccess()).toBe(false)
    expect(result.error).toBeInstanceOf(ValidationError)
  })

  it('should fail when permission IDs are missing', async () => {
    const permissionId = PermissionId.create().getValue()

    vi.mocked(mockRoleRepository.existsByName).mockResolvedValue(Result.ok(false))
    vi.mocked(mockPermissionRepository.findByIds).mockResolvedValue(Result.ok([]))

    const result = await useCase.execute({
      name: 'SUPPORT',
      description: 'Support role',
      permissionIds: [permissionId]
    })

    expect(result.isSuccess()).toBe(false)
    expect(result.error).toBeInstanceOf(NotFoundError)
  })

  it('should create role when input is valid', async () => {
    const permission = createPermission()

    vi.mocked(mockRoleRepository.existsByName).mockResolvedValue(Result.ok(false))
    vi.mocked(mockPermissionRepository.findByIds).mockResolvedValue(Result.ok([permission]))
    vi.mocked(mockRoleRepository.save).mockResolvedValue(Result.ok(undefined))

    const result = await useCase.execute({
      name: 'SUPPORT',
      description: 'Support role',
      permissionIds: [permission.id.getValue()]
    })

    expect(result.isSuccess()).toBe(true)
    expect(result.value).toMatchObject({
      name: 'SUPPORT',
      description: 'Support role',
      permissionIds: [permission.id.getValue()],
      isSystem: false
    })
  })
})
