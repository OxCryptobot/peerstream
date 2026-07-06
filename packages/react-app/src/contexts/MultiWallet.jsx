import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'
import { BrowserProvider } from 'ethers'
import EthereumProvider from '@walletconnect/ethereum-provider'

/**
 * Multi-Wallet Context
 * Supports: MetaMask, WalletConnect, and other EIP-1193 compliant wallets
 */
const MultiWalletContext = createContext()

export const WALLET_TYPES = {
  METAMASK: 'metaMask',
  WALLET_CONNECT: 'walletConnect',
  COINBASE: 'coinbase',
  INJECTED: 'injected',
  NONE: null
}

export const WALLET_INFO = {
  [WALLET_TYPES.METAMASK]: {
    name: 'MetaMask',
    icon: '🦊',
    description: 'Connect with MetaMask wallet',
    supported: true
  },
  [WALLET_TYPES.WALLET_CONNECT]: {
    name: 'WalletConnect',
    icon: '🔗',
    description: 'Connect with any WalletConnect compatible wallet',
    supported: true
  },
  [WALLET_TYPES.COINBASE]: {
    name: 'Coinbase Wallet',
    icon: '💙',
    description: 'Connect with Coinbase Wallet',
    supported: true
  },
  [WALLET_TYPES.INJECTED]: {
    name: 'Injected Wallet',
    icon: '💼',
    description: 'Connect with injected wallet provider',
    supported: true
  }
}

/**
 * Multi-Wallet Provider
 * Manages wallet connections, switching, and state
 */
export default function MultiWalletProvider({ children }) {
  const [walletType, setWalletType] = useState(null)
  const [provider, setProvider] = useState(null)
  const [account, setAccount] = useState(null)
  const [chainId, setChainId] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState(null)
  const [walletConnectProvider, setWalletConnectProvider] = useState(null)

  // Detect if MetaMask is available
  const isMetaMaskInstalled = useCallback(() => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined'
  }, [])

  // Connect to MetaMask
  const connectMetaMask = useCallback(async () => {
    setIsConnecting(true)
    setError(null)
    try {
      if (!isMetaMaskInstalled()) {
        throw new Error('MetaMask is not installed. Please install it first.')
      }

      const ethProvider = new BrowserProvider(window.ethereum)
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      const network = await ethProvider.getNetwork()

      setProvider(ethProvider)
      setAccount(accounts[0])
      setChainId(Number(network.chainId))
      setWalletType(WALLET_TYPES.METAMASK)

      // Listen to account changes
      window.ethereum.on('accountsChanged', (newAccounts) => {
        if (newAccounts.length === 0) {
          disconnectWallet()
        } else {
          setAccount(newAccounts[0])
        }
      })

      // Listen to chain changes
      window.ethereum.on('chainChanged', (newChainId) => {
        setChainId(parseInt(newChainId, 16))
      })

      return { provider: ethProvider, account: accounts[0], chainId: Number(network.chainId) }
    } catch (err) {
      setError(err.message)
      console.error('MetaMask connection error:', err)
      throw err
    } finally {
      setIsConnecting(false)
    }
  }, [isMetaMaskInstalled])

  // Connect to WalletConnect
  const connectWalletConnect = useCallback(async () => {
    setIsConnecting(true)
    setError(null)
    try {
      const wcProvider = await EthereumProvider.init({
        projectId: process.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
        chains: [1, 11155111, 42161, 10], // Ethereum, Sepolia, Arbitrum, Optimism
        showQrModal: true
      })

      const accounts = await wcProvider.enable()
      const ethProvider = new BrowserProvider(wcProvider)
      const network = await ethProvider.getNetwork()

      setWalletConnectProvider(wcProvider)
      setProvider(ethProvider)
      setAccount(accounts[0])
      setChainId(Number(network.chainId))
      setWalletType(WALLET_TYPES.WALLET_CONNECT)

      // Listen to events
      wcProvider.on('accountsChanged', (newAccounts) => {
        if (newAccounts.length === 0) {
          disconnectWallet()
        } else {
          setAccount(newAccounts[0])
        }
      })

      wcProvider.on('chainChanged', (newChainId) => {
        setChainId(newChainId)
      })

      wcProvider.on('disconnect', () => {
        disconnectWallet()
      })

      return { provider: ethProvider, account: accounts[0], chainId: Number(network.chainId) }
    } catch (err) {
      setError(err.message)
      console.error('WalletConnect error:', err)
      throw err
    } finally {
      setIsConnecting(false)
    }
  }, [])

  // Connect via injected provider (generic)
  const connectInjected = useCallback(async () => {
    setIsConnecting(true)
    setError(null)
    try {
      if (!window.ethereum) {
        throw new Error('No injected wallet provider found. Please install a Web3 wallet.')
      }

      const ethProvider = new BrowserProvider(window.ethereum)
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      const network = await ethProvider.getNetwork()

      setProvider(ethProvider)
      setAccount(accounts[0])
      setChainId(Number(network.chainId))
      setWalletType(WALLET_TYPES.INJECTED)

      return { provider: ethProvider, account: accounts[0], chainId: Number(network.chainId) }
    } catch (err) {
      setError(err.message)
      console.error('Injected provider error:', err)
      throw err
    } finally {
      setIsConnecting(false)
    }
  }, [])

  // Disconnect wallet
  const disconnectWallet = useCallback(async () => {
    if (walletConnectProvider) {
      await walletConnectProvider.disconnect()
    }
    setProvider(null)
    setAccount(null)
    setChainId(null)
    setWalletType(null)
    setError(null)
    localStorage.removeItem('paytray_connected_wallet')
    localStorage.removeItem('paytray_wallet_type')
  }, [walletConnectProvider])

  // Switch chain
  const switchChain = useCallback(async (targetChainId) => {
    if (!provider) {
      throw new Error('No wallet connected')
    }

    try {
      if (window.ethereum) {
        const hexChainId = `0x${targetChainId.toString(16)}`
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: hexChainId }]
        })
      }
      setChainId(targetChainId)
    } catch (err) {
      if (err.code === 4902) {
        // Chain not added, try to add it
        throw new Error('Chain not supported. Please add it manually in your wallet.')
      }
      throw err
    }
  }, [provider])

  // Check if wallet is connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      const savedWalletType = localStorage.getItem('paytray_wallet_type')
      if (savedWalletType && window.ethereum) {
        try {
          const ethProvider = new BrowserProvider(window.ethereum)
          const accounts = await ethProvider.listAccounts()
          if (accounts.length > 0) {
            const network = await ethProvider.getNetwork()
            setProvider(ethProvider)
            setAccount(accounts[0].address)
            setChainId(Number(network.chainId))
            setWalletType(savedWalletType)
          }
        } catch (err) {
          console.error('Auto-connect failed:', err)
        }
      }
    }

    checkConnection()
  }, [])

  // Save wallet connection to localStorage
  useEffect(() => {
    if (walletType) {
      localStorage.setItem('paytray_wallet_type', walletType)
      localStorage.setItem('paytray_connected_wallet', account || '')
    }
  }, [walletType, account])

  const value = useMemo(
    () => ({
      // State
      walletType,
      provider,
      account,
      chainId,
      isConnecting,
      error,

      // Methods
      connectMetaMask,
      connectWalletConnect,
      connectInjected,
      disconnectWallet,
      switchChain,
      isMetaMaskInstalled,

      // Helpers
      isConnected: !!provider && !!account,
      isWalletConnectSupported: true
    }),
    [
      walletType,
      provider,
      account,
      chainId,
      isConnecting,
      error,
      connectMetaMask,
      connectWalletConnect,
      connectInjected,
      disconnectWallet,
      switchChain,
      isMetaMaskInstalled
    ]
  )

  return <MultiWalletContext.Provider value={value}>{children}</MultiWalletContext.Provider>
}

/**
 * Hook to use multi-wallet context
 */
export function useMultiWallet() {
  const context = useContext(MultiWalletContext)
  if (!context) {
    throw new Error('useMultiWallet must be used within MultiWalletProvider')
  }
  return context
}

/**
 * Hook to get wallet display info
 */
export function useWalletInfo() {
  const { walletType } = useMultiWallet()
  return WALLET_INFO[walletType] || null
}

/**
 * Hook to check if MetaMask is installed
 */
export function useIsMetaMaskInstalled() {
  const { isMetaMaskInstalled } = useMultiWallet()
  return isMetaMaskInstalled()
}
