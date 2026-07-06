# Railway Deployment Fix Guide

## Build Failure Root Causes

The build likely failed due to one of these reasons:

1. **Monorepo structure** - Railway needs to understand the workspace layout
2. **Missing environment variables** - Database/Redis URLs not configured
3. **Build command issues** - npm ci or install failing
4. **Port detection** - Railway not finding the correct port

## ✅ What I've Fixed

### 1. Updated Dockerfile (packages/backend/Dockerfile)
- Now handles monorepo structure properly
- Copies root `package.json` and workspace files
- Uses `npm ci --omit=dev` for production install
- Fixed health check to use ES6 syntax
- Sets correct working directory

### 2. Created .railwayignore
- Tells Railway which files to ignore during build
- Speeds up deployments by skipping non-essential files
- Reduces build context size

### 3. Created railway.json
- Alternative configuration if Railway auto-detect fails
- Can be removed if not needed

## 🚀 How to Retry Railway Build

### Option A: Simple Retry (Recommended)

1. Go to: https://railway.app/project/013770d1-6f03-48ae-a346-cc7dcce1629b
2. Click "Deployments"
3. Find the failed build
4. Click "Redeploy" or "Retry"
5. Railway will use updated Dockerfile

### Option B: Delete and Redeploy

1. Go to Railway dashboard
2. Find your project
3. Delete the current deployment
4. Reconnect GitHub repository
5. Let Railway auto-detect and redeploy

### Option C: Use Railway CLI (if installed)

```bash
# Install Railway CLI (one time)
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Deploy
railway deploy
```

## ⚙️ Environment Variables to Set in Railway

Railway should auto-provision these, but if not, add manually:

```
NODE_ENV=production
REDIS_ENABLED=true
LOG_LEVEL=info

# If Railway creates services automatically:
DATABASE_URL=postgresql://...  (auto-generated)
REDIS_URL=redis://...          (auto-generated)

# JWT & Security
JWT_SECRET=<generate-random-32-chars>
WEB3_SIGNATURE_SALT=<generate-random-32-chars>

# Blockchain (optional for staging)
BLOCKCHAIN_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/...

# Features (disable external services for free tier)
LIVEKIT_ENABLED=false
CERAMIC_ENABLED=false
SABLIER_ENABLED=false
```

## 🔍 Debugging Railway Build Failures

### Check Build Logs

1. Railway Dashboard → Deployments → Failed Build
2. Click "View Logs"
3. Look for:
   - `npm install` errors → Check package.json for conflicts
   - `Port already in use` → Railway assigns port automatically
   - `Missing dependencies` → Add to packages/backend/package.json
   - `Database connection` → Will work after provisioning

### Common Errors & Fixes

**Error: "Cannot find module"**
```
→ Run: npm install in packages/backend locally
→ Check package.json for missing dependency
```

**Error: "Port 3001 is already in use"**
```
→ Railway handles port assignment automatically
→ The Dockerfile exposes 3001, Railway routes to it
→ No action needed
```

**Error: "docker build failed"**
```
→ Updated Dockerfile should fix this
→ If still fails, check actual error message
```

**Error: "npm ci failed - peer dependency"**
```
→ Add --legacy-peer-deps to Dockerfile:
   RUN npm ci --omit=dev --legacy-peer-deps
```

## 📊 Current Configuration

| Component | Status | Notes |
|-----------|--------|-------|
| Dockerfile | ✅ Updated | Now handles monorepo |
| .railwayignore | ✅ Added | Speeds up builds |
| railway.json | ✅ Created | Fallback config |
| Procfile | ✅ Ready | Points to correct service |
| package.json | ✅ Ready | All deps included |

## ✨ Next Steps

1. **Retry the build** using steps in "Option A" above
2. **Monitor deployment** - watch build logs for errors
3. **If it fails** - share the exact error message
4. **If it succeeds** - verify health check: `https://your-railway-app.up.railway.app/api/health`

## 💡 Alternative: Use Docker Locally First

Before using Railway, test locally to catch issues:

```bash
cd c:\Users\Otcde\OneDrive\Desktop\Paytray\peerstream

# Test production build
docker build -t paytray-backend packages/backend

# Run with test services
docker-compose up
```

If it works locally, Railway will work remotely.

---

**Ready to retry?** Go to Railway dashboard and click "Redeploy" on the project. 🚀
