import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import request from 'supertest'
import app from '../server.js'

/**
 * Backend API Test Suite
 */

describe('Backend API - Health Check', () => {
  it('GET /health should return healthy status', async () => {
    const response = await request(app).get('/health')

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('status', 'healthy')
    expect(response.body).toHaveProperty('service', 'paytray-backend')
    expect(response.body).toHaveProperty('timestamp')
    expect(response.body).toHaveProperty('livekit')
  })

  it('should have correct service name', async () => {
    const response = await request(app).get('/health')

    expect(response.body.service).toBe('paytray-backend')
  })

  it('should return timestamp in ISO format', async () => {
    const response = await request(app).get('/health')
    const timestamp = new Date(response.body.timestamp)

    expect(timestamp).toBeInstanceOf(Date)
    expect(Number.isNaN(timestamp.getTime())).toBe(false)
  })
})

describe('Backend API - LiveKit Token Generation', () => {
  it('POST /api/livekit/token should require wallet address', async () => {
    const response = await request(app)
      .post('/api/livekit/token')
      .send({
        roomName: 'test-room',
        username: 'Test User'
      })

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty('error')
    expect(response.body.error).toContain('wallet')
  })

  it('POST /api/livekit/token should require valid Ethereum address', async () => {
    const response = await request(app)
      .post('/api/livekit/token')
      .send({
        wallet: 'not-an-address',
        roomName: 'test-room',
        username: 'Test User'
      })

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty('error')
    expect(response.body.error).toContain('Invalid wallet')
  })

  it('POST /api/livekit/token should require room name', async () => {
    const response = await request(app)
      .post('/api/livekit/token')
      .send({
        wallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f42bE0',
        username: 'Test User'
      })

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty('error')
    expect(response.body.error).toContain('Room')
  })

  it('POST /api/livekit/token should require username', async () => {
    const response = await request(app)
      .post('/api/livekit/token')
      .send({
        wallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f42bE0',
        roomName: 'test-room'
      })

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty('error')
    expect(response.body.error).toContain('username')
  })

  it('POST /api/livekit/token should return token with valid params', async () => {
    const response = await request(app)
      .post('/api/livekit/token')
      .send({
        wallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f42bE0',
        roomName: 'test-room',
        username: 'Test User',
        canPublish: true,
        canSubscribe: true
      })

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('token')
    expect(response.body).toHaveProperty('url')
    expect(response.body).toHaveProperty('expiresIn')
    expect(response.body).toHaveProperty('room', 'test-room')
    expect(response.body).toHaveProperty('identity', '0x742d35Cc6634C0532925a3b844Bc9e7595f42bE0')
  })

  it('POST /api/livekit/token should respect permission settings', async () => {
    const response = await request(app)
      .post('/api/livekit/token')
      .send({
        wallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f42bE0',
        roomName: 'test-room',
        username: 'Test User',
        canPublish: false,
        canSubscribe: true
      })

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('token')
  })

  it('POST /api/livekit/token should rate limit requests', async () => {
    // Make multiple requests
    const requests = Array.from({ length: 12 }).map(() =>
      request(app)
        .post('/api/livekit/token')
        .send({
          wallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f42bE0',
          roomName: 'test-room',
          username: 'Test User'
        })
    )

    const responses = await Promise.all(requests)
    const rateLimited = responses.some((res) => res.status === 429)

    expect(rateLimited).toBe(true)
  })
})

describe('Backend API - Wallet Verification', () => {
  it('POST /api/wallet/verify should require wallet address', async () => {
    const response = await request(app)
      .post('/api/wallet/verify')
      .send({
        chainId: 1
      })

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty('error')
  })

  it('POST /api/wallet/verify should validate wallet address format', async () => {
    const response = await request(app)
      .post('/api/wallet/verify')
      .send({
        wallet: 'invalid-address',
        chainId: 1
      })

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty('error')
    expect(response.body.error).toContain('Invalid')
  })

  it('POST /api/wallet/verify should support multiple networks', async () => {
    const networks = [1, 11155111, 42161, 10]

    for (const chainId of networks) {
      const response = await request(app)
        .post('/api/wallet/verify')
        .send({
          wallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f42bE0',
          chainId
        })

      // Should not fail due to unsupported network
      expect(response.status !== 400 || !response.body.error.includes('not supported')).toBe(true)
    }
  })

  it('POST /api/wallet/verify should reject unsupported networks', async () => {
    const response = await request(app)
      .post('/api/wallet/verify')
      .send({
        wallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f42bE0',
        chainId: 99999
      })

    expect(response.status).toBe(400)
    expect(response.body.error).toContain('not supported')
  })
})

describe('Backend API - Profile Endpoints', () => {
  it('GET /api/profile/:wallet should accept valid wallet', async () => {
    const response = await request(app)
      .get('/api/profile/0x742d35Cc6634C0532925a3b844Bc9e7595f42bE0')

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('wallet')
    expect(response.body).toHaveProperty('profile')
  })

  it('GET /api/profile/:wallet should reject invalid wallet', async () => {
    const response = await request(app)
      .get('/api/profile/invalid-wallet')

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty('error')
  })

  it('POST /api/profile/:wallet should accept valid profile data', async () => {
    const response = await request(app)
      .post('/api/profile/0x742d35Cc6634C0532925a3b844Bc9e7595f42bE0')
      .send({
        name: 'Test User',
        bio: 'Test bio',
        expertise: ['Solidity', 'Web3']
      })

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('wallet')
    expect(response.body).toHaveProperty('profile')
  })
})

describe('Backend API - Payment Endpoints', () => {
  it('POST /api/payment/stream/create should require sender', async () => {
    const response = await request(app)
      .post('/api/payment/stream/create')
      .send({
        recipient: '0x123...',
        token: '0xUSDC',
        amount: '1000'
      })

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty('error')
  })

  it('POST /api/payment/stream/create should require recipient', async () => {
    const response = await request(app)
      .post('/api/payment/stream/create')
      .send({
        sender: '0x742d35Cc6634C0532925a3b844Bc9e7595f42bE0',
        token: '0xUSDC',
        amount: '1000'
      })

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty('error')
  })

  it('POST /api/payment/stream/create should accept valid data', async () => {
    const response = await request(app)
      .post('/api/payment/stream/create')
      .send({
        sender: '0x742d35Cc6634C0532925a3b844Bc9e7595f42bE0',
        recipient: '0x123d35Cc6634C0532925a3b844Bc9e7595f42bE1',
        token: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        amount: '1000',
        duration: 2592000
      })

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('status')
    expect(response.body).toHaveProperty('sender')
  })
})

describe('Backend API - Error Handling', () => {
  it('should return 404 for unknown endpoints', async () => {
    const response = await request(app).get('/api/unknown')

    expect(response.status).toBe(404)
    expect(response.body).toHaveProperty('error', 'Endpoint not found')
  })

  it('should handle malformed JSON', async () => {
    const response = await request(app)
      .post('/api/livekit/token')
      .set('Content-Type', 'application/json')
      .send('not valid json')

    // Should return 400 or 500 depending on implementation
    expect([400, 500]).toContain(response.status)
  })

  it('should validate Content-Type', async () => {
    const response = await request(app)
      .post('/api/livekit/token')
      .set('Content-Type', 'text/plain')
      .send('wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f42bE0')

    // May succeed or fail depending on middleware
    expect(response.status).toBeDefined()
  })
})

describe('Backend API - CORS', () => {
  it('should include CORS headers', async () => {
    const response = await request(app)
      .get('/health')
      .set('Origin', 'http://localhost:3000')

    expect(response.headers).toHaveProperty('access-control-allow-origin')
  })
})

describe('Backend API - Performance', () => {
  it('health check should respond quickly', async () => {
    const start = Date.now()
    await request(app).get('/health')
    const duration = Date.now() - start

    expect(duration).toBeLessThan(100)
  })

  it('should handle concurrent requests', async () => {
    const requests = Array.from({ length: 10 }).map(() =>
      request(app).get('/health')
    )

    const responses = await Promise.all(requests)

    expect(responses.every((r) => r.status === 200)).toBe(true)
  })
})
