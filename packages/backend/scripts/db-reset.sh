#!/bin/bash
# Database Reset Script
# WARNING: This will delete all data!

set -e

echo "⚠️  DATABASE RESET WARNING"
echo "=========================="
echo ""
echo "This will delete ALL data in the database!"
echo "Type 'DELETE_ALL' to confirm, or anything else to cancel:"
read -p "> " confirm

if [ "$confirm" != "DELETE_ALL" ]; then
  echo "❌ Cancelled"
  exit 1
fi

echo ""
echo "🔄 Dropping and recreating database..."

DATABASE_URL=${DATABASE_URL:-"postgresql://postgres:postgres@localhost:5432/paytray"}

# Connect to default postgres database to drop paytray
psql "$DATABASE_URL" -c "
  -- Terminate all connections
  SELECT pg_terminate_backend(pg_stat_activity.pid)
  FROM pg_stat_activity
  WHERE pg_stat_activity.datname = 'paytray'
  AND pid <> pg_backend_pid();
  
  -- Drop database
  DROP DATABASE IF EXISTS paytray;
"

echo "✅ Database dropped"

# Recreate and initialize
echo "🔄 Creating fresh database..."
psql "$DATABASE_URL" -c "CREATE DATABASE paytray;"

echo "🔄 Running migrations..."
npm run db:init
npm run db:init:seed

echo ""
echo "✅ Database reset complete!"
echo "🌱 Test data seeded"
echo ""
