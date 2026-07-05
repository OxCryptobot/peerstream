# Phase 3a: Ceramic Integration Implementation Guide

## Objective
Replace 3Box with Ceramic + IDX for peer identity and profile storage on the Discover page.

## Why Ceramic?
- ✅ Actively maintained and developed
- ✅ Decentralized identity (self-sovereign)
- ✅ InterOp with other dApps via Composites
- ✅ Network is live and stable
- ✅ Better developer experience than 3Box

## Current State
- **3Box Status**: Offline (dapp.3box.io down)
- **Discover Page**: Shows placeholder UI
- **Challenge**: Need identity system to retrieve peer profiles

## Phase 3a Implementation Plan

### Step 1: Install Dependencies
```bash
npm install --save @ceramicnetwork/3id-connect
npm install --save @ceramicnetwork/http-client
npm install --save @self.id/web
npm install --save @self.id/framework
npm install --save dids
npm install --save key-did-resolver
npm install --save key-did-provider-ed25519
```

### Step 2: Set Up Ceramic Context
Create: `src/contexts/Ceramic.jsx`

```jsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import { CeramicClient } from '@ceramicnetwork/http-client'
import ThreeIdConnect from '@ceramicnetwork/3id-connect'
import { EthereumAuthProvider } from '@self.id/web'
import { useWeb3React } from '@web3-react/core'

const CeramicContext = createContext(null)

export function CeramicProvider({ children }) {
  const { account, library } = useWeb3React()
  const [ceramic, setCeramic] = useState(null)
  const [did, setDid] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!account || !library) return

    const initializeCeramic = async () => {
      try {
        setLoading(true)
        setError(null)

        // Connect to Ceramic node
        const ceramicUrl = import.meta.env.VITE_CERAMIC_URL || 'http://localhost:7007'
        const ceramicClient = new CeramicClient(ceramicUrl)

        // Set up 3ID Connect for authentication
        const authProvider = new EthereumAuthProvider(library.provider, account)
        const threeIdConnect = new ThreeIdConnect()

        // Authenticate
        await threeIdConnect.connect(authProvider)

        // Get DID from authentication
        const authorizedDid = threeIdConnect.getDidProvider()
        ceramicClient.did = authorizedDid

        setCeramic(ceramicClient)
        setDid(authorizedDid)
      } catch (err) {
        console.error('Ceramic initialization error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    initializeCeramic()
  }, [account, library])

  return (
    <CeramicContext.Provider value={{ ceramic, did, loading, error }}>
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
```

### Step 3: Add Ceramic Provider to App Root
File: `src/index.jsx`

```jsx
import { CeramicProvider } from './contexts/Ceramic'

// In your ContextProviders component:
export function ContextProviders({ children }) {
  return (
    <Web3ReactProvider>
      <ApolloProvider client={client}>
        <ThemeProvider theme={theme}>
          <TokensProvider>
            <ApplicationProvider>
              <CeramicProvider>
                {children}
              </CeramicProvider>
            </ApplicationProvider>
          </TokensProvider>
        </ThemeProvider>
      </ApolloProvider>
    </Web3ReactProvider>
  )
}
```

### Step 4: Define Peer Profile Schema
Create: `src/schemas/peerProfile.js`

```javascript
// Ceramic Composite schema for peer profiles
export const PeerProfileSchema = {
  name: {
    type: 'string',
    maxLength: 100,
    description: 'Display name'
  },
  bio: {
    type: 'string',
    maxLength: 500,
    description: 'User bio/about'
  },
  expertise: {
    type: 'array',
    items: { type: 'string' },
    description: 'Areas of expertise'
  },
  hourlyRate: {
    type: 'number',
    description: 'Hourly rate in USD'
  },
  avatar: {
    type: 'string',
    description: 'Avatar image URL or IPFS hash'
  },
  social: {
    type: 'object',
    properties: {
      twitter: { type: 'string' },
      github: { type: 'string' },
      website: { type: 'string' }
    }
  },
  createdAt: {
    type: 'string',
    format: 'date-time',
    description: 'Profile creation timestamp'
  },
  verified: {
    type: 'boolean',
    description: 'Email verified flag'
  }
}

// Full Composite definition
export const PeerProfileComposite = {
  version: 1,
  models: {
    PeerProfile: {
      id: 'kjzl6cwe1jw14a7emlrk5c8c4pe7ydhnc8sykwack4jgsuyj5mzhgrgnjvg94oq',
      accountRelation: 'list',
      schema: PeerProfileSchema
    }
  }
}
```

### Step 5: Create Ceramic Hooks for Profile Operations
Create: `src/hooks/useCeramicProfile.js`

```javascript
import { useEffect, useState } from 'react'
import { useCeramic } from '../contexts/Ceramic'
import { useWeb3React } from '@web3-react/core'

export function useCeramicProfile() {
  const { ceramic, did } = useCeramic()
  const { account } = useWeb3React()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load user's own profile
  useEffect(() => {
    if (!ceramic || !did || !account) return

    const loadProfile = async () => {
      try {
        setLoading(true)
        // Query user's profile from Ceramic
        // This would use the Ceramic Client to load from the stream
        const streams = await ceramic.index.queryDocuments('PeerProfile', account)
        if (streams.length > 0) {
          setProfile(streams[0].content)
        }
      } catch (err) {
        console.error('Profile load error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [ceramic, did, account])

  const saveProfile = async (profileData) => {
    try {
      setLoading(true)
      // Create or update profile in Ceramic
      const doc = await ceramic.datastore.create('PeerProfile', profileData)
      setProfile(doc.content)
      return doc
    } catch (err) {
      console.error('Profile save error:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { profile, loading, error, saveProfile }
}

// Hook to load any peer's profile by address
export function usePeerProfile(address) {
  const { ceramic } = useCeramic()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!ceramic || !address) return

    const loadPeerProfile = async () => {
      try {
        setLoading(true)
        // Query peer's profile from Ceramic
        const streams = await ceramic.index.queryDocuments('PeerProfile', address)
        if (streams.length > 0) {
          setProfile(streams[0].content)
        }
      } catch (err) {
        console.error('Peer profile load error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadPeerProfile()
  }, [ceramic, address])

  return { profile, loading, error }
}

// Hook to query all peers in network
export function usePeerList() {
  const { ceramic } = useCeramic()
  const [peers, setPeers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!ceramic) return

    const loadPeers = async () => {
      try {
        setLoading(true)
        // Query all PeerProfile documents from Ceramic index
        const allProfiles = await ceramic.index.queryDocuments('PeerProfile')
        setPeers(allProfiles.map(doc => ({
          address: doc.author,
          ...doc.content
        })))
      } catch (err) {
        console.error('Peer list load error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadPeers()
  }, [ceramic])

  return { peers, loading, error }
}
```

### Step 6: Update Discover Page
File: `src/pages/Discover/index.jsx`

```jsx
import React from 'react'
import styled from 'styled-components'
import { usePeerList } from '../../hooks/useCeramicProfile'
import PeerCard from '../../components/PeerCard'

const DiscoverContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 2rem;
`

const Title = styled.h1`
  font-size: 2rem;
  color: ${({ theme }) => theme.primaryGreen};
  margin: 0;
`

const PeerGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`

const LoadingMessage = styled.p`
  font-size: 1.1rem;
  color: ${({ theme }) => theme.text};
`

const ErrorMessage = styled.div`
  background-color: #fee;
  border: 1px solid #faa;
  color: #a00;
  padding: 1rem;
  border-radius: 0.5rem;
`

export default function Discover() {
  const { peers, loading, error } = usePeerList()

  if (error) {
    return (
      <DiscoverContainer>
        <Title>Discover Experts</Title>
        <ErrorMessage>
          <strong>Error loading peers:</strong> {error}
        </ErrorMessage>
      </DiscoverContainer>
    )
  }

  return (
    <DiscoverContainer>
      <Title>Discover Experts</Title>
      
      {loading ? (
        <LoadingMessage>Loading peer profiles...</LoadingMessage>
      ) : peers.length === 0 ? (
        <LoadingMessage>
          No peers found yet. Be the first to create your profile!
        </LoadingMessage>
      ) : (
        <PeerGrid>
          {peers.map((peer) => (
            <PeerCard 
              key={peer.address}
              peer={peer}
            />
          ))}
        </PeerGrid>
      )}
    </DiscoverContainer>
  )
}
```

### Step 7: Update PeerCard Component
File: `src/components/PeerCard/index.jsx`

```jsx
import React from 'react'
import styled from 'styled-components'
import { useHistory } from 'react-router-dom'

const Card = styled.div`
  border: 1px solid ${({ theme }) => theme.secondaryGreen};
  border-radius: 0.5rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: ${({ theme }) => theme.primaryGreen};
  }
`

const Avatar = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.tertiaryGreen};
  margin-bottom: 1rem;
  object-fit: cover;
`

const Placeholder = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.tertiaryGreen};
  margin-bottom: 1rem;
`

const Name = styled.h3`
  margin: 0.5rem 0;
  font-size: 1.2rem;
  color: ${({ theme }) => theme.text};
`

const Bio = styled.p`
  color: ${({ theme }) => theme.subText};
  font-size: 0.9rem;
  margin: 0.5rem 0;
  line-height: 1.4;
`

const Expertise = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
`

const Tag = styled.span`
  background-color: ${({ theme }) => theme.tertiaryGreen};
  color: ${({ theme }) => theme.primaryGreen};
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
`

const Rate = styled.p`
  margin-top: 1rem;
  font-weight: bold;
  color: ${({ theme }) => theme.primaryGreen};
`

export default function PeerCard({ peer }) {
  const handleClick = () => {
    // Navigate to peer detail or initiate chat
    // router.push(`/peer/${peer.address}`)
  }

  return (
    <Card onClick={handleClick}>
      {peer.avatar ? (
        <Avatar src={peer.avatar} alt={peer.name} />
      ) : (
        <Placeholder />
      )}
      <Name>{peer.name || peer.address.slice(0, 6)}...</Name>
      {peer.bio && <Bio>{peer.bio}</Bio>}
      
      {peer.expertise && peer.expertise.length > 0 && (
        <Expertise>
          {peer.expertise.map((skill) => (
            <Tag key={skill}>{skill}</Tag>
          ))}
        </Expertise>
      )}
      
      {peer.hourlyRate && <Rate>${peer.hourlyRate}/hr</Rate>}
    </Card>
  )
}
```

## Testing & Validation

### Local Development Testing
1. Start Ceramic node:
   ```bash
   ceramic daemon
   ```

2. Run dev server:
   ```bash
   npm run dev
   ```

3. Test in browser:
   - Connect wallet
   - Navigate to Discover page
   - Should see loading indicator
   - Should show "No peers found" initially

### Initial Profile Creation
For testing, you may need to manually create initial profiles or seed test data in Ceramic.

### Debug Commands
```javascript
// In browser console
const { ceramic } = useCeramic()

// Check connection
console.log(ceramic)

// Query profiles
const profiles = await ceramic.index.queryDocuments('PeerProfile')
console.log(profiles)

// Create test profile
const testProfile = {
  name: 'Test Expert',
  bio: 'Blockchain specialist',
  expertise: ['Solidity', 'Web3'],
  hourlyRate: 100
}
const doc = await ceramic.datastore.create('PeerProfile', testProfile)
console.log(doc)
```

## Success Criteria ✅

- [ ] Ceramic context initializes without errors
- [ ] Wallet authentication with Ceramic succeeds
- [ ] Discover page loads and shows peer list
- [ ] Profiles display with name, bio, expertise
- [ ] Peer cards are interactive
- [ ] No console errors
- [ ] Production build includes all Ceramic deps

## Known Limitations & Next Steps

### Phase 3a Issues (May require workarounds)
1. **Ceramic indexing**: May not index all profiles immediately
   - Workaround: Implement IPFS pinning for durability
   
2. **Network latency**: Ceramic queries may be slow
   - Workaround: Add client-side caching with React Query
   
3. **Profile discoverability**: Need mechanism to surface new profiles
   - Workaround: Add registry contract or feed mechanism

### Phase 3b Follow-up Work
1. Add profile editing UI
2. Implement avatar uploads to IPFS
3. Add profile verification (email, social)
4. Implement peer search/filtering
5. Add rating/review system

---

## Resources
- Ceramic Docs: https://developers.ceramic.network/
- 3ID Connect: https://github.com/ceramicnetwork/3id-connect
- Self.ID Framework: https://docs.self.id/
- Composite Schemas: https://developers.ceramic.network/docs/advanced/composites/
