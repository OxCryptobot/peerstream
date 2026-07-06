/**
 * Communication Service Abstraction Layer
 * 
 * FRAGILE POINT FIX: Abstracts video/messaging so LiveKit can be swapped
 * If LiveKit goes down, fallback to mock/recording mode
 */

import { getLogger } from '../lib/logger.js'

const logger = getLogger('CommunicationAbstraction')

/**
 * Abstraction for real-time communication
 * Implementations: LiveKit (primary), Mock (fallback)
 */
class CommunicationAdapter {
  constructor(provider = 'livekit') {
    this.provider = provider
    this.adapter = null
    this.initAdapter()
  }

  initAdapter() {
    switch (this.provider) {
      case 'livekit':
        this.adapter = new LiveKitAdapter()
        logger.info('Using LiveKit adapter')
        break
      case 'mock':
        this.adapter = new MockCommunicationAdapter()
        logger.info('Using Mock adapter (fallback)')
        break
      default:
        throw new Error(`Unknown provider: ${this.provider}`)
    }
  }

  /**
   * Generate token for video room
   * Returns: { token, url, roomName }
   */
  async generateToken(payload) {
    try {
      return await this.adapter.generateToken(payload)
    } catch (error) {
      logger.error('Failed to generate token', error, { provider: this.provider })
      // Fallback to mock
      if (this.provider !== 'mock') {
        logger.warn('LiveKit unavailable, falling back to mock mode')
        this.provider = 'mock'
        this.initAdapter()
        return await this.adapter.generateToken(payload)
      }
      throw error
    }
  }

  /**
   * Record call metadata
   */
  async recordCall(payload) {
    try {
      return await this.adapter.recordCall(payload)
    } catch (error) {
      logger.error('Failed to record call', error)
      // Recording failure shouldn't break the app
      logger.warn('Continuing despite recording error')
      return { success: false, error: error.message }
    }
  }

  /**
   * Get room info
   */
  async getRoomInfo(roomName) {
    try {
      return await this.adapter.getRoomInfo(roomName)
    } catch (error) {
      logger.error('Failed to get room info', error)
      if (this.provider !== 'mock') {
        this.provider = 'mock'
        this.initAdapter()
        return await this.adapter.getRoomInfo(roomName)
      }
      throw error
    }
  }

  getActiveProvider() {
    return this.provider
  }

  switchProvider(newProvider) {
    logger.info(`Switching from ${this.provider} to ${newProvider}`)
    this.provider = newProvider
    this.initAdapter()
  }
}

/**
 * LiveKit Implementation
 * Primary provider for video/messaging
 */
class LiveKitAdapter {
  async generateToken(payload) {
    try {
      // Use existing LiveKit token generation
      const { AccessToken } = await import('livekit-server-sdk')
      const { config } = await import('../lib/config.js')

      const token = new AccessToken(
        config.livekit.apiKey,
        config.livekit.apiSecret
      )

      token.addGrant({
        roomJoin: true,
        room: payload.roomName,
        canPublish: true,
        canPublishData: true,
        canSubscribe: true
      })

      return {
        token: token.toJwt(),
        url: config.livekit.url,
        roomName: payload.roomName,
        provider: 'livekit'
      }
    } catch (error) {
      logger.error('LiveKit token generation failed', error)
      if (error.message.includes('API') || error.message.includes('connection')) {
        throw new Error('LiveKitUnavailable')
      }
      throw error
    }
  }

  async recordCall(payload) {
    logger.info('Recording call via LiveKit', { roomName: payload.roomName })
    // LiveKit recordings handled server-side
    return { success: true, recordingId: payload.roomName }
  }

  async getRoomInfo(roomName) {
    try {
      const { AccessToken, RoomServiceClient } = await import('livekit-server-sdk')
      const { config } = await import('../lib/config.js')

      const roomClient = new RoomServiceClient(
        config.livekit.url,
        config.livekit.apiKey,
        config.livekit.apiSecret
      )

      const rooms = await roomClient.listRooms([roomName])
      return rooms[0] || null
    } catch (error) {
      logger.error('Failed to get room info', error)
      throw error
    }
  }
}

/**
 * Mock Communication Adapter
 * Fallback when LiveKit is unavailable
 */
class MockCommunicationAdapter {
  async generateToken(payload) {
    logger.warn('Generating mock token (LiveKit unavailable)', {
      roomName: payload.roomName
    })

    // Return mock token that client can use for local recording/fallback
    const mockToken = Buffer.from(
      JSON.stringify({
        room: payload.roomName,
        identity: payload.identity,
        metadata: payload.metadata,
        mode: 'mock'
      })
    ).toString('base64')

    return {
      token: mockToken,
      url: 'mock://localhost',
      roomName: payload.roomName,
      provider: 'mock',
      warning: 'Using fallback mode - video recording unavailable'
    }
  }

  async recordCall(payload) {
    logger.info('Mock recording (LiveKit unavailable)', { roomName: payload.roomName })
    return {
      success: true,
      recordingId: `mock-${Date.now()}`,
      mode: 'mock'
    }
  }

  async getRoomInfo(roomName) {
    logger.debug('Getting mock room info')
    return {
      name: roomName,
      numParticipants: 0,
      mode: 'mock'
    }
  }
}

let communicationAdapter = null

/**
 * Get or create communication adapter
 */
export function getCommunication(provider = 'livekit') {
  if (!communicationAdapter) {
    communicationAdapter = new CommunicationAdapter(provider)
  }
  return communicationAdapter
}

/**
 * Switch communication provider
 */
export function switchCommunicationProvider(provider) {
  if (communicationAdapter) {
    communicationAdapter.switchProvider(provider)
  } else {
    communicationAdapter = new CommunicationAdapter(provider)
  }
}

export { CommunicationAdapter }
