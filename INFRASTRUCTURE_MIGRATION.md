# 🚀 Infrastructure Migration Guide: Heroku → DigitalOcean

**Savings:** 70-80% cost reduction while improving performance

---

## 📊 Cost Comparison

| Component | Heroku | DigitalOcean | Savings |
|-----------|--------|-------------|---------|
| 2x Web Dynos | $100/mo | $24/mo | 76% |
| 1x Worker Dyno | $50/mo | $12/mo | 76% |
| PostgreSQL Standard-0 | $50/mo | $15/mo | 70% |
| Redis (Premium) | $30/mo | $12/mo | 60% |
| **Total/Month** | **$230** | **$63** | **73%** |
| **Annual** | **$2,760** | **$756** | **73%** |

---

## 🏗️ Architecture on DigitalOcean

```
┌────────────────────────────────────────┐
│   Vercel CDN (Frontend)                │
│   paytray.io                           │
└────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────┐
│   DigitalOcean App Platform or         │
│   Kubernetes (DOKS)                    │
│   - Backend API (3x $12/mo containers) │
│   - Worker Queue (1x $12/mo container) │
└────────────────────────────────────────┘
              ↓
┌──────────────────────┬──────────────────┐
│  PostgreSQL 14       │ Redis 7          │
│  (Managed DB)        │ (Managed Cache)  │
│  $15/mo              │ $12/mo           │
└──────────────────────┴──────────────────┘
```

---

## 1️⃣ Create DigitalOcean Infrastructure

### Step 1: Set Up Managed Database

```bash
# 1. Go to DigitalOcean dashboard → Databases
# 2. Create PostgreSQL 14 database cluster
#    - Name: paytray-db
#    - Region: nyc3 (or nearest)
#    - Plan: Basic (db-s-1vcpu-1gb) = $15/mo

# 3. Create test database
# Access via connection string provided

# 4. Enable backups
# Settings → Backups → Enable daily backups

# 5. Enable automated failover (if using Premium)
```

### Step 2: Set Up Redis Cache

```bash
# 1. Go to DigitalOcean dashboard → Databases
# 2. Create Redis 7 database
#    - Name: paytray-cache
#    - Region: same as PostgreSQL
#    - Plan: Basic (db-s-1vcpu-1gb) = $12/mo

# 3. Enable persistence
# Settings → Persistence → RDB

# 4. Enable authentication
# Settings → Advanced → Require password
```

### Step 3: Create App Platform Project

```bash
# Using DigitalOcean App Platform (PaaS - easier than VPS)

# 1. Go to DigitalOcean dashboard → App Platform
# 2. Create new app
# 3. Connect your GitHub repository
# 4. Configure services:

# Service 1: Web API
# - Source: GitHub (packages/backend)
# - Build command: npm run build
# - Run command: npm start
# - HTTP port: 3001
# - Health check: /health
# - Instance count: 3
# - Instance size: Basic (512MB RAM, $0.0066/hr = ~$50/mo for 3)

# Service 2: Worker Queue
# - Same as above but run: npm run worker
# - Instance count: 1
# - Instance size: Basic

# Service 3: Frontend (optional if using Vercel)
# - Better to keep on Vercel

# Environment variables:
# NODE_ENV=production
# DATABASE_URL=postgresql://... (from managed DB)
# REDIS_URL=redis://... (from managed Redis)
# [All other env vars from .env.production]
```

---

## 2️⃣ Migration Steps

### Pre-Migration Checklist

```bash
# 1. Back up current Heroku database
heroku pg:backups:capture --app paytray-backend-prod
heroku pg:backups:download --app paytray-backend-prod

# 2. Document all environment variables
heroku config --app paytray-backend-prod > heroku-config.txt

# 3. Ensure all tests pass
npm run test

# 4. Create Git tag for this version
git tag -a release-do-migration -m "Heroku to DigitalOcean migration"
git push origin release-do-migration
```

### Migration Process

**Phase 1: Deploy to DigitalOcean (Parallel Run)**

```bash
# 1. Push to DigitalOcean App Platform
# App Platform auto-deploys from GitHub

# 2. Run migrations on new database
# In App Platform dashboard → Worker service → Run command:
# npm run migrate

# 3. Test endpoints
curl https://api-do.paytray.io/health

# 4. Verify database migrations
# Connect to PostgreSQL and run:
SELECT * FROM schema_migrations ORDER BY executed_at DESC;
```

**Phase 2: Update DNS (Gradual Traffic Switch)**

```bash
# Option A: Gradual traffic switch (recommended)
# 1. Add DigitalOcean endpoint to DNS with weight
# 2. Gradually increase traffic over 1-2 hours
# 3. Monitor both endpoints for errors

# Option B: Full switch (faster but riskier)
# 1. Update DNS CNAME to point to DigitalOcean
# api.paytray.io CNAME -> paytray-backend-...-ondigitalocean.app

# Option C: Canary deploy (safest)
# 1. Keep Heroku as primary
# 2. Route 10% traffic to DigitalOcean
# 3. Monitor errors
# 4. Gradually increase to 100%
```

**Phase 3: Verify & Cutover**

```bash
# 1. Monitor error rates
# Sentry dashboard → Check for spike
# Should be < 0.1% error rate

# 2. Check database consistency
# Run queries comparing Heroku vs DigitalOcean

# 3. Decommission Heroku (after 24-48 hours verification)
heroku apps:destroy --app paytray-backend-prod --confirm
```

---

## 3️⃣ Configuration Changes

### Update Backend Config

```javascript
// lib/config.js changes
export const config = {
  // ... existing config ...
  
  // New Redis configuration
  redis: {
    enabled: process.env.REDIS_ENABLED === 'true',
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    // Example: redis://default:password@paytray-cache-...-ondigitalocean.com:25061
  },

  // DigitalOcean-specific settings
  digitalocean: {
    enabled: true,
    region: process.env.DO_REGION || 'nyc3',
    appName: process.env.DO_APP_NAME || 'paytray',
  },

  // Database changes for DigitalOcean
  database: {
    // ...
    ssl: {
      rejectUnauthorized: true, // DigitalOcean requires SSL
    },
  },
}
```

### Update Environment Variables

```bash
# .env.production (DigitalOcean)

# Database (Managed PostgreSQL on DigitalOcean)
DATABASE_URL=postgresql://paytray_user:password@db-...-ondigitalocean.com:25060/paytray_prod?sslmode=require

# Redis (Managed Redis on DigitalOcean)
REDIS_ENABLED=true
REDIS_URL=redis://default:password@cache-...-ondigitalocean.com:25061

# Connection pooling tuned for DigitalOcean
DB_POOL_MIN=5
DB_POOL_MAX=15  # Lower than Heroku since we have dedicated DB
DB_POOL_IDLE_TIMEOUT=30000

# Rate limiting now uses Redis
RATE_LIMIT_PROVIDER=redis
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000  # Can increase with Redis

# Health check for App Platform
HEALTH_CHECK_INTERVAL=30s
```

---

## 4️⃣ Scaling on DigitalOcean

### Horizontal Scaling (More Instances)

```bash
# In DigitalOcean App Platform dashboard:

# 1. Increase web service replicas
# Services → Backend → Instance count → 3 (or more)

# 2. Add second worker
# Services → Worker → Instance count → 2

# Load is automatically balanced across instances
# With Redis rate limiting, scales to 10,000+ RPS
```

### Vertical Scaling (Bigger Instances)

```bash
# If you need more CPU/RAM per instance:

# 1. Stop current deployment
# 2. Change instance size (Basic → Professional)
# 3. Re-deploy

# Pricing:
# - Basic: 512MB RAM / 0.25 CPU = $6/mo
# - Professional: 2GB RAM / 2 CPU = $50/mo
# - Premium: 4GB RAM / 4 CPU = $100/mo
```

### Database Scaling

```bash
# PostgreSQL vertical scaling
# Databases → paytray-db → Resize

# Add read replicas for better read performance
# Databases → paytray-db → Settings → Add read replica

# Add Redis persistence
# Databases → paytray-cache → Settings → Persistence
```

---

## 5️⃣ Monitoring on DigitalOcean

### Built-in Monitoring

```bash
# DigitalOcean App Platform provides:
# - CPU usage
# - Memory usage
# - HTTP request rate
# - Error rate
# - Logs streaming

# Access via: Dashboard → App → Metrics
```

### Enhanced Monitoring

```bash
# 1. Enable Sentry APM (already configured)
# https://sentry.io → Paytra project

# 2. Add DataDog integration (optional)
# Provides deeper insights for $50/mo

# 3. Set up alerts
# Alert if CPU > 80%
# Alert if error rate > 1%
# Alert if response time > 1s
```

### Log Management

```bash
# DigitalOcean App Platform provides logs
# But for long-term retention, use:
# - Papertrail (via Heroku plugin)
# - LogDNA
# - CloudWatch

# Configure in app:
# Environment → Add log forwarding
```

---

## 6️⃣ Disaster Recovery

### Automated Backups

```bash
# PostgreSQL backups (automatic)
# Databases → paytray-db → Backups
# - Daily automatic backups (7-day retention)
# - Manual backup before major changes

# Redis persistence
# Databases → paytray-cache → Settings → Persistence
# - RDB snapshots every 6 hours
```

### Recovery Process

```bash
# If database needs recovery:

# 1. Create new PostgreSQL cluster from backup
# Databases → paytray-db → Backups → Restore

# 2. Update DATABASE_URL in app
# App Platform → Settings → Environment

# 3. Re-deploy app
# App Platform → Deploy

# Total recovery time: 5-10 minutes
```

---

## 7️⃣ Rollback Plan

If DigitalOcean migration goes wrong:

```bash
# Within 24 hours:

# 1. Revert DNS
# api.paytray.io → Heroku endpoint

# 2. Existing Heroku backup
# Latest backup from Heroku is still available

# Total rollback time: < 5 minutes

# After 48 hours: Heroku app is destroyed, no rollback possible
# (Keep Heroku running in parallel for 48 hours if doing canary deploy)
```

---

## 8️⃣ Cost Tracking

### Monthly Cost Breakdown

```
DigitalOcean App Platform:
├─ 3x Web containers ($12/mo each) = $36/mo
├─ 1x Worker container = $12/mo
├─ Managed PostgreSQL DB = $15/mo
├─ Managed Redis = $12/mo
├─ Storage (100GB) = $10/mo
└─ Total = ~$85/mo (vs. $230 on Heroku)

Annual savings: ~$1,740
```

### Cost Optimization Tips

```bash
# 1. Scale down during off-peak hours
# Set up auto-scaling rules

# 2. Use spot instances (cheaper but less reliable)
# Not recommended for production

# 3. Consolidate services
# Run multiple services per container

# 4. Cache aggressively
# Reduce database queries (Redis helps)

# 5. Monitor costs
# DigitalOcean → Billing → Set spending alert at $150/mo
```

---

## 9️⃣ Post-Migration Verification

### Day 1: Immediate Checks

```bash
# ✓ Health check endpoint responds
curl https://api.paytray.io/health

# ✓ Sentry shows no critical errors
# Sentry dashboard → Filter by last hour

# ✓ Database queries working
# Check slowest queries

# ✓ Rate limiting working with Redis
# Make 150 requests in quick succession, should get 429

# ✓ Redis cache hit rate > 70%
# Monitor cache efficiency
```

### Week 1: Performance Baseline

```bash
# ✓ Response times stable (should be same or faster)
# Sentry APM → Compare Heroku vs DO

# ✓ Error rate < 0.1%
# Sentry → Recent errors

# ✓ Cost tracking
# DigitalOcean billing → Verify at expected price

# ✓ Scalability
# Load test to 1000 concurrent users
# Should handle without issues
```

---

## 🔟 DigitalOcean Specific Features

### Kubernetes vs App Platform

**App Platform (Simpler, Recommended for MVP):**
- Fully managed
- Auto-scaling built-in
- Simple deployment from GitHub
- Good for startups

**Kubernetes (More Control, Recommended for Enterprise):**
- Full control
- Can optimize costs further
- Steeper learning curve
- Use when you need custom resource allocation

```bash
# To migrate App Platform → Kubernetes later:
# 1. Create DOKS (DigitalOcean Kubernetes Service)
# 2. Create Docker images
# 3. Deploy via Helm charts
# Cost: Similar or slightly lower
```

---

## ✅ Checklist: Heroku → DigitalOcean

- [ ] DigitalOcean account created
- [ ] PostgreSQL managed database created
- [ ] Redis managed cache created
- [ ] DigitalOcean App Platform project created
- [ ] GitHub connected for auto-deploy
- [ ] Environment variables configured
- [ ] Database backup taken
- [ ] Backend deployed to DigitalOcean
- [ ] Migrations run successfully
- [ ] Health check passing
- [ ] Parallel run with Heroku (1-2 hours)
- [ ] DNS gradually switched
- [ ] Monitoring verified
- [ ] Error rates checked (should be < 0.1%)
- [ ] Heroku app destroyed (after 48h verification)
- [ ] Cost verified at ~$85/mo
- [ ] Team trained on new infrastructure
- [ ] Runbooks updated with DO procedures
- [ ] Disaster recovery tested

---

## 📞 Support

- **DigitalOcean Docs:** https://docs.digitalocean.com
- **App Platform Guide:** https://docs.digitalocean.com/products/app-platform
- **Pricing:** https://www.digitalocean.com/pricing
- **Support:** DigitalOcean → Help → Support

---

**PayTray Infrastructure Migration: Complete ✓**

Cost savings: 73% annually  
Migration time: 2-4 hours  
Complexity: Medium  
