import { useEffect, useState } from 'react'
import { useCeramic } from '../contexts/Ceramic'
import { useWeb3React } from '@web3-react/core'

export function useCeramicProfile() {
  const { saveProfile, getMyProfile } = useCeramic()
  const { account } = useWeb3React()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load user's own profile on mount and when account changes
  useEffect(() => {
    if (!account) {
      setProfile(null)
      return
    }

    try {
      const myProfile = getMyProfile()
      setProfile(myProfile)
    } catch (err) {
      console.error('Profile load error:', err)
      setError(err.message)
    }
  }, [account, getMyProfile])

  const updateProfile = async (profileData) => {
    try {
      setLoading(true)
      setError(null)
      const saved = await saveProfile(profileData)
      setProfile(saved)
      return saved
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { profile, loading, error, updateProfile }
}

// Hook to load any peer's profile by address
export function usePeerProfile(address) {
  const { getPeerProfile } = useCeramic()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!address) {
      setProfile(null)
      return
    }

    try {
      setLoading(true)
      const peerProfile = getPeerProfile(address)
      setProfile(peerProfile)
    } catch (err) {
      console.error('Peer profile load error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [address, getPeerProfile])

  return { profile, loading, error }
}

// Hook to query all peers in network
export function usePeerList() {
  const { getPeerList } = useCeramic()
  const [peers, setPeers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    try {
      setLoading(true)
      const allPeers = getPeerList()
      setPeers(allPeers)
    } catch (err) {
      console.error('Peer list load error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [getPeerList])

  return { peers, loading, error }
}
