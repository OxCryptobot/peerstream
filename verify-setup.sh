#!/bin/bash
# Development Environment Setup Verification
# Checks if all required components are installed and configured

set -e

echo "🔍 PayTray Development Environment Verification"
echo "==============================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_command() {
  if command -v $1 &> /dev/null; then
    version=$($1 --version 2>&1 | head -1)
    echo -e "${GREEN}✅${NC} $1: $version"
    return 0
  else
    echo -e "${RED}❌${NC} $1: not found"
    return 1
  fi
}

check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✅${NC} $1"
    return 0
  else
    echo -e "${RED}❌${NC} $1: missing"
    return 1
  fi
}

# Check system requirements
echo "📋 System Requirements:"
check_command node || true
check_command npm || true
check_command docker || true
check_command docker-compose || true
check_command git || true

echo ""
echo "📦 Project Structure:"
check_file packages/backend/package.json || true
check_file packages/backend/server.js || true
check_file packages/backend/.env.local || true
check_file packages/backend/workers/index.js || true
check_file packages/backend/lib/messageQueue.js || true
check_file packages/backend/services/jobHandlers.js || true

echo ""
echo "🔗 Environment Configuration:"
if [ -f packages/backend/.env.local ]; then
  echo -e "${GREEN}✅${NC} .env.local exists"
  
  if grep -q "DATABASE_URL" packages/backend/.env.local; then
    echo -e "${GREEN}✅${NC} DATABASE_URL configured"
  else
    echo -e "${YELLOW}⚠️${NC}  DATABASE_URL not set"
  fi
  
  if grep -q "REDIS_URL" packages/backend/.env.local; then
    echo -e "${GREEN}✅${NC} REDIS_URL configured"
  else
    echo -e "${YELLOW}⚠️${NC}  REDIS_URL not set (optional, falls back to in-memory)"
  fi
else
  echo -e "${YELLOW}⚠️${NC}  .env.local not found - run 'npm run setup' first"
fi

echo ""
echo "🐳 Docker Services:"
if docker ps -a --format '{{.Names}}' | grep -q 'paytray-postgres'; then
  echo -e "${GREEN}✅${NC} PostgreSQL container exists"
else
  echo -e "${YELLOW}⚠️${NC}  PostgreSQL container not found - run 'docker-compose up -d'"
fi

if docker ps -a --format '{{.Names}}' | grep -q 'paytray-redis'; then
  echo -e "${GREEN}✅${NC} Redis container exists"
else
  echo -e "${YELLOW}⚠️${NC}  Redis container not found - run 'docker-compose up -d'"
fi

echo ""
echo "📝 Database Status:"
if [ ! -z "$DATABASE_URL" ]; then
  if psql "$DATABASE_URL" -c "SELECT 1" &> /dev/null; then
    echo -e "${GREEN}✅${NC} Database connection successful"
  else
    echo -e "${YELLOW}⚠️${NC}  Cannot connect to database"
  fi
else
  echo -e "${YELLOW}⚠️${NC}  DATABASE_URL not set in environment"
fi

echo ""
echo "📊 Redis Status:"
if command -v redis-cli &> /dev/null; then
  if redis-cli ping &> /dev/null; then
    echo -e "${GREEN}✅${NC} Redis connection successful"
  else
    echo -e "${YELLOW}⚠️${NC}  Cannot connect to Redis (it's optional)"
  fi
else
  echo -e "${YELLOW}⚠️${NC}  redis-cli not installed (it's optional)"
fi

echo ""
echo "==============================================="
echo "Verification Complete!"
echo ""
echo "Next Steps:"
echo "1. npm run setup (initialize database)"
echo "2. npm run dev (start backend server)"
echo "3. npm run worker:dev (start worker, in another terminal)"
echo "4. curl http://localhost:3001/health (test)"
echo ""
