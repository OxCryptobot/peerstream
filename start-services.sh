#!/bin/bash
# PayTray Full Stack Startup Script
# Starts all services for local development

set -e

echo ""
echo "🚀 PayTray Full Stack Development Server"
echo "========================================"
echo ""

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
  echo -e "${YELLOW}⚠️  docker-compose not found${NC}"
  echo "Make sure PostgreSQL (port 5432) and Redis (port 6379) are running"
fi

echo "📋 Startup Configuration:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3001"
echo "  PgAdmin:  http://localhost:5050"
echo "  Redis:    localhost:6379"
echo ""

# Function to stop on Ctrl+C
cleanup() {
  echo ""
  echo -e "${YELLOW}Shutting down services...${NC}"
  docker-compose down 2>/dev/null || true
  echo -e "${GREEN}✅ Services stopped${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# Start Docker services
echo -e "${BLUE}1️⃣  Starting Docker services...${NC}"
docker-compose up -d postgres redis pgadmin redis-commander 2>/dev/null || {
  echo -e "${YELLOW}⚠️  Docker services failed to start${NC}"
  echo "Make sure Docker is running"
}

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 3

# Check database connection
echo -e "${BLUE}2️⃣  Checking database connection...${NC}"
for i in {1..30}; do
  if docker-compose exec -T postgres pg_isready -U postgres &>/dev/null; then
    echo -e "${GREEN}✅ PostgreSQL ready${NC}"
    break
  fi
  if [ $i -eq 30 ]; then
    echo -e "${YELLOW}⚠️  PostgreSQL not ready (timeout)${NC}"
  else
    echo "  Attempt $i/30..."
    sleep 1
  fi
done

# Initialize database if needed
echo -e "${BLUE}3️⃣  Initializing database...${NC}"
if [ -f "packages/backend/migrations/001_init.sql" ]; then
  docker-compose exec -T postgres psql -U postgres -d paytray -f /docker-entrypoint-initdb.d/init.sql 2>/dev/null || {
    echo "  Database already initialized"
  }
  echo -e "${GREEN}✅ Database ready${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}All Services Started Successfully!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo "📚 Service Endpoints:"
echo -e "  ${BLUE}Frontend:${NC}         http://localhost:5173"
echo -e "  ${BLUE}Backend API:${NC}      http://localhost:3001"
echo -e "  ${BLUE}PgAdmin:${NC}          http://localhost:5050  (admin/admin)"
echo -e "  ${BLUE}Redis Commander:${NC}  http://localhost:8081"
echo -e "  ${BLUE}PostgreSQL:${NC}       localhost:5432"
echo -e "  ${BLUE}Redis:${NC}            localhost:6379"
echo ""
echo "🛠️  Next: In separate terminals:"
echo "  1. Backend:  cd packages/backend && npm run dev"
echo "  2. Worker:   cd packages/backend && npm run worker:dev"
echo "  3. Frontend: cd packages/react-app && npm run dev"
echo ""
echo "🌐 Health Check:"
echo "  curl http://localhost:3001/health"
echo ""
echo "⏹️  Press Ctrl+C to stop all services"
echo ""

# Keep the script running
wait
