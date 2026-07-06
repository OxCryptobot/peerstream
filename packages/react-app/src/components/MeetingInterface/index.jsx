import React, { useState, useEffect, useCallback } from 'react'
import styled from 'styled-components'
import { useWeb3React } from '@web3-react/core'
import { useNavigate, useSearchParams } from 'react-router-dom'
import VideoChat from '../VideoChat'
import { CallControls } from '../CallControls'
import { useCeramic } from '../../contexts/Ceramic'

const PageContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #0F172A 0%, #1a2e66 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

const MeetingHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: rgba(15, 23, 42, 0.8);
  border-bottom: 1px solid rgba(30, 64, 175, 0.2);
  backdrop-filter: blur(10px);
  z-index: 50;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`

const HeaderTitle = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  h1 {
    margin: 0;
    color: white;
    font-size: 1.5rem;
    font-weight: 700;

    @media (max-width: 768px) {
      font-size: 1.1rem;
    }
  }

  p {
    margin: 0;
    color: #9CA3AF;
    font-size: 0.85rem;
  }
`

const HeaderActions = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;

  @media (max-width: 768px) {
    gap: 0.5rem;
  }
`

const HeaderButton = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;

  &:hover {
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    padding: 0.6rem 1rem;
    font-size: 0.8rem;
  }
`

const SettingsButton = styled(HeaderButton)`
  background: rgba(30, 64, 175, 0.2);
  color: #E0E7FF;
  border: 1px solid rgba(30, 64, 175, 0.3);

  &:hover {
    background: rgba(30, 64, 175, 0.3);
  }
`

const LeaveButton = styled(HeaderButton)`
  background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%);
  color: white;

  &:hover {
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
  }
`

const VideoArea = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  position: relative;
  overflow: auto;

  @media (max-width: 768px) {
    padding: 0.5rem;
  }
`

const ChatPanel = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 300px;
  background: rgba(15, 23, 42, 0.95);
  border-left: 1px solid rgba(30, 64, 175, 0.2);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  transform: translateX(${(props) => (props.isOpen ? '0' : '100%')});
  transition: transform 0.3s ease;
  z-index: 40;

  @media (max-width: 768px) {
    width: 250px;
  }
`

const ChatHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid rgba(30, 64, 175, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    color: white;
    font-size: 1rem;
  }

  button {
    background: none;
    border: none;
    color: #9CA3AF;
    cursor: pointer;
    font-size: 1.2rem;

    &:hover {
      color: white;
    }
  }
`

const ChatMessages = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`

const ChatMessage = styled.div`
  background: rgba(30, 64, 175, 0.1);
  border-left: 3px solid #1E40AF;
  padding: 0.75rem;
  border-radius: 0.25rem;
  color: #E0E7FF;
  font-size: 0.85rem;

  .sender {
    color: #7C3AED;
    font-weight: 600;
    margin-bottom: 0.25rem;
  }

  .message {
    color: #D1D5DB;
  }

  .timestamp {
    color: #6B7280;
    font-size: 0.75rem;
    margin-top: 0.25rem;
  }
`

const ChatInput = styled.div`
  padding: 1rem;
  border-top: 1px solid rgba(30, 64, 175, 0.2);
  display: flex;
  gap: 0.5rem;

  input {
    flex: 1;
    padding: 0.6rem;
    background: rgba(30, 64, 175, 0.1);
    border: 1px solid rgba(30, 64, 175, 0.3);
    color: white;
    border-radius: 0.25rem;
    font-size: 0.85rem;

    &:focus {
      outline: none;
      border-color: #1E40AF;
      box-shadow: 0 0 0 2px rgba(30, 64, 175, 0.1);
    }

    &::placeholder {
      color: #6B7280;
    }
  }

  button {
    padding: 0.6rem 1rem;
    background: linear-gradient(135deg, #1E40AF 0%, #7C3AED 100%);
    color: white;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.85rem;

    &:hover {
      box-shadow: 0 2px 8px rgba(30, 64, 175, 0.3);
    }
  }
`

const LoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(4px);
`

const Spinner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;

  .spinner {
    width: 48px;
    height: 48px;
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
    margin: 0;
  }
`

/**
 * MeetingInterface Component
 * Complete meeting page with video, controls, and chat
 */
export function MeetingInterface() {
  const { account } = useWeb3React()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { getMyProfile } = useCeramic()

  const [roomName, setRoomName] = useState(null)
  const [token, setToken] = useState(null)
  const [userName, setUserName] = useState(null)
  const [showChat, setShowChat] = useState(false)
  const [messages, setMessages] = useState([])
  const [messageInput, setMessageInput] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Initialize meeting from search params
  useEffect(() => {
    if (!account) {
      navigate('/home')
      return
    }

    const initializeMeeting = async () => {
      try {
        setIsLoading(true)

        // Get room name from search params
        const room = searchParams.get('room') || `meeting-${Date.now()}`
        setRoomName(room)

        // Get user profile for display name
        const profile = getMyProfile()
        const name = profile?.name || `User-${account.slice(0, 6)}`
        setUserName(name)

        // In production, get token from backend
        // For MVP, use mock token - CHANGE IN PRODUCTION
        const mockToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJsaXZla2l0In0.mock`
        setToken(mockToken)

        // Add welcome message
        setMessages([
          {
            id: 'welcome',
            sender: 'System',
            message: `${name} joined the meeting`,
            timestamp: new Date(),
            isSystem: true
          }
        ])
      } catch (err) {
        console.error('Failed to initialize meeting:', err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    initializeMeeting()
  }, [account, navigate, searchParams, getMyProfile])

  const handleEndCall = useCallback(() => {
    navigate('/discover')
  }, [navigate])

  const handleChatToggle = useCallback((isOpen) => {
    setShowChat(isOpen)
  }, [])

  const handleSendMessage = useCallback(() => {
    if (!messageInput.trim()) return

    const newMessage = {
      id: Date.now(),
      sender: userName,
      message: messageInput,
      timestamp: new Date(),
      isSystem: false
    }

    setMessages((prev) => [...prev, newMessage])
    setMessageInput('')
  }, [messageInput, userName])

  if (error) {
    return (
      <PageContainer>
        <MeetingHeader>
          <HeaderTitle>
            <h1>Meeting Error</h1>
          </HeaderTitle>
          <HeaderActions>
            <LeaveButton onClick={() => navigate('/discover')}>Back to Discover</LeaveButton>
          </HeaderActions>
        </MeetingHeader>
        <VideoArea>
          <div style={{ color: '#DC2626', textAlign: 'center' }}>
            <h2>Failed to Join Meeting</h2>
            <p>{error}</p>
          </div>
        </VideoArea>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      {isLoading && (
        <LoadingOverlay>
          <Spinner>
            <div className="spinner" />
            <p>Joining meeting...</p>
          </Spinner>
        </LoadingOverlay>
      )}

      <MeetingHeader>
        <HeaderTitle>
          <h1>💳 PayTray Meeting</h1>
          <p>{roomName}</p>
        </HeaderTitle>
        <HeaderActions>
          <SettingsButton onClick={() => setShowChat(!showChat)}>
            {showChat ? 'Hide Chat' : 'Show Chat'}
          </SettingsButton>
          <LeaveButton onClick={handleEndCall}>End Meeting</LeaveButton>
        </HeaderActions>
      </MeetingHeader>

      <VideoArea>
        {token && roomName && userName && (
          <VideoChat
            roomName={roomName}
            userName={userName}
            token={token}
            onError={(err) => setError(err.message || 'Video connection error')}
          />
        )}

        <ChatPanel isOpen={showChat}>
          <ChatHeader>
            <h3>Chat</h3>
            <button onClick={() => setShowChat(false)}>×</button>
          </ChatHeader>
          <ChatMessages>
            {messages.map((msg) => (
              <ChatMessage key={msg.id}>
                <div className="sender">{msg.sender}</div>
                <div className="message">{msg.message}</div>
                <div className="timestamp">{msg.timestamp.toLocaleTimeString()}</div>
              </ChatMessage>
            ))}
          </ChatMessages>
          <ChatInput>
            <input
              type="text"
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button onClick={handleSendMessage}>Send</button>
          </ChatInput>
        </ChatPanel>

        <CallControls
          onEndCall={handleEndCall}
          onChatToggle={handleChatToggle}
          showChat={true}
        />
      </VideoArea>
    </PageContainer>
  )
}

export default MeetingInterface
