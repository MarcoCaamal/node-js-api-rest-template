/**
 * Role Response DTO
 *
 * Data Transfer Object for role information exposed to clients.
 */
export interface RoleResponseDto {
  id: string
  name: string
  description: string
  isSystem: boolean
  permissionIds: string[]
  createdAt: Date
  updatedAt: Date
}
