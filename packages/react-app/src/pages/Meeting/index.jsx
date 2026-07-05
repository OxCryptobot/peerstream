import React, { useEffect } from 'react'
import styled from 'styled-components'
import { MainHeader } from '../../theme/components'

const MeetingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`

const PlaceholderBox = styled.div`
  text-align: center;
  background: white;
  padding: 3rem;
  border-radius: 10px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
`

const PlaceholderText = styled.p`
  color: #333;
  font-size: 1.1rem;
  margin: 1rem 0;
  max-width: 500px;
`

export function Meeting() {
  useEffect(() => {
    console.log('Meeting page placeholder - Phase 3: Replace peerjs with LiveKit/Daily')
  }, [])

  return (
    <MeetingContainer>
      <PlaceholderBox>
        <MainHeader>Video Meeting (Phase 3)</MainHeader>
        <PlaceholderText>
          This feature is under development as part of Phase 3 of the modernization.
          It will be replaced with LiveKit, Daily, or another WebRTC service.
        </PlaceholderText>
        <PlaceholderText style={{ fontSize: '0.9rem', fontStyle: 'italic', color: '#666' }}>
          The PeerJS integration has been removed. Coming after Phase 3.
        </PlaceholderText>
      </PlaceholderBox>
    </MeetingContainer>
  )
}
