#!/bin/bash
# PayTray Backend - Local Development Startup
# Start the backend server in development mode

cd packages/backend

# Load environment
if [ ! -f .env.local ]; then
  echo "❌ .env.local not found. Please run: npm run setup"
  exit 1
fi

echo "🚀 Starting PayTray Backend (Development Mode)"
echo "=============================================="
echo ""
echo "Environment: development"
echo "Port: 3001"
echo "Worker: Run 'npm run worker:dev' in another terminal"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start with nodemon for auto-reload
npm run dev
