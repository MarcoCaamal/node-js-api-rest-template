import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GetRoleByIdUseCase } from '@/modules/identity/application/roles/use-cases/get-role-by-id.use-case'
import { IRoleRepository } from '@/modules/identity/domain/repositories/role.repository.interface'
import { Role } from '@/modules/identity/domain/entities/role.entity'
import { RoleId } from '@/modules/identity/domain/value-objects/role-id.vo'
import { PermissionId } from '@/modules/identity/domain/value-objects/permission-id.vo'
import { Result } from '@/lib/result/result'
import { ValidationError } from '@/modules/common/errors/domain/validation.error'
import { DatabaseError } from '@/modules/common/errors/database.error'
import { NotFoundError } from '@/modules/common/errors/not-found.error'

describe('GetRoleByIdUseCase', () => {
  let useCase: GetRoleByIdUseCase
  let mockRoleRepository: IRoleRepository

  const createRole = (): Role => {
    return Role.reconstitute({
      id: RoleId.create(),
      name: 'ADMIN',
      description: 'Admin role',
      isSystem: false,
      permissionIds: [PermissionId.create()],
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-02T00:00:00.000Z')
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

    useCase = new GetRoleByIdUseCase(mockRoleRepository)
  })

  it('should fail when role ID is invalid', async () => {
    const result = await useCase.execute('invalid-id')

    expect(result.isSuccess()).toBe(false)
    expect(result.error).toBeInstanceOf(ValidationError)
    expect((result.error as ValidationError).field).toBe('roleId')
    expect(mockRoleRepository.findById).not.toHaveBeenCalled()
  })

  it('should fail when repository returns error', async () => {
    const roleId = RoleId.create().getValue()
    const dbError = new DatabaseError('Failed to find role by ID', {
      metadata: { operation: 'findById' }
    })

    vi.mocked(mockRoleRepository.findById).mockResolvedValue(Result.fail(dbError))

    const result = await useCase.execute(roleId)

    expect(result.isSuccess()).toBe(false)
    expect(result.error).toBe(dbError)
  })

  it('should return NotFoundError when role does not exist', async () => {
    const roleId = RoleId.create().getValue()
    vi.mocked(mockRoleRepository.findById).mockResolvedValue(Result.ok(null))

    const result = await useCase.execute(roleId)

    expect(result.isSuccess()).toBe(false)
    expect(result.error).toBeInstanceOf(NotFoundError)
  })

  it('should return role DTO when role exists', async () => {
    const role = createRole()

    vi.mocked(mockRoleRepository.findById).mockResolvedValue(Result.ok(role))

    const result = await useCase.execute(role.id.getValue())

    expect(result.isSuccess()).toBe(true)
    expect(result.value).toMatchObject({
      id: role.id.getValue(),
      name: role.name,
      description: role.description,
      isSystem: false,
      permissionIds: role.getPermissionIds().map((id) => id.getValue()),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt
    })
  })
})
