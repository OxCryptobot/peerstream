import React, { useState, useCallback } from 'react'
import styled from 'styled-components'
import {
  useLocalParticipant,
  useRoomContext,
  ControlBar,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks
} from '@livekit/components-react'
import { Track } from 'livekit-client'

const ControlsContainer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0) 0%, rgba(15, 23, 42, 0.95) 50%, rgba(15, 23, 42, 1) 100%);
  padding: 2rem 1rem 1rem;
  display: flex;
  justify-content: center;
  z-index: 100;
  border-top: 1px solid rgba(30, 64, 175, 0.2);

  @media (max-width: 768px) {
    padding: 1rem 0.5rem 0.5rem;
  }
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;

  @media (max-width: 768px) {
    gap: 0.5rem;
  }
`

const ControlButton = styled.button`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: ${(props) => (props.active ? 'linear-gradient(135deg, #1E40AF 0%, #7C3AED 100%)' : '#374151')};
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
  }

  &:active {
    transform: scale(0.95);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }
`

const EndCallButton = styled(ControlButton)`
  background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%);
  width: 56px;
  height: 56px;

  &:hover {
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
  }

  @media (max-width: 768px) {
    width: 48px;
    height: 48px;
  }
`

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(30, 64, 175, 0.1);
  border: 1px solid rgba(30, 64, 175, 0.3);
  border-radius: 2rem;
  color: #E0E7FF;
  font-size: 0.85rem;
  margin: 0 0.5rem;

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #10B981;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  @media (max-width: 768px) {
    margin: 0;
    padding: 0.4rem 0.8rem;
    font-size: 0.75rem;
  }
`

const ParticipantCount = styled.span`
  background: linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%);
  padding: 0.25rem 0.75rem;
  border-radius: 2rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: white;
`

/**
 * CallControls Component
 * Manages video, audio, and call actions
 * 
 * Props:
 *   - onEndCall (function): Callback when call ends
 *   - onScreenShare (function): Callback for screen share toggle
 *   - showChat (boolean): Show chat button
 *   - onChatToggle (function): Chat toggle callback
 */
export function CallControls({ onEndCall, onScreenShare, showChat, onChatToggle }) {
  const { localParticipant } = useLocalParticipant()
  const room = useRoomContext()
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [showChatPanel, setShowChatPanel] = useState(false)

  const participants = useTracks([Track.Source.Camera, Track.Source.ScreenShare], {
    onlySubscribed: false
  })

  const handleMicToggle = useCallback(async () => {
    if (!localParticipant) return

    try {
      await localParticipant.setMicrophoneEnabled(!isMuted)
      setIsMuted(!isMuted)
    } catch (err) {
      console.error('Failed to toggle microphone:', err)
    }
  }, [isMuted, localParticipant])

  const handleVideoToggle = useCallback(async () => {
    if (!localParticipant) return

    try {
      await localParticipant.setCameraEnabled(isVideoOff)
      setIsVideoOff(!isVideoOff)
    } catch (err) {
      console.error('Failed to toggle camera:', err)
    }
  }, [isVideoOff, localParticipant])

  const handleScreenShare = useCallback(async () => {
    if (!localParticipant) return

    try {
      await localParticipant.setScreenShareEnabled(!isScreenSharing)
      setIsScreenSharing(!isScreenSharing)
      onScreenShare?.(!isScreenSharing)
    } catch (err) {
      console.error('Failed to toggle screen share:', err)
    }
  }, [isScreenSharing, localParticipant, onScreenShare])

  const handleChatToggle = useCallback(() => {
    setShowChatPanel(!showChatPanel)
    onChatToggle?.(!showChatPanel)
  }, [showChatPanel, onChatToggle])

  const handleEndCall = useCallback(async () => {
    if (room) {
      await room.disconnect()
    }
    onEndCall?.()
  }, [room, onEndCall])

  const participantCount = participants?.length || 0

  return (
    <ControlsContainer>
      <ButtonGroup>
        <StatusIndicator>
          <div className="dot" />
          Recording
        </StatusIndicator>

        <ParticipantCount>{participantCount} participant{participantCount !== 1 ? 's' : ''}</ParticipantCount>

        <ControlButton
          active={!isMuted}
          onClick={handleMicToggle}
          title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {isMuted ? '🔇' : '🎤'}
        </ControlButton>

        <ControlButton
          active={!isVideoOff}
          onClick={handleVideoToggle}
          title={isVideoOff ? 'Turn On Camera' : 'Turn Off Camera'}
        >
          {isVideoOff ? '📹' : '📷'}
        </ControlButton>

        <ControlButton
          active={isScreenSharing}
          onClick={handleScreenShare}
          title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
        >
          🖥️
        </ControlButton>

        {showChat && (
          <ControlButton
            active={showChatPanel}
            onClick={handleChatToggle}
            title={showChatPanel ? 'Hide Chat' : 'Show Chat'}
          >
            💬
          </ControlButton>
        )}

        <EndCallButton
          onClick={handleEndCall}
          title="End Call"
        >
          ☎️
        </EndCallButton>
      </ButtonGroup>

      <RoomAudioRenderer />
    </ControlsContainer>
  )
}

export default CallControls
