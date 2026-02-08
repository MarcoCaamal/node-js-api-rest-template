/**
 * Permission Response DTO
 *
 * Data Transfer Object for exposing permission data to the presentation layer.
 * Maps from domain Permission entity to a serializable format.
 */
export interface PermissionResponseDto {
  id: string
  resource: string
  action: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}
