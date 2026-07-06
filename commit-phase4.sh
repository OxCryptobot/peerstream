#!/bin/bash
# Pre-Deployment Git Commit Script
# Commits all Phase 4 scaffolding and wiring changes to GitHub

set -e

echo ""
echo "🔄 Pre-Deployment Git Commit"
echo "============================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check git status
echo "📋 Current Git Status:"
git status --short
echo ""

# Confirm before committing
echo -e "${YELLOW}About to commit and push Phase 4 scaffolding changes.${NC}"
echo "Continue? (y/n)"
read -p "> " confirm

if [ "$confirm" != "y" ]; then
  echo "❌ Cancelled"
  exit 1
fi

echo ""
echo -e "${BLUE}1️⃣  Adding all changes...${NC}"
git add -A

echo ""
echo -e "${BLUE}2️⃣  Creating commit...${NC}"
git commit -m "Phase 4: Complete scaffolding, wiring, and infrastructure setup

- Add database schema initialization (001_init.sql) with 10 tables
- Add database initialization script (db-init.js) with migration & seeding
- Add queue-integrated API endpoints (queueIntegration.js)
- Add server integration guide (INTEGRATION_GUIDE.md)
- Add setup automation scripts (setup.sh, verify-setup.sh, start-services.sh)
- Add database utilities (db-reset.sh)
- Update npm scripts with Phase 4 commands (db:init, db:reset, etc)
- Add deployment execution guide (DEPLOYMENT_EXECUTION.md)
- Add infrastructure checklist (INFRASTRUCTURE_CHECKLIST.md)
- Add comprehensive setup documentation (SETUP_AND_WIRING_COMPLETE.md)

Infrastructure Status:
✅ Message queue system ready (Bull + Redis)
✅ Worker process production-ready
✅ Database schema with proper indexing
✅ Rate limiting distributed across instances
✅ All 5 job handlers implemented
✅ Health monitoring endpoints
✅ Graceful shutdown support

Ready for Heroku deployment to staging."

echo ""
echo -e "${BLUE}3️⃣  Pushing to GitHub...${NC}"
git push origin master

echo ""
echo -e "${GREEN}✅ Successfully committed and pushed to GitHub!${NC}"
echo ""
echo "📊 Commit Info:"
git log --oneline -1
echo ""
echo "🚀 Ready to deploy to Heroku!"
echo "   Next step: heroku login && git push staging master:main"
echo ""
