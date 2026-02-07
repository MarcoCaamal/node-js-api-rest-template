import { z } from 'zod'
import { config } from 'dotenv'
import { LogLevel } from '@/lib/logger'

/**
 * Environment variable schema with validation rules
 *
 * Uses Zod for runtime validation and type inference.
 * All environment variables are validated on application startup.
 */
const envSchema = z.object({
  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Server
  PORT: z.string().default('3000').transform(Number).pipe(z.number().positive()),

  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),

  // API
  API_BASE_URL: z.string().url('API_BASE_URL must be a valid URL'),

  // Logging
  LOG_LEVEL: z
    .enum(['debug', 'info', 'warn', 'error'])
    .default('info') satisfies z.ZodType<LogLevel>,

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters for security'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // CORS
  CORS_ORIGIN: z.string().default('*')
})

/**
 * Inferred TypeScript type from Zod schema
 */
export type Env = z.infer<typeof envSchema>

/**
 * Load and validate environment variables
 *
 * Reads from .env file and validates against schema.
 * Exits process with error if validation fails.
 *
 * @returns Validated environment variables
 * @throws Process exits with code 1 if validation fails
 */
export function loadEnv(): Env {
  // Load .env file
  config()

  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:')
      console.error(JSON.stringify(z.treeifyError(error), null, 2))
      process.exit(1)
    }
    throw error
  }
}
