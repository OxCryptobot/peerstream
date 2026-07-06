/**
 * Ceramic Context Provider
 * Manages decentralized profile storage and discovery
 */

import React, { createContext, useState, useCallback, useEffect } from 'react'

export const CeramicContext = createContext()

export function CeramicProvider({ children }) {
  const [profiles, setProfiles] = useState(new Map())
  const [currentProfile, setCurrentProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchResults, setSearchResults] = useState([])
  const [experts, setExperts] = useState([])

  /**
   * Load profile from backend
   */
  const loadProfile = useCallback(async (wallet) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/profiles/${wallet}`)
      if (!response.ok) throw new Error('Failed to load profile')

      const data = await response.json()
      setProfiles((prev) => new Map(prev).set(wallet.toLowerCase(), data.profile))
      return data.profile
    } catch (err) {
      setError(err.message)
      console.error('Profile load error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Save profile to Ceramic (backend)
   */
  const saveProfile = useCallback(async (wallet, profileData) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/profiles/${wallet}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      })

      if (!response.ok) throw new Error('Failed to save profile')

      const data = await response.json()
      const profile = data.profile

      setProfiles((prev) => new Map(prev).set(wallet.toLowerCase(), profile))
      setCurrentProfile(profile)

      return profile
    } catch (err) {
      setError(err.message)
      console.error('Profile save error:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Delete profile
   */
  const deleteProfile = useCallback(async (wallet) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/profiles/${wallet}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete profile')

      setProfiles((prev) => {
        const updated = new Map(prev)
        updated.delete(wallet.toLowerCase())
        return updated
      })

      if (currentProfile?.wallet === wallet) {
        setCurrentProfile(null)
      }

      return true
    } catch (err) {
      setError(err.message)
      console.error('Profile delete error:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [currentProfile])

  /**
   * Search profiles by name or expertise
   */
  const searchProfiles = useCallback(async (query, filters = {}) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ q: query, ...filters })
      const response = await fetch(`/api/profiles/search?${params}`)

      if (!response.ok) throw new Error('Failed to search profiles')

      const data = await response.json()
      setSearchResults(data.results || [])

      return data.results || []
    } catch (err) {
      setError(err.message)
      console.error('Profile search error:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Get experts by expertise area
   */
  const getExperts = useCallback(async (expertise, limit = 20) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/profiles/experts/${expertise}?limit=${limit}`)

      if (!response.ok) throw new Error('Failed to get experts')

      const data = await response.json()
      setExperts(data.experts || [])

      return data.experts || []
    } catch (err) {
      setError(err.message)
      console.error('Get experts error:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Get trending profiles
   */
  const getTrendingProfiles = useCallback(async (limit = 10) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/profiles/trending?limit=${limit}`)

      if (!response.ok) throw new Error('Failed to get trending profiles')

      const data = await response.json()
      return data.profiles || []
    } catch (err) {
      setError(err.message)
      console.error('Get trending error:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Calculate profile completeness
   */
  const getProfileCompleteness = useCallback((profile) => {
    if (!profile) return 0

    const fields = [
      'displayName',
      'bio',
      'avatar',
      'expertise',
      'hourlyRate',
      'socialLinks'
    ]

    const filledFields = fields.filter((field) => {
      const value = profile[field]
      return value !== null && value !== undefined && value !== ''
    })

    return Math.round((filledFields.length / fields.length) * 100)
  }, [])

  /**
   * Format profile for display
   */
  const formatProfile = useCallback((profile) => {
    if (!profile) return null

    return {
      ...profile,
      completeness: getProfileCompleteness(profile),
      displayName: profile.displayName || 'Unnamed User',
      bio: profile.bio || '',
      expertise: profile.expertise || [],
      hourlyRate: profile.hourlyRate || 0,
      isExpert: profile.isExpert || false
    }
  }, [getProfileCompleteness])

  const value = {
    // State
    profiles,
    currentProfile,
    loading,
    error,
    searchResults,
    experts,

    // Methods
    loadProfile,
    saveProfile,
    deleteProfile,
    searchProfiles,
    getExperts,
    getTrendingProfiles,
    getProfileCompleteness,
    formatProfile
  }

  return (
    <CeramicContext.Provider value={value}>
      {children}
    </CeramicContext.Provider>
  )
}

/**
 * Hook to use Ceramic context
 */
export function useCeramic() {
  const context = React.useContext(CeramicContext)
  if (!context) {
    throw new Error('useCeramic must be used within CeramicProvider')
  }
  return context
}

export default CeramicProvider
