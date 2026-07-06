/**
 * Configuration Management
 * Centralized configuration with validation and environment-specific overrides
 */

export const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV === 'development',
  isStaging: process.env.NODE_ENV === 'staging',
  isProd: process.env.NODE_ENV === 'production',

  // Server
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    host: process.env.HOST || 'localhost'
  },

  // Database
  database: {
    url: process.env.DATABASE_URL,
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    },
    // For development only
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'paytray',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
  },

  // LiveKit
  livekit: {
    apiKey: process.env.LIVEKIT_API_KEY,
    apiSecret: process.env.LIVEKIT_API_SECRET,
    url: process.env.LIVEKIT_URL || 'http://localhost:7880',
    tokenTTL: parseInt(process.env.LIVEKIT_TOKEN_TTL || '86400', 10)
  },

  // Ceramic (profile storage)
  ceramic: {
    nodeUrl: process.env.CERAMIC_NODE_URL || 'http://localhost:7007',
    network: process.env.CERAMIC_NETWORK || 'testnet-clay',
    enabled: process.env.CERAMIC_ENABLED === 'true'
  },

  // Sablier (payment streaming)
  sablier: {
    enabled: process.env.SABLIER_ENABLED === 'true',
    networks: {
      ethereum: process.env.SABLIER_ETHEREUM_ADDRESS,
      arbitrum: process.env.SABLIER_ARBITRUM_ADDRESS,
      optimism: process.env.SABLIER_OPTIMISM_ADDRESS
    }
  },

  // RPC Endpoints
  rpc: {
    ethereum: process.env.VITE_ETHEREUM_RPC,
    sepolia: process.env.VITE_SEPOLIA_RPC,
    arbitrum: process.env.VITE_ARBITRUM_RPC,
    optimism: process.env.VITE_OPTIMISM_RPC
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    accessTokenTTL: process.env.JWT_ACCESS_TTL || '15m',
    refreshTokenTTL: process.env.JWT_REFRESH_TTL || '7d'
  },

  // CORS
  cors: {
    origin: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    tokenGenLimit: parseInt(process.env.TOKEN_GEN_LIMIT || '10', 10)
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json'
  },

  // Email
  email: {
    enabled: process.env.EMAIL_ENABLED === 'true',
    provider: process.env.EMAIL_PROVIDER || 'sendgrid',
    sendgridKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.SENDGRID_FROM_EMAIL,
    fromName: 'PayTray'
  },

  // Sentry Error Tracking
  sentry: {
    enabled: process.env.SENTRY_ENABLED === 'true',
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1')
  },

  // Security
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
    tokenExpiry: 24 * 60 * 60 * 1000, // 24 hours
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000 // 15 minutes
  },

  // Features
  features: {
    multiWallet: process.env.FEATURE_MULTI_WALLET !== 'false',
    videoConferencing: process.env.FEATURE_VIDEO !== 'false',
    paymentStreaming: process.env.FEATURE_PAYMENTS !== 'false',
    profileManagement: process.env.FEATURE_PROFILES !== 'false'
  }
}

/**
 * Validate critical configuration
 */
export function validateConfig() {
  const errors = []

  // JWT_SECRET: required, but use default for non-production
  if (!config.jwt.secret) {
    if (config.isProd) {
      errors.push('JWT_SECRET is required in production')
    } else {
      // Use default for development/staging
      console.warn('⚠️  JWT_SECRET not set, using default for development/staging')
      process.env.JWT_SECRET = 'dev-secret-key-minimum-32-characters-long-must-be-used'
      config.jwt.secret = process.env.JWT_SECRET
    }
  }

  // Required in production ONLY
  if (config.isProd) {
    if (!config.database.url) errors.push('DATABASE_URL is required in production')
    if (!config.livekit.apiKey) errors.push('LIVEKIT_API_KEY is required in production')
    if (!config.livekit.apiSecret) errors.push('LIVEKIT_API_SECRET is required in production')
  }

  // Staging: database warning if not set
  if (config.isStaging && !config.database.url) {
    console.warn('⚠️  DATABASE_URL not set in staging - database operations will fail')
  }

  if (errors.length > 0) {
    console.error('❌ Configuration validation failed:')
    errors.forEach((err) => console.error(`   - ${err}`))
    if (config.isProd) {
      throw new Error('Invalid configuration')
    }
  }

  return errors.length === 0
}

export default config
