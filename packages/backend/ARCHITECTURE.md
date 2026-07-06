# PayTray Backend Architecture v2.0

## Overview

This document describes the production-grade backend infrastructure for PayTray, built with enterprise-level security, error handling, logging, and configuration management.

## Architecture Principles

### 1. **Layered Design**
```
┌─────────────────────────────────────────┐
│        Express Middleware Stack         │  Helmet, CORS, Logger, RateLimit
├─────────────────────────────────────────┤
│        Authentication Layer             │  JWT, Web3 Signature Verification
├─────────────────────────────────────────┤
│        API Routes (9 endpoints)         │  Auth, Profiles, LiveKit, Payments
├─────────────────────────────────────────┤
│        Service Layer (not yet)          │  Ceramic, Sablier, Email
├─────────────────────────────────────────┤
│        Database & ORM                   │  PostgreSQL, Connection Pool
├─────────────────────────────────────────┤
│        Logging & Error Handling         │  Structured JSON logs, AppError classes
└─────────────────────────────────────────┘
```

### 2. **Separation of Concerns**
- **`lib/config.js`** - Configuration management and validation
- **`lib/errors.js`** - Custom error classes and validation schemas
- **`lib/database.js`** - PostgreSQL connection pooling and ORM utilities
- **`lib/security.js`** - JWT, encryption, hashing, rate limiting
- **`lib/logger.js`** - Structured logging with multiple formats
- **`server.js`** - API routes and request handling

### 3. **Security by Design**
- **Helmet** middleware for security headers
- **CORS** with whitelist of allowed origins
- **Rate Limiting** per IP and per wallet
- **JWT Authentication** for protected endpoints
- **Input Validation** with detailed error messages
- **Error Sanitization** (detailed errors in dev only)
- **Audit Logging** for all actions

## Core Components

### Configuration Management (`lib/config.js`)

```javascript
// Centralized configuration with validation
config.env           // 'development', 'staging', 'production'
config.database      // PostgreSQL connection settings
config.livekit       // Video conferencing tokens
config.jwt           // Authentication secrets
config.rateLimit     // Global and per-wallet limits
config.cors          // CORS allowed origins
config.logging       // Structured logging format
```

**Key Features:**
- Environment-specific overrides
- Configuration validation on startup
- Sensible defaults for development
- Production-ready for deployment

### Error Handling (`lib/errors.js`)

**Custom Error Classes:**
```javascript
AppError              // Base error class
ValidationError       // Input validation failures
AuthenticationError   // Auth failures
AuthorizationError    // Permission denied
NotFoundError         // Resource not found
ConflictError         // Resource already exists
RateLimitError        // Too many requests
ExternalServiceError  // Service dependency failure
```

**Validation Schemas:**
```javascript
schemas.wallet.address()     // Regex validation for Ethereum addresses
schemas.wallet.signature()   // EIP-191 signature validation
schemas.user.*               // User profile field validation
schemas.payment.*            // Payment stream validation
schemas.livekit.*            // Video call validation
```

**Usage Pattern:**
```javascript
const data = validate({
  wallet: schemas.wallet.address,
  signature: schemas.wallet.signature
}, { wallet, signature })
```

### Database Layer (`lib/database.js`)

**Features:**
- **Connection Pooling** - Reuses connections for performance
- **Query Utilities** - Safe parameterized queries
- **Transaction Support** - ACID guarantees
- **ORM-like Model** - Fluent API for common operations

**Usage:**
```javascript
const Users = createModel('users')

// CRUD operations
const user = await Users.findById(id)
const user = await Users.findOne('wallet_address', address)
const user = await Users.create({ wallet_address, wallet_type })
await Users.update(id, { last_login: new Date() })
await Users.delete(id)

// Transactions
const result = await transaction(async (client) => {
  // All queries use the same connection
  await client.query('INSERT INTO ...')
  return result
})
```

### Security & JWT (`lib/security.js`)

**Token Management:**
```javascript
generateToken(payload, expiresIn)        // Single token
generateTokenPair(userId, wallet)        // Access + Refresh
verifyToken(token)                       // Verify and decode
decodeToken(token)                       // Decode without verification
```

**Wallet Verification:**
```javascript
verifyWalletSignature(message, signature, address)
// Verifies EIP-191 signed messages
```

**Hashing & Encryption:**
```javascript
hashValue(data)                          // SHA-256
hashWithSalt(data)                       // PBKDF2 with salt
encrypt(data)                            // AES-256-GCM
decrypt(encryptedData)                   // Decrypt
```

**Rate Limiting:**
```javascript
checkRateLimit(key, limit, windowMs)
// Per-wallet: checkRateLimit(wallet, 10)
// Per-IP: checkRateLimit(clientIP, 100)
```

### Logging System (`lib/logger.js`)

**Formats:**
```javascript
// Development: Pretty-printed with colors
[14:32:45] [INFO] Server: Server starting on port 3001

// Production: JSON for structured logging
{"timestamp":"2024-01-01T14:32:45Z","level":"INFO","context":"Server","message":"Server starting on port 3001"}
```

**Log Levels:**
- `ERROR` - Critical failures
- `WARN` - Warnings and deprecations
- `INFO` - General information
- `DEBUG` - Detailed debugging info

**Usage:**
```javascript
logger.error('Operation failed', error, { context: 'userId' })
logger.warn('High memory usage', { memUsage: '512MB' })
logger.info('User registered', { wallet: '0x...' })
logger.debug('Query executed', { sql, duration: '12ms' })
logger.audit('Token generated', userId, { wallet, action: 'login' })
```

## API Endpoints

### Authentication

**POST /api/auth/login** - Web3 wallet login
```javascript
Request: {
  wallet: "0x...",
  signature: "0x...",
  message: "PayTray Login"
}

Response: {
  user: { id, wallet, ensName },
  tokens: { accessToken, refreshToken, expiresIn }
}
```

### User Management

**GET /api/users/me** - Get current authenticated user
- Requires: `Authorization: Bearer <token>`

**POST /api/profiles** - Create/update user profile
```javascript
Request: {
  name: "John Doe",
  bio: "...",
  hourlyRate: 100,
  expertise: ["solidity", "web3"],
  socialLinks: { twitter: "@...", github: "@..." }
}
```

### LiveKit Integration (Phase 1)

**POST /api/livekit/token** - Generate video token
```javascript
Request: {
  roomName: "call-123",
  username: "John",
  canPublish: true,
  canSubscribe: true
}

Response: {
  token: "jwt_token",
  url: "http://livekit:7880",
  room: "call-123",
  expiresIn: 86400
}
```

### Wallet Verification

**POST /api/wallet/verify** - Verify wallet on chain
```javascript
Request: {
  wallet: "0x...",
  chainId: 1  // Ethereum mainnet
}

Response: {
  valid: true,
  wallet: "0x...",
  chainId: 1,
  verified: true
}
```

### Payment Streaming (Phase 3 - Sablier)

**POST /api/payments/streams** - Create payment stream
```javascript
Request: {
  recipientWallet: "0x...",
  token: "USDC",
  amount: 1000,
  duration: 2592000,  // 30 days in seconds
  durationUnit: "seconds"
}

Response: {
  stream: { id, sender_id, recipient_id, status: "pending", ... }
}
```

**GET /api/payments/streams** - Get user's streams
```javascript
Query params: status=active|completed|pending|all
```

### Video Calls

**POST /api/calls** - Record video call
```javascript
Request: {
  recipientWallet: "0x...",
  roomName: "call-123"
}
```

## Database Schema

See [001_initial_schema.sql](migrations/001_initial_schema.sql) for full schema.

**Core Tables:**
- `users` - Wallet accounts with profile references
- `profiles` - User profile information (Ceramic-ready)
- `payment_streams` - Sablier stream tracking
- `video_calls` - LiveKit session records
- `wallet_connections` - Multi-wallet support
- `api_keys` - API authentication
- `tokens` - JWT token revocation
- `audit_logs` - Security audit trail
- `rate_limits` - Per-user rate limit tracking

## Security Features

### 1. Input Validation
All inputs are validated before processing:
```javascript
// Wallet address
/^0x[a-fA-F0-9]{40}$/

// Token name
['USDC', 'USDT', 'DAI', 'ETH', 'WETH']

// Amount (must be positive, max 1 billion)
amount > 0 && amount <= 1_000_000_000
```

### 2. Rate Limiting
```javascript
// Global: 100 requests/minute per IP
// Token generation: 10 tokens/minute per wallet
// Configurable per endpoint
```

### 3. Error Sanitization
```javascript
// Development: Full error details and stack traces
// Production: Generic error messages, logged internally
```

### 4. CORS Protection
```javascript
// Whitelist of allowed origins
allowedOrigins: [
  'http://localhost:3000',
  'https://paytray.io'
]
```

### 5. Security Headers
```javascript
// Helmet middleware enables:
// X-Content-Type-Options: nosniff
// X-Frame-Options: DENY
// Content-Security-Policy: default-src 'self'
// And 15+ other security headers
```

## Environment Configuration

### Development (.env.local)
```bash
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/paytray
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
JWT_SECRET=dev_secret_key_change_in_production
```

### Production (.env.local)
```bash
NODE_ENV=production
DATABASE_URL=postgresql://prod_user:secure_password@prod_host:5432/paytray
LIVEKIT_API_KEY=<prod_key>
LIVEKIT_API_SECRET=<prod_secret>
JWT_SECRET=<128_character_secret>
CORS_ORIGINS=https://paytray.io,https://www.paytray.io
SENTRY_ENABLED=true
SENTRY_DSN=<sentry_dsn>
```

## Error Flow

```
1. Client sends request
   ↓
2. Express middleware processes (logger, rate limit, CORS)
   ↓
3. Validation schemas check input
   ↓
4. If validation fails:
   → ValidationError(400, fields)
   → Response: { error, statusCode, fields, timestamp }
   ↓
5. Business logic executes
   ↓
6. If error occurs:
   → Catch block wraps in AppError
   → next(error) passes to error handler
   ↓
7. Error handler middleware:
   → Logs error with full context
   → Checks error type (AppError, etc.)
   → Returns sanitized response
   → Includes stack trace only in dev
```

## Database Connection Flow

```
1. Server startup calls initializeDatabase()
   ↓
2. Creates connection pool (min: 2, max: 10)
   ↓
3. Validates connection with test query
   ↓
4. Request arrives:
   → query() method acquires connection from pool
   → Executes parameterized query
   → Releases connection back to pool
   ↓
5. Transactions:
   → Acquires dedicated connection
   → BEGIN
   → All queries use same connection
   → COMMIT or ROLLBACK
   → Release connection
   ↓
6. Shutdown calls closeDatabase()
   → Drains and closes all connections
```

## Performance Optimizations

### 1. Connection Pooling
- Reuses database connections
- Reduces connection overhead by 90%+
- Configurable min/max connections

### 2. Request Logging
- Structured JSON logs for easy parsing
- Async logging prevents blocking
- Only logs essential data in production

### 3. Rate Limiting
- In-memory tracking (fast)
- Per-wallet, not per-request
- Configurable per endpoint

### 4. Error Handling
- Early validation catches errors before processing
- Minimal error payload in responses
- Stack traces excluded in production

## Monitoring & Observability

### Logs Available
```javascript
// All requests
logger.http(req, res, duration)

// Errors
logger.error(message, error, context)

// Audit trail
logger.audit(action, userId, details)

// Performance metrics
logger.performance(label, duration)
```

### Health Check
```bash
GET /health

Response: {
  status: "healthy",
  service: "paytray-backend",
  version: "2.0.0",
  environment: "production",
  uptime: 3600,
  checks: {
    database: "ok",
    livekit: "configured",
    ceramic: "disabled"
  }
}
```

## Next Phases

### Phase 2: Ceramic Integration
- Move profiles from PostgreSQL to Ceramic streams
- Enable decentralized profile storage
- Integrate profile indexing

### Phase 3: Sablier Integration
- Connect to Sablier smart contracts
- Enable real payment streams
- Integrate token withdrawals

### Phase 4: Production Deployment
- Environment-specific configs
- Frontend deployment (Vercel/Netlify)
- Backend deployment (Heroku/DigitalOcean)
- Database migration in production
- Monitoring & alerting setup

## Deployment Checklist

- [ ] Database created and migrated
- [ ] Environment variables configured
- [ ] SSL/TLS certificates installed
- [ ] CORS origins configured
- [ ] JWT secret configured (128+ chars)
- [ ] Rate limits tuned for production
- [ ] Logging configured (Sentry, etc.)
- [ ] Health check monitoring enabled
- [ ] Backup procedures established
- [ ] Error alerting configured

## Support & Documentation

For more information:
- [Backend API Documentation](../packages/backend/API.md)
- [Database Schema](../packages/backend/migrations/001_initial_schema.sql)
- [Configuration Reference](../.env.example)
