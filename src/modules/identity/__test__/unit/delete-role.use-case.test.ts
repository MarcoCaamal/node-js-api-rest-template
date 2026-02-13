import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DeleteRoleUseCase } from '@/modules/identity/application/roles/use-cases/delete-role.use-case'
import { IRoleRepository } from '@/modules/identity/domain/repositories/role.repository.interface'
import { Role } from '@/modules/identity/domain/entities/role.entity'
import { RoleId } from '@/modules/identity/domain/value-objects/role-id.vo'
import { PermissionId } from '@/modules/identity/domain/value-objects/permission-id.vo'
import { Result } from '@/lib/result/result'
import { ValidationError } from '@/modules/common/errors/domain/validation.error'
import { NotFoundError } from '@/modules/common/errors/not-found.error'
import { ForbiddenError } from '@/modules/common/errors/forbidden.error'

describe('DeleteRoleUseCase', () => {
  let useCase: DeleteRoleUseCase
  let mockRoleRepository: IRoleRepository

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

    useCase = new DeleteRoleUseCase(mockRoleRepository)
  })

  it('should fail when role ID is invalid', async () => {
    const result = await useCase.execute('invalid-id')

    expect(result.isSuccess()).toBe(false)
    expect(result.error).toBeInstanceOf(ValidationError)
    expect((result.error as ValidationError).field).toBe('roleId')
    expect(mockRoleRepository.delete).not.toHaveBeenCalled()
  })

  it('should return NotFoundError when role does not exist', async () => {
    const roleId = RoleId.create().getValue()
    vi.mocked(mockRoleRepository.findById).mockResolvedValue(Result.ok(null))

    const result = await useCase.execute(roleId)

    expect(result.isSuccess()).toBe(false)
    expect(result.error).toBeInstanceOf(NotFoundError)
  })

  it('should return ForbiddenError when role is system', async () => {
    const role = createRole(true)
    vi.mocked(mockRoleRepository.findById).mockResolvedValue(Result.ok(role))

    const result = await useCase.execute(role.id.getValue())

    expect(result.isSuccess()).toBe(false)
    expect(result.error).toBeInstanceOf(ForbiddenError)
  })

  it('should succeed when role is deleted', async () => {
    const role = createRole(false)
    vi.mocked(mockRoleRepository.findById).mockResolvedValue(Result.ok(role))
    vi.mocked(mockRoleRepository.delete).mockResolvedValue(Result.ok(true))

    const result = await useCase.execute(role.id.getValue())

    expect(result.isSuccess()).toBe(true)
  })
})
