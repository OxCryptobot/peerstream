import React, { useState } from 'react'
import styled from 'styled-components'
import { useMultiWallet, useWalletInfo } from '../../contexts/MultiWallet'
import WalletSelector from '../WalletSelector'

const Web3StatusDiv = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
`

const StatusButton = styled.button`
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Inter', sans-serif;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;

  ${(props) =>
    props.isConnected
      ? `
    background: linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%);
    color: white;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(124, 58, 237, 0.3);
    }
  `
      : `
    background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%);
    color: white;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(30, 64, 175, 0.3);
    }
  `};
`

const WalletIcon = styled.span`
  font-size: 16px;
`

const ChainBadge = styled.span`
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
`

const Dropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  min-width: 250px;
  overflow: hidden;
  z-index: 50;
  margin-top: 8px;
  border: 1px solid #e5e7eb;
`

const DropdownItem = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 13px;
  color: #1f2937;

  &:last-child {
    border-bottom: none;
  }

  strong {
    color: #111827;
    font-weight: 600;
  }
`

const DropdownButton = styled.button`
  width: 100%;
  padding: 12px 16px;
  background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%);
  color: white;
  border: none;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.9;
  }
`

const LoadingSpinner = styled.span`
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`

/**
 * Web3Status Component
 * Display wallet connection status and provide connection options
 */
export default function Web3Status() {
  const {
    account,
    chainId,
    isConnected,
    isConnecting,
    disconnectWallet,
    walletType
  } = useMultiWallet()

  const walletInfo = useWalletInfo()
  const [isOpen, setIsOpen] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const formatAddress = (addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const getChainName = (id) => {
    const chains = {
      1: 'Ethereum',
      11155111: 'Sepolia',
      42161: 'Arbitrum',
      10: 'Optimism',
      5: 'Goerli'
    }
    return chains[id] || `Chain ${id}`
  }

  if (isConnecting && !isConnected) {
    return (
      <StatusButton isConnected={false} disabled>
        <LoadingSpinner />
        <span>Connecting...</span>
      </StatusButton>
    )
  }

  return (
    <>
      <Web3StatusDiv>
        {isConnected ? (
          <div style={{ position: 'relative' }}>
            <StatusButton
              isConnected={true}
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <WalletIcon>{walletInfo?.icon}</WalletIcon>
              <span>{formatAddress(account)}</span>
              {chainId && <ChainBadge>{getChainName(chainId)}</ChainBadge>}
            </StatusButton>

            {showDropdown && (
              <Dropdown>
                <DropdownItem>
                  <strong>Wallet</strong>
                </DropdownItem>
                <DropdownItem>{walletInfo?.name || 'Unknown'}</DropdownItem>

                <DropdownItem>
                  <strong>Address</strong>
                </DropdownItem>
                <DropdownItem>{formatAddress(account)}</DropdownItem>

                <DropdownItem>
                  <strong>Network</strong>
                </DropdownItem>
                <DropdownItem>{getChainName(chainId)}</DropdownItem>

                <DropdownButton
                  onClick={() => {
                    disconnectWallet()
                    setShowDropdown(false)
                  }}
                >
                  Disconnect Wallet
                </DropdownButton>
              </Dropdown>
            )}
          </div>
        ) : (
          <StatusButton
            isConnected={false}
            onClick={() => setIsOpen(true)}
          >
            <WalletIcon>🔐</WalletIcon>
            <span>Connect Wallet</span>
          </StatusButton>
        )}
      </Web3StatusDiv>

      <WalletSelector isOpen={isOpen} onClose={() => setIsOpen(false)} />

      {showDropdown && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 40
          }}
          onClick={() => setShowDropdown(false)}
        />
      )}
    </>
  )
}