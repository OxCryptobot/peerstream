# 📊 Caching Strategy for PayTray

**Goal:** Reduce database load by 80%, improve response times by 90%

---

## 🎯 Caching Hierarchy

```
Request
  ↓
┌─────────────────────┐
│ Browser Cache       │ (1 hour for static assets)
│ (HTTP Headers)      │
└─────────────────────┘
  ↓
┌─────────────────────┐
│ CDN Cache           │ (Vercel for frontend)
│ (Edge Caching)      │
└─────────────────────┘
  ↓
┌─────────────────────┐
│ Redis Cache         │ (In-memory, 5-60 min)
│ (Hot Data)          │
└─────────────────────┘
  ↓
┌─────────────────────┐
│ Database Cache      │ (PostgreSQL cache)
│ (Query Cache)       │
└─────────────────────┘
  ↓
┌─────────────────────┐
│ Database            │ (Source of truth)
│ (Disk, Slowest)     │
└─────────────────────┘
```

---

## 📋 What to Cache

### Tier 1: Cache Aggressively (60+ min)

```javascript
// Profiles (rarely change)
CACHE_KEY: "profile:{wallet}"
TTL: 1 hour (3600s)
Invalidate: When profile updated

// Expert list
CACHE_KEY: "experts:{expertise}"
TTL: 1 hour
Invalidate: When expert added/removed

// Trending profiles
CACHE_KEY: "trending:profiles"
TTL: 30 minutes
Invalidate: Daily or when new profile added

// Token list (ERC-20)
CACHE_KEY: "tokens:list"
TTL: 24 hours
Invalidate: Manual or new token added
```

### Tier 2: Cache Moderately (5-15 min)

```javascript
// Stream list (updated frequently)
CACHE_KEY: "streams:user:{wallet}"
TTL: 5 minutes
Invalidate: When stream created/updated

// User streams stats
CACHE_KEY: "streams:stats:{wallet}"
TTL: 10 minutes
Invalidate: When stream changes

// Recent transactions
CACHE_KEY: "transactions:recent"
TTL: 5 minutes
Invalidate: When new transaction
```

### Tier 3: No Cache (Real-time)

```javascript
// Live stream amounts (changes constantly)
// NEVER cache - always query blockchain

// User balance
// Cache for 30 seconds only
CACHE_KEY: "balance:{wallet}:{chain}"
TTL: 30 seconds

// Health checks
// Never cache
```

---

## 🔧 Implementation Strategy

### Phase 1: Basic Redis Cache (Week 1)

```javascript
// lib/cache.js
import redis from 'redis'

const redisClient = redis.createClient({
  url: process.env.REDIS_URL
})

export async function getOrSet(key, fetchFn, ttl = 300) {
  // Try cache first
  const cached = await redisClient.get(key)
  if (cached) {
    return JSON.parse(cached)
  }

  // Cache miss - fetch from database
  const data = await fetchFn()
  
  // Store in cache
  await redisClient.setex(key, ttl, JSON.stringify(data))
  
  return data
}

export async function invalidate(key) {
  await redisClient.del(key)
}

export async function invalidatePattern(pattern) {
  // Invalidate all keys matching pattern
  const keys = await redisClient.keys(pattern)
  if (keys.length > 0) {
    await redisClient.del(...keys)
  }
}
```

### Phase 2: Smart Cache Invalidation (Week 2-3)

```javascript
// When profile is updated, invalidate related caches
async function updateProfile(wallet, updates) {
  // Update database
  await db.updateProfile(wallet, updates)
  
  // Invalidate caches
  await invalidate(`profile:${wallet}`)
  await invalidatePattern('profiles:search:*')
  await invalidatePattern('trending:*')
}

// When new stream is created
async function createStream(payload) {
  // Create stream
  const stream = await db.createStream(payload)
  
  // Invalidate user stream caches
  await invalidate(`streams:user:${payload.sender}`)
  await invalidate(`streams:user:${payload.recipient}`)
  await invalidatePattern('streams:stats:*')
}
```

### Phase 3: Cache Warming (Week 4)

```javascript
// Warm cache on application startup
export async function warmCache() {
  logger.info('🔥 Warming cache...')
  
  try {
    // Pre-load hot data
    const experts = await db.getExperts()
    for (const exp of experts) {
      await redisClient.setex(
        `expert:${exp.wallet}`,
        3600,
        JSON.stringify(exp)
      )
    }
    
    const trendingProfiles = await db.getTrendingProfiles(100)
    await redisClient.setex(
      'trending:profiles',
      1800,
      JSON.stringify(trendingProfiles)
    )
    
    logger.info(`✓ Warmed ${experts.length + trendingProfiles.length} items`)
  } catch (error) {
    logger.error('Failed to warm cache', error)
  }
}
```

---

## 📈 Cache Statistics & Monitoring

### Track Cache Performance

```javascript
export async function getCacheStats() {
  const info = await redisClient.info('stats')
  
  return {
    hits: info.keyspace_hits,
    misses: info.keyspace_misses,
    hitRate: info.keyspace_hits / (info.keyspace_hits + info.keyspace_misses),
    memory: info.used_memory_human,
    keys: info.db0?.keys || 0,
    evictions: info.evicted_keys || 0
  }
}

// Monitor endpoint
GET /api/cache/stats
{
  "hits": 45203,
  "misses": 5123,
  "hitRate": 0.898,  // 89.8% hit rate = excellent
  "memory": "256MB",
  "keys": 1024
}
```

---

## 🎯 Expected Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Database Queries/sec | 1000 | 200 | 80% reduction |
| Average Response Time | 500ms | 50ms | 90% faster |
| Database CPU | 85% | 15% | 70% reduction |
| Database Connections | 30 | 5 | 83% fewer |
| Cost/Month | $50 | $15 | 70% savings |

---

## 🚨 Cache Invalidation Strategies

### Strategy 1: TTL (Time-To-Live) - Simple

```javascript
// Set and forget
// Good for data that doesn't change frequently
await cache.set('profile:123', data, 3600) // 1 hour TTL
```

**Pros:** Simple, no coordination needed  
**Cons:** May serve stale data up to TTL

### Strategy 2: Event-Based - Recommended

```javascript
// Invalidate immediately when data changes
const profile = await db.updateProfile(wallet, updates)

// Emit event
eventBus.emit('profile:updated', { wallet, profile })

// Listen and invalidate
eventBus.on('profile:updated', (payload) => {
  await cache.delete(`profile:${payload.wallet}`)
})
```

**Pros:** Always fresh data  
**Cons:** Complex coordination

### Strategy 3: Hybrid - Best Balance

```javascript
// Use both TTL + event-based
export async function getProfile(wallet) {
  const key = `profile:${wallet}`
  
  // Try cache first
  let profile = await cache.get(key)
  if (profile) {
    return profile // Serve from cache
  }
  
  // Cache miss - fetch from DB
  profile = await db.getProfile(wallet)
  
  // Set cache with 1 hour TTL
  // But invalidate if profile:updated event fires
  await cache.set(key, profile, 3600)
  
  return profile
}

// When profile updates
eventBus.on('profile:updated', ({ wallet }) => {
  cache.delete(`profile:${wallet}`)
})
```

---

## 💾 Cache Configuration

### Development (.env.development)

```
REDIS_ENABLED=false
CACHE_TTL_PROFILE=60
CACHE_TTL_STREAMS=10
CACHE_TTL_SEARCH=30
```

### Production (.env.production)

```
REDIS_ENABLED=true
REDIS_URL=redis://...
CACHE_TTL_PROFILE=3600      # 1 hour
CACHE_TTL_STREAMS=300        # 5 min
CACHE_TTL_SEARCH=1800        # 30 min
CACHE_TTL_TOKENS=86400       # 24 hours
CACHE_MAX_SIZE=1000          # Max items in Redis
```

---

## ⚠️ Cache Gotchas & Solutions

### Problem 1: Stale Cache After Deploy

```javascript
// Solution: Invalidate all caches on deploy
export function onDeploy() {
  logger.info('Invalidating all caches for new deploy')
  redisClient.flushDb()
}
```

### Problem 2: Cache Stampede (Thundering Herd)

```
When cache expires, multiple requests hit DB simultaneously
Solution: Use probabilistic early expiration

GET request at T=3599 (1 second before expiry)
P(10%) = refresh cache before expiry
P(90%) = wait for natural expiry
```

### Problem 3: Cache Incoherence in Distributed System

```
Server A writes to DB
Server B still reading from cache
Solution: Use event bus to invalidate across servers

eventBus.publish('profile:updated', payload)
All servers listen and invalidate locally
```

---

## 📊 Rollout Plan

**Week 1:**
- [ ] Set up Redis
- [ ] Implement basic caching for profiles
- [ ] Monitor hit rate

**Week 2:**
- [ ] Add caching for streams
- [ ] Add caching for search
- [ ] Monitor database load reduction

**Week 3:**
- [ ] Event-based invalidation
- [ ] Cache warming on startup
- [ ] Production rollout

**Week 4:**
- [ ] Monitor cache performance
- [ ] Tune TTLs based on real data
- [ ] Optimization

---

## 🎓 Cache Checklist

- [ ] Redis provisioned and tested
- [ ] Basic cache implemented for hot data
- [ ] TTLs configured appropriately
- [ ] Invalidation strategy implemented
- [ ] Cache stats monitoring added
- [ ] Production deployed
- [ ] Hit rate > 80%
- [ ] Database load reduced 50%+
- [ ] Response times improved 50%+
- [ ] Team trained on cache strategy

---

**Caching is 80% of scaling performance.** ✓

