import React from 'react'
import { useWeb3React } from '@web3-react/core'
import styled from 'styled-components'
import { usePeerList } from '../../hooks/useCeramicProfile'
import PeerCard from '../../components/PeerCard'

const DiscoverContainer = styled.div`
  position: relative;
  width: 100%;
  min-height: 100vh;
  padding: 3rem 2rem;
  background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%);
  display: flex;
  flex-direction: column;
  gap: 3rem;
`

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 600px;
`

const Title = styled.h1`
  font-size: 2.75rem;
  margin: 0;
  color: #1F2937;
  font-weight: 800;
  letter-spacing: -1px;
  background: linear-gradient(135deg, #1E40AF 0%, #7C3AED 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`

const Subtitle = styled.p`
  font-size: 1.15rem;
  margin: 0;
  color: #6B7280;
  font-weight: 500;
`

const PeerGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2.5rem;
  width: 100%;
`

const LoadingMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  font-size: 1.1rem;
  color: #6B7280;
  font-weight: 500;
`

const ErrorMessage = styled.div`
  background: linear-gradient(135deg, #FEE2E2 0%, #FCE7F3 100%);
  border: 1px solid #FECACA;
  color: #7F1D1D;
  padding: 1.5rem;
  border-radius: 0.75rem;
  margin: 1rem 0;
  font-weight: 500;
`

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1.5rem;
  text-align: center;
`

const EmptyStateIcon = styled.div`
  font-size: 5rem;
  opacity: 0.3;
  animation: float 3s ease-in-out infinite;
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
`

const EmptyStateText = styled.p`
  font-size: 1.15rem;
  color: #6B7280;
  max-width: 500px;
  font-weight: 500;
`

export function Discover() {
  const { account } = useWeb3React()
  const { peers, loading, error } = usePeerList()

  if (error) {
    return (
      <DiscoverContainer>
        <Header>
          <Title>Discover Experts</Title>
          <Subtitle>Find peers to collaborate with</Subtitle>
        </Header>
        <ErrorMessage>
          <strong>Error loading peers:</strong> {error}
        </ErrorMessage>
      </DiscoverContainer>
    )
  }

  if (loading) {
    return (
      <DiscoverContainer>
        <Header>
          <Title>Discover Experts</Title>
          <Subtitle>Find peers to collaborate with</Subtitle>
        </Header>
        <LoadingMessage>Loading peer profiles...</LoadingMessage>
      </DiscoverContainer>
    )
  }

  return (
    <DiscoverContainer>
      <Header>
        <Title>Discover Experts</Title>
        <Subtitle>Find peers to collaborate with on your next project</Subtitle>
      </Header>

      {peers.length === 0 ? (
        <EmptyState>
          <EmptyStateIcon>👥</EmptyStateIcon>
          <EmptyStateText>
            {account
              ? 'No experts discovered yet. Create your profile to be discovered!'
              : 'Connect your wallet to see expert profiles'}
          </EmptyStateText>
        </EmptyState>
      ) : (
        <PeerGrid>
          {peers.map((peer) => (
            <PeerCard key={peer.address} peer={peer} />
          ))}
        </PeerGrid>
      )}
    </DiscoverContainer>
  )
}
