/**
 * Queue-Integrated Endpoints
 * Examples of how to integrate Bull message queues with your API endpoints
 * 
 * Wire these into your server.js:
 * import { registerQueueEndpoints } from './routes/queueIntegration.js'
 * registerQueueEndpoints(app, authenticateToken)
 */

import { getQueueManager } from '../lib/messageQueue.js'
import { createModel } from '../lib/database.js'
import { getLogger } from '../lib/logger.js'

const logger = getLogger('QueueIntegration')
const PaymentStreams = createModel('payment_streams')
const Profiles = createModel('profiles')

/**
 * Register all queue-integrated endpoints
 */
export function registerQueueEndpoints(app, authenticateToken) {
  const queueManager = getQueueManager()

  // ========================================================================
  // PROFILE UPDATE ENDPOINT - Queues email notification
  // ========================================================================

  /**
   * POST /api/profiles/:wallet - Create or update profile
   * Queues: sendProfileUpdateEmail
   */
  app.post('/api/profiles/:wallet', authenticateToken, async (req, res, next) => {
    try {
      const { wallet } = req.params
      const { name, bio, expertise, hourlyRate } = req.body

      // Validate ownership (can only update own profile)
      const profile = await Profiles.findOne('user_id', req.userId)

      if (profile) {
        // Update existing profile
        await Profiles.update(profile.id, {
          name,
          bio,
          expertise: Array.isArray(expertise) ? expertise : [],
          hourly_rate: hourlyRate,
          updated_at: new Date()
        })

        logger.info('Profile updated', { userId: req.userId, wallet })

        // Queue email notification for profile update
        await queueManager.enqueueJob('sendProfileUpdateEmail', {
          userId: req.userId,
          wallet,
          userName: name,
          updateType: 'profile_update'
        }, {
          priority: 5,  // Medium priority
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 }
        })

        res.json({
          success: true,
          message: 'Profile updated successfully',
          notification: 'Email sent'
        })
      } else {
        throw new Error('Profile not found')
      }
    } catch (error) {
      next(error)
    }
  })

  // ========================================================================
  // PAYMENT STREAM ENDPOINT - Queues payment notification
  // ========================================================================

  /**
   * POST /api/streams - Create payment stream
   * Queues: sendPaymentReceivedEmail, recordUserActivity
   */
  app.post('/api/streams', authenticateToken, async (req, res, next) => {
    try {
      const { recipientId, amount, token, duration } = req.body

      // Create payment stream in database
      const stream = await PaymentStreams.create({
        sender_id: req.userId,
        recipient_id: recipientId,
        amount,
        token_symbol: token,
        duration_seconds: duration,
        status: 'active'
      })

      logger.info('Payment stream created', {
        streamId: stream.id,
        senderId: req.userId,
        recipientId
      })

      // Queue multiple jobs for this event

      // 1. Send payment notification email
      await queueManager.enqueueJob('sendPaymentReceivedEmail', {
        recipientUserId: recipientId,
        senderName: req.user?.name || req.user?.walletAddress,
        amount,
        tokenSymbol: token,
        streamId: stream.id
      }, {
        priority: 10,  // High priority
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 }
      })

      // 2. Record user activity for analytics
      await queueManager.enqueueJob('recordUserActivity', {
        userId: req.userId,
        action: 'stream_created',
        metadata: {
          streamId: stream.id,
          amount,
          token,
          recipientId
        }
      }, {
        priority: 3,   // Low priority
        attempts: 1    // Don't retry analytics
      })

      res.json({
        success: true,
        stream,
        message: 'Payment stream created',
        notifications: 'Email queued, activity tracked'
      })
    } catch (error) {
      next(error)
    }
  })

  // ========================================================================
  // CLEANUP ENDPOINT - Trigger scheduled maintenance
  // ========================================================================

  /**
   * POST /api/maintenance/cleanup - Trigger database cleanup job
   * Queues: cleanupOldCalls
   */
  app.post('/api/maintenance/cleanup', authenticateToken, async (req, res, next) => {
    try {
      // Only admins can trigger cleanup (check in real implementation)
      if (!req.user?.isAdmin) {
        throw new Error('Unauthorized: Admin access required')
      }

      const { daysOld = 30 } = req.body

      // Queue cleanup job for tomorrow at midnight
      const tomorrow = new Date()
      tomorrow.setUTCHours(0, 0, 0, 0)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const delayMs = tomorrow.getTime() - Date.now()

      await queueManager.enqueueJob('cleanupOldCalls', {
        daysOld
      }, {
        delay: delayMs,
        attempts: 2,
        backoff: { type: 'exponential', delay: 2000 }
      })

      res.json({
        success: true,
        message: `Cleanup job queued to run tomorrow at midnight`,
        daysOld,
        scheduledTime: tomorrow.toISOString()
      })
    } catch (error) {
      next(error)
    }
  })

  // ========================================================================
  // QUEUE MONITORING ENDPOINT
  // ========================================================================

  /**
   * GET /api/queue/health - Get queue health status
   */
  app.get('/api/queue/health', async (req, res, next) => {
    try {
      const stats = await queueManager.getAllStats()

      const response = {
        status: 'healthy',
        queues: {}
      }

      for (const [queueName, queueStats] of Object.entries(stats)) {
        response.queues[queueName] = {
          waiting: queueStats.waiting || 0,
          active: queueStats.active || 0,
          completed: queueStats.completed || 0,
          failed: queueStats.failed || 0,
          paused: queueStats.paused || false,
          health: queueStats.failed > 10 ? 'warning' : 'healthy'
        }
      }

      res.json(response)
    } catch (error) {
      next(error)
    }
  })

  /**
   * POST /api/queue/pause/:queueName - Pause a queue (emergency)
   */
  app.post('/api/queue/pause/:queueName', authenticateToken, async (req, res, next) => {
    try {
      if (!req.user?.isAdmin) {
        throw new Error('Unauthorized: Admin access required')
      }

      const { queueName } = req.params
      await queueManager.pauseQueue(queueName)

      logger.warn('Queue paused', { queueName, admin: req.userId })

      res.json({
        success: true,
        message: `Queue ${queueName} paused`,
        warning: 'Jobs will not process until resumed'
      })
    } catch (error) {
      next(error)
    }
  })

  /**
   * POST /api/queue/resume/:queueName - Resume a paused queue
   */
  app.post('/api/queue/resume/:queueName', authenticateToken, async (req, res, next) => {
    try {
      if (!req.user?.isAdmin) {
        throw new Error('Unauthorized: Admin access required')
      }

      const { queueName } = req.params
      await queueManager.resumeQueue(queueName)

      logger.info('Queue resumed', { queueName, admin: req.userId })

      res.json({
        success: true,
        message: `Queue ${queueName} resumed`,
        info: 'Jobs will now process normally'
      })
    } catch (error) {
      next(error)
    }
  })

  /**
   * GET /api/queue/stats/:queueName - Get stats for specific queue
   */
  app.get('/api/queue/stats/:queueName', authenticateToken, async (req, res, next) => {
    try {
      if (!req.user?.isAdmin) {
        throw new Error('Unauthorized: Admin access required')
      }

      const { queueName } = req.params
      const stats = await queueManager.getQueueStats(queueName)

      res.json({
        queueName,
        ...stats,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      next(error)
    }
  })

  logger.info('✅ Queue-integrated endpoints registered')
}

export default { registerQueueEndpoints }
