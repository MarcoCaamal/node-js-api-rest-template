/**
 * Identity Module — Dependency Injection Tokens
 *
 * Tokens for all dependencies that belong to the Identity module (RBAC).
 * Includes repositories, domain services, use cases, controllers, and routes.
 *
 * @example
 * ```typescript
 * import { IDENTITY_TOKENS } from '@/modules/identity/identity.tokens'
 *
 * container.register(IDENTITY_TOKENS.PermissionRepository, { useFactory: ... })
 * ```
 */
export const IDENTITY_TOKENS = {
  // ── Repositories ────────────────────────────────────────────────────
  PermissionRepository: Symbol.for('Identity.PermissionRepository'),
  RoleRepository: Symbol.for('Identity.RoleRepository'),
  UserRepository: Symbol.for('Identity.UserRepository'),

  // ── Infrastructure Services ─────────────────────────────────────────
  JwtService: Symbol.for('Identity.JwtService'),
  PasswordHashService: Symbol.for('Identity.PasswordHashService'),

  // ── Use Cases — Authorization ───────────────────────────────────────
  CheckPermissionUseCase: Symbol.for('Identity.CheckPermissionUseCase'),

  // ── Use Cases — Auth ────────────────────────────────────────────────
  RegisterUserUseCase: Symbol.for('Identity.RegisterUserUseCase'),
  LoginUserUseCase: Symbol.for('Identity.LoginUserUseCase'),

  // ── Use Cases — Users ───────────────────────────────────────────────
  GetActiveUserByIdUseCase: Symbol.for('Identity.GetActiveUserByIdUseCase'),
  ListUsersUseCase: Symbol.for('Identity.ListUsersUseCase'),
  GetUserByIdUseCase: Symbol.for('Identity.GetUserByIdUseCase'),
  CreateUserUseCase: Symbol.for('Identity.CreateUserUseCase'),
  UpdateUserUseCase: Symbol.for('Identity.UpdateUserUseCase'),
  DeleteUserUseCase: Symbol.for('Identity.DeleteUserUseCase'),

  // ── Use Cases — Permissions ─────────────────────────────────────────
  GetPermissionByIdUseCase: Symbol.for('Identity.GetPermissionByIdUseCase'),
  ListPermissionsUseCase: Symbol.for('Identity.ListPermissionsUseCase'),

  // ── Use Cases — Roles ───────────────────────────────────────────────
  ListRolesUseCase: Symbol.for('Identity.ListRolesUseCase'),
  GetRoleByIdUseCase: Symbol.for('Identity.GetRoleByIdUseCase'),
  CreateRoleUseCase: Symbol.for('Identity.CreateRoleUseCase'),
  UpdateRoleUseCase: Symbol.for('Identity.UpdateRoleUseCase'),
  DeleteRoleUseCase: Symbol.for('Identity.DeleteRoleUseCase'),

  // ── Controllers ─────────────────────────────────────────────────────
  PermissionsController: Symbol.for('Identity.PermissionsController'),
  UsersController: Symbol.for('Identity.UsersController'),
  AuthController: Symbol.for('Identity.AuthController'),
  RolesController: Symbol.for('Identity.RolesController'),

  // ── Routes ──────────────────────────────────────────────────────────
  PermissionsRoutes: Symbol.for('Identity.PermissionsRoutes'),
  UsersRoutes: Symbol.for('Identity.UsersRoutes'),
  AuthRoutes: Symbol.for('Identity.AuthRoutes'),
  RolesRoutes: Symbol.for('Identity.RolesRoutes'),

  // ── Middlewares ─────────────────────────────────────────────────────
  AuthenticationMiddleware: Symbol.for('Identity.AuthenticationMiddleware'),
  AuthorizationMiddleware: Symbol.for('Identity.AuthorizationMiddleware')
} as const
