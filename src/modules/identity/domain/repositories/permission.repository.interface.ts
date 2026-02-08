import { Result } from '@/lib/result/result'
import { Permission } from '../entities/permission.entity'
import { PermissionId } from '../value-objects/permission-id.vo'

/**
 * Permission Repository Interface (Port)
 *
 * Defines the contract for Permission persistence operations.
 * Implementation will be in the infrastructure layer (Prisma adapter).
 *
 * Repository responsibilities:
 * - CRUD operations for Permission entities
 * - Ensure permission code (resource:action) uniqueness
 * - Efficient permission lookups for authorization
 */
export interface IPermissionRepository {
  /**
   * Finds a permission by its ID
   * @returns Permission if found, null if not found
   */
  findById(id: PermissionId): Promise<Result<Permission | null, Error>>

  /**
   * Finds all permissions with pagination
   * @param limit - Maximum number of permissions to return
   * @param offset - Number of permissions to skip
   */
  findAll(limit: number, offset: number): Promise<Result<Permission[], Error>>

  /**
   * Finds a permission by resource and action
   * @returns Permission if found, null if not found
   */
  findByResourceAndAction(
    resource: string,
    action: string
  ): Promise<Result<Permission | null, Error>>

  /**
   * Finds permissions by their IDs (bulk fetch)
   */
  findByIds(ids: PermissionId[]): Promise<Result<Permission[], Error>>

  /**
   * Finds all permissions for a given resource
   * @example findByResource('users') -> [users:create, users:read, users:update, users:delete]
   */
  findByResource(resource: string): Promise<Result<Permission[], Error>>

  /**
   * Checks if a permission with the given resource:action code exists
   */
  existsByCode(resource: string, action: string): Promise<Result<boolean, Error>>

  /**
   * Checks if a permission with the given ID exists
   */
  existsById(id: PermissionId): Promise<Result<boolean, Error>>

  /**
   * Saves a new permission
   * @throws Error if permission code already exists
   */
  save(permission: Permission): Promise<Result<void, Error>>

  /**
   * Updates an existing permission
   * @throws Error if permission not found
   */
  update(permission: Permission): Promise<Result<void, Error>>

  /**
   * Deletes a permission by its ID
   * @returns true if deleted, false if not found
   */
  delete(id: PermissionId): Promise<Result<boolean, Error>>

  /**
   * Counts total number of permissions
   */
  count(): Promise<Result<number, Error>>
}
