/**
 * Common OpenAPI Schemas
 *
 * This file contains JSDoc OpenAPI documentation for shared schemas
 * used across multiple endpoints (pagination, errors, responses).
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     ProblemDetails:
 *       type: object
 *       description: RFC 9457 Problem Details for HTTP APIs
 *       required:
 *         - type
 *         - title
 *         - status
 *         - detail
 *       properties:
 *         type:
 *           type: string
 *           format: uri
 *           description: URI reference identifying the problem type
 *           example: https://api.example.com/problems/validation-error
 *         title:
 *           type: string
 *           description: Short, human-readable summary of the problem
 *           example: Validation Error
 *         status:
 *           type: integer
 *           description: HTTP status code
 *           minimum: 100
 *           maximum: 599
 *           example: 400
 *         detail:
 *           type: string
 *           description: Human-readable explanation specific to this occurrence
 *           example: The 'limit' parameter must be between 1 and 100
 *         instance:
 *           type: string
 *           format: uri
 *           description: URI reference identifying the specific occurrence
 *           example: /api/permissions
 *         requestId:
 *           type: string
 *           format: uuid
 *           description: Unique request identifier for tracing
 *           example: a7ff6019-a9ec-4219-9203-89545a8fce5a
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the error occurred
 *           example: 2026-02-08T01:37:15.808Z
 *
 *     PaginationMetadata:
 *       type: object
 *       description: Metadata for paginated responses
 *       required:
 *         - total
 *         - limit
 *         - offset
 *         - hasMore
 *         - currentPage
 *         - totalPages
 *       properties:
 *         total:
 *           type: integer
 *           description: Total number of items across all pages
 *           minimum: 0
 *           example: 100
 *         limit:
 *           type: integer
 *           description: Maximum number of items per page
 *           minimum: 1
 *           maximum: 100
 *           example: 20
 *         offset:
 *           type: integer
 *           description: Number of items skipped from the beginning
 *           minimum: 0
 *           example: 0
 *         hasMore:
 *           type: boolean
 *           description: Whether there are more items available
 *           example: true
 *         currentPage:
 *           type: integer
 *           description: Current page number (1-indexed)
 *           minimum: 1
 *           example: 1
 *         totalPages:
 *           type: integer
 *           description: Total number of pages
 *           minimum: 1
 *           example: 5
 *
 *     PermissionResponse:
 *       type: object
 *       description: Permission entity representation
 *       required:
 *         - id
 *         - resource
 *         - action
 *         - description
 *         - createdAt
 *         - updatedAt
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique permission identifier
 *           example: b8fb0213-4718-4759-9d96-2c222c9cf9ee
 *         resource:
 *           type: string
 *           description: Resource being protected (e.g., users, roles, permissions)
 *           minLength: 1
 *           maxLength: 100
 *           example: users
 *         action:
 *           type: string
 *           description: Action allowed on the resource (e.g., read, create, update, delete, or * for wildcard)
 *           minLength: 1
 *           maxLength: 50
 *           example: read
 *         description:
 *           type: string
 *           description: Human-readable description of what this permission allows
 *           maxLength: 500
 *           example: View user details and list users
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the permission was created
 *           example: 2026-02-07T13:26:24.206Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the permission was last updated
 *           example: 2026-02-07T13:26:24.206Z
 *
 *     PaginatedPermissionResponse:
 *       type: object
 *       description: Paginated list of permissions
 *       required:
 *         - data
 *         - pagination
 *       properties:
 *         data:
 *           type: array
 *           description: Array of permission objects for the current page
 *           items:
 *             $ref: '#/components/schemas/PermissionResponse'
 *         pagination:
 *           $ref: '#/components/schemas/PaginationMetadata'
 *
 *     UserResponse:
 *       type: object
 *       description: User entity representation
 *       required:
 *         - id
 *         - email
 *         - firstName
 *         - lastName
 *         - fullName
 *         - isActive
 *         - roleId
 *         - createdAt
 *         - updatedAt
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique user identifier
 *           example: 550e8400-e29b-41d4-a716-446655440000
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *           example: user@example.com
 *         firstName:
 *           type: string
 *           description: User first name
 *           example: John
 *         lastName:
 *           type: string
 *           description: User last name
 *           example: Doe
 *         fullName:
 *           type: string
 *           description: User full name
 *           example: John Doe
 *         isActive:
 *           type: boolean
 *           description: Whether the user is active
 *           example: true
 *         roleId:
 *           type: string
 *           format: uuid
 *           description: Role identifier assigned to the user
 *           example: 660e8400-e29b-41d4-a716-446655440001
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the user was created
 *           example: 2026-02-07T13:26:24.206Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the user was last updated
 *           example: 2026-02-07T13:26:24.206Z
 *
 *     CreateUserRequest:
 *       type: object
 *       description: Payload to create a new user
 *       required:
 *         - email
 *         - password
 *         - firstName
 *         - lastName
 *         - roleId
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *           example: user@example.com
 *         password:
 *           type: string
 *           format: password
 *           minLength: 8
 *           maxLength: 72
 *           description: User password following security policy
 *           example: SecureP@ss123!
 *         firstName:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           example: John
 *         lastName:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           example: Doe
 *         roleId:
 *           type: string
 *           format: uuid
 *           description: Role identifier assigned to the user
 *           example: 660e8400-e29b-41d4-a716-446655440001
 *
 *     UpdateUserRequest:
 *       type: object
 *       description: Payload to update a user
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *           example: user@example.com
 *         password:
 *           type: string
 *           format: password
 *           minLength: 8
 *           maxLength: 72
 *           description: User password following security policy
 *           example: SecureP@ss123!
 *         firstName:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           example: John
 *         lastName:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           example: Doe
 *         roleId:
 *           type: string
 *           format: uuid
 *           description: Role identifier assigned to the user
 *           example: 660e8400-e29b-41d4-a716-446655440001
 *         isActive:
 *           type: boolean
 *           description: Whether the user is active
 *           example: true
 *
 *     PaginatedUserResponse:
 *       type: object
 *       description: Paginated list of users
 *       required:
 *         - data
 *         - pagination
 *       properties:
 *         data:
 *           type: array
 *           description: Array of user objects for the current page
 *           items:
 *             $ref: '#/components/schemas/UserResponse'
 *         pagination:
 *           $ref: '#/components/schemas/PaginationMetadata'
 *
 *     RoleResponse:
 *       type: object
 *       description: Role entity representation
 *       required:
 *         - id
 *         - name
 *         - description
 *         - isSystem
 *         - permissionIds
 *         - createdAt
 *         - updatedAt
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique role identifier
 *           example: 4cc11769-29ef-46a1-9b7d-12d98b6c6ef5
 *         name:
 *           type: string
 *           description: Role name (uppercase)
 *           example: ADMIN
 *         description:
 *           type: string
 *           description: Role description
 *           example: System administrators
 *         isSystem:
 *           type: boolean
 *           description: Whether the role is a system role
 *           example: true
 *         permissionIds:
 *           type: array
 *           description: Permission identifiers assigned to the role
 *           items:
 *             type: string
 *             format: uuid
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the role was created
 *           example: 2026-02-07T13:26:24.206Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the role was last updated
 *           example: 2026-02-07T13:26:24.206Z
 *
 *     CreateRoleRequest:
 *       type: object
 *       description: Payload to create a new role (system roles are not allowed)
 *       required:
 *         - name
 *         - description
 *       properties:
 *         name:
 *           type: string
 *           description: Role name (uppercase, numbers, underscores)
 *           example: SUPPORT_AGENT
 *         description:
 *           type: string
 *           description: Role description
 *           example: Support team role
 *         permissionIds:
 *           type: array
 *           description: Optional list of permission IDs to assign
 *           items:
 *             type: string
 *             format: uuid
 *
 *     UpdateRoleRequest:
 *       type: object
 *       description: Payload to update a role (system roles cannot be edited)
 *       properties:
 *         name:
 *           type: string
 *           description: Role name (uppercase, numbers, underscores)
 *           example: SUPPORT_LEAD
 *         description:
 *           type: string
 *           description: Role description
 *           example: Support team lead role
 *         permissionIds:
 *           type: array
 *           description: Optional list of permission IDs to replace
 *           items:
 *             type: string
 *             format: uuid
 *
 *     PaginatedRoleResponse:
 *       type: object
 *       description: Paginated list of roles
 *       required:
 *         - data
 *         - pagination
 *       properties:
 *         data:
 *           type: array
 *           description: Array of role objects for the current page
 *           items:
 *             $ref: '#/components/schemas/RoleResponse'
 *         pagination:
 *           $ref: '#/components/schemas/PaginationMetadata'
 */

// This file only contains JSDoc comments, no executable code
export {}
