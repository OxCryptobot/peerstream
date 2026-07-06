/**
 * Ceramic Service Abstraction Layer
 * 
 * FRAGILE POINT FIX: Abstracts Ceramic API so switching providers is easy
 * If Ceramic API changes or service goes down, we can fallback to IPFS or PostgreSQL
 */

import { getLogger } from '../lib/logger.js'

const logger = getLogger('CeramicAbstraction')

/**
 * Abstraction interface for profile storage
 * Implementations: Ceramic, IPFS, PostgreSQL fallback
 */
class ProfileStorageAdapter {
  constructor(provider = 'ceramic') {
    this.provider = provider
    this.adapter = null
    this.initAdapter()
  }

  initAdapter() {
    switch (this.provider) {
      case 'ceramic':
        this.adapter = new CeramicAdapter()
        logger.info('Using Ceramic adapter')
        break
      case 'ipfs':
        this.adapter = new IPFSAdapter()
        logger.info('Using IPFS fallback adapter')
        break
      case 'postgres':
        this.adapter = new PostgreSQLAdapter()
        logger.info('Using PostgreSQL fallback adapter')
        break
      default:
        throw new Error(`Unknown provider: ${provider}`)
    }
  }

  /**
   * Create or update profile
   * Returns: { id, wallet, displayName, bio, expertise[], metadata }
   */
  async createProfile(wallet, profileData) {
    try {
      return await this.adapter.create(wallet, profileData)
    } catch (error) {
      logger.error('Failed to create profile', error, { provider: this.provider })
      // Fallback to next provider
      if (this.provider !== 'postgres') {
        logger.warn(`Falling back from ${this.provider} to postgres`)
        this.provider = 'postgres'
        this.initAdapter()
        return await this.adapter.create(wallet, profileData)
      }
      throw error
    }
  }

  async getProfile(wallet) {
    try {
      return await this.adapter.get(wallet)
    } catch (error) {
      logger.error('Failed to get profile', error, { provider: this.provider })
      if (this.provider !== 'postgres') {
        this.provider = 'postgres'
        this.initAdapter()
        return await this.adapter.get(wallet)
      }
      throw error
    }
  }

  async updateProfile(wallet, updates) {
    try {
      return await this.adapter.update(wallet, updates)
    } catch (error) {
      logger.error('Failed to update profile', error)
      if (this.provider !== 'postgres') {
        this.provider = 'postgres'
        this.initAdapter()
        return await this.adapter.update(wallet, updates)
      }
      throw error
    }
  }

  async deleteProfile(wallet) {
    try {
      return await this.adapter.delete(wallet)
    } catch (error) {
      logger.error('Failed to delete profile', error)
      if (this.provider !== 'postgres') {
        this.provider = 'postgres'
        this.initAdapter()
        return await this.adapter.delete(wallet)
      }
      throw error
    }
  }

  async searchProfiles(query, filters) {
    try {
      return await this.adapter.search(query, filters)
    } catch (error) {
      logger.error('Failed to search profiles', error)
      if (this.provider !== 'postgres') {
        this.provider = 'postgres'
        this.initAdapter()
        return await this.adapter.search(query, filters)
      }
      throw error
    }
  }

  /**
   * Returns current active provider
   */
  getActiveProvider() {
    return this.provider
  }

  /**
   * Switch provider (for scaling decisions)
   */
  switchProvider(newProvider) {
    logger.info(`Switching from ${this.provider} to ${newProvider}`)
    this.provider = newProvider
    this.initAdapter()
  }
}

/**
 * Ceramic Implementation
 * Primary provider for decentralized storage
 */
class CeramicAdapter {
  async create(wallet, profileData) {
    // Existing ceramicService.createProfile logic
    // But wrapped so we can handle API changes
    try {
      return await ceramicService.createProfile(wallet, profileData)
    } catch (error) {
      if (error.message.includes('API')) {
        logger.error('Ceramic API error - may indicate version change', error)
        throw new Error('CeramicAPIError')
      }
      throw error
    }
  }

  async get(wallet) {
    return await ceramicService.getProfile(wallet)
  }

  async update(wallet, updates) {
    return await ceramicService.updateProfile(wallet, updates)
  }

  async delete(wallet) {
    return await ceramicService.deleteProfile(wallet)
  }

  async search(query, filters) {
    return await ceramicService.searchProfiles(query, filters)
  }
}

/**
 * IPFS Fallback
 * Decentralized storage alternative
 */
class IPFSAdapter {
  constructor() {
    // Initialize IPFS client if available
    this.ipfs = null
  }

  async create(wallet, profileData) {
    // Store profile IPFS and index wallet -> IPFS hash in PostgreSQL
    logger.info('Storing profile on IPFS', { wallet })
    // Implementation would use ipfs-http-client
    throw new Error('IPFS adapter not yet implemented')
  }

  async get(wallet) {
    // Retrieve from PostgreSQL index
    logger.info('Retrieving profile from IPFS', { wallet })
    throw new Error('IPFS adapter not yet implemented')
  }

  async update(wallet, updates) {
    throw new Error('IPFS adapter not yet implemented')
  }

  async delete(wallet) {
    throw new Error('IPFS adapter not yet implemented')
  }

  async search(query, filters) {
    throw new Error('IPFS adapter not yet implemented')
  }
}

/**
 * PostgreSQL Fallback
 * Simple centralized storage - always works
 */
class PostgreSQLAdapter {
  async create(wallet, profileData) {
    logger.info('Storing profile in PostgreSQL (fallback)', { wallet })
    const { getPool } = await import('../lib/database.js')
    const pool = getPool()

    const result = await pool.query(
      `INSERT INTO profiles (wallet, data, created_at) VALUES ($1, $2, NOW())
       RETURNING *`,
      [wallet, JSON.stringify(profileData)]
    )
    return result.rows[0]
  }

  async get(wallet) {
    const { getPool } = await import('../lib/database.js')
    const pool = getPool()

    const result = await pool.query(
      'SELECT * FROM profiles WHERE wallet = $1',
      [wallet]
    )
    return result.rows[0]
  }

  async update(wallet, updates) {
    const { getPool } = await import('../lib/database.js')
    const pool = getPool()

    const result = await pool.query(
      `UPDATE profiles SET data = $1, updated_at = NOW()
       WHERE wallet = $2 RETURNING *`,
      [JSON.stringify(updates), wallet]
    )
    return result.rows[0]
  }

  async delete(wallet) {
    const { getPool } = await import('../lib/database.js')
    const pool = getPool()

    await pool.query('DELETE FROM profiles WHERE wallet = $1', [wallet])
    return { success: true }
  }

  async search(query, filters) {
    const { getPool } = await import('../lib/database.js')
    const pool = getPool()

    const result = await pool.query(
      `SELECT * FROM profiles WHERE data::text ILIKE $1 LIMIT 50`,
      [`%${query}%`]
    )
    return result.rows
  }
}

// Singleton instance
let storageAdapter = null

/**
 * Get or create storage adapter
 */
export function getProfileStorage(provider = 'ceramic') {
  if (!storageAdapter) {
    storageAdapter = new ProfileStorageAdapter(provider)
  }
  return storageAdapter
}

/**
 * Switch storage provider at runtime
 */
export function switchProfileProvider(provider) {
  if (storageAdapter) {
    storageAdapter.switchProvider(provider)
  } else {
    storageAdapter = new ProfileStorageAdapter(provider)
  }
}

export { ProfileStorageAdapter }
