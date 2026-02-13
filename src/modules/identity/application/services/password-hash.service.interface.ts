/**
 * Password Hash Service Interface
 *
 * Defines the contract for password hashing and verification operations.
 * This service is responsible for securely hashing passwords and comparing
 * plain-text passwords with their hashed counterparts.
 *
 * @remarks
 * Implementation should use a secure hashing algorithm (e.g., bcrypt, argon2).
 * This is a PORT in the hexagonal architecture - the concrete implementation
 * will be in the infrastructure layer.
 *
 * @example
 * ```typescript
 * const hashedPassword = await passwordHashService.hash('SecureP@ss123')
 * const isValid = await passwordHashService.compare('SecureP@ss123', hashedPassword)
 * ```
 */
export interface IPasswordHashService {
  /**
   * Hashes a plain-text password using a secure hashing algorithm.
   *
   * @param plainPassword - The plain-text password to hash
   * @returns A promise that resolves to the hashed password string
   *
   * @remarks
   * The returned hash includes the algorithm, cost factor, and salt.
   * Safe to store in the database.
   *
   * @example
   * ```typescript
   * const hash = await passwordHashService.hash('MyPassword123!')
   * // Returns: "$2b$10$KIXxLV7bBxbgEfN9qw3..."
   * ```
   */
  hash(plainPassword: string): Promise<string>

  /**
   * Compares a plain-text password with a hashed password.
   *
   * @param plainPassword - The plain-text password to verify
   * @param hashedPassword - The hashed password to compare against
   * @returns A promise that resolves to true if passwords match, false otherwise
   *
   * @remarks
   * This method is timing-attack resistant.
   * Always use this for password verification - never compare hashes directly.
   *
   * @example
   * ```typescript
   * const isValid = await passwordHashService.compare(
   *   'MyPassword123!',
   *   '$2b$10$KIXxLV7bBxbgEfN9qw3...'
   * )
   * if (isValid) {
   *   // Password is correct
   * }
   * ```
   */
  compare(plainPassword: string, hashedPassword: string): Promise<boolean>
}
