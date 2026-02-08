import { Result } from '@/lib/result/result'
import { User } from '../entities/user.entity'
import { UserId } from '../value-objects/user-id.vo'
import { Email } from '../value-objects/email.vo'

/**
 * User Repository Interface (Port)
 *
 * Defines the contract for User persistence operations.
 * Implementation will be in the infrastructure layer (Prisma adapter).
 *
 * Repository responsibilities:
 * - CRUD operations for User aggregates
 * - Ensure email uniqueness
 * - Fetch users with their role associations
 */
export interface IUserRepository {
  /**
   * Finds a user by their ID
   * @returns User if found, null if not found
   */
  findById(id: UserId): Promise<Result<User | null, Error>>

  /**
   * Finds a user by their email
   * @returns User if found, null if not found
   */
  findByEmail(email: Email): Promise<Result<User | null, Error>>

  /**
   * Finds all users with pagination
   * @param limit - Maximum number of users to return
   * @param offset - Number of users to skip
   */
  findAll(limit: number, offset: number): Promise<Result<User[], Error>>

  /**
   * Checks if a user with the given email exists
   */
  existsByEmail(email: Email): Promise<Result<boolean, Error>>

  /**
   * Checks if a user with the given ID exists
   */
  existsById(id: UserId): Promise<Result<boolean, Error>>

  /**
   * Saves a new user
   * @throws Error if email already exists
   */
  save(user: User): Promise<Result<void, Error>>

  /**
   * Updates an existing user
   * @throws Error if user not found or email conflict
   */
  update(user: User): Promise<Result<void, Error>>

  /**
   * Deletes a user by their ID
   * @returns true if deleted, false if not found
   */
  delete(id: UserId): Promise<Result<boolean, Error>>

  /**
   * Counts total number of users
   */
  count(): Promise<Result<number, Error>>
}
