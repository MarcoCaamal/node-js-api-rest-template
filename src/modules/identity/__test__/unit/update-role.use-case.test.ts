import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UpdateRoleUseCase } from '@/modules/identity/application/roles/use-cases/update-role.use-case'
import { IRoleRepository } from '@/modules/identity/domain/repositories/role.repository.interface'
import { IPermissionRepository } from '@/modules/identity/domain/repositories/permission.repository.interface'
import { Role } from '@/modules/identity/domain/entities/role.entity'
import { RoleId } from '@/modules/identity/domain/value-objects/role-id.vo'
import { Permission } from '@/modules/identity/domain/entities/permission.entity'
import { PermissionId } from '@/modules/identity/domain/value-objects/permission-id.vo'
import { Result } from '@/lib/result/result'
import { ValidationError } from '@/modules/common/errors/domain/validation.error'
import { NotFoundError } from '@/modules/common/errors/not-found.error'
import { ConflictError } from '@/modules/common/errors/conflict.error'
import { ForbiddenError } from '@/modules/common/errors/forbidden.error'

describe('UpdateRoleUseCase', () => {
  let useCase: UpdateRoleUseCase
  let mockRoleRepository: IRoleRepository
  let mockPermissionRepository: IPermissionRepository

  const createRole = (isSystem = false): Role => {
    return Role.reconstitute({
      id: RoleId.create(),
      name: 'SUPPORT',
      description: 'Support role',
      isSystem,
      permissionIds: [PermissionId.create()],
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z')
    })
  }

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

    useCase = new UpdateRoleUseCase(mockRoleRepository, mockPermissionRepository)
  })

  it('should fail when role ID is invalid', async () => {
    const result = await useCase.execute('invalid-id', { name: 'NEW_ROLE' })

    expect(result.isSuccess()).toBe(false)
    expect(result.error).toBeInstanceOf(ValidationError)
    expect((result.error as ValidationError).field).toBe('roleId')
  })

  it('should return NotFoundError when role does not exist', async () => {
    const roleId = RoleId.create().getValue()
    vi.mocked(mockRoleRepository.findById).mockResolvedValue(Result.ok(null))

    const result = await useCase.execute(roleId, { name: 'NEW_ROLE' })

    expect(result.isSuccess()).toBe(false)
    expect(result.error).toBeInstanceOf(NotFoundError)
  })

  it('should return ForbiddenError when role is system', async () => {
    const role = createRole(true)
    vi.mocked(mockRoleRepository.findById).mockResolvedValue(Result.ok(role))

    const result = await useCase.execute(role.id.getValue(), { description: 'Updated' })

    expect(result.isSuccess()).toBe(false)
    expect(result.error).toBeInstanceOf(ForbiddenError)
  })

  it('should return ConflictError when name already exists', async () => {
    const role = createRole(false)
    vi.mocked(mockRoleRepository.findById).mockResolvedValue(Result.ok(role))
    vi.mocked(mockRoleRepository.existsByName).mockResolvedValue(Result.ok(true))

    const result = await useCase.execute(role.id.getValue(), { name: 'ADMIN' })

    expect(result.isSuccess()).toBe(false)
    expect(result.error).toBeInstanceOf(ConflictError)
  })

  it('should return NotFoundError when permission IDs are missing', async () => {
    const role = createRole(false)
    const permissionId = PermissionId.create().getValue()

    vi.mocked(mockRoleRepository.findById).mockResolvedValue(Result.ok(role))
    vi.mocked(mockPermissionRepository.findByIds).mockResolvedValue(Result.ok([]))

    const result = await useCase.execute(role.id.getValue(), { permissionIds: [permissionId] })

    expect(result.isSuccess()).toBe(false)
    expect(result.error).toBeInstanceOf(NotFoundError)
  })

  it('should update role when input is valid', async () => {
    const role = createRole(false)
    const permission = createPermission()

    vi.mocked(mockRoleRepository.findById).mockResolvedValue(Result.ok(role))
    vi.mocked(mockRoleRepository.existsByName).mockResolvedValue(Result.ok(false))
    vi.mocked(mockPermissionRepository.findByIds).mockResolvedValue(Result.ok([permission]))
    vi.mocked(mockRoleRepository.update).mockResolvedValue(Result.ok(undefined))

    const result = await useCase.execute(role.id.getValue(), {
      name: 'NEW_ROLE',
      description: 'New description',
      permissionIds: [permission.id.getValue()]
    })

    expect(result.isSuccess()).toBe(true)
    expect(result.value).toMatchObject({
      name: 'NEW_ROLE',
      description: 'New description',
      permissionIds: [permission.id.getValue()]
    })
  })
})
