# ⚡ PayTray Scalability: Quick Reference Guide

**Fast implementation guide for new infrastructure features**

---

## 🚀 Start Here: 3-Minute Setup

### Prerequisites
```bash
# Install Redis (one of these)
brew install redis              # macOS
sudo apt-get install redis-server  # Linux
docker run redis:7 -p 6379:6379  # Docker

# Verify Redis is running
redis-cli ping  # Should return: PONG
```

### Environment Variables (.env.production)
```
REDIS_ENABLED=true
REDIS_URL=redis://localhost:6379
NODE_ENV=production
```

### Start Services
```bash
# Terminal 1: Start backend
npm run dev

# Terminal 2: Start worker (in packages/backend/)
npm run worker:dev

# Check: Both should show initialization messages
```

---

## 📨 Queue Jobs: Copy & Paste Examples

### Example 1: Send Email Notification
```javascript
import { getQueueManager } from './lib/messageQueue.js'

// In your endpoint handler
const queueManager = getQueueManager()

await queueManager.enqueueJob('sendPaymentReceivedEmail', {
  recipientUserId: recipient.id,
  senderName: 'John Doe',
  amount: 1000,
  tokenSymbol: 'USDC'
})

res.json({ success: true, message: 'Payment sent, notification queued' })
```

### Example 2: Track User Activity
```javascript
await queueManager.enqueueJob('recordUserActivity', {
  userId: req.user.id,
  action: 'stream_created',
  metadata: { streamId: stream.id, amount: stream.amount }
})
```

### Example 3: Scheduled Cleanup (Runs hourly)
```javascript
// Queue cleanup job to run once per day (UTC midnight)
const tomorrow = new Date()
tomorrow.setUTCHours(0, 0, 0, 0)
tomorrow.setDate(tomorrow.getDate() + 1)

const delayMs = tomorrow.getTime() - Date.now()

await queueManager.enqueueJob('cleanupOldCalls', {
  daysOld: 30
}, {
  delay: delayMs,
  attempts: 2
})
```

---

## 🔐 Rate Limiting: Already Works

**Automatic for all endpoints:**
- Global: 100 requests/min per IP
- Auth endpoint: 10 requests/min per wallet
- Returns: HTTP 429 with retry headers

**Headers Returned:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1720281600
```

**For Custom Limits:**
```javascript
import { createRateLimitMiddleware } from './lib/rateLimiter.js'

const strictLimiter = createRateLimitMiddleware({
  windowMs: 60000,      // 1 minute
  maxRequests: 5,       // 5 per minute
  keyGenerator: (req) => req.user.wallet,
  redisEnabled: true
})

app.post('/api/expensive-operation', strictLimiter, (req, res) => {
  // This endpoint limited to 5 requests/min per wallet
})
```

---

## 📊 Monitor Queue Health

### View Queue Stats
```javascript
// In any handler
const queueManager = getQueueManager()
const stats = await queueManager.getAllStats()

console.log(stats)
// Output:
// {
//   sendProfileUpdateEmail: { waiting: 5, active: 2, completed: 100, failed: 0 },
//   recordUserActivity: { waiting: 50, active: 5, completed: 5000, failed: 2 }
// }
```

### Health Check Endpoint
```bash
curl http://localhost:3001/api/queue/health

# Response:
{
  "status": "healthy",
  "queues": {
    "sendProfileUpdateEmail": { "waiting": 0, "active": 0, "failed": 0 },
    "recordUserActivity": { "waiting": 5, "active": 2, "failed": 0 }
  }
}
```

### Worker Logs (Auto-updates every 30 seconds)
```
📊 Queue Statistics:
{
  "sendProfileUpdateEmail": { "waiting": 2, "active": 1, "failed": 0, "paused": false },
  "recordUserActivity": { "waiting": 10, "active": 3, "failed": 0, "paused": false },
  "cleanupOldCalls": { "waiting": 0, "active": 0, "failed": 0, "paused": false }
}
```

---

## 🐛 Troubleshooting

### Issue: "ECONNREFUSED - Redis connection failed"
```bash
# Check Redis is running
redis-cli ping  # Should return PONG

# Or start Redis in Docker
docker run -d -p 6379:6379 redis:7

# Then add to .env
REDIS_URL=redis://localhost:6379
```

### Issue: "Failed to register processor"
```bash
# Ensure worker is running
npm run worker:dev

# Check for error messages in logs
# Should see: "✓ Processor registered: sendProfileUpdateEmail"
```

### Issue: Jobs not processing
```bash
# Check worker is running: npm run worker:dev
# Check queue stats: See if jobs are in "waiting" or "failed"
# Check job handler: Make sure it's registered in services/jobHandlers.js
```

### Issue: Rate limiting too strict
```javascript
// Adjust limits in createRateLimitMiddleware()
const limiter = createRateLimitMiddleware({
  windowMs: 60000,
  maxRequests: 200,  // Increase from 100
  redisEnabled: true
})
```

---

## 📋 Common Tasks

### Add New Job Type

**Step 1:** Add handler in `services/jobHandlers.js`
```javascript
export async function myNewJob(data, job) {
  logger.info(`Processing: ${job.id}`, data)
  // Do work here
  return { success: true }
}
```

**Step 2:** Register in `registerJobHandlers()`
```javascript
queueManager.registerProcessor('myNewJob', myNewJob, {
  concurrency: 5,
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 }
})
```

**Step 3:** Enqueue from endpoint
```javascript
await queueManager.enqueueJob('myNewJob', {
  userId: req.user.id,
  data: 'some data'
})
```

### Pause Queue (Emergency)
```javascript
// In any endpoint
const queueManager = getQueueManager()
await queueManager.pauseQueue('sendPaymentReceivedEmail')

// Later, resume
await queueManager.resumeQueue('sendPaymentReceivedEmail')
```

### Retry Failed Job
```javascript
// In any endpoint
const queueManager = getQueueManager()
await queueManager.retryJob('sendPaymentReceivedEmail', jobId)
```

---

## 🎯 Performance Targets

| Metric | Target | How to Achieve |
|--------|--------|--------|
| **Queue Processing** | < 100ms | Keep handlers light, use async/await |
| **Job Retry Success Rate** | > 95% | Exponential backoff + transient error handling |
| **Worker Uptime** | > 99.9% | Graceful shutdown, auto-restart via systemd |
| **Redis Hit Rate** | > 80% | Monitor and adjust TTLs |
| **Email Delivery** | > 99% | 3 retries + external email service integration |

---

## 🔧 Production Checklist

Before deploying to production:

- [ ] Redis running (managed service recommended)
- [ ] `REDIS_ENABLED=true` in .env.production
- [ ] Worker process running: `npm run worker` (systemd service or PM2)
- [ ] Monitoring alerting on queue depth (warn if > 1000)
- [ ] Alerting on job failures (warn if > 50)
- [ ] Logging integrated with Sentry or similar
- [ ] Dead letter queue setup for persistent failures
- [ ] Email service integrated (SendGrid, Mailgun, etc.)
- [ ] Analytics service integrated (Mixpanel, etc.)
- [ ] Load testing completed
- [ ] Graceful shutdown tested

---

## 📞 Who to Contact

| Issue | Contact |
|-------|---------|
| Queue not processing | @backend-team |
| Redis connection issues | @devops-team |
| Email not sending | @backend-team + email service provider |
| Queue stats are wrong | @engineering-lead |
| Performance degraded | Check logs first, then @devops-team |

---

## 📚 Full Documentation

- **Message Queues:** `MESSAGE_QUEUE_GUIDE.md`
- **Rate Limiting:** `SCALABILITY_ROADMAP.md` (Section: Rate Limiting)
- **Infrastructure:** `INFRASTRUCTURE_MIGRATION.md`
- **Caching:** `CACHING_STRATEGY.md`
- **API Versioning:** `lib/apiVersioning.js` (JSDoc)
- **Overall Roadmap:** `SCALABILITY_ROADMAP.md`

---

**PayTray Scalability: Ready to Scale ⚡**

Get started in 3 minutes. Questions? Check the full docs or ask the team.

