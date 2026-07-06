/**
 * Security Utilities
 * JWT generation, password hashing, encryption, and authentication
 */

import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import config from './config.js'
import { AuthenticationError, AuthorizationError } from './errors.js'

/**
 * Generate JWT token
 */
export function generateToken(payload, expiresIn = config.jwt.accessTokenTTL) {
  try {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn,
      algorithm: 'HS256',
      issuer: 'paytray-backend'
    })
  } catch (error) {
    throw new Error(`Failed to generate token: ${error.message}`)
  }
}

/**
 * Verify JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret, {
      algorithms: ['HS256']
    })
  } catch (error) {
    throw new AuthenticationError(`Invalid token: ${error.message}`)
  }
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token) {
  try {
    return jwt.decode(token)
  } catch (error) {
    throw new AuthenticationError('Failed to decode token')
  }
}

/**
 * Generate access and refresh tokens
 */
export function generateTokenPair(userId, walletAddress) {
  const accessToken = generateToken(
    {
      userId,
      walletAddress,
      type: 'access'
    },
    config.jwt.accessTokenTTL
  )

  const refreshToken = generateToken(
    {
      userId,
      walletAddress,
      type: 'refresh'
    },
    config.jwt.refreshTokenTTL
  )

  return { accessToken, refreshToken }
}

/**
 * Verify wallet signature (for Web3 authentication)
 */
export function verifyWalletSignature(message, signature, address) {
  try {
    // This is a simplified example - in production, use ethers.js or web3.js
    // to properly verify EIP-191 signatures

    const messageHash = crypto
      .createHash('sha256')
      .update(message)
      .digest('hex')

    // Basic validation
    if (!signature || !signature.startsWith('0x')) {
      throw new AuthenticationError('Invalid signature format')
    }

    // In production: use ethers.verifyMessage() or similar
    // This is a placeholder that shows the structure
    return {
      verified: true,
      address: address.toLowerCase(),
      message,
      timestamp: Date.now()
    }
  } catch (error) {
    throw new AuthenticationError(`Signature verification failed: ${error.message}`)
  }
}

/**
 * Hash value (for storing sensitive data)
 */
export function hashValue(value) {
  return crypto
    .createHash('sha256')
    .update(value)
    .digest('hex')
}

/**
 * Hash with salt (for passwords, API keys)
 */
export function hashWithSalt(value, salt = crypto.randomBytes(16)) {
  const hash = crypto
    .pbkdf2Sync(value, salt, 1000, 64, 'sha512')
    .toString('hex')
  return `${hash}:${salt.toString('hex')}`
}

/**
 * Verify hashed value
 */
export function verifyHash(value, hashedValue) {
  try {
    const [hash, salt] = hashedValue.split(':')
    const saltBuffer = Buffer.from(salt, 'hex')
    const newHash = crypto
      .pbkdf2Sync(value, saltBuffer, 1000, 64, 'sha512')
      .toString('hex')
    return newHash === hash
  } catch (error) {
    return false
  }
}

/**
 * Generate random token (for email verification, password reset, etc.)
 */
export function generateRandomToken(length = 32) {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Encrypt sensitive data
 */
export function encrypt(data) {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(
    'aes-256-gcm',
    Buffer.from(config.jwt.secret.slice(0, 32)),
    iv
  )

  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag()

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  }
}

/**
 * Decrypt sensitive data
 */
export function decrypt({ encrypted, iv, authTag }) {
  try {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(config.jwt.secret.slice(0, 32)),
      Buffer.from(iv, 'hex')
    )

    decipher.setAuthTag(Buffer.from(authTag, 'hex'))
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return JSON.parse(decrypted)
  } catch (error) {
    throw new AuthenticationError(`Decryption failed: ${error.message}`)
  }
}

/**
 * Rate limit check
 */
export const rateLimitMap = new Map()

export function checkRateLimit(key, limit = config.rateLimit.max, windowMs = config.rateLimit.windowMs) {
  const now = Date.now()
  const limitData = rateLimitMap.get(key) || { count: 0, resetAt: now + windowMs }

  if (now > limitData.resetAt) {
    // Window expired, reset
    limitData.count = 1
    limitData.resetAt = now + windowMs
  } else {
    limitData.count++
  }

  rateLimitMap.set(key, limitData)

  if (limitData.count > limit) {
    throw new AuthenticationError(`Rate limit exceeded. Retry after ${Math.ceil((limitData.resetAt - now) / 1000)}s`)
  }

  return {
    remaining: limit - limitData.count,
    resetAt: limitData.resetAt
  }
}

/**
 * IP-based identification
 */
export function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-client-ip'] ||
    req.connection.remoteAddress ||
    'unknown'
  )
}

export default {
  generateToken,
  verifyToken,
  decodeToken,
  generateTokenPair,
  verifyWalletSignature,
  hashValue,
  hashWithSalt,
  verifyHash,
  generateRandomToken,
  encrypt,
  decrypt,
  checkRateLimit,
  getClientIP
}
