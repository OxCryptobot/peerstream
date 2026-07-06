/**
 * Message Queue Manager using Bull + Redis
 * 
 * Handles async job processing with:
 * - Automatic retries with exponential backoff
 * - Job prioritization
 * - Worker concurrency control
 * - Queue monitoring and health checks
 */

import Bull from 'bull'
import { getLogger } from './logger.js'

const logger = getLogger('MessageQueue')

/**
 * Message Queue Manager
 * Singleton pattern for managing all queues
 */
class MessageQueueManager {
  constructor(redisUrl = 'redis://localhost:6379') {
    this.redisUrl = redisUrl
    this.queues = new Map()
    this.workers = new Map()
    logger.info('MessageQueueManager initialized')
  }

  /**
   * Get or create a queue
   */
  getQueue(name) {
    if (!this.queues.has(name)) {
      try {
        const queue = new Bull(name, this.redisUrl, {
          settings: {
            maxStalledCount: 2,
            maxStalledInterval: 5000,
            guardInterval: 5000,
            retryProcessDelay: 5000,
            lockDuration: 30000,
            lockRenewTime: 15000
          }
        })

        // Setup event listeners
        queue.on('error', (err) => {
          logger.error(`Queue error: ${name}`, err)
        })

        queue.on('failed', (job, err) => {
          logger.warn(`Job failed: ${name}/${job.id}`, {
            attempt: job.attemptsMade,
            maxAttempts: job.opts.attempts,
            error: err.message
          })
        })

        queue.on('completed', (job) => {
          logger.debug(`Job completed: ${name}/${job.id}`)
        })

        queue.on('stalled', (job) => {
          logger.warn(`Job stalled: ${name}/${job.id}`)
        })

        this.queues.set(name, queue)
        logger.info(`✓ Queue created: ${name}`)
      } catch (error) {
        logger.error(`Failed to create queue: ${name}`, error)
        throw error
      }
    }

    return this.queues.get(name)
  }

  /**
   * Register a job processor (worker)
   */
  registerProcessor(queueName, handler, options = {}) {
    const {
      concurrency = 5,
      attempts = 3,
      backoff = { type: 'exponential', delay: 2000 }
    } = options

    try {
      const queue = this.getQueue(queueName)

      queue.process(concurrency, async (job) => {
        logger.info(`▶️  Processing job: ${queueName}/${job.id}`, {
          attempt: job.attemptsMade + 1,
          maxAttempts: job.opts.attempts
        })

        try {
          const result = await handler(job.data, job)
          logger.info(`✓ Job succeeded: ${queueName}/${job.id}`)
          return result
        } catch (error) {
          logger.error(`✗ Job handler error: ${queueName}/${job.id}`, error)
          throw error // Will trigger retry
        }
      })

      this.workers.set(queueName, { handler, options })
      logger.info(`✓ Processor registered: ${queueName}`)
    } catch (error) {
      logger.error(`Failed to register processor: ${queueName}`, error)
      throw error
    }
  }

  /**
   * Enqueue a job
   */
  async enqueueJob(queueName, data, options = {}) {
    const {
      priority = 0,
      delay = 0,
      attempts = 3,
      backoff = { type: 'exponential', delay: 2000 },
      removeOnComplete = true,
      jobId = null
    } = options

    try {
      const queue = this.getQueue(queueName)

      const jobOptions = {
        priority,
        delay,
        attempts,
        backoff,
        removeOnComplete
      }

      if (jobId) {
        jobOptions.jobId = jobId
      }

      const job = await queue.add(data, jobOptions)

      logger.info(`✓ Job enqueued: ${queueName}/${job.id}`, {
        priority,
        delay,
        data: JSON.stringify(data).substring(0, 100)
      })

      return job.id
    } catch (error) {
      logger.error(`Failed to enqueue job: ${queueName}`, error)
      throw error
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName) {
    try {
      const queue = this.getQueue(queueName)

      return {
        name: queueName,
        waiting: await queue.getWaitingCount(),
        active: await queue.getActiveCount(),
        completed: await queue.getCompletedCount(),
        failed: await queue.getFailedCount(),
        delayed: await queue.getDelayedCount(),
        paused: await queue.isPaused()
      }
    } catch (error) {
      logger.error(`Failed to get stats for queue: ${queueName}`, error)
      throw error
    }
  }

  /**
   * Get all queue statistics
   */
  async getAllStats() {
    const stats = {}

    try {
      for (const [name] of this.queues) {
        stats[name] = await this.getQueueStats(name)
      }
    } catch (error) {
      logger.error('Failed to get all queue stats', error)
    }

    return stats
  }

  /**
   * Pause a queue
   */
  async pauseQueue(queueName) {
    try {
      const queue = this.getQueue(queueName)
      await queue.pause()
      logger.info(`⏸️  Queue paused: ${queueName}`)
    } catch (error) {
      logger.error(`Failed to pause queue: ${queueName}`, error)
      throw error
    }
  }

  /**
   * Resume a queue
   */
  async resumeQueue(queueName) {
    try {
      const queue = this.getQueue(queueName)
      await queue.resume()
      logger.info(`▶️  Queue resumed: ${queueName}`)
    } catch (error) {
      logger.error(`Failed to resume queue: ${queueName}`, error)
      throw error
    }
  }

  /**
   * Clear all jobs from a queue
   */
  async clearQueue(queueName) {
    try {
      const queue = this.getQueue(queueName)
      await queue.empty()
      logger.info(`🧹 Queue cleared: ${queueName}`)
    } catch (error) {
      logger.error(`Failed to clear queue: ${queueName}`, error)
      throw error
    }
  }

  /**
   * Get job details
   */
  async getJob(queueName, jobId) {
    try {
      const queue = this.getQueue(queueName)
      const job = await queue.getJob(jobId)
      return job
    } catch (error) {
      logger.error(`Failed to get job: ${queueName}/${jobId}`, error)
      throw error
    }
  }

  /**
   * Retry a failed job
   */
  async retryJob(queueName, jobId) {
    try {
      const queue = this.getQueue(queueName)
      const job = await queue.getJob(jobId)

      if (!job) {
        throw new Error(`Job not found: ${jobId}`)
      }

      await job.retry()
      logger.info(`🔄 Job retried: ${queueName}/${jobId}`)
    } catch (error) {
      logger.error(`Failed to retry job: ${queueName}/${jobId}`, error)
      throw error
    }
  }

  /**
   * Remove a job
   */
  async removeJob(queueName, jobId) {
    try {
      const queue = this.getQueue(queueName)
      const job = await queue.getJob(jobId)

      if (job) {
        await job.remove()
        logger.info(`❌ Job removed: ${queueName}/${jobId}`)
      }
    } catch (error) {
      logger.error(`Failed to remove job: ${queueName}/${jobId}`, error)
      throw error
    }
  }

  /**
   * Graceful shutdown - close all queues
   */
  async shutdown() {
    logger.info('🛑 Shutting down message queues...')

    try {
      for (const [name, queue] of this.queues) {
        await queue.close()
        logger.info(`✓ Queue closed: ${name}`)
      }

      logger.info('✓ All queues shut down successfully')
    } catch (error) {
      logger.error('Error during queue shutdown', error)
      throw error
    }
  }
}

let queueManager = null

/**
 * Get or create queue manager (singleton)
 */
export function getQueueManager(redisUrl = null) {
  if (!queueManager) {
    queueManager = new MessageQueueManager(
      redisUrl || process.env.REDIS_URL || 'redis://localhost:6379'
    )
  }
  return queueManager
}

export { MessageQueueManager }
