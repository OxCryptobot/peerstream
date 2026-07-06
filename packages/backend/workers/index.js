/**
 * PayTray Worker Process
 * Handles async jobs: email notifications, analytics, cleanup, reporting
 * 
 * Run: npm run worker
 */

import dotenv from 'dotenv'
import { getLogger } from '../lib/logger.js'
import { getQueueManager } from '../lib/messageQueue.js'
import { registerJobHandlers } from '../services/jobHandlers.js'
import { initializeDatabase } from '../lib/database.js'

// Load environment
dotenv.config({ path: '.env.local' })

const logger = getLogger('Worker')

/**
 * Worker initialization
 */
async function initializeWorker() {
  try {
    logger.info('🚀 Initializing job worker...')

    // Try to initialize database connection
    try {
      await initializeDatabase()
      logger.info('✓ Database connected')
    } catch (dbError) {
      logger.warn('⚠️  Database connection failed:', dbError.message)
      logger.warn('Worker will continue without database support')
    }

    // Try to initialize queue manager with Redis
    try {
      const queueManager = getQueueManager(process.env.REDIS_URL || 'redis://localhost:6379')
      logger.info('✓ Queue manager initialized')

      // Register all job handlers
      try {
        await registerJobHandlers(queueManager)
        logger.info('✓ Job handlers registered')
      } catch (handlerError) {
        logger.warn('⚠️  Job handler registration failed:', handlerError.message)
      }

      // Log queue stats every 30 seconds
      const statsInterval = setInterval(async () => {
        try {
          const stats = await queueManager.getAllStats()
          logger.info('📊 Queue Statistics:', {
            timestamp: new Date().toISOString(),
            stats
          })
        } catch (error) {
          logger.error('Failed to fetch queue stats', error)
        }
      }, 30000)

      // Graceful shutdown on SIGTERM
      process.on('SIGTERM', async () => {
        logger.info('SIGTERM received, shutting down gracefully...')
        clearInterval(statsInterval)
        await queueManager.shutdown()
        process.exit(0)
      })

      // Graceful shutdown on SIGINT (Ctrl+C)
      process.on('SIGINT', async () => {
        logger.info('SIGINT received, shutting down gracefully...')
        clearInterval(statsInterval)
        await queueManager.shutdown()
        process.exit(0)
      })

      logger.info('✅ Worker ready to process jobs')
    } catch (queueError) {
      logger.error('⚠️  Queue manager initialization failed:', queueError.message)
      logger.warn('Worker running in degraded mode - no job processing')
      
      // Exit after a delay so Railway logs it
      setTimeout(() => {
        process.exit(1)
      }, 5000)
    }
  } catch (error) {
    logger.error('❌ Worker initialization failed:', error)
    process.exit(1)
  }
}
      logger.info('SIGINT received, shutting down gracefully...')
      clearInterval(statsInterval)
      await queueManager.shutdown()
      process.exit(0)
    })

    logger.info(`
╔════════════════════════════════════════════════════════════════╗
║          PayTray Worker Process - Async Job Handler            ║
║          Ready to process background jobs                       ║
╚════════════════════════════════════════════════════════════════╝

✅ Infrastructure:
  ✓ Database connected
  ✓ Redis connected
  ✓ Job handlers registered

📋 Available Queues:
  • sendProfileUpdateEmail    - Send profile update notifications
  • sendPaymentReceivedEmail  - Send payment stream notifications
  • recordUserActivity        - Track user analytics
  • cleanupOldCalls           - Remove old video call records
  • generateMonthlyReport     - Generate user statistics

⏱️  Checking queue status every 30 seconds
🛑 Graceful shutdown: SIGTERM or SIGINT

Starting job processing...
    `)
  } catch (error) {
    logger.error('Worker initialization failed', error)
    process.exit(1)
  }
}

// Start worker
initializeWorker().catch((error) => {
  logger.error('Fatal error in worker', error)
  process.exit(1)
})
