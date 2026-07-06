# 📝 TypeScript Migration Roadmap

**Current State:** JavaScript with JSDoc  
**Target State:** Full TypeScript with strict mode  
**Timeline:** 8-12 weeks (phased, non-breaking)  
**Impact:** Type safety, IDE support, fewer bugs, easier refactoring  

---

## 🎯 Migration Strategy

### Phase 1: Foundation (Weeks 1-2) - LOW RISK

Migrate backend infrastructure files (no business logic changes):
```
✓ lib/logger.js → lib/logger.ts
✓ lib/config.js → lib/config.ts
✓ lib/errors.js → lib/errors.ts
✓ lib/security.js → lib/security.ts
✓ lib/database.js → lib/database.ts
```

**Why first:** These modules have no external dependencies, used everywhere, will provide immediate type safety benefits.

### Phase 2: Services (Weeks 3-4)

Migrate service layer:
```
→ services/ceramicService.js → services/ceramicService.ts
→ services/sablierService.js → services/sablierService.ts
→ services/liverKitService.js → services/liveKitService.ts
```

**Why second:** Services depend on lib/ modules, isolated business logic.

### Phase 3: Adapters (Weeks 5-6)

Migrate adapter layer:
```
→ lib/profileStorageAdapter.ts
→ lib/paymentStreamAdapter.ts
→ lib/communicationAdapter.ts
→ lib/rateLimiter.ts
→ lib/apiVersioning.ts
```

**Why third:** Adapters build on services and lib/.

### Phase 4: Server & Routes (Weeks 7-8)

Migrate main application:
```
→ server.ts (from server.js)
→ routes/ (if extracted)
→ middleware/ (if extracted)
```

**Why fourth:** Depends on everything else.

### Phase 5: Frontend (Weeks 9-12) - LOWER PRIORITY

Can start in parallel after Phase 1:
```
→ src/components/*.tsx
→ src/contexts/*.ts
→ src/hooks/*.ts
→ src/utils/*.ts
```

---

## 📦 Phase 1: Foundation (Detailed)

### Step 1: Set Up TypeScript

```bash
# 1. Install TypeScript
npm install --save-dev typescript @types/node

# 2. Create tsconfig.json
npx tsc --init

# 3. Configure tsconfig.json (strict mode)
```

**tsconfig.json (Backend):**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022"],
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./",
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  },
  "include": ["packages/backend/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 2: Create Type Definitions

```bash
# Create types directory
mkdir packages/backend/types
```

**types/index.ts:**

```typescript
// Common types used across the app
export interface User {
  wallet: string
  email?: string
  createdAt: Date
  updatedAt: Date
}

export interface Profile {
  wallet: string
  name: string
  bio: string
  expertise: string[]
  completenessScore: number
  createdAt: Date
  updatedAt: Date
}

export interface PaymentStream {
  id: string
  sender: string
  recipient: string
  token: string
  amount: bigint
  startTime: number
  endTime: number
  withdrawn: bigint
  cancelled: boolean
  chainId: number
  contractAddress: string
  createdAt: Date
  updatedAt: Date
}

export interface VideoCall {
  id: string
  initiator: string
  participant: string
  roomToken: string
  startedAt?: Date
  endedAt?: Date
  recordingUrl?: string
  createdAt: Date
  updatedAt: Date
}

export interface Config {
  nodeEnv: 'development' | 'staging' | 'production'
  port: number
  database: DatabaseConfig
  redis: RedisConfig
  blockchain: BlockchainConfig
}

export interface DatabaseConfig {
  url: string
  pool: {
    min: number
    max: number
  }
  ssl: boolean
}

export interface RedisConfig {
  enabled: boolean
  url: string
}

export interface BlockchainConfig {
  networks: {
    [chainId: number]: {
      name: string
      rpcUrl: string
      contracts: {
        [key: string]: string
      }
    }
  }
}

export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
  timestamp: number
}

export type RequestHandler = (req: any, res: any, next?: any) => Promise<void> | void
```

### Step 3: Migrate lib/logger.ts

```typescript
// lib/logger.ts
import { config } from './config.js'

export type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG'

export interface LogEntry {
  timestamp: string
  level: LogLevel
  category: string
  message: string
  [key: string]: any
}

export class Logger {
  private category: string

  constructor(category: string) {
    this.category = category
  }

  private log(level: LogLevel, message: string, meta?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category: this.category,
      message,
      ...(meta && meta)
    }

    const isDev = config.nodeEnv === 'development'

    if (isDev) {
      console.log(
        `[${entry.level}] ${entry.category}: ${entry.message}`,
        meta ? JSON.stringify(meta, null, 2) : ''
      )
    } else {
      console.log(JSON.stringify(entry))
    }
  }

  error(message: string, error?: Error | Record<string, any>, meta?: Record<string, any>): void {
    this.log('ERROR', message, {
      error: error instanceof Error ? error.message : error,
      ...meta
    })
  }

  warn(message: string, meta?: Record<string, any>): void {
    this.log('WARN', message, meta)
  }

  info(message: string, meta?: Record<string, any>): void {
    this.log('INFO', message, meta)
  }

  debug(message: string, meta?: Record<string, any>): void {
    if (config.nodeEnv === 'development') {
      this.log('DEBUG', message, meta)
    }
  }

  http(method: string, path: string, statusCode: number, responseTime: number): void {
    this.info(`${method} ${path} ${statusCode}`, { responseTime })
  }

  audit(action: string, user: string, details?: Record<string, any>): void {
    this.info(`AUDIT: ${action} by ${user}`, details)
  }

  performance(operationName: string, duration: number): void {
    this.info(`PERF: ${operationName}`, { duration })
  }
}

export function getLogger(category: string): Logger {
  return new Logger(category)
}
```

### Step 4: Migrate lib/config.ts

```typescript
// lib/config.ts
import { config as dotenvConfig } from 'dotenv'
import { Config, DatabaseConfig, RedisConfig, BlockchainConfig } from '../types/index.js'

dotenvConfig()

const requiredEnvVars = [
  'NODE_ENV',
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET'
]

function validateEnvironment(): void {
  const missing = requiredEnvVars.filter((env) => !process.env[env])
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

validateEnvironment()

export const config: Config = {
  nodeEnv: (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  database: {
    url: process.env.DATABASE_URL!,
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      max: parseInt(process.env.DB_POOL_MAX || '20', 10)
    },
    ssl: process.env.NODE_ENV === 'production'
  } as DatabaseConfig,
  redis: {
    enabled: process.env.REDIS_ENABLED === 'true',
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  } as RedisConfig,
  blockchain: {
    networks: {
      1: {
        name: 'Ethereum',
        rpcUrl: process.env.ETHEREUM_RPC_URL || '',
        contracts: {
          USDC: process.env.USDC_ADDRESS || '',
          SABLIER: process.env.SABLIER_ADDRESS || ''
        }
      }
      // ... other chains
    }
  } as BlockchainConfig
}

export default config
```

### Step 5: Migrate lib/errors.ts

```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  public fields?: Record<string, string>

  constructor(message: string, fields?: Record<string, string>) {
    super(400, 'ValidationError', message)
    this.fields = fields
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(401, 'AuthenticationError', message)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(403, 'AuthorizationError', message)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, 'NotFoundError', `${resource} not found`)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'ConflictError', message)
    this.name = 'ConflictError'
  }
}

export class RateLimitError extends AppError {
  public resetAt?: number

  constructor(message: string = 'Rate limit exceeded', resetAt?: number) {
    super(429, 'RateLimitError', message)
    this.resetAt = resetAt
    this.name = 'RateLimitError'
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string) {
    super(502, 'ExternalServiceError', `${service}: ${message}`)
    this.name = 'ExternalServiceError'
  }
}
```

### Step 6: Update package.json

```json
{
  "scripts": {
    "dev": "tsx watch packages/backend/server.ts",
    "build": "tsc",
    "start": "node dist/packages/backend/server.js",
    "type-check": "tsc --noEmit",
    "type-check:watch": "tsc --noEmit --watch"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "tsx": "^4.0.0"
  }
}
```

---

## 📊 Phase-by-Phase Timeline

| Phase | Files | Duration | Risk | Tests |
|-------|-------|----------|------|-------|
| 1 | 5 core lib files | 2 weeks | Low | Add 50 tests |
| 2 | 3 services | 2 weeks | Medium | Add 100 tests |
| 3 | 5 adapters | 2 weeks | Medium | Add 50 tests |
| 4 | server.js + routes | 2 weeks | High | Integration tests |
| 5 | Frontend | 4 weeks | Low | Existing tests |

---

## ✅ Migration Checklist (Per File)

For each file being migrated:

- [ ] Create corresponding `.ts` file with TypeScript implementation
- [ ] Update imports in files that reference this module
- [ ] Add type definitions to `types/index.ts`
- [ ] Write unit tests for the module
- [ ] Run `npm run type-check` - zero errors
- [ ] Run `npm test` - all tests pass
- [ ] Remove old `.js` file
- [ ] Update README with TypeScript status

---

## 🧪 Testing Strategy

```bash
# Add TypeScript type tests
npm install --save-dev vitest @vitest/ui

# Test configuration ensures:
# - All types are correct
# - No implicit any
# - No unused variables
# - Strict null checks
```

---

## 📈 Benefits Timeline

| Week | Benefit | Measurement |
|------|---------|-------------|
| 2 | Type safety for core libs | 0 any types |
| 4 | IDE autocomplete improvement | 100% in lib/ |
| 6 | Easier debugging | Fewer runtime errors |
| 8 | Refactoring confidence | Large refactors safe |
| 12 | Full codebase benefit | Complete type safety |

---

## 🚀 Go-Live Checklist

- [ ] Phase 1 complete (lib files)
- [ ] Zero TypeScript errors in phase 1
- [ ] All tests passing
- [ ] Code review complete
- [ ] Performance verified (no regressions)
- [ ] Documentation updated
- [ ] Team trained on TypeScript patterns
- [ ] Merge to main branch
- [ ] Deploy to staging
- [ ] Deploy to production

---

**TypeScript Migration: The investment that pays dividends.** ✓

