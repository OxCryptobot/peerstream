import React, { useState, useRef, useEffect } from 'react'
import styled from 'styled-components'
import { useChain } from '../../hooks/useChain'

const SwitcherContainer = styled.div`
  position: relative;
  display: inline-block;
`

const SwitcherButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background: linear-gradient(135deg, rgba(30, 64, 175, 0.15) 0%, rgba(124, 58, 237, 0.15) 100%);
  border: 1px solid rgba(30, 64, 175, 0.3);
  border-radius: 0.5rem;
  color: #E0E7FF;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: linear-gradient(135deg, rgba(30, 64, 175, 0.25) 0%, rgba(124, 58, 237, 0.25) 100%);
    border-color: rgba(30, 64, 175, 0.5);
  }

  &:active {
    transform: scale(0.98);
  }

  @media (max-width: 768px) {
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
  }
`

const ChainIcon = styled.span`
  font-size: 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`

const ChainLabel = styled.span`
  @media (max-width: 640px) {
    display: none;
  }
`

const DropdownIcon = styled.span`
  font-size: 0.8rem;
  transition: transform 0.2s ease;
  transform: ${(props) => (props.isOpen ? 'rotate(180deg)' : 'rotate(0)')};
`

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(30, 64, 175, 0.3);
  border-radius: 0.5rem;
  backdrop-filter: blur(10px);
  z-index: 1000;
  min-width: 280px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  animation: slideDown 0.2s ease-out;

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 768px) {
    min-width: 250px;
    right: auto;
    left: 0;
  }
`

const DropdownHeader = styled.div`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(30, 64, 175, 0.2);
  font-size: 0.85rem;
  font-weight: 600;
  color: #9CA3AF;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const NetworkGroup = styled.div`
  padding: 0.5rem 0;
`

const NetworkGroupLabel = styled.div`
  padding: 0.5rem 1rem 0.25rem;
  font-size: 0.75rem;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
`

const NetworkOption = styled.button`
  width: 100%;
  padding: 0.75rem 1rem;
  background: ${(props) =>
    props.isActive
      ? 'linear-gradient(135deg, rgba(30, 64, 175, 0.2) 0%, rgba(124, 58, 237, 0.2) 100%)'
      : 'transparent'};
  border: none;
  border-left: 3px solid ${(props) => (props.isActive ? '#1E40AF' : 'transparent')};
  color: ${(props) => (props.isActive ? '#E0E7FF' : '#9CA3AF')};
  font-size: 0.9rem;
  cursor: pointer;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.2s ease;

  &:hover {
    background: linear-gradient(135deg, rgba(30, 64, 175, 0.15) 0%, rgba(124, 58, 237, 0.15) 100%);
    color: #E0E7FF;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const NetworkIcon = styled.span`
  font-size: 1.1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
`

const NetworkInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  flex: 1;
  min-width: 0;
`

const NetworkName = styled.span`
  font-weight: 600;
  font-size: 0.9rem;
`

const NetworkSymbol = styled.span`
  font-size: 0.75rem;
  color: #6B7280;
`

const TestnetIndicator = styled.span`
  background: linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%);
  color: #78350F;
  padding: 0.15rem 0.4rem;
  border-radius: 2rem;
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
`

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(30, 64, 175, 0.3);
  border-top: 2px solid #1E40AF;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`

/**
 * NetworkSwitcher Component
 * Dropdown to select different blockchain networks
 *
 * Props:
 *   - includeTestnets (boolean): Show testnet networks
 *   - compact (boolean): Compact mode
 */
export default function NetworkSwitcher({ includeTestnets = true, compact = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)
  const { chainId, currentChain, switchChain, isLoading, getAvailableNetworks, isTestnet } = useChain()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNetworkSelect = async (newChainId) => {
    if (isLoading) return
    await switchChain(newChainId)
    setIsOpen(false)
  }

  const networks = getAvailableNetworks(includeTestnets)
  const testnets = networks.filter((n) => n.isTestnet)
  const mainnets = networks.filter((n) => !n.isTestnet)

  if (compact || !currentChain) {
    return (
      <SwitcherContainer ref={containerRef}>
        <SwitcherButton onClick={() => setIsOpen(!isOpen)} disabled={isLoading}>
          <ChainIcon>{currentChain?.icon}</ChainIcon>
          <DropdownIcon isOpen={isOpen}>▼</DropdownIcon>
        </SwitcherButton>
      </SwitcherContainer>
    )
  }

  return (
    <SwitcherContainer ref={containerRef}>
      <SwitcherButton onClick={() => setIsOpen(!isOpen)} disabled={isLoading}>
        <ChainIcon>{currentChain.icon}</ChainIcon>
        <ChainLabel>{currentChain.name}</ChainLabel>
        {isLoading && <LoadingSpinner />}
        {!isLoading && <DropdownIcon isOpen={isOpen}>▼</DropdownIcon>}
      </SwitcherButton>

      {isOpen && (
        <DropdownMenu>
          <DropdownHeader>Select Network</DropdownHeader>

          {mainnets.length > 0 && (
            <NetworkGroup>
              {mainnets.length > 1 && <NetworkGroupLabel>Mainnet</NetworkGroupLabel>}
              {mainnets.map((network) => (
                <NetworkOption
                  key={network.id}
                  isActive={chainId === network.id}
                  onClick={() => handleNetworkSelect(network.id)}
                  disabled={isLoading || chainId === network.id}
                >
                  <NetworkIcon>{network.icon}</NetworkIcon>
                  <NetworkInfo>
                    <NetworkName>{network.name}</NetworkName>
                    <NetworkSymbol>{network.symbol}</NetworkSymbol>
                  </NetworkInfo>
                </NetworkOption>
              ))}
            </NetworkGroup>
          )}

          {testnets.length > 0 && (
            <NetworkGroup>
              <NetworkGroupLabel>Testnet</NetworkGroupLabel>
              {testnets.map((network) => (
                <NetworkOption
                  key={network.id}
                  isActive={chainId === network.id}
                  onClick={() => handleNetworkSelect(network.id)}
                  disabled={isLoading || chainId === network.id}
                >
                  <NetworkIcon>{network.icon}</NetworkIcon>
                  <NetworkInfo>
                    <NetworkName>{network.name}</NetworkName>
                    <NetworkSymbol>{network.symbol}</NetworkSymbol>
                  </NetworkInfo>
                  <TestnetIndicator>Test</TestnetIndicator>
                </NetworkOption>
              ))}
            </NetworkGroup>
          )}
        </DropdownMenu>
      )}
    </SwitcherContainer>
  )
}
