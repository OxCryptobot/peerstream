# 🚀 DEPLOYMENT EXECUTION GUIDE - Phase 4 to Heroku Staging

**Goal:** Deploy Phase 4 infrastructure to Heroku staging in one session  
**Estimated Time:** 30-45 minutes  
**Status:** Ready to Execute  

---

## 📋 Pre-Deployment Checklist

Before you start, verify:

- ✅ Phase 4 code complete and pushed to GitHub
- ✅ All commits pushed to master branch
- ✅ Heroku account created
- ✅ Heroku CLI installed locally
- ✅ Git repository is clean (no uncommitted changes)

**Check these now:**
```bash
# Verify local repo is clean
git status
# Should show: "working tree clean" with no modifications

# Verify latest code is pushed
git log --oneline -5
# Should show Phase 4 commits

# Verify Heroku CLI
heroku --version
# Should show version > 7.0
```

---

## 🎬 DEPLOYMENT EXECUTION STEPS

### STEP 1: Create Heroku Apps (2 minutes)

```bash
# Login to Heroku
heroku login

# Create staging app
heroku create paytray-backend-staging --remote staging

# Create production app (for later)
heroku create paytray-backend-prod --remote production

# Verify remotes are set up
git remote -v
# Should show: staging and production remotes pointing to Heroku
```

**Troubleshooting:**
- If app names already exist: `heroku apps` to list, then use different names
- Add `--region eu` if you want EU servers instead of US

---

### STEP 2: Set Environment Variables (5 minutes)

**Generate secure secrets first:**
```bash
# Generate JWT_SECRET (32-byte random string)
openssl rand -base64 32
# Copy the output and use below as <JWT_SECRET>

# Generate JWT_REFRESH_SECRET (different secret)
openssl rand -base64 32
# Copy the output and use below as <JWT_REFRESH_SECRET>
```

**Windows PowerShell alternative (if openssl not available):**
```powershell
# Generate random 32-char string
$secret = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((1..32 | ForEach-Object { [char](Get-Random -Minimum 33 -Maximum 127) } ) -join ''))
Write-Output $secret
```

**Set environment variables:**
```bash
# Set critical variables
heroku config:set NODE_ENV=staging --app paytray-backend-staging
heroku config:set PORT=3001 --app paytray-backend-staging

# Set database (use Heroku Postgres add-on URL or external DB)
# If using Heroku Postgres:
heroku addons:create heroku-postgresql:standard-0 --app paytray-backend-staging
# Heroku will automatically set DATABASE_URL

# Or set external database:
heroku config:set DATABASE_URL='postgresql://user:password@host:5432/paytray' --app paytray-backend-staging

# Set Redis (use Heroku Redis add-on or external Redis)
# If using Heroku Redis:
heroku addons:create heroku-redis:premium-0 --app paytray-backend-staging
# Heroku will automatically set REDIS_URL

# Or set external Redis:
heroku config:set REDIS_URL='redis://user:password@host:6379' --app paytray-backend-staging
heroku config:set REDIS_ENABLED=true --app paytray-backend-staging

# Set authentication secrets
heroku config:set JWT_SECRET='<paste-your-generated-secret>' --app paytray-backend-staging
heroku config:set JWT_REFRESH_SECRET='<paste-your-other-generated-secret>' --app paytray-backend-staging

# Set CORS origins
heroku config:set CORS_ORIGINS='https://paytray-staging.netlify.app,http://localhost:5173' --app paytray-backend-staging

# Set logging level
heroku config:set LOG_LEVEL=info --app paytray-backend-staging

# View all set variables
heroku config --app paytray-backend-staging
```

**Key Variables Summary:**
| Variable | Required? | Example |
|----------|-----------|---------|
| DATABASE_URL | ✅ YES | From Heroku Postgres |
| REDIS_URL | ✅ YES | From Heroku Redis |
| REDIS_ENABLED | ✅ YES | true |
| JWT_SECRET | ✅ YES | Generate with openssl |
| JWT_REFRESH_SECRET | ✅ YES | Generate with openssl |
| NODE_ENV | ✅ YES | staging |
| PORT | ✅ YES | 3001 |

---

### STEP 3: Configure Procfile (Already Done)

The `Procfile` is already configured:
```
web: npm start
worker: npm run worker
```

Verify it exists:
```bash
cat Procfile
# Should show both web and worker processes
```

---

### STEP 4: Deploy Code to Staging (5 minutes)

```bash
# Deploy to staging (push code)
git push staging master:main

# Wait for deployment to complete (watch the output)
# You should see:
# - Fetching repository
# - Building with buildpack
# - Running npm install
# - Running heroku-postbuild (db migrations)
# - Launching with 2 dynos
```

**During deployment, you'll see:**
```
remote: -----> Building on the Heroku-20 stack
remote: -----> Using buildpack: heroku/nodejs
remote: -----> Node.js app detected
remote: -----> Installing dependencies with npm
...
remote: -----> Build succeeded!
remote: -----> Discovering process types
remote:        Procfile declares types → web, worker
remote: -----> Compressing...
remote: -----> Launching...
```

**Deployment takes 3-5 minutes.** Grab some coffee! ☕

---

### STEP 5: Verify Dynos Are Running (2 minutes)

```bash
# Check dyno status
heroku ps --app paytray-backend-staging

# Should show:
# web.1      up     Nov 06 10:30    1X
# web.2      up     Nov 06 10:31    1X
# worker.1   up     Nov 06 10:32    1X
```

**If worker dyno is crashed:**
```bash
# Scale it up
heroku ps:scale worker=1 --app paytray-backend-staging

# Check logs to see what's wrong
heroku logs --app paytray-backend-staging --dyno=worker --tail
```

---

### STEP 6: Health Checks (3 minutes)

**Check basic health:**
```bash
curl https://paytray-backend-staging.herokuapp.com/health
# Should return 200 with { status: "healthy" }
```

**Check rate limiting:**
```bash
curl -i https://paytray-backend-staging.herokuapp.com/health
# Should show headers:
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 99
# X-RateLimit-Reset: <timestamp>
```

**Check queue health:**
```bash
curl https://paytray-backend-staging.herokuapp.com/api/queue/health
# Should return queue statistics
```

**Check database connection:**
```bash
# If you set up database, this should work
curl https://paytray-backend-staging.herokuapp.com/api/health/detailed
# Should include database status
```

---

### STEP 7: Monitor Logs for 5 Minutes

```bash
# Watch all application logs (web + worker)
heroku logs --app paytray-backend-staging --tail

# You should see:
# - Web dyno starting up ✅
# - Worker dyno registering job handlers ✅
# - No ERROR messages ✅
```

**Specific log commands:**
```bash
# Web dyno only
heroku logs --app paytray-backend-staging --dyno=web --tail

# Worker dyno only
heroku logs --app paytray-backend-staging --dyno=worker --tail

# Filter for specific level
heroku logs --app paytray-backend-staging --tail | grep INFO
heroku logs --app paytray-backend-staging --tail | grep ERROR
```

---

## ✅ VERIFICATION SUITE

Run this after deployment to verify everything:

### Test 1: Basic Connectivity
```bash
# Should get 200
curl -v https://paytray-backend-staging.herokuapp.com/health
```

### Test 2: Rate Limiting Works
```bash
# Make 101 rapid requests - should get ~100 200s and ~1 429
for i in {1..101}; do 
  curl -s -w "%{http_code}\n" https://paytray-backend-staging.herokuapp.com/health
done | sort | uniq -c
```

### Test 3: Worker Processing
```bash
# Check worker logs - should show job handler registration
heroku logs --app paytray-backend-staging --dyno=worker --tail | head -20
# Look for: "✓ Job handlers registered"
```

### Test 4: Queue Health
```bash
curl https://paytray-backend-staging.herokuapp.com/api/queue/health | jq .
# Should show queue statistics
```

### Test 5: Check Error Rate
```bash
# Get logs from last 30 minutes
heroku logs --app paytray-backend-staging --tail -n 100 | grep ERROR

# Should be minimal (only expected 401 auth failures)
```

---

## 📊 MONITORING (Next 24 Hours)

### Set Up Real-Time Monitoring
```bash
# Terminal 1: Watch all logs
heroku logs --app paytray-backend-staging --tail

# Terminal 2: Check metrics periodically
while true; do
  clear
  echo "=== PayTray Staging - $(date) ==="
  heroku ps --app paytray-backend-staging
  echo ""
  echo "Recent Errors:"
  heroku logs --app paytray-backend-staging --tail -n 50 | grep ERROR | head -5
  sleep 30
done
```

### Check These Metrics
- ✅ Error rate stays < 0.1%
- ✅ Response times < 1 second (P95)
- ✅ Worker dyno not restarting
- ✅ Queue depth < 500 jobs
- ✅ Database connections stable

---

## 🔄 IF PROBLEMS OCCUR

### Problem: App won't start
```bash
# Check logs
heroku logs --app paytray-backend-staging --tail

# Common issues:
# 1. Missing DATABASE_URL → Set it with heroku config:set
# 2. Missing REDIS_URL → Set it with heroku config:set
# 3. Missing JWT_SECRET → Set it with heroku config:set

# Fix and redeploy:
git push staging master:main
```

### Problem: Worker dyno crashes
```bash
# Check worker logs
heroku logs --app paytray-backend-staging --dyno=worker --tail

# If it shows "ENOMEM" = out of memory:
heroku ps:type worker=standard-1X --app paytray-backend-staging

# If it shows database error:
# Verify DATABASE_URL is set:
heroku config:get DATABASE_URL --app paytray-backend-staging
```

### Problem: Rate limiting not working
```bash
# Verify Redis is set
heroku config:get REDIS_ENABLED --app paytray-backend-staging
heroku config:get REDIS_URL --app paytray-backend-staging

# If Redis not configured, app falls back to in-memory (50 RPS limit)
# To get full 10k+ RPS, add Redis:
heroku addons:create heroku-redis:premium-0 --app paytray-backend-staging
```

### Rollback if Necessary
```bash
# View deployment history
heroku releases --app paytray-backend-staging

# Rollback to previous version
heroku releases:rollback v123 --app paytray-backend-staging

# Or revert code and re-deploy
git revert HEAD
git push staging master:main
```

---

## 📈 SUCCESS INDICATORS

You know deployment is successful when:

✅ `heroku ps` shows 3 dynos running (web.1, web.2, worker.1)  
✅ `curl .../health` returns 200  
✅ `curl .../api/queue/health` returns queue stats  
✅ Rate limit headers present in all responses  
✅ Worker logs show job handlers registered  
✅ No ERROR messages in logs  
✅ Response times < 1 second  
✅ Error rate < 0.1%  

---

## 🎯 NEXT STEPS (After 24-Hour Validation)

### If Staging Stable ✅
1. Monitor additional 24 hours
2. Deploy same code to production
3. Follow same verification steps
4. Send team notification

### If Issues Found ❌
1. Fix issues locally in code
2. Commit changes: `git add . && git commit -m "Fix: <issue>"`
3. Push to staging: `git push staging master:main`
4. Re-verify
5. Repeat until stable

---

## 📞 QUICK REFERENCE

```bash
# View logs
heroku logs --app paytray-backend-staging --tail

# View config
heroku config --app paytray-backend-staging

# View dynos
heroku ps --app paytray-backend-staging

# Scale web to 2 dynos
heroku ps:scale web=2 --app paytray-backend-staging

# Restart application
heroku restart --app paytray-backend-staging

# Run command in dyno
heroku run 'npm run db:migrate' --app paytray-backend-staging

# Open app in browser
heroku open --app paytray-backend-staging
```

---

## 🚀 YOU ARE READY TO DEPLOY

All Phase 4 infrastructure is complete and ready for Heroku deployment.

**Start with:** `heroku login` and then execute steps 1-7 above.

**Expected outcome:** Full Phase 4 system running on Heroku staging with:
- ✅ Message queue processing async jobs
- ✅ Worker dyno handling background work
- ✅ Rate limiting at 10,000+ RPS scale
- ✅ All services healthy and monitoring

Let's deploy! 🚀

