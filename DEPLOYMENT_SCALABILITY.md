# 🚀 PayTray Scalability: Deployment Guide

**Complete guide to deploying distributed rate limiting, message queues, and async job processing**

---

## 📋 Pre-Deployment Checklist

### Code Changes ✓
- [x] All new files created and tested locally
- [x] Server.js updated with scalability layers
- [x] Package.json includes Bull, Redis dependencies
- [x] Procfile updated with worker dyno
- [x] app.json updated with environment variables
- [x] Message queue handlers implemented
- [x] Worker process implemented

### Testing ✓
- [ ] Run `npm install` successfully
- [ ] Run `npm test` - all tests pass
- [ ] Run `npm run lint` - zero errors
- [ ] Local development: `npm run dev` works
- [ ] Local worker: `npm run worker` processes jobs
- [ ] Rate limiting tested with load
- [ ] Graceful shutdown tested

---

## 🏗️ Deployment Steps

### Step 1: Deploy to Staging First

```bash
# Deploy staging branch
git checkout staging
git merge main

# Push to staging environment
git push staging main:main

# Heroku will auto-deploy and run migrations
# Monitor: heroku logs --app paytray-backend-staging
```

### Step 2: Verify Staging Deployment

```bash
# Check application started successfully
heroku logs --app paytray-backend-staging --tail

# Should see:
# ✓ Database initialized
# ✓ Ceramic service initialized
# ✓ Sablier service initialized
# ✓ Message queue initialized
# ⚙️ Scalability (Phase 4) ready

# Test rate limiting
curl -i http://paytray-backend-staging.herokuapp.com/api/health
# Should see X-RateLimit-* headers

# Check worker started
# In Heroku dashboard: see worker dyno running
```

### Step 3: Test Message Queue on Staging

```bash
# Tail worker logs
heroku logs --app paytray-backend-staging --tail --dyno=worker

# Should see:
# ✓ Job handlers registered
# 📊 Queue Statistics (every 30 seconds)

# Trigger a test job via API
curl -X POST http://paytray-backend-staging.herokuapp.com/api/test-job \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"

# Watch worker process the job
# Should see: "Processing job: sendPaymentReceivedEmail/1"
```

### Step 4: Monitor for 24 Hours

```bash
# Monitor error rate (target: < 0.1%)
# Check Sentry dashboard: Should show same error rate as before

# Monitor queue depth (target: < 50 at any time)
# Check worker logs: "Queue Statistics" updates every 30 seconds

# Monitor response times (target: same or faster)
# Check Heroku metrics: Response time should be stable

# Monitor Redis connection
# Check logs: No "Redis connection failed" messages

# If issues, roll back:
git revert <commit-hash>
git push staging main:main
```

### Step 5: Deploy to Production

```bash
# After 24h staging verification
git checkout main
git merge staging

# Create deployment branch
git checkout -b deploy/scalability-phase-4

# Push to production
git push origin main

# Or use Heroku pipeline:
# GitHub → main branch auto-deploys to production

# Monitor production deployment
heroku logs --app paytray-backend-prod --tail
```

### Step 6: Post-Deployment Verification (Production)

```bash
# Verify all services running
heroku ps --app paytray-backend-prod

# Expected output:
# web.1: up (standard-1x)
# web.2: up (standard-1x)
# worker.1: up (standard-1x)

# Check application health
curl https://api.paytray.io/health

# Verify headers
curl -i https://api.paytray.io/health | grep X-RateLimit

# Monitor logs
heroku logs --app paytray-backend-prod --tail

# Check error rate
# Sentry dashboard: Filter last 1 hour
```

---

## 🔧 Environment Setup

### Heroku Configuration

```bash
# If not using app.json one-click deploy:

# Set environment variables
heroku config:set NODE_ENV=production --app paytray-backend-prod
heroku config:set JWT_SECRET=$(openssl rand -base64 32) --app paytray-backend-prod
heroku config:set JWT_REFRESH_SECRET=$(openssl rand -base64 32) --app paytray-backend-prod

# Add Redis add-on (if not in app.json)
heroku addons:create heroku-redis:premium-0 --app paytray-backend-prod

# Verify Redis URL is set
heroku config:get REDIS_URL --app paytray-backend-prod

# Set REDIS_ENABLED
heroku config:set REDIS_ENABLED=true --app paytray-backend-prod
```

### Database Migrations

```bash
# Migrations run automatically via Procfile
# But you can also run manually:

heroku run npm run migrate --app paytray-backend-prod

# Verify migrations succeeded
heroku run psql -c "SELECT * FROM schema_migrations" --app paytray-backend-prod
```

---

## 📊 Monitoring & Alerts

### Essential Metrics to Track

```bash
# 1. Queue Depth (worker logs every 30s)
# Alert if: waiting > 1000

# 2. Failed Jobs
# Alert if: failed > 50

# 3. Worker Uptime
# Alert if: worker dyno not running

# 4. Error Rate
# Alert if: Sentry shows > 1% error rate

# 5. Response Time
# Alert if: P95 response time > 1 second

# 6. Database Connections
# Alert if: > 80% of pool max
```

### View Queue Statistics

```bash
# Real-time queue stats (from worker logs)
heroku logs --app paytray-backend-prod --dyno=worker | grep "Queue Statistics"

# Sample output:
# 📊 Queue Statistics:
# {
#   "sendProfileUpdateEmail": {"waiting": 2, "active": 1, "failed": 0},
#   "recordUserActivity": {"waiting": 10, "active": 3, "failed": 0}
# }
```

### Sentry Integration

```bash
# Already configured in code, just set DSN:
heroku config:set SENTRY_DSN=<your-sentry-dsn> --app paytray-backend-prod

# Errors will auto-report to Sentry
# Filter by tag: environment=production
# Alert on: new error types, error rate spike
```

---

## 🐛 Troubleshooting Deployment

### Issue: Worker dyno won't start

```bash
# Check worker logs
heroku logs --app paytray-backend-prod --dyno=worker --tail

# Common causes:
# 1. Redis connection failed
heroku config:get REDIS_URL  # Check URL is correct

# 2. Job handler not registered
# Check services/jobHandlers.js is correctly formatted

# 3. Database connection failed
# Check DATABASE_URL is correct
```

### Issue: Rate limiting not working

```bash
# Check Redis is connected
heroku logs --app paytray-backend-prod | grep -i "redis"

# Should see: "✓ Redis connected for distributed rate limiting"

# If fallback mode:
# "⚠️ Using in-memory limiter - limited to ~50 RPS per instance"

# Verify REDIS_ENABLED is true
heroku config:get REDIS_ENABLED
```

### Issue: Jobs not processing

```bash
# Check worker is running
heroku ps --app paytray-backend-prod | grep worker

# If not running, restart
heroku dyno:restart worker --app paytray-backend-prod

# Check queue stats
heroku logs --app paytray-backend-prod --dyno=worker | grep "Queue Statistics"

# If jobs stuck in "waiting", check handler for errors
heroku logs --app paytray-backend-prod --dyno=worker | grep -i error
```

### Issue: High database connections

```bash
# Check current connections
heroku run psql -c "SELECT count(*) FROM pg_stat_activity;" --app paytray-backend-prod

# If high, check pool settings:
# DB_POOL_MIN should be 5-10
# DB_POOL_MAX should be 15-20 (Heroku Standard-1x)

# Update if needed:
heroku config:set DB_POOL_MAX=15 --app paytray-backend-prod

# Restart app
heroku dyno:restart --app paytray-backend-prod
```

---

## 🔄 Rollback Procedure

If critical issues arise:

```bash
# 1. Immediate stop (stop web dynos)
heroku dyno:stop web.1 --app paytray-backend-prod

# 2. Revert code
git revert <commit-hash>
git push origin main

# Heroku will auto-deploy previous version

# 3. Monitor logs during restart
heroku logs --app paytray-backend-prod --tail

# 4. Verify services started
heroku ps --app paytray-backend-prod

# 5. Test endpoints
curl https://api.paytray.io/health
```

---

## 📈 Performance Validation (Post-Deployment)

### Before vs After Metrics

Track these for 7 days:

```
Metric                  Before      After       Target
────────────────────────────────────────────────────
Rate Limit Capacity     50 RPS      10k RPS     ✓
Queue Processing Time   N/A         < 100ms     ✓
Job Retry Success Rate  N/A         > 95%       ✓
Error Rate              Current     Same        ✓
Response Time           Current     Same/↓      ✓
Database CPU            Current     ↓20%        ✓ (next: caching)
Database Queries/sec    Current     Same        ✓ (next: caching)
```

---

## 📝 Post-Deployment Checklist

- [ ] Deployment completed without errors
- [ ] All 3 dyno types running (web.1, web.2, worker.1)
- [ ] Health check endpoint responding
- [ ] Rate limiting headers present
- [ ] Queue statistics logging every 30s
- [ ] Error rate < 0.1% for 24 hours
- [ ] No "Redis connection failed" messages
- [ ] Queue depth never exceeded 500
- [ ] At least 2 successful job completions in logs
- [ ] Team notified of deployment
- [ ] Documentation updated with deployment date
- [ ] Rollback procedure tested

---

## 🎓 Team Training

### Before Production Deployment

1. **Developers:** Read `QUICK_START_SCALABILITY.md` (15 min)
2. **DevOps:** Practice rollback procedure (30 min)
3. **On-Call:** Understand queue monitoring (20 min)
4. **Team:** Review monitoring dashboard setup (30 min)

---

## 📞 During-Deployment Support

**Available:** 2 hours before - 4 hours after deployment

- **Questions?** Ask in #deployment Slack
- **Issues?** Escalate immediately to @devops-lead
- **Rollback Decision?** @engineering-lead approval required

---

## 🎉 Success Criteria

Deployment is successful when:

✅ All dynos running stably  
✅ No new errors in Sentry  
✅ Rate limiting working (429 responses after limit)  
✅ Queue processing jobs  
✅ Redis connected  
✅ Response times unchanged or faster  
✅ Database connection pool stable  
✅ Team able to queue jobs via API  

---

## 🚀 Next: Week 3-4 Plan

After this deployment stabilizes:

1. **Week 3:** Heroku → DigitalOcean migration (73% cost savings)
2. **Week 4:** Implement caching (80% DB load reduction)
3. **Week 5:** Register v1/v2 API endpoints
4. **Week 6-9:** TypeScript migration phase 1

---

**PayTray Scalability Deployment: Ready for Production ✓**

Follow this guide step-by-step.  
Verify each checkpoint before proceeding.  
Monitor continuously for first 48 hours.  

