import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ListRolesUseCase } from '@/modules/identity/application/roles/use-cases/list-roles.use-case'
import { IRoleRepository } from '@/modules/identity/domain/repositories/role.repository.interface'
import { Role } from '@/modules/identity/domain/entities/role.entity'
import { RoleId } from '@/modules/identity/domain/value-objects/role-id.vo'
import { PermissionId } from '@/modules/identity/domain/value-objects/permission-id.vo'
import { Result } from '@/lib/result/result'
import { ValidationError } from '@/modules/common/errors/domain/validation.error'
import { DatabaseError } from '@/modules/common/errors/database.error'

describe('ListRolesUseCase', () => {
  let useCase: ListRolesUseCase
  let mockRoleRepository: IRoleRepository

  const createRole = (name: string, description: string): Role => {
    return Role.reconstitute({
      id: RoleId.create(),
      name,
      description,
      isSystem: false,
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

    useCase = new ListRolesUseCase(mockRoleRepository)
  })

  it('should return paginated roles with default parameters', async () => {
    const roles = [createRole('ADMIN', 'Admin role'), createRole('USER', 'User role')]

    vi.mocked(mockRoleRepository.findAll).mockResolvedValue(Result.ok(roles))
    vi.mocked(mockRoleRepository.count).mockResolvedValue(Result.ok(2))

    const result = await useCase.execute()

    expect(result.isSuccess()).toBe(true)
    expect(mockRoleRepository.findAll).toHaveBeenCalledWith(20, 0)
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

  it('should return empty array when no roles exist', async () => {
    vi.mocked(mockRoleRepository.findAll).mockResolvedValue(Result.ok([]))
    vi.mocked(mockRoleRepository.count).mockResolvedValue(Result.ok(0))

    const result = await useCase.execute()

    expect(result.isSuccess()).toBe(true)
    expect(result.value.data).toEqual([])
    expect(result.value.pagination.total).toBe(0)
  })

  it('should fail when limit is invalid', async () => {
    const result = await useCase.execute(0, 0)

    expect(result.isSuccess()).toBe(false)
    expect(result.error).toBeInstanceOf(ValidationError)
    expect((result.error as ValidationError).field).toBe('limit')
  })

  it('should fail when offset is invalid', async () => {
    const result = await useCase.execute(20, -1)

    expect(result.isSuccess()).toBe(false)
    expect(result.error).toBeInstanceOf(ValidationError)
    expect((result.error as ValidationError).field).toBe('offset')
  })

  it('should fail when repository findAll fails', async () => {
    const dbError = new DatabaseError('Failed to list roles', {
      metadata: { operation: 'findAll' }
    })

    vi.mocked(mockRoleRepository.findAll).mockResolvedValue(Result.fail(dbError))
    vi.mocked(mockRoleRepository.count).mockResolvedValue(Result.ok(10))

    const result = await useCase.execute()

    expect(result.isSuccess()).toBe(false)
    expect(result.error).toBe(dbError)
  })

  it('should fail when repository count fails', async () => {
    const roles = [createRole('ADMIN', 'Admin role')]
    const dbError = new DatabaseError('Failed to count roles', {
      metadata: { operation: 'count' }
    })

    vi.mocked(mockRoleRepository.findAll).mockResolvedValue(Result.ok(roles))
    vi.mocked(mockRoleRepository.count).mockResolvedValue(Result.fail(dbError))

    const result = await useCase.execute()

    expect(result.isSuccess()).toBe(false)
    expect(result.error).toBe(dbError)
  })
})
