import { PrismaClient } from '@/generated/prisma/client'
import { Result } from '@/lib/result/result'
import { DatabaseError } from '@/modules/common/errors/database.error'
import { IRoleRepository } from '@/modules/identity/domain/repositories/role.repository.interface'
import { Role } from '@/modules/identity/domain/entities/role.entity'
import { RoleId } from '@/modules/identity/domain/value-objects/role-id.vo'
import { PermissionId } from '@/modules/identity/domain/value-objects/permission-id.vo'

export class RoleRepositoryImpl implements IRoleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: RoleId): Promise<Result<Role | null, Error>> {
    try {
      const record = await this.prisma.role.findUnique({
        where: { id: id.getValue() },
        include: { permissions: true }
      })

      if (!record) {
        return Result.ok(null)
      }

      const role = this.mapRole(record)
      return Result.ok(role)
    } catch (error) {
      return Result.fail(
        new DatabaseError('Failed to find role by ID', {
          metadata: { operation: 'findById', id: id.getValue(), cause: error }
        })
      )
    }
  }

  async findByName(name: string): Promise<Result<Role | null, Error>> {
    try {
      const record = await this.prisma.role.findUnique({
        where: { name: name.toUpperCase().trim() },
        include: { permissions: true }
      })

      if (!record) {
        return Result.ok(null)
      }

      const role = this.mapRole(record)
      return Result.ok(role)
    } catch (error) {
      return Result.fail(
        new DatabaseError('Failed to find role by name', {
          metadata: { operation: 'findByName', name, cause: error }
        })
      )
    }
  }

  async findAll(limit: number, offset: number): Promise<Result<Role[], Error>> {
    try {
      const records = await this.prisma.role.findMany({
        take: limit,
        skip: offset,
        include: { permissions: true },
        orderBy: { createdAt: 'desc' }
      })

      const roles = records.map((record) => this.mapRole(record))
      return Result.ok(roles)
    } catch (error) {
      return Result.fail(
        new DatabaseError('Failed to find roles', {
          metadata: { operation: 'findAll', limit, offset, cause: error }
        })
      )
    }
  }

  async findByIds(ids: RoleId[]): Promise<Result<Role[], Error>> {
    try {
      const stringIds = ids.map((id) => id.getValue())
      const records = await this.prisma.role.findMany({
        where: { id: { in: stringIds } },
        include: { permissions: true }
      })

      const roles = records.map((record) => this.mapRole(record))
      return Result.ok(roles)
    } catch (error) {
      return Result.fail(
        new DatabaseError('Failed to find roles by IDs', {
          metadata: { operation: 'findByIds', count: ids.length, cause: error }
        })
      )
    }
  }

  async existsByName(name: string): Promise<Result<boolean, Error>> {
    try {
      const count = await this.prisma.role.count({
        where: { name: name.toUpperCase().trim() }
      })

      return Result.ok(count > 0)
    } catch (error) {
      return Result.fail(
        new DatabaseError('Failed to check role existence by name', {
          metadata: { operation: 'existsByName', name, cause: error }
        })
      )
    }
  }

  async existsById(id: RoleId): Promise<Result<boolean, Error>> {
    try {
      const count = await this.prisma.role.count({
        where: { id: id.getValue() }
      })

      return Result.ok(count > 0)
    } catch (error) {
      return Result.fail(
        new DatabaseError('Failed to check role existence by ID', {
          metadata: { operation: 'existsById', id: id.getValue(), cause: error }
        })
      )
    }
  }

  async save(role: Role): Promise<Result<void, Error>> {
    try {
      const permissionIds = role.getPermissionIds().map((permissionId) => ({
        id: permissionId.getValue()
      }))

      await this.prisma.role.create({
        data: {
          id: role.id.getValue(),
          name: role.name,
          description: role.description,
          isSystem: role.isSystem,
          permissions: permissionIds.length ? { connect: permissionIds } : undefined,
          createdAt: role.createdAt,
          updatedAt: role.updatedAt
        }
      })

      return Result.ok(undefined)
    } catch (error) {
      return Result.fail(
        new DatabaseError('Failed to save role', {
          metadata: { operation: 'save', roleId: role.id.getValue(), cause: error }
        })
      )
    }
  }

  async update(role: Role): Promise<Result<void, Error>> {
    try {
      const permissionIds = role.getPermissionIds().map((permissionId) => ({
        id: permissionId.getValue()
      }))

      await this.prisma.role.update({
        where: { id: role.id.getValue() },
        data: {
          name: role.name,
          description: role.description,
          permissions: { set: permissionIds },
          updatedAt: role.updatedAt
        }
      })

      return Result.ok(undefined)
    } catch (error) {
      return Result.fail(
        new DatabaseError('Failed to update role', {
          metadata: { operation: 'update', roleId: role.id.getValue(), cause: error }
        })
      )
    }
  }

  async delete(id: RoleId): Promise<Result<boolean, Error>> {
    try {
      await this.prisma.role.delete({
        where: { id: id.getValue() }
      })

      return Result.ok(true)
    } catch (error) {
      if (this.isRecordNotFoundError(error)) {
        return Result.ok(false)
      }

      return Result.fail(
        new DatabaseError('Failed to delete role', {
          metadata: { operation: 'delete', id: id.getValue(), cause: error }
        })
      )
    }
  }

  async count(): Promise<Result<number, Error>> {
    try {
      const total = await this.prisma.role.count()
      return Result.ok(total)
    } catch (error) {
      return Result.fail(
        new DatabaseError('Failed to count roles', {
          metadata: { operation: 'count', cause: error }
        })
      )
    }
  }

  private mapRole(record: {
    id: string
    name: string
    description: string
    isSystem: boolean
    permissions: { id: string }[]
    createdAt: Date
    updatedAt: Date
  }): Role {
    const roleId = RoleId.fromString(record.id).value
    const permissionIds = record.permissions.map(
      (permission) => PermissionId.fromString(permission.id).value
    )

    return Role.reconstitute({
      id: roleId,
      name: record.name,
      description: record.description,
      isSystem: record.isSystem,
      permissionIds,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    })
  }

  private isRecordNotFoundError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2025'
    )
  }
}
