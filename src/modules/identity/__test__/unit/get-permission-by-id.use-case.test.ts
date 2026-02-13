import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GetPermissionByIdUseCase } from '@/modules/identity/application/permissions/use-cases/get-permission-by-id.use-case'
import { IPermissionRepository } from '@/modules/identity/domain/repositories/permission.repository.interface'
import { Permission } from '@/modules/identity/domain/entities/permission.entity'
import { PermissionId } from '@/modules/identity/domain/value-objects/permission-id.vo'
import { Result } from '@/lib/result/result'
import { ValidationError } from '@/modules/common/errors/domain/validation.error'
import { DatabaseError } from '@/modules/common/errors/database.error'
import { NotFoundError } from '@/modules/common/errors/not-found.error'

describe('GetPermissionByIdUseCase', () => {
  let useCase: GetPermissionByIdUseCase
  let mockPermissionRepository: IPermissionRepository

  const createTestPermission = (
    resource: string,
    action: string,
    description: string
  ): Permission => {
    return Permission.reconstitute({
      id: PermissionId.create(),
      resource,
      action,
      description,
      createdAt: new Date('2024-01-01T00:00:00.000Z')
    })
  }

  beforeEach(() => {
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

    useCase = new GetPermissionByIdUseCase(mockPermissionRepository)
  })

  it('should fail when permission ID is invalid', async () => {
    const result = await useCase.execute('invalid-id')

    expect(result.isSuccess()).toBe(false)
    expect(result.error).toBeInstanceOf(ValidationError)
    expect((result.error as ValidationError).field).toBe('permissionId')
    expect(mockPermissionRepository.findById).not.toHaveBeenCalled()
  })

  it('should fail when repository throws error', async () => {
    const permissionId = PermissionId.create().getValue()
    const dbError = new DatabaseError('Failed to find permission by ID', {
      metadata: { operation: 'findById' }
    })

    vi.mocked(mockPermissionRepository.findById).mockResolvedValue(Result.fail(dbError))

    const result = await useCase.execute(permissionId)

    expect(result.isSuccess()).toBe(false)
    expect(result.error).toBe(dbError)
  })

  it('should return NotFoundError when permission does not exist', async () => {
    const permissionId = PermissionId.create().getValue()

    vi.mocked(mockPermissionRepository.findById).mockResolvedValue(Result.ok(null))

    const result = await useCase.execute(permissionId)

    expect(result.isSuccess()).toBe(false)
    expect(result.error).toBeInstanceOf(NotFoundError)
  })

  it('should return permission DTO when permission exists', async () => {
    const permission = createTestPermission('users', 'read', 'Read users')

    vi.mocked(mockPermissionRepository.findById).mockResolvedValue(Result.ok(permission))

    const result = await useCase.execute(permission.id.getValue())

    expect(result.isSuccess()).toBe(true)

    const dto = result.value
    expect(dto).toMatchObject({
      id: permission.id.getValue(),
      resource: 'users',
      action: 'read',
      description: 'Read users',
      createdAt: permission.createdAt
    })
  })
})
