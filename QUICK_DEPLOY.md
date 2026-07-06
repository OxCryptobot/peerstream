# 🚀 PayTray Quick Deployment Reference

## Pre-Deployment Checklist (5 min)

```bash
# 1. Validate environment
node packages/backend/scripts/validate-env.js production

# 2. Run tests locally
npm run test
cd packages/react-app && npm run test:ci
cd ../.. 

# 3. Build frontend
cd packages/react-app && npm run build

# 4. Verify Docker build
docker build packages/backend -t paytray-backend:latest
docker build packages/react-app -t paytray-frontend:latest
```

---

## Option A: Docker Compose (Local Full Stack)

```bash
# Start everything locally
docker-compose up --build

# Frontend: http://localhost:3000
# Backend: http://localhost:3001
# Health: curl http://localhost:3001/health

# Stop everything
docker-compose down
```

---

## Option B: Heroku + Vercel (Production Deployment)

### Backend Setup (Heroku)

```bash
# 1. Create Heroku app
heroku create paytray-backend-prod

# 2. Add PostgreSQL
heroku addons:create heroku-postgresql:standard-0

# 3. Set all env vars (from .env.production)
heroku config:set \
  NODE_ENV=production \
  JWT_SECRET=$(openssl rand -hex 32) \
  WEB3_SIGNATURE_SALT=$(openssl rand -hex 32) \
  LIVEKIT_URL=https://your-livekit \
  LIVEKIT_API_KEY=key \
  LIVEKIT_API_SECRET=secret \
  ETHEREUM_RPC_URL=https://eth.llamarpc.com \
  ARBITRUM_RPC_URL=https://arbitrum.drpc.org \
  OPTIMISM_RPC_URL=https://optimism.drpc.org \
  CERAMIC_URL=https://mainnet.ceramic.network \
  SENTRY_DSN=your_sentry_dsn

# 4. Deploy code
git push heroku main

# 5. Run migrations
heroku run npm run migrate

# 6. Verify deployment
curl https://paytray-backend-prod.herokuapp.com/health
heroku logs --tail
```

### Frontend Setup (Vercel)

```bash
# 1. Link project to Vercel
vercel link

# 2. Add environment variables
vercel env add VITE_BACKEND_API_URL
vercel env add VITE_ETHEREUM_RPC
vercel env add VITE_ARBITRUM_RPC
vercel env add VITE_OPTIMISM_RPC
vercel env add VITE_LIVEKIT_URL
vercel env add VITE_WALLETCONNECT_PROJECT_ID

# 3. Deploy to production
vercel deploy --prod

# 4. Add custom domain
vercel domains add paytray.io

# 5. Verify deployment
curl -I https://paytray.io
```

### GitHub Actions (Automated)

```bash
# 1. Add GitHub repository secrets
# Settings → Secrets & Variables → Actions

# Required secrets:
# - HEROKU_API_KEY
# - HEROKU_EMAIL
# - VERCEL_TOKEN
# - VERCEL_ORG_ID
# - VERCEL_PROJECT_ID
# - SLACK_WEBHOOK (optional)

# 2. Push to main branch (triggers deployment)
git push origin main

# 3. Monitor deployment
# GitHub Actions → Deploy workflow → View logs
```

---

## Deployment Verification

### Backend Health Check

```bash
# Production
curl https://paytray-backend-prod.herokuapp.com/health

# Local
curl http://localhost:3001/health

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2026-07-06T12:00:00Z",
#   "database": "connected",
#   "ceramic": "enabled",
#   "sablier": "enabled"
# }
```

### Frontend Health Check

```bash
# Production
curl -I https://paytray.io

# Expected:
# HTTP/2 200
# X-Content-Type-Options: nosniff
# X-Frame-Options: SAMEORIGIN
```

### API Endpoint Test

```bash
# Test profile endpoint
curl https://paytray-backend-prod.herokuapp.com/api/profiles/search?q=expert

# Test wallet verification
curl -X POST https://paytray-backend-prod.herokuapp.com/api/wallet/verify \
  -H "Content-Type: application/json" \
  -d '{"address":"0x1234567890123456789012345678901234567890"}'
```

---

## Monitoring & Logs

### Backend Logs

```bash
# View logs (Heroku)
heroku logs --tail --app paytray-backend-prod

# Filter by error level
heroku logs --app paytray-backend-prod | grep ERROR

# View specific duration
heroku logs --app paytray-backend-prod -n 100
```

### Database Connection

```bash
# Connect to Heroku database
heroku pg:psql --app paytray-backend-prod

# View users table
SELECT COUNT(*) FROM users;

# View migrations
SELECT * FROM schema_migrations;

# Exit
\q
```

### Sentry Errors

```bash
# Open Sentry dashboard
# https://sentry.io → Select PayTray project

# View real-time errors and performance metrics
# Set up alerts for critical errors
```

---

## Rollback & Recovery

### Rollback Backend (Heroku)

```bash
# View deployment history
heroku releases --app paytray-backend-prod

# Rollback to previous version
heroku releases:rollback v5 --app paytray-backend-prod
```

### Rollback Frontend (Vercel)

```bash
# In Vercel dashboard:
# Deployments → Click previous deployment → Promote to Production
```

### Database Backup/Restore

```bash
# Create backup
heroku pg:backups:capture --app paytray-backend-prod

# List backups
heroku pg:backups --app paytray-backend-prod

# Download backup
heroku pg:backups:download --app paytray-backend-prod

# Restore from backup
heroku pg:backups:restore path_to_backup.dump \
  DATABASE_URL --app paytray-backend-prod
```

---

## Scaling

### Increase Backend Capacity

```bash
# Scale web dynos (more concurrent requests)
heroku ps:scale web=3 --app paytray-backend-prod

# Scale worker dynos (background jobs)
heroku ps:scale worker=2 --app paytray-backend-prod

# Upgrade dyno size (more CPU/RAM)
heroku ps:resize web=standard-2x --app paytray-backend-prod

# View current scaling
heroku ps --app paytray-backend-prod
```

### Add Database Connection Pool

```bash
heroku config:set \
  DB_POOL_MIN=10 \
  DB_POOL_MAX=30 \
  --app paytray-backend-prod
```

---

## Troubleshooting

### Backend Won't Start

```bash
# Check logs
heroku logs --tail --app paytray-backend-prod

# Test database connection
heroku run node -e "require('./lib/database.js').getPool().query('SELECT NOW()')" \
  --app paytray-backend-prod

# Validate environment
heroku run node packages/backend/scripts/validate-env.js \
  --app paytray-backend-prod
```

### Frontend Not Connecting to Backend

```bash
# Check CORS in backend config
heroku config:get CORS_ORIGIN --app paytray-backend-prod

# Test API connectivity from browser console
fetch('https://paytray-backend-prod.herokuapp.com/health')
  .then(r => r.json())
  .catch(e => console.error('Error:', e))
```

### Database Connection Issues

```bash
# Check PostgreSQL add-on status
heroku addons --app paytray-backend-prod

# View database info
heroku pg:info --app paytray-backend-prod

# Restart database
heroku pg:restart DATABASE --app paytray-backend-prod
```

---

## Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| NODE_ENV | Runtime environment | production |
| JWT_SECRET | Token signing key | (32+ random chars) |
| DATABASE_URL | PostgreSQL connection | postgresql://user:pass@host/db |
| ETHEREUM_RPC_URL | Ethereum RPC endpoint | https://eth.llamarpc.com |
| LIVEKIT_URL | Video server endpoint | https://livekit.example.com |
| CERAMIC_URL | Ceramic network | https://mainnet.ceramic.network |
| SENTRY_DSN | Error tracking | https://key@sentry.io/project |

See `.env.production` for complete reference.

---

## Documentation

| Document | Purpose |
|----------|---------|
| [DEPLOYMENT.md](DEPLOYMENT.md) | Complete 400-line deployment guide |
| [DEPLOYMENT_READY.md](DEPLOYMENT_READY.md) | Status and pre-deployment checklist |
| [ARCHITECTURE.md](packages/backend/ARCHITECTURE.md) | Backend architecture reference |
| [PHASES_2_3_INTEGRATION.md](packages/backend/PHASES_2_3_INTEGRATION.md) | Ceramic & Sablier integration guide |

---

## Support

For issues:
1. Check logs: `heroku logs --tail`
2. Check Sentry dashboard
3. Review GitHub Actions workflow
4. See DEPLOYMENT.md troubleshooting section

---

**PayTray v3.0.0 - Production Deployment Guide**  
Last updated: 2026-07-06
