import { DependencyContainer } from 'tsyringe'
import { PrismaClient } from '@/generated/prisma/client'
import { TOKENS } from '@/config/tokens'
import { Config } from '@/config'
import { IDENTITY_TOKENS } from './identity.tokens'

// Domain — Repository interfaces
import { IPermissionRepository } from './domain/repositories/permission.repository.interface'
import { IUserRepository } from './domain/repositories/user.repository.interface'
import { IRoleRepository } from './domain/repositories/role.repository.interface'

// Application — Use Cases
import { GetPermissionByIdUseCase } from './application/permissions/use-cases/get-permission-by-id.use-case'
import { ListPermissionsUseCase } from './application/permissions/use-cases/list-permissions.use-case'
import { CheckPermissionUseCase } from './application/authorization/use-cases/check-permission.use-case'
import { GetActiveUserByIdUseCase } from './application/users/use-cases/get-active-user-by-id.use-case'
import { ListUsersUseCase } from './application/users/use-cases/list-users.use-case'
import { GetUserByIdUseCase } from './application/users/use-cases/get-user-by-id.use-case'
import { CreateUserUseCase } from './application/users/use-cases/create-user.use-case'
import { UpdateUserUseCase } from './application/users/use-cases/update-user.use-case'
import { DeleteUserUseCase } from './application/users/use-cases/delete-user.use-case'
import { ListRolesUseCase } from './application/roles/use-cases/list-roles.use-case'
import { GetRoleByIdUseCase } from './application/roles/use-cases/get-role-by-id.use-case'
import { CreateRoleUseCase } from './application/roles/use-cases/create-role.use-case'
import { UpdateRoleUseCase } from './application/roles/use-cases/update-role.use-case'
import { DeleteRoleUseCase } from './application/roles/use-cases/delete-role.use-case'
import { RegisterUserUseCase } from './application/auth/use-cases/register-user.use-case'
import { LoginUserUseCase } from './application/auth/use-cases/login-user.use-case'

// Application — Services
import { IJwtService } from './application/services/jwt.service.interface'
import { IPasswordHashService } from './application/services/password-hash.service.interface'

// Infrastructure — Persistence
import { PermissionRepositoryImpl } from './infrastructure/persistence/prisma/permission.repository.impl'
import { UserRepositoryImpl } from './infrastructure/persistence/prisma/user.repository.impl'
import { RoleRepositoryImpl } from './infrastructure/persistence/prisma/role.repository.impl'

// Infrastructure — Services
import { JwtService } from './infrastructure/services/jwt.service'
import { BcryptPasswordHashService } from './infrastructure/services/bcrypt-password-hash.service'

// Infrastructure — HTTP
import { PermissionsController } from './infrastructure/http/controllers/permissions.controller'
import { AuthController } from './infrastructure/http/controllers/auth.controller'
import { UsersController } from './infrastructure/http/controllers/users.controller'
import { RolesController } from './infrastructure/http/controllers/roles.controller'
import { PermissionsRoutes } from './infrastructure/http/routes/permissions.routes'
import { AuthRoutes } from './infrastructure/http/routes/auth.routes'
import { UsersRoutes } from './infrastructure/http/routes/users.routes'
import { RolesRoutes } from './infrastructure/http/routes/roles.routes'
import { AuthenticationMiddleware } from './infrastructure/http/middleware/authentication.middleware'
import { AuthorizationMiddleware } from './infrastructure/http/middleware/authorization.middleware'

/**
 * Identity Module — Dependency Registration
 *
 * Registers all dependencies that belong to the Identity module (RBAC):
 * - Repositories (infrastructure implementations)
 * - Use Cases (application layer)
 * - Controllers (HTTP layer)
 * - Routes (HTTP layer)
 *
 * Called from the Composition Root (config/container.ts).
 * Uses tsyringe's factory providers (no decorators).
 */
export function registerIdentityModule(container: DependencyContainer): void {
  // ── Repositories ──────────────────────────────────────────────────────
  container.register<IPermissionRepository>(IDENTITY_TOKENS.PermissionRepository, {
    useFactory: (c) => {
      const prisma = c.resolve<PrismaClient>(TOKENS.PrismaClient)
      return new PermissionRepositoryImpl(prisma)
    }
  })

  container.register<IUserRepository>(IDENTITY_TOKENS.UserRepository, {
    useFactory: (c) => {
      const prisma = c.resolve<PrismaClient>(TOKENS.PrismaClient)
      return new UserRepositoryImpl(prisma)
    }
  })

  container.register<IRoleRepository>(IDENTITY_TOKENS.RoleRepository, {
    useFactory: (c) => {
      const prisma = c.resolve<PrismaClient>(TOKENS.PrismaClient)
      return new RoleRepositoryImpl(prisma)
    }
  })

  // ── Infrastructure Services ─────────────────────────────────────────
  container.register<IJwtService>(IDENTITY_TOKENS.JwtService, {
    useFactory: (c) => {
      const config = c.resolve<Config>(TOKENS.Config)
      return new JwtService(config.jwtSecret, config.jwtExpiresIn)
    }
  })

  container.register<IPasswordHashService>(IDENTITY_TOKENS.PasswordHashService, {
    useFactory: (c) => {
      const config = c.resolve<Config>(TOKENS.Config)
      return new BcryptPasswordHashService(config.bcryptSaltRounds)
    }
  })

  // ── Use Cases — Authorization ───────────────────────────────────────
  container.register<CheckPermissionUseCase>(IDENTITY_TOKENS.CheckPermissionUseCase, {
    useFactory: (c) => {
      const userRepository = c.resolve<IUserRepository>(IDENTITY_TOKENS.UserRepository)
      const roleRepository = c.resolve<IRoleRepository>(IDENTITY_TOKENS.RoleRepository)
      const permissionRepository = c.resolve<IPermissionRepository>(
        IDENTITY_TOKENS.PermissionRepository
      )

      return new CheckPermissionUseCase(userRepository, roleRepository, permissionRepository)
    }
  })

  // ── Use Cases — Users ───────────────────────────────────────────────
  container.register<GetActiveUserByIdUseCase>(IDENTITY_TOKENS.GetActiveUserByIdUseCase, {
    useFactory: (c) => {
      const userRepository = c.resolve<IUserRepository>(IDENTITY_TOKENS.UserRepository)
      return new GetActiveUserByIdUseCase(userRepository)
    }
  })

  container.register<ListUsersUseCase>(IDENTITY_TOKENS.ListUsersUseCase, {
    useFactory: (c) => {
      const userRepository = c.resolve<IUserRepository>(IDENTITY_TOKENS.UserRepository)
      return new ListUsersUseCase(userRepository)
    }
  })

  container.register<GetUserByIdUseCase>(IDENTITY_TOKENS.GetUserByIdUseCase, {
    useFactory: (c) => {
      const userRepository = c.resolve<IUserRepository>(IDENTITY_TOKENS.UserRepository)
      return new GetUserByIdUseCase(userRepository)
    }
  })

  container.register<CreateUserUseCase>(IDENTITY_TOKENS.CreateUserUseCase, {
    useFactory: (c) => {
      const userRepository = c.resolve<IUserRepository>(IDENTITY_TOKENS.UserRepository)
      const roleRepository = c.resolve<IRoleRepository>(IDENTITY_TOKENS.RoleRepository)
      const passwordHashService = c.resolve<IPasswordHashService>(
        IDENTITY_TOKENS.PasswordHashService
      )
      return new CreateUserUseCase(userRepository, roleRepository, passwordHashService)
    }
  })

  container.register<UpdateUserUseCase>(IDENTITY_TOKENS.UpdateUserUseCase, {
    useFactory: (c) => {
      const userRepository = c.resolve<IUserRepository>(IDENTITY_TOKENS.UserRepository)
      const roleRepository = c.resolve<IRoleRepository>(IDENTITY_TOKENS.RoleRepository)
      const passwordHashService = c.resolve<IPasswordHashService>(
        IDENTITY_TOKENS.PasswordHashService
      )
      return new UpdateUserUseCase(userRepository, roleRepository, passwordHashService)
    }
  })

  container.register<DeleteUserUseCase>(IDENTITY_TOKENS.DeleteUserUseCase, {
    useFactory: (c) => {
      const userRepository = c.resolve<IUserRepository>(IDENTITY_TOKENS.UserRepository)
      return new DeleteUserUseCase(userRepository)
    }
  })

  container.register<ListRolesUseCase>(IDENTITY_TOKENS.ListRolesUseCase, {
    useFactory: (c) => {
      const roleRepository = c.resolve<IRoleRepository>(IDENTITY_TOKENS.RoleRepository)
      return new ListRolesUseCase(roleRepository)
    }
  })

  container.register<GetRoleByIdUseCase>(IDENTITY_TOKENS.GetRoleByIdUseCase, {
    useFactory: (c) => {
      const roleRepository = c.resolve<IRoleRepository>(IDENTITY_TOKENS.RoleRepository)
      return new GetRoleByIdUseCase(roleRepository)
    }
  })

  container.register<CreateRoleUseCase>(IDENTITY_TOKENS.CreateRoleUseCase, {
    useFactory: (c) => {
      const roleRepository = c.resolve<IRoleRepository>(IDENTITY_TOKENS.RoleRepository)
      const permissionRepository = c.resolve<IPermissionRepository>(
        IDENTITY_TOKENS.PermissionRepository
      )
      return new CreateRoleUseCase(roleRepository, permissionRepository)
    }
  })

  container.register<UpdateRoleUseCase>(IDENTITY_TOKENS.UpdateRoleUseCase, {
    useFactory: (c) => {
      const roleRepository = c.resolve<IRoleRepository>(IDENTITY_TOKENS.RoleRepository)
      const permissionRepository = c.resolve<IPermissionRepository>(
        IDENTITY_TOKENS.PermissionRepository
      )
      return new UpdateRoleUseCase(roleRepository, permissionRepository)
    }
  })

  container.register<DeleteRoleUseCase>(IDENTITY_TOKENS.DeleteRoleUseCase, {
    useFactory: (c) => {
      const roleRepository = c.resolve<IRoleRepository>(IDENTITY_TOKENS.RoleRepository)
      return new DeleteRoleUseCase(roleRepository)
    }
  })

  // ── Use Cases — Auth ────────────────────────────────────────────────
  container.register<RegisterUserUseCase>(IDENTITY_TOKENS.RegisterUserUseCase, {
    useFactory: (c) => {
      const userRepository = c.resolve<IUserRepository>(IDENTITY_TOKENS.UserRepository)
      const roleRepository = c.resolve<IRoleRepository>(IDENTITY_TOKENS.RoleRepository)
      const passwordHashService = c.resolve<IPasswordHashService>(
        IDENTITY_TOKENS.PasswordHashService
      )
      return new RegisterUserUseCase(userRepository, roleRepository, passwordHashService)
    }
  })

  container.register<LoginUserUseCase>(IDENTITY_TOKENS.LoginUserUseCase, {
    useFactory: (c) => {
      const userRepository = c.resolve<IUserRepository>(IDENTITY_TOKENS.UserRepository)
      const passwordHashService = c.resolve<IPasswordHashService>(
        IDENTITY_TOKENS.PasswordHashService
      )
      const jwtService = c.resolve<IJwtService>(IDENTITY_TOKENS.JwtService)
      return new LoginUserUseCase(userRepository, passwordHashService, jwtService)
    }
  })

  // ── Use Cases ─────────────────────────────────────────────────────────
  container.register<GetPermissionByIdUseCase>(IDENTITY_TOKENS.GetPermissionByIdUseCase, {
    useFactory: (c) => {
      const repo = c.resolve<IPermissionRepository>(IDENTITY_TOKENS.PermissionRepository)
      return new GetPermissionByIdUseCase(repo)
    }
  })

  container.register<ListPermissionsUseCase>(IDENTITY_TOKENS.ListPermissionsUseCase, {
    useFactory: (c) => {
      const repo = c.resolve<IPermissionRepository>(IDENTITY_TOKENS.PermissionRepository)
      return new ListPermissionsUseCase(repo)
    }
  })

  // ── Controllers ───────────────────────────────────────────────────────
  container.register<PermissionsController>(IDENTITY_TOKENS.PermissionsController, {
    useFactory: (c) => {
      const getById = c.resolve<GetPermissionByIdUseCase>(IDENTITY_TOKENS.GetPermissionByIdUseCase)
      const list = c.resolve<ListPermissionsUseCase>(IDENTITY_TOKENS.ListPermissionsUseCase)
      return new PermissionsController(getById, list)
    }
  })

  container.register<AuthController>(IDENTITY_TOKENS.AuthController, {
    useFactory: (c) => {
      const registerUser = c.resolve<RegisterUserUseCase>(IDENTITY_TOKENS.RegisterUserUseCase)
      const loginUser = c.resolve<LoginUserUseCase>(IDENTITY_TOKENS.LoginUserUseCase)
      return new AuthController(registerUser, loginUser)
    }
  })

  container.register<UsersController>(IDENTITY_TOKENS.UsersController, {
    useFactory: (c) => {
      const listUsers = c.resolve<ListUsersUseCase>(IDENTITY_TOKENS.ListUsersUseCase)
      const getUserById = c.resolve<GetUserByIdUseCase>(IDENTITY_TOKENS.GetUserByIdUseCase)
      const createUser = c.resolve<CreateUserUseCase>(IDENTITY_TOKENS.CreateUserUseCase)
      const updateUser = c.resolve<UpdateUserUseCase>(IDENTITY_TOKENS.UpdateUserUseCase)
      const deleteUser = c.resolve<DeleteUserUseCase>(IDENTITY_TOKENS.DeleteUserUseCase)

      return new UsersController(listUsers, getUserById, createUser, updateUser, deleteUser)
    }
  })

  container.register<RolesController>(IDENTITY_TOKENS.RolesController, {
    useFactory: (c) => {
      const listRoles = c.resolve<ListRolesUseCase>(IDENTITY_TOKENS.ListRolesUseCase)
      const getRoleById = c.resolve<GetRoleByIdUseCase>(IDENTITY_TOKENS.GetRoleByIdUseCase)
      const createRole = c.resolve<CreateRoleUseCase>(IDENTITY_TOKENS.CreateRoleUseCase)
      const updateRole = c.resolve<UpdateRoleUseCase>(IDENTITY_TOKENS.UpdateRoleUseCase)
      const deleteRole = c.resolve<DeleteRoleUseCase>(IDENTITY_TOKENS.DeleteRoleUseCase)

      return new RolesController(listRoles, getRoleById, createRole, updateRole, deleteRole)
    }
  })

  // ── Middlewares ──────────────────────────────────────────────────────
  container.register<AuthenticationMiddleware>(IDENTITY_TOKENS.AuthenticationMiddleware, {
    useFactory: (c) => {
      const jwtService = c.resolve<IJwtService>(IDENTITY_TOKENS.JwtService)
      const getActiveUserById = c.resolve<GetActiveUserByIdUseCase>(
        IDENTITY_TOKENS.GetActiveUserByIdUseCase
      )
      return new AuthenticationMiddleware(jwtService, getActiveUserById)
    }
  })

  container.register<AuthorizationMiddleware>(IDENTITY_TOKENS.AuthorizationMiddleware, {
    useFactory: (c) => {
      const checkPermissionUseCase = c.resolve<CheckPermissionUseCase>(
        IDENTITY_TOKENS.CheckPermissionUseCase
      )
      return new AuthorizationMiddleware(checkPermissionUseCase)
    }
  })

  // ── Routes ────────────────────────────────────────────────────────────
  container.register<PermissionsRoutes>(IDENTITY_TOKENS.PermissionsRoutes, {
    useFactory: (c) => {
      const controller = c.resolve<PermissionsController>(IDENTITY_TOKENS.PermissionsController)
      const authentication = c.resolve<AuthenticationMiddleware>(
        IDENTITY_TOKENS.AuthenticationMiddleware
      )
      const authorization = c.resolve<AuthorizationMiddleware>(
        IDENTITY_TOKENS.AuthorizationMiddleware
      )

      return new PermissionsRoutes(controller, authentication, authorization)
    }
  })

  container.register<AuthRoutes>(IDENTITY_TOKENS.AuthRoutes, {
    useFactory: (c) => {
      const controller = c.resolve<AuthController>(IDENTITY_TOKENS.AuthController)
      return new AuthRoutes(controller)
    }
  })

  container.register<UsersRoutes>(IDENTITY_TOKENS.UsersRoutes, {
    useFactory: (c) => {
      const controller = c.resolve<UsersController>(IDENTITY_TOKENS.UsersController)
      const authentication = c.resolve<AuthenticationMiddleware>(
        IDENTITY_TOKENS.AuthenticationMiddleware
      )
      const authorization = c.resolve<AuthorizationMiddleware>(
        IDENTITY_TOKENS.AuthorizationMiddleware
      )

      return new UsersRoutes(controller, authentication, authorization)
    }
  })

  container.register<RolesRoutes>(IDENTITY_TOKENS.RolesRoutes, {
    useFactory: (c) => {
      const controller = c.resolve<RolesController>(IDENTITY_TOKENS.RolesController)
      const authentication = c.resolve<AuthenticationMiddleware>(
        IDENTITY_TOKENS.AuthenticationMiddleware
      )
      const authorization = c.resolve<AuthorizationMiddleware>(
        IDENTITY_TOKENS.AuthorizationMiddleware
      )

      return new RolesRoutes(controller, authentication, authorization)
    }
  })
}
