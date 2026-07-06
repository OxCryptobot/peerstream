#!/usr/bin/env node

/**
 * Database Migration Runner
 * Runs all SQL migration files in sequential order
 * 
 * Usage:
 *   node migrations/run.js           # Run all pending migrations
 *   node migrations/run.js --up      # Explicitly run up
 *   node migrations/run.js --down    # Rollback (not implemented for SQL)
 *   node migrations/run.js --status  # Show migration status
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPool, closeDatabase } from '../lib/database.js'
import { getLogger } from '../lib/logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const logger = getLogger('MigrationRunner')

/**
 * Get all migration files in order
 */
function getMigrationFiles() {
  const migrationsDir = __dirname
  return fs
    .readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort()
}

/**
 * Get migration history from database
 */
async function getMigrationHistory() {
  const pool = getPool()
  try {
    const result = await pool.query(
      `SELECT * FROM schema_migrations ORDER BY executed_at ASC`
    )
    return result.rows
  } catch (error) {
    // Table doesn't exist yet
    return []
  }
}

/**
 * Create schema_migrations table if it doesn't exist
 */
async function ensureMigrationsTable() {
  const pool = getPool()
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      checksum VARCHAR(64),
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

/**
 * Calculate MD5 checksum of file content
 */
function getFileChecksum(content) {
  const crypto = await import('crypto')
  return crypto
    .createHash('md5')
    .update(content)
    .digest('hex')
}

/**
 * Run a single migration file
 */
async function runMigration(filename) {
  const filePath = path.join(__dirname, filename)
  const content = fs.readFileSync(filePath, 'utf8')
  const checksum = getFileChecksum(content)

  const pool = getPool()
  const client = await pool.connect()

  try {
    logger.info(`Running migration: ${filename}`)

    // Start transaction
    await client.query('BEGIN')

    // Execute migration SQL
    // Split by semicolons and execute each statement
    const statements = content
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (const statement of statements) {
      await client.query(statement)
    }

    // Record migration in schema_migrations
    await client.query(
      `INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)`,
      [filename, checksum]
    )

    // Commit
    await client.query('COMMIT')
    logger.info(`✓ Migration completed: ${filename}`)

    return { success: true, filename }
  } catch (error) {
    await client.query('ROLLBACK')
    logger.error(`✗ Migration failed: ${filename}`, error)
    throw error
  } finally {
    client.release()
  }
}

/**
 * Run all pending migrations
 */
async function runMigrations() {
  try {
    // Initialize database connection
    const pool = getPool()
    await pool.query('SELECT NOW()')

    // Ensure migrations table exists
    await ensureMigrationsTable()

    // Get pending migrations
    const allMigrations = getMigrationFiles()
    const history = await getMigrationHistory()
    const executed = new Set(history.map(m => m.name))

    const pending = allMigrations.filter(m => !executed.has(m))

    if (pending.length === 0) {
      logger.info('✓ All migrations are up to date')
      return { pending: 0, executed: 0 }
    }

    logger.info(`Found ${pending.length} pending migration(s)`)

    let executedCount = 0
    for (const filename of pending) {
      await runMigration(filename)
      executedCount++
    }

    logger.info(`✓ Successfully executed ${executedCount} migration(s)`)

    return {
      pending: pending.length,
      executed: executedCount,
      total: allMigrations.length
    }
  } catch (error) {
    logger.error('Migration runner failed', error)
    throw error
  }
}

/**
 * Show migration status
 */
async function showStatus() {
  try {
    const pool = getPool()
    await pool.query('SELECT NOW()')

    await ensureMigrationsTable()

    const allMigrations = getMigrationFiles()
    const history = await getMigrationHistory()
    const executed = new Set(history.map(m => m.name))

    console.log('\n📊 Migration Status\n')
    console.log('Executed Migrations:')
    history.forEach(m => {
      console.log(`  ✓ ${m.name} (${m.executed_at})`)
    })

    const pending = allMigrations.filter(m => !executed.has(m))
    if (pending.length > 0) {
      console.log('\nPending Migrations:')
      pending.forEach(m => {
        console.log(`  ⏳ ${m}`)
      })
    } else {
      console.log('\n✓ All migrations are executed')
    }

    console.log(
      `\nTotal: ${history.length} executed / ${pending.length} pending\n`
    )
  } catch (error) {
    logger.error('Status check failed', error)
    throw error
  }
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'up'

  try {
    switch (command) {
      case '--up':
      case 'up':
      case '':
        await runMigrations()
        break

      case '--status':
      case 'status':
        await showStatus()
        break

      case '--down':
      case 'down':
        logger.warn('Down migrations not supported for SQL migrations')
        logger.info('To rollback, manually restore from database backup')
        break

      default:
        logger.error(`Unknown command: ${command}`)
        console.log('Usage: node migrations/run.js [up|status|down]')
        process.exit(1)
    }

    process.exit(0)
  } catch (error) {
    logger.error('Fatal error', error)
    process.exit(1)
  } finally {
    await closeDatabase()
  }
}

// Run migrations
main()
