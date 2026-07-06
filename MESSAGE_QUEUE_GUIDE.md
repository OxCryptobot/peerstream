# 📨 Message Queue Implementation Guide

**Purpose:** Handle async tasks (emails, notifications, analytics, cleanup)  
**Solution:** Bull (Redis-based) for simplicity, with RabbitMQ option  
**Timeline:** 1-2 weeks to implement  
**Impact:** Never lose user notifications, scale async work independently  

---

## 🎯 Why Message Queues Matter

### Problem Without Message Queue

```
User creates payment stream
  ↓
Backend updates database
  ↓
Try to send email notification
  ↓
Email service down → Transaction fails ❌
```

**Result:** User confused, payment processed but no notification

### Solution With Message Queue

```
User creates payment stream
  ↓
Backend updates database ✓
  ↓
Queue email job ✓ (returns immediately)
  ↓
Worker processes email job
  ↓
Email service down? → Retry with exponential backoff
```

**Result:** Payment confirms immediately, email retries 3x, never lost

---

## 🔧 Implementation: Bull (Recommended)

### Step 1: Install Dependencies

```bash
npm install bull redis

# Or with Yarn
yarn add bull redis

# Types for TypeScript
npm install --save-dev @types/bull
```

### Step 2: Create Queue Manager

**lib/messageQueue.js:**

```javascript
import Bull from 'bull'
import { getLogger } from './logger.js'

const logger = getLogger('MessageQueue')

class MessageQueueManager {
  constructor(redisUrl) {
    this.redisUrl = redisUrl || process.env.REDIS_URL || 'redis://localhost:6379'
    this.queues = new Map()
    this.workers = new Map()
  }

  /**
   * Create or get a queue
   */
  getQueue(name) {
    if (!this.queues.has(name)) {
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

      queue.on('error', (err) => {
        logger.error(`Queue ${name} error:`, err)
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

      this.queues.set(name, queue)
    }

    return this.queues.get(name)
  }

  /**
   * Register a job processor (worker)
   */
  registerProcessor(queueName, handler, options = {}) {
    const { concurrency = 5, attempts = 3, backoff = { type: 'exponential', delay: 2000 } } = options

    const queue = this.getQueue(queueName)

    queue.process(concurrency, async (job) => {
      logger.info(`Processing job: ${queueName}/${job.id}`, { data: job.data })
      try {
        const result = await handler(job.data, job)
        return result
      } catch (error) {
        logger.error(`Job handler error: ${queueName}/${job.id}`, error)
        throw error
      }
    })

    queue.on('completed', (job, result) => {
      logger.info(`✓ Job succeeded: ${queueName}/${job.id}`)
    })

    this.workers.set(queueName, { handler, options })
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
      removeOnComplete = true
    } = options

    const queue = this.getQueue(queueName)

    try {
      const job = await queue.add(data, {
        priority,
        delay,
        attempts,
        backoff,
        removeOnComplete
      })

      logger.info(`✓ Job enqueued: ${queueName}/${job.id}`)
      return job.id
    } catch (error) {
      logger.error(`Failed to enqueue job: ${queueName}`, error)
      throw error
    }
  }

  /**
   * Get queue stats
   */
  async getQueueStats(queueName) {
    const queue = this.getQueue(queueName)

    return {
      name: queueName,
      waiting: await queue.getWaitingCount(),
      active: await queue.getActiveCount(),
      completed: await queue.getCompletedCount(),
      failed: await queue.getFailedCount(),
      delayed: await queue.getDelayedCount()
    }
  }

  /**
   * Get all queue stats
   */
  async getAllStats() {
    const stats = {}
    for (const [name] of this.queues) {
      stats[name] = await this.getQueueStats(name)
    }
    return stats
  }

  /**
   * Pause queue processing
   */
  async pauseQueue(queueName) {
    const queue = this.getQueue(queueName)
    await queue.pause()
    logger.info(`Queue paused: ${queueName}`)
  }

  /**
   * Resume queue processing
   */
  async resumeQueue(queueName) {
    const queue = this.getQueue(queueName)
    await queue.resume()
    logger.info(`Queue resumed: ${queueName}`)
  }

  /**
   * Clear queue
   */
  async clearQueue(queueName) {
    const queue = this.getQueue(queueName)
    await queue.empty()
    logger.info(`Queue cleared: ${queueName}`)
  }

  /**
   * Shutdown all queues (graceful)
   */
  async shutdown() {
    logger.info('Shutting down message queues...')
    for (const [name, queue] of this.queues) {
      await queue.close()
      logger.info(`✓ Queue closed: ${name}`)
    }
  }
}

let queueManager = null

export function getQueueManager(redisUrl) {
  if (!queueManager) {
    queueManager = new MessageQueueManager(redisUrl)
  }
  return queueManager
}

export { MessageQueueManager }
```

### Step 3: Define Job Handlers

**services/jobHandlers.js:**

```javascript
import { getLogger } from '../lib/logger.js'
import { sendEmail } from './emailService.js'
import { trackAnalytics } from './analyticsService.js'
import { db } from '../lib/database.js'

const logger = getLogger('JobHandlers')

export const jobHandlers = {
  // Email notifications
  sendProfileUpdateEmail: async (data) => {
    const { wallet, updates } = data
    const user = await db.findUserByWallet(wallet)

    await sendEmail({
      to: user.email,
      subject: 'Your PayTray profile was updated',
      template: 'profile-update',
      data: { name: user.name, updates }
    })

    logger.info(`✓ Email sent to ${user.email}`)
  },

  // Payment notifications
  sendPaymentReceivedEmail: async (data) => {
    const { recipientWallet, senderName, amount, tokenSymbol } = data
    const recipient = await db.findUserByWallet(recipientWallet)

    await sendEmail({
      to: recipient.email,
      subject: `You received a payment stream from ${senderName}`,
      template: 'payment-received',
      data: { senderName, amount, tokenSymbol }
    })
  },

  // Analytics
  recordUserActivity: async (data) => {
    const { wallet, action, metadata } = data

    await trackAnalytics({
      userId: wallet,
      event: action,
      timestamp: new Date(),
      metadata
    })

    logger.debug(`✓ Activity recorded: ${wallet} - ${action}`)
  },

  // Cleanup jobs
  cleanupOldCalls: async (data) => {
    const { daysOld = 30 } = data
    const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000)

    const deleted = await db.deleteVideoCalls({
      endedAt: { $lt: cutoff }
    })

    logger.info(`✓ Cleaned up ${deleted} old video calls`)
  },

  // Report generation
  generateMonthlyReport: async (data) => {
    const { wallet, month } = data

    const stats = await db.getUserStats(wallet, month)

    const report = {
      wallet,
      month,
      totalStreamsCreated: stats.streams,
      totalAmountStreamed: stats.amount,
      totalEarnings: stats.earnings,
      generatedAt: new Date()
    }

    await db.saveReport(report)

    logger.info(`✓ Monthly report generated for ${wallet}`)
  }
}

export async function registerJobHandlers(queueManager) {
  const handlers = jobHandlers

  for (const [jobName, handler] of Object.entries(handlers)) {
    queueManager.registerProcessor(jobName, handler, {
      concurrency: jobName.includes('email') ? 10 : 5,
      attempts: jobName.includes('email') ? 3 : 1,
      backoff: {
        type: 'exponential',
        delay: jobName.includes('email') ? 2000 : 1000
      }
    })

    logger.info(`✓ Registered handler: ${jobName}`)
  }
}
```

### Step 4: Enqueue Jobs from Backend

**Example in server.js:**

```javascript
import { getQueueManager } from './lib/messageQueue.js'
import { registerJobHandlers } from './services/jobHandlers.js'

// Initialize queue manager
const queueManager = getQueueManager(process.env.REDIS_URL)
await registerJobHandlers(queueManager)

// When user updates profile
app.post('/api/profiles/:wallet', async (req, res) => {
  const { wallet } = req.params
  const updates = req.body

  // Update database
  const profile = await db.updateProfile(wallet, updates)

  // Queue email job (async, doesn't block response)
  await queueManager.enqueueJob('sendProfileUpdateEmail', {
    wallet,
    updates
  })

  res.json({ success: true, profile })
})

// When payment stream created
app.post('/api/streams', async (req, res) => {
  const stream = await sablierService.createStream(req.body)

  // Queue notification email
  await queueManager.enqueueJob('sendPaymentReceivedEmail', {
    recipientWallet: stream.recipient,
    senderName: stream.senderName,
    amount: stream.amount,
    tokenSymbol: stream.token
  })

  // Queue analytics
  await queueManager.enqueueJob('recordUserActivity', {
    wallet: stream.sender,
    action: 'stream_created',
    metadata: { streamId: stream.id, amount: stream.amount }
  })

  res.json({ success: true, stream })
})
```

### Step 5: Worker Process

**workers/index.js:**

```javascript
import dotenv from 'dotenv'
import { getQueueManager } from '../lib/messageQueue.js'
import { registerJobHandlers } from '../services/jobHandlers.js'
import { getLogger } from '../lib/logger.js'

dotenv.config()

const logger = getLogger('Worker')

async function startWorker() {
  logger.info('🚀 Starting job worker...')

  const queueManager = getQueueManager(process.env.REDIS_URL)
  await registerJobHandlers(queueManager)

  logger.info('✓ Job handlers registered')

  // Log queue stats every 30 seconds
  setInterval(async () => {
    const stats = await queueManager.getAllStats()
    logger.info('Queue stats:', JSON.stringify(stats, null, 2))
  }, 30000)

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully...')
    await queueManager.shutdown()
    process.exit(0)
  })

  process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully...')
    await queueManager.shutdown()
    process.exit(0)
  })
}

startWorker().catch((error) => {
  logger.error('Worker startup failed', error)
  process.exit(1)
})
```

### Step 6: Update package.json

```json
{
  "scripts": {
    "dev": "node server.js",
    "start": "node server.js",
    "worker": "node workers/index.js",
    "worker:dev": "nodemon workers/index.js"
  },
  "dependencies": {
    "bull": "^4.11.0",
    "redis": "^4.6.0"
  }
}
```

### Step 7: Update Procfile

```
web: npm start
worker: npm run worker
```

---

## 📊 Job Types Reference

### Critical (Retry 3x)
- Email notifications (attempts: 3, delay: 2s exponential)
- Payment notifications (attempts: 3, delay: 2s exponential)

### Important (Retry 1x)
- Analytics recording (attempts: 1, delay: 1s)
- Webhook delivery (attempts: 1, delay: 1s)

### Background (No retry)
- Cleanup jobs (attempts: 1)
- Report generation (attempts: 1)

---

## 📈 Monitoring Queue Health

### Add Health Check Endpoint

```javascript
app.get('/api/queue/health', async (req, res) => {
  const queueManager = getQueueManager()
  const stats = await queueManager.getAllStats()

  const health = {
    status: 'healthy',
    queues: stats,
    recommendation: ''
  }

  // Check for problems
  const totalWaiting = Object.values(stats).reduce((sum, q) => sum + q.waiting, 0)
  const totalFailed = Object.values(stats).reduce((sum, q) => sum + q.failed, 0)

  if (totalWaiting > 1000) {
    health.status = 'warning'
    health.recommendation = 'Queue backlog building up, increase worker concurrency'
  }

  if (totalFailed > 100) {
    health.status = 'critical'
    health.recommendation = 'Many jobs failing, investigate job handler errors'
  }

  res.json(health)
})
```

### Slack Alerts

```javascript
async function checkQueueHealth() {
  const stats = await queueManager.getAllStats()

  for (const [queueName, queueStats] of Object.entries(stats)) {
    if (queueStats.failed > 50) {
      await sendSlackAlert({
        channel: '#engineering',
        message: `🚨 Queue Alert: ${queueName} has ${queueStats.failed} failed jobs`
      })
    }
  }
}

// Run health check every 5 minutes
setInterval(checkQueueHealth, 5 * 60 * 1000)
```

---

## 🔄 Comparison: Bull vs RabbitMQ

| Feature | Bull | RabbitMQ |
|---------|------|----------|
| **Setup** | Easy | Complex |
| **Dependencies** | Redis only | Separate server |
| **Scalability** | 1000s jobs/sec | 100k+ jobs/sec |
| **Reliability** | High | Very High |
| **Cost** | Free (Redis) | Free (self-hosted) |
| **Best For** | Startups, MVPs | Enterprise, high volume |

**Recommendation:** Start with Bull, migrate to RabbitMQ when throughput exceeds 10k jobs/day

---

## ✅ Checklist

- [ ] Bull and Redis installed
- [ ] MessageQueue manager created
- [ ] Job handlers defined
- [ ] Worker process set up
- [ ] Jobs enqueued from main app
- [ ] Procfile updated with worker dyno
- [ ] Queue health monitoring added
- [ ] Graceful shutdown tested
- [ ] Staging deployment verified
- [ ] Production deployment verified

---

**Message Queues: The backbone of reliable async operations. ✓**

