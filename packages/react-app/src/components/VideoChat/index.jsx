import React, { useState, useEffect, useCallback } from 'react'
import styled from 'styled-components'
import { LiveKitRoom, VideoConference } from '@livekit/components-react'
import { useWeb3React } from '@web3-react/core'

const VideoContainer = styled.div`
  width: 100%;
  height: 100%;
  background: #0F172A;
  border-radius: 1rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .lk {
    height: 100%;
    background: #0F172A;
  }

  .lk-video-conference {
    height: 100%;
    --lk-primary-color: #1E40AF;
    --lk-secondary-color: #7C3AED;
  }
`

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: linear-gradient(135deg, #0F172A 0%, #1a2e66 100%);
  border-radius: 1rem;
  min-height: 400px;
`

const LoadingSpinner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(30, 64, 175, 0.2);
    border-top: 4px solid #1E40AF;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  p {
    color: #9CA3AF;
    font-size: 0.9rem;
  }
`

const ErrorContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: linear-gradient(135deg, #FEE2E2 0%, #FCE7F3 100%);
  border-radius: 1rem;
  min-height: 400px;
  padding: 2rem;
  text-align: center;

  div {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    h3 {
      color: #DC2626;
      margin: 0;
      font-size: 1.1rem;
    }

    p {
      color: #7F1D1D;
      margin: 0;
      font-size: 0.9rem;
    }

    button {
      background: linear-gradient(135deg, #1E40AF 0%, #7C3AED 100%);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
      }
    }
  }
`

/**
 * VideoChat Component
 * Handles LiveKit video conference integration
 * 
 * Props:
 *   - roomName (string): LiveKit room identifier
 *   - userName (string): User's display name
 *   - token (string): LiveKit access token
 *   - serverUrl (string): LiveKit server URL
 *   - onError (function): Error callback
 *   - onJoined (function): Callback when user joins room
 *   - onLeft (function): Callback when user leaves room
 */
export default function VideoChat({
  roomName,
  userName,
  token,
  serverUrl = process.env.VITE_LIVEKIT_URL || 'ws://localhost:7880',
  onError,
  onJoined,
  onLeft
}) {
  const { account } = useWeb3React()
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState(null)

  // Validate required props
  useEffect(() => {
    if (!roomName || !userName || !token) {
      setError('Missing required video chat configuration')
      onError?.('Missing required parameters')
    }
  }, [roomName, userName, token, onError])

  const handleError = useCallback((err) => {
    console.error('LiveKit error:', err)
    setError(err.message || 'Video connection failed')
    onError?.(err)
  }, [onError])

  const handleJoined = useCallback(() => {
    console.log('User joined room:', roomName)
    setIsConnecting(false)
    onJoined?.()
  }, [roomName, onJoined])

  const handleLeft = useCallback(() => {
    console.log('User left room:', roomName)
    onLeft?.()
  }, [roomName, onLeft])

  const handleRetry = () => {
    setError(null)
    setIsConnecting(false)
  }

  if (error) {
    return (
      <ErrorContainer>
        <div>
          <h3>Video Connection Error</h3>
          <p>{error}</p>
          <button onClick={handleRetry}>Try Again</button>
        </div>
      </ErrorContainer>
    )
  }

  if (!token || !roomName || !userName) {
    return (
      <LoadingContainer>
        <LoadingSpinner>
          <div className="spinner" />
          <p>Configuring video connection...</p>
        </LoadingSpinner>
      </LoadingContainer>
    )
  }

  return (
    <VideoContainer>
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={serverUrl}
        roomName={roomName}
        onError={handleError}
        onConnected={handleJoined}
        onDisconnected={handleLeft}
        data-lk-theme="dark"
      >
        <VideoConference />
      </LiveKitRoom>
    </VideoContainer>
  )
}
