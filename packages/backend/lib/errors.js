/**
 * Error Handling System
 * Production-grade error handling with proper logging and user-facing messages
 */

export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.details = details
    this.timestamp = new Date()
    Error.captureStackTrace(this, this.constructor)
  }

  toJSON() {
    return {
      error: this.message,
      statusCode: this.statusCode,
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack }),
      timestamp: this.timestamp
    }
  }
}

export class ValidationError extends AppError {
  constructor(message, fields = null) {
    super(message, 400, fields)
    this.name = 'ValidationError'
  }

  toJSON() {
    return {
      error: this.message,
      statusCode: 400,
      ...(this.details && { fields: this.details }),
      timestamp: this.timestamp
    }
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409)
    this.name = 'ConflictError'
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests', retryAfter = 60) {
    super(message, 429)
    this.retryAfter = retryAfter
    this.name = 'RateLimitError'
  }

  toJSON() {
    return {
      error: this.message,
      statusCode: 429,
      retryAfter: this.retryAfter,
      timestamp: this.timestamp
    }
  }
}

export class ExternalServiceError extends AppError {
  constructor(service, message) {
    super(`${service} service error: ${message}`, 502)
    this.name = 'ExternalServiceError'
    this.service = service
  }
}

/**
 * Validation Schemas
 * Type-safe validation with detailed error messages
 */

export const schemas = {
  wallet: {
    address: (value) => {
      if (!value || typeof value !== 'string') {
        throw new ValidationError('Wallet address is required')
      }
      if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
        throw new ValidationError('Invalid wallet address format')
      }
      return value.toLowerCase()
    },
    signature: (value) => {
      if (!value || typeof value !== 'string') {
        throw new ValidationError('Signature is required')
      }
      if (!/^0x[a-fA-F0-9]{130}$/.test(value)) {
        throw new ValidationError('Invalid signature format')
      }
      return value
    }
  },

  user: {
    name: (value) => {
      if (!value || typeof value !== 'string') {
        throw new ValidationError('Name is required')
      }
      if (value.length < 2 || value.length > 255) {
        throw new ValidationError('Name must be between 2 and 255 characters')
      }
      return value.trim()
    },
    bio: (value) => {
      if (value && typeof value !== 'string') {
        throw new ValidationError('Bio must be a string')
      }
      if (value && value.length > 1000) {
        throw new ValidationError('Bio must not exceed 1000 characters')
      }
      return value?.trim() || null
    },
    hourlyRate: (value) => {
      if (value !== undefined && value !== null) {
        const rate = parseFloat(value)
        if (isNaN(rate) || rate <= 0) {
          throw new ValidationError('Hourly rate must be a positive number')
        }
        if (rate > 100000) {
          throw new ValidationError('Hourly rate must not exceed $100,000')
        }
        return rate
      }
      return null
    },
    expertise: (value) => {
      if (!Array.isArray(value)) {
        throw new ValidationError('Expertise must be an array')
      }
      if (value.length > 20) {
        throw new ValidationError('Maximum 20 expertise areas allowed')
      }
      return value.map((item) => {
        if (typeof item !== 'string') {
          throw new ValidationError('Each expertise must be a string')
        }
        return item.trim()
      })
    }
  },

  payment: {
    amount: (value) => {
      const amount = parseFloat(value)
      if (isNaN(amount) || amount <= 0) {
        throw new ValidationError('Amount must be a positive number')
      }
      // Prevent huge amounts that could cause precision issues
      if (amount > 1000000000) {
        throw new ValidationError('Amount exceeds maximum limit')
      }
      return amount
    },
    token: (value) => {
      if (!value || typeof value !== 'string') {
        throw new ValidationError('Token is required')
      }
      const validTokens = ['USDC', 'USDT', 'DAI', 'ETH', 'WETH']
      if (!validTokens.includes(value.toUpperCase())) {
        throw new ValidationError(`Token must be one of: ${validTokens.join(', ')}`)
      }
      return value.toUpperCase()
    },
    duration: (value) => {
      const duration = parseInt(value, 10)
      if (isNaN(duration) || duration < 1) {
        throw new ValidationError('Duration must be a positive number')
      }
      if (duration > 36500) {
        // 100 years max
        throw new ValidationError('Duration must not exceed 100 years')
      }
      return duration
    }
  },

  livekit: {
    roomName: (value) => {
      if (!value || typeof value !== 'string') {
        throw new ValidationError('Room name is required')
      }
      if (value.length < 3 || value.length > 255) {
        throw new ValidationError('Room name must be between 3 and 255 characters')
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
        throw new ValidationError('Room name contains invalid characters')
      }
      return value
    },
    username: (value) => {
      if (!value || typeof value !== 'string') {
        throw new ValidationError('Username is required')
      }
      if (value.length < 1 || value.length > 255) {
        throw new ValidationError('Username must be between 1 and 255 characters')
      }
      return value.trim()
    }
  }
}

/**
 * Validation helper
 */
export function validate(schema, data) {
  const errors = {}

  for (const [key, validator] of Object.entries(schema)) {
    try {
      data[key] = validator(data[key])
    } catch (err) {
      errors[key] = err.message
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Validation failed', errors)
  }

  return data
}

export default {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ExternalServiceError,
  schemas,
  validate
}
