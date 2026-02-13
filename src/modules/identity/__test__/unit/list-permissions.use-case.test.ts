import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ListPermissionsUseCase } from '@/modules/identity/application/permissions/use-cases/list-permissions.use-case'
import { IPermissionRepository } from '@/modules/identity/domain/repositories/permission.repository.interface'
import { Permission } from '@/modules/identity/domain/entities/permission.entity'
import { PermissionId } from '@/modules/identity/domain/value-objects/permission-id.vo'
import { Result } from '@/lib/result/result'
import { DatabaseError } from '@/modules/common/errors/database.error'
import { ValidationError } from '@/modules/common/errors/domain/validation.error'

describe('ListPermissionsUseCase', () => {
  let useCase: ListPermissionsUseCase
  let mockPermissionRepository: IPermissionRepository

  // Helper to create test permissions
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
    // Create fresh mock repository for each test
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

    useCase = new ListPermissionsUseCase(mockPermissionRepository)
  })

  describe('execute', () => {
    it('should return paginated permissions with default parameters', async () => {
      // Arrange
      const testPermissions = [
        createTestPermission('users', 'create', 'Create users'),
        createTestPermission('users', 'read', 'Read users'),
        createTestPermission('users', 'update', 'Update users')
      ]

      vi.mocked(mockPermissionRepository.findAll).mockResolvedValue(Result.ok(testPermissions))
      vi.mocked(mockPermissionRepository.count).mockResolvedValue(Result.ok(3))

      // Act
      const result = await useCase.execute()

      // Assert
      expect(result.isSuccess()).toBe(true)
      expect(mockPermissionRepository.findAll).toHaveBeenCalledWith(20, 0) // default limit and offset
      expect(mockPermissionRepository.count).toHaveBeenCalledTimes(1)

      const response = result.value
      expect(response.data).toHaveLength(3)
      expect(response.pagination).toEqual({
        total: 3,
        limit: 20,
        offset: 0,
        hasMore: false,
        currentPage: 1,
        totalPages: 1
      })

      // Verify DTO mapping
      expect(response.data[0]).toMatchObject({
        id: expect.any(String),
        resource: 'users',
        action: 'create',
        description: 'Create users',
        createdAt: expect.any(Date)
      })
    })

    it('should return paginated permissions with custom parameters', async () => {
      // Arrange
      const testPermissions = [
        createTestPermission('roles', 'read', 'Read roles'),
        createTestPermission('roles', 'update', 'Update roles')
      ]

      vi.mocked(mockPermissionRepository.findAll).mockResolvedValue(Result.ok(testPermissions))
      vi.mocked(mockPermissionRepository.count).mockResolvedValue(Result.ok(10))

      // Act
      const result = await useCase.execute(2, 4)

      // Assert
      expect(result.isSuccess()).toBe(true)
      expect(mockPermissionRepository.findAll).toHaveBeenCalledWith(2, 4)

      const response = result.value
      expect(response.data).toHaveLength(2)
      expect(response.pagination).toEqual({
        total: 10,
        limit: 2,
        offset: 4,
        hasMore: true, // 4 + 2 < 10
        currentPage: 3,
        totalPages: 5
      })
    })

    it('should return empty array when no permissions exist', async () => {
      // Arrange
      vi.mocked(mockPermissionRepository.findAll).mockResolvedValue(Result.ok([]))
      vi.mocked(mockPermissionRepository.count).mockResolvedValue(Result.ok(0))

      // Act
      const result = await useCase.execute()

      // Assert
      expect(result.isSuccess()).toBe(true)

      const response = result.value
      expect(response.data).toEqual([])
      expect(response.pagination).toEqual({
        total: 0,
        limit: 20,
        offset: 0,
        hasMore: false,
        currentPage: 1,
        totalPages: 0
      })
    })

    it('should fail when limit is less than minimum', async () => {
      // Act
      const result = await useCase.execute(0, 0)

      // Assert
      expect(result.isSuccess()).toBe(false)
      expect(result.error).toBeInstanceOf(ValidationError)
      expect((result.error as ValidationError).field).toBe('limit')
      expect(mockPermissionRepository.findAll).not.toHaveBeenCalled()
      expect(mockPermissionRepository.count).not.toHaveBeenCalled()
    })

    it('should fail when limit exceeds maximum', async () => {
      // Act
      const result = await useCase.execute(101, 0)

      // Assert
      expect(result.isSuccess()).toBe(false)
      expect(result.error).toBeInstanceOf(ValidationError)
      expect((result.error as ValidationError).field).toBe('limit')
      expect(mockPermissionRepository.findAll).not.toHaveBeenCalled()
      expect(mockPermissionRepository.count).not.toHaveBeenCalled()
    })

    it('should fail when offset is negative', async () => {
      // Act
      const result = await useCase.execute(20, -1)

      // Assert
      expect(result.isSuccess()).toBe(false)
      expect(result.error).toBeInstanceOf(ValidationError)
      expect((result.error as ValidationError).field).toBe('offset')
      expect(mockPermissionRepository.findAll).not.toHaveBeenCalled()
      expect(mockPermissionRepository.count).not.toHaveBeenCalled()
    })

    it('should fail when repository findAll fails', async () => {
      // Arrange
      const dbError = new DatabaseError('Database connection failed', {
        metadata: { operation: 'findAll' }
      })

      vi.mocked(mockPermissionRepository.findAll).mockResolvedValue(Result.fail(dbError))
      vi.mocked(mockPermissionRepository.count).mockResolvedValue(Result.ok(10))

      // Act
      const result = await useCase.execute()

      // Assert
      expect(result.isSuccess()).toBe(false)
      expect(result.error).toBe(dbError)
      expect(result.error.message).toBe('Database connection failed')
    })

    it('should fail when repository count fails', async () => {
      // Arrange
      const testPermissions = [createTestPermission('users', 'read', 'Read users')]
      const dbError = new DatabaseError('Failed to count permissions', {
        metadata: { operation: 'count' }
      })

      vi.mocked(mockPermissionRepository.findAll).mockResolvedValue(Result.ok(testPermissions))
      vi.mocked(mockPermissionRepository.count).mockResolvedValue(Result.fail(dbError))

      // Act
      const result = await useCase.execute()

      // Assert
      expect(result.isSuccess()).toBe(false)
      expect(result.error).toBe(dbError)
      expect(result.error.message).toBe('Failed to count permissions')
    })

    it('should handle large datasets with correct pagination', async () => {
      // Arrange
      const testPermissions = Array.from({ length: 50 }, (_, i) =>
        createTestPermission('resource', `action${i}`, `Description ${i}`)
      )

      vi.mocked(mockPermissionRepository.findAll).mockResolvedValue(Result.ok(testPermissions))
      vi.mocked(mockPermissionRepository.count).mockResolvedValue(Result.ok(500))

      // Act
      const result = await useCase.execute(50, 100)

      // Assert
      expect(result.isSuccess()).toBe(true)

      const response = result.value
      expect(response.data).toHaveLength(50)
      expect(response.pagination).toEqual({
        total: 500,
        limit: 50,
        offset: 100,
        hasMore: true, // 100 + 50 < 500
        currentPage: 3,
        totalPages: 10
      })
    })
  })
})
