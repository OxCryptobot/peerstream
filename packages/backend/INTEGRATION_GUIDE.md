/**
 * Server.js Integration Guide
 * Add these imports and calls to your server.js to wire up all the Phase 4 infrastructure
 */

// ============================================================================
// STEP 1: Add these imports near the top of server.js (after existing imports)
// ============================================================================

import { registerQueueEndpoints } from './routes/queueIntegration.js'
import { getQueueManager } from './lib/messageQueue.js'
import { registerJobHandlers } from './services/jobHandlers.js'

// ============================================================================
// STEP 2: Add to your initialization (in startServer function)
// ============================================================================

async function startServer() {
  const port = config.port || 3001
  
  // ... existing initialization code ...

  // ===== PHASE 4: SCALABILITY INITIALIZATION =====
  
  // Initialize queue manager with Redis
  logger.info('🔄 Initializing message queue system...')
  const queueManager = getQueueManager(process.env.REDIS_URL)
  
  // Register all job handlers (email, analytics, cleanup, reports)
  await registerJobHandlers(queueManager)
  logger.info('✅ Queue initialized with job handlers registered')

  // ===== END PHASE 4 =====

  // ... rest of initialization code ...

  // ============================================================================
  // STEP 3: Register queue-integrated endpoints
  // ============================================================================

  // Place this after your other endpoint definitions but before error handling
  registerQueueEndpoints(app, authenticateToken)

  // ============================================================================
  // STEP 4: Add enhanced health check with queue status
  // ============================================================================

  app.get('/api/health/detailed', async (req, res) => {
    try {
      const queueStats = await queueManager.getAllStats()
      
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        infrastructure: {
          database: 'connected',
          redis: process.env.REDIS_ENABLED === 'true' ? 'connected' : 'disabled',
          messageQueue: {
            active: true,
            stats: queueStats
          }
        }
      })
    } catch (error) {
      res.status(503).json({
        status: 'degraded',
        error: error.message
      })
    }
  })

  // ============================================================================
  // STEP 5: Graceful shutdown with queue cleanup
  // ============================================================================

  const gracefulShutdown = async (signal) => {
    logger.info(`📍 Received ${signal}, starting graceful shutdown...`)
    
    try {
      // Stop accepting new requests
      server.close(() => {
        logger.info('🛑 HTTP server closed')
      })
      
      // Close queue gracefully (finish processing current jobs)
      logger.info('⏳ Closing message queue system...')
      await queueManager.shutdown()
      logger.info('✅ Message queue closed')
      
      // Close database connections
      await getPool().end()
      logger.info('✅ Database connections closed')
      
      logger.info('✨ Graceful shutdown complete')
      process.exit(0)
    } catch (error) {
      logger.error('❌ Error during shutdown', error)
      process.exit(1)
    }
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
  process.on('SIGINT', () => gracefulShutdown('SIGINT'))

  // ============================================================================
  // STEP 6: Start monitoring (optional, for development/debugging)
  // ============================================================================

  // Log queue statistics every 30 seconds during development
  if (config.env === 'development') {
    setInterval(async () => {
      const stats = await queueManager.getAllStats()
      logger.debug('📊 Queue Statistics:', stats)
    }, 30000)
  }

  // ============================================================================
  // STEP 7: Start the server
  // ============================================================================

  const server = app.listen(port, config.host, () => {
    logger.info(`
╔══════════════════════════════════════════════╗
║   PayTray Backend Server v2.0                ║
║   ✅ All Systems Online                      ║
╚══════════════════════════════════════════════╝

📍 Server:     ${config.host}:${port}
🌍 Environment: ${config.env}
⚙️  Rate Limit:  ${process.env.REDIS_ENABLED === 'true' ? 'Distributed (Redis)' : 'In-Memory'}
🔀 Message Queue: ${process.env.REDIS_ENABLED === 'true' ? 'Bull + Redis' : 'In-Memory'}
👷 Worker:     Run 'npm run worker' in another terminal

📚 API Endpoints:
  • Health:   GET /health
  • Queue:    GET /api/queue/health
  • Profiles: POST /api/profiles/:wallet
  • Streams:  POST /api/streams

🔗 Connect your requests with the queue system:
  • Profile updates → Email notifications queued
  • Payment streams → Payment receipts queued
  • Analytics      → User activity tracked

Ready for requests! Press Ctrl+C to stop.
    `)
  })
}

// ============================================================================
// EXAMPLE: How to use queue in your handlers
// ============================================================================

/*
// In any endpoint handler:

app.post('/api/users/register', async (req, res, next) => {
  try {
    const user = await Users.create({ ... })
    
    // Queue welcome email
    const queueManager = getQueueManager()
    await queueManager.enqueueJob('sendProfileUpdateEmail', {
      userId: user.id,
      userName: user.name,
      updateType: 'welcome'
    })
    
    res.json({ success: true, user })
  } catch (error) {
    next(error)
  }
})
*/

// ============================================================================
// VERIFICATION CHECKLIST
// ============================================================================

/*
✅ Rate limiting middleware added
✅ Queue manager initialized
✅ Job handlers registered
✅ Queue endpoints registered
✅ Health checks include queue stats
✅ Graceful shutdown includes queue cleanup
✅ Worker process wired

Once all items above are checked:
1. Run: npm run db:init
2. Run: npm run dev (server)
3. Run: npm run worker:dev (worker, in another terminal)
4. Test: curl http://localhost:3001/api/health
*/
