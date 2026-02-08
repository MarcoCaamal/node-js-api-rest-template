import { Result } from '@/lib/result/result'
import { IUserRepository } from '../repositories/user.repository.interface'
import { IRoleRepository } from '../repositories/role.repository.interface'
import { IPermissionRepository } from '../repositories/permission.repository.interface'
import { UserId } from '../value-objects/user-id.vo'
import { Permission } from '../entities/permission.entity'
import { NotFoundError } from '@/modules/common/errors/not-found.error'

/**
 * Authorization Service (Domain Service)
 *
 * Orchestrates authorization logic across User, Role, and Permission entities.
 * This is a domain service because the logic involves multiple aggregates.
 *
 * Responsibilities:
 * - Check if a user has a specific permission
 * - Check if a user has a specific role
 * - Get all permissions for a user (through their role)
 * - Evaluate permission grants (including wildcard support)
 *
 * Note: This is a pure domain service - no infrastructure dependencies.
 * Repositories are injected as interfaces (ports).
 */
export class AuthorizationService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly roleRepository: IRoleRepository,
    private readonly permissionRepository: IPermissionRepository
  ) {}

  /**
   * Checks if a user has permission to perform an action on a resource
   *
   * Process:
   * 1. Fetch user by ID
   * 2. Check if user is active
   * 3. Fetch user's role
   * 4. Get all permission IDs from the role
   * 5. Fetch all permissions
   * 6. Check if any permission grants access (including wildcards)
   *
   * @param userId - The user ID
   * @param resource - The resource (e.g., 'users', 'roles')
   * @param action - The action (e.g., 'create', 'read', 'update', 'delete')
   * @returns true if user has permission, false otherwise
   */
  async userHasPermission(
    userId: UserId,
    resource: string,
    action: string
  ): Promise<Result<boolean, Error>> {
    // 1. Fetch user
    const userResult = await this.userRepository.findById(userId)
    if (!userResult.isSuccess()) {
      return Result.fail(userResult.error)
    }

    const user = userResult.value
    if (!user) {
      return Result.fail(
        new NotFoundError('User', userId.getValue(), {
          aggregateType: 'User',
          aggregateId: userId.getValue()
        })
      )
    }

    // 2. Inactive users have no permissions
    if (!user.isActive) {
      return Result.ok(false)
    }

    // 3. Fetch user's role
    const roleResult = await this.roleRepository.findById(user.getRoleId())
    if (!roleResult.isSuccess()) {
      return Result.fail(roleResult.error)
    }

    const role = roleResult.value
    if (!role) {
      return Result.fail(
        new NotFoundError('Role', user.getRoleId().getValue(), {
          aggregateType: 'Role',
          aggregateId: user.getRoleId().getValue()
        })
      )
    }

    // 4. Get all permission IDs from the role
    const permissionIds = role.getPermissionIds()

    if (permissionIds.length === 0) {
      return Result.ok(false)
    }

    // 5. Fetch all permissions
    const permissionsResult = await this.permissionRepository.findByIds(permissionIds)
    if (!permissionsResult.isSuccess()) {
      return Result.fail(permissionsResult.error)
    }

    // 6. Check if any permission grants access (including wildcards)
    const hasPermission = permissionsResult.value.some((permission) =>
      permission.grants(resource, action)
    )

    return Result.ok(hasPermission)
  }

  /**
   * Checks if a user has a specific role by name
   *
   * @param userId - The user ID
   * @param roleName - The role name (e.g., 'ADMIN', 'USER')
   * @returns true if user has role, false otherwise
   */
  async userHasRole(userId: UserId, roleName: string): Promise<Result<boolean, Error>> {
    // Fetch user
    const userResult = await this.userRepository.findById(userId)
    if (!userResult.isSuccess()) {
      return Result.fail(userResult.error)
    }

    const user = userResult.value
    if (!user) {
      return Result.fail(
        new NotFoundError('User', userId.getValue(), {
          aggregateType: 'User',
          aggregateId: userId.getValue()
        })
      )
    }

    // Fetch user's role
    const roleResult = await this.roleRepository.findById(user.getRoleId())
    if (!roleResult.isSuccess()) {
      return Result.fail(roleResult.error)
    }

    const role = roleResult.value
    if (!role) {
      return Result.ok(false)
    }

    // Check if role name matches
    const hasRole = role.name.toUpperCase() === roleName.toUpperCase()
    return Result.ok(hasRole)
  }

  /**
   * Gets all permissions for a user (through their role)
   *
   * @param userId - The user ID
   * @returns Array of permissions
   */
  async getUserPermissions(userId: UserId): Promise<Result<Permission[], Error>> {
    // Fetch user
    const userResult = await this.userRepository.findById(userId)
    if (!userResult.isSuccess()) {
      return Result.fail(userResult.error)
    }

    const user = userResult.value
    if (!user) {
      return Result.fail(
        new NotFoundError('User', userId.getValue(), {
          aggregateType: 'User',
          aggregateId: userId.getValue()
        })
      )
    }

    // Inactive users have no permissions
    if (!user.isActive) {
      return Result.ok([])
    }

    // Fetch user's role
    const roleResult = await this.roleRepository.findById(user.getRoleId())
    if (!roleResult.isSuccess()) {
      return Result.fail(roleResult.error)
    }

    const role = roleResult.value
    if (!role) {
      return Result.ok([])
    }

    // Get permission IDs from the role
    const permissionIds = role.getPermissionIds()

    if (permissionIds.length === 0) {
      return Result.ok([])
    }

    // Fetch all permissions
    const permissionsResult = await this.permissionRepository.findByIds(permissionIds)
    if (!permissionsResult.isSuccess()) {
      return Result.fail(permissionsResult.error)
    }

    return Result.ok(permissionsResult.value)
  }
}
