import React from 'react'
import styled from 'styled-components'
import HeaderNavigation from '../HeaderNavigation'
import NetworkSwitcher from '../NetworkSwitcher'
import ChainIndicator from '../ChainIndicator'
import { ExternalLink } from '../../theme'
import Web3Status from '../Web3Status'

const HeaderFrame = styled.div`
  display: flex;
  width: 100vw;
  height: 70px;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #FFFFFF 0%, #F3F4F6 100%);
  border-bottom: 2px solid #E5E7EB;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  padding: 0 1.5rem;
`

const HeaderElement = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 2rem;
`

const LogoIcon = styled.span`
  font-size: 1.8rem;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
`

const Title = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  
  #link {
    text-decoration: none;
    color: #1E40AF;
    transition: all 0.3s ease;
    &:hover {
      color: #7C3AED;
    }
  }
  
  #title {
    display: inline;
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
    color: #1E40AF;
    background: linear-gradient(135deg, #1E40AF 0%, #7C3AED 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.5px;
  }
  
  #navigation {
    display: inline;
    font-size: 1rem;
    font-weight: 500;
    color: #6B7280;
    transition: color 0.3s ease;
    &:hover {
      color: #1E40AF;
    }
  }
`

export default function Header() {
  return (
    <HeaderFrame>
      <HeaderElement>
        <Title>
          <LogoIcon>💳</LogoIcon>
          <ExternalLink id="link" href="/">
            <h1 id="title">PayTray</h1>
          </ExternalLink>
          <HeaderNavigation />
        </Title>
      </HeaderElement>
      <HeaderElement>
        <ChainIndicator compact={true} />
        <NetworkSwitcher compact={false} />
        <Web3Status />
      </HeaderElement>
    </HeaderFrame>
  )
}