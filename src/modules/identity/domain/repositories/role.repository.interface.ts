import { Result } from '@/lib/result/result'
import { Role } from '../entities/role.entity'
import { RoleId } from '../value-objects/role-id.vo'

/**
 * Role Repository Interface (Port)
 *
 * Defines the contract for Role persistence operations.
 * Implementation will be in the infrastructure layer (Prisma adapter).
 *
 * Repository responsibilities:
 * - CRUD operations for Role entities
 * - Ensure role name uniqueness
 * - Fetch roles with their permission associations
 */
export interface IRoleRepository {
  /**
   * Finds a role by its ID
   * @returns Role if found, null if not found
   */
  findById(id: RoleId): Promise<Result<Role | null, Error>>

  /**
   * Finds a role by its name
   * @returns Role if found, null if not found
   */
  findByName(name: string): Promise<Result<Role | null, Error>>

  /**
   * Finds all roles with pagination
   * @param limit - Maximum number of roles to return
   * @param offset - Number of roles to skip
   */
  findAll(limit: number, offset: number): Promise<Result<Role[], Error>>

  /**
   * Finds roles by their IDs (bulk fetch)
   */
  findByIds(ids: RoleId[]): Promise<Result<Role[], Error>>

  /**
   * Checks if a role with the given name exists
   */
  existsByName(name: string): Promise<Result<boolean, Error>>

  /**
   * Checks if a role with the given ID exists
   */
  existsById(id: RoleId): Promise<Result<boolean, Error>>

  /**
   * Saves a new role
   * @throws Error if name already exists
   */
  save(role: Role): Promise<Result<void, Error>>

  /**
   * Updates an existing role
   * @throws Error if role not found or name conflict
   */
  update(role: Role): Promise<Result<void, Error>>

  /**
   * Deletes a role by its ID
   * @returns true if deleted, false if not found
   */
  delete(id: RoleId): Promise<Result<boolean, Error>>

  /**
   * Counts total number of roles
   */
  count(): Promise<Result<number, Error>>
}
