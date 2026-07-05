import React, { createContext, useContext, useEffect, useState } from 'react'
import { useWeb3React } from '@web3-react/core'

const CeramicContext = createContext(null)

export function CeramicProvider({ children }) {
  const { account } = useWeb3React()
  const [profiles, setProfiles] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load all profiles from localStorage
  useEffect(() => {
    try {
      setLoading(true)
      const stored = localStorage.getItem('peerProfiles')
      if (stored) {
        setProfiles(JSON.parse(stored))
      }
    } catch (err) {
      console.error('Failed to load profiles:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Save profile for current user
  const saveProfile = async (profileData) => {
    if (!account) {
      throw new Error('Wallet not connected')
    }

    try {
      setLoading(true)
      const updatedProfiles = {
        ...profiles,
        [account.toLowerCase()]: {
          ...profileData,
          address: account.toLowerCase(),
          updatedAt: new Date().toISOString()
        }
      }
      setProfiles(updatedProfiles)
      localStorage.setItem('peerProfiles', JSON.stringify(updatedProfiles))
      return updatedProfiles[account.toLowerCase()]
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Get current user's profile
  const getMyProfile = () => {
    if (!account) return null
    return profiles[account.toLowerCase()] || null
  }

  // Get any peer's profile
  const getPeerProfile = (address) => {
    if (!address) return null
    return profiles[address.toLowerCase()] || null
  }

  // Get all peer profiles
  const getAllProfiles = () => {
    return Object.values(profiles)
  }

  // Get all peers except current user
  const getPeerList = () => {
    return Object.values(profiles).filter(
      p => p.address !== account?.toLowerCase()
    )
  }

  return (
    <CeramicContext.Provider
      value={{
        profiles,
        loading,
        error,
        saveProfile,
        getMyProfile,
        getPeerProfile,
        getAllProfiles,
        getPeerList
      }}
    >
      {children}
    </CeramicContext.Provider>
  )
}

export function useCeramic() {
  const context = useContext(CeramicContext)
  if (!context) {
    throw new Error('useCeramic must be used within CeramicProvider')
  }
  return context
}
