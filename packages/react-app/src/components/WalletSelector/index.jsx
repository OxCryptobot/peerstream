import React, { useState } from 'react'
import styled from 'styled-components'
import { useMultiWallet, WALLET_INFO, WALLET_TYPES } from '../../contexts/MultiWallet'

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-in;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`

const ModalContent = styled.div`
  background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%);
  border-radius: 24px;
  padding: 40px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
    animation: pulse 4s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }
`

const Header = styled.div`
  position: relative;
  z-index: 1;
  text-align: center;
  margin-bottom: 32px;

  h2 {
    font-size: 28px;
    font-weight: 700;
    color: white;
    margin: 0 0 8px 0;
  }

  p {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
    margin: 0;
  }
`

const WalletGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  position: relative;
  z-index: 1;
  margin-bottom: 24px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`

const WalletButton = styled.button`
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid transparent;
  border-radius: 16px;
  padding: 24px 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  font-family: 'Inter', sans-serif;

  &:hover:not(:disabled) {
    background: white;
    border-color: #06b6d4;
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .icon {
    font-size: 32px;
  }

  .name {
    font-size: 14px;
    font-weight: 600;
    color: #1e40af;
  }

  .description {
    font-size: 11px;
    color: #6b7280;
    text-align: center;
    line-height: 1.3;
  }
`

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 10;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: rotate(90deg);
  }
`

const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid #ef4444;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
  color: white;
  font-size: 13px;
  position: relative;
  z-index: 1;
  word-break: break-word;
`

const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
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
 * Multi-Wallet Selector Component
 * Beautiful UI for selecting and connecting to different wallets
 */
export default function WalletSelector({ isOpen, onClose }) {
  const {
    connectMetaMask,
    connectWalletConnect,
    connectInjected,
    isConnecting,
    error,
    isMetaMaskInstalled
  } = useMultiWallet()

  const [localError, setLocalError] = useState(null)

  const handleConnect = async (connectFn) => {
    setLocalError(null)
    try {
      await connectFn()
      onClose?.()
    } catch (err) {
      setLocalError(err.message)
    }
  }

  if (!isOpen) return null

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>×</CloseButton>

        <Header>
          <h2>Connect Wallet</h2>
          <p>Choose your preferred wallet to connect to PayTray</p>
        </Header>

        {(error || localError) && (
          <ErrorMessage>{error || localError}</ErrorMessage>
        )}

        <WalletGrid>
          {/* MetaMask */}
          <WalletButton
            onClick={() => handleConnect(connectMetaMask)}
            disabled={!isMetaMaskInstalled() || isConnecting}
            title={!isMetaMaskInstalled() ? 'MetaMask not installed' : ''}
          >
            <div className="icon">🦊</div>
            <div className="name">MetaMask</div>
            <div className="description">
              {isConnecting ? 'Connecting...' : 'Browser extension wallet'}
            </div>
          </WalletButton>

          {/* WalletConnect */}
          <WalletButton
            onClick={() => handleConnect(connectWalletConnect)}
            disabled={isConnecting}
          >
            <div className="icon">🔗</div>
            <div className="name">WalletConnect</div>
            <div className="description">
              {isConnecting ? 'Connecting...' : 'Scan QR code to connect'}
            </div>
          </WalletButton>

          {/* Injected Wallet */}
          <WalletButton
            onClick={() => handleConnect(connectInjected)}
            disabled={isConnecting}
          >
            <div className="icon">💼</div>
            <div className="name">Other Wallet</div>
            <div className="description">
              {isConnecting ? 'Connecting...' : 'Any injected provider'}
            </div>
          </WalletButton>

          {/* Coinbase (placeholder for future) */}
          <WalletButton disabled={true} title="Coming soon">
            <div className="icon">💙</div>
            <div className="name">Coinbase</div>
            <div className="description">Coming soon</div>
          </WalletButton>
        </WalletGrid>

        {isConnecting && (
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <LoadingSpinner style={{ margin: '0 auto' }} />
            <p style={{ color: 'white', marginTop: '12px', fontSize: '14px' }}>
              Waiting for wallet confirmation...
            </p>
          </div>
        )}
      </ModalContent>
    </ModalOverlay>
  )
}
