import React from 'react'
import styled from 'styled-components'
import { useChain } from '../../hooks/useChain'

const IndicatorContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: linear-gradient(135deg, rgba(30, 64, 175, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%);
  border: 1px solid rgba(30, 64, 175, 0.3);
  border-radius: 0.5rem;
  font-size: 0.85rem;
  font-weight: 500;

  @media (max-width: 768px) {
    padding: 0.4rem 0.6rem;
    font-size: 0.75rem;
  }
`

const ChainIcon = styled.span`
  font-size: 1.2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  animation: ${(props) =>
    props.isTestnet
      ? `pulse 2s infinite`
      : `none`};

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`

const ChainName = styled.span`
  color: #E0E7FF;
  font-weight: 600;

  @media (max-width: 768px) {
    display: none;
  }
`

const TestnetBadge = styled.span`
  background: linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%);
  color: #78350F;
  padding: 0.2rem 0.5rem;
  border-radius: 2rem;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  @media (max-width: 768px) {
    display: none;
  }
`

const TooltipContainer = styled.div`
  position: relative;
  display: inline-block;
  width: 100%;

  &:hover .tooltip {
    visibility: visible;
    opacity: 1;
  }
`

const Tooltip = styled.div`
  visibility: hidden;
  opacity: 0;
  background-color: #1F2937;
  color: #F3F4F6;
  text-align: center;
  padding: 0.5rem;
  border-radius: 0.25rem;
  position: absolute;
  z-index: 1;
  bottom: 125%;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  font-size: 0.75rem;
  border: 1px solid rgba(30, 64, 175, 0.3);
  transition: opacity 0.3s ease;
  pointer-events: none;

  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: #1F2937 transparent transparent transparent;
  }
`

/**
 * ChainIndicator Component
 * Displays the currently selected blockchain
 *
 * Props:
 *   - showLabel (boolean): Show chain name label
 *   - showTestnetBadge (boolean): Show testnet indicator
 *   - compact (boolean): Compact mode for headers
 */
export default function ChainIndicator({ showLabel = true, showTestnetBadge = true, compact = false }) {
  const { currentChain, isTestnet: isCurrentChainTestnet } = useChain()

  if (!currentChain) {
    return null
  }

  const chainIsTestnet = isCurrentChainTestnet()

  if (compact) {
    return (
      <IndicatorContainer>
        <ChainIcon isTestnet={chainIsTestnet}>{currentChain.icon}</ChainIcon>
      </IndicatorContainer>
    )
  }

  return (
    <TooltipContainer>
      <IndicatorContainer>
        <ChainIcon isTestnet={chainIsTestnet}>{currentChain.icon}</ChainIcon>
        {showLabel && <ChainName>{currentChain.name}</ChainName>}
        {showTestnetBadge && chainIsTestnet && <TestnetBadge>Testnet</TestnetBadge>}
      </IndicatorContainer>
      <Tooltip className="tooltip">
        {currentChain.name} • {currentChain.symbol}
        {chainIsTestnet ? ' (Testnet)' : ''}
      </Tooltip>
    </TooltipContainer>
  )
}
