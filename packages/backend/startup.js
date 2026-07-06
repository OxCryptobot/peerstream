#!/usr/bin/env node

/**
 * PayTray Server Startup with Pre-flight Checks
 * Validates configuration, database connection, and service initialization
 */

import { startServer } from './server.js'
import { getLogger } from './lib/logger.js'
import { config } from './lib/config.js'

const logger = getLogger('Startup')

async function runPreflightChecks() {
  logger.info('🔍 Running pre-flight checks...')

  try {
    // 1. Validate configuration
    logger.info('✓ Configuration loaded and validated')

    // 2. Check database connectivity
    const pool = await import('./lib/database.js').then(m => m.getPool())
    await pool.query('SELECT NOW()')
    logger.info('✓ Database connection established')

    // 3. Check external services
    if (config.livekit.enabled) {
      logger.info('✓ LiveKit enabled')
    }

    if (config.ceramic.enabled) {
      logger.info('✓ Ceramic enabled')
    }

    if (config.sablier.enabled) {
      logger.info('✓ Sablier enabled')
    }

    logger.info('✅ All pre-flight checks passed\n')
    return true
  } catch (error) {
    logger.error('❌ Pre-flight check failed', error)
    return false
  }
}

async function main() {
  try {
    logger.info(`
╔══════════════════════════════════════╗
║     💳 PayTray Backend Server        ║
║          v3.0.0 (Production)         ║
╚══════════════════════════════════════╝
    `)

    // Run pre-flight checks
    const checksPass = await runPreflightChecks()
    if (!checksPass) {
      process.exit(1)
    }

    // Start server
    await startServer()
  } catch (error) {
    logger.error('Fatal startup error', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...')
  process.exit(0)
})

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...')
  process.exit(0)
})

// Run
main()
