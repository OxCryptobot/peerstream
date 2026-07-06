/**
 * Database Connection Management
 * Connection pooling, query utilities, and transaction management
 */

import pg from 'pg'
import config from './config.js'
import { ExternalServiceError } from './errors.js'

const { Pool } = pg

let pool = null

/**
 * Initialize database connection pool
 */
export async function initializeDatabase() {
  try {
    // Create pool from DATABASE_URL or individual parameters
    pool = new Pool({
      ...(config.database.url ? { connectionString: config.database.url } : config.database),
      max: config.database.pool.max,
      min: config.database.pool.min,
      idleTimeoutMillis: config.database.pool.idleTimeoutMillis,
      connectionTimeoutMillis: config.database.pool.connectionTimeoutMillis
    })

    // Test connection
    const client = await pool.connect()
    const result = await client.query('SELECT NOW()')
    client.release()

    console.log('✅ Database connected:', result.rows[0])
    return pool
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    throw new ExternalServiceError('Database', error.message)
  }
}

/**
 * Get database pool
 */
export function getPool() {
  if (!pool) {
    throw new Error('Database not initialized')
  }
  return pool
}

/**
 * Query helper with error handling
 */
export async function query(sql, params = []) {
  try {
    const result = await pool.query(sql, params)
    return result
  } catch (error) {
    console.error('Database query error:', {
      sql,
      error: error.message,
      code: error.code
    })
    throw new ExternalServiceError('Database', error.message)
  }
}

/**
 * Transaction helper
 */
export async function transaction(callback) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

/**
 * Database models helper
 */
export function createModel(tableName) {
  return {
    /**
     * Find by ID
     */
    async findById(id) {
      const result = await query(
        `SELECT * FROM ${tableName} WHERE id = $1`,
        [id]
      )
      return result.rows[0]
    },

    /**
     * Find all with optional filters
     */
    async findAll(filters = {}, limit = 100, offset = 0) {
      let whereClause = ''
      const params = []

      if (Object.keys(filters).length > 0) {
        whereClause = 'WHERE ' + Object.keys(filters)
          .map((key, idx) => `${key} = $${idx + 1}`)
          .join(' AND ')
        params.push(...Object.values(filters))
      }

      params.push(limit, offset)
      const sql = `
        SELECT * FROM ${tableName}
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}
      `

      const result = await query(sql, params)
      return result.rows
    },

    /**
     * Find one by field
     */
    async findOne(field, value) {
      const result = await query(
        `SELECT * FROM ${tableName} WHERE ${field} = $1`,
        [value]
      )
      return result.rows[0]
    },

    /**
     * Create record
     */
    async create(data) {
      const keys = Object.keys(data)
      const values = Object.values(data)
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')

      const sql = `
        INSERT INTO ${tableName} (${keys.join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `

      const result = await query(sql, values)
      return result.rows[0]
    },

    /**
     * Update record
     */
    async update(id, data) {
      const keys = Object.keys(data)
      const values = Object.values(data)
      const setClause = keys
        .map((key, i) => `${key} = $${i + 1}`)
        .join(', ')

      const sql = `
        UPDATE ${tableName}
        SET ${setClause}
        WHERE id = $${keys.length + 1}
        RETURNING *
      `

      const result = await query(sql, [...values, id])
      return result.rows[0]
    },

    /**
     * Delete record
     */
    async delete(id) {
      const result = await query(
        `DELETE FROM ${tableName} WHERE id = $1 RETURNING *`,
        [id]
      )
      return result.rows[0]
    },

    /**
     * Count records
     */
    async count(filters = {}) {
      let whereClause = ''
      const params = []

      if (Object.keys(filters).length > 0) {
        whereClause = 'WHERE ' + Object.keys(filters)
          .map((key, idx) => `${key} = $${idx + 1}`)
          .join(' AND ')
        params.push(...Object.values(filters))
      }

      const sql = `SELECT COUNT(*) as count FROM ${tableName} ${whereClause}`
      const result = await query(sql, params)
      return parseInt(result.rows[0].count, 10)
    }
  }
}

/**
 * Close pool
 */
export async function closeDatabase() {
  if (pool) {
    await pool.end()
    pool = null
    console.log('✅ Database pool closed')
  }
}

export default {
  initializeDatabase,
  getPool,
  query,
  transaction,
  createModel,
  closeDatabase
}
