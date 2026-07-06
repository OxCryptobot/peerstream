/**
 * Database Initialization Script
 * Run migrations and set up database
 */

import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/paytray'
})

async function runMigrations() {
  const client = await pool.connect()

  try {
    console.log('🔄 Running database migrations...')

    // Get all migration files
    const migrationsDir = path.join(__dirname, 'migrations')
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort()

    for (const file of files) {
      const filePath = path.join(migrationsDir, file)
      const sql = fs.readFileSync(filePath, 'utf-8')

      console.log(`  Running: ${file}`)
      await client.query(sql)
      console.log(`  ✅ ${file} complete`)
    }

    console.log('✅ All migrations complete')
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    throw error
  } finally {
    client.release()
  }
}

async function seedTestData() {
  const client = await pool.connect()

  try {
    console.log('🌱 Seeding test data...')

    // Clear existing test data
    await client.query('TRUNCATE users, profiles, payment_streams, video_calls CASCADE')

    // Create test users
    const testUsers = [
      { wallet: '0x1111111111111111111111111111111111111111', ens: 'alice.eth' },
      { wallet: '0x2222222222222222222222222222222222222222', ens: 'bob.eth' },
      { wallet: '0x3333333333333333333333333333333333333333', ens: 'charlie.eth' }
    ]

    for (const user of testUsers) {
      await client.query(
        'INSERT INTO users (wallet_address, ens_name, is_active) VALUES ($1, $2, $3)',
        [user.wallet.toLowerCase(), user.ens, true]
      )
    }

    console.log(`  ✅ Created ${testUsers.length} test users`)

    // Create test profiles
    const profiles = [
      { wallet: testUsers[0].wallet, name: 'Alice Developer', expertise: '{React,TypeScript,Web3}', rate: 150 },
      { wallet: testUsers[1].wallet, name: 'Bob Designer', expertise: '{UI,UX,Figma}', rate: 120 },
      { wallet: testUsers[2].wallet, name: 'Charlie DevOps', expertise: '{Docker,Kubernetes,AWS}', rate: 180 }
    ]

    for (const profile of profiles) {
      const user = await client.query('SELECT id FROM users WHERE wallet_address = $1', [profile.wallet.toLowerCase()])
      if (user.rows.length > 0) {
        await client.query(
          'INSERT INTO profiles (user_id, name, expertise, hourly_rate, is_public) VALUES ($1, $2, $3, $4, $5)',
          [user.rows[0].id, profile.name, profile.expertise, profile.rate, true]
        )
      }
    }

    console.log('✅ Test data seeded')
  } catch (error) {
    console.error('❌ Seeding failed:', error.message)
    throw error
  } finally {
    client.release()
  }
}

async function main() {
  try {
    await runMigrations()

    const shouldSeed = process.argv.includes('--seed')
    if (shouldSeed) {
      await seedTestData()
    }

    console.log('✨ Database initialization complete!')
  } catch (error) {
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()
