import { useState, useCallback, useEffect } from 'react'

// Supported networks configuration
export const SUPPORTED_NETWORKS = {
  1: {
    id: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    rpcUrl: process.env.VITE_ETHEREUM_RPC || 'https://eth.drpc.org',
    chainId: '0x1',
    color: '#627EEA',
    icon: '⟠',
    explorer: 'https://etherscan.io'
  },
  11155111: {
    id: 11155111,
    name: 'Sepolia',
    symbol: 'SEP',
    rpcUrl: process.env.VITE_SEPOLIA_RPC || 'https://rpc.sepolia.org',
    chainId: '0xaa36a7',
    color: '#627EEA',
    icon: '◇',
    explorer: 'https://sepolia.etherscan.io',
    isTestnet: true
  },
  42161: {
    id: 42161,
    name: 'Arbitrum',
    symbol: 'ARB',
    rpcUrl: process.env.VITE_ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc',
    chainId: '0xa4b1',
    color: '#1E40AF',
    icon: '▲',
    explorer: 'https://arbiscan.io'
  },
  10: {
    id: 10,
    name: 'Optimism',
    symbol: 'OP',
    rpcUrl: process.env.VITE_OPTIMISM_RPC || 'https://mainnet.optimism.io',
    chainId: '0xa',
    color: '#FF0420',
    icon: '◎',
    explorer: 'https://optimistic.etherscan.io'
  }
}

/**
 * useChain Hook
 * Manages blockchain network selection and switching
 */
export function useChain() {
  const storageKey = 'paytray_selected_chain'
  
  // Initialize from localStorage or default to Sepolia (testnet)
  const [chainId, setChainId] = useState(() => {
    if (typeof window === 'undefined') return 11155111
    const stored = localStorage.getItem(storageKey)
    return stored ? parseInt(stored, 10) : 11155111
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Get current chain config
  const currentChain = SUPPORTED_NETWORKS[chainId]

  // Save chain to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(storageKey, chainId.toString())
  }, [chainId])

  // Switch to a different chain
  const switchChain = useCallback(async (newChainId) => {
    if (!SUPPORTED_NETWORKS[newChainId]) {
      setError(`Unsupported chain: ${newChainId}`)
      return false
    }

    try {
      setIsLoading(true)
      setError(null)

      // If MetaMask or similar provider is available, request network switch
      if (window.ethereum) {
        const network = SUPPORTED_NETWORKS[newChainId]
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: network.chainId }]
          })
        } catch (switchError) {
          // Chain doesn't exist in wallet, try to add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: network.chainId,
                  chainName: network.name,
                  rpcUrls: [network.rpcUrl],
                  blockExplorerUrls: [network.explorer],
                  nativeCurrency: {
                    name: network.symbol,
                    symbol: network.symbol,
                    decimals: 18
                  }
                }
              ]
            })
          }
        }
      }

      setChainId(newChainId)
      return true
    } catch (err) {
      console.error('Failed to switch chain:', err)
      setError(err.message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Get all available networks
  const getAvailableNetworks = useCallback((includeTestnets = false) => {
    return Object.values(SUPPORTED_NETWORKS).filter(
      (network) => includeTestnets || !network.isTestnet
    )
  }, [])

  // Check if a chain is testnet
  const isTestnet = useCallback((checkChainId = chainId) => {
    return SUPPORTED_NETWORKS[checkChainId]?.isTestnet ?? false
  }, [chainId])

  return {
    chainId,
    currentChain,
    switchChain,
    isLoading,
    error,
    getAvailableNetworks,
    isTestnet,
    allNetworks: SUPPORTED_NETWORKS
  }
}

export default useChain
