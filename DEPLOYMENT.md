# 🚀 PayTray Production Deployment Guide

This guide covers deploying PayTray to production using Heroku (backend) and Vercel (frontend).

## 📋 Prerequisites

- Node.js 18+
- npm 8+
- Heroku CLI (`heroku` command available)
- Vercel CLI (`vercel` command available)
- Git repository set up
- PostgreSQL 14+ database (managed by Heroku)
- GitHub account for CI/CD

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────┐
│          Vercel CDN (Frontend)          │
│  React 18 + Vite (Static + SPA Routing) │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│    Heroku Dyno (Backend API Server)     │
│        Express.js + PostgreSQL          │
│  (Ceramic + Sablier Integration)        │
└─────────────────────────────────────────┘
                    ↓
┌──────────────────────┬────────────────┐
│   PostgreSQL RDS     │  LiveKit Cloud │
│   (Data Storage)     │ (Video & Mesh) │
└──────────────────────┴────────────────┘
```

## 1️⃣ Database Setup

### Create PostgreSQL Database

```bash
# Option A: Use Heroku Postgres add-on (automated)
heroku addons:create heroku-postgresql:standard-0 --app paytray-backend-prod

# Option B: External PostgreSQL (AWS RDS, DigitalOcean, etc.)
# Create database and note the connection string
```

### Run Migrations

```bash
# Production migrations
heroku run npm run migrate --app paytray-backend-prod

# Verify migration status
heroku run npm run migrate:status --app paytray-backend-prod
```

## 2️⃣ Backend Deployment (Heroku)

### One-Click Deploy (Recommended for First Deployment)

```bash
# Using one-click deploy with app.json
git push heroku main

# Or use Heroku CLI
heroku create paytray-backend-prod
git push heroku main
```

### Manual Setup

```bash
# 1. Create Heroku app
heroku create paytray-backend-prod

# 2. Add PostgreSQL add-on
heroku addons:create heroku-postgresql:standard-0 \
  --app paytray-backend-prod

# 3. Set environment variables
heroku config:set \
  NODE_ENV=production \
  JWT_SECRET=$(openssl rand -hex 32) \
  WEB3_SIGNATURE_SALT=$(openssl rand -hex 32) \
  LIVEKIT_API_KEY=your_key \
  LIVEKIT_API_SECRET=your_secret \
  LIVEKIT_URL=https://your-livekit-server \
  ETHEREUM_RPC_URL=https://eth.llamarpc.com \
  ARBITRUM_RPC_URL=https://arbitrum.drpc.org \
  OPTIMISM_RPC_URL=https://optimism.drpc.org \
  CERAMIC_URL=https://mainnet.ceramic.network \
  SENTRY_DSN=your_sentry_dsn \
  --app paytray-backend-prod

# 4. Add buildpack
heroku buildpacks:add heroku/nodejs --app paytray-backend-prod

# 5. Deploy
git push heroku main

# 6. Scale dynos
heroku ps:scale web=2 worker=1 --app paytray-backend-prod

# 7. View logs
heroku logs --tail --app paytray-backend-prod
```

### Verify Backend Deployment

```bash
# Check health endpoint
curl https://paytray-backend-prod.herokuapp.com/health

# View logs for errors
heroku logs --app paytray-backend-prod | tail -50
```

## 3️⃣ Frontend Deployment (Vercel)

### Connect GitHub & Deploy

```bash
# 1. Link GitHub repo to Vercel project
vercel link

# 2. Set production environment variables
vercel env add production << 'EOF'
VITE_BACKEND_API_URL=https://paytray-backend-prod.herokuapp.com
VITE_ETHEREUM_RPC=https://eth.llamarpc.com
VITE_ARBITRUM_RPC=https://arbitrum.drpc.org
VITE_OPTIMISM_RPC=https://optimism.drpc.org
VITE_LIVEKIT_URL=wss://your-livekit-server
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
VITE_SENTRY_DSN=your_sentry_dsn
EOF

# 3. Deploy to production
vercel deploy --prod

# 4. Set custom domain
vercel domains add paytray.io
```

### Configure Custom Domain

```bash
# In Vercel dashboard:
# 1. Go to Project Settings → Domains
# 2. Add domain: paytray.io
# 3. Follow DNS instructions for your registrar
# 4. Vercel auto-provides SSL certificate via Let's Encrypt
```

### Verify Frontend Deployment

```bash
# Check if site is live
curl -I https://paytray.io

# Test API connectivity from browser console
# navigate to https://paytray.io and run:
# fetch('https://paytray-backend-prod.herokuapp.com/health')
#   .then(r => r.json())
#   .then(console.log)
```

## 4️⃣ Environment Configuration

### Backend Production Config (Heroku)

```bash
# View current config
heroku config --app paytray-backend-prod

# Update specific variable
heroku config:set JWT_SECRET=new_value --app paytray-backend-prod

# Unset variable
heroku config:unset JWT_SECRET --app paytray-backend-prod
```

### Frontend Production Config (Vercel)

```bash
# View environment variables
vercel env ls

# Add new variable
vercel env add VITE_NEW_VAR

# Pull environment to .env.local
vercel env pull
```

## 5️⃣ Monitoring & Logging

### Backend Monitoring

```bash
# View real-time logs
heroku logs --tail --app paytray-backend-prod

# View logs with filter
heroku logs --app paytray-backend-prod | grep ERROR

# Check dyno status
heroku ps --app paytray-backend-prod

# Monitor metrics
heroku metrics --app paytray-backend-prod
```

### Set Up Error Tracking (Sentry)

1. Create Sentry account at https://sentry.io
2. Create new project for Node.js
3. Copy DSN
4. Set in Heroku:
   ```bash
   heroku config:set SENTRY_DSN=https://key@sentry.io/project_id \
     --app paytray-backend-prod
   ```
5. Errors will now be tracked automatically

### Database Monitoring

```bash
# Connect to database
heroku pg:psql --app paytray-backend-prod

# View table stats
\d

# Run custom query
SELECT COUNT(*) FROM users;

# Exit
\q
```

## 6️⃣ Scaling & Performance

### Scale Backend

```bash
# Increase web dynos (handle more concurrent requests)
heroku ps:scale web=3 --app paytray-backend-prod

# Add worker dyno (process background jobs)
heroku ps:scale worker=2 --app paytray-backend-prod

# Upgrade dyno type (more CPU/RAM)
heroku ps:resize web=standard-2x --app paytray-backend-prod
```

### Configure Database Connection Pooling

```bash
# Set in Heroku config
heroku config:set \
  DB_POOL_MIN=10 \
  DB_POOL_MAX=30 \
  DB_POOL_IDLE_TIMEOUT=30000 \
  --app paytray-backend-prod
```

### Enable Redis Caching (Optional)

```bash
# Add Redis add-on
heroku addons:create heroku-redis:premium-0 --app paytray-backend-prod

# Configure in app
heroku config:set REDIS_ENABLED=true --app paytray-backend-prod
```

## 7️⃣ Deployment Checklist

Before going live, verify:

- [ ] Database migrations ran successfully
- [ ] Backend health check passes: `/health`
- [ ] Frontend loads and connects to backend API
- [ ] Web3 wallet login works
- [ ] Profile creation and search working (Ceramic)
- [ ] Payment stream creation working (Sablier)
- [ ] Video calls connect to LiveKit
- [ ] Error tracking enabled (Sentry)
- [ ] Custom domain configured and SSL working
- [ ] Rate limiting active
- [ ] CORS properly configured
- [ ] Security headers present (Helmet)
- [ ] Database backups scheduled
- [ ] Monitoring alerts set up

## 8️⃣ CI/CD Deployment (Automatic)

PayTray includes GitHub Actions workflows that automatically test and deploy on `push` to `main` branch:

```bash
# 1. Add GitHub secrets (Settings → Secrets & Variables)
HEROKU_API_KEY=your_heroku_api_key
HEROKU_EMAIL=your_email@example.com
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id
SLACK_WEBHOOK=https://hooks.slack.com/services/...

# 2. Push to main
git push origin main

# 3. GitHub Actions automatically:
#    - Runs tests and linting
#    - Builds Docker images
#    - Deploys to Heroku (backend)
#    - Deploys to Vercel (frontend)
#    - Sends Slack notification
```

## 9️⃣ Troubleshooting

### Backend won't start

```bash
# Check logs
heroku logs --tail --app paytray-backend-prod

# Common issues:
# 1. Missing environment variables
heroku config --app paytray-backend-prod

# 2. Database connection failed
heroku run node -e "require('./lib/database.js').getPool().query('SELECT NOW()')" \
  --app paytray-backend-prod

# 3. Port in use (shouldn't happen in Heroku)
```

### Frontend not connecting to backend

```bash
# Check CORS configuration
# Backend config should include:
# CORS_ORIGIN=https://paytray.io

# Test from frontend console
fetch('https://paytray-backend-prod.herokuapp.com/health')
  .then(r => r.json())
  .catch(e => console.error('CORS error:', e))
```

### Database migration failed

```bash
# Check migration status
heroku run npm run migrate:status --app paytray-backend-prod

# Manual connection to debug
heroku run psql --app paytray-backend-prod
```

## 🔟 Rollback

### Rollback Backend

```bash
# View deployment history
heroku releases --app paytray-backend-prod

# Rollback to previous version
heroku releases:rollback v3 --app paytray-backend-prod

# Or redeploy specific commit
git revert HEAD
git push heroku main
```

### Rollback Frontend

```bash
# In Vercel dashboard → Deployments
# Click "..." menu on previous deployment
# Select "Promote to Production"
```

## 1️⃣1️⃣ Updates & Maintenance

### Update Dependencies

```bash
# Backend
cd packages/backend
npm update
npm audit fix
npm run build  # Run tests
git push heroku main

# Frontend
cd packages/react-app
npm update
npm audit fix
npm run build
git push  # Auto-deploys via Vercel
```

### Database Backups

```bash
# Heroku automatically backs up
# To download backup
heroku pg:backups:capture --app paytray-backend-prod
heroku pg:backups:download --app paytray-backend-prod

# To restore
heroku pg:backups:restore path_to_backup.dump \
  DATABASE_URL --app paytray-backend-prod
```

## 📞 Support

For issues:

1. Check logs: `heroku logs --tail`
2. Check Sentry dashboard for errors
3. Review GitHub Actions workflow results
4. Check database status: `heroku status`

---

**Deployment complete!** 🎉

Frontend: https://paytray.io  
Backend API: https://paytray-backend-prod.herokuapp.com  
Status: https://paytray-backend-prod.herokuapp.com/health
