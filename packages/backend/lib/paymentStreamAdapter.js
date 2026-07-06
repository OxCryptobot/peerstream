/**
 * Payment Stream Service Abstraction Layer
 * 
 * FRAGILE POINT FIX: Abstracts Sablier so switching is easy
 * If Sablier API changes or contract issues occur, fallback to simple streaming
 * Handles testnet vs mainnet differences automatically
 */

import { getLogger } from '../lib/logger.js'
import { config } from '../lib/config.js'

const logger = getLogger('PaymentAbstraction')

/**
 * Abstraction for payment streaming
 * Implementations: Sablier (on-chain), Simple (backend-managed), Mock (testing)
 */
class PaymentStreamAdapter {
  constructor(provider = 'sablier', network = 'mainnet') {
    this.provider = provider
    this.network = network // mainnet or testnet
    this.adapter = null
    this.initAdapter()
  }

  initAdapter() {
    switch (this.provider) {
      case 'sablier':
        this.adapter = new SablierAdapter(this.network)
        logger.info('Using Sablier adapter', { network: this.network })
        break
      case 'simple':
        this.adapter = new SimpleStreamAdapter(this.network)
        logger.info('Using Simple Stream adapter (fallback)')
        break
      case 'mock':
        this.adapter = new MockStreamAdapter()
        logger.info('Using Mock adapter (testing)')
        break
      default:
        throw new Error(`Unknown provider: ${this.provider}`)
    }
  }

  /**
   * Create payment stream
   * Returns: { streamId, sender, recipient, token, amount, startTime, stopTime, status, chainId }
   */
  async createStream(payload) {
    try {
      return await this.adapter.create(payload)
    } catch (error) {
      logger.error('Failed to create stream', error, { provider: this.provider })
      // Fallback to simple streaming
      if (this.provider !== 'simple') {
        logger.warn(`Falling back from ${this.provider} to simple streaming`)
        this.provider = 'simple'
        this.initAdapter()
        return await this.adapter.create(payload)
      }
      throw error
    }
  }

  /**
   * Get stream details
   */
  async getStream(streamId, chainId) {
    try {
      return await this.adapter.get(streamId, chainId)
    } catch (error) {
      logger.error('Failed to get stream', error)
      if (this.provider !== 'simple') {
        this.provider = 'simple'
        this.initAdapter()
        return await this.adapter.get(streamId, chainId)
      }
      throw error
    }
  }

  /**
   * Get streamed amount so far
   */
  async getStreamedAmount(streamId, chainId) {
    try {
      return await this.adapter.getStreamed(streamId, chainId)
    } catch (error) {
      logger.error('Failed to get streamed amount', error)
      throw error
    }
  }

  /**
   * Withdraw from stream
   */
  async withdrawFromStream(streamId, recipient, amount, chainId) {
    try {
      return await this.adapter.withdraw(streamId, recipient, amount, chainId)
    } catch (error) {
      logger.error('Failed to withdraw', error)
      throw error
    }
  }

  /**
   * Cancel stream
   */
  async cancelStream(streamId, chainId) {
    try {
      return await this.adapter.cancel(streamId, chainId)
    } catch (error) {
      logger.error('Failed to cancel stream', error)
      throw error
    }
  }

  /**
   * Get all streams for wallet
   */
  async getUserStreams(wallet, role = 'all') {
    try {
      return await this.adapter.getUserStreams(wallet, role)
    } catch (error) {
      logger.error('Failed to get user streams', error)
      throw error
    }
  }

  getActiveProvider() {
    return this.provider
  }

  switchProvider(newProvider, network = 'mainnet') {
    logger.info(`Switching from ${this.provider} to ${newProvider}`)
    this.provider = newProvider
    this.network = network
    this.initAdapter()
  }
}

/**
 * Sablier V2 Implementation
 * Primary provider for on-chain streaming
 */
class SablierAdapter {
  constructor(network = 'mainnet') {
    this.network = network
    // Contract addresses differ between testnet and mainnet
    this.contractAddresses = {
      mainnet: {
        ethereum: '0x3962f600df0524e5552d97b56bf5accff6250066',
        arbitrum: '0x6592d3ead5d17d6b2da02f49213baad83ed97f6f',
        optimism: '0x1e8d987e944c11ee14fb1a05cff5d11a2e15ea14'
      },
      testnet: {
        sepolia: '0xc6aad0d73d0c71da38dce23ce2653f98e16a8f8b',
        arbitrumSepolia: '0x3580afc5e3b87dc27b1d41c31c23b2b8ba51aa3d',
        optimismSepolia: '0x0e1827de404fc337f080848c7476b55285b85f14'
      }
    }
  }

  async create(payload) {
    try {
      // Use existing sablierService but wrap for version compatibility
      const { getSablierService } = await import('../services/sablierService.js')
      const sablier = getSablierService()
      return await sablier.createLinearStream(
        payload.sender,
        payload.recipient,
        payload.token,
        payload.amount,
        payload.duration,
        payload.chainId
      )
    } catch (error) {
      // Handle contract-specific errors
      if (error.message.includes('Contract')) {
        logger.error('Sablier contract error - may indicate version mismatch', error)
        throw new Error('SablierContractError')
      }
      throw error
    }
  }

  async get(streamId, chainId) {
    const { getSablierService } = await import('../services/sablierService.js')
    const sablier = getSablierService()
    return await sablier.getStream(streamId, chainId)
  }

  async getStreamed(streamId, chainId) {
    const { getSablierService } = await import('../services/sablierService.js')
    const sablier = getSablierService()
    return await sablier.getStreamedAmount(streamId, chainId)
  }

  async withdraw(streamId, recipient, amount, chainId) {
    const { getSablierService } = await import('../services/sablierService.js')
    const sablier = getSablierService()
    return await sablier.withdrawFromStream(streamId, recipient, amount, chainId)
  }

  async cancel(streamId, chainId) {
    const { getSablierService } = await import('../services/sablierService.js')
    const sablier = getSablierService()
    return await sablier.cancelStream(streamId, chainId)
  }

  async getUserStreams(wallet, role = 'all') {
    const { getSablierService } = await import('../services/sablierService.js')
    const sablier = getSablierService()
    return await sablier.getUserStreams(wallet, role)
  }
}

/**
 * Simple Stream Adapter
 * Backend-managed streaming without on-chain contracts
 * Fallback when Sablier is unavailable
 */
class SimpleStreamAdapter {
  constructor(network = 'mainnet') {
    this.network = network
  }

  async create(payload) {
    logger.info('Creating stream via backend (not on-chain)', payload)
    const { getPool } = await import('../lib/database.js')
    const pool = getPool()

    const startTime = Math.floor(Date.now() / 1000)
    const stopTime = startTime + payload.duration

    const result = await pool.query(
      `INSERT INTO payment_streams 
        (sender_id, recipient_id, token_address, token_symbol, amount, start_time, stop_time, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
       RETURNING *`,
      [
        payload.senderId,
        payload.recipientId,
        payload.token,
        payload.tokenSymbol || 'USDC',
        payload.amount,
        startTime,
        stopTime
      ]
    )

    return result.rows[0]
  }

  async get(streamId, chainId) {
    const { getPool } = await import('../lib/database.js')
    const pool = getPool()

    const result = await pool.query(
      'SELECT * FROM payment_streams WHERE id = $1',
      [streamId]
    )
    return result.rows[0]
  }

  async getStreamed(streamId, chainId) {
    const stream = await this.get(streamId, chainId)
    if (!stream) return 0

    const now = Math.floor(Date.now() / 1000)
    const elapsed = Math.max(0, now - stream.start_time)
    const duration = stream.stop_time - stream.start_time
    const streamed = (elapsed / duration) * stream.amount

    return Math.min(streamed, stream.amount)
  }

  async withdraw(streamId, recipient, amount, chainId) {
    const { getPool } = await import('../lib/database.js')
    const pool = getPool()

    // Update stream (in real implementation, would transfer funds)
    await pool.query(
      `UPDATE payment_streams 
       SET withdrawn = withdrawn + $1 
       WHERE id = $2`,
      [amount, streamId]
    )

    return { success: true, amount }
  }

  async cancel(streamId, chainId) {
    const { getPool } = await import('../lib/database.js')
    const pool = getPool()

    await pool.query(
      `UPDATE payment_streams SET status = 'cancelled' WHERE id = $1`,
      [streamId]
    )

    return { success: true }
  }

  async getUserStreams(wallet, role = 'all') {
    const { getPool } = await import('../lib/database.js')
    const pool = getPool()

    let query = 'SELECT * FROM payment_streams WHERE '
    const params = [wallet]

    if (role === 'sender') {
      query += 'sender_id = $1'
    } else if (role === 'recipient') {
      query += 'recipient_id = $1'
    } else {
      query += '(sender_id = $1 OR recipient_id = $1)'
    }

    const result = await pool.query(query, params)
    return result.rows
  }
}

/**
 * Mock Stream Adapter
 * For testing without contracts
 */
class MockStreamAdapter {
  async create(payload) {
    logger.info('Creating mock stream (testing only)')
    return {
      streamId: Math.floor(Math.random() * 1000000),
      sender: payload.sender,
      recipient: payload.recipient,
      token: payload.token,
      amount: payload.amount,
      duration: payload.duration,
      status: 'active',
      startTime: Date.now(),
      stopTime: Date.now() + payload.duration * 1000
    }
  }

  async get(streamId) {
    return { streamId, status: 'active' }
  }

  async getStreamed(streamId) {
    return Math.random() * 1000 // Mock value
  }

  async withdraw(streamId, recipient, amount) {
    return { success: true, amount }
  }

  async cancel(streamId) {
    return { success: true }
  }

  async getUserStreams(wallet, role) {
    return []
  }
}

let paymentAdapter = null

/**
 * Get or create payment adapter
 */
export function getPaymentStream(provider = 'sablier', network = 'mainnet') {
  if (!paymentAdapter) {
    paymentAdapter = new PaymentStreamAdapter(provider, network)
  }
  return paymentAdapter
}

/**
 * Switch payment provider at runtime
 */
export function switchPaymentProvider(provider, network = 'mainnet') {
  if (paymentAdapter) {
    paymentAdapter.switchProvider(provider, network)
  } else {
    paymentAdapter = new PaymentStreamAdapter(provider, network)
  }
}

export { PaymentStreamAdapter }
