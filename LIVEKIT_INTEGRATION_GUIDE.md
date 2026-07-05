# Phase 3b: LiveKit Integration Implementation Guide

## Objective
Replace PeerJS with LiveKit for peer-to-peer WebRTC video calling on the Meeting page.

## Why LiveKit?
- ✅ SFU (Selective Forwarding Unit) architecture - better scaling than peer-to-peer
- ✅ Built-in recording, transcription, and analytics
- ✅ Modern React integration with @livekit/react
- ✅ Production-ready with managed hosting option
- ✅ Excellent documentation and community support

## Current State
- **PeerJS Status**: Deprecated, not maintained
- **Meeting Page**: Shows placeholder UI
- **Challenge**: Need WebRTC infrastructure + token generation backend

## Phase 3b Implementation Plan

### Prerequisites
- ✅ Phase 3a (Ceramic integration) completed
- ⏳ Backend server for token generation (Node.js + Express)
- ⏳ LiveKit server (cloud or self-hosted)

### Step 1: Install Dependencies
```bash
# Frontend
npm install --save livekit-client
npm install --save @livekit/react
npm install --save @livekit/components-react

# Backend (if self-hosting)
npm install --save livekit
npm install --save livekit-server-sdk
```

### Step 2: Backend Token Generation Endpoint
Create: `backend/routes/livekit.js` (or equivalent in your backend)

```javascript
import { AccessToken } from 'livekit-server-sdk';
import express from 'express';

const router = express.Router();

// Validate that user owns the wallet they're claiming
async function validateWalletOwnership(address, signature, message) {
  // Verify signature matches address
  const recoveredAddress = ethers.verifyMessage(message, signature);
  return recoveredAddress.toLowerCase() === address.toLowerCase();
}

// POST /api/livekit/token
router.post('/token', async (req, res) => {
  try {
    const { roomName, userName, walletAddress, signature, message } = req.body;

    // Validate wallet ownership
    const isValid = await validateWalletOwnership(walletAddress, signature, message);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid wallet signature' });
    }

    // Validate room and user names
    if (!roomName || !userName) {
      return res.status(400).json({ error: 'Missing roomName or userName' });
    }

    // Generate token
    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET
    );

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
      canPublishSources: ['screen_share'],
      canUpdateOwnMetadata: true,
      metadata: JSON.stringify({
        walletAddress,
        joinedAt: new Date().toISOString()
      })
    });

    const token = at.toJwt();

    res.json({
      token,
      url: process.env.LIVEKIT_URL,
      room: roomName
    });
  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/livekit/rooms
router.get('/rooms', async (req, res) => {
  try {
    const accessToken = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET
    );

    // List active rooms (requires admin permission)
    const roomList = await rpc.ListRooms({});
    res.json(roomList.rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

### Step 3: Create LiveKit Context
Create: `src/contexts/LiveKit.jsx`

```jsx
import React, { createContext, useContext, useState, useCallback } from 'react'
import { useWeb3React } from '@web3-react/core'
import { ethers } from 'ethers'

const LiveKitContext = createContext(null)

export function LiveKitProvider({ children }) {
  const { account, library } = useWeb3React()
  const [liveKitUrl] = useState(import.meta.env.VITE_LIVEKIT_URL)
  const [error, setError] = useState(null)

  const getToken = useCallback(
    async (roomName, userName) => {
      try {
        if (!account || !library) {
          throw new Error('Wallet not connected')
        }

        // Create signature for authentication
        const message = `Join LiveKit room: ${roomName} at ${new Date().toISOString()}`
        const signer = library.getSigner()
        const signature = await signer.signMessage(message)

        // Request token from backend
        const response = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomName,
            userName: userName || account.slice(0, 6),
            walletAddress: account,
            signature,
            message
          })
        })

        if (!response.ok) {
          throw new Error('Failed to get LiveKit token')
        }

        const data = await response.json()
        return data
      } catch (err) {
        console.error('Token generation error:', err)
        setError(err.message)
        throw err
      }
    },
    [account, library]
  )

  return (
    <LiveKitContext.Provider value={{ liveKitUrl, getToken, error }}>
      {children}
    </LiveKitContext.Provider>
  )
}

export function useLiveKit() {
  const context = useContext(LiveKitContext)
  if (!context) {
    throw new Error('useLiveKit must be used within LiveKitProvider')
  }
  return context
}
```

### Step 4: Create Video Conference Component
Create: `src/components/VideoConference/index.jsx`

```jsx
import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import {
  LiveKitRoom,
  VideoConference,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar
} from '@livekit/react'
import { Track } from 'livekit-client'
import { useLiveKit } from '../../contexts/LiveKit'

const ConferenceContainer = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #1a1a1a;
`

const RoomInfo = styled.div`
  background-color: ${({ theme }) => theme.primaryGreen};
  color: white;
  padding: 1rem;
  text-align: center;
  font-weight: bold;
`

const VideoArea = styled.div`
  flex: 1;
  width: 100%;
  overflow: hidden;
`

const ErrorContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: #1a1a1a;
  color: #ff6b6b;
  font-size: 1.2rem;
  text-align: center;
  padding: 2rem;
`

export default function VideoConferenceComponent({ roomName, userName }) {
  const { liveKitUrl, getToken, error: liveKitError } = useLiveKit()
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!roomName || !userName) {
      setError('Room name and user name required')
      setLoading(false)
      return
    }

    const fetchToken = async () => {
      try {
        setLoading(true)
        const tokenData = await getToken(roomName, userName)
        setToken(tokenData.token)
      } catch (err) {
        setError(err.message || 'Failed to get conference token')
      } finally {
        setLoading(false)
      }
    }

    fetchToken()
  }, [roomName, userName, getToken])

  if (loading) {
    return (
      <ErrorContainer>
        <div>Initializing video conference...</div>
      </ErrorContainer>
    )
  }

  if (error || liveKitError) {
    return (
      <ErrorContainer>
        <div>
          <strong>Error:</strong> {error || liveKitError}
        </div>
      </ErrorContainer>
    )
  }

  if (!token || !liveKitUrl) {
    return (
      <ErrorContainer>
        <div>Video conference not properly configured</div>
      </ErrorContainer>
    )
  }

  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={liveKitUrl}
      data-lk-theme="dark"
      style={{ height: '100vh' }}
    >
      <VideoConference />
      <RoomAudioRenderer />
      <ControlBar />
    </LiveKitRoom>
  )
}
```

### Step 5: Update Meeting Page
File: `src/pages/Meeting/index.jsx`

```jsx
import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useParams, useNavigate } from 'react-router-dom'
import { useWeb3React } from '@web3-react/core'
import VideoConferenceComponent from '../../components/VideoConference'

const MeetingContainer = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
`

const Header = styled.div`
  background-color: ${({ theme }) => theme.primaryGreen};
  color: white;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 10;
`

const Title = styled.h1`
  margin: 0;
  font-size: 1.3rem;
`

const Controls = styled.div`
  display: flex;
  gap: 1rem;
`

const Button = styled.button`
  background-color: white;
  color: ${({ theme }) => theme.primaryGreen};
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-weight: bold;

  &:hover {
    opacity: 0.8;
  }
`

const ErrorContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: #1a1a1a;
  color: #ff6b6b;
  font-size: 1.2rem;
`

export default function Meeting() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { account } = useWeb3React()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Validate room and user before joining
    if (!roomId) {
      return
    }
    if (!account) {
      navigate('/') // Redirect to home if not connected
      return
    }
    setIsReady(true)
  }, [roomId, account, navigate])

  const handleLeave = () => {
    navigate('/')
  }

  if (!isReady) {
    return (
      <MeetingContainer>
        <ErrorContainer>
          Loading conference...
        </ErrorContainer>
      </MeetingContainer>
    )
  }

  const roomName = roomId || `room-${Date.now()}`
  const userName = account ? account.slice(0, 8) : 'Guest'

  return (
    <MeetingContainer>
      <Header>
        <Title>Video Conference - {roomName}</Title>
        <Controls>
          <Button onClick={handleLeave}>Leave Meeting</Button>
        </Controls>
      </Header>
      <VideoConferenceComponent 
        roomName={roomName}
        userName={userName}
      />
    </MeetingContainer>
  )
}
```

### Step 6: Add Meeting Link Generation
Update: `src/pages/Discover/index.jsx`

Add a button to initiate meeting with a peer:

```jsx
import { useNavigate } from 'react-router-dom'

export default function Discover() {
  const navigate = useNavigate()
  
  const handleStartMeeting = (peerAddress) => {
    const roomName = `peer-${Math.random().toString(36).substr(2, 9)}`
    navigate(`/meeting/${roomName}`, { state: { peerAddress } })
  }

  // In PeerCard:
  return (
    <PeerCard
      peer={peer}
      onStartMeeting={() => handleStartMeeting(peer.address)}
    />
  )
}
```

## Configuration Setup

### 1. Development: LiveKit Cloud
```bash
# Sign up at https://livekit.io/
# Create project and copy credentials

# Add to .env.local
VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
```

### 2. Backend Environment
```bash
# .env (backend)
LIVEKIT_API_KEY=your_api_key_from_livekit
LIVEKIT_API_SECRET=your_api_secret_from_livekit
LIVEKIT_URL=wss://your-project.livekit.cloud
```

### 3. Update Context Providers
File: `src/index.jsx`

```jsx
import { LiveKitProvider } from './contexts/LiveKit'

export function ContextProviders({ children }) {
  return (
    <Web3ReactProvider>
      <ApolloProvider client={client}>
        <ThemeProvider theme={theme}>
          <TokensProvider>
            <ApplicationProvider>
              <CeramicProvider>
                <LiveKitProvider>
                  {children}
                </LiveKitProvider>
              </CeramicProvider>
            </ApplicationProvider>
          </TokensProvider>
        </ThemeProvider>
      </ApolloProvider>
    </Web3ReactProvider>
  )
}
```

## Testing & Validation

### Local Testing
1. Set up backend with token endpoint
2. Configure LiveKit credentials
3. Start dev server
4. Connect wallet
5. Navigate to Discover page
6. Click "Start Meeting" on a peer card
7. Should join video conference

### Test Scenarios
- Single user joins room
- Two users join same room (video/audio sync)
- Screen sharing (if enabled)
- Network disconnection recovery
- Room persistence and cleanup

### Debug Commands
```javascript
// Browser console
import { useRoomContext } from '@livekit/react'

const room = useRoomContext()
console.log('Room state:', room)
console.log('Participants:', room.participants)
console.log('Local participant:', room.localParticipant)
```

## Success Criteria ✅

- [ ] Token generation endpoint working
- [ ] Frontend can authenticate with LiveKit
- [ ] Video conference UI displays
- [ ] Video/audio streams transmit
- [ ] Multiple participants can join
- [ ] Screen sharing works (optional)
- [ ] Connection cleanup on leave
- [ ] No console errors

## Performance Considerations

1. **Bandwidth**: LiveKit SFU reduces bandwidth vs peer-to-peer
2. **Latency**: Typically 100-300ms with proper server placement
3. **Recording**: Enable in LiveKit dashboard for session recording
4. **Analytics**: Track meeting duration, participant count, quality

## Deployment Notes

### Production Setup
1. Deploy backend token endpoint
2. Set up LiveKit server (cloud recommended)
3. Configure SSL certificates
4. Set up CORS properly
5. Monitor server usage and costs

### Cost Management
- LiveKit Cloud: $0.01 per compute unit (CU) per hour
- Typical meeting: 1-3 CUs depending on quality
- Recording: Additional 1 CU per concurrent recording

## Troubleshooting

### Token generation fails
- Verify backend endpoint is accessible
- Check wallet signature validation
- Ensure CORS headers are set

### Video doesn't appear
- Check camera/microphone permissions in browser
- Verify LiveKit server URL is correct
- Check browser console for errors
- Try different browser

### Audio echo or quality issues
- Adjust codec settings in LiveKit
- Check network bandwidth
- Try lower resolution/framerate

---

## Resources
- LiveKit Docs: https://docs.livekit.io/
- LiveKit React: https://docs.livekit.io/reference/rooms-and-participants
- AccessToken: https://docs.livekit.io/reference/server-apis/access-tokens/
- Components: https://docs.livekit.io/reference/components/
