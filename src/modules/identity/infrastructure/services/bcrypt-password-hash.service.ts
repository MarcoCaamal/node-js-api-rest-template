import bcrypt from 'bcrypt'
import { IPasswordHashService } from '@/modules/identity/application/services/password-hash.service.interface'

/**
 * Bcrypt Password Hash Service Implementation
 *
 * Concrete implementation of IPasswordHashService using the bcrypt algorithm.
 * Bcrypt is a password-hashing function designed to be slow and computationally expensive,
 * making it resistant to brute-force attacks.
 *
 * @remarks
 * This is an ADAPTER in the hexagonal architecture pattern.
 * The cost factor (salt rounds) determines the computational complexity.
 * Higher values = more secure but slower. Recommended: 10-12 for production.
 *
 * @see {@link https://github.com/kelektiv/node.bcrypt.js|bcrypt documentation}
 *
 * @example
 * ```typescript
 * const hashService = new BcryptPasswordHashService(10)
 * const hash = await hashService.hash('MyPassword123!')
 * const isValid = await hashService.compare('MyPassword123!', hash)
 * ```
 */
export class BcryptPasswordHashService implements IPasswordHashService {
  /**
   * Creates an instance of BcryptPasswordHashService.
   *
   * @param saltRounds - The cost factor for bcrypt (default: 10)
   *                     Higher values increase security but take longer.
   *                     Each increment doubles the computation time.
   *
   * @remarks
   * Recommended values:
   * - Development: 4-6 (faster)
   * - Production: 10-12 (secure)
   * - High-security: 13-14 (very slow)
   */
  constructor(private readonly saltRounds: number = 10) {}

  /**
   * Hashes a plain-text password using bcrypt.
   *
   * @param plainPassword - The plain-text password to hash
   * @returns A promise that resolves to the bcrypt hash string
   *
   * @remarks
   * The returned hash format: $2b$[cost]$[22-char salt][31-char hash]
   * The salt is automatically generated and included in the hash.
   *
   * @throws {Error} If hashing fails (e.g., invalid input)
   *
   * @example
   * ```typescript
   * const hash = await hashService.hash('SecurePass123!')
   * // Returns: "$2b$10$N9qo8uLOickgx2ZMRZoMye..."
   * ```
   */
  async hash(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, this.saltRounds)
  }

  /**
   * Compares a plain-text password with a bcrypt hash.
   *
   * @param plainPassword - The plain-text password to verify
   * @param hashedPassword - The bcrypt hash to compare against
   * @returns A promise that resolves to true if passwords match, false otherwise
   *
   * @remarks
   * This method is timing-attack resistant.
   * Extracts the salt from the hash and compares securely.
   *
   * @throws {Error} If comparison fails (e.g., malformed hash)
   *
   * @example
   * ```typescript
   * const isValid = await hashService.compare(
   *   'SecurePass123!',
   *   '$2b$10$N9qo8uLOickgx2ZMRZoMye...'
   * )
   * if (isValid) {
   *   // Authentication successful
   * }
   * ```
   */
  async compare(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword)
  }
}
