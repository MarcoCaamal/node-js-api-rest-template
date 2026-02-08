import { PrismaClient } from '@/generated/prisma'
import { Result } from '@/lib/result/result'
import { DatabaseError } from '@/modules/common/errors/database.error'
import { IPermissionRepository } from '@/modules/identity/domain/repositories/permission.repository.interface'
import { Permission } from '@/modules/identity/domain/entities/permission.entity'
import { PermissionId } from '@/modules/identity/domain/value-objects/permission-id.vo'

/**
 * Permission Repository Implementation (Prisma Adapter)
 *
 * Implements IPermissionRepository using Prisma ORM.
 * Handles mapping between Prisma models and domain entities.
 */
export class PermissionRepositoryImpl implements IPermissionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: PermissionId): Promise<Result<Permission | null, Error>> {
    try {
      const record = await this.prisma.permission.findUnique({
        where: { id: id.getValue() }
      })

      if (!record) {
        return Result.ok(null)
      }

      const permission = Permission.reconstitute({
        id,
        resource: record.resource,
        action: record.action,
        description: record.description,
        createdAt: record.createdAt
      })

      return Result.ok(permission)
    } catch (error) {
      return Result.fail(
        new DatabaseError('Failed to find permission by ID', {
          metadata: { operation: 'findById', id: id.getValue(), cause: error }
        })
      )
    }
  }

  async findAll(limit: number, offset: number): Promise<Result<Permission[], Error>> {
    try {
      const records = await this.prisma.permission.findMany({
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' }
      })

      const permissions = records.map((record) =>
        Permission.reconstitute({
          id: PermissionId.fromString(record.id).value,
          resource: record.resource,
          action: record.action,
          description: record.description,
          createdAt: record.createdAt
        })
      )

      return Result.ok(permissions)
    } catch (error) {
      return Result.fail(
        new DatabaseError('Failed to find permissions', {
          metadata: { operation: 'findAll', limit, offset, cause: error }
        })
      )
    }
  }

  async findByResourceAndAction(
    resource: string,
    action: string
  ): Promise<Result<Permission | null, Error>> {
    try {
      const record = await this.prisma.permission.findUnique({
        where: {
          unique_permission_code: {
            resource: resource.toLowerCase().trim(),
            action: action.toLowerCase().trim()
          }
        }
      })

      if (!record) {
        return Result.ok(null)
      }

      const idResult = PermissionId.fromString(record.id)
      if (!idResult.isSuccess()) {
        return Result.fail(idResult.error)
      }

      const permission = Permission.reconstitute({
        id: idResult.value,
        resource: record.resource,
        action: record.action,
        description: record.description,
        createdAt: record.createdAt
      })

      return Result.ok(permission)
    } catch (error) {
      return Result.fail(
        new DatabaseError('Failed to find permission by resource and action', {
          metadata: { operation: 'findByResourceAndAction', resource, action, cause: error }
        })
      )
    }
  }

  async findByIds(ids: PermissionId[]): Promise<Result<Permission[], Error>> {
    try {
      const stringIds = ids.map((id) => id.getValue())
      const records = await this.prisma.permission.findMany({
        where: { id: { in: stringIds } }
      })

      const permissions = records.map((record) => {
        const idResult = PermissionId.fromString(record.id)
        return Permission.reconstitute({
          id: idResult.value,
          resource: record.resource,
          action: record.action,
          description: record.description,
          createdAt: record.createdAt
        })
      })

      return Result.ok(permissions)
    } catch (error) {
      return Result.fail(
        new DatabaseError('Failed to find permissions by IDs', {
          metadata: { operation: 'findByIds', count: ids.length, cause: error }
        })
      )
    }
  }

  async findByResource(resource: string): Promise<Result<Permission[], Error>> {
    try {
      const records = await this.prisma.permission.findMany({
        where: { resource: resource.toLowerCase().trim() }
      })

      const permissions = records.map((record) => {
        const idResult = PermissionId.fromString(record.id)
        return Permission.reconstitute({
          id: idResult.value,
          resource: record.resource,
          action: record.action,
          description: record.description,
          createdAt: record.createdAt
        })
      })

      return Result.ok(permissions)
    } catch (error) {
      return Result.fail(
        new DatabaseError('Failed to find permissions by resource', {
          metadata: { operation: 'findByResource', resource, cause: error }
        })
      )
    }
  }

  async existsByCode(resource: string, action: string): Promise<Result<boolean, Error>> {
    try {
      const count = await this.prisma.permission.count({
        where: {
          resource: resource.toLowerCase().trim(),
          action: action.toLowerCase().trim()
        }
      })
      return Result.ok(count > 0)
    } catch (error) {
      return Result.fail(
        new DatabaseError('Failed to check permission existence by code', {
          metadata: { operation: 'existsByCode', resource, action, cause: error }
        })
      )
    }
  }

  async existsById(id: PermissionId): Promise<Result<boolean, Error>> {
    try {
      const count = await this.prisma.permission.count({
        where: { id: id.getValue() }
      })
      return Result.ok(count > 0)
    } catch (error) {
      return Result.fail(
        new DatabaseError('Failed to check permission existence by ID', {
          metadata: { operation: 'existsById', id: id.getValue(), cause: error }
        })
      )
    }
  }

  async save(permission: Permission): Promise<Result<void, Error>> {
    try {
      await this.prisma.permission.create({
        data: {
          id: permission.id.getValue(),
          resource: permission.resource,
          action: permission.action,
          description: permission.description,
          createdAt: permission.createdAt
        }
      })
      return Result.ok(undefined)
    } catch (error) {
      return Result.fail(
        new DatabaseError('Failed to save permission', {
          metadata: { operation: 'save', permissionId: permission.id.getValue(), cause: error }
        })
      )
    }
  }

  async update(permission: Permission): Promise<Result<void, Error>> {
    try {
      await this.prisma.permission.update({
        where: { id: permission.id.getValue() },
        data: {
          description: permission.description
          // resource and action are immutable
        }
      })
      return Result.ok(undefined)
    } catch (error) {
      return Result.fail(
        new DatabaseError('Failed to update permission', {
          metadata: { operation: 'update', permissionId: permission.id.getValue(), cause: error }
        })
      )
    }
  }

  async delete(id: PermissionId): Promise<Result<boolean, Error>> {
    try {
      await this.prisma.permission.delete({
        where: { id: id.getValue() }
      })
      return Result.ok(true)
    } catch (error: any) {
      // Prisma error code for record not found
      if (error.code === 'P2025') {
        return Result.ok(false)
      }
      return Result.fail(
        new DatabaseError('Failed to delete permission', {
          metadata: { operation: 'delete', id: id.getValue(), cause: error }
        })
      )
    }
  }

  async count(): Promise<Result<number, Error>> {
    try {
      const total = await this.prisma.permission.count()
      return Result.ok(total)
    } catch (error) {
      return Result.fail(
        new DatabaseError('Failed to count permissions', {
          metadata: { operation: 'count', cause: error }
        })
      )
    }
  }
}
