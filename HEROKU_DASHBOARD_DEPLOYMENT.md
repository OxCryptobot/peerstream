# 🌐 HEROKU DEPLOYMENT VIA WEB DASHBOARD (No CLI Required)

**Alternative Deployment Method**  
**Time:** 10-15 minutes  
**Requirements:** GitHub account + Heroku account + Web browser  

---

## 📋 Prerequisites

Before you start:

- ✅ Heroku account created (free at https://www.heroku.com)
- ✅ GitHub account with access to https://github.com/OxCryptobot/peerstream
- ✅ Phase 4 code committed and pushed (Commit: `d232e96`)
- ✅ Web browser ready

---

## 🎬 STEP-BY-STEP DEPLOYMENT

### Step 1: Create Heroku App (2 minutes)

1. Go to: https://dashboard.heroku.com/apps
2. Click button: **"New"** → **"Create new app"**
3. Fill in app name:
   - **App name:** `paytray-backend-staging`
   - **Region:** Choose your region (US or EU)
   - Click: **"Create app"**
4. Wait for app to be created (~10 seconds)

**Screenshot What You'll See:**
```
App created successfully!
Now let's connect it to GitHub...
```

---

### Step 2: Connect GitHub Repository (3 minutes)

1. On your new app dashboard, find section: **"Deployment method"**
2. Click button: **"Connect to GitHub"**
3. Click: **"Authorize heroku"** (logs in with your GitHub)
4. Search for repository:
   - Type: `peerstream`
   - Click: `OxCryptobot/peerstream`
5. Click: **"Connect"** button

**Screenshot What You'll See:**
```
✓ Connected to OxCryptobot/peerstream
  Connected as: [your-github-username]
```

---

### Step 3: Configure Environment Variables (5 minutes)

Environment variables go in app **Settings**, not Deployment.

1. In your app dashboard, click tab: **"Settings"**
2. Find section: **"Config Vars"**
3. Click button: **"Reveal Config Vars"**
4. Add each variable by clicking **"Add"** and filling in Key/Value:

**Add These Variables:**

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `staging` | Must be exactly "staging" |
| `PORT` | `3001` | Standard port |
| `DATABASE_URL` | See below | Get from add-ons or external DB |
| `REDIS_URL` | See below | Get from add-ons or external Redis |
| `REDIS_ENABLED` | `true` | Enable distributed rate limiting |
| `JWT_SECRET` | Generate below | Must be secure random 32+ chars |
| `JWT_REFRESH_SECRET` | Generate below | Must be secure random 32+ chars |
| `CORS_ORIGINS` | `https://your-frontend.com,http://localhost:5173` | Your frontend URLs |
| `LOG_LEVEL` | `info` | info, debug, or error |

**Generate Secure Values:**

```bash
# Windows PowerShell - Generate random 32-char secret
$secret = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((1..32 | ForEach-Object { [char](Get-Random -Minimum 33 -Maximum 127) } ) -join ''))
Write-Output $secret
```

**Add Database (Choose One Option):**

**Option A: Use Heroku Postgres (Easiest)**
1. Same dashboard, scroll down to **"Add-ons"**
2. Search: `Heroku Postgres`
3. Click result: `Heroku Postgres`
4. Choose plan: `Hobby Dev (free)` or `Standard`
5. Click: **"Provision"**
6. Heroku automatically adds `DATABASE_URL` variable ✓

**Option B: Use External Database**
1. Get connection string from your database provider
2. In Config Vars, add:
   - Key: `DATABASE_URL`
   - Value: `postgresql://user:password@host:5432/paytray`

**Add Redis (Choose One Option):**

**Option A: Use Heroku Redis (Easy)**
1. Same dashboard, scroll down to **"Add-ons"**
2. Search: `Heroku Redis`
3. Click result: `Heroku Redis`
4. Choose plan: `Premium-0` or higher
5. Click: **"Provision"**
6. Heroku automatically adds `REDIS_URL` variable ✓

**Option B: Use External Redis**
1. Get connection string from your Redis provider
2. In Config Vars, add:
   - Key: `REDIS_URL`
   - Value: `redis://user:password@host:6379`

**Verify All Variables Are Set:**

You should see 9+ variables in Config Vars section. All must have values (no blanks).

---

### Step 4: Configure Process Types (2 minutes)

Heroku uses a file called `Procfile` to know what processes to run.

**Verify Procfile Exists:**

1. Go to: https://github.com/OxCryptobot/peerstream/blob/master/Procfile
2. Should show:
   ```
   web: npm start
   worker: npm run worker
   ```
3. If it exists ✓, skip to Step 5
4. If not ✗, create it in your repo

---

### Step 5: Deploy Code (3 minutes)

Now that environment is configured, deploy!

1. Go back to app dashboard
2. Click tab: **"Deploy"**
3. Find section: **"Manual deploy"** (if not using auto-deploy)
4. Choose branch: `master`
5. Click button: **"Deploy Branch"**
6. Watch the deployment progress (shows live logs)

**You'll see:**
```
Building application...
npm install
npm run build (if configured)
Launching
Deploying dynos...
```

**Deployment takes 3-5 minutes.** ☕

---

### Step 6: Check Deployment Status (2 minutes)

1. After deployment completes, click: **"View"** or **"Open app"**
2. This opens: `https://paytray-backend-staging.herokuapp.com`
3. You should see error page (that's expected, it means server is running)

**Check Logs:**

1. In app dashboard, click: **"More"** (top right)
2. Choose: **"View logs"**
3. You should see:
   - Web dyno starting
   - Worker dyno starting
   - Job handlers registering
   - NO ERROR messages

---

## ✅ VERIFICATION TESTS

After deployment, run these tests to verify everything works:

### Test 1: Basic Health Check

```bash
curl https://paytray-backend-staging.herokuapp.com/health
# Expected: { "status": "healthy" }
```

### Test 2: Check Rate Limit Headers

```bash
curl -i https://paytray-backend-staging.herokuapp.com/health | grep X-RateLimit
# Expected:
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 99
```

### Test 3: Queue Health

```bash
curl https://paytray-backend-staging.herokuapp.com/api/queue/health
# Expected: Queue statistics in JSON
```

### Test 4: View Logs for Errors

Go back to app dashboard → "View logs"

Look for:
- ✅ "Job handlers registered"
- ✅ "Queue initialized"
- ❌ No "ERROR" messages (except expected 401 auth failures)

---

## 🎯 SUCCESS CRITERIA

Deployment is successful when:

✅ App deployed without errors  
✅ Health check returns 200  
✅ Queue health shows statistics  
✅ Rate limit headers present  
✅ Worker dyno running (check logs)  
✅ No critical errors in logs  

---

## 🔄 SCALE DYNOS (Optional)

By default, Heroku runs 1 web dyno and 0 worker dynos. You might need to scale:

1. In app dashboard, find section: **"Dynos"**
2. Click: **"Edit"**
3. Scale dyno types:
   - `web`: Set to `2` (for redundancy)
   - `worker`: Set to `1` (required for async jobs)
4. Click: **"Confirm Changes"**

---

## 📊 MONITOR DEPLOYMENT (Next 24 Hours)

Keep an eye on:

1. **Logs:** Check every hour for errors
2. **Dyno Status:** All should show "up"
3. **Health Endpoint:** Should respond with 200
4. **Errors:** Should be < 0.1%

**View Logs Continuously:**

1. App dashboard → Click: **"More"** → **"View logs"**
2. Logs stream in real-time
3. Look for issues

---

## 🐛 TROUBLESHOOTING

### App Won't Start
1. Check logs: App dashboard → **"More"** → **"View logs"**
2. Common issue: Missing environment variable
3. Solution: Add missing var in Settings → Config Vars
4. Click: **"More"** → **"Restart all dynos"**

### Worker Dyno Crashes
1. Check logs for worker: Filter logs for "worker" dyno
2. Common issue: Redis or database connection failed
3. Solution: Verify DATABASE_URL and REDIS_URL are set correctly
4. Restart: **"More"** → **"Restart all dynos"**

### Health Check Fails
1. Verify DATABASE_URL is set
2. Verify REDIS_URL is set
3. Check logs for connection errors
4. If using external DB/Redis, verify credentials

### Need to Redeploy
1. Make changes locally
2. Commit to GitHub: `git commit -m "Fix: ..."`
3. Push to master: `git push origin master`
4. In Heroku dashboard, click: **"Deploy Branch"** again

---

## 🔗 USEFUL LINKS

- **Heroku Dashboard:** https://dashboard.heroku.com/apps
- **Your Staging App:** https://paytray-backend-staging.herokuapp.com
- **Heroku Docs:** https://devcenter.heroku.com

---

## 📝 COMPLETE CHECKLIST

- [ ] Heroku account created
- [ ] GitHub account has access to peerstream
- [ ] Created app: `paytray-backend-staging`
- [ ] Connected GitHub repository
- [ ] Set 9+ environment variables
- [ ] Added Postgres add-on (or external DB)
- [ ] Added Redis add-on (or external Redis)
- [ ] Deployed code to staging
- [ ] Verified all 4 tests pass
- [ ] Checked logs for errors
- [ ] Scaled dynos (web=2, worker=1)
- [ ] Monitored for 1+ hours

---

## ✨ YOU'RE DONE!

Phase 4 is now deployed to Heroku staging!

**Next Steps:**
1. Monitor for 24 hours
2. If stable, deploy to production (same steps)
3. Week 3-4: Infrastructure migration (DigitalOcean)

🎉 **Congratulations on deploying Phase 4!**

