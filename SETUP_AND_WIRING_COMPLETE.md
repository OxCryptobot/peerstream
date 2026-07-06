# 🏗️ PayTray Phase 4: Complete Scaffolding & Setup Guide

**Date:** July 6, 2026  
**Phase:** 4 - Scalability Infrastructure  
**Status:** Complete Scaffolding & Wiring Ready  

---

## 📚 What's Included

This document describes the complete scaffolding, wiring, and plumbing setup for PayTray Phase 4.

### Files Created

| File | Purpose | Type |
|------|---------|------|
| `setup.sh` | One-command project initialization | Bash Script |
| `verify-setup.sh` | Environment verification | Bash Script |
| `start-services.sh` | Start all local dev services | Bash Script |
| `start-backend.sh` | Start backend server | Bash Script |
| `docker-compose.yml` | Local infrastructure | Docker |
| `packages/backend/migrations/001_init.sql` | Database schema | SQL |
| `packages/backend/scripts/db-init.js` | DB initialization | Node.js |
| `packages/backend/routes/queueIntegration.js` | Queue-wired endpoints | Node.js |
| `packages/backend/INTEGRATION_GUIDE.md` | Server.js integration | Documentation |
| `.env.example` | Config template | Config |
| Updated `package.json` | New npm scripts | Config |

---

## 🚀 Quick Start (5 Minutes)

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/OxCryptobot/peerstream.git
cd peerstream

# Run one-time setup
bash setup.sh
```

This will:
- ✅ Create `.env.local` configuration files
- ✅ Install all npm dependencies
- ✅ Start Docker services (PostgreSQL, Redis, LiveKit)
- ✅ Initialize database schema
- ✅ Seed test data (optional)

### 2. Verify Setup

```bash
bash verify-setup.sh
```

This checks:
- ✅ System requirements (Node, npm, Docker)
- ✅ Project structure
- ✅ Environment configuration
- ✅ Database connectivity
- ✅ Redis connectivity

### 3. Start Development Services

**Terminal 1: Start Docker & PostgreSQL**
```bash
bash start-services.sh
```

**Terminal 2: Start Backend Server**
```bash
cd packages/backend
npm run dev
```

**Terminal 3: Start Worker Process**
```bash
cd packages/backend
npm run worker:dev
```

**Terminal 4: Start Frontend**
```bash
cd packages/react-app
npm run dev
```

### 4. Test Health Endpoints

```bash
# Basic health check
curl http://localhost:3001/health

# Queue health check
curl http://localhost:3001/api/queue/health

# View queue statistics
curl http://localhost:3001/api/queue/stats/sendProfileUpdateEmail
```

---

## 📋 Manual Setup (Detailed Steps)

If you prefer manual setup:

### Step 1: Environment Configuration

```bash
# Backend configuration
cp packages/backend/.env.example packages/backend/.env.local

# Edit .env.local with your values:
# - DATABASE_URL=postgresql://postgres:postgres@localhost:5432/paytray
# - REDIS_URL=redis://localhost:6379
# - JWT_SECRET=<generate-random-string>
```

### Step 2: Install Dependencies

```bash
npm install
cd packages/backend && npm install
cd packages/react-app && npm install
cd ../..
```

### Step 3: Start Infrastructure

```bash
# Start Docker services
docker-compose up -d postgres redis pgadmin redis-commander

# Wait for PostgreSQL to be ready
sleep 5
```

### Step 4: Initialize Database

```bash
cd packages/backend
npm run db:init          # Create schema
npm run db:init:seed     # Add test data (optional)
cd ../..
```

### Step 5: Start Services

```bash
# Terminal 1: Backend Server
cd packages/backend
npm run dev

# Terminal 2: Worker Process (separate terminal)
cd packages/backend
npm run worker:dev

# Terminal 3: Frontend (separate terminal)
cd packages/react-app
npm run dev
```

---

## 🔗 Service Endpoints

### Backend API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Basic health check |
| `/api/health/detailed` | GET | Detailed system status |
| `/api/queue/health` | GET | Queue system status |
| `/api/queue/stats/:queueName` | GET | Queue statistics |
| `/api/queue/pause/:queueName` | POST | Pause queue (admin) |
| `/api/queue/resume/:queueName` | POST | Resume queue (admin) |
| `/api/profiles/:wallet` | POST | Update profile (queues email) |
| `/api/streams` | POST | Create payment stream (queues notifications) |
| `/api/maintenance/cleanup` | POST | Trigger cleanup job (admin) |

### Development URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001 |
| PgAdmin | http://localhost:5050 (admin/admin) |
| Redis Commander | http://localhost:8081 |

---

## 🧵 Wiring & Integration

### Message Queue Integration

The system is wired so that endpoints automatically queue jobs:

#### 1. Profile Update → Email Notification

```javascript
// When POST /api/profiles/:wallet
// Automatically queues: sendProfileUpdateEmail
// - User receives email when profile is updated
// - Retries up to 3 times if failed
```

#### 2. Payment Stream Created → Multiple Jobs

```javascript
// When POST /api/streams
// Automatically queues:
// 1. sendPaymentReceivedEmail (high priority)
// 2. recordUserActivity (low priority)
// - Recipient gets payment notification
// - Activity tracked for analytics
```

#### 3. Scheduled Jobs

```javascript
// When POST /api/maintenance/cleanup
// Queues: cleanupOldCalls
// - Runs tomorrow at midnight (UTC)
// - Removes video calls older than 30 days
```

### How to Add New Queue Jobs

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
  attempts: 3
})
```

**Step 3:** Queue from endpoint
```javascript
await queueManager.enqueueJob('myNewJob', {
  userId: req.userId,
  data: 'some data'
})
```

---

## 🐘 Database Schema

### Core Tables

- **users** - User accounts (wallet-based)
- **profiles** - User profiles (Ceramic-backed)
- **payment_streams** - Sablier payment streams
- **video_calls** - LiveKit call records
- **wallet_connections** - Multi-wallet support

### System Tables

- **queue_jobs** - Job processing history
- **rate_limits** - Rate limit tracking
- **audit_logs** - Compliance logging
- **analytics_events** - User activity
- **schema_migrations** - Migration tracking

---

## 📊 Monitoring & Debugging

### View Queue Statistics

```bash
# In development, worker logs show stats every 30 seconds
# Or query via HTTP:
curl http://localhost:3001/api/queue/stats/sendProfileUpdateEmail

# Returns:
{
  "queueName": "sendProfileUpdateEmail",
  "waiting": 0,
  "active": 1,
  "completed": 5,
  "failed": 0,
  "paused": false,
  "health": "healthy",
  "timestamp": "2026-07-06T15:30:00Z"
}
```

### View Database

```bash
# Using PgAdmin
# 1. Go to http://localhost:5050
# 2. Login: admin/admin
# 3. Add server: hostname: postgres, port: 5432

# Or use psql directly
psql postgresql://postgres:postgres@localhost:5432/paytray
```

### View Redis Cache

```bash
# Using Redis Commander
# 1. Go to http://localhost:8081

# Or use redis-cli directly
redis-cli
> KEYS *
> GET <key>
```

---

## 🐛 Troubleshooting

### PostgreSQL Won't Connect

```bash
# Check if container is running
docker ps | grep postgres

# Check logs
docker logs paytray-postgres

# Restart
docker-compose restart postgres
```

### Redis Connection Failed

```bash
# Check if container is running
docker ps | grep redis

# Restart
docker-compose restart redis

# Or disable Redis (uses in-memory fallback)
# Set in .env.local: REDIS_ENABLED=false
```

### Database Schema Issues

```bash
# Reset database (loses data!)
cd packages/backend
npm run db:reset
npm run db:init
npm run db:init:seed
```

### Worker Process Not Processing Jobs

```bash
# Check worker logs
cd packages/backend
npm run worker:dev

# Should show: "✓ Job handlers registered"
# Should show: "📊 Queue Statistics" every 30 seconds

# Verify Redis is connected
curl http://localhost:3001/api/queue/health
```

---

## 🔐 Environment Configuration

### Required Variables

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/paytray

# Authentication
JWT_SECRET=<32-char-random-string>
JWT_REFRESH_SECRET=<32-char-random-string>

# Message Queue & Caching
REDIS_ENABLED=true
REDIS_URL=redis://localhost:6379

# Optional: Services
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
LIVEKIT_URL=http://localhost:7880
```

### Generate Secure Secrets

```bash
# macOS/Linux
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((1..32 | ForEach-Object { [char](Get-Random -Minimum 33 -Maximum 127) } ) -join ''))
```

---

## 📦 Deployment

### Heroku Deployment

```bash
# Set environment variables
heroku config:set DATABASE_URL=<your-db-url> --app paytray-backend-staging
heroku config:set REDIS_URL=<your-redis-url> --app paytray-backend-staging
heroku config:set JWT_SECRET=<secure-random> --app paytray-backend-staging
heroku config:set JWT_REFRESH_SECRET=<secure-random> --app paytray-backend-staging

# Deploy
git push staging master:main

# Monitor
heroku logs --app paytray-backend-staging --tail
```

### DigitalOcean Deployment (Week 3-4)

See `INFRASTRUCTURE_MIGRATION.md` for detailed instructions.

---

## ✨ What's Ready

### Phase 4 Complete ✅
- ✅ Message queue system (Bull + Redis)
- ✅ Worker process for async jobs
- ✅ Database schema and migrations
- ✅ Local development environment
- ✅ Docker Compose setup
- ✅ Queue-integrated endpoints
- ✅ Health checks and monitoring
- ✅ Graceful shutdown
- ✅ npm scripts for all tasks

### Next Phase (Week 3-4) 📋
- 📋 Infrastructure migration (Heroku → DigitalOcean)
- 📋 Caching strategy implementation
- 📋 API versioning integration
- 📋 TypeScript migration

---

## 🎯 Success Criteria (Post-Setup)

You know setup is complete when:

✅ `bash setup.sh` completes without errors  
✅ `bash verify-setup.sh` shows all green checkmarks  
✅ `npm run dev` starts server without errors  
✅ `npm run worker:dev` shows "Job handlers registered"  
✅ `curl http://localhost:3001/health` returns 200  
✅ `curl http://localhost:3001/api/queue/health` returns queue stats  
✅ Frontend loads at http://localhost:5173  

---

## 📞 Getting Help

**Question:** How do I reset the database?  
**Answer:** `npm run db:reset && npm run db:init`

**Question:** How do I check if Redis is working?  
**Answer:** `curl http://localhost:3001/api/queue/health`

**Question:** How do I view queue jobs?  
**Answer:** Check `http://localhost:8081` (Redis Commander)

**Question:** How do I deploy to production?  
**Answer:** See `DEPLOYMENT_ACTION_PLAN.md`

---

## 🚀 Next Steps

1. **Run Setup:** `bash setup.sh`
2. **Verify:** `bash verify-setup.sh`
3. **Start Services:** `bash start-services.sh`
4. **Run Backend:** `npm run dev` (packages/backend)
5. **Run Worker:** `npm run worker:dev` (packages/backend)
6. **Run Frontend:** `npm run dev` (packages/react-app)
7. **Test:** `curl http://localhost:3001/health`

**All infrastructure is ready! Begin deployment when ready. 🎉**

