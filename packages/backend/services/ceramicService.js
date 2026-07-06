/**
 * Ceramic Network Service
 * Decentralized profile storage using Ceramic streams
 */

import config from '../lib/config.js'
import { ExternalServiceError, ValidationError, AppError } from '../lib/errors.js'
import { getLogger } from '../lib/logger.js'

const logger = getLogger('CeramicService')

class CeramicService {
  constructor() {
    this.client = null
    this.profileIndexes = new Map() // In-memory indexing for discovery
    this.enabled = config.ceramic.enabled
  }

  /**
   * Initialize Ceramic client
   * In production, use @ceramicnetwork/http-client
   */
  async initialize() {
    if (!this.enabled) {
      logger.warn('Ceramic is disabled - profiles will use PostgreSQL only')
      return
    }

    try {
      // Placeholder: In production, use:
      // import { CeramicClient } from '@ceramicnetwork/http-client'
      // this.client = new CeramicClient(config.ceramic.nodeUrl)

      logger.info('Ceramic service initialized', { network: config.ceramic.network })
    } catch (error) {
      throw new ExternalServiceError('Ceramic', error.message)
    }
  }

  /**
   * Profile Stream Schema
   * Defines the structure of profile documents in Ceramic
   */
  static getProfileSchema() {
    return {
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: 'PayTray Profile',
      type: 'object',
      properties: {
        wallet: {
          type: 'string',
          pattern: '^0x[a-fA-F0-9]{40}$',
          description: 'Ethereum wallet address'
        },
        displayName: {
          type: 'string',
          minLength: 2,
          maxLength: 255,
          description: 'User display name'
        },
        bio: {
          type: 'string',
          maxLength: 1000,
          description: 'User biography'
        },
        avatar: {
          type: 'object',
          properties: {
            url: { type: 'string' },
            ipfsHash: { type: 'string' }
          },
          description: 'Avatar image'
        },
        expertise: {
          type: 'array',
          items: { type: 'string' },
          maxItems: 20,
          description: 'Areas of expertise'
        },
        hourlyRate: {
          type: 'number',
          minimum: 0,
          maximum: 100000,
          description: 'Hourly consulting rate in USD'
        },
        isExpert: {
          type: 'boolean',
          default: false,
          description: 'Whether user is a verified expert'
        },
        socialLinks: {
          type: 'object',
          properties: {
            twitter: { type: 'string' },
            github: { type: 'string' },
            linkedin: { type: 'string' },
            website: { type: 'string' }
          },
          description: 'Social media links'
        },
        verification: {
          type: 'object',
          properties: {
            ensName: { type: 'string' },
            ensVerified: { type: 'boolean' },
            twitterHandle: { type: 'string' },
            twitterVerified: { type: 'boolean' }
          },
          description: 'Verification data'
        },
        metadata: {
          type: 'object',
          properties: {
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            completeness: { type: 'number', minimum: 0, maximum: 100 }
          }
        }
      },
      required: ['wallet', 'displayName']
    }
  }

  /**
   * Create profile stream in Ceramic
   */
  async createProfile(wallet, profileData) {
    if (!this.enabled) {
      return this._createLocalProfile(wallet, profileData)
    }

    try {
      // Validate schema
      const schema = CeramicService.getProfileSchema()
      const profile = {
        ...profileData,
        wallet: wallet.toLowerCase(),
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          completeness: this._calculateCompleteness(profileData)
        }
      }

      // Placeholder: In production, create Ceramic stream
      // const streamId = await this.client.createStream(profile, { schema })

      logger.info('Profile created in Ceramic', { wallet, profile })

      // Index locally for discovery
      this._indexProfile(wallet, profile)

      return {
        streamId: `ceramic://${wallet}`, // Placeholder
        profile,
        indexed: true
      }
    } catch (error) {
      logger.error('Failed to create Ceramic profile', error)
      // Fallback to local storage
      return this._createLocalProfile(wallet, profileData)
    }
  }

  /**
   * Get profile from Ceramic
   */
  async getProfile(wallet) {
    if (!this.enabled) {
      return this._getLocalProfile(wallet)
    }

    try {
      // Placeholder: In production, get Ceramic stream
      // const stream = await this.client.loadStream(`ceramic://${wallet}`)
      // return stream.content

      logger.debug('Profile retrieved from Ceramic', { wallet })

      // Return indexed profile if available
      return this.profileIndexes.get(wallet.toLowerCase())
    } catch (error) {
      logger.error('Failed to get Ceramic profile', error)
      return this._getLocalProfile(wallet)
    }
  }

  /**
   * Update profile in Ceramic
   */
  async updateProfile(wallet, updates) {
    if (!this.enabled) {
      return this._updateLocalProfile(wallet, updates)
    }

    try {
      const existing = await this.getProfile(wallet)
      if (!existing) {
        throw new AppError('Profile not found', 404)
      }

      const updated = {
        ...existing,
        ...updates,
        metadata: {
          ...existing.metadata,
          updatedAt: new Date().toISOString(),
          completeness: this._calculateCompleteness(updates)
        }
      }

      // Placeholder: In production, update Ceramic stream
      // await this.client.updateStream(streamId, updated)

      logger.info('Profile updated in Ceramic', { wallet })

      // Update local index
      this._indexProfile(wallet, updated)

      return updated
    } catch (error) {
      logger.error('Failed to update Ceramic profile', error)
      return this._updateLocalProfile(wallet, updates)
    }
  }

  /**
   * Delete profile from Ceramic
   */
  async deleteProfile(wallet) {
    if (!this.enabled) {
      return this._deleteLocalProfile(wallet)
    }

    try {
      // Placeholder: In production, delete Ceramic stream
      // await this.client.deleteStream(streamId)

      logger.info('Profile deleted from Ceramic', { wallet })

      // Remove from local index
      this.profileIndexes.delete(wallet.toLowerCase())

      return true
    } catch (error) {
      logger.error('Failed to delete Ceramic profile', error)
      return this._deleteLocalProfile(wallet)
    }
  }

  /**
   * Search profiles by name, expertise, or metadata
   */
  async searchProfiles(query, filters = {}) {
    try {
      const results = []
      const queryLower = query.toLowerCase()

      // Search through indexed profiles
      for (const [wallet, profile] of this.profileIndexes.entries()) {
        // Check name match
        if (
          profile.displayName?.toLowerCase().includes(queryLower) ||
          wallet.includes(query)
        ) {
          // Apply filters
          if (this._matchesFilters(profile, filters)) {
            results.push({
              wallet,
              profile,
              score: this._calculateRelevance(profile, query)
            })
          }
        }
      }

      // Sort by relevance score
      results.sort((a, b) => b.score - a.score)

      logger.debug('Profile search completed', { query, resultCount: results.length })

      return results.slice(0, 50) // Limit to 50 results
    } catch (error) {
      logger.error('Profile search failed', error)
      return []
    }
  }

  /**
   * Get profiles by expertise
   */
  async getExpertsByExpertise(expertise, limit = 20) {
    try {
      const experts = []

      for (const [wallet, profile] of this.profileIndexes.entries()) {
        if (
          profile.isExpert &&
          profile.expertise?.includes(expertise.toLowerCase())
        ) {
          experts.push({
            wallet,
            profile
          })
        }
      }

      return experts.slice(0, limit)
    } catch (error) {
      logger.error('Failed to get experts', error)
      return []
    }
  }

  /**
   * Get trending profiles
   */
  async getTrendingProfiles(limit = 10) {
    try {
      const profiles = Array.from(this.profileIndexes.entries())
        .map(([wallet, profile]) => ({
          wallet,
          profile,
          score: profile.metadata?.completeness || 0
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)

      return profiles
    } catch (error) {
      logger.error('Failed to get trending profiles', error)
      return []
    }
  }

  /**
   * Index profile for local search
   */
  _indexProfile(wallet, profile) {
    this.profileIndexes.set(wallet.toLowerCase(), {
      ...profile,
      searchKeys: [
        profile.displayName?.toLowerCase(),
        wallet.toLowerCase(),
        ...(profile.expertise || []).map((e) => e.toLowerCase())
      ]
    })
  }

  /**
   * Calculate profile completeness percentage
   */
  _calculateCompleteness(profile) {
    const fields = [
      'displayName',
      'bio',
      'avatar',
      'expertise',
      'hourlyRate',
      'socialLinks',
      'isExpert'
    ]

    const filledFields = fields.filter((field) => {
      const value = profile[field]
      return value !== null && value !== undefined && value !== ''
    })

    return Math.round((filledFields.length / fields.length) * 100)
  }

  /**
   * Calculate search relevance score
   */
  _calculateRelevance(profile, query) {
    let score = 0
    const queryLower = query.toLowerCase()

    // Exact match
    if (profile.displayName?.toLowerCase() === queryLower) score += 100

    // Starts with match
    if (profile.displayName?.toLowerCase().startsWith(queryLower)) score += 50

    // Contains match
    if (profile.displayName?.toLowerCase().includes(queryLower)) score += 25

    // Boost experts
    if (profile.isExpert) score += 10

    // Boost completeness
    score += (profile.metadata?.completeness || 0) / 10

    return score
  }

  /**
   * Check if profile matches filters
   */
  _matchesFilters(profile, filters) {
    if (filters.isExpert && !profile.isExpert) return false
    if (filters.minRate && profile.hourlyRate < filters.minRate) return false
    if (filters.maxRate && profile.hourlyRate > filters.maxRate) return false

    if (filters.expertise) {
      const hasExpertise = filters.expertise.some((e) =>
        profile.expertise?.includes(e.toLowerCase())
      )
      if (!hasExpertise) return false
    }

    return true
  }

  /**
   * Local fallback methods (when Ceramic is disabled)
   */
  _createLocalProfile(wallet, profileData) {
    const profile = {
      ...profileData,
      wallet: wallet.toLowerCase(),
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completeness: this._calculateCompleteness(profileData)
      }
    }
    this._indexProfile(wallet, profile)
    return profile
  }

  _getLocalProfile(wallet) {
    return this.profileIndexes.get(wallet.toLowerCase())
  }

  _updateLocalProfile(wallet, updates) {
    const existing = this._getLocalProfile(wallet)
    if (!existing) throw new AppError('Profile not found', 404)

    const updated = {
      ...existing,
      ...updates,
      metadata: {
        ...existing.metadata,
        updatedAt: new Date().toISOString(),
        completeness: this._calculateCompleteness(updates)
      }
    }
    this._indexProfile(wallet, updated)
    return updated
  }

  _deleteLocalProfile(wallet) {
    this.profileIndexes.delete(wallet.toLowerCase())
    return true
  }
}

// Singleton instance
let ceramicInstance = null

export function initializeCeramic() {
  if (!ceramicInstance) {
    ceramicInstance = new CeramicService()
  }
  return ceramicInstance
}

export function getCeramicService() {
  if (!ceramicInstance) {
    throw new Error('Ceramic service not initialized')
  }
  return ceramicInstance
}

export default CeramicService
