# ✅ HEROKU DEPLOYMENT CHECKLIST - Phase 4

**Repository:** https://github.com/OxCryptobot/peerstream  
**Latest Commit:** `d232e96` - Phase 4 scaffolding complete  
**Status:** Ready for Heroku deployment  

---

## 📋 PRE-DEPLOYMENT (Do This First)

### Step 1: Heroku Account & CLI Setup

- [ ] Have Heroku account created at https://www.heroku.com
- [ ] Install Heroku CLI: `heroku --version`
- [ ] Run: `heroku login` (opens browser to authenticate)

**Verify:**
```bash
heroku --version
# Output should be: heroku/X.X.X
```

### Step 2: Verify Git Status

- [ ] All code pushed to GitHub
- [ ] On master branch
- [ ] Working tree clean

**Verify:**
```bash
git status
# Output should be: "nothing to commit, working tree clean"

git log --oneline -1
# Output should be: d232e96 Phase 4: Complete scaffolding...
```

---

## 🚀 DEPLOYMENT STEPS

### STEP 1: Create Heroku Apps (2 min)

**Execute these commands:**

```bash
# Login to Heroku
heroku login

# Create staging app
heroku create paytray-backend-staging --remote staging

# Optional: Create production app for later
heroku create paytray-backend-prod --remote production

# Verify remotes
git remote -v
```

**Checklist:**
- [ ] Successfully logged in to Heroku
- [ ] `staging` remote created
- [ ] `git remote -v` shows both remotes pointing to Heroku

---

### STEP 2: Set Environment Variables (5 min)

**Generate Secrets First:**

```bash
# macOS/Linux
openssl rand -base64 32   # Copy output → JWT_SECRET
openssl rand -base64 32   # Copy output → JWT_REFRESH_SECRET

# Windows PowerShell
$secret = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((1..32 | ForEach-Object { [char](Get-Random -Minimum 33 -Maximum 127) } ) -join '')); $secret
```

**Set Critical Variables:**

```bash
# Basic config
heroku config:set NODE_ENV=staging --app paytray-backend-staging
heroku config:set PORT=3001 --app paytray-backend-staging

# Database (Option A: Use Heroku Postgres addon)
heroku addons:create heroku-postgresql:standard-0 --app paytray-backend-staging
# DATABASE_URL will be auto-set

# Database (Option B: Use external database)
heroku config:set DATABASE_URL='postgresql://user:pass@host:5432/paytray' --app paytray-backend-staging

# Redis (Option A: Use Heroku Redis addon)
heroku addons:create heroku-redis:premium-0 --app paytray-backend-staging
# REDIS_URL will be auto-set

# Redis (Option B: Use external Redis)
heroku config:set REDIS_URL='redis://user:pass@host:6379' --app paytray-backend-staging
heroku config:set REDIS_ENABLED=true --app paytray-backend-staging

# Auth secrets (paste your generated values)
heroku config:set JWT_SECRET='<paste-first-generated-secret>' --app paytray-backend-staging
heroku config:set JWT_REFRESH_SECRET='<paste-second-generated-secret>' --app paytray-backend-staging

# CORS
heroku config:set CORS_ORIGINS='https://your-frontend.com,http://localhost:5173' --app paytray-backend-staging

# Logging
heroku config:set LOG_LEVEL=info --app paytray-backend-staging
```

**Verify All Variables Set:**
```bash
heroku config --app paytray-backend-staging
# Should show all variables above
```

**Checklist:**
- [ ] JWT_SECRET set
- [ ] JWT_REFRESH_SECRET set
- [ ] DATABASE_URL set (either Heroku or external)
- [ ] REDIS_URL set and REDIS_ENABLED=true
- [ ] NODE_ENV set to staging
- [ ] All 7+ variables visible in `heroku config`

---

### STEP 3: Deploy Code (5 min)

**Execute:**
```bash
# Deploy to staging
git push staging master:main

# Wait for deployment to complete (watch output)
# You should see:
# - "Building on the Heroku-20 stack"
# - "Running npm install"
# - "npm run build" (if configured)
# - "Launching with 3 dynos"
```

**Deployment takes 3-5 minutes.** ☕ Grab coffee!

**Checklist:**
- [ ] `git push staging master:main` executed successfully
- [ ] Build completed without errors
- [ ] Output shows "Launching with 3 dynos" or similar

---

### STEP 4: Verify Dynos Running (2 min)

```bash
# Check dyno status
heroku ps --app paytray-backend-staging

# Should show:
# web.1      up     Nov 06 10:30    1X
# web.2      up     Nov 06 10:31    1X  
# worker.1   up     Nov 06 10:32    1X
```

**If worker dyno is "crashed":**
```bash
heroku ps:scale worker=1 --app paytray-backend-staging
sleep 2
heroku ps --app paytray-backend-staging
```

**Checklist:**
- [ ] web.1 dyno running
- [ ] web.2 dyno running (or at least 1 web dyno)
- [ ] worker.1 dyno running
- [ ] All show status "up"

---

### STEP 5: Health Checks (3 min)

**Test 1: Basic Health**
```bash
curl https://paytray-backend-staging.herokuapp.com/health
# Should return: { "status": "healthy" }
```

**Test 2: Rate Limiting Headers**
```bash
curl -i https://paytray-backend-staging.herokuapp.com/health | grep X-RateLimit
# Should show:
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 99
```

**Test 3: Queue Health**
```bash
curl https://paytray-backend-staging.herokuapp.com/api/queue/health | jq .
# Should show queue statistics
```

**Test 4: Detailed Health**
```bash
curl https://paytray-backend-staging.herokuapp.com/api/health/detailed | jq .
# Should include database and redis status
```

**Checklist:**
- [ ] Test 1 passed (basic health)
- [ ] Test 2 passed (rate limit headers present)
- [ ] Test 3 passed (queue stats returned)
- [ ] Test 4 passed (all systems showing status)

---

### STEP 6: Monitor Logs (5 min)

```bash
# Watch all logs
heroku logs --app paytray-backend-staging --tail

# You should see (NO errors):
# - Web dyno starting up
# - Worker dyno registering job handlers
# - No ERROR messages
```

**Specific monitoring:**
```bash
# Web logs only
heroku logs --app paytray-backend-staging --dyno=web --tail

# Worker logs only
heroku logs --app paytray-backend-staging --dyno=worker --tail

# Filter for errors
heroku logs --app paytray-backend-staging --tail | grep ERROR
```

**Checklist:**
- [ ] No ERROR messages in logs
- [ ] Worker shows "Job handlers registered"
- [ ] No dyno crashes
- [ ] Logs flowing normally

---

## ✅ VERIFICATION SUITE (Run All)

### Quick Verification
```bash
# All tests at once
echo "=== PHASE 4 DEPLOYMENT VERIFICATION ===" && \
echo "" && \
echo "1. Basic Health:" && \
curl -s https://paytray-backend-staging.herokuapp.com/health | jq . && \
echo "" && \
echo "2. Queue Health:" && \
curl -s https://paytray-backend-staging.herokuapp.com/api/queue/health | jq . && \
echo "" && \
echo "3. Dyno Status:" && \
heroku ps --app paytray-backend-staging && \
echo "" && \
echo "4. Error Count (should be ~0):" && \
heroku logs --app paytray-backend-staging --tail -n 100 | grep -c ERROR || echo "0"
```

### Rate Limiting Test
```bash
# Make 110 rapid requests - should get ~100 200s, ~10 429s
for i in {1..110}; do 
  curl -s -o /dev/null -w "%{http_code}\n" https://paytray-backend-staging.herokuapp.com/health
done | sort | uniq -c
```

**Checklist:**
- [ ] ~100 200 responses
- [ ] ~10 429 responses (rate limited)
- [ ] Headers present in all responses

---

## 📊 MONITORING (Next 24 Hours)

### Set Up Monitoring
```bash
# Terminal 1: Watch logs continuously
heroku logs --app paytray-backend-staging --tail

# Terminal 2: Check metrics every 30 seconds
while true; do 
  clear
  echo "=== Deployment Status $(date) ===" && \
  echo "" && \
  heroku ps --app paytray-backend-staging && \
  echo "" && \
  echo "Recent Errors:" && \
  heroku logs --app paytray-backend-staging --tail -n 50 | grep ERROR | head -3 || echo "No errors" && \
  sleep 30
done
```

### Success Indicators (24-hour window)
- ✅ All 3 dynos running (web, web, worker)
- ✅ Error rate < 0.1%
- ✅ Response times < 1 second (P95)
- ✅ Worker processing queue jobs
- ✅ No unexpected dyno restarts
- ✅ Database connections stable
- ✅ Rate limiting working correctly

---

## 🐛 TROUBLESHOOTING

### App Won't Start
```bash
# Check logs
heroku logs --app paytray-backend-staging --tail

# Common fixes:
# 1. Missing env var → heroku config:set VAR=value
# 2. Database error → Check DATABASE_URL
# 3. Redis error → Check REDIS_URL

# Redeploy after fixing
git push staging master:main
```

### Worker Dyno Crashes
```bash
# Check worker logs
heroku logs --app paytray-backend-staging --dyno=worker --tail

# Common fixes:
# 1. Out of memory → Upgrade dyno type
# 2. Database disconnect → Check DATABASE_URL
# 3. Redis issues → Check REDIS_URL
```

### Rate Limiting Not Working
```bash
# Verify Redis
heroku config:get REDIS_ENABLED --app paytray-backend-staging
heroku config:get REDIS_URL --app paytray-backend-staging

# If not set, falls back to in-memory (50 RPS)
# To enable distributed: heroku addons:create heroku-redis:premium-0
```

### Rollback to Previous Version
```bash
# View releases
heroku releases --app paytray-backend-staging

# Rollback
heroku releases:rollback <release-hash> --app paytray-backend-staging

# Or revert code and redeploy
git revert HEAD
git push staging master:main
```

---

## 📋 FINAL CHECKLIST

**Before Declaring Success:**

- [ ] `heroku ps` shows 3 healthy dynos
- [ ] `curl .../health` returns 200
- [ ] `curl .../api/queue/health` returns stats
- [ ] Rate limit headers in responses
- [ ] Worker logs show job handler registration
- [ ] No ERROR messages in past 5 minutes
- [ ] Response times < 1 second
- [ ] All tests passed
- [ ] Monitored for at least 1 hour
- [ ] No unexpected restarts

---

## 🎯 NEXT STEPS (After Successful Staging)

### If Everything Stable (24+ hours):
1. ✅ Deploy same code to production
2. ✅ Follow same verification steps
3. ✅ Monitor production for 24 hours
4. ✅ Send team deployment notification

### If Issues Found:
1. ❌ Fix issues in code
2. ❌ Commit: `git add . && git commit -m "Fix: <issue>"`
3. ❌ Redeploy: `git push staging master:main`
4. ❌ Re-verify all tests
5. ❌ Repeat until stable

---

## 📞 QUICK COMMANDS REFERENCE

```bash
# View logs
heroku logs --app paytray-backend-staging --tail

# View config
heroku config --app paytray-backend-staging

# View dynos
heroku ps --app paytray-backend-staging

# Restart app
heroku restart --app paytray-backend-staging

# Scale web dynos
heroku ps:scale web=3 --app paytray-backend-staging

# Scale worker dynos
heroku ps:scale worker=1 --app paytray-backend-staging

# Run command in dyno
heroku run 'npm run db:migrate' --app paytray-backend-staging

# Open app in browser
heroku open --app paytray-backend-staging

# View metrics
heroku metrics --app paytray-backend-staging
```

---

## ✨ YOU'RE READY!

All Phase 4 infrastructure is deployed and ready.

**Start deployment now:**
```bash
heroku login
heroku create paytray-backend-staging --remote staging
# ... follow steps above ...
git push staging master:main
```

**Estimated Total Time:** 30-45 minutes  
**Expected Outcome:** Fully operational Phase 4 system on Heroku staging

Let's deploy! 🚀

