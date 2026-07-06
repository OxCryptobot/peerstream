#!/bin/bash
# PayTray Backend - Local Development Setup
# Run this once to set up your local environment

set -e

echo "🚀 PayTray Backend Setup"
echo "========================"

# 1. Create local environment file
echo "📝 Creating .env.local..."
if [ ! -f packages/backend/.env.local ]; then
  cp packages/backend/.env.example packages/backend/.env.local
  echo "✅ Created packages/backend/.env.local"
  echo "⚠️  Please update packages/backend/.env.local with your values"
else
  echo "✓ .env.local already exists"
fi

# 2. Create frontend environment file
echo "📝 Creating React app environment..."
if [ ! -f packages/react-app/.env.local ]; then
  cat > packages/react-app/.env.local << 'EOF'
VITE_API_URL=http://localhost:3001
VITE_LIVEKIT_URL=http://localhost:7880
VITE_CERAMIC_NODE=http://localhost:7007
VITE_ETHEREUM_RPC=https://eth.llamarpc.com
VITE_SEPOLIA_RPC=https://sepolia.drpc.org
EOF
  echo "✅ Created packages/react-app/.env.local"
else
  echo "✓ .env.local already exists"
fi

# 3. Install dependencies
echo "📦 Installing dependencies..."
npm install
cd packages/backend && npm install && cd ../..
cd packages/react-app && npm install && cd ../..
echo "✅ Dependencies installed"

# 4. Start Docker services
echo "🐳 Starting Docker services (PostgreSQL, Redis, LiveKit)..."
if command -v docker-compose &> /dev/null; then
  docker-compose up -d
  echo "✅ Docker services started"
  echo "   - PostgreSQL: localhost:5432"
  echo "   - Redis: localhost:6379"
  echo "   - LiveKit: localhost:7880"
  sleep 3
else
  echo "⚠️  docker-compose not found. Skipping Docker setup."
  echo "   Make sure PostgreSQL and Redis are running manually"
fi

# 5. Initialize database
echo "💾 Initializing database..."
cd packages/backend
npm run db:init
echo "✅ Database initialized"

# 6. Run migrations
echo "🔄 Running migrations..."
npm run db:migrate
echo "✅ Migrations complete"

# 7. Seed test data (optional)
echo "🌱 Would you like to seed test data? (y/n)"
read -r seed_choice
if [ "$seed_choice" = "y" ]; then
  npm run db:seed
  echo "✅ Test data seeded"
fi

cd ../..

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "==========="
echo "1. Update packages/backend/.env.local with your API keys"
echo "2. Run: npm run dev (in packages/backend)"
echo "3. Run: npm run worker:dev (in packages/backend, in another terminal)"
echo "4. Run: npm run dev (in packages/react-app, in another terminal)"
echo ""
echo "Frontend: http://localhost:5173"
echo "Backend: http://localhost:3001"
echo "Worker: (background process, check logs)"
echo ""
