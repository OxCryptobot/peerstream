/**
 * Sablier Context Provider
 * Manages payment streams and real-time stream updates
 */

import React, { createContext, useState, useCallback, useEffect } from 'react'

export const SablierContext = createContext()

export function SablierProvider({ children }) {
  const [streams, setStreams] = useState(new Map())
  const [currentStream, setCurrentStream] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [userStreams, setUserStreams] = useState([])
  const [streamStats, setStreamStats] = useState(null)

  /**
   * Create a new payment stream
   */
  const createStream = useCallback(async (streamData) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/payments/streams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(streamData)
      })

      if (!response.ok) throw new Error('Failed to create stream')

      const data = await response.json()
      const stream = data.stream

      setStreams((prev) => new Map(prev).set(stream.streamId, stream))
      setCurrentStream(stream)

      return stream
    } catch (err) {
      setError(err.message)
      console.error('Stream creation error:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Load stream details
   */
  const loadStream = useCallback(async (streamId) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/payments/streams/${streamId}`)

      if (!response.ok) throw new Error('Failed to load stream')

      const data = await response.json()
      const stream = data.stream

      setStreams((prev) => new Map(prev).set(streamId, stream))
      return stream
    } catch (err) {
      setError(err.message)
      console.error('Stream load error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Get user's streams (as sender or recipient)
   */
  const getUserStreams = useCallback(async (role = 'sender', status = 'all') => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ role, status })
      const response = await fetch(`/api/payments/streams?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (!response.ok) throw new Error('Failed to get streams')

      const data = await response.json()
      const streamsList = data.streams || []

      setUserStreams(streamsList)

      // Cache streams
      streamsList.forEach((stream) => {
        setStreams((prev) => new Map(prev).set(stream.streamId, stream))
      })

      return streamsList
    } catch (err) {
      setError(err.message)
      console.error('Get streams error:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Get stream statistics
   */
  const getStreamStats = useCallback(async (streamId) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/payments/streams/${streamId}/stats`)

      if (!response.ok) throw new Error('Failed to get stream stats')

      const data = await response.json()
      setStreamStats(data.stats)

      return data.stats
    } catch (err) {
      setError(err.message)
      console.error('Stream stats error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Get streamed amount (how much has been unlocked)
   */
  const getStreamedAmount = useCallback(async (streamId) => {
    try {
      const response = await fetch(`/api/payments/streams/${streamId}/streamed`)

      if (!response.ok) throw new Error('Failed to get streamed amount')

      const data = await response.json()
      return data.streamed
    } catch (err) {
      console.error('Get streamed amount error:', err)
      return 0
    }
  }, [])

  /**
   * Withdraw from stream
   */
  const withdrawFromStream = useCallback(async (streamId, amount) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/payments/streams/${streamId}/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ amount })
      })

      if (!response.ok) throw new Error('Failed to withdraw')

      const data = await response.json()
      return data

    } catch (err) {
      setError(err.message)
      console.error('Withdrawal error:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Cancel stream
   */
  const cancelStream = useCallback(async (streamId) => {
    setLoading(true)
    setError(false)

    try {
      const response = await fetch(`/api/payments/streams/${streamId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (!response.ok) throw new Error('Failed to cancel stream')

      const data = await response.json()

      // Update stream status
      setStreams((prev) => {
        const updated = new Map(prev)
        const stream = updated.get(streamId)
        if (stream) {
          updated.set(streamId, { ...stream, status: 'canceled' })
        }
        return updated
      })

      return data
    } catch (err) {
      setError(err.message)
      console.error('Stream cancellation error:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Calculate progress percentage
   */
  const calculateProgress = useCallback((stream) => {
    if (!stream) return 0

    const now = Math.floor(Date.now() / 1000)
    const { startTime, stopTime } = stream

    if (now <= startTime) return 0
    if (now >= stopTime) return 100

    return ((now - startTime) / (stopTime - startTime)) * 100
  }, [])

  /**
   * Calculate remaining time
   */
  const calculateRemainingTime = useCallback((stream) => {
    if (!stream) return null

    const now = Math.floor(Date.now() / 1000)
    const remaining = stream.stopTime - now

    if (remaining <= 0) return null

    const days = Math.floor(remaining / 86400)
    const hours = Math.floor((remaining % 86400) / 3600)
    const minutes = Math.floor((remaining % 3600) / 60)

    return { days, hours, minutes, total: remaining }
  }, [])

  /**
   * Format stream for display
   */
  const formatStream = useCallback((stream) => {
    if (!stream) return null

    return {
      ...stream,
      progress: calculateProgress(stream),
      remainingTime: calculateRemainingTime(stream),
      perMinute: stream.amount / (stream.duration / 60),
      perDay: stream.amount / (stream.duration / 86400)
    }
  }, [calculateProgress, calculateRemainingTime])

  /**
   * Get total streaming amount
   */
  const getTotalStreaming = useCallback((streamsList = userStreams) => {
    return streamsList
      .filter((s) => s.status === 'active')
      .reduce((sum, s) => sum + s.amount, 0)
  }, [userStreams])

  const value = {
    // State
    streams,
    currentStream,
    loading,
    error,
    userStreams,
    streamStats,

    // Methods
    createStream,
    loadStream,
    getUserStreams,
    getStreamStats,
    getStreamedAmount,
    withdrawFromStream,
    cancelStream,
    calculateProgress,
    calculateRemainingTime,
    formatStream,
    getTotalStreaming
  }

  return (
    <SablierContext.Provider value={value}>
      {children}
    </SablierContext.Provider>
  )
}

/**
 * Hook to use Sablier context
 */
export function useSablier() {
  const context = React.useContext(SablierContext)
  if (!context) {
    throw new Error('useSablier must be used within SablierProvider')
  }
  return context
}

export default SablierProvider
