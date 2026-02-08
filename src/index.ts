/**
 * Application Entry Point
 *
 * Bootstrap sequence:
 * 1. Load and validate configuration
 * 2. Initialize DI container (registers all dependencies)
 * 3. Create and start application
 * 4. Setup graceful shutdown handlers
 */

import { Config } from '@/config'
import { initContainer, disposeContainer } from '@/config/container'
import { App } from './app'

/**
 * Bootstrap the application
 */
async function bootstrap() {
  const config = Config.load()

  // 2. Initialize dependency injection container
  await initContainer(config)

  // 3. Create application (resolves everything from container)
  const app = new App()

  // Start application
  const server = await app.start()

  const shutdown = async () => {
    await disposeContainer()
    server.close(() => process.exit(0))
  }
  process.on('SIGTERM', () => shutdown())
  process.on('SIGINT', () => shutdown())
}

// Start the application
bootstrap()
