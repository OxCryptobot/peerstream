/**
 * API Versioning Support
 * 
 * Allows multiple API versions to run simultaneously
 * Enables safe breaking changes without breaking clients
 * 
 * Usage:
 *   GET /api/v1/profiles/:wallet
 *   GET /api/v2/profiles/:wallet
 */

import express from 'express'
import { getLogger } from '../lib/logger.js'

const logger = getLogger('APIVersioning')

/**
 * API Version Manager
 * Manages multiple versions of the same endpoint
 */
class APIVersionManager {
  constructor() {
    this.versions = new Map()
    this.defaultVersion = 'v1'
    this.deprecatedVersions = new Set()
  }

  /**
   * Register an API version
   * @param {string} version - Version identifier (e.g., 'v1', 'v2')
   * @param {string} endpoint - Endpoint path (e.g., '/profiles/:wallet')
   * @param {function} handler - Handler function
   * @param {object} options - Version options
   */
  registerVersion(version, endpoint, handler, options = {}) {
    const { deprecated = false, deprecationDate = null, sunsettingDate = null } = options

    const key = `${version}:${endpoint}`

    if (!this.versions.has(key)) {
      this.versions.set(key, {
        handler,
        deprecated,
        deprecationDate,
        sunsettingDate,
        createdAt: new Date()
      })
      logger.info(`Registered API endpoint: ${key}`)
    }

    if (deprecated) {
      this.deprecatedVersions.add(version)
      logger.warn(`API version ${version} is deprecated`, {
        deprecationDate,
        sunsettingDate
      })
    }
  }

  /**
   * Get handler for specific version and endpoint
   */
  getHandler(version, endpoint) {
    const key = `${version}:${endpoint}`
    return this.versions.get(key)?.handler
  }

  /**
   * Check if version is deprecated
   */
  isDeprecated(version) {
    return this.deprecatedVersions.has(version)
  }

  /**
   * Get all available versions for an endpoint
   */
  getVersions(endpoint) {
    const versions = []
    for (const [key, data] of this.versions.entries()) {
      const [version, ep] = key.split(':')
      if (ep === endpoint) {
        versions.push({
          version,
          deprecated: data.deprecated,
          deprecationDate: data.deprecationDate,
          sunsettingDate: data.sunsettingDate
        })
      }
    }
    return versions
  }
}

// Singleton instance
let versionManager = null

export function getVersionManager() {
  if (!versionManager) {
    versionManager = new APIVersionManager()
  }
  return versionManager
}

/**
 * Middleware to handle versioned endpoints
 */
export function createVersionedRoute(endpoint, handlers = {}) {
  const router = express.Router()
  const manager = getVersionManager()

  /**
   * Handler that routes to correct version
   */
  const versionedHandler = async (req, res, next) => {
    // Extract version from URL or header
    const version = req.params.apiVersion || req.headers['api-version'] || 'v1'
    const handler = manager.getHandler(version, endpoint)

    if (!handler) {
      logger.warn(`No handler for version ${version}`, { endpoint })
      return res.status(400).json({
        error: 'InvalidAPIVersion',
        message: `API version ${version} not available for this endpoint`,
        availableVersions: manager.getVersions(endpoint)
      })
    }

    // Add deprecation warning header if version is deprecated
    if (manager.isDeprecated(version)) {
      const versionInfo = manager.versions.get(`${version}:${endpoint}`)
      res.setHeader('Deprecation', 'true')
      res.setHeader('Sunset', versionInfo.sunsettingDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toUTCString())
      res.setHeader(
        'Warning',
        `299 - "API version ${version} is deprecated. Please migrate to a newer version."`
      )

      logger.info(`Deprecated API version used: ${version}`, { endpoint })
    }

    // Add API version to request for logging
    req.apiVersion = version

    // Call the appropriate handler
    try {
      await handler(req, res, next)
    } catch (error) {
      logger.error(`Error in API version ${version}`, error, { endpoint })
      next(error)
    }
  }

  // All HTTP methods
  router.all(`/:apiVersion${endpoint}`, versionedHandler)

  return router
}

/**
 * Create API version changelog
 */
export const APIChangelog = {
  v1: {
    releaseDate: '2026-07-06',
    endpoints: [
      '/api/v1/profiles/:wallet',
      '/api/v1/payments/streams',
      '/api/v1/auth/login'
    ],
    breaking: false,
    notes: 'Initial API version'
  },
  v2: {
    releaseDate: '2026-09-01', // Planned
    endpoints: [
      '/api/v2/profiles/:wallet',
      '/api/v2/payments/streams'
    ],
    breaking: true,
    notes: 'Breaking changes: Updated response format, new fields',
    changes: [
      {
        endpoint: '/profiles/:wallet',
        breaking: true,
        details: 'Response now includes completeness_score field'
      },
      {
        endpoint: '/payments/streams',
        breaking: false,
        details: 'Added new streaming modes'
      }
    ]
  },
  v3: {
    releaseDate: '2026-12-01', // Planned
    endpoints: [],
    breaking: true,
    status: 'planned',
    notes: 'Full TypeScript migration, new authentication scheme'
  }
}

/**
 * Migration helper - show clients how to upgrade
 */
export const getMigrationGuide = (fromVersion, toVersion) => {
  const changes = APIChangelog[toVersion]?.changes || []

  return {
    from: fromVersion,
    to: toVersion,
    releaseDate: APIChangelog[toVersion]?.releaseDate,
    breaking: APIChangelog[toVersion]?.breaking,
    changes,
    guide: `
# API Migration Guide: ${fromVersion} → ${toVersion}

${changes.map((c) => `## ${c.endpoint}
${c.breaking ? '⚠️  BREAKING CHANGE' : '✓ Compatible'}

${c.details}`).join('\n\n')}

For more details, see: https://docs.paytray.io/api/${toVersion}
`
  }
}

/**
 * Deprecation middleware
 * Warns clients about deprecated versions and upcoming sunset
 */
export function deprecationMiddleware(req, res, next) {
  const version = req.apiVersion || 'v1'
  const manager = getVersionManager()

  if (manager.isDeprecated(version)) {
    const versionInfo = manager.versions.get(`${version}:${req.path}`) || {}
    const sunsettingDate = versionInfo.sunsettingDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)

    logger.warn(`Client using deprecated API version: ${version}`, {
      clientIp: req.ip,
      endpoint: req.path,
      sunsettingDate
    })
  }

  next()
}

/**
 * API Status endpoint
 * Shows version information and migration status
 */
export function apiStatusHandler(req, res) {
  const manager = getVersionManager()

  res.json({
    status: 'operational',
    apiVersion: req.apiVersion || 'v1',
    supportedVersions: Object.keys(APIChangelog),
    deprecated: {
      versions: Array.from(manager.deprecatedVersions),
      information: 'Use X-API-Version header or URL path to specify version'
    },
    endpoints: Array.from(manager.versions.keys()),
    changelog: APIChangelog,
    migrationGuides: {
      v1_to_v2: getMigrationGuide('v1', 'v2')
    }
  })
}

export { APIVersionManager }
