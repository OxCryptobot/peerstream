/**
 * Sablier Protocol Service
 * Handle payment streams on Ethereum, Arbitrum, and Optimism
 */

import { ethers } from 'ethers'
import config from '../lib/config.js'
import { ExternalServiceError, ValidationError, AppError } from '../lib/errors.js'
import { getLogger } from '../lib/logger.js'

const logger = getLogger('SablierService')

// Sablier V2 contract ABI (essential methods)
const SABLIER_ABI = [
  'function createLockupLinear(tuple(address sender, address recipient, uint128 deposit, address asset, bool cancelable, uint40 startTime, uint40 stopTime, address broker) lockupLinear) returns (uint256)',
  'function cancelStream(uint256 streamId) returns ()',
  'function withdraw(uint256 streamId, address to, uint128 amount) returns ()',
  'function getStream(uint256 streamId) returns (tuple(address sender, address recipient, uint128 deposit, address asset, bool canceled, bool isCancelable, uint40 startTime, uint40 stopTime, uint128 withdrawn))',
  'function balanceOf(uint256 streamId) view returns (uint128)',
  'function streamedAmountOf(uint256 streamId) view returns (uint128)',
  'event CreateStream(indexed uint256 streamId, indexed address sender, indexed address recipient, uint128 deposit, address asset, uint40 startTime, uint40 stopTime)'
]

// Supported networks
const SUPPORTED_NETWORKS = {
  1: { name: 'Ethereum', sablierAddress: '0x...' }, // Placeholder
  42161: { name: 'Arbitrum', sablierAddress: '0x...' },
  10: { name: 'Optimism', sablierAddress: '0x...' }
}

class SablierService {
  constructor() {
    this.providers = {}
    this.contracts = {}
    this.enabled = config.sablier.enabled
    this.streamCache = new Map() // In-memory stream cache
  }

  /**
   * Initialize Sablier contracts for supported networks
   */
  async initialize() {
    if (!this.enabled) {
      logger.warn('Sablier is disabled - payment streaming unavailable')
      return
    }

    try {
      // Initialize providers for each network
      this.providers[1] = new ethers.JsonRpcProvider(config.rpc.ethereum)
      this.providers[42161] = new ethers.JsonRpcProvider(config.rpc.arbitrum)
      this.providers[10] = new ethers.JsonRpcProvider(config.rpc.optimism)

      // Initialize contracts (requires actual Sablier addresses)
      for (const [chainId, network] of Object.entries(SUPPORTED_NETWORKS)) {
        if (config.sablier.networks[Object.keys(config.sablier.networks)[chainId]]) {
          const address = config.sablier.networks[
            Object.keys(config.sablier.networks)[chainId]
          ]
          this.contracts[chainId] = new ethers.Contract(
            address,
            SABLIER_ABI,
            this.providers[chainId]
          )
        }
      }

      logger.info('Sablier service initialized', { networks: Object.keys(this.providers) })
    } catch (error) {
      throw new ExternalServiceError('Sablier', error.message)
    }
  }

  /**
   * Create a linear payment stream
   * Funds are streamed linearly from startTime to stopTime
   */
  async createLinearStream(
    senderAddress,
    recipientAddress,
    tokenAddress,
    amount,
    duration,
    chainId = 1
  ) {
    if (!this.enabled) {
      return this._simulateStream(senderAddress, recipientAddress, amount, duration)
    }

    try {
      // Validate inputs
      if (!ethers.isAddress(senderAddress)) {
        throw new ValidationError('Invalid sender address')
      }
      if (!ethers.isAddress(recipientAddress)) {
        throw new ValidationError('Invalid recipient address')
      }
      if (!ethers.isAddress(tokenAddress)) {
        throw new ValidationError('Invalid token address')
      }
      if (!this.providers[chainId]) {
        throw new ValidationError(`Chain ${chainId} not supported`)
      }

      const network = SUPPORTED_NETWORKS[chainId]
      const provider = this.providers[chainId]
      const contract = this.contracts[chainId]

      if (!contract) {
        throw new AppError(
          'Sablier contract not configured for this chain',
          500
        )
      }

      // Calculate time values
      const now = Math.floor(Date.now() / 1000)
      const startTime = now + 3600 // Start in 1 hour
      const stopTime = startTime + duration

      // Prepare stream creation parameters
      const streamParams = {
        sender: senderAddress,
        recipient: recipientAddress,
        deposit: ethers.parseUnits(amount.toString(), 6), // Assuming 6 decimals (USDC)
        asset: tokenAddress,
        cancelable: true,
        startTime,
        stopTime,
        broker: ethers.ZeroAddress // No broker fee
      }

      // In production: execute on-chain transaction
      // const tx = await contract.createLockupLinear(streamParams)
      // const receipt = await tx.wait()
      // const streamId = receipt.events[0].args.streamId

      // Placeholder: Return simulated stream
      const streamId = Math.floor(Math.random() * 1000000)

      logger.info('Linear stream created', {
        streamId,
        sender: senderAddress,
        recipient: recipientAddress,
        amount,
        chainId: network.name,
        duration
      })

      // Cache stream data
      const streamData = {
        streamId,
        sender: senderAddress,
        recipient: recipientAddress,
        token: tokenAddress,
        amount: parseFloat(amount),
        startTime,
        stopTime,
        duration,
        createdAt: new Date().toISOString(),
        status: 'active',
        cancelable: true,
        withdrawn: 0,
        chainId,
        network: network.name
      }

      this.streamCache.set(streamId, streamData)

      return streamData
    } catch (error) {
      logger.error('Failed to create Sablier stream', error)
      throw new ExternalServiceError('Sablier', error.message)
    }
  }

  /**
   * Get stream details
   */
  async getStream(streamId, chainId = 1) {
    try {
      // Check cache first
      if (this.streamCache.has(streamId)) {
        return this.streamCache.get(streamId)
      }

      if (!this.enabled || !this.contracts[chainId]) {
        throw new AppError('Sablier not available', 503)
      }

      // In production: fetch from contract
      // const stream = await this.contracts[chainId].getStream(streamId)

      logger.debug('Stream retrieved', { streamId, chainId })

      return null
    } catch (error) {
      logger.error('Failed to get stream', error)
      return null
    }
  }

  /**
   * Get streamed amount (how much has been unlocked so far)
   */
  async getStreamedAmount(streamId, chainId = 1) {
    try {
      const stream = await this.getStream(streamId, chainId)
      if (!stream) {
        throw new AppError('Stream not found', 404)
      }

      const now = Math.floor(Date.now() / 1000)
      const { startTime, stopTime, amount } = stream

      // Linear calculation
      if (now <= startTime) return 0
      if (now >= stopTime) return amount

      const progress = (now - startTime) / (stopTime - startTime)
      return amount * progress
    } catch (error) {
      logger.error('Failed to calculate streamed amount', error)
      throw error
    }
  }

  /**
   * Withdraw from stream
   */
  async withdrawFromStream(streamId, recipientAddress, amount, chainId = 1) {
    if (!this.enabled) {
      logger.info('Simulated withdrawal', { streamId, amount })
      return { success: true, txHash: `0x${'0'.repeat(64)}` }
    }

    try {
      if (!ethers.isAddress(recipientAddress)) {
        throw new ValidationError('Invalid recipient address')
      }

      const stream = await this.getStream(streamId, chainId)
      if (!stream) {
        throw new AppError('Stream not found', 404)
      }

      const streamed = await this.getStreamedAmount(streamId, chainId)
      const available = streamed - stream.withdrawn

      if (amount > available) {
        throw new ValidationError(`Insufficient available balance: ${available}`)
      }

      // In production: execute withdrawal
      // const tx = await contract.withdraw(streamId, recipientAddress, amount)
      // const receipt = await tx.wait()

      logger.info('Withdrawal initiated', { streamId, amount, recipient: recipientAddress })

      // Update cache
      const updated = { ...stream, withdrawn: stream.withdrawn + amount }
      this.streamCache.set(streamId, updated)

      return {
        success: true,
        streamId,
        amount,
        txHash: `0x${'0'.repeat(64)}`, // Placeholder
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      logger.error('Failed to withdraw from stream', error)
      throw error
    }
  }

  /**
   * Cancel stream
   */
  async cancelStream(streamId, chainId = 1) {
    if (!this.enabled) {
      logger.info('Simulated cancellation', { streamId })
      return { success: true }
    }

    try {
      const stream = await this.getStream(streamId, chainId)
      if (!stream) {
        throw new AppError('Stream not found', 404)
      }

      if (!stream.cancelable) {
        throw new AppError('Stream cannot be canceled', 400)
      }

      // In production: execute cancellation
      // const tx = await contract.cancelStream(streamId)
      // const receipt = await tx.wait()

      logger.info('Stream canceled', { streamId })

      // Update cache
      const updated = { ...stream, status: 'canceled', canceledAt: new Date().toISOString() }
      this.streamCache.set(streamId, updated)

      return { success: true, streamId }
    } catch (error) {
      logger.error('Failed to cancel stream', error)
      throw error
    }
  }

  /**
   * Get all streams for a user
   */
  async getUserStreams(walletAddress, role = 'sender') {
    try {
      const streams = Array.from(this.streamCache.values())
        .filter((stream) => {
          if (role === 'sender') return stream.sender.toLowerCase() === walletAddress.toLowerCase()
          if (role === 'recipient') return stream.recipient.toLowerCase() === walletAddress.toLowerCase()
          return false
        })
        .map((stream) => ({
          ...stream,
          streamed: this._calculateStreamed(stream),
          available: this._calculateAvailable(stream)
        }))

      return streams
    } catch (error) {
      logger.error('Failed to get user streams', error)
      return []
    }
  }

  /**
   * Get stream statistics
   */
  async getStreamStats(streamId) {
    try {
      const stream = await this.getStream(streamId)
      if (!stream) {
        throw new AppError('Stream not found', 404)
      }

      const streamed = this._calculateStreamed(stream)
      const available = this._calculateAvailable(stream)
      const progress = (streamed / stream.amount) * 100

      return {
        streamId,
        total: stream.amount,
        streamed,
        available,
        withdrawn: stream.withdrawn,
        progress,
        startTime: stream.startTime,
        stopTime: stream.stopTime,
        durationRemaining: Math.max(0, stream.stopTime - Math.floor(Date.now() / 1000))
      }
    } catch (error) {
      logger.error('Failed to get stream stats', error)
      throw error
    }
  }

  /**
   * Helper: Calculate streamed amount
   */
  _calculateStreamed(stream) {
    const now = Math.floor(Date.now() / 1000)
    if (now <= stream.startTime) return 0
    if (now >= stream.stopTime) return stream.amount

    const progress = (now - stream.startTime) / (stream.stopTime - stream.startTime)
    return stream.amount * progress
  }

  /**
   * Helper: Calculate available balance
   */
  _calculateAvailable(stream) {
    const streamed = this._calculateStreamed(stream)
    return Math.max(0, streamed - stream.withdrawn)
  }

  /**
   * Simulate stream for testing
   */
  _simulateStream(sender, recipient, amount, duration) {
    const streamId = Math.floor(Math.random() * 1000000)
    const now = Math.floor(Date.now() / 1000)

    const stream = {
      streamId,
      sender,
      recipient,
      token: '0x0000000000000000000000000000000000000000', // Placeholder
      amount: parseFloat(amount),
      startTime: now + 3600,
      stopTime: now + 3600 + duration,
      duration,
      createdAt: new Date().toISOString(),
      status: 'active',
      cancelable: true,
      withdrawn: 0,
      chainId: 1,
      network: 'Ethereum (Simulated)'
    }

    this.streamCache.set(streamId, stream)
    logger.info('Simulated stream created', { streamId, amount, duration })

    return stream
  }
}

// Singleton instance
let sablierInstance = null

export function initializeSablier() {
  if (!sablierInstance) {
    sablierInstance = new SablierService()
  }
  return sablierInstance
}

export function getSablierService() {
  if (!sablierInstance) {
    throw new Error('Sablier service not initialized')
  }
  return sablierInstance
}

export default SablierService
