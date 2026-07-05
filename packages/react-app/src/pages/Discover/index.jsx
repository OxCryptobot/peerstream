import React from 'react'
import { useWeb3React } from '@web3-react/core'
import styled from 'styled-components'
import { usePeerList } from '../../hooks/useCeramicProfile'
import PeerCard from '../../components/PeerCard'

const DiscoverContainer = styled.div`
  position: relative;
  width: 100%;
  min-height: 100vh;
  padding: 2rem;
  background: #f9f8eb;
  display: flex;
  flex-direction: column;
  gap: 2rem;
`

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const Title = styled.h1`
  font-size: 2.5rem;
  margin: 0;
  color: ${({ theme }) => theme.primaryGreen};
`

const Subtitle = styled.p`
  font-size: 1.1rem;
  margin: 0;
  color: #666;
`

const PeerGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
  width: 100%;
`

const LoadingMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  font-size: 1.2rem;
  color: #666;
`

const ErrorMessage = styled.div`
  background-color: #fee;
  border: 1px solid #faa;
  color: #a00;
  padding: 1.5rem;
  border-radius: 0.5rem;
  margin: 1rem 0;
`

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1rem;
  text-align: center;
`

const EmptyStateIcon = styled.div`
  font-size: 4rem;
  opacity: 0.5;
`

const EmptyStateText = styled.p`
  font-size: 1.2rem;
  color: #666;
  max-width: 500px;
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
