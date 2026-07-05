import React, { useEffect } from 'react'
import { useWeb3React } from '@web3-react/core'
import styled from 'styled-components'
import { useAlert } from 'react-alert'
import { MainHeader } from '../../theme/components'

const DiscoverContainer = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
  padding: 20px;
  overflow-y: scroll;
  background: #F9F8EB;
  display: flex;
  align-items: center;
  justify-content: center;
`

const PlaceholderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 2rem;
  text-align: center;
`

const PlaceholderText = styled.p`
  color: #333;
  font-size: 1.2rem;
  max-width: 600px;
`

export function Discover() {
  const { library, account } = useWeb3React()
  const alert = useAlert()

  useEffect(() => {
    console.log('Discover page placeholder - Phase 3: Replace 3box functionality')
  }, [])

  return (
    <DiscoverContainer>
      <PlaceholderContainer>
        <MainHeader>Discover (Phase 3)</MainHeader>
        <PlaceholderText>
          This feature is under development as part of Phase 3 of the modernization.
          It will be replaced with Ceramic/IDX or a wallet-based discovery system.
        </PlaceholderText>
        <PlaceholderText style={{ fontSize: '0.9rem', fontStyle: 'italic', color: '#666' }}>
          The 3Box integration has been removed. Coming after Phase 3.
        </PlaceholderText>
      </PlaceholderContainer>
    </DiscoverContainer>
  )
}
